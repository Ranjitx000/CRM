const mongoose = require('mongoose');
const Challan = require('../models/Challan');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');

async function confirmChallan(challanId, userId) {
  let result;
  const challan = await Challan.findById(challanId);
  if (!challan) throw { statusCode: 404, message: 'Challan not found', name: 'NotFound' };
  if (challan.status !== 'DRAFT') throw { statusCode: 409, message: 'Only draft challans can be confirmed', name: 'Conflict' };

  for (const item of challan.items) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.productId, currentStock: { $gte: item.quantity } },
      { $inc: { currentStock: -item.quantity } },
      { new: true }
    );
    
    if (!updated) {
      throw { statusCode: 400, message: `Insufficient stock for SKU ${item.productSkuSnapshot}`, name: 'BadRequest' };
    }
    
    const movement = new StockMovement({
      productId: item.productId,
      quantity: item.quantity,
      type: 'OUT',
      reason: 'Sales Challan',
      referenceType: 'challan',
      referenceId: challan._id,
      createdBy: userId,
    });
    await movement.save();
  }

  challan.status = 'CONFIRMED';
  challan.confirmedAt = new Date();
  await challan.save();
  result = challan;
  
  return result;
}

async function cancelChallan(challanId, userId) {
  let result;
  const challan = await Challan.findById(challanId);
  if (!challan) throw { statusCode: 404, message: 'Challan not found', name: 'NotFound' };
  if (challan.status === 'CANCELLED') throw { statusCode: 409, message: 'Challan is already cancelled', name: 'Conflict' };

  if (challan.status === 'CONFIRMED') {
    // Reverse stock
    for (const item of challan.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { currentStock: item.quantity } }
      );
      
      const movement = new StockMovement({
        productId: item.productId,
        quantity: item.quantity,
        type: 'IN',
        reason: 'Challan Cancelled',
        referenceType: 'challan-cancel',
        referenceId: challan._id,
        createdBy: userId,
      });
      await movement.save();
    }
  }

  challan.status = 'CANCELLED';
  challan.cancelledAt = new Date();
  await challan.save();
  result = challan;
  
  return result;
}

module.exports = {
  confirmChallan,
  cancelChallan
};
