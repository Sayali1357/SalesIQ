const path = require('path');
const fs = require('fs');
const readline = require('readline');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Inventory = require('../models/Inventory');
const Alert = require('../models/Alert');

const seedDB = async (options = { disconnect: true }) => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/salesiq';
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('Connected to MongoDB for data seeding...');
    }

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Customer.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      OrderItem.deleteMany({}),
      Inventory.deleteMany({}),
      Alert.deleteMany({})
    ]);

    console.log('Cleared existing database records.');

    // 1. Create System Users
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const managerPassword = await bcrypt.hash('manager123', salt);

    await User.create([
      { name: 'System Admin', email: 'admin@salesiq.com', password: adminPassword, role: 'Admin' },
      { name: 'Sales Manager', email: 'manager@salesiq.com', password: managerPassword, role: 'Manager' }
    ]);
    console.log('Created Admin (admin@salesiq.com) and Manager (manager@salesiq.com) accounts.');

    // 2. Read CSV Dataset
    const csvPath = path.join(__dirname, '..', '..', 'data', 'ecommerce_sales.csv');
    if (fs.existsSync(csvPath)) {
      console.log('Seeding dataset from ecommerce_sales.csv...');
      const fileStream = fs.createReadStream(csvPath);
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

      let isHeader = true;
      let headers = [];

      const customerMap = new Map();
      const productMap = new Map();
      const orderDocs = [];
      const orderItemDocs = [];

      for await (const line of rl) {
        if (isHeader) {
          headers = line.split(',').map(h => h.trim());
          isHeader = false;
          continue;
        }

        const cols = line.split(',').map(c => c.trim());
        if (cols.length < headers.length) continue;

        const row = {};
        headers.forEach((h, idx) => {
          row[h] = cols[idx];
        });

        const customerId = row['customer_id'] || `CUST_${1000 + customerMap.size}`;
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            customerId,
            name: `Customer ${customerId}`,
            email: `${customerId.toLowerCase()}@example.com`,
            phone: `+91 ${Math.floor(7000000000 + Math.random() * 2999999999)}`,
            city: row['region'] || 'Mumbai',
            state: row['region'] || 'Maharashtra'
          });
        }

        const productId = row['product_id'] || `PROD_${100 + productMap.size}`;
        if (!productMap.has(productId)) {
          const price = parseFloat(row['price']) || 1500;
          productMap.set(productId, {
            productId,
            productName: `Product ${productId}`,
            category: row['category'] || 'Electronics',
            price,
            stockQuantity: Math.floor(Math.random() * 50 + 5),
            reorderLevel: 15
          });
        }

        const orderId = row['order_id'] || `ORD_${10000 + orderDocs.length}`;
        const totalAmount = parseFloat(row['total_amount']) || parseFloat(row['price']) || 1500;

        orderDocs.push({
          orderId,
          customerId,
          orderDate: row['order_date'] ? new Date(row['order_date']) : new Date(),
          channel: row['sales_channel'] || (orderDocs.length % 2 === 0 ? 'Online' : 'Store'),
          paymentMethod: row['payment_method'] || 'Credit Card',
          totalAmount,
          status: row['returned'] === 'True' || row['returned'] === 'true' ? 'Cancelled' : 'Completed',
          returned: row['returned'] === 'True' || row['returned'] === 'true',
          region: row['region'] || 'Maharashtra'
        });

        orderItemDocs.push({
          orderId,
          productId,
          quantity: parseInt(row['quantity']) || 1,
          unitPrice: parseFloat(row['price']) || 1500,
          discount: parseFloat(row['discount']) || 0,
          subtotal: totalAmount
        });

        if (orderDocs.length >= 1000) break; // Limit seed sample for speed
      }

      await Customer.insertMany(Array.from(customerMap.values()));
      await Product.insertMany(Array.from(productMap.values()));
      await Order.insertMany(orderDocs);
      await OrderItem.insertMany(orderItemDocs);

      // Create Inventory documents from products
      const inventoryDocs = Array.from(productMap.values()).map(p => {
        let status = 'Healthy';
        if (p.stockQuantity === 0) status = 'Out of Stock';
        else if (p.stockQuantity < 10) status = 'Critical';
        else if (p.stockQuantity < p.reorderLevel) status = 'Low Stock';

        const demand = Number((Math.random() * 5 + 1).toFixed(1));
        return {
          productId: p.productId,
          productName: p.productName,
          category: p.category,
          price: p.price,
          currentStock: p.stockQuantity,
          reorderLevel: p.reorderLevel,
          predictedDailyDemand: demand,
          estimatedCoverageDays: Number((p.stockQuantity / demand).toFixed(1)),
          status
        };
      });

      await Inventory.insertMany(inventoryDocs);
      console.log(`Seeded ${customerMap.size} customers, ${productMap.size} products, ${orderDocs.length} orders into MongoDB.`);
    }

    // 3. Create Default Business Alerts
    await Alert.create([
      {
        alertType: 'Out of Stock',
        title: 'Critical: Ergonomic Chair Out of Stock',
        message: 'Product PROD_004 stock level reached 0 units. Reorder immediately!',
        severity: 'Critical',
        resolved: false
      },
      {
        alertType: 'Low Stock',
        title: 'Low Stock Warning: Pro Laptop Ultra',
        message: 'Product PROD_001 stock (8 units) is below reorder threshold (15 units).',
        severity: 'Warning',
        resolved: false
      },
      {
        alertType: 'Revenue Drop',
        title: 'Significant Revenue Drop Detected',
        message: 'Daily revenue dropped by 26.2% compared to previous 7-day average.',
        severity: 'Critical',
        resolved: false
      }
    ]);

    console.log('Seeding complete successfully!');
    if (options.disconnect) {
      process.exit(0);
    }
  } catch (err) {
    console.error('Data Seeding Error:', err.message);
    if (options.disconnect) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedDB();
}

module.exports = seedDB;
