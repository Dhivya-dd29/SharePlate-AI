const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');

test('Module 4: Input Validation Tests for Food Donation Data Entry', async (t) => {
  await t.test('1. Rejects missing mandatory fields (food_name, category, etc.)', async () => {
    const res = await request(app)
      .post('/api/donations')
      .set('x-user-role', 'DONOR')
      .send({
        // Empty payload
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'Validation Error');
    const fieldNames = res.body.errors.map(e => e.field);
    assert.ok(fieldNames.includes('food_name'), 'Should flag missing food_name');
    assert.ok(fieldNames.includes('category'), 'Should flag missing category');
    assert.ok(fieldNames.includes('quantity'), 'Should flag missing quantity');
  });

  await t.test('2. Rejects negative or zero quantity values', async () => {
    const res = await request(app)
      .post('/api/donations')
      .set('x-user-role', 'DONOR')
      .send({
        food_name: 'Dal Makhani',
        category: 'COOKED_MEAL',
        quantity: -15.5,
        quantity_unit: 'KG',
        approx_servings: 40,
        expiry_time: new Date(Date.now() + 86400000).toISOString(),
        pickup_address: 'Indiranagar'
      });

    assert.equal(res.status, 400);
    const qtyError = res.body.errors.find(e => e.field === 'quantity');
    assert.ok(qtyError, 'Must reject negative quantity');
  });

  await t.test('3. Rejects collection deadlines / expiry dates set in the past', async () => {
    const pastDate = new Date(Date.now() - 3600000 * 5).toISOString(); // 5 hours ago
    const res = await request(app)
      .post('/api/donations')
      .set('x-user-role', 'DONOR')
      .send({
        food_name: 'Buffet Rice',
        category: 'COOKED_MEAL',
        quantity: 20,
        quantity_unit: 'KG',
        approx_servings: 50,
        expiry_time: pastDate,
        pickup_address: 'Koramangala'
      });

    assert.equal(res.status, 400);
    const dateError = res.body.errors.find(e => e.field === 'expiry_time');
    assert.ok(dateError, 'Must reject expired past deadline');
  });

  await t.test('4. Rejects invalid categorical enumeration values', async () => {
    const res = await request(app)
      .post('/api/donations')
      .set('x-user-role', 'DONOR')
      .send({
        food_name: 'Mystery Food',
        category: 'INVALID_CATEGORY_XYZ',
        quantity: 10,
        quantity_unit: 'KG',
        approx_servings: 20,
        expiry_time: new Date(Date.now() + 86400000).toISOString(),
        pickup_address: 'MG Road'
      });

    assert.equal(res.status, 400);
    const catError = res.body.errors.find(e => e.field === 'category');
    assert.ok(catError, 'Must reject invalid category');
  });

  await t.test('5. Successfully accepts and stores fully valid food donation payload', async () => {
    const res = await request(app)
      .post('/api/donations')
      .set('x-user-role', 'DONOR')
      .set('x-org-id', 'org-donor-001')
      .send({
        food_name: 'Freshly Baked Croissants & Loaves',
        category: 'BAKERY',
        dietary_type: 'VEG',
        quantity: 35,
        quantity_unit: 'PACKETS',
        approx_servings: 35,
        expiry_time: new Date(Date.now() + 86400000 * 2).toISOString(),
        pickup_address: 'HAL 2nd Stage, Indiranagar',
        pickup_latitude: 12.9719,
        pickup_longitude: 77.6412,
        notes: 'Packaged in hygienic food-grade paper packaging'
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.listing.listing_id);
    assert.equal(res.body.listing.food_name, 'Freshly Baked Croissants & Loaves');
    assert.equal(res.body.listing.status, 'AVAILABLE');
  });
});
