import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'cyan', trend }) => {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-card-top">
        <span className="stat-title">{title}</span>
        {Icon && (
          <div className={`stat-icon-wrapper icon-bg-${color}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-footer">
        {trend && <span className="stat-trend">{trend}</span>}
        {subtitle && <span className="stat-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
};

export default StatCard;
