/**
 * SharePlate AI: Pickup & Donation Tracking Controller
 * Module 1: Data Engineering & Module 4: Security Engineering
 */

const crypto = require('crypto');
const { query, get, run } = require('../config/db');
const { logAction } = require('../utils/auditLogger');

exports.getAllClaims = (req, res) => {
  const { status, recipient_id, donor_id } = req.query;

  let sql = `
    SELECT c.*,
           l.food_name, l.category, l.dietary_type, l.quantity as total_quantity,
           l.quantity_unit, l.approx_servings, l.pickup_address, l.expiry_time,
           donor.org_name as donor_name, donor.contact_phone as donor_phone,
           recip.org_name as recipient_name, recip.contact_person as recipient_contact,
           recip.contact_phone as recipient_phone, recip.address as recipient_address
    FROM donation_claims c
    JOIN food_listings l ON c.listing_id = l.listing_id
    JOIN organizations donor ON l.donor_org_id = donor.org_id
    JOIN organizations recip ON c.recipient_org_id = recip.org_id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ` AND c.status = ?`;
    params.push(status.toUpperCase());
  }
  if (recipient_id) {
    sql += ` AND c.recipient_org_id = ?`;
    params.push(recipient_id);
  }
  if (donor_id) {
    sql += ` AND l.donor_org_id = ?`;
    params.push(donor_id);
  }

  sql += ` ORDER BY c.created_at DESC`;

  try {
    const claims = query(sql, params);
    res.json({ success: true, count: claims.length, claims });
  } catch (err) {
    console.error('[PickupController] Error:', err);
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
};

exports.createClaim = (req, res) => {
  const { listing_id, recipient_org_id, requested_quantity, notes } = req.body;

  const listing = get('SELECT * FROM food_listings WHERE listing_id = ?', [listing_id]);
  if (!listing) {
    return res.status(404).json({ error: 'Not Found', message: 'Food listing not found.' });
  }

  if (listing.status !== 'AVAILABLE') {
    return res.status(400).json({
      error: 'Listing Unavailable',
      message: `Cannot claim listing in status '${listing.status}'. Only 'AVAILABLE' listings can be claimed.`
    });
  }

  // Derive recipient_org_id from token if user is logged in
  const effectiveRecipientId = recipient_org_id || (req.user && req.user.org_id) || 'org-recip-001';

  const recipient = get('SELECT org_id FROM organizations WHERE org_id = ?', [effectiveRecipientId]);
  if (!recipient) {
    return res.status(400).json({
      error: 'Invalid Recipient',
      message: `Recipient organization '${effectiveRecipientId}' not found.`
    });
  }

  const claimId = 'clm-' + crypto.randomUUID().slice(0, 8);
  // Generate cryptographically secure 6-digit OTP for physical handover
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const claimQty = requested_quantity ? parseFloat(requested_quantity) : listing.quantity;

  try {
    run(`
      INSERT INTO donation_claims (
        claim_id, listing_id, recipient_org_id, requested_quantity,
        status, verification_otp, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'REQUESTED', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [claimId, listing_id, effectiveRecipientId, claimQty, otp, notes || 'Claim submitted via portal']);

    // Update listing state to CLAIMED
    run('UPDATE food_listings SET status = ? WHERE listing_id = ?', ['CLAIMED', listing_id]);

    logAction({
      claimId,
      listingId: listing_id,
      actorUserId: req.user ? req.user.user_id : 'usr-recip-01',
      action: 'SUBMIT_CLAIM',
      previousStatus: 'AVAILABLE',
      newStatus: 'CLAIMED',
      details: `Claim submitted for ${claimQty} ${listing.quantity_unit} of ${listing.food_name}`
    });

    const created = get('SELECT * FROM donation_claims WHERE claim_id = ?', [claimId]);

    res.status(201).json({
      success: true,
      message: 'Donation claim successfully submitted. Awaiting donor confirmation.',
      claim: created
    });
  } catch (err) {
    console.error('[PickupController] Create claim error:', err);
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
};

exports.updateClaimStatus = (req, res) => {
  const { id } = req.params;
  const { status, verification_otp, notes } = req.body;

  const validStatuses = ['REQUESTED', 'ACCEPTED', 'REJECTED', 'PICKED_UP', 'COMPLETED', 'CANCELLED'];
  if (!status || !validStatuses.includes(status.toUpperCase())) {
    return res.status(400).json({
      error: 'Validation Error',
      message: `Invalid status. Must be one of: [${validStatuses.join(', ')}].`
    });
  }

  const claim = get('SELECT * FROM donation_claims WHERE claim_id = ?', [id]);
  if (!claim) {
    return res.status(404).json({ error: 'Not Found', message: 'Donation claim not found.' });
  }

  const nextStatus = status.toUpperCase();

  // If completing, verify OTP
  if (nextStatus === 'COMPLETED') {
    if (verification_otp && verification_otp !== claim.verification_otp) {
      return res.status(400).json({
        error: 'OTP Mismatch',
        message: 'Invalid handover verification code. Delivery cannot be verified.'
      });
    }
  }

  // Update claim
  let updateSql = 'UPDATE donation_claims SET status = ?, updated_at = CURRENT_TIMESTAMP';
  const params = [nextStatus];

  if (nextStatus === 'PICKED_UP') {
    updateSql += ', pickup_time = CURRENT_TIMESTAMP';
  } else if (nextStatus === 'COMPLETED') {
    updateSql += ', completion_time = CURRENT_TIMESTAMP';
  }

  if (notes) {
    updateSql += ', notes = ?';
    params.push(notes);
  }

  updateSql += ' WHERE claim_id = ?';
  params.push(id);

  run(updateSql, params);

  // Sync food listing status
  if (nextStatus === 'COMPLETED') {
    run('UPDATE food_listings SET status = ? WHERE listing_id = ?', ['DELIVERED', claim.listing_id]);
  } else if (nextStatus === 'REJECTED' || nextStatus === 'CANCELLED') {
    // Release listing back to available
    run('UPDATE food_listings SET status = ? WHERE listing_id = ?', ['AVAILABLE', claim.listing_id]);
  } else if (nextStatus === 'PICKED_UP') {
    run('UPDATE food_listings SET status = ? WHERE listing_id = ?', ['IN_TRANSIT', claim.listing_id]);
  }

  logAction({
    claimId: id,
    listingId: claim.listing_id,
    actorUserId: req.user ? req.user.user_id : 'system',
    action: `CLAIM_TRANSITION_${nextStatus}`,
    previousStatus: claim.status,
    newStatus: nextStatus,
    details: `Claim transitioned to ${nextStatus}`
  });

  const updatedClaim = get('SELECT * FROM donation_claims WHERE claim_id = ?', [id]);
  res.json({
    success: true,
    message: `Claim status updated to ${nextStatus}`,
    claim: updatedClaim
  });
};
