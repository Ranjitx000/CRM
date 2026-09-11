const Counter = require('../models/Counter');

async function getNextChallanNumber() {
  const year = new Date().getFullYear();
  const counter = await Counter.findByIdAndUpdate(
    `challan-${year}`,
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return `CH-${year}-${String(counter.seq).padStart(6, '0')}`;
}

module.exports = {
  getNextChallanNumber
};
