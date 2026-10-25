/**
 * SharePlate AI: Authentication Controller
 * Module 4: Security Engineering
 */

const crypto = require('crypto');
const { get, query, run } = require('../config/db');
const { hashPassword, verifyPassword, generateToken } = require('../middleware/auth');
const { logAction } = require('../utils/auditLogger');

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Validation Error', message: 'Email and password are required.' });
  }

  const user = get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (!user) {
    return res.status(401).json({ error: 'Authentication Failed', message: 'Invalid email address or credentials.' });
  }

  const isMatch = verifyPassword(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Authentication Failed', message: 'Invalid password.' });
  }

  // Fetch associated organization
  let org = null;
  if (user.org_id) {
    org = get('SELECT * FROM organizations WHERE org_id = ?', [user.org_id]);
  }

  const tokenPayload = {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
    org_id: user.org_id
  };

  const token = generateToken(tokenPayload);

  logAction({
    actorUserId: user.user_id,
    action: 'USER_LOGIN',
    details: `User ${user.email} (${user.role}) logged in successfully`
  });

  res.json({
    message: 'Authentication successful',
    token,
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      org_id: user.org_id,
      organization: org
    }
  });
};

exports.register = (req, res) => {
  const {
    name,
    email,
    password,
    role,
    phone,
    org_name,
    org_type,
    address,
    latitude = 12.9716,
    longitude = 77.5946
  } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'Validation Error', message: 'Name, email, password, and role are required.' });
  }

  const existing = get('SELECT user_id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (existing) {
    return res.status(409).json({ error: 'Conflict', message: 'User with this email already exists.' });
  }

  let orgId = null;
  if (org_name && org_type) {
    orgId = 'org-' + crypto.randomUUID().slice(0, 8);
    run(`
      INSERT INTO organizations (org_id, org_name, org_type, contact_person, contact_phone, contact_email, address, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [orgId, org_name, org_type.toUpperCase(), name, phone || '+91 0000000000', email.trim().toLowerCase(), address || 'Bangalore', latitude, longitude]);

    if (role === 'RECIPIENT') {
      const profId = 'prof-' + crypto.randomUUID().slice(0, 8);
      run(`
        INSERT INTO recipient_profiles (profile_id, org_id, daily_meal_deficit, beneficiary_count, preferred_categories)
        VALUES (?, ?, 50, 50, 'COOKED_MEAL,BAKERY,PRODUCE,PACKAGED_GOODS')
      `, [profId, orgId]);
    }
  }

  const userId = 'usr-' + crypto.randomUUID().slice(0, 8);
  const passwordHash = hashPassword(password);

  run(`
    INSERT INTO users (user_id, org_id, name, email, password_hash, role, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [userId, orgId, name, email.trim().toLowerCase(), passwordHash, role.toUpperCase(), phone || '']);

  const token = generateToken({
    user_id: userId,
    name,
    email: email.trim().toLowerCase(),
    role: role.toUpperCase(),
    org_id: orgId
  });

  res.status(201).json({
    message: 'User account created successfully',
    token,
    user: {
      user_id: userId,
      name,
      email: email.trim().toLowerCase(),
      role: role.toUpperCase(),
      org_id: orgId
    }
  });
};

exports.me = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = get('SELECT user_id, org_id, name, email, role, phone, created_at FROM users WHERE user_id = ?', [req.user.user_id]);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let org = null;
  if (user.org_id) {
    org = get('SELECT * FROM organizations WHERE org_id = ?', [user.org_id]);
  }

  res.json({ user: { ...user, organization: org } });
};
