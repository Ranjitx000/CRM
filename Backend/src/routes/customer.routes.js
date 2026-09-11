const express = require('express');
const { z } = require('zod');
const asyncHandler = require('express-async-handler');
const Customer = require('../models/Customer');
const CustomerNote = require('../models/CustomerNote');
const validate = require('../middlewares/validate.middleware');
const { authMiddleware, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();

const customerSchema = z.object({
  name: z.string().min(1),
  mobile: z.string().regex(/^\d{10,15}$/, 'Invalid mobile number'),
  email: z.string().email().optional(),
  businessName: z.string().optional(),
  gstNumber: z.string().optional(),
  type: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().optional(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
  followUpDate: z.string().datetime().optional()
}).strict();

const customerUpdateSchema = customerSchema.partial();

const noteSchema = z.object({
  note: z.string().min(1)
}).strict();

// Require auth for all customer routes
router.use(authMiddleware);

router.get('/', asyncHandler(async (req, res) => {
  const { search, status, type, page = 1, limit = 20 } = req.query;
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
      { businessName: { $regex: search, $options: 'i' } }
    ];
  }
  if (status) query.status = status;
  if (type) query.type = type;

  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 100);

  const [data, total] = await Promise.all([
    Customer.find(query).skip((pageNum - 1) * limitNum).limit(limitNum).sort({ createdAt: -1 }),
    Customer.countDocuments(query)
  ]);

  res.json({
    data,
    meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
  });
}));

router.post('/', requireRole(['ADMIN', 'SALES']), validate(customerSchema), asyncHandler(async (req, res) => {
  const customer = new Customer({ ...req.body, createdBy: req.user.id });
  await customer.save();
  res.status(201).json({ data: customer });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return res.status(404).json({ statusCode: 404, message: 'Customer not found', error: 'NotFound', details: [] });
  }
  res.json({ data: customer });
}));

router.patch('/:id', requireRole(['ADMIN', 'SALES']), validate(customerUpdateSchema), asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!customer) {
    return res.status(404).json({ statusCode: 404, message: 'Customer not found', error: 'NotFound', details: [] });
  }
  res.json({ data: customer });
}));

router.get('/:id/notes', asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return res.status(404).json({ statusCode: 404, message: 'Customer not found', error: 'NotFound', details: [] });
  }
  const notes = await CustomerNote.find({ customerId: req.params.id })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email');
  res.json({ data: notes });
}));

router.post('/:id/notes', requireRole(['ADMIN', 'SALES']), validate(noteSchema), asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return res.status(404).json({ statusCode: 404, message: 'Customer not found', error: 'NotFound', details: [] });
  }
  const note = new CustomerNote({
    customerId: req.params.id,
    note: req.body.note,
    createdBy: req.user.id
  });
  await note.save();
  res.status(201).json({ data: note });
}));

module.exports = router;
