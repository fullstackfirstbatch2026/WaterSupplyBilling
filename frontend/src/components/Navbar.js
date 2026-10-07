import React, { useState, useEffect } from 'react';
import { Droplets, Activity, Shield, User } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { auth } = useAuth();
  const [backendStatus, setBackendStatus] = useState('checking');

  const checkHealth = async () => {
    try {
      setBackendStatus('checking');
      await axios.get('/api/consumers', { timeout: 3000 });
      setBackendStatus('online');
    } catch (err) {
      if (err.response) {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const isConsumer = auth?.role === 'consumer';

  return (
    <header className="navbar-header">
      <div className="navbar-brand">
        <div className="brand-logo-glow">
          <Droplets className="brand-icon" size={26} />
        </div>
        <div className="brand-text">
          <div className="brand-title">AquaBill Pro</div>
          <div className="brand-subtitle">
            {isConsumer ? 'Consumer Portal' : auth?.role === 'admin' ? 'Admin Panel' : 'Municipal Water Supply & Billing'}
          </div>
        </div>
      </div>

      <div className="navbar-actions">
        {/* Role badge */}
        {auth && (
          <div className={`role-pill ${auth.role === 'admin' ? 'role-admin' : 'role-consumer'}`}>
            {auth.role === 'admin' ? <Shield size={13} /> : <User size={13} />}
            <span>{auth.role === 'admin' ? 'Administrator' : auth.consumer?.name}</span>
          </div>
        )}

        {/* Live Backend Indicator */}
        <div className={`status-pill status-${backendStatus}`} title="Spring Boot Backend (port 8083)">
          <span className="status-dot"></span>
          <span className="status-label">
            {backendStatus === 'online' && 'Server Online'}
            {backendStatus === 'checking' && 'Connecting...'}
            {backendStatus === 'offline' && 'Server Offline'}
          </span>
          <Activity size={14} className="status-icon" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
