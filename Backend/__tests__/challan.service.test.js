const mongoose = require('mongoose');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Challan = require('../src/models/Challan');
const StockMovement = require('../src/models/StockMovement');
const { confirmChallan } = require('../src/services/challan.service');
const db = require('./utils/db');
// Warning: Needs a replica set running locally. If running locally without one, these tests will fail.
//
describe('Challan Service Transactions', () => {
  let adminId;
  let productId;
  let challanId;
  beforeAll(async () => {
    // Setup clean state for tests using in-memory db
    await db.connect();
    // Clear collections
    await db.clearDatabase();
    // Create Admin
    const user = await User.create({
      name: 'Admin',
      email: 'admin_test@example.com',
      passwordHash: 'hash',
      role: 'ADMIN'
    });
    adminId = user._id;
  });

  afterAll(async () => {
    await db.closeDatabase();
  });

  beforeEach(async () => {
    // Setup clean state for each test
    await Product.deleteMany({});
    await Challan.deleteMany({});
    await StockMovement.deleteMany({});

    // Create Product with 10 stock
    const product = await Product.create({
      name: 'Test Product',
      sku: 'TEST-SKU-001',
      unitPrice: 100,
      currentStock: 10,
      createdBy: adminId
    });
    productId = product._id;

    // Create Draft Challan
    const challan = await Challan.create({
      challanNumber: 'CH-2026-TEST',
      customerId: new mongoose.Types.ObjectId(), // Dummy ID
      status: 'DRAFT',
      totalQuantity: 5,
      items: [{
        productId: product._id,
        productNameSnapshot: product.name,
        productSkuSnapshot: product.sku,
        unitPriceSnapshot: product.unitPrice,
        quantity: 5
      }],
      createdBy: adminId
    });
    challanId = challan._id;
  });

  it('should successfully confirm a challan and deduct stock', async () => {
    const confirmedChallan = await confirmChallan(challanId, adminId);
    expect(confirmedChallan.status).toBe('CONFIRMED');

    const product = await Product.findById(productId);
    expect(product.currentStock).toBe(5); // 10 - 5

    const movement = await StockMovement.findOne({ referenceId: challanId });
    expect(movement).toBeTruthy();
    expect(movement.type).toBe('OUT');
    expect(movement.quantity).toBe(5);
  });

  it('should fail to confirm if insufficient stock', async () => {
    // Update challan to require more stock than available
    await Challan.findByIdAndUpdate(challanId, { 'items.0.quantity': 15 });

    await expect(confirmChallan(challanId, adminId)).rejects.toMatchObject({
      name: 'BadRequest',
      statusCode: 400
    });

    // Verify stock is untouched
    const product = await Product.findById(productId);
    expect(product.currentStock).toBe(10);
    
    // Verify challan is still draft
    const challan = await Challan.findById(challanId);
    expect(challan.status).toBe('DRAFT');
  });

  it('should handle concurrent confirmations correctly (Integration)', async () => {
    // Create a second challan for 8 items. Total required = 5 + 8 = 13. We only have 10.
    const challan2 = await Challan.create({
      challanNumber: 'CH-2026-TEST2',
      customerId: new mongoose.Types.ObjectId(),
      status: 'DRAFT',
      totalQuantity: 8,
      items: [{
        productId: productId,
        productNameSnapshot: 'Test Product',
        productSkuSnapshot: 'TEST-SKU-001',
        unitPriceSnapshot: 100,
        quantity: 8
      }],
      createdBy: adminId
    });

    // Fire both simultaneously
    const results = await Promise.allSettled([
      confirmChallan(challanId, adminId),
      confirmChallan(challan2._id, adminId)
    ]);

    // One should succeed, one should fail
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    // Stock should never be negative
    const product = await Product.findById(productId);
    expect(product.currentStock).toBeGreaterThanOrEqual(0);
    
    // If the 5-quantity one succeeded, stock is 5. If the 8-quantity one succeeded, stock is 2.
    expect([2, 5]).toContain(product.currentStock);
  });
  it('should throw 404 if confirming non-existent challan', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    await expect(confirmChallan(fakeId, adminId)).rejects.toMatchObject({
      name: 'NotFound',
      statusCode: 404
    });
  });

  it('should throw 404 if cancelling non-existent challan', async () => {
    const { cancelChallan } = require('../src/services/challan.service');
    const fakeId = new mongoose.Types.ObjectId();
    await expect(cancelChallan(fakeId, adminId)).rejects.toMatchObject({
      name: 'NotFound',
      statusCode: 404
    });
  });

  it('should throw 409 if cancelling already cancelled challan', async () => {
    const { cancelChallan } = require('../src/services/challan.service');
    await cancelChallan(challanId, adminId);
    await expect(cancelChallan(challanId, adminId)).rejects.toMatchObject({
      name: 'Conflict',
      statusCode: 409
    });
  });
});
