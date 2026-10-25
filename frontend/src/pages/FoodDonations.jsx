import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Search, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Trash2, 
  Eye, 
  Filter,
  Check
} from 'lucide-react';
import { getDonations, createDonation, deleteDonation, updateDonationStatus } from '../services/api';

export default function FoodDonations({ onSelectForMatching }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [alert, setAlert] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    food_name: '',
    category: 'COOKED_MEAL',
    dietary_type: 'VEG',
    quantity: '',
    quantity_unit: 'KG',
    approx_servings: '',
    preparation_time: new Date().toISOString().slice(0, 16),
    expiry_time: '',
    pickup_address: '124 Old Airport Road, Indiranagar, Bangalore',
    pickup_latitude: 12.9602,
    pickup_longitude: 77.6434,
    allergens: 'None',
    storage_condition: 'ROOM_TEMP',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState({});

  const fetchListings = async () => {
    try {
      setLoading(true);
      const data = await getDonations({
        category: categoryFilter,
        status: statusFilter,
        search
      });
      setListings(data.listings || []);
    } catch (err) {
      console.error('Failed to fetch food listings:', err);
      setAlert({ type: 'danger', message: 'Failed to retrieve food listings from backend.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [categoryFilter, statusFilter, search]);

  // Quick preset helper for future expiry deadline
  const setExpiryPreset = (hours) => {
    const d = new Date(Date.now() + hours * 3600000);
    // Format to YYYY-MM-DDTHH:mm for datetime-local input
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setFormData(prev => ({ ...prev, expiry_time: localIso }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error on edit
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.food_name.trim()) errors.food_name = 'Food item title is required';
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) errors.quantity = 'Quantity must be greater than 0';
    if (!formData.approx_servings || parseInt(formData.approx_servings, 10) <= 0) errors.approx_servings = 'Approx servings must be greater than 0';
    
    if (!formData.expiry_time) {
      errors.expiry_time = 'Collection deadline / expiry time is required';
    } else {
      const expDate = new Date(formData.expiry_time);
      if (expDate <= new Date()) {
        errors.expiry_time = 'Expiry deadline must be set in the future';
      }
    }

    if (!formData.pickup_address.trim()) errors.pickup_address = 'Pickup address is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setAlert({ type: 'danger', message: 'Please correct the validation errors in the food donation form.' });
      return;
    }

    try {
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        approx_servings: parseInt(formData.approx_servings, 10),
        pickup_latitude: parseFloat(formData.pickup_latitude),
        pickup_longitude: parseFloat(formData.pickup_longitude),
        expiry_time: new Date(formData.expiry_time).toISOString()
      };

      await createDonation(payload);
      setAlert({ type: 'success', message: 'Food donation entry successfully validated and stored in relational database!' });
      setShowAddForm(false);
      // Reset form
      setFormData({
        food_name: '',
        category: 'COOKED_MEAL',
        dietary_type: 'VEG',
        quantity: '',
        quantity_unit: 'KG',
        approx_servings: '',
        preparation_time: new Date().toISOString().slice(0, 16),
        expiry_time: '',
        pickup_address: '124 Old Airport Road, Indiranagar, Bangalore',
        pickup_latitude: 12.9602,
        pickup_longitude: 77.6434,
        allergens: 'None',
        storage_condition: 'ROOM_TEMP',
        notes: ''
      });
      fetchListings();
    } catch (err) {
      console.error('Submit error:', err);
      const msg = err.errors ? err.errors.map(e => e.message).join(', ') : err.message || 'Error creating listing';
      setAlert({ type: 'danger', message: msg });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this food donation listing?')) return;
    try {
      await deleteDonation(id);
      setAlert({ type: 'success', message: 'Listing successfully removed.' });
      fetchListings();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Unauthorized or failed to delete.' });
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDonationStatus(id, newStatus);
      setAlert({ type: 'success', message: `Listing status updated to ${newStatus}` });
      fetchListings();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Status transition failed.' });
    }
  };

  return (
    <div>
      {/* Alert Notification */}
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span>{alert.message}</span>
          <button 
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => setAlert(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Header & Action Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Food Donation Management</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Module 1: Data Engineering — Structured food intake, validation, and relational storage
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (!formData.expiry_time) setExpiryPreset(6); // Default 6 hours ahead
          }}
        >
          <PlusCircle size={16} />
          <span>{showAddForm ? 'Close Donation Form' : 'New Food Donation Entry'}</span>
        </button>
      </div>

      {/* Screenshot 4.1 & 7.1 Target: Food Donation Data Input Interface */}
      {showAddForm && (
        <div className="card" id="food-donation-input-interface" style={{ border: '2px solid var(--primary)' }}>
          <div className="card-header" style={{ background: '#f0fdf4' }}>
            <span className="card-title">
              <PlusCircle size={18} color="var(--primary)" />
              Food Donation Data Input Interface (Module 1 & 4)
            </span>
            <span style={{ fontSize: '12px', background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
              Schema Validation Active
            </span>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {/* Food Name */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Food Title / Dish Description *</label>
                  <input
                    type="text"
                    name="food_name"
                    className={`form-control ${formErrors.food_name ? 'is-invalid' : ''}`}
                    placeholder="e.g. Vegetable Biryani & Dal Fry (Fresh Cooked Surplus)"
                    value={formData.food_name}
                    onChange={handleInputChange}
                  />
                  {formErrors.food_name && <div className="invalid-feedback">{formErrors.food_name}</div>}
                </div>

                {/* Category */}
                <div className="form-group">
                  <label className="form-label">Food Category *</label>
                  <select name="category" className="form-control" value={formData.category} onChange={handleInputChange}>
                    <option value="COOKED_MEAL">Cooked Meal (High Perishability)</option>
                    <option value="BAKERY">Bakery & Dry Goods (Medium-Low)</option>
                    <option value="PRODUCE">Fresh Produce & Raw (Medium)</option>
                    <option value="PACKAGED_GOODS">Packaged Non-Perishables (Low)</option>
                  </select>
                </div>

                {/* Dietary Classification */}
                <div className="form-group">
                  <label className="form-label">Dietary Classification *</label>
                  <select name="dietary_type" className="form-control" value={formData.dietary_type} onChange={handleInputChange}>
                    <option value="VEG">Vegetarian (Pure Veg)</option>
                    <option value="NON_VEG">Non-Vegetarian</option>
                    <option value="VEGAN">100% Vegan</option>
                    <option value="JAIN">Jain (No Root Vegetables)</option>
                  </select>
                </div>

                {/* Quantity */}
                <div className="form-group">
                  <label className="form-label">Available Quantity *</label>
                  <input
                    type="number"
                    step="0.5"
                    name="quantity"
                    className={`form-control ${formErrors.quantity ? 'is-invalid' : ''}`}
                    placeholder="e.g. 25"
                    value={formData.quantity}
                    onChange={handleInputChange}
                  />
                  {formErrors.quantity && <div className="invalid-feedback">{formErrors.quantity}</div>}
                </div>

                {/* Quantity Unit */}
                <div className="form-group">
                  <label className="form-label">Measurement Unit *</label>
                  <select name="quantity_unit" className="form-control" value={formData.quantity_unit} onChange={handleInputChange}>
                    <option value="KG">Kilograms (KG)</option>
                    <option value="SERVINGS">Servings / Portions</option>
                    <option value="PACKETS">Packets / Boxes</option>
                    <option value="TRAYS">Gastronorm Trays</option>
                  </select>
                </div>

                {/* Servings */}
                <div className="form-group">
                  <label className="form-label">Approximate Person Servings *</label>
                  <input
                    type="number"
                    name="approx_servings"
                    className={`form-control ${formErrors.approx_servings ? 'is-invalid' : ''}`}
                    placeholder="e.g. 75"
                    value={formData.approx_servings}
                    onChange={handleInputChange}
                  />
                  {formErrors.approx_servings && <div className="invalid-feedback">{formErrors.approx_servings}</div>}
                </div>

                {/* Expiry Time with Quick Presets */}
                <div className="form-group">
                  <label className="form-label">
                    Collection Deadline / Expiry Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="expiry_time"
                    className={`form-control ${formErrors.expiry_time ? 'is-invalid' : ''}`}
                    value={formData.expiry_time}
                    onChange={handleInputChange}
                  />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setExpiryPreset(3)}>+3h</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setExpiryPreset(6)}>+6h</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setExpiryPreset(24)}>+24h</button>
                  </div>
                  {formErrors.expiry_time && <div className="invalid-feedback">{formErrors.expiry_time}</div>}
                </div>

                {/* Pickup Address */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Pickup Address & Kitchen Location *</label>
                  <input
                    type="text"
                    name="pickup_address"
                    className={`form-control ${formErrors.pickup_address ? 'is-invalid' : ''}`}
                    value={formData.pickup_address}
                    onChange={handleInputChange}
                  />
                  {formErrors.pickup_address && <div className="invalid-feedback">{formErrors.pickup_address}</div>}
                </div>

                {/* Storage Condition */}
                <div className="form-group">
                  <label className="form-label">Storage Condition</label>
                  <select name="storage_condition" className="form-control" value={formData.storage_condition} onChange={handleInputChange}>
                    <option value="ROOM_TEMP">Ambient / Room Temperature</option>
                    <option value="REFRIGERATED">Refrigerated (2°C - 5°C)</option>
                    <option value="FROZEN">Deep Frozen (&lt; -18°C)</option>
                  </select>
                </div>

                {/* Allergens */}
                <div className="form-group">
                  <label className="form-label">Allergen Declarations</label>
                  <input
                    type="text"
                    name="allergens"
                    className="form-control"
                    placeholder="e.g. Dairy, Gluten, Peanuts, None"
                    value={formData.allergens}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Notes */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Operational Notes & Handover Instructions</label>
                  <textarea
                    name="notes"
                    className="form-control"
                    rows="2"
                    placeholder="e.g. Stored in hygienic food warmer containers; please bring insulated thermal crates for pickup."
                    value={formData.notes}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} /> Validate & Store Food Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              style={{ width: '280px', paddingLeft: '32px' }}
              placeholder="Search food, donor, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
          </div>

          <select 
            className="form-control" 
            style={{ width: '160px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="COOKED_MEAL">Cooked Meals</option>
            <option value="BAKERY">Bakery Goods</option>
            <option value="PRODUCE">Fresh Produce</option>
            <option value="PACKAGED_GOODS">Packaged Goods</option>
          </select>

          <select 
            className="form-control" 
            style={{ width: '140px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="CLAIMED">Claimed</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Showing <strong>{listings.length}</strong> stored records
        </div>
      </div>

      {/* Screenshot 4.2 Target: Stored Food Donation Records */}
      <div className="card" id="stored-food-donation-records">
        <div className="card-header">
          <span className="card-title">Stored Food Donation Records (Database Relational Table)</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Auto-refreshed from SQLite / PostgreSQL</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>Loading stored donation records...</div>
          ) : listings.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No food donation records match your query.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Food Item & Description</th>
                    <th>Donor Organization</th>
                    <th>Category & Dietary</th>
                    <th>Quantity / Servings</th>
                    <th>Collection Deadline</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((item) => {
                    const isAvailable = item.status === 'AVAILABLE';
                    const expDate = new Date(item.expiry_time);
                    const isExpired = expDate <= new Date();

                    return (
                      <tr key={item.listing_id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.food_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {item.listing_id}</div>
                        </td>
                        <td>
                          <div>{item.donor_org_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.donor_address}</div>
                        </td>
                        <td>
                          <span className={`badge badge-${item.category.toLowerCase().slice(0, 6)}`}>
                            {item.category.replace('_', ' ')}
                          </span>
                          <span style={{ marginLeft: '4px', fontSize: '11px', background: '#e2e8f0', padding: '2px 5px', borderRadius: '4px' }}>
                            {item.dietary_type}
                          </span>
                        </td>
                        <td>
                          <strong>{item.quantity} {item.quantity_unit}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>~{item.approx_servings} meals</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: isExpired ? 'var(--danger)' : 'var(--text-primary)' }}>
                            <Clock size={13} />
                            {expDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${item.status.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {isAvailable && (
                              <button 
                                className="btn btn-primary btn-sm"
                                title="Run AI Recommendation Engine"
                                onClick={() => onSelectForMatching(item.listing_id)}
                              >
                                <Sparkles size={13} /> Match
                              </button>
                            )}

                            {item.status === 'AVAILABLE' && (
                              <button 
                                className="btn btn-outline btn-sm"
                                title="Mark as Expired"
                                onClick={() => handleStatusChange(item.listing_id, 'EXPIRED')}
                              >
                                Expire
                              </button>
                            )}

                            <button 
                              className="btn btn-danger btn-sm"
                              title="Delete record"
                              onClick={() => handleDelete(item.listing_id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
