/**
 * stockMovement.test.js — Expanded Stock Movement E2E tests
 * Covers: IN/OUT, movement fields, insufficient stock, negative stock protection,
 *         invalid type/quantity, RBAC, history retrieval, DB state.
 */
const request = require('supertest');
const app = require('../../src/app');
const db = require('../utils/db');
const Product = require('../../src/models/Product');
const StockMovement = require('../../src/models/StockMovement');
const {
  loginAsAdmin,
  loginAsSales,
  loginAsWarehouse,
  loginAsAccounts
} = require('../utils/testHelpers');

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function createProduct(token, overrides = {}) {
  const res = await request(app)
    .post('/products')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Wheat Flour 10kg',
      sku: `WF-10-${Date.now()}`,
      unitPrice: 350,
      ...overrides
    })
    .expect(201);
  return res.body.data;
}

async function setStock(productId, stock) {
  await Product.findByIdAndUpdate(productId, { currentStock: stock });
}

// ─── POST /stock-movements — Stock IN ─────────────────────────────────────────
describe('POST /stock-movements — Stock IN', () => {
  let adminToken;
  let productId;

  beforeEach(async () => {
    ({ token: adminToken } = await loginAsAdmin(app));
    const p = await createProduct(adminToken);
    productId = p._id;
  });

  it('creates a stock IN movement and returns 201 with movement fields', async () => {
    const res = await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, quantity: 100, type: 'IN', reason: 'New shipment received' })
      .expect(201);

    const { data } = res.body;
    expect(data.type).toBe('IN');
    expect(data.quantity).toBe(100);
    expect(data.reason).toBe('New shipment received');
    expect(data.productId).toBe(productId);
    expect(data.createdBy).toBeDefined();
    expect(data.createdAt).toBeDefined();
  });

  it('updates the product currentStock correctly after IN', async () => {
    await setStock(productId, 20);

    await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, quantity: 30, type: 'IN', reason: 'Restock' })
      .expect(201);

    const product = await Product.findById(productId);
    expect(product.currentStock).toBe(50); // 20 + 30
  });

  it('persists the StockMovement document in the database', async () => {
    await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, quantity: 50, type: 'IN', reason: 'DB check' })
      .expect(201);

    const movement = await StockMovement.findOne({ productId });
    expect(movement).not.toBeNull();
    expect(movement.type).toBe('IN');
    expect(movement.quantity).toBe(50);
    expect(movement.createdBy).toBeDefined();
  });
});

// ─── POST /stock-movements — Stock OUT ────────────────────────────────────────
describe('POST /stock-movements — Stock OUT', () => {
  let adminToken;
  let productId;

  beforeEach(async () => {
    ({ token: adminToken } = await loginAsAdmin(app));
    const p = await createProduct(adminToken);
    productId = p._id;
    await setStock(productId, 100);
  });

  it('creates a stock OUT movement and returns 201', async () => {
    const res = await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, quantity: 25, type: 'OUT', reason: 'Manual dispatch' })
      .expect(201);

    expect(res.body.data.type).toBe('OUT');
    expect(res.body.data.quantity).toBe(25);
  });

  it('reduces the product stock correctly after OUT', async () => {
    await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, quantity: 40, type: 'OUT', reason: 'Sales order' })
      .expect(201);

    const product = await Product.findById(productId);
    expect(product.currentStock).toBe(60); // 100 - 40
  });

  it('prevents stock going below zero — returns 400 on insufficient stock', async () => {
    await setStock(productId, 10);

    const res = await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, quantity: 20, type: 'OUT', reason: 'Exceeds stock' })
      .expect(400);

    expect(res.body.statusCode).toBe(400);

    // Verify stock is still 10 — never went negative
    const product = await Product.findById(productId);
    expect(product.currentStock).toBe(10);
  });

  it('stock never becomes negative', async () => {
    await setStock(productId, 5);

    await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, quantity: 100, type: 'OUT', reason: 'Oversell attempt' })
      .expect(400);

    const product = await Product.findById(productId);
    expect(product.currentStock).toBeGreaterThanOrEqual(0);
  });
});

// ─── Validation errors ────────────────────────────────────────────────────────
describe('POST /stock-movements — Validation', () => {
  let adminToken;
  let productId;

  beforeEach(async () => {
    ({ token: adminToken } = await loginAsAdmin(app));
    const p = await createProduct(adminToken);
    productId = p._id;
  });

  it('returns 400 for invalid movement type', async () => {
    const res = await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, quantity: 10, type: 'TRANSFER', reason: 'Invalid type' })
      .expect(400);

    expect(res.body.error).toBe('BadRequest');
  });

  it('returns 400 when quantity is zero', async () => {
    const res = await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, quantity: 0, type: 'IN', reason: 'Zero qty' })
      .expect(400);

    expect(res.body.error).toBe('BadRequest');
  });

  it('returns 400 when quantity is negative', async () => {
    const res = await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, quantity: -5, type: 'IN', reason: 'Negative qty' })
      .expect(400);

    expect(res.body.error).toBe('BadRequest');
  });

  it('returns 400 when reason is missing', async () => {
    const res = await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, quantity: 10, type: 'IN' })
      .expect(400);

    expect(res.body.error).toBe('BadRequest');
  });

  it('returns 400 when productId is invalid ObjectId', async () => {
    const res = await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: 'not-a-valid-id', quantity: 10, type: 'IN', reason: 'Bad id' })
      .expect(400);

    expect(res.body.error).toBe('BadRequest');
  });

  it('returns 404 when product does not exist', async () => {
    const res = await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: '664400000000000000000000', quantity: 10, type: 'IN', reason: 'Missing product' })
      .expect(404);

    expect(res.body.statusCode).toBe(404);
  });
});

// ─── RBAC ─────────────────────────────────────────────────────────────────────
describe('POST /stock-movements — RBAC', () => {
  let adminToken;
  let productId;

  beforeEach(async () => {
    ({ token: adminToken } = await loginAsAdmin(app));
    const p = await createProduct(adminToken);
    productId = p._id;
  });

  it('WAREHOUSE role can create a stock movement', async () => {
    const { token } = await loginAsWarehouse(app);
    const res = await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 10, type: 'IN', reason: 'Warehouse IN' })
      .expect(201);

    expect(res.body.data.type).toBe('IN');
  });

  it('SALES role receives 403 on stock movement', async () => {
    const { token } = await loginAsSales(app);
    await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 10, type: 'IN', reason: 'Sales attempt' })
      .expect(403);
  });

  it('ACCOUNTS role receives 403 on stock movement', async () => {
    const { token } = await loginAsAccounts(app);
    await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 10, type: 'IN', reason: 'Accounts attempt' })
      .expect(403);
  });
});

// ─── GET /products/:id/stock-movements ───────────────────────────────────────
describe('GET /products/:id/stock-movements', () => {
  let adminToken;
  let productId;

  beforeEach(async () => {
    ({ token: adminToken } = await loginAsAdmin(app));
    const p = await createProduct(adminToken);
    productId = p._id;
    await setStock(productId, 100);
  });

  it('returns correct movement history with all fields', async () => {
    await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, quantity: 20, type: 'IN', reason: 'Opening stock' })
      .expect(201);

    await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, quantity: 5, type: 'OUT', reason: 'Sample dispatch' })
      .expect(201);

    const res = await request(app)
      .get(`/products/${productId}/stock-movements`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);

    const types = res.body.data.map(m => m.type);
    expect(types).toContain('IN');
    expect(types).toContain('OUT');

    // Verify all expected fields are present on each movement
    const movement = res.body.data[0];
    expect(movement.productId).toBe(productId);
    expect(movement.quantity).toBeDefined();
    expect(movement.type).toBeDefined();
    expect(movement.reason).toBeDefined();
    expect(movement.createdBy).toBeDefined();
    expect(movement.createdAt).toBeDefined();
  });

  it('returns 404 for a non-existing product', async () => {
    const res = await request(app)
      .get('/products/664400000000000000000000/stock-movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    expect(res.body.error).toBe('NotFound');
  });
});
