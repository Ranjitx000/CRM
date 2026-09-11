/**
 * auth.test.js — Expanded Authentication E2E tests
 * Covers: successful login, wrong password, unknown email, bad input,
 *         no-token access, invalid/expired token, refresh, logout.
 */
const request = require('supertest');
const app = require('../../src/app');
const db = require('../utils/db');
const User = require('../../src/models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { loginAsAdmin } = require('../utils/testHelpers');

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

// ─── Helper ──────────────────────────────────────────────────────────────────
async function seedUser({ role = 'ADMIN', email = 'user@example.com', password = 'password123' } = {}) {
  const passwordHash = await bcrypt.hash(password, 10);
  return User.create({ name: 'Seed User', email, passwordHash, role });
}

// ─── POST /auth/login ─────────────────────────────────────────────────────────
describe('POST /auth/login', () => {
  it('returns 200 with accessToken and refreshToken cookie on valid credentials', async () => {
    await seedUser({ email: 'admin@crm.com', password: 'pass1234' });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@crm.com', password: 'pass1234' })
      .expect(200);

    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('admin@crm.com');
    expect(res.body.data.user.role).toBe('ADMIN');

    // refreshToken must be set as httpOnly cookie
    const cookies = res.headers['set-cookie'] ?? [];
    expect(cookies.some(c => c.startsWith('refreshToken='))).toBe(true);
  });

  it('returns 401 on incorrect password', async () => {
    await seedUser({ email: 'admin@crm.com', password: 'correct' });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@crm.com', password: 'wrong' })
      .expect(401);

    expect(res.body.error).toBe('Unauthorized');
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('returns 401 when email does not exist', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@crm.com', password: 'anything' })
      .expect(401);

    expect(res.body.error).toBe('Unauthorized');
  });

  it('returns 400 when email field is missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ password: 'password123' })
      .expect(400);

    expect(res.body.error).toBe('BadRequest');
  });

  it('returns 400 when password field is missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@crm.com' })
      .expect(400);

    expect(res.body.error).toBe('BadRequest');
  });

  it('returns 400 when email is not a valid email format', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'not-an-email', password: 'pass' })
      .expect(400);

    expect(res.body.error).toBe('BadRequest');
  });

  it('returns 400 when extra unknown fields are sent (strict schema)', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'a@b.com', password: 'pass', extra: 'field' })
      .expect(400);

    expect(res.body.error).toBe('BadRequest');
  });
});

// ─── Protected route — no token / invalid token ───────────────────────────────
describe('Protected API without authentication', () => {
  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app)
      .get('/customers')
      .expect(401);

    expect(res.body.statusCode).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('returns 401 when a malformed token is sent', async () => {
    const res = await request(app)
      .get('/customers')
      .set('Authorization', 'Bearer this.is.not.valid')
      .expect(401);

    expect(res.body.error).toBe('Unauthorized');
    expect(res.body.message).toBe('Invalid or expired token');
  });

  it('returns 401 when an expired token is sent', async () => {
    // Manually sign a token that already expired 1 second ago
    const expiredToken = jwt.sign(
      { id: 'fakeid', role: 'ADMIN' },
      process.env.JWT_SECRET,
      { expiresIn: -1 }
    );

    const res = await request(app)
      .get('/customers')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);

    expect(res.body.error).toBe('Unauthorized');
  });
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
describe('POST /auth/refresh', () => {
  it('returns a new accessToken when a valid refreshToken cookie is present', async () => {
    // Login first to obtain the refresh cookie
    await seedUser({ email: 'r@crm.com', password: 'pass1234' });
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'r@crm.com', password: 'pass1234' });

    const cookieHeader = loginRes.headers['set-cookie'];

    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', cookieHeader)
      .expect(200);

    expect(res.body.data.accessToken).toBeDefined();
  });

  it('returns 401 when no refreshToken cookie is present', async () => {
    const res = await request(app)
      .post('/auth/refresh')
      .expect(401);

    expect(res.body.error).toBe('Unauthorized');
  });

  it('returns 401 when refreshToken cookie is invalid', async () => {
    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', 'refreshToken=badtoken')
      .expect(401);

    expect(res.body.error).toBe('Unauthorized');
  });
});

// ─── POST /auth/logout ─────────────────────────────────────────────────────────
describe('POST /auth/logout', () => {
  it('clears the refreshToken cookie and returns success', async () => {
    const { token } = await loginAsAdmin(app);

    const res = await request(app)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.message).toBe('Logged out successfully');
    const cookies = res.headers['set-cookie'] ?? [];
    // Cookie must be cleared (empty value or MaxAge=0 / Expires in past)
    expect(cookies.some(c => c.includes('refreshToken=;') || c.includes('Expires='))).toBe(true);
  });

  it('returns 401 when attempting logout without a token', async () => {
    await request(app)
      .post('/auth/logout')
      .expect(401);
  });
});
