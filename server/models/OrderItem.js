const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  productId: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  subtotal: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('OrderItem', orderItemSchema);
