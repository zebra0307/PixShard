const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../app');

test('GET /api/auth/me returns 401 when no bearer token is provided', async () => {
  const res = await request(app).get('/api/auth/me');

  assert.equal(res.status, 401);
  assert.match(res.body.message, /not authorized/i);
});

test('GET /api/auth/me returns 401 for invalid bearer token', async () => {
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', 'Bearer invalid.token.value');

  assert.equal(res.status, 401);
});
