import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Network,
  Gauge,
  ReceiptText,
  CreditCard,
  LogOut,
  Droplets,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/consumers', label: 'Consumers', icon: Users },
    { to: '/admin/connections', label: 'Connections', icon: Network },
    { to: '/admin/readings', label: 'Readings', icon: Gauge },
    { to: '/admin/bills', label: 'Bills', icon: ReceiptText },
    { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand-mini">
        <Droplets size={20} className="text-cyan" />
        <span>Admin Panel</span>
      </div>
      <div className="sidebar-section-title">MAIN NAVIGATION</div>
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

export default AdminSidebar;
