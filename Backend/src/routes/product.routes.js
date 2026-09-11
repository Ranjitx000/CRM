const express = require('express');
const { z } = require('zod');
const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const validate = require('../middlewares/validate.middleware');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().optional(),
  unitPrice: z.number().positive(),
  minStockAlert: z.number().min(0).optional(),
  warehouseLocation: z.string().optional(),
}).strict();

const productUpdateSchema = productSchema.partial();

// Require auth
router.use(authMiddleware);

router.get('/', asyncHandler(async (req, res) => {
  const { search, category, lowStock, page = 1, limit = 20 } = req.query;
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } }
    ];
  }
  if (category) query.category = category;
  if (lowStock === 'true') {
    query.$expr = { $lte: ['$currentStock', '$minStockAlert'] };
  }

  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 100);

  const [data, total] = await Promise.all([
    Product.find(query).skip((pageNum - 1) * limitNum).limit(limitNum).sort({ name: 1 }),
    Product.countDocuments(query)
  ]);

  res.json({
    data,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
  });
}));

router.post('/', requireRole(['ADMIN', 'WAREHOUSE']), validate(productSchema), asyncHandler(async (req, res) => {
  const product = new Product({ ...req.body, createdBy: req.user.id });
  await product.save();
  res.status(201).json({ data: product });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ statusCode: 404, message: 'Product not found', error: 'NotFound', details: [] });
  }
  res.json({ data: product });
}));

router.patch('/:id', requireRole(['ADMIN', 'WAREHOUSE']), validate(productUpdateSchema), asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) {
    return res.status(404).json({ statusCode: 404, message: 'Product not found', error: 'NotFound', details: [] });
  }
  res.json({ data: product });
}));

router.get('/:id/stock-movements', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ statusCode: 404, message: 'Product not found', error: 'NotFound', details: [] });
  }

  const data = await StockMovement.find({ productId: req.params.id }).sort({ createdAt: -1 });
  res.json({ data });
}));

module.exports = router;
