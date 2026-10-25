import React from 'react';
import { PlusCircle, Activity } from 'lucide-react';

export default function Header({ pageTitle, currentRole, onQuickAction }) {
  const getRoleBadge = (role) => {
    switch (role) {
      case 'DONOR':
        return <span className="badge-role donor">Donor: Grand Orchid Hotel</span>;
      case 'RECIPIENT':
        return <span className="badge-role recipient">Recipient: Hope Children Foundation</span>;
      case 'ADMIN':
        return <span className="badge-role admin">Administrator Mode</span>;
      default:
        return <span className="badge-role">{role}</span>;
    }
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <h1 className="page-title">{pageTitle}</h1>
      </div>

      <div className="header-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: 500 }}>
          <Activity size={14} />
          <span>API Connected</span>
        </div>

        {getRoleBadge(currentRole)}

        {currentRole === 'DONOR' && (
          <button className="btn btn-primary btn-sm" onClick={onQuickAction}>
            <PlusCircle size={15} />
            <span>List Surplus Food</span>
          </button>
        )}
      </div>
    </header>
  );
}
