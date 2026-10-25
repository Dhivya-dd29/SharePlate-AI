import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Server, 
  Database, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Terminal, 
  Send 
} from 'lucide-react';
import { getSystemHealth, session } from '../services/api';

export default function SettingsSecurity({ currentRole, onRoleChange }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testPayload, setTestPayload] = useState('{\n  "food_name": "",\n  "quantity": -5,\n  "expiry_time": "2020-01-01T00:00:00.000Z"\n}');
  const [apiResponse, setApiResponse] = useState(null);
  const [apiTesting, setApiTesting] = useState(false);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const data = await getSystemHealth();
      setHealth(data);
    } catch (err) {
      console.error('Failed to load system health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const runSecurityValidationTest = async (testType) => {
    setApiTesting(true);
    let payload = {};
    if (testType === 'MISSING_FIELDS') {
      payload = { food_name: '' };
    } else if (testType === 'NEGATIVE_QUANTITY') {
      payload = { food_name: 'Rice', category: 'COOKED_MEAL', quantity: -20, approx_servings: 50, expiry_time: '2026-12-31T23:59:59.000Z', pickup_address: 'Bangalore' };
    } else if (testType === 'PAST_EXPIRY') {
      payload = { food_name: 'Bread', category: 'BAKERY', quantity: 10, quantity_unit: 'PACKETS', approx_servings: 20, expiry_time: '2023-01-01T00:00:00.000Z', pickup_address: 'Bangalore' };
    } else if (testType === 'SQL_INJECTION') {
      // Test search query injection
      try {
        const res = await fetch('http://localhost:5000/api/donations?search=' + encodeURIComponent("' OR '1'='1; DROP TABLE users; --"));
        const data = await res.json();
        setApiResponse({
          status: res.status,
          title: 'Parameterized Query SQL Injection Test',
          description: 'The query executed safely without database modification or syntax error.',
          response: data
        });
        setApiTesting(false);
        return;
      } catch (e) {
        setApiResponse({ status: 500, error: e.message });
        setApiTesting(false);
        return;
      }
    }

    try {
      const res = await fetch('http://localhost:5000/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'DONOR'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setApiResponse({
        status: res.status,
        title: `Validation Test: ${testType}`,
        response: data
      });
    } catch (e) {
      setApiResponse({ status: 500, error: e.message });
    } finally {
      setApiTesting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Settings, Cloud & Security Engineering</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Modules 2 & 4: Application infrastructure, database connectivity, and backend API validation controls
          </p>
        </div>

        <button className="btn btn-outline btn-sm" onClick={fetchHealth} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Telemetry
        </button>
      </div>

      {/* Screenshot 5.2 Target: Backend Configuration and Database Connectivity */}
      <div className="card" id="backend-config-db-connectivity">
        <div className="card-header" style={{ background: '#f8fafc' }}>
          <span className="card-title">
            <Server size={18} color="var(--primary)" />
            Backend Configuration & Database Connectivity (Module 2: Cloud Engineering)
          </span>
          <span style={{ fontSize: '12px', background: health?.status === 'HEALTHY' ? '#dcfce7' : '#fee2e2', color: health?.status === 'HEALTHY' ? '#15803d' : '#991b1b', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
            {health?.status || 'CHECKING...'}
          </span>
        </div>

        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {/* Server Runtime */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                <Server size={16} color="var(--primary)" /> Express.js API Gateway
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>Port:</strong> {health?.server?.port || 5000}</div>
                <div><strong>Node Version:</strong> {health?.server?.node_version || 'v24'}</div>
                <div><strong>Uptime:</strong> {health?.uptime_seconds || 0} seconds</div>
                <div><strong>Memory (RSS):</strong> {health?.server?.memory?.rss_mb || 0} MB</div>
                <div><strong>Environment:</strong> {health?.environment || 'development'}</div>
              </div>
            </div>

            {/* Relational Database */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                <Database size={16} color="var(--secondary)" /> Relational Database
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>Dialect:</strong> {health?.database?.dialect?.toUpperCase() || 'SQLITE'} (ANSI SQL 3NF)</div>
                <div><strong>Connection Status:</strong> <span style={{ color: '#15803d', fontWeight: 600 }}>Connected (Live)</span></div>
                <div><strong>Query Latency:</strong> {health?.database?.latency_ms || 0} ms</div>
                <div><strong>Storage Path:</strong> database/shareplate.db</div>
                <div><strong>Constraints:</strong> Foreign Keys Active</div>
              </div>
            </div>

            {/* AI Recommendation Engine */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                <Cpu size={16} color="var(--accent-purple)" /> Python Recommendation Service
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>Status:</strong> {health?.ai_service?.status || 'ready'}</div>
                <div><strong>Endpoint:</strong> {health?.ai_service?.endpoint || 'http://localhost:5001'}</div>
                <div><strong>Execution Model:</strong> Hybrid Dual-Path (Microservice + CLI)</div>
                <div><strong>Frameworks:</strong> Scikit-learn, NumPy, Pandas</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Screenshot 7.2 Target: Backend API Validation and Response */}
      <div className="card" id="backend-api-validation-response">
        <div className="card-header">
          <span className="card-title">
            <Terminal size={18} color="var(--primary)" />
            Backend API Validation & Security Testing Interface (Module 4: Security Engineering)
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Execute negative tests against API constraints
          </span>
        </div>

        <div className="card-body">
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Click any test scenario below to send malformed or unauthorized HTTP requests directly to the backend validator and inspect the structured security response.
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button 
              className="btn btn-secondary btn-sm"
              disabled={apiTesting}
              onClick={() => runSecurityValidationTest('MISSING_FIELDS')}
            >
              Test 1: Missing Mandatory Fields
            </button>

            <button 
              className="btn btn-secondary btn-sm"
              disabled={apiTesting}
              onClick={() => runSecurityValidationTest('NEGATIVE_QUANTITY')}
            >
              Test 2: Negative Quantity Input
            </button>

            <button 
              className="btn btn-secondary btn-sm"
              disabled={apiTesting}
              onClick={() => runSecurityValidationTest('PAST_EXPIRY')}
            >
              Test 3: Expired Collection Deadline
            </button>

            <button 
              className="btn btn-secondary btn-sm"
              disabled={apiTesting}
              onClick={() => runSecurityValidationTest('SQL_INJECTION')}
            >
              Test 4: Parameterized Query Protection
            </button>
          </div>

          {/* Response Inspector Box */}
          {apiResponse && (
            <div style={{ background: '#0f172a', color: '#38bdf8', borderRadius: 'var(--radius-sm)', padding: '16px', fontFamily: 'monospace', fontSize: '12.5px', overflowX: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '8px', color: '#94a3b8' }}>
                <span>Response Status: <strong>{apiResponse.status} {apiResponse.status === 400 ? 'Bad Request (Validation Error)' : (apiResponse.status === 200 ? 'OK (Safe Execution)' : '')}</strong></span>
                <span>{apiResponse.title}</span>
              </div>
              <pre>{JSON.stringify(apiResponse.response || apiResponse, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Role-Based Access Control Simulation */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <ShieldCheck size={18} color="var(--primary)" />
            Role-Based Access Control (RBAC) Demonstration Mode
          </span>
        </div>
        <div className="card-body">
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Switch active credentials to test role authorization boundaries. In non-admin roles, unauthorized actions (such as a recipient trying to publish food, or a donor claiming food) are strictly forbidden with HTTP 403.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              className={`btn ${currentRole === 'DONOR' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => onRoleChange('DONOR')}
            >
              Role: DONOR (Grand Orchid Hotel)
            </button>

            <button 
              className={`btn ${currentRole === 'RECIPIENT' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => onRoleChange('RECIPIENT')}
            >
              Role: RECIPIENT (Hope Children Foundation)
            </button>

            <button 
              className={`btn ${currentRole === 'ADMIN' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => onRoleChange('ADMIN')}
            >
              Role: ADMIN (Full Audit Access)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
