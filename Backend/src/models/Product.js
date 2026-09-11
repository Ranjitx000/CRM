const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true, index: true },
  category: String,
  unitPrice: { type: Number, required: true, min: 0 },
  currentStock: { type: Number, required: true, default: 0, min: 0 },
  minStockAlert: { type: Number, default: 0 },
  warehouseLocation: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
