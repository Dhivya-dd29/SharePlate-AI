import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Sliders, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { getDonations, getMatchingRecommendations, createClaim } from '../services/api';

export default function AIMatching({ preselectedListingId, onClaimSuccess }) {
  const [listings, setListings] = useState([]);
  const [selectedListingId, setSelectedListingId] = useState(preselectedListingId || '');
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(null);
  const [alert, setAlert] = useState(null);

  // Configurable weights state (defaults match DEFAULT_WEIGHTS in matcher.py)
  const [weights, setWeights] = useState({
    category: 0.25,
    quantity: 0.20,
    distance: 0.25,
    demand: 0.15,
    collection_time: 0.15
  });

  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    async function loadAvailableListings() {
      try {
        const data = await getDonations({ status: 'AVAILABLE' });
        const items = data.listings || [];
        setListings(items);
        if (items.length > 0 && !selectedListingId) {
          setSelectedListingId(items[0].listing_id);
        }
      } catch (err) {
        console.error('Failed to load listings:', err);
      }
    }
    loadAvailableListings();
  }, []);

  useEffect(() => {
    if (preselectedListingId) {
      setSelectedListingId(preselectedListingId);
    }
  }, [preselectedListingId]);

  const selectedListing = listings.find(l => l.listing_id === selectedListingId);

  const handleRunMatching = async () => {
    if (!selectedListingId) {
      setAlert({ type: 'warning', message: 'Please select an available food donation listing first.' });
      return;
    }

    try {
      setLoading(true);
      setAlert(null);
      const res = await getMatchingRecommendations(selectedListingId, weights);
      setRecommendations(res.recommendations || []);
    } catch (err) {
      console.error('Matching error:', err);
      setAlert({ type: 'danger', message: err.message || 'AI Matching Engine returned an error.' });
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (recipOrgId, recipName) => {
    try {
      setClaiming(recipOrgId);
      const claimRes = await createClaim({
        listing_id: selectedListingId,
        recipient_org_id: recipOrgId,
        requested_quantity: selectedListing.quantity,
        notes: `Automated match match claim allocated to ${recipName}`
      });

      setAlert({
        type: 'success',
        message: `Donation claimed for ${recipName}! Handover OTP: ${claimRes.claim.verification_otp}`
      });

      // Refresh listings
      const updatedData = await getDonations({ status: 'AVAILABLE' });
      setListings(updatedData.listings || []);
      setRecommendations(null);

      if (onClaimSuccess) {
        setTimeout(() => onClaimSuccess(), 1500);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to submit claim.' });
    } finally {
      setClaiming(null);
    }
  };

  const handleWeightChange = (key, val) => {
    const floatVal = parseFloat(val);
    setWeights(prev => ({ ...prev, [key]: floatVal }));
  };

  return (
    <div>
      {/* Alert banner */}
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{alert.message}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setAlert(null)}>×</button>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>AI-Based Food Donation Matching</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Module 3: AI Engineering — Transparent multi-criteria weighted scoring algorithm with explainable recommendations
          </p>
        </div>

        <button 
          className="btn btn-outline btn-sm"
          onClick={() => setShowConfig(!showConfig)}
        >
          <Sliders size={14} />
          <span>{showConfig ? 'Hide Scoring Weights' : 'Configure Scoring Weights'}</span>
        </button>
      </div>

      {/* Screenshot 6.1 Target: AI-Based Food Donation Matching Dashboard */}
      <div className="card" id="ai-matching-dashboard">
        <div className="card-header" style={{ background: '#f8fafc' }}>
          <span className="card-title">
            <Cpu size={18} color="var(--primary)" />
            AI-Based Food Donation Matching Dashboard (Module 3)
          </span>
          <span style={{ fontSize: '12px', background: '#ecfdf5', color: '#047857', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
            Scikit-learn & Haversine Multi-Criteria Engine
          </span>
        </div>
        <div className="card-body">
          {/* Listing Selector & Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Select Active Food Listing for Matching:</label>
              <select 
                className="form-control"
                value={selectedListingId}
                onChange={(e) => {
                  setSelectedListingId(e.target.value);
                  setRecommendations(null);
                }}
              >
                {listings.length === 0 ? (
                  <option value="">No available listings</option>
                ) : (
                  listings.map(l => (
                    <option key={l.listing_id} value={l.listing_id}>
                      {l.food_name} ({l.quantity} {l.quantity_unit} - {l.donor_org_name})
                    </option>
                  ))
                )}
              </select>
            </div>

            {selectedListing && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px 18px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '15px', color: '#166534' }}>
                    {selectedListing.food_name}
                  </span>
                  <span className="badge badge-available">Status: {selectedListing.status}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12.5px', color: '#14532d', flexWrap: 'wrap' }}>
                  <span><strong>Donor:</strong> {selectedListing.donor_org_name}</span>
                  <span><strong>Quantity:</strong> {selectedListing.quantity} {selectedListing.quantity_unit} (~{selectedListing.approx_servings} meals)</span>
                  <span><strong>Diet:</strong> {selectedListing.dietary_type}</span>
                  <span><strong>Category:</strong> {selectedListing.category.replace('_', ' ')}</span>
                  <span><strong>Expires:</strong> {new Date(selectedListing.expiry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            )}
          </div>

          {/* Configurable Weights Drawer */}
          {showConfig && (
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={14} /> Multi-Criteria Utility Scoring Weights (Must normalize to 1.0)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div>
                  <label className="form-label">Category Match ({Math.round(weights.category * 100)}%)</label>
                  <input type="range" min="0.05" max="0.5" step="0.05" value={weights.category} onChange={(e) => handleWeightChange('category', e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label">Quantity Match ({Math.round(weights.quantity * 100)}%)</label>
                  <input type="range" min="0.05" max="0.5" step="0.05" value={weights.quantity} onChange={(e) => handleWeightChange('quantity', e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label">Geospatial Distance ({Math.round(weights.distance * 100)}%)</label>
                  <input type="range" min="0.05" max="0.5" step="0.05" value={weights.distance} onChange={(e) => handleWeightChange('distance', e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label">Demand Priority ({Math.round(weights.demand * 100)}%)</label>
                  <input type="range" min="0.05" max="0.5" step="0.05" value={weights.demand} onChange={(e) => handleWeightChange('demand', e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label">Collection Window ({Math.round(weights.collection_time * 100)}%)</label>
                  <input type="range" min="0.05" max="0.5" step="0.05" value={weights.collection_time} onChange={(e) => handleWeightChange('collection_time', e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          )}

          {/* Execute Matching Button */}
          <div style={{ textAlign: 'center', margin: '10px 0' }}>
            <button 
              className="btn btn-primary"
              style={{ padding: '10px 24px', fontSize: '15px' }}
              disabled={loading || !selectedListingId}
              onClick={handleRunMatching}
            >
              <Sparkles size={18} />
              <span>{loading ? 'Evaluating Compatibility Matrix...' : 'Run AI Recommendation Engine'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Screenshot 6.2 Target: Recipient Recommendation and Matching Results */}
      {recommendations && (
        <div className="card" id="recipient-recommendations">
          <div className="card-header">
            <span className="card-title">
              <TrendingUp size={18} color="var(--primary)" />
              Recipient Recommendation & Multi-Criteria Matching Results (Module 3)
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Ranked {recommendations.length} candidate recipient organizations
            </span>
          </div>

          <div className="card-body">
            {recommendations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                No candidate recipients satisfied the compatibility constraints (e.g., dietary restriction conflict or expired deadline).
              </div>
            ) : (
              recommendations.map((rec, index) => {
                const scoreClass = rec.overall_score >= 80 ? 'score-high' : (rec.overall_score >= 60 ? 'score-medium' : 'score-low');
                const isClaimingThis = claiming === rec.recipient_org_id;

                return (
                  <div key={rec.recipient_org_id} className="rec-card">
                    <div className="rec-header">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: '#1e293b', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                            #{index + 1}
                          </span>
                          <span className="rec-org-name">{rec.recipient_name}</span>
                          <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{rec.org_type}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', marginLeft: '32px' }}>
                          {rec.address} • Contact: {rec.contact_person} ({rec.contact_phone})
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className={`match-score-pill ${scoreClass}`}>
                          <Sparkles size={14} />
                          <span>{rec.overall_score}% Match</span>
                        </div>

                        <button 
                          className="btn btn-primary btn-sm"
                          disabled={isClaimingThis}
                          onClick={() => handleClaim(rec.recipient_org_id, rec.recipient_name)}
                        >
                          <Check size={14} />
                          <span>{isClaimingThis ? 'Claiming...' : 'Claim For This NGO'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Multi-Criteria Breakdown Progress Bars */}
                    <div className="score-breakdown-grid">
                      <div className="score-item">
                        <span className="score-item-label">Category Fit: {rec.scores_breakdown.category_compatibility}%</span>
                        <div className="score-bar-bg">
                          <div className="score-bar-fill" style={{ width: `${rec.scores_breakdown.category_compatibility}%` }}></div>
                        </div>
                      </div>

                      <div className="score-item">
                        <span className="score-item-label">Quantity Match: {rec.scores_breakdown.quantity_suitability}%</span>
                        <div className="score-bar-bg">
                          <div className="score-bar-fill" style={{ width: `${rec.scores_breakdown.quantity_suitability}%` }}></div>
                        </div>
                      </div>

                      <div className="score-item">
                        <span className="score-item-label">Proximity ({rec.metrics.distance_km} km): {rec.scores_breakdown.distance_score}%</span>
                        <div className="score-bar-bg">
                          <div className="score-bar-fill" style={{ width: `${rec.scores_breakdown.distance_score}%` }}></div>
                        </div>
                      </div>

                      <div className="score-item">
                        <span className="score-item-label">Demand Need: {rec.scores_breakdown.demand_priority}%</span>
                        <div className="score-bar-bg">
                          <div className="score-bar-fill" style={{ width: `${rec.scores_breakdown.demand_priority}%` }}></div>
                        </div>
                      </div>

                      <div className="score-item">
                        <span className="score-item-label">Collection Window ({rec.metrics.hours_remaining}h): {rec.scores_breakdown.collection_time_score}%</span>
                        <div className="score-bar-bg">
                          <div className="score-bar-fill" style={{ width: `${rec.scores_breakdown.collection_time_score}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Explainable AI (XAI) Textual Rationale */}
                    <div className="rec-explanation">
                      <strong>Explainable Rationale:</strong> {rec.explanation}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
