import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  Receipt,
  CreditCard,
  User,
  LogOut,
  Droplets,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ConsumerSidebar = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const consumer = auth?.consumer;

  const navItems = [
    { to: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/portal/connection', label: 'My Connection', icon: Network },
    { to: '/portal/bills', label: 'My Bills', icon: Receipt },
    { to: '/portal/payments', label: 'Payments', icon: CreditCard },
    { to: '/portal/profile', label: 'Profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="app-sidebar consumer-sidebar">
      <div className="sidebar-consumer-profile">
        <div className="sidebar-consumer-avatar">
          {consumer?.name ? consumer.name.charAt(0).toUpperCase() : 'C'}
        </div>
        <div className="sidebar-consumer-info">
          <div className="sidebar-consumer-name">{consumer?.name || 'Consumer'}</div>
          <div className="sidebar-consumer-id">Consumer #{consumer?.consumerId}</div>
        </div>
      </div>

      <div className="sidebar-brand-mini portal-brand">
        <Droplets size={16} className="text-cyan" />
        <span>My Water Portal</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              <div className="nav-link-content">
                <Icon size={19} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </div>
            </NavLink>
          );
        })}
      </nav>
      <div className="sidebar-logout-area">
        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <LogOut size={17} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default ConsumerSidebar;
