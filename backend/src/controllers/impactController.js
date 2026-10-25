/**
 * SharePlate AI: Impact Analytics & Reporting Controller
 * Module 1: Data Engineering
 * 
 * Aggregates live platform metrics calculated directly from relational database tables.
 */

const { get, query } = require('../config/db');

exports.getDashboardStats = (req, res) => {
  try {
    // 1. High-level KPI Counts
    const totalListings = get('SELECT COUNT(*) as count FROM food_listings').count;
    const availableListings = get("SELECT COUNT(*) as count FROM food_listings WHERE status = 'AVAILABLE'").count;
    const totalClaims = get('SELECT COUNT(*) as count FROM donation_claims').count;
    const completedPickups = get("SELECT COUNT(*) as count FROM donation_claims WHERE status = 'COMPLETED'").count;
    const pendingCollections = get("SELECT COUNT(*) as count FROM donation_claims WHERE status IN ('REQUESTED', 'ACCEPTED', 'PICKED_UP')").count;
    const totalRecipients = get("SELECT COUNT(*) as count FROM organizations WHERE org_type IN ('NGO', 'CHARITY', 'COMMUNITY_KITCHEN', 'SHELTER')").count;
    const totalDonors = get("SELECT COUNT(*) as count FROM organizations WHERE org_type IN ('RESTAURANT', 'HOTEL', 'HOSTEL', 'CATERING', 'EVENT_ORGANIZER')").count;

    // 2. Impact Quantification (Calculated from completed claims / delivered listings)
    const rescuedRow = get(`
      SELECT 
        COALESCE(SUM(c.requested_quantity), 0) as total_kg,
        COALESCE(SUM(l.approx_servings), 0) as total_servings
      FROM donation_claims c
      JOIN food_listings l ON c.listing_id = l.listing_id
      WHERE c.status = 'COMPLETED'
    `);

    const foodRescuedKg = parseFloat(rescuedRow.total_kg) || 0;
    const mealsServed = parseInt(rescuedRow.total_servings, 10) || 0;

    // Environmental metrics based on FAO & IPCC conversion benchmarks:
    // ~2.5 kg CO2e avoided per kg food rescued from landfill
    // ~1,050 liters water footprint conserved per kg food
    const co2DivertedKg = Math.round(foodRescuedKg * 2.5);
    const waterConservedLiters = Math.round(foodRescuedKg * 1050);

    // 3. Category Distribution (for Chart.js donut chart)
    const categoryRows = query(`
      SELECT category, COUNT(*) as count
      FROM food_listings
      GROUP BY category
    `);

    // 4. Status Distribution (for Chart.js bar chart)
    const statusRows = query(`
      SELECT status, COUNT(*) as count
      FROM food_listings
      GROUP BY status
    `);

    // 5. Recent Activity Logs (from immutable audit table)
    const recentActivity = query(`
      SELECT a.*, u.name as actor_name, l.food_name
      FROM impact_audit_logs a
      LEFT JOIN users u ON a.actor_user_id = u.user_id
      LEFT JOIN food_listings l ON a.listing_id = l.listing_id
      ORDER BY a.timestamp DESC
      LIMIT 8
    `);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      kpis: {
        total_donations: totalListings,
        available_donations: availableListings,
        total_claims: totalClaims,
        completed_pickups: completedPickups,
        pending_collections: pendingCollections,
        total_recipients: totalRecipients,
        total_donors: totalDonors,
        food_rescued_kg: foodRescuedKg,
        meals_served: mealsServed,
        co2_diverted_kg: co2DivertedKg,
        water_conserved_liters: waterConservedLiters
      },
      category_distribution: categoryRows,
      status_distribution: statusRows,
      recent_activity: recentActivity
    });
  } catch (err) {
    console.error('[ImpactController] Stats error:', err);
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
};

exports.getAuditLogs = (req, res) => {
  const { limit = 50 } = req.query;
  const sql = `
    SELECT a.*, u.name as actor_name, u.email as actor_email, l.food_name
    FROM impact_audit_logs a
    LEFT JOIN users u ON a.actor_user_id = u.user_id
    LEFT JOIN food_listings l ON a.listing_id = l.listing_id
    ORDER BY a.timestamp DESC
    LIMIT ?
  `;
  try {
    const logs = query(sql, [parseInt(limit, 10)]);
    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ error: 'Database Error', message: err.message });
  }
};
