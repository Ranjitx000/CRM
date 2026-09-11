const mongoose = require('mongoose');
const { Schema } = mongoose;

const customerSchema = new Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, index: true },
  email: String,
  businessName: String,
  gstNumber: String,
  type: { type: String, enum: ['RETAIL', 'WHOLESALE', 'DISTRIBUTOR'], required: true },
  address: String,
  status: { type: String, enum: ['LEAD', 'ACTIVE', 'INACTIVE'], default: 'LEAD', index: true },
  followUpDate: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
