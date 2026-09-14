const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  alertType: { type: String, required: true }, // Revenue Drop, Out of Stock, Low Stock, High Return Rate, Low Conversion Rate
  title: { type: String, required: true },
  message: { type: String, required: true },
  severity: { type: String, enum: ['Critical', 'Warning', 'Info'], default: 'Warning' },
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
