const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');

test('End-to-End Workflow & Core Integration Tests', async (t) => {
  let createdListingId = null;
  let createdClaimId = null;
  let verificationOtp = null;

  await t.test('1. Health check reports healthy database and system parameters', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'HEALTHY');
    assert.equal(res.body.database.status, 'connected');
    assert.ok(res.body.database.alive);
  });

  await t.test('2. Donor creates a new food listing with valid future deadline', async () => {
    const futureDate = new Date(Date.now() + 3600000 * 6).toISOString(); // 6 hours ahead
    const res = await request(app)
      .post('/api/donations')
      .set('x-user-role', 'DONOR')
      .set('x-org-id', 'org-donor-001')
      .send({
        food_name: 'Hyderabadi Vegetable Biryani & Raita',
        category: 'COOKED_MEAL',
        dietary_type: 'VEG',
        quantity: 30,
        quantity_unit: 'KG',
        approx_servings: 90,
        preparation_time: new Date().toISOString(),
        expiry_time: futureDate,
        pickup_address: '124 Old Airport Road, Indiranagar',
        pickup_latitude: 12.9602,
        pickup_longitude: 77.6434,
        notes: 'Insulated thermal vessels, banquet surplus'
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.listing.listing_id);
    createdListingId = res.body.listing.listing_id;
  });

  await t.test('3. AI Matching Engine generates ranked recommendations with explainable scores', async () => {
    assert.ok(createdListingId, 'Requires listing from step 2');
    const res = await request(app)
      .post(`/api/matching/recommend/${createdListingId}`)
      .send({});

    assert.equal(res.status, 200);
    assert.ok(res.body.total_matches > 0);
    const topRec = res.body.recommendations[0];
    assert.ok(topRec.overall_score > 0);
    assert.ok(topRec.explanation);
    assert.ok(topRec.scores_breakdown.category_compatibility !== undefined);
    assert.ok(topRec.scores_breakdown.distance_score !== undefined);
  });

  await t.test('4. Recipient organization submits claim for the food listing', async () => {
    const res = await request(app)
      .post('/api/pickups/claim')
      .set('x-user-role', 'RECIPIENT')
      .set('x-org-id', 'org-recip-001')
      .send({
        listing_id: createdListingId,
        requested_quantity: 30,
        notes: 'Collecting with volunteers at 7:00 PM'
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.claim.claim_id);
    assert.equal(res.body.claim.status, 'REQUESTED');
    assert.ok(res.body.claim.verification_otp);
    createdClaimId = res.body.claim.claim_id;
    verificationOtp = res.body.claim.verification_otp;
  });

  await t.test('5. Lifecycle transition: Accept claim -> Pickup -> Complete with OTP verification', async () => {
    // 5a. Accept
    const acceptRes = await request(app)
      .patch(`/api/pickups/claim/${createdClaimId}/status`)
      .set('x-user-role', 'DONOR')
      .send({ status: 'ACCEPTED' });
    assert.equal(acceptRes.status, 200);
    assert.equal(acceptRes.body.claim.status, 'ACCEPTED');

    // 5b. Pickup
    const pickupRes = await request(app)
      .patch(`/api/pickups/claim/${createdClaimId}/status`)
      .set('x-user-role', 'RECIPIENT')
      .send({ status: 'PICKED_UP' });
    assert.equal(pickupRes.status, 200);
    assert.equal(pickupRes.body.claim.status, 'PICKED_UP');

    // 5c. Complete with invalid OTP (should fail)
    const badOtpRes = await request(app)
      .patch(`/api/pickups/claim/${createdClaimId}/status`)
      .set('x-user-role', 'DONOR')
      .send({ status: 'COMPLETED', verification_otp: '000000' });
    assert.equal(badOtpRes.status, 400);

    // 5d. Complete with valid OTP
    const goodOtpRes = await request(app)
      .patch(`/api/pickups/claim/${createdClaimId}/status`)
      .set('x-user-role', 'DONOR')
      .send({ status: 'COMPLETED', verification_otp: verificationOtp });
    assert.equal(goodOtpRes.status, 200);
    assert.equal(goodOtpRes.body.claim.status, 'COMPLETED');
  });

  await t.test('6. Impact Dashboard updates dynamically and reflects food waste diverted', async () => {
    const res = await request(app).get('/api/impact/dashboard');
    assert.equal(res.status, 200);
    assert.ok(res.body.kpis.total_donations > 0);
    assert.ok(res.body.kpis.completed_pickups >= 1);
    assert.ok(res.body.kpis.food_rescued_kg >= 30);
    assert.ok(res.body.kpis.co2_diverted_kg > 0);
    assert.ok(Array.isArray(res.body.category_distribution));
    assert.ok(Array.isArray(res.body.recent_activity));
  });
});
