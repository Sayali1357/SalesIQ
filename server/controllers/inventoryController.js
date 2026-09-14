const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const { getInventoryDemand } = require('../services/mlService');

// Get Inventory Overview & Items
const getInventory = async (req, res) => {
  try {
    const items = await Inventory.find().sort({ currentStock: 1 });

    if (!items || items.length === 0) {
      // Fallback synthetic inventory list if DB is initializing
      const mlResult = await getInventoryDemand();
      if (mlResult) {
        return res.json(mlResult);
      }
    }

    const summary = {
      totalProducts: items.length,
      healthyStock: items.filter(i => i.status === 'Healthy').length,
      lowStock: items.filter(i => i.status === 'Low Stock').length,
      criticalStock: items.filter(i => i.status === 'Critical').length,
      outOfStock: items.filter(i => i.status === 'Out of Stock').length
    };

    res.json({
      summary,
      items
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Low Stock Items
const getLowStock = async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({ status: { $in: ['Low Stock', 'Critical'] } });
    res.json(lowStockItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Out of Stock Items
const getOutOfStock = async (req, res) => {
  try {
    const outOfStockItems = await Inventory.find({ status: 'Out of Stock' });
    res.json(outOfStockItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Predict Daily Demand & Update Inventory Coverage Days
const predictDemand = async (req, res) => {
  try {
    const dbItems = await Inventory.find();
    let productList = [];

    if (dbItems && dbItems.length > 0) {
      productList = dbItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        category: item.category,
        price: item.price,
        currentStock: item.currentStock,
        reorderLevel: item.reorderLevel,
        historicalDailyAvg: item.predictedDailyDemand || 4.2
      }));
    }

    const mlDemandResult = await getInventoryDemand(productList);

    // Save/update inventory documents in MongoDB with updated coverage days & status
    if (mlDemandResult && mlDemandResult.items) {
      for (const item of mlDemandResult.items) {
        try {
          await Inventory.findOneAndUpdate(
            { productId: item.productId },
            {
              predictedDailyDemand: item.predictedDailyDemand,
              estimatedCoverageDays: item.estimatedCoverageDays,
              status: item.status
            },
            { upsert: true }
          );
        } catch (updateErr) {
          console.warn('[Inventory] Update error:', updateErr.message);
        }
      }
    }

    res.json(mlDemandResult);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInventory,
  getLowStock,
  getOutOfStock,
  predictDemand
};
