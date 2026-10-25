import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Leaf, 
  Users, 
  Droplet, 
  Download, 
  ShieldCheck, 
  FileText,
  Clock
} from 'lucide-react';
import { getDashboardStats, getAuditLogs } from '../services/api';

export default function ImpactReports() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsData, logsData] = await Promise.all([
          getDashboardStats(),
          getAuditLogs()
        ]);
        setStats(statsData);
        setLogs(logsData.logs || []);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const kpis = stats?.kpis || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Reports & Impact Analytics</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Module 1 & 4: Environmental footprint quantification, UN SDG 12.3 reporting, and tamper-evident audit logs
          </p>
        </div>

        <button className="btn btn-outline btn-sm" onClick={handlePrint}>
          <Download size={14} /> Export CSR Report
        </button>
      </div>

      {/* Sustainability Metrics Cards */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-top">
            <span className="stat-label">Food Waste Diverted</span>
            <div className="stat-icon icon-emerald"><BarChart3 size={18} /></div>
          </div>
          <div className="stat-value">{kpis.food_rescued_kg || 0} kg</div>
          <div className="stat-subtext">Edible food rescued from municipal landfills</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="stat-top">
            <span className="stat-label">Beneficiary Meals</span>
            <div className="stat-icon icon-blue"><Users size={18} /></div>
          </div>
          <div className="stat-value">{kpis.meals_served || 0}</div>
          <div className="stat-subtext">Nutritious portions distributed to shelter residents</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #059669' }}>
          <div className="stat-top">
            <span className="stat-label">GHG Emissions Prevented</span>
            <div className="stat-icon icon-emerald"><Leaf size={18} /></div>
          </div>
          <div className="stat-value">{kpis.co2_diverted_kg || 0} kg CO₂e</div>
          <div className="stat-subtext">Calculated at 2.5 kg CO₂e avoided per kg food</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="stat-top">
            <span className="stat-label">Embedded Water Conserved</span>
            <div className="stat-icon icon-blue"><Droplet size={18} /></div>
          </div>
          <div className="stat-value">{(kpis.water_conserved_liters || 0).toLocaleString()} L</div>
          <div className="stat-subtext">Agricultural water footprint preserved</div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <ShieldCheck size={18} color="var(--primary)" />
            Immutable Platform Audit Logs (Module 4)
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Cryptographically recorded event log
          </span>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>Loading audit records...</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No audit events recorded.</div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Event Action</th>
                    <th>Lifecycle Transition</th>
                    <th>Audit Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.audit_id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {log.audit_id}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{log.actor_name || 'System Agent'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.ip_address}</div>
                      </td>
                      <td>
                        <span className="badge badge-available">{log.action}</span>
                      </td>
                      <td>
                        {log.previous_status ? `${log.previous_status} → ` : ''}
                        <strong>{log.new_status || 'CONFIRMED'}</strong>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
