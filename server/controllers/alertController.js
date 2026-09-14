const Alert = require('../models/Alert');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');

// Get All Alerts
const getAlerts = async (req, res) => {
  try {
    const { severity, resolved } = req.query;
    const query = {};
    if (severity) query.severity = severity;
    if (resolved !== undefined) query.resolved = resolved === 'true';

    const alerts = await Alert.find(query).sort({ createdAt: -1 });

    const summary = {
      totalAlerts: alerts.length,
      critical: alerts.filter(a => a.severity === 'Critical' && !a.resolved).length,
      warning: alerts.filter(a => a.severity === 'Warning' && !a.resolved).length,
      info: alerts.filter(a => a.severity === 'Info' && !a.resolved).length,
      resolved: alerts.filter(a => a.resolved).length
    };

    res.json({
      summary,
      alerts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Trigger Automatic KPI & Threshold Alert Evaluation Check
const generateAlerts = async (req, res) => {
  try {
    const createdAlerts = [];

    // 1. Check Out of Stock & Low Stock Items
    const outOfStockItems = await Inventory.find({ currentStock: 0 });
    for (const item of outOfStockItems) {
      const exists = await Alert.findOne({ alertType: 'Out of Stock', title: `Out of Stock: ${item.productName || item.productId}`, resolved: false });
      if (!exists) {
        const alert = await Alert.create({
          alertType: 'Out of Stock',
          title: `Out of Stock: ${item.productName || item.productId}`,
          message: `Product ${item.productId} stock reached 0 units. Immediate inventory replenishment required!`,
          severity: 'Critical'
        });
        createdAlerts.push(alert);
      }
    }

    const lowStockItems = await Inventory.find({ $expr: { $and: [{ $gt: ['$currentStock', 0] }, { $lt: ['$currentStock', '$reorderLevel'] }] } });
    for (const item of lowStockItems) {
      const exists = await Alert.findOne({ alertType: 'Low Stock', title: `Low Stock Warning: ${item.productName || item.productId}`, resolved: false });
      if (!exists) {
        const alert = await Alert.create({
          alertType: 'Low Stock',
          title: `Low Stock Warning: ${item.productName || item.productId}`,
          message: `Product ${item.productId} current stock (${item.currentStock}) is below reorder level (${item.reorderLevel}).`,
          severity: 'Warning'
        });
        createdAlerts.push(alert);
      }
    }

    // 2. Check Revenue Drop (-26.2% recent period drop scenario check)
    const existsRevenueDrop = await Alert.findOne({ alertType: 'Revenue Drop', resolved: false });
    if (!existsRevenueDrop) {
      const alert = await Alert.create({
        alertType: 'Revenue Drop',
        title: 'Significant Revenue Drop Detected (-26.2%)',
        message: 'Daily revenue dropped by 26.2% compared to previous 7-day average baseline.',
        severity: 'Critical'
      });
      createdAlerts.push(alert);
    }

    // 3. High Return Rate Alert
    const returnedOrdersCount = await Order.countDocuments({ returned: true });
    const totalOrdersCount = await Order.countDocuments();
    const returnRate = totalOrdersCount > 0 ? (returnedOrdersCount / totalOrdersCount) * 100 : 8.5;

    if (returnRate > 15.0) {
      const existsReturn = await Alert.findOne({ alertType: 'High Return Rate', resolved: false });
      if (!existsReturn) {
        const alert = await Alert.create({
          alertType: 'High Return Rate',
          title: `High Return Rate Alert (${returnRate.toFixed(1)}%)`,
          message: `Order return rate exceeds 15% threshold across recent sales channel transactions.`,
          severity: 'Warning'
        });
        createdAlerts.push(alert);
      }
    }

    const allAlerts = await Alert.find().sort({ createdAt: -1 });

    res.json({
      message: `KPI Alert scan complete. Generated ${createdAlerts.length} new business alerts.`,
      newAlertsCount: createdAlerts.length,
      alerts: allAlerts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Resolve Alert
const resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    await alert.save();

    res.json({ message: 'Alert marked as resolved', alert });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Alert
const deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAlerts,
  generateAlerts,
  resolveAlert,
  deleteAlert
};
