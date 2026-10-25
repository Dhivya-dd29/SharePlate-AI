import React, { useEffect, useState } from 'react';
import { 
  Utensils, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Scale, 
  Users, 
  Leaf, 
  Droplet,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement 
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { getDashboardStats } from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
      setError('Unable to load live dashboard metrics. Ensure backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <div className="card" style={{ padding: '30px', textAlign: 'center' }}>Loading live dashboard metrics...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const kpis = stats?.kpis || {};
  const categoryData = stats?.category_distribution || [];
  const statusData = stats?.status_distribution || [];
  const recentActivity = stats?.recent_activity || [];

  // Doughnut Chart for Categories
  const categoryChartData = {
    labels: categoryData.map(c => c.category.replace('_', ' ')),
    datasets: [{
      data: categoryData.map(c => c.count),
      backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'],
      hoverOffset: 4,
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  // Bar Chart for Donation Status
  const statusChartData = {
    labels: statusData.map(s => s.status),
    datasets: [{
      label: 'Number of Listings',
      data: statusData.map(s => s.count),
      backgroundColor: '#10b981',
      borderRadius: 6
    }]
  };

  return (
    <div>
      {/* KPI Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Total Donations</span>
            <div className="stat-icon icon-emerald"><Utensils size={18} /></div>
          </div>
          <div className="stat-value">{kpis.total_donations || 0}</div>
          <div className="stat-subtext">{kpis.available_donations || 0} currently available for rescue</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Completed Pickups</span>
            <div className="stat-icon icon-blue"><CheckCircle2 size={18} /></div>
          </div>
          <div className="stat-value">{kpis.completed_pickups || 0}</div>
          <div className="stat-subtext">Verified physical deliveries</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Active / Pending</span>
            <div className="stat-icon icon-amber"><Clock size={18} /></div>
          </div>
          <div className="stat-value">{kpis.pending_collections || 0}</div>
          <div className="stat-subtext">Requests awaiting collection</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Partner Organizations</span>
            <div className="stat-icon icon-purple"><Building2 size={18} /></div>
          </div>
          <div className="stat-value">{(kpis.total_donors || 0) + (kpis.total_recipients || 0)}</div>
          <div className="stat-subtext">{kpis.total_donors || 0} Donors, {kpis.total_recipients || 0} NGOs</div>
        </div>
      </div>

      {/* Environmental & Social Impact Summary Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)', color: '#fff', border: 'none' }}>
        <div className="card-body" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85, fontWeight: 600 }}>
                Aggregated Redistribution Impact (UN SDG 12.3)
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>
                {kpis.food_rescued_kg || 0} kg Surplus Food Rescued
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '10px' }}><Users size={22} /></div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{kpis.meals_served || 0}</div>
                  <div style={{ fontSize: '12px', opacity: 0.85 }}>Meals Served</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '10px' }}><Leaf size={22} /></div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{kpis.co2_diverted_kg || 0} kg</div>
                  <div style={{ fontSize: '12px', opacity: 0.85 }}>CO₂ Diverted</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '10px' }}><Droplet size={22} /></div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700 }}>{(kpis.water_conserved_liters || 0).toLocaleString()} L</div>
                  <div style={{ fontSize: '12px', opacity: 0.85 }}>Water Conserved</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Food Category Distribution</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>From live listings</span>
          </div>
          <div className="card-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '280px' }}>
            {categoryData.length > 0 ? (
              <div style={{ width: '240px', height: '240px' }}>
                <Doughnut data={categoryChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No categorized listings recorded yet.</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Donation Status Pipeline</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Lifecycle distribution</span>
          </div>
          <div className="card-body" style={{ height: '280px' }}>
            {statusData.length > 0 ? (
              <Bar 
                data={statusChartData} 
                options={{ 
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                  plugins: { legend: { display: false } }
                }} 
              />
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No status records available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Platform Activity */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Donation & Redistribution Activity</span>
          <button className="btn btn-outline btn-sm" onClick={() => onNavigate('reports')}>
            View Audit Logs <ArrowRight size={14} />
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Associated Food</th>
                  <th>State Transition</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((log) => (
                  <tr key={log.audit_id}>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-available">{log.action}</span>
                    </td>
                    <td><strong>{log.food_name || 'System / Batch'}</strong></td>
                    <td>
                      {log.previous_status ? `${log.previous_status} → ` : ''}
                      <span className="badge badge-claimed">{log.new_status || 'RECORDED'}</span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
