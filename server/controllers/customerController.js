const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { getCustomerSegments } = require('../services/mlService');

// Get Customer Segmentation via Python ML Service
const getSegments = async (req, res) => {
  try {
    const { nClusters = 4 } = req.body.nClusters ? req.body : req.query;
    const segmentationData = await getCustomerSegments(parseInt(nClusters));
    res.json(segmentationData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Customers List
const getCustomers = async (req, res) => {
  try {
    const { search = '', limit = 50, page = 1 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Customer Details & Purchase History
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerId: req.params.id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const orders = await Order.find({ customerId: req.params.id }).sort({ orderDate: -1 });

    res.json({
      customer,
      orders,
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, o) => sum + o.totalAmount, 0)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSegments,
  getCustomers,
  getCustomerById
};
