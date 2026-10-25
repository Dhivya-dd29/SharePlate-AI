/**
 * SharePlate AI: Frontend API Service
 * Centralized HTTP Client for Backend Communication
 */

const API_BASE = 'http://localhost:5000/api';

// Current session role for demonstration: DONOR | RECIPIENT | ADMIN
let currentRole = localStorage.getItem('shareplate_role') || 'DONOR';
let currentOrgId = localStorage.getItem('shareplate_org_id') || 'org-donor-001';
let currentToken = localStorage.getItem('shareplate_token') || null;

export const session = {
  getRole: () => currentRole,
  getOrgId: () => currentOrgId,
  getToken: () => currentToken,
  setRole: (role, orgId = null) => {
    currentRole = role;
    localStorage.setItem('shareplate_role', role);
    if (orgId) {
      currentOrgId = orgId;
      localStorage.setItem('shareplate_org_id', orgId);
    } else {
      if (role === 'DONOR') currentOrgId = 'org-donor-001';
      else if (role === 'RECIPIENT') currentOrgId = 'org-recip-001';
      else currentOrgId = null;
      if (currentOrgId) localStorage.setItem('shareplate_org_id', currentOrgId);
      else localStorage.removeItem('shareplate_org_id');
    }
  },
  setAuth: (token, role, orgId) => {
    currentToken = token;
    currentRole = role;
    currentOrgId = orgId;
    if (token) localStorage.setItem('shareplate_token', token);
    else localStorage.removeItem('shareplate_token');
    localStorage.setItem('shareplate_role', role);
    if (orgId) localStorage.setItem('shareplate_org_id', orgId);
  }
};

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-user-role': session.getRole(),
    'x-user-id': session.getRole() === 'DONOR' ? 'usr-donor-01' : (session.getRole() === 'RECIPIENT' ? 'usr-recip-01' : 'usr-admin-01'),
    ...options.headers
  };

  const orgId = session.getOrgId();
  if (orgId) {
    headers['x-org-id'] = orgId;
  }

  const token = session.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw { status: res.status, ...data };
    }
    return data;
  } catch (err) {
    console.error(`[API Error ${options.method || 'GET'} ${endpoint}]:`, err);
    throw err;
  }
}

// Dashboard & Health
export const getDashboardStats = () => request('/impact/dashboard');
export const getSystemHealth = () => request('/health');
export const getAuditLogs = () => request('/impact/audit-logs');

// Food Donations
export const getDonations = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.category) params.append('category', filters.category);
  if (filters.dietary_type) params.append('dietary_type', filters.dietary_type);
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  const q = params.toString() ? `?${params.toString()}` : '';
  return request(`/donations${q}`);
};

export const getDonationById = (id) => request(`/donations/${id}`);
export const createDonation = (data) => request('/donations', { method: 'POST', body: JSON.stringify(data) });
export const updateDonationStatus = (id, status, notes = '') => 
  request(`/donations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, notes }) });
export const deleteDonation = (id) => request(`/donations/${id}`, { method: 'DELETE' });

// Recipient Organizations
export const getRecipients = () => request('/recipients');
export const getRecipientById = (id) => request(`/recipients/${id}`);
export const updateRecipientProfile = (id, profileData) => 
  request(`/recipients/${id}/profile`, { method: 'PUT', body: JSON.stringify(profileData) });
export const createRecipient = (data) => request('/recipients', { method: 'POST', body: JSON.stringify(data) });

// AI Matching Recommendations
export const getMatchingRecommendations = (listingId, customWeights = null) => 
  request(`/matching/recommend/${listingId}`, {
    method: 'POST',
    body: JSON.stringify({ custom_weights: customWeights })
  });
export const getEvaluationMetrics = () => request('/matching/evaluation');

// Pickups & Claims
export const getClaims = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.recipient_id) params.append('recipient_id', filters.recipient_id);
  const q = params.toString() ? `?${params.toString()}` : '';
  return request(`/pickups${q}`);
};

export const createClaim = (claimData) => 
  request('/pickups/claim', { method: 'POST', body: JSON.stringify(claimData) });

export const updateClaimStatus = (id, status, verificationOtp = null, notes = '') => 
  request(`/pickups/claim/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, verification_otp: verificationOtp, notes })
  });

// Authentication
export const login = (email, password) => 
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const register = (userData) => 
  request('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
export const getCurrentUser = () => request('/auth/me');
