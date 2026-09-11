const express = require('express');
const mongoose = require('mongoose');
const { z } = require('zod');
const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const validate = require('../middlewares/validate.middleware');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();

const stockMovementSchema = z.object({
  productId: z.string().refine(val => mongoose.Types.ObjectId.isValid(val), "Invalid ObjectId"),
  quantity: z.number().int().min(1),
  type: z.enum(['IN', 'OUT']),
  reason: z.string().min(1)
}).strict();

router.use(authMiddleware);
router.use(requireRole(['ADMIN', 'WAREHOUSE']));

router.post('/', validate(stockMovementSchema), asyncHandler(async (req, res) => {
  const product = await Product.findById(req.body.productId);
  if (!product) {
    return res.status(404).json({ statusCode: 404, message: 'Product not found', error: 'NotFound', details: [] });
  }

  if (req.body.type === 'OUT' && product.currentStock < req.body.quantity) {
    return res.status(400).json({ statusCode: 400, message: 'Insufficient stock', error: 'BadRequest', details: [] });
  }

  const incValue = req.body.type === 'IN' ? req.body.quantity : -req.body.quantity;
  
  const updatedProduct = await Product.findOneAndUpdate(
    { _id: req.body.productId, ...(req.body.type === 'OUT' && { currentStock: { $gte: req.body.quantity } }) },
    { $inc: { currentStock: incValue } },
    { new: true }
  );

  if (!updatedProduct) {
    return res.status(400).json({ statusCode: 400, message: 'Failed to update stock. Concurrent modification detected.', error: 'Conflict', details: [] });
  }

  const movement = new StockMovement({
    ...req.body,
    createdBy: req.user.id
  });
  await movement.save();
  
  res.status(201).json({ data: movement });
}));

module.exports = router;
