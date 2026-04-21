const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../app');

test('GET /api/health returns API status payload', async () => {
  const res = await request(app).get('/api/health');

  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'PixShard API running');
});
