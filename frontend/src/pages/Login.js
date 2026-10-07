import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Shield, User, Eye, EyeOff, ChevronRight, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { consumerService } from '../services/api';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const { loginAsAdmin, loginAsConsumer } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState('consumer'); // 'consumer' | 'admin'
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [consumers, setConsumers] = useState([]);
  const [loadingConsumers, setLoadingConsumers] = useState(false);
  const [consumersLoaded, setConsumersLoaded] = useState(false);
  const [selectedConsumerId, setSelectedConsumerId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleTabSwitch = async (newTab) => {
    setTab(newTab);
    if (newTab === 'consumer' && !consumersLoaded) {
      setLoadingConsumers(true);
      try {
        const list = await consumerService.getAll();
        setConsumers(list);
        setConsumersLoaded(true);
        if (list.length > 0) setSelectedConsumerId(String(list[0].consumerId));
      } catch {
        toast.error('Could not connect to server. Make sure the backend is running.');
      } finally {
        setLoadingConsumers(false);
      }
    }
  };

  // Pre-load consumers on mount
  React.useEffect(() => {
    handleTabSwitch('consumer');
    // eslint-disable-next-line
  }, []);

  const handleConsumerLogin = () => {
    if (!selectedConsumerId) {
      toast.error('Please select your account');
      return;
    }
    const consumer = consumers.find((c) => String(c.consumerId) === selectedConsumerId);
    if (!consumer) return;
    setSubmitting(true);
    setTimeout(() => {
      loginAsConsumer(consumer);
      navigate('/portal/dashboard');
      setSubmitting(false);
    }, 500);
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      const ok = loginAsAdmin(adminPassword);
      if (ok) {
        navigate('/admin/dashboard');
      } else {
        toast.error('Incorrect admin password');
      }
      setSubmitting(false);
    }, 500);
  };

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-bg-decoration">
        <div className="login-blob login-blob-1" />
        <div className="login-blob login-blob-2" />
        <div className="login-blob login-blob-3" />
      </div>

      <div className="login-container">
        {/* Branding */}
        <div className="login-brand">
          <div className="login-brand-logo">
            <Droplets size={32} />
          </div>
          <div>
            <h1 className="login-brand-name">AquaBill Pro</h1>
            <p className="login-brand-tagline">Municipal Water Supply & Billing</p>
          </div>
        </div>

        {/* Card */}
        <div className="login-card">
          {/* Tab switcher */}
          <div className="login-tabs">
            <button
              className={`login-tab ${tab === 'consumer' ? 'login-tab-active' : ''}`}
              onClick={() => handleTabSwitch('consumer')}
            >
              <User size={16} />
              <span>Consumer Login</span>
            </button>
            <button
              className={`login-tab ${tab === 'admin' ? 'login-tab-active' : ''}`}
              onClick={() => handleTabSwitch('admin')}
            >
              <Shield size={16} />
              <span>Admin Login</span>
            </button>
          </div>

          {/* Consumer Tab */}
          {tab === 'consumer' && (
            <div className="login-form-section">
              <div className="login-form-header">
                <h2 className="login-form-title">Welcome Back</h2>
                <p className="login-form-subtitle">
                  Select your registered account to access your water billing portal.
                </p>
              </div>

              {loadingConsumers ? (
                <div className="login-loading">
                  <Loader size={24} className="spin" />
                  <span>Loading accounts...</span>
                </div>
              ) : consumers.length === 0 ? (
                <div className="login-empty-msg">
                  No consumer accounts found. Please contact your municipality.
                </div>
              ) : (
                <>
                  <div className="login-field-group">
                    <label className="login-label" htmlFor="consumer-select">
                      Select Your Account
                    </label>
                    <div className="login-select-wrapper">
                      <select
                        id="consumer-select"
                        className="login-select"
                        value={selectedConsumerId}
                        onChange={(e) => setSelectedConsumerId(e.target.value)}
                      >
                        <option value="">-- Choose your account --</option>
                        {consumers.map((c) => (
                          <option key={c.consumerId} value={String(c.consumerId)}>
                            {c.name} — {c.address}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedConsumerId && (() => {
                    const c = consumers.find((c) => String(c.consumerId) === selectedConsumerId);
                    return c ? (
                      <div className="login-consumer-preview">
                        <div className="login-consumer-avatar">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="login-consumer-name">{c.name}</div>
                          <div className="login-consumer-meta">{c.address} · {c.phone}</div>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  <button
                    className="login-btn-primary"
                    onClick={handleConsumerLogin}
                    disabled={submitting || !selectedConsumerId}
                  >
                    {submitting ? <Loader size={16} className="spin" /> : <ChevronRight size={16} />}
                    <span>{submitting ? 'Signing in...' : 'Access My Portal'}</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Admin Tab */}
          {tab === 'admin' && (
            <div className="login-form-section">
              <div className="login-form-header">
                <h2 className="login-form-title">Admin Access</h2>
                <p className="login-form-subtitle">
                  Enter your administrator credentials to manage the system.
                </p>
              </div>

              <form onSubmit={handleAdminLogin}>
                <div className="login-field-group">
                  <label className="login-label" htmlFor="admin-password">
                    Admin Password
                  </label>
                  <div className="login-password-wrapper">
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      className="login-input"
                      placeholder="Enter admin password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="login-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span className="login-hint">Default: admin123</span>
                </div>

                <button
                  type="submit"
                  className="login-btn-admin"
                  disabled={submitting}
                >
                  {submitting ? <Loader size={16} className="spin" /> : <Shield size={16} />}
                  <span>{submitting ? 'Authenticating...' : 'Sign in as Admin'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="login-footer-note">
          AquaBill Pro — Secure Municipal Water Billing System
        </p>
      </div>
    </div>
  );
};

export default Login;
