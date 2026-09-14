const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  productName: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Electronics', 'Clothing', 'Grocery', 'Furniture', 'Beauty', 'Sports', 'Books', 'Home Appliances', 'Home', 'Fashion', 'Toys'],
    default: 'Electronics' 
  },
  price: { type: Number, required: true },
  stockQuantity: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 15 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
