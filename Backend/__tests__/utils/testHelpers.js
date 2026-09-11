const request = require('supertest');
const User = require('../../src/models/User');
const Product = require('../../src/models/Product');
const Customer = require('../../src/models/Customer');
const bcrypt = require('bcrypt');

/**
 * Creates a test user and logs them in to return a bearer token.
 */
const getAuthToken = async (app, role = 'ADMIN') => {
  const email = `test_${role.toLowerCase()}@example.com`;
  const password = 'password123';

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: `Test ${role}`,
    email,
    passwordHash,
    role
  });

  const response = await request(app)
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  return {
    token: response.body.data.accessToken,
    user: response.body.data.user,
    dbUser: user
  };
};

/** Convenience wrappers */
const loginAsAdmin     = (app) => getAuthToken(app, 'ADMIN');
const loginAsSales     = (app) => getAuthToken(app, 'SALES');
const loginAsWarehouse = (app) => getAuthToken(app, 'WAREHOUSE');
const loginAsAccounts  = (app) => getAuthToken(app, 'ACCOUNTS');

/**
 * Creates a product directly via DB (admin role required for the model).
 * Accepts adminUserId from an existing admin user.
 */
const createProductInDb = async (adminUserId, overrides = {}) => {
  return Product.create({
    name: 'Test Product',
    sku: `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    unitPrice: 100,
    currentStock: 50,
    createdBy: adminUserId,
    ...overrides
  });
};

/**
 * Creates a customer directly via DB.
 */
const createCustomerInDb = async (adminUserId, overrides = {}) => {
  return Customer.create({
    name: 'Test Customer',
    mobile: '9999999999',
    type: 'RETAIL',
    createdBy: adminUserId,
    ...overrides
  });
};

module.exports = {
  getAuthToken,
  loginAsAdmin,
  loginAsSales,
  loginAsWarehouse,
  loginAsAccounts,
  createProductInDb,
  createCustomerInDb
};
