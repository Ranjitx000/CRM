const mongoose = require('mongoose');
const { Schema } = mongoose;

const stockMovementSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  quantity: { type: Number, required: true, min: 1 },
  type: { type: String, enum: ['IN', 'OUT'], required: true },
  reason: { type: String, required: true },
  referenceType: String,
  referenceId: Schema.Types.ObjectId,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
