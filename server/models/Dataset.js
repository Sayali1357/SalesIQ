const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['ecommerce_sales', 'daily_sales_features', 'customer_segments']
  },
  originalFileName: {
    type: String,
    required: true
  },
  rowCount: {
    type: Number,
    default: 0
  },
  columns: [{
    type: String
  }],
  fileSize: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: String,
    default: 'Admin'
  },
  status: {
    type: String,
    enum: ['active', 'processing', 'error'],
    default: 'active'
  },
  lastRetrained: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Dataset', datasetSchema);
