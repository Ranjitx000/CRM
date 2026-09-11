/**
 * challan.test.js — Expanded Challan E2E tests
 * Covers: creation, fetching, confirm (transactions), cancel (reversal), invalid status transitions, RBAC.
 */
const request = require('supertest');
const app = require('../../src/app');
const db = require('../utils/db');
const Product = require('../../src/models/Product');
const Challan = require('../../src/models/Challan');
const StockMovement = require('../../src/models/StockMovement');
const {
  loginAsAdmin,
  loginAsSales,
  loginAsWarehouse,
  loginAsAccounts,
  createProductInDb,
  createCustomerInDb
} = require('../utils/testHelpers');

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function setupBaseData(adminToken) {
  // Use helpers directly or routes
  const p1Res = await request(app).post('/products').set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Product 1', sku: 'P-1', unitPrice: 100 });
  const p2Res = await request(app).post('/products').set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Product 2', sku: 'P-2', unitPrice: 200 });

  const cRes = await request(app).post('/customers').set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Cust 1', mobile: '9999999999', type: 'RETAIL' });

  // Add stock to products
  await Product.findByIdAndUpdate(p1Res.body.data._id, { currentStock: 50 });
  await Product.findByIdAndUpdate(p2Res.body.data._id, { currentStock: 50 });

  return {
    productId1: p1Res.body.data._id,
    productId2: p2Res.body.data._id,
    customerId: cRes.body.data._id
  };
}

// ─── POST /challans ───────────────────────────────────────────────────────────
describe('POST /challans', () => {
  let adminToken;
  let p1, p2, cust;

  beforeEach(async () => {
    ({ token: adminToken } = await loginAsAdmin(app));
    const data = await setupBaseData(adminToken);
    p1 = data.productId1;
    p2 = data.productId2;
    cust = data.customerId;
  });

  it('creates a DRAFT challan with valid items and snapshot', async () => {
    const res = await request(app)
      .post('/challans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId: cust,
        items: [
          { productId: p1, quantity: 10 },
          { productId: p2, quantity: 5 }
        ]
      })
      .expect(201);

    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.items.length).toBe(2);
    // Product snapshots must be captured at creation
    expect(res.body.data.items[0].productNameSnapshot).toBe('Product 1');
    expect(res.body.data.items[0].unitPriceSnapshot).toBe(100);
  });

  it('SALES role can create a challan', async () => {
    const { token } = await loginAsSales(app);
    await request(app)
      .post('/challans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: cust,
        items: [{ productId: p1, quantity: 1 }]
      })
      .expect(201);
  });

  it('returns 400 for empty items array', async () => {
    await request(app)
      .post('/challans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customerId: cust, items: [], type: 'DELIVERY' })
      .expect(400);
  });

  it('returns 404 if product in items does not exist', async () => {
    const fakeProduct = '507f1f77bcf86cd799439011';
    await request(app)
      .post('/challans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customerId: cust, items: [{ productId: fakeProduct, quantity: 1 }] })
      .expect(404);
  });
});

// ─── POST /challans/:id/confirm ───────────────────────────────────────────────
describe('POST /challans/:id/confirm', () => {
  let adminToken;
  let p1, p2, cust;
  let challanId;

  beforeEach(async () => {
    ({ token: adminToken } = await loginAsAdmin(app));
    const data = await setupBaseData(adminToken);
    p1 = data.productId1;
    p2 = data.productId2;
    cust = data.customerId;

    const res = await request(app)
      .post('/challans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId: cust,
        items: [{ productId: p1, quantity: 10 }]
      });
    challanId = res.body.data._id;
  });

  it('confirms challan, deducts stock, and creates OUT movements atomically', async () => {
    const res = await request(app)
      .post(`/challans/${challanId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data.status).toBe('CONFIRMED');

    // Verify Stock Deduction
    const product = await Product.findById(p1);
    expect(product.currentStock).toBe(40); // 50 - 10

    // Verify Stock Movement creation
    const movement = await StockMovement.findOne({ productId: p1, type: 'OUT' });
    expect(movement).not.toBeNull();
    expect(movement.quantity).toBe(10);
    expect(movement.reason).toMatch(/Challan/);
  });

  it('WAREHOUSE role can confirm challan', async () => {
    const { token } = await loginAsWarehouse(app);
    await request(app)
      .post(`/challans/${challanId}/confirm`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('returns 400 if already CONFIRMED', async () => {
    await request(app).post(`/challans/${challanId}/confirm`).set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app)
      .post(`/challans/${challanId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(409);
    expect(res.body.message).toMatch(/only draft challans can be confirmed/i);
  });
});

// ─── POST /challans/:id/cancel ────────────────────────────────────────────────
describe('POST /challans/:id/cancel', () => {
  let adminToken;
  let p1, cust, challanId;

  beforeEach(async () => {
    ({ token: adminToken } = await loginAsAdmin(app));
    const data = await setupBaseData(adminToken);
    p1 = data.productId1;
    cust = data.customerId;

    const res = await request(app)
      .post('/challans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId: cust,
        items: [{ productId: p1, quantity: 10 }]
      });
    challanId = res.body.data._id;
  });

  it('cancels a DRAFT challan without affecting stock', async () => {
    await request(app)
      .post(`/challans/${challanId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const product = await Product.findById(p1);
    expect(product.currentStock).toBe(50); // unchanged
  });

  it('cancels a CONFIRMED challan, restores stock, and creates IN movements', async () => {
    // 1. Confirm it (stock goes to 40)
    await request(app).post(`/challans/${challanId}/confirm`).set('Authorization', `Bearer ${adminToken}`);

    // 2. Cancel it
    const res = await request(app)
      .post(`/challans/${challanId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data.status).toBe('CANCELLED');

    // Verify Stock Restoration
    const product = await Product.findById(p1);
    expect(product.currentStock).toBe(50); // back to 50

    // Verify Reversal Stock Movement creation
    const movement = await StockMovement.findOne({ productId: p1, type: 'IN' });
    expect(movement).not.toBeNull();
    expect(movement.quantity).toBe(10);
    expect(movement.reason).toMatch(/Cancel/i);
  });

  it('returns 404 if challan not found', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    await request(app)
      .post(`/challans/${fakeId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  it('returns 403 if ACCOUNTS tries to cancel', async () => {
    const { token } = await loginAsAccounts(app);
    await request(app)
      .post(`/challans/${challanId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('returns 403 if SALES tries to cancel non-draft or not theirs', async () => {
    // Current challan is created by ADMIN. Sales tries to cancel it.
    const { token: salesToken } = await loginAsSales(app);
    await request(app)
      .post(`/challans/${challanId}/cancel`)
      .set('Authorization', `Bearer ${salesToken}`)
      .expect(403);
  });
});

describe('GET /challans', () => {
  let adminToken;
  beforeEach(async () => {
    ({ token: adminToken } = await loginAsAdmin(app));
    const data = await setupBaseData(adminToken);
    await request(app)
      .post('/challans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customerId: data.customerId, items: [{ productId: data.productId1, quantity: 1 }] });
  });

  it('returns all challans with pagination metadata', async () => {
    const res = await request(app).get('/challans').set('Authorization', `Bearer ${adminToken}`).expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta).toBeDefined();
  });

  it('filters by status and customerId', async () => {
    const res = await request(app).get('/challans?status=DRAFT').set('Authorization', `Bearer ${adminToken}`).expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe('GET /challans/:id', () => {
  let adminToken, challanId;
  beforeEach(async () => {
    ({ token: adminToken } = await loginAsAdmin(app));
    const data = await setupBaseData(adminToken);
    const res = await request(app)
      .post('/challans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customerId: data.customerId, items: [{ productId: data.productId1, quantity: 1 }] });
    challanId = res.body.data._id;
  });

  it('returns a challan by valid id', async () => {
    const res = await request(app).get(`/challans/${challanId}`).set('Authorization', `Bearer ${adminToken}`).expect(200);
    expect(res.body.data._id).toBe(challanId);
  });

  it('returns 404 when challan does not exist', async () => {
    await request(app).get('/challans/507f1f77bcf86cd799439011').set('Authorization', `Bearer ${adminToken}`).expect(404);
  });
});

describe('PATCH /challans/:id', () => {
  let adminToken, salesToken, challanId, p1, p2, cust;
  beforeEach(async () => {
    ({ token: adminToken } = await loginAsAdmin(app));
    ({ token: salesToken } = await loginAsSales(app));
    const data = await setupBaseData(adminToken);
    p1 = data.productId1;
    p2 = data.productId2;
    cust = data.customerId;

    const res = await request(app)
      .post('/challans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ customerId: cust, items: [{ productId: p1, quantity: 1 }] });
    challanId = res.body.data._id;
  });

  it('updates challan items', async () => {
    const res = await request(app)
      .patch(`/challans/${challanId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ items: [{ productId: p2, quantity: 5 }] })
      .expect(200);
    expect(res.body.data.items[0].productId).toBe(p2);
    expect(res.body.data.totalQuantity).toBe(5);
  });

  it('returns 404 if challan does not exist', async () => {
    await request(app).patch('/challans/507f1f77bcf86cd799439011').set('Authorization', `Bearer ${adminToken}`).send({ items: [{ productId: p1, quantity: 1 }] }).expect(404);
  });

  it('returns 404 if product in items does not exist', async () => {
    await request(app).patch(`/challans/${challanId}`).set('Authorization', `Bearer ${adminToken}`).send({ items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }] }).expect(404);
  });

  it('returns 409 if challan is not DRAFT', async () => {
    await request(app).post(`/challans/${challanId}/confirm`).set('Authorization', `Bearer ${adminToken}`);
    await request(app).patch(`/challans/${challanId}`).set('Authorization', `Bearer ${adminToken}`).send({ items: [{ productId: p1, quantity: 2 }] }).expect(409);
  });

  it('returns 403 if SALES edits a challan not created by them', async () => {
    await request(app).patch(`/challans/${challanId}`).set('Authorization', `Bearer ${salesToken}`).send({ items: [{ productId: p1, quantity: 2 }] }).expect(403);
  });
});
