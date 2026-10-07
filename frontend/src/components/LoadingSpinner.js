import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading water billing records...' }) => {
  return (
    <div className="loading-container">
      <Loader2 size={36} className="spinner-icon" />
      <span className="loading-text">{message}</span>
    </div>
  );
};

export default LoadingSpinner;
