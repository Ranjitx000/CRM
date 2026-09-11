const mongoose = require('mongoose');
const { Schema } = mongoose;

const challanItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productNameSnapshot: { type: String, required: true },
  productSkuSnapshot: { type: String, required: true },
  unitPriceSnapshot: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const challanSchema = new Schema({
  challanNumber: { type: String, required: true, unique: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  status: { type: String, enum: ['DRAFT', 'CONFIRMED', 'CANCELLED'], default: 'DRAFT', index: true },
  items: { type: [challanItemSchema], required: true },
  totalQuantity: { type: Number, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  confirmedAt: Date,
  cancelledAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Challan', challanSchema);
