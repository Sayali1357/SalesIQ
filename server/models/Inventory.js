const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  productName: { type: String },
  category: { type: String },
  price: { type: Number },
  currentStock: { type: Number, required: true, default: 0 },
  reorderLevel: { type: Number, required: true, default: 15 },
  predictedDailyDemand: { type: Number, default: 0 },
  estimatedCoverageDays: { type: Number, default: 0 },
  status: { type: String, enum: ['Healthy', 'Low Stock', 'Critical', 'Out of Stock'], default: 'Healthy' }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
