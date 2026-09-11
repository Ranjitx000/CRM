/**
 * customer.test.js — Expanded Customer E2E tests
 * Covers: CRUD, search, filter, notes, RBAC, validation, not-found.
 */
const request = require('supertest');
const app = require('../../src/app');
const db = require('../utils/db');
const Customer = require('../../src/models/Customer');
const CustomerNote = require('../../src/models/CustomerNote');
const {
  loginAsAdmin,
  loginAsSales,
  loginAsWarehouse,
  loginAsAccounts
} = require('../utils/testHelpers');

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

// ─── Realistic payload factory ────────────────────────────────────────────────
const makeCustomer = (overrides = {}) => ({
  name: 'Ravi Kumar',
  mobile: '9876543210',
  email: 'ravi@example.com',
  businessName: 'Ravi Traders',
  gstNumber: '27AAPFU0939F1ZV',
  type: 'WHOLESALE',
  address: '42 Gandhi Marg, Mumbai',
  status: 'ACTIVE',
  ...overrides
});

// ─── POST /customers ──────────────────────────────────────────────────────────
describe('POST /customers', () => {
  let adminToken;
  beforeEach(async () => {
    ({ token: adminToken } = await loginAsAdmin(app));
  });

  it('creates a customer with full realistic payload and returns 201', async () => {
    const payload = makeCustomer();
    const res = await request(app)
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);

    expect(res.body.data.name).toBe('Ravi Kumar');
    expect(res.body.data.mobile).toBe('9876543210');
    expect(res.body.data.gstNumber).toBe('27AAPFU0939F1ZV');
    expect(res.body.data.businessName).toBe('Ravi Traders');
    expect(res.body.data.type).toBe('WHOLESALE');
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data._id).toBeDefined();
  });

  it('persists the new customer in the database', async () => {
    await request(app)
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(makeCustomer({ name: 'DBCheck Customer' }))
      .expect(201);

    const dbCustomer = await Customer.findOne({ name: 'DBCheck Customer' });
    expect(dbCustomer).not.toBeNull();
    expect(dbCustomer.mobile).toBe('9876543210');
  });

  it('SALES role can create a customer', async () => {
    const { token } = await loginAsSales(app);
    const res = await request(app)
      .post('/customers')
      .set('Authorization', `Bearer ${token}`)
      .send(makeCustomer())
      .expect(201);

    expect(res.body.data._id).toBeDefined();
  });

  it('WAREHOUSE role receives 403 when creating a customer', async () => {
    const { token } = await loginAsWarehouse(app);
    await request(app)
      .post('/customers')
      .set('Authorization', `Bearer ${token}`)
      .send(makeCustomer())
      .expect(403);
  });

  it('ACCOUNTS role receives 403 when creating a customer', async () => {
    const { token } = await loginAsAccounts(app);
    await request(app)
      .post('/customers')
      .set('Authorization', `Bearer ${token}`)
      .send(makeCustomer())
      .expect(403);
  });

  it('returns 400 when required name is missing', async () => {
    const res = await request(app)
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ mobile: '9876543210', type: 'RETAIL' })
      .expect(400);

    expect(res.body.error).toBe('BadRequest');
  });

  it('returns 400 when required mobile is missing', async () => {
    const res = await request(app)
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'No Mobile', type: 'RETAIL' })
      .expect(400);

    expect(res.body.error).toBe('BadRequest');
  });

  it('returns 400 when mobile format is invalid', async () => {
    const res = await request(app)
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bad Mobile', mobile: 'abc', type: 'RETAIL' })
      .expect(400);

    expect(res.body.error).toBe('BadRequest');
  });

  it('returns 400 when type is an invalid enum value', async () => {
    const res = await request(app)
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bad Type', mobile: '9876543210', type: 'VIP' })
      .expect(400);

    expect(res.body.error).toBe('BadRequest');
  });

  it('returns 400 when unknown fields are sent (strict schema)', async () => {
    const res = await request(app)
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...makeCustomer(), unknownField: 'value' })
      .expect(400);

    expect(res.body.error).toBe('BadRequest');
  });
});

// ─── GET /customers ───────────────────────────────────────────────────────────
describe('GET /customers', () => {
  let adminToken;

  beforeEach(async () => {
    ({ token: adminToken } = await loginAsAdmin(app));
    // Seed customers
    await request(app).post('/customers').set('Authorization', `Bearer ${adminToken}`)
      .send(makeCustomer({ name: 'Ravi Kumar', businessName: 'Ravi Traders', mobile: '9876543210', type: 'WHOLESALE', status: 'ACTIVE' }));
    await request(app).post('/customers').set('Authorization', `Bearer ${adminToken}`)
      .send(makeCustomer({ name: 'Sita Sharma', businessName: 'Sita Traders', mobile: '8765432109', type: 'RETAIL', status: 'LEAD', email: 'sita@example.com' }));
    await request(app).post('/customers').set('Authorization', `Bearer ${adminToken}`)
      .send(makeCustomer({ name: 'Mohan Das', businessName: 'Mohan Traders', mobile: '7654321098', type: 'DISTRIBUTOR', status: 'INACTIVE', email: 'mohan@example.com' }));
  });

  it('returns all customers with correct pagination metadata', async () => {
    const res = await request(app)
      .get('/customers?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data.length).toBe(3);
    expect(res.body.meta.total).toBe(3);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(10);
    expect(res.body.meta.totalPages).toBe(1);
  });

  it('respects limit parameter', async () => {
    const res = await request(app)
      .get('/customers?page=1&limit=2')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data.length).toBe(2);
    expect(res.body.meta.total).toBe(3);
    expect(res.body.meta.totalPages).toBe(2);
  });

  it('filters by search term matching name', async () => {
    const res = await request(app)
      .get('/customers?search=Ravi')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Ravi Kumar');
  });

  it('filters by search term matching mobile', async () => {
    const res = await request(app)
      .get('/customers?search=8765432109')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Sita Sharma');
  });

  it('filters by status=ACTIVE', async () => {
    const res = await request(app)
      .get('/customers?status=ACTIVE')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe('ACTIVE');
  });

  it('filters by type=WHOLESALE', async () => {
    const res = await request(app)
      .get('/customers?type=WHOLESALE')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].type).toBe('WHOLESALE');
  });

  it('returns empty array when no customers match the search', async () => {
    const res = await request(app)
      .get('/customers?search=ZZZnotexists')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data.length).toBe(0);
    expect(res.body.meta.total).toBe(0);
  });

  it('any authenticated role can list customers', async () => {
    const { token } = await loginAsWarehouse(app);
    const res = await request(app)
      .get('/customers')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ─── GET /customers/:id ───────────────────────────────────────────────────────
describe('GET /customers/:id', () => {
  let adminToken;

  beforeEach(async () => {
    ({ token: adminToken } = await loginAsAdmin(app));
  });

  it('returns a customer by valid id', async () => {
    const createRes = await request(app)
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(makeCustomer())
      .expect(201);

    const id = createRes.body.data._id;

    const res = await request(app)
      .get(`/customers/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data._id).toBe(id);
    expect(res.body.data.name).toBe('Ravi Kumar');
  });

  it('returns 404 when customer does not exist', async () => {
    const fakeId = '664400000000000000000000';
    const res = await request(app)
      .get(`/customers/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);

    expect(res.body.error).toBe('NotFound');
  });

  it('returns 400 when id format is invalid (triggers CastError via error middleware)', async () => {
    const res = await request(app)
      .get('/customers/not-a-valid-id')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);

    expect(res.body.error).toBe('BadRequest');
  });
});

// ─── PATCH /customers/:id ─────────────────────────────────────────────────────
describe('PATCH /customers/:id', () => {
  let adminToken;
  let customerId;

  beforeEach(async () => {
    ({ token: adminToken } = await loginAsAdmin(app));
    const res = await request(app)
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(makeCustomer())
      .expect(201);
    customerId = res.body.data._id;
  });

  it('ADMIN can update a customer', async () => {
    const res = await request(app)
      .patch(`/customers/${customerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Ravi Kumar Updated', status: 'INACTIVE' })
      .expect(200);

    expect(res.body.data.name).toBe('Ravi Kumar Updated');
    expect(res.body.data.status).toBe('INACTIVE');
  });

  it('SALES role can update a customer', async () => {
    const { token } = await loginAsSales(app);
    const res = await request(app)
      .patch(`/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sales Updated' })
      .expect(200);

    expect(res.body.data.name).toBe('Sales Updated');
  });

  it('WAREHOUSE role receives 403 on update', async () => {
    const { token } = await loginAsWarehouse(app);
    await request(app)
      .patch(`/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Unauthorized update' })
      .expect(403);
  });

  it('ACCOUNTS role receives 403 on update', async () => {
    const { token } = await loginAsAccounts(app);
    await request(app)
      .patch(`/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ACTIVE' })
      .expect(403);
  });

  it('returns 404 when customer does not exist', async () => {
    const res = await request(app)
      .patch('/customers/664400000000000000000000')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Ghost' })
      .expect(404);

    expect(res.body.error).toBe('NotFound');
  });

  it('returns 400 for invalid update fields (strict schema)', async () => {
    const res = await request(app)
      .patch(`/customers/${customerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ unknownField: 'bad' })
      .expect(400);

    expect(res.body.error).toBe('BadRequest');
  });

  it('verifies the update persisted in the database', async () => {
    await request(app)
      .patch(`/customers/${customerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ followUpDate: new Date('2026-12-01T00:00:00.000Z').toISOString() })
      .expect(200);

    const dbCustomer = await Customer.findById(customerId);
    expect(dbCustomer.followUpDate).toBeDefined();
  });
});

// ─── POST /customers/:id/notes ────────────────────────────────────────────────
describe('POST /customers/:id/notes', () => {
  let adminToken;
  let customerId;

  beforeEach(async () => {
    ({ token: adminToken } = await loginAsAdmin(app));
    const res = await request(app)
      .post('/customers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(makeCustomer())
      .expect(201);
    customerId = res.body.data._id;
  });

  it('adds a follow-up note and returns 201', async () => {
    const res = await request(app)
      .post(`/customers/${customerId}/notes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'Called customer, interested in bulk order.' })
      .expect(201);

    expect(res.body.data.note).toBe('Called customer, interested in bulk order.');
    expect(res.body.data.customerId).toBe(customerId);
    expect(res.body.data._id).toBeDefined();
  });

  it('adds multiple notes and preserves all previous notes in the database', async () => {
    await request(app)
      .post(`/customers/${customerId}/notes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'First follow-up: discussed pricing.' })
      .expect(201);

    await request(app)
      .post(`/customers/${customerId}/notes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'Second follow-up: sent quotation.' })
      .expect(201);

    await request(app)
      .post(`/customers/${customerId}/notes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'Third follow-up: customer confirmed order.' })
      .expect(201);

    const allNotes = await CustomerNote.find({ customerId });
    expect(allNotes.length).toBe(3);
    const noteTexts = allNotes.map(n => n.note);
    expect(noteTexts).toContain('First follow-up: discussed pricing.');
    expect(noteTexts).toContain('Second follow-up: sent quotation.');
    expect(noteTexts).toContain('Third follow-up: customer confirmed order.');
  });

  it('SALES role can add a note', async () => {
    const { token } = await loginAsSales(app);
    await request(app)
      .post(`/customers/${customerId}/notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ note: 'Sales note.' })
      .expect(201);
  });

  it('WAREHOUSE role receives 403 when adding a note', async () => {
    const { token } = await loginAsWarehouse(app);
    await request(app)
      .post(`/customers/${customerId}/notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ note: 'Unauthorized note.' })
      .expect(403);
  });

  it('returns 400 when note body is empty', async () => {
    const res = await request(app)
      .post(`/customers/${customerId}/notes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: '' })
      .expect(400);

    expect(res.body.error).toBe('BadRequest');
  });

  it('returns 404 when customer does not exist', async () => {
    const res = await request(app)
      .post('/customers/664400000000000000000000/notes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'Orphan note.' })
      .expect(404);

    expect(res.body.error).toBe('NotFound');
  });
});
