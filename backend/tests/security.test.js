const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');

test('Module 4: Security Engineering & Access Control Tests', async (t) => {
  await t.test('1. Unauthenticated request without token/credentials returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/donations')
      .send({ food_name: 'Unauthenticated Donation' });

    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Unauthorized');
  });

  await t.test('2. Role violation: RECIPIENT attempting to create donor food listing returns 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/donations')
      .set('x-user-role', 'RECIPIENT')
      .send({
        food_name: 'Unauthorized Post',
        category: 'COOKED_MEAL',
        quantity: 10,
        quantity_unit: 'KG',
        approx_servings: 20,
        expiry_time: new Date(Date.now() + 86400000).toISOString(),
        pickup_address: 'Indiranagar'
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.error, 'Forbidden');
  });

  await t.test('3. Parameterized Query handles SQL Injection attempts without syntax error or leakage', async () => {
    const injectionVector = "' OR 1=1; DROP TABLE food_listings; --";
    const res = await request(app)
      .get(`/api/donations?search=${encodeURIComponent(injectionVector)}`);

    // Parameterized query treats entire string as literal parameter
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.listings));
    // Verify food_listings table is still intact and not dropped
    const checkRes = await request(app).get('/api/donations');
    assert.equal(checkRes.status, 200);
    assert.ok(checkRes.body.count >= 0);
  });

  await t.test('4. Donor cannot delete another donor organization listing', async () => {
    // Attempt deletion with non-matching org_id
    const res = await request(app)
      .delete('/api/donations/list-001')
      .set('x-user-role', 'DONOR')
      .set('x-org-id', 'org-donor-999'); // different donor org

    assert.equal(res.status, 403);
    assert.equal(res.body.error, 'Forbidden');
  });
});
