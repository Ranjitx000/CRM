const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const errorMiddleware = require('./middlewares/error.middleware');

const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const productRoutes = require('./routes/product.routes');
const stockMovementRoutes = require('./routes/stockMovement.routes');
const challanRoutes = require('./routes/challan.routes');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Rate limiting for auth routes (bypassed in dev mode)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  skip: () => process.env.NODE_ENV !== 'production',
  message: 'Too many requests from this IP, please try again later.'
});

// Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/customers', customerRoutes);
app.use('/products', productRoutes);
app.use('/stock-movements', stockMovementRoutes);
app.use('/challans', challanRoutes);

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;
