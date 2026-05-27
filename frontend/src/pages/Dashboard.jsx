import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Download, Clock, HardDrive, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_URL}/api/history`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to load history');
        }
        const data = await response.json();
        setHistory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [token]);

  return (
    <div style={{ flex: 1, width: '100%', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }} className="container">
      <div className="glass-panel animate-slide-up dashboard-header-panel">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{user.email}</span></p>
        </div>
        <button onClick={logout} className="neon-button" style={{ background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.2)', padding: '10px 20px' }}>
          Sign Out
        </button>
      </div>

      <div className="glass-panel animate-slide-up dashboard-history-panel" style={{ animationDelay: '0.1s' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Clock color="var(--accent-blue)" /> Download History
        </h2>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading history...</div>
        ) : error ? (
          <div style={{ padding: '16px', background: 'rgba(255, 50, 50, 0.1)', border: '1px solid rgba(255, 50, 50, 0.2)', borderRadius: '12px', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={20} /> {error}
          </div>
        ) : history.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
            <Download size={48} color="var(--text-secondary)" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>No downloads yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>Your downloaded videos will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-item-details">
                  <h4 style={{ fontWeight: '600', fontSize: '1.1rem', wordBreak: 'break-word' }}>{item.title}</h4>
                  <div className="history-item-meta">
                    <span>Platform: {item.platform}</span>
                    <span>Format: {item.format_id}</span>
                    <span>Date: {new Date(item.downloaded_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    fontSize: '0.8rem', 
                    fontWeight: '600',
                    background: item.status === 'completed' || item.status === 'finished' ? 'rgba(32, 201, 151, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                    color: item.status === 'completed' || item.status === 'finished' ? '#20c997' : 'var(--text-secondary)',
                    display: 'inline-block',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
