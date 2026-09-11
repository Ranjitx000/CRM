const mongoose = require('mongoose');
const { Schema } = mongoose;

const customerNoteSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  note: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('CustomerNote', customerNoteSchema);
