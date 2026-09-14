const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  orderDate: { type: Date, required: true },
  channel: { type: String, enum: ['Online', 'Store', 'Mobile App', 'Marketplace'], default: 'Online' },
  paymentMethod: { type: String, default: 'Credit Card' },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Completed', 'Pending', 'Cancelled'], default: 'Completed' },
  returned: { type: Boolean, default: false },
  region: { type: String, default: 'Maharashtra' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
