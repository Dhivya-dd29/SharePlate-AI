import React from 'react';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  HeartHandshake, 
  Sparkles, 
  Truck, 
  BarChart3, 
  ShieldCheck 
} from 'lucide-react';
import { session } from '../services/api';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'donations', label: 'Food Donations', icon: UtensilsCrossed },
  { id: 'recipients', label: 'Recipient Orgs', icon: HeartHandshake },
  { id: 'matching', label: 'AI Food Matching', icon: Sparkles },
  { id: 'pickups', label: 'Pickup Tracking', icon: Truck },
  { id: 'reports', label: 'Impact Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings & Security', icon: ShieldCheck },
];

export default function Sidebar({ activeTab, onTabChange, currentRole, onRoleChange }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">🍽️</div>
        <div className="sidebar-title">
          SharePlate <span>AI</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="role-switcher-card">
          <div className="role-switcher-label">Demonstration Role</div>
          <select 
            className="role-select" 
            value={currentRole} 
            onChange={(e) => onRoleChange(e.target.value)}
          >
            <option value="DONOR">🏢 Food Donor (Hotel/Hostel)</option>
            <option value="RECIPIENT">🤝 Recipient (NGO/Charity)</option>
            <option value="ADMIN">🛡️ Platform Administrator</option>
          </select>
        </div>
      </div>
    </aside>
  );
}
