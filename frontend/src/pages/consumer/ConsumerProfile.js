import React from 'react';
import { User, MapPin, Phone, Hash } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ConsumerProfile = () => {
  const { auth } = useAuth();
  const consumer = auth.consumer;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Your registered account information.</p>
        </div>
      </div>

      <div className="consumer-profile-card">
        <div className="consumer-profile-avatar-lg">
          {consumer.name.charAt(0).toUpperCase()}
        </div>
        <h2 className="consumer-profile-name">{consumer.name}</h2>
        <p className="consumer-profile-id">Consumer Account #{consumer.consumerId}</p>

        <div className="consumer-profile-details">
          <div className="consumer-detail-row">
            <span className="consumer-detail-label"><Hash size={14} /> Account Number</span>
            <span className="consumer-detail-value font-mono">#{consumer.consumerId}</span>
          </div>
          <div className="consumer-detail-row">
            <span className="consumer-detail-label"><User size={14} /> Full Name</span>
            <span className="consumer-detail-value">{consumer.name}</span>
          </div>
          <div className="consumer-detail-row">
            <span className="consumer-detail-label"><MapPin size={14} /> Service Address</span>
            <span className="consumer-detail-value">{consumer.address}</span>
          </div>
          <div className="consumer-detail-row">
            <span className="consumer-detail-label"><Phone size={14} /> Phone Number</span>
            <span className="consumer-detail-value">{consumer.phone}</span>
          </div>
        </div>

        <div className="consumer-profile-note">
          To update your profile information, please contact the municipal office.
        </div>
      </div>
    </div>
  );
};

export default ConsumerProfile;
