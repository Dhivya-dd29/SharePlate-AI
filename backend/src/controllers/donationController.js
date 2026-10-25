/**
 * SharePlate AI: Food Donation Management Controller
 * Module 1: Data Engineering
 */

const crypto = require('crypto');
const { query, get, run } = require('../config/db');
const { logAction } = require('../utils/auditLogger');

exports.getAllListings = (req, res) => {
  const { category, dietary_type, status, search } = req.query;

  let sql = `
    SELECT l.*, o.org_name as donor_org_name, o.org_type as donor_org_type,
           o.contact_phone as donor_phone, o.contact_email as donor_email,
           o.address as donor_address
    FROM food_listings l
    JOIN organizations o ON l.donor_org_id = o.org_id
    WHERE 1=1
  `;
  const params = [];

  if (category) {
    sql += ` AND l.category = ?`;
    params.push(category.toUpperCase());
  }

  if (dietary_type) {
    sql += ` AND l.dietary_type = ?`;
    params.push(dietary_type.toUpperCase());
  }

  if (status) {
    sql += ` AND l.status = ?`;
    params.push(status.toUpperCase());
  }

  if (search) {
    sql += ` AND (l.food_name LIKE ? OR o.org_name LIKE ? OR l.pickup_address LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  sql += ` ORDER BY l.created_at DESC`;

  try {
    const listings = query(sql, params);
    res.json({
      success: true,
      count: listings.length,
      listings
    });
  } catch (err) {
    console.error('[DonationController] Query error:', err);
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
};

exports.getListingById = (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT l.*, o.org_name as donor_org_name, o.org_type as donor_org_type,
           o.contact_person as donor_contact_person, o.contact_phone as donor_phone,
           o.contact_email as donor_email, o.address as donor_address,
           o.fssai_or_reg_number
    FROM food_listings l
    JOIN organizations o ON l.donor_org_id = o.org_id
    WHERE l.listing_id = ?
  `;
  const listing = get(sql, [id]);
  if (!listing) {
    return res.status(404).json({ error: 'Not Found', message: 'Food donation listing not found.' });
  }
  res.json({ success: true, listing });
};

exports.createListing = (req, res) => {
  const {
    donor_org_id,
    food_name,
    category,
    dietary_type = 'VEG',
    quantity,
    quantity_unit = 'KG',
    approx_servings,
    preparation_time,
    expiry_time,
    pickup_address,
    pickup_latitude = 12.9602,
    pickup_longitude = 77.6434,
    allergens = 'None',
    storage_condition = 'ROOM_TEMP',
    notes = ''
  } = req.body;

  // Derive donor_org_id from token if user has org_id
  const effectiveOrgId = donor_org_id || (req.user && req.user.org_id) || 'org-donor-001';

  // Verify donor organization exists
  const org = get('SELECT org_id FROM organizations WHERE org_id = ?', [effectiveOrgId]);
  if (!org) {
    return res.status(400).json({
      error: 'Invalid Donor Organization',
      message: `Organization ID '${effectiveOrgId}' does not exist in the database.`
    });
  }

  const listingId = 'list-' + crypto.randomUUID().slice(0, 8);
  const prepTime = preparation_time || new Date().toISOString();

  const insertSql = `
    INSERT INTO food_listings (
      listing_id, donor_org_id, food_name, category, dietary_type,
      quantity, quantity_unit, approx_servings, preparation_time,
      expiry_time, pickup_address, pickup_latitude, pickup_longitude,
      allergens, storage_condition, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE', ?)
  `;

  try {
    run(insertSql, [
      listingId,
      effectiveOrgId,
      food_name.trim(),
      category.toUpperCase(),
      dietary_type.toUpperCase(),
      parseFloat(quantity),
      quantity_unit.toUpperCase(),
      parseInt(approx_servings, 10),
      prepTime,
      expiry_time,
      pickup_address.trim(),
      parseFloat(pickup_latitude),
      parseFloat(pickup_longitude),
      allergens.trim(),
      storage_condition.toUpperCase(),
      notes.trim()
    ]);

    logAction({
      listingId,
      actorUserId: req.user ? req.user.user_id : 'usr-donor-01',
      action: 'CREATE_LISTING',
      newStatus: 'AVAILABLE',
      details: `Created listing: ${food_name} (${quantity} ${quantity_unit})`
    });

    const created = get('SELECT * FROM food_listings WHERE listing_id = ?', [listingId]);

    res.status(201).json({
      success: true,
      message: 'Surplus food donation listed successfully',
      listing: created
    });
  } catch (err) {
    console.error('[DonationController] Create error:', err);
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
};

exports.updateListingStatus = (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const validStatuses = ['AVAILABLE', 'CLAIMED', 'IN_TRANSIT', 'DELIVERED', 'EXPIRED', 'CANCELLED'];
  if (!status || !validStatuses.includes(status.toUpperCase())) {
    return res.status(400).json({
      error: 'Validation Error',
      message: `Invalid status. Must be one of: [${validStatuses.join(', ')}].`
    });
  }

  const existing = get('SELECT * FROM food_listings WHERE listing_id = ?', [id]);
  if (!existing) {
    return res.status(404).json({ error: 'Not Found', message: 'Food donation listing not found.' });
  }

  const normalizedStatus = status.toUpperCase();
  run('UPDATE food_listings SET status = ? WHERE listing_id = ?', [normalizedStatus, id]);

  logAction({
    listingId: id,
    actorUserId: req.user ? req.user.user_id : 'system',
    action: 'UPDATE_LISTING_STATUS',
    previousStatus: existing.status,
    newStatus: normalizedStatus,
    details: notes || `Status transitioned from ${existing.status} to ${normalizedStatus}`
  });

  const updated = get('SELECT * FROM food_listings WHERE listing_id = ?', [id]);
  res.json({
    success: true,
    message: `Listing status updated to ${normalizedStatus}`,
    listing: updated
  });
};

exports.deleteListing = (req, res) => {
  const { id } = req.params;
  const existing = get('SELECT * FROM food_listings WHERE listing_id = ?', [id]);
  if (!existing) {
    return res.status(404).json({ error: 'Not Found', message: 'Listing not found.' });
  }

  // Prevent modifying another donor's record if user is non-admin
  if (req.user && req.user.role !== 'ADMIN' && req.user.org_id && req.user.org_id !== existing.donor_org_id) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Security Violation: You are not authorized to delete another donor organization’s food listing.'
    });
  }

  run('DELETE FROM food_listings WHERE listing_id = ?', [id]);

  logAction({
    listingId: id,
    actorUserId: req.user ? req.user.user_id : 'system',
    action: 'DELETE_LISTING',
    previousStatus: existing.status,
    details: `Food listing ${id} was deleted`
  });

  res.json({ success: true, message: 'Food donation listing removed successfully.' });
};
