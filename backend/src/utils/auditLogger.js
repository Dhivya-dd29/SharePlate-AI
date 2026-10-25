/**
 * SharePlate AI: Immutable Audit & State Transition Logger
 * Module 1: Data Engineering & Module 4: Security Engineering
 */

const crypto = require('crypto');
const { run } = require('../config/db');

function logAction({
  claimId = null,
  listingId = null,
  actorUserId = null,
  action,
  previousStatus = null,
  newStatus = null,
  ipAddress = '127.0.0.1',
  details = ''
}) {
  try {
    const auditId = 'aud-' + crypto.randomUUID().slice(0, 8);
    const sql = `
      INSERT INTO impact_audit_logs 
      (audit_id, claim_id, listing_id, actor_user_id, action, previous_status, new_status, ip_address, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    run(sql, [auditId, claimId, listingId, actorUserId, action, previousStatus, newStatus, ipAddress, details]);
    return auditId;
  } catch (err) {
    console.error('[SharePlate AI AuditLogger] Failed to write audit log:', err.message);
    return null;
  }
}

module.exports = {
  logAction
};
