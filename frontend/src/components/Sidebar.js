import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Network,
  Gauge,
  ReceiptText,
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/consumers',
      label: 'Consumers',
      icon: Users,
    },
    {
      to: '/connections',
      label: 'Connections',
      icon: Network,
    },
    {
      to: '/readings',
      label: 'Meter Readings',
      icon: Gauge,
    },
    {
      to: '/bills',
      label: 'Bills & Invoices',
      icon: ReceiptText,
    },
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-section-title">MAIN NAVIGATION</div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              <div className="nav-link-content">
                <Icon size={19} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </div>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
