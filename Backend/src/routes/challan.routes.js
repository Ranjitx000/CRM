const express = require('express');
const mongoose = require('mongoose');
const { z } = require('zod');
const asyncHandler = require('express-async-handler');
const Challan = require('../models/Challan');
const Product = require('../models/Product');
const { confirmChallan, cancelChallan } = require('../services/challan.service');
const { getNextChallanNumber } = require('../utils/counter');
const validate = require('../middlewares/validate.middleware');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();

const challanItemSchema = z.object({
  productId: z.string().refine(val => mongoose.Types.ObjectId.isValid(val), "Invalid ObjectId"),
  quantity: z.number().int().min(1)
}).strict();

const challanSchema = z.object({
  customerId: z.string().refine(val => mongoose.Types.ObjectId.isValid(val), "Invalid ObjectId"),
  items: z.array(challanItemSchema).min(1)
}).strict();

router.use(authMiddleware);

router.post('/', requireRole(['ADMIN', 'SALES']), validate(challanSchema), asyncHandler(async (req, res) => {
  const { customerId, items } = req.body;
  
  const populatedItems = [];
  let totalQuantity = 0;
  
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({ statusCode: 404, message: `Product ${item.productId} not found`, error: 'NotFound', details: [] });
    }
    
    populatedItems.push({
      productId: product._id,
      productNameSnapshot: product.name,
      productSkuSnapshot: product.sku,
      unitPriceSnapshot: product.unitPrice,
      quantity: item.quantity
    });
    totalQuantity += item.quantity;
  }
  
  const challanNumber = await getNextChallanNumber();
  
  const challan = new Challan({
    challanNumber,
    customerId,
    items: populatedItems,
    totalQuantity,
    createdBy: req.user.id
  });
  
  await challan.save();
  res.status(201).json({ data: challan });
}));

router.get('/', asyncHandler(async (req, res) => {
  const { status, customerId, page = 1, limit = 20 } = req.query;
  const query = {};
  
  if (status) query.status = status;
  if (customerId) query.customerId = customerId;

  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 100);

  const [data, total] = await Promise.all([
    Challan.find(query).skip((pageNum - 1) * limitNum).limit(limitNum).sort({ createdAt: -1 }),
    Challan.countDocuments(query)
  ]);

  res.json({
    data,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const challan = await Challan.findById(req.params.id);
  if (!challan) {
    return res.status(404).json({ statusCode: 404, message: 'Challan not found', error: 'NotFound', details: [] });
  }
  res.json({ data: challan });
}));

router.patch('/:id', requireRole(['ADMIN', 'SALES']), validate(z.object({ items: z.array(challanItemSchema).min(1) }).strict()), asyncHandler(async (req, res) => {
  const challan = await Challan.findById(req.params.id);
  if (!challan) {
    return res.status(404).json({ statusCode: 404, message: 'Challan not found', error: 'NotFound', details: [] });
  }
  
  if (challan.status !== 'DRAFT') {
    return res.status(409).json({ statusCode: 409, message: 'Only draft challans can be edited', error: 'Conflict', details: [] });
  }
  
  if (req.user.role === 'SALES' && challan.createdBy.toString() !== req.user.id) {
    return res.status(403).json({ statusCode: 403, message: 'Forbidden: You can only edit your own drafts', error: 'Forbidden', details: [] });
  }
  
  const items = req.body.items;
  const populatedItems = [];
  let totalQuantity = 0;
  
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({ statusCode: 404, message: `Product ${item.productId} not found`, error: 'NotFound', details: [] });
    }
    populatedItems.push({
      productId: product._id,
      productNameSnapshot: product.name,
      productSkuSnapshot: product.sku,
      unitPriceSnapshot: product.unitPrice,
      quantity: item.quantity
    });
    totalQuantity += item.quantity;
  }
  
  challan.items = populatedItems;
  challan.totalQuantity = totalQuantity;
  await challan.save();
  
  res.json({ data: challan });
}));

router.post('/:id/confirm', requireRole(['ADMIN', 'WAREHOUSE']), asyncHandler(async (req, res) => {
  const result = await confirmChallan(req.params.id, req.user.id);
  res.json({ data: result });
}));

router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const challan = await Challan.findById(req.params.id);
  if (!challan) {
    return res.status(404).json({ statusCode: 404, message: 'Challan not found', error: 'NotFound', details: [] });
  }

  // Admin and Warehouse can cancel any. Sales can only cancel their own drafts.
  if (req.user.role === 'SALES') {
    if (challan.status !== 'DRAFT' || challan.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ statusCode: 403, message: 'Forbidden: Sales can only cancel their own drafts', error: 'Forbidden', details: [] });
    }
  } else if (!['ADMIN', 'WAREHOUSE'].includes(req.user.role)) {
    return res.status(403).json({ statusCode: 403, message: 'Forbidden: Insufficient permissions', error: 'Forbidden', details: [] });
  }

  const result = await cancelChallan(req.params.id, req.user.id);
  res.json({ data: result });
}));

module.exports = router;
