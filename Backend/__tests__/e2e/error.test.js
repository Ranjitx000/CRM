/**
 * error.test.js — Tests for the global error middleware
 * Covers: custom AppError, Mongoose ValidationError, Duplicate Key Error, CastError, generic unhandled errors.
 */
const request = require('supertest');
const express = require('express');
const errorMiddleware = require('../../src/middlewares/error.middleware');

describe('Global Error Middleware', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Dummy routes that throw specific errors
    app.get('/app-error', () => {
      const err = new Error('Custom Error Message');
      err.statusCode = 418;
      err.name = 'TeapotError';
      throw err;
    });

    app.get('/mongoose-validation', () => {
      const err = new Error('User validation failed: email: Path `email` is required.');
      err.name = 'ValidationError';
      err.errors = {
        email: { path: 'email', message: 'Path `email` is required.' }
      };
      throw err;
    });

    app.get('/duplicate-key', () => {
      const err = new Error('E11000 duplicate key error collection: test.users index: email_1 dup key: { email: "test@test.com" }');
      err.code = 11000;
      err.keyValue = { email: "test@test.com" };
      throw err;
    });

    app.get('/cast-error', () => {
      const err = new Error('Cast to ObjectId failed for value "invalid" (type string) at path "_id"');
      err.name = 'CastError';
      err.kind = 'ObjectId';
      err.path = '_id';
      err.value = 'invalid';
      throw err;
    });

    app.get('/generic-error', () => {
      throw new Error('Something exploded');
    });

    // Mount the error middleware at the end
    app.use(errorMiddleware);
  });

  it('handles AppError correctly', async () => {
    const res = await request(app).get('/app-error').expect(418);
    expect(res.body.statusCode).toBe(418);
    expect(res.body.error).toBe('TeapotError');
    expect(res.body.message).toBe('Custom Error Message');
  });

  it('handles Mongoose ValidationError as 400 BadRequest', async () => {
    const res = await request(app).get('/mongoose-validation').expect(400);
    expect(res.body.statusCode).toBe(400);
    expect(res.body.error).toBe('BadRequest');
    expect(res.body.message).toMatch(/Validation Error/i);
  });

  it('handles MongoDB Duplicate Key Error (11000) as 409 Conflict', async () => {
    const res = await request(app).get('/duplicate-key').expect(409);
    expect(res.body.statusCode).toBe(409);
    expect(res.body.error).toBe('Conflict');
    expect(res.body.message).toMatch(/Duplicate value for/i);
  });

  it('handles Mongoose CastError as 400 BadRequest', async () => {
    const res = await request(app).get('/cast-error').expect(400);
    expect(res.body.statusCode).toBe(400);
    expect(res.body.error).toBe('BadRequest');
    expect(res.body.message).toMatch(/Invalid id format/i);
  });

  it('handles Generic Error as 500 InternalServerError', async () => {
    const res = await request(app).get('/generic-error').expect(500);
    expect(res.body.statusCode).toBe(500);
    expect(res.body.error).toBe('InternalServerError');
    expect(res.body.message).toBe('Internal server error');
    // Ensure stack trace is not leaked or at least we got the standard fields
  });
});
