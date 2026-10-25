import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Utensils, 
  Truck, 
  Snowflake, 
  Edit3, 
  Check, 
  Plus, 
  AlertCircle 
} from 'lucide-react';
import { getRecipients, updateRecipientProfile, createRecipient } from '../services/api';

export default function RecipientOrganizations() {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecip, setSelectedRecip] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [alert, setAlert] = useState(null);

  const fetchRecipients = async () => {
    try {
      setLoading(true);
      const data = await getRecipients();
      setRecipients(data.recipients || []);
    } catch (err) {
      console.error('Failed to load recipients:', err);
      setAlert({ type: 'danger', message: 'Could not load recipient profiles from backend.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
  }, []);

  const openEditModal = (recip) => {
    setSelectedRecip(recip);
    setEditForm({
      daily_meal_deficit: recip.daily_meal_deficit || 50,
      beneficiary_count: recip.beneficiary_count || 50,
      preferred_categories: recip.preferred_categories || 'COOKED_MEAL,BAKERY,PRODUCE',
      dietary_preference: recip.dietary_preference || 'ANY',
      has_refrigeration: Boolean(recip.has_refrigeration),
      has_deep_freeze: Boolean(recip.has_deep_freeze),
      transport_available: Boolean(recip.transport_available),
      max_distance_km: recip.max_distance_km || 20.0,
      operating_hours: recip.operating_hours || '08:00 - 22:00'
    });
    setIsEditing(true);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateRecipientProfile(selectedRecip.org_id, editForm);
      setAlert({ type: 'success', message: `Operational requirements updated for ${selectedRecip.org_name}!` });
      setIsEditing(false);
      fetchRecipients();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to update profile.' });
    }
  };

  return (
    <div>
      {/* Alerts */}
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          <AlertCircle size={16} />
          <span>{alert.message}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setAlert(null)}>×</button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Recipient Organizations & Operational Profiles</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Module 1: Data Engineering — Recipient demand capacities, logistical infrastructure, and dietary constraints
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '30px', textAlign: 'center' }}>Loading recipient profiles...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {recipients.map((recip) => (
            <div key={recip.org_id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-header" style={{ alignItems: 'flex-start' }}>
                <div>
                  <span className="badge badge-produced" style={{ background: '#e0f2fe', color: '#0369a1', marginBottom: '6px' }}>
                    {recip.org_type}
                  </span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {recip.org_name}
                  </div>
                </div>
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => openEditModal(recip)}
                  title="Edit Operational Requirements"
                >
                  <Edit3 size={13} /> Edit
                </button>
              </div>

              <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <MapPin size={15} color="var(--primary)" />
                  <span>{recip.address}, {recip.city}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <Phone size={15} color="var(--secondary)" />
                  <span>{recip.contact_phone} ({recip.contact_person})</span>
                </div>

                {/* Capacity & Demand Metrics */}
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-sm)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Daily Meal Deficit</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#dc2626' }}>{recip.daily_meal_deficit || 0} meals</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Resident Beneficiaries</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{recip.beneficiary_count || 0} people</div>
                  </div>
                </div>

                {/* Infrastructure Capabilities */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="badge" style={{ background: recip.has_refrigeration ? '#dcfce7' : '#f1f5f9', color: recip.has_refrigeration ? '#15803d' : '#94a3b8' }}>
                    <Snowflake size={12} /> {recip.has_refrigeration ? 'Cold Storage Ready' : 'No Cold Storage'}
                  </span>
                  <span className="badge" style={{ background: recip.transport_available ? '#e0f2fe' : '#f1f5f9', color: recip.transport_available ? '#0369a1' : '#94a3b8' }}>
                    <Truck size={12} /> {recip.transport_available ? 'Own Transport' : 'No Transport'}
                  </span>
                  <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                    Max: {recip.max_distance_km || 20} km
                  </span>
                </div>

                {/* Category & Dietary */}
                <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-light)', fontSize: '12px' }}>
                  <div><strong>Preferred:</strong> {recip.preferred_categories?.replace(/_/g, ' ')}</div>
                  <div><strong>Dietary Rule:</strong> {recip.dietary_preference || 'ANY'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Requirements Modal */}
      {isEditing && selectedRecip && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <span className="card-title">Update Recipient Profile: {selectedRecip.org_name}</span>
              <button style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }} onClick={() => setIsEditing(false)}>×</button>
            </div>
            <form onSubmit={handleProfileSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Daily Meal Deficit (Urgent Need)</label>
                    <input 
                      type="number" 
                      className="form-control"
                      value={editForm.daily_meal_deficit}
                      onChange={(e) => setEditForm(prev => ({ ...prev, daily_meal_deficit: parseInt(e.target.value, 10) }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Active Beneficiary Count</label>
                    <input 
                      type="number" 
                      className="form-control"
                      value={editForm.beneficiary_count}
                      onChange={(e) => setEditForm(prev => ({ ...prev, beneficiary_count: parseInt(e.target.value, 10) }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Dietary Restriction</label>
                    <select 
                      className="form-control"
                      value={editForm.dietary_preference}
                      onChange={(e) => setEditForm(prev => ({ ...prev, dietary_preference: e.target.value }))}
                    >
                      <option value="ANY">Any / Open</option>
                      <option value="VEG_ONLY">Strictly Vegetarian Only</option>
                      <option value="VEGAN_ONLY">Vegan Only</option>
                      <option value="HALAL_ONLY">Halal Only</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Max Transit Radius (km)</label>
                    <input 
                      type="number" 
                      className="form-control"
                      value={editForm.max_distance_km}
                      onChange={(e) => setEditForm(prev => ({ ...prev, max_distance_km: parseFloat(e.target.value) }))}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Preferred Categories (comma-separated)</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={editForm.preferred_categories}
                      onChange={(e) => setEditForm(prev => ({ ...prev, preferred_categories: e.target.value }))}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', gap: '20px', flexDirection: 'row' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={editForm.has_refrigeration}
                        onChange={(e) => setEditForm(prev => ({ ...prev, has_refrigeration: e.target.checked }))}
                      />
                      <span>Refrigeration Available</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={editForm.transport_available}
                        onChange={(e) => setEditForm(prev => ({ ...prev, transport_available: e.target.checked }))}
                      />
                      <span>Own Pickup Vehicle</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Check size={15} /> Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
