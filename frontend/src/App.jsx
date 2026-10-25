import React, { useState } from 'react';
import './styles/theme.css';
import './styles/layout.css';
import './styles/components.css';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import FoodDonations from './pages/FoodDonations';
import RecipientOrganizations from './pages/RecipientOrganizations';
import AIMatching from './pages/AIMatching';
import PickupTracking from './pages/PickupTracking';
import ImpactReports from './pages/ImpactReports';
import SettingsSecurity from './pages/SettingsSecurity';

import { session } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState(session.getRole());
  const [preselectedListingId, setPreselectedListingId] = useState(null);

  const handleRoleChange = (newRole) => {
    session.setRole(newRole);
    setCurrentRole(newRole);
  };

  const handleNavigateToMatching = (listingId) => {
    setPreselectedListingId(listingId);
    setActiveTab('matching');
  };

  const handleClaimSuccess = () => {
    setActiveTab('pickups');
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'System Overview & Redistribution Metrics';
      case 'donations':
        return 'Surplus Food Donation Intake & Inventory';
      case 'recipients':
        return 'Verified Recipient Organizations';
      case 'matching':
        return 'Intelligent Multi-Criteria Matching Engine';
      case 'pickups':
        return 'Logistics Coordination & Pickup Tracking';
      case 'reports':
        return 'Impact Analytics & UN SDG 12.3 Reports';
      case 'settings':
        return 'Cloud Architecture & Security Engineering';
      default:
        return 'SharePlate AI';
    }
  };

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Header 
          pageTitle={getPageTitle()}
          currentRole={currentRole}
          onQuickAction={() => setActiveTab('donations')}
        />

        <main className="content-body">
          {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
          {activeTab === 'donations' && <FoodDonations onSelectForMatching={handleNavigateToMatching} />}
          {activeTab === 'recipients' && <RecipientOrganizations />}
          {activeTab === 'matching' && (
            <AIMatching 
              preselectedListingId={preselectedListingId} 
              onClaimSuccess={handleClaimSuccess} 
            />
          )}
          {activeTab === 'pickups' && <PickupTracking />}
          {activeTab === 'reports' && <ImpactReports />}
          {activeTab === 'settings' && (
            <SettingsSecurity 
              currentRole={currentRole} 
              onRoleChange={handleRoleChange} 
            />
          )}
        </main>
      </div>
    </div>
  );
}
