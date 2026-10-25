/**
 * SharePlate AI: Recipient Organizations Controller
 * Module 1: Data Engineering
 */

const crypto = require('crypto');
const { query, get, run } = require('../config/db');
const { logAction } = require('../utils/auditLogger');

exports.getAllRecipients = (req, res) => {
  const sql = `
    SELECT o.org_id, o.org_name, o.org_type, o.contact_person, o.contact_phone,
           o.contact_email, o.address, o.city, o.latitude, o.longitude,
           o.fssai_or_reg_number, o.is_verified,
           p.profile_id, p.daily_meal_deficit, p.beneficiary_count,
           p.preferred_categories, p.dietary_preference, p.has_refrigeration,
           p.has_deep_freeze, p.transport_available, p.max_distance_km,
           p.operating_hours, p.updated_at
    FROM organizations o
    LEFT JOIN recipient_profiles p ON o.org_id = p.org_id
    WHERE o.org_type IN ('NGO', 'CHARITY', 'COMMUNITY_KITCHEN', 'SHELTER')
    ORDER BY o.created_at ASC
  `;

  try {
    const recipients = query(sql);
    res.json({
      success: true,
      count: recipients.length,
      recipients
    });
  } catch (err) {
    console.error('[RecipientController] Error:', err);
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
};

exports.getRecipientById = (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT o.org_id, o.org_name, o.org_type, o.contact_person, o.contact_phone,
           o.contact_email, o.address, o.city, o.latitude, o.longitude,
           o.fssai_or_reg_number, o.is_verified,
           p.profile_id, p.daily_meal_deficit, p.beneficiary_count,
           p.preferred_categories, p.dietary_preference, p.has_refrigeration,
           p.has_deep_freeze, p.transport_available, p.max_distance_km,
           p.operating_hours, p.updated_at
    FROM organizations o
    LEFT JOIN recipient_profiles p ON o.org_id = p.org_id
    WHERE o.org_id = ?
  `;

  const recipient = get(sql, [id]);
  if (!recipient) {
    return res.status(404).json({ error: 'Not Found', message: 'Recipient organization not found.' });
  }

  // Get recent claims for this recipient
  const claims = query(`
    SELECT c.*, l.food_name, l.category, l.dietary_type, o.org_name as donor_name
    FROM donation_claims c
    JOIN food_listings l ON c.listing_id = l.listing_id
    JOIN organizations o ON l.donor_org_id = o.org_id
    WHERE c.recipient_org_id = ?
    ORDER BY c.created_at DESC LIMIT 5
  `, [id]);

  res.json({
    success: true,
    recipient: {
      ...recipient,
      recent_claims: claims
    }
  });
};

exports.updateRecipientProfile = (req, res) => {
  const { id } = req.params;
  const {
    daily_meal_deficit,
    beneficiary_count,
    preferred_categories,
    dietary_preference,
    has_refrigeration,
    has_deep_freeze,
    transport_available,
    max_distance_km,
    operating_hours
  } = req.body;

  const org = get('SELECT org_id FROM organizations WHERE org_id = ?', [id]);
  if (!org) {
    return res.status(404).json({ error: 'Not Found', message: 'Organization not found.' });
  }

  let profile = get('SELECT profile_id FROM recipient_profiles WHERE org_id = ?', [id]);

  if (!profile) {
    // Create profile if missing
    const profId = 'prof-' + crypto.randomUUID().slice(0, 8);
    run(`
      INSERT INTO recipient_profiles (
        profile_id, org_id, daily_meal_deficit, beneficiary_count,
        preferred_categories, dietary_preference, has_refrigeration,
        has_deep_freeze, transport_available, max_distance_km, operating_hours
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      profId,
      id,
      daily_meal_deficit || 60,
      beneficiary_count || 60,
      preferred_categories || 'COOKED_MEAL,BAKERY,PRODUCE,PACKAGED_GOODS',
      dietary_preference || 'ANY',
      has_refrigeration !== undefined ? (has_refrigeration ? 1 : 0) : 1,
      has_deep_freeze !== undefined ? (has_deep_freeze ? 1 : 0) : 0,
      transport_available !== undefined ? (transport_available ? 1 : 0) : 1,
      max_distance_km || 20.0,
      operating_hours || '08:00 - 22:00'
    ]);
  } else {
    run(`
      UPDATE recipient_profiles SET
        daily_meal_deficit = COALESCE(?, daily_meal_deficit),
        beneficiary_count = COALESCE(?, beneficiary_count),
        preferred_categories = COALESCE(?, preferred_categories),
        dietary_preference = COALESCE(?, dietary_preference),
        has_refrigeration = COALESCE(?, has_refrigeration),
        has_deep_freeze = COALESCE(?, has_deep_freeze),
        transport_available = COALESCE(?, transport_available),
        max_distance_km = COALESCE(?, max_distance_km),
        operating_hours = COALESCE(?, operating_hours),
        updated_at = CURRENT_TIMESTAMP
      WHERE org_id = ?
    `, [
      daily_meal_deficit,
      beneficiary_count,
      preferred_categories,
      dietary_preference,
      has_refrigeration !== undefined ? (has_refrigeration ? 1 : 0) : null,
      has_deep_freeze !== undefined ? (has_deep_freeze ? 1 : 0) : null,
      transport_available !== undefined ? (transport_available ? 1 : 0) : null,
      max_distance_km,
      operating_hours,
      id
    ]);
  }

  logAction({
    actorUserId: req.user ? req.user.user_id : 'system',
    action: 'UPDATE_RECIPIENT_PROFILE',
    details: `Updated operational profile for recipient org ${id}`
  });

  const updatedProfile = get('SELECT * FROM recipient_profiles WHERE org_id = ?', [id]);
  res.json({
    success: true,
    message: 'Recipient operational profile updated successfully',
    profile: updatedProfile
  });
};

exports.createRecipient = (req, res) => {
  const {
    org_name,
    org_type = 'NGO',
    contact_person,
    contact_phone,
    contact_email,
    address,
    city = 'Bangalore',
    latitude = 12.9716,
    longitude = 77.5946,
    fssai_or_reg_number,
    daily_meal_deficit = 50,
    beneficiary_count = 50,
    preferred_categories = 'COOKED_MEAL,BAKERY,PRODUCE,PACKAGED_GOODS',
    dietary_preference = 'ANY',
    has_refrigeration = 1,
    has_deep_freeze = 0,
    transport_available = 1,
    max_distance_km = 20.0
  } = req.body;

  if (!org_name || !contact_person || !contact_phone || !contact_email || !address) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'org_name, contact_person, contact_phone, contact_email, and address are mandatory.'
    });
  }

  const orgId = 'org-' + crypto.randomUUID().slice(0, 8);
  const profId = 'prof-' + crypto.randomUUID().slice(0, 8);

  try {
    run(`
      INSERT INTO organizations (
        org_id, org_name, org_type, contact_person, contact_phone,
        contact_email, address, city, latitude, longitude, fssai_or_reg_number, is_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      orgId,
      org_name.trim(),
      org_type.toUpperCase(),
      contact_person.trim(),
      contact_phone.trim(),
      contact_email.trim().toLowerCase(),
      address.trim(),
      city.trim(),
      parseFloat(latitude),
      parseFloat(longitude),
      fssai_or_reg_number || 'REG-PENDING'
    ]);

    run(`
      INSERT INTO recipient_profiles (
        profile_id, org_id, daily_meal_deficit, beneficiary_count,
        preferred_categories, dietary_preference, has_refrigeration,
        has_deep_freeze, transport_available, max_distance_km
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      profId,
      orgId,
      parseInt(daily_meal_deficit, 10),
      parseInt(beneficiary_count, 10),
      preferred_categories,
      dietary_preference,
      has_refrigeration ? 1 : 0,
      has_deep_freeze ? 1 : 0,
      transport_available ? 1 : 0,
      parseFloat(max_distance_km)
    ]);

    res.status(201).json({
      success: true,
      message: 'Recipient organization registered successfully',
      org_id: orgId
    });
  } catch (err) {
    console.error('[RecipientController] Register error:', err);
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
};
