import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  CheckCircle, 
  Clock, 
  Key, 
  MapPin, 
  Phone, 
  AlertCircle, 
  Check, 
  X, 
  ShieldCheck 
} from 'lucide-react';
import { getClaims, updateClaimStatus } from '../services/api';

export default function PickupTracking() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [otpModalClaim, setOtpModalClaim] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [alert, setAlert] = useState(null);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const data = await getClaims({ status: statusFilter });
      setClaims(data.claims || []);
    } catch (err) {
      console.error('Failed to fetch claims:', err);
      setAlert({ type: 'danger', message: 'Could not load donation claims from backend.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [statusFilter]);

  const handleStatusTransition = async (claimId, newStatus, otp = null) => {
    try {
      await updateClaimStatus(claimId, newStatus, otp);
      setAlert({ type: 'success', message: `Donation claim transitioned to ${newStatus} successfully.` });
      setOtpModalClaim(null);
      setEnteredOtp('');
      fetchClaims();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Status transition error.' });
    }
  };

  const getStepClass = (currentStatus, step) => {
    const sequence = ['REQUESTED', 'ACCEPTED', 'PICKED_UP', 'COMPLETED'];
    const currIdx = sequence.indexOf(currentStatus);
    const stepIdx = sequence.indexOf(step);
    if (currIdx >= stepIdx) return 'active';
    return '';
  };

  return (
    <div>
      {/* Alert */}
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          <AlertCircle size={16} />
          <span>{alert.message}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setAlert(null)}>×</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Pickup Coordination & Donation Tracking</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Module 1 & 4: Logistics workflow, OTP-verified chain of custody, and real-time status management
          </p>
        </div>

        <select 
          className="form-control" 
          style={{ width: '180px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Pipeline Stages</option>
          <option value="REQUESTED">Requested</option>
          <option value="ACCEPTED">Accepted / Ready</option>
          <option value="PICKED_UP">In Transit</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '30px', textAlign: 'center' }}>Loading donation pickup claims...</div>
      ) : claims.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No active pickup records found in this category.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {claims.map((claim) => (
            <div key={claim.claim_id} className="card">
              <div className="card-header" style={{ background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Truck size={18} color="var(--primary)" />
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>{claim.food_name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                      Claim ID: {claim.claim_id}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge badge-${claim.status.toLowerCase()}`}>
                    {claim.status}
                  </span>
                  <div style={{ background: '#fef3c7', border: '1px dashed #f59e0b', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, color: '#92400e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Key size={12} />
                    <span>OTP: {claim.verification_otp}</span>
                  </div>
                </div>
              </div>

              <div className="card-body">
                {/* Visual Step Tracker */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0 24px', position: 'relative' }}>
                  {['REQUESTED', 'ACCEPTED', 'PICKED_UP', 'COMPLETED'].map((step, idx) => {
                    const isDone = ['REQUESTED', 'ACCEPTED', 'PICKED_UP', 'COMPLETED'].indexOf(claim.status) >= idx;
                    return (
                      <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: isDone ? 'var(--primary)' : '#e2e8f0',
                          color: isDone ? '#fff' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          zIndex: 2
                        }}>
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <span style={{ fontSize: '11px', marginTop: '6px', fontWeight: isDone ? 600 : 400, color: isDone ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {step.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Logistics Information */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Donor Facility</div>
                    <div style={{ fontWeight: 600 }}>{claim.donor_name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{claim.pickup_address}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Phone: {claim.donor_phone}</div>
                  </div>

                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Recipient Partner</div>
                    <div style={{ fontWeight: 600 }}>{claim.recipient_name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Coordinator: {claim.recipient_contact}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Phone: {claim.recipient_phone}</div>
                  </div>

                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Surplus Allocation</div>
                    <div style={{ fontWeight: 600 }}>{claim.requested_quantity} {claim.quantity_unit} (~{claim.approx_servings} servings)</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Requested: {new Date(claim.created_at).toLocaleDateString()}</div>
                    <div style={{ color: '#166534', fontSize: '12px', fontWeight: 500 }}>
                      {claim.completion_time ? `Delivered: ${new Date(claim.completion_time).toLocaleTimeString()}` : 'Awaiting physical collection'}
                    </div>
                  </div>
                </div>

                {/* Workflow Actions */}
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  {claim.status === 'REQUESTED' && (
                    <>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => handleStatusTransition(claim.claim_id, 'REJECTED')}
                      >
                        <X size={13} /> Reject Request
                      </button>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleStatusTransition(claim.claim_id, 'ACCEPTED')}
                      >
                        <Check size={13} /> Accept & Authorize Pickup
                      </button>
                    </>
                  )}

                  {claim.status === 'ACCEPTED' && (
                    <button 
                      className="btn btn-accent btn-sm"
                      onClick={() => handleStatusTransition(claim.claim_id, 'PICKED_UP')}
                    >
                      <Truck size={13} /> Mark In Transit
                    </button>
                  )}

                  {claim.status === 'PICKED_UP' && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => setOtpModalClaim(claim)}
                    >
                      <ShieldCheck size={13} /> Verify Handover OTP & Complete
                    </button>
                  )}

                  {claim.status === 'COMPLETED' && (
                    <span style={{ fontSize: '12px', color: '#166534', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <CheckCircle size={15} /> Handover Completed & Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OTP Verification Modal */}
      {otpModalClaim && (
        <div className="modal-backdrop">
          <div className="modal-dialog" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <span className="card-title">Verify Physical Handover</span>
              <button style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }} onClick={() => setOtpModalClaim(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Enter the 6-digit verification code provided by <strong>{otpModalClaim.recipient_name}</strong> to authenticate the delivery.
              </p>

              <div className="form-group">
                <label className="form-label">Handover OTP Code (Code: {otpModalClaim.verification_otp})</label>
                <input 
                  type="text" 
                  className="form-control"
                  style={{ fontSize: '20px', letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold' }}
                  maxLength="6"
                  placeholder="000000"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setOtpModalClaim(null)}>Cancel</button>
              <button 
                className="btn btn-primary"
                disabled={enteredOtp.length !== 6}
                onClick={() => handleStatusTransition(otpModalClaim.claim_id, 'COMPLETED', enteredOtp)}
              >
                Confirm Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
