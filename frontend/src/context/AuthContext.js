import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    try {
      const stored = sessionStorage.getItem('aquabill_auth');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const loginAsAdmin = (password) => {
    // Simple frontend-only admin password
    if (password === 'admin123') {
      const session = { role: 'admin' };
      sessionStorage.setItem('aquabill_auth', JSON.stringify(session));
      setAuth(session);
      return true;
    }
    return false;
  };

  const loginAsConsumer = (consumer) => {
    const session = { role: 'consumer', consumer };
    sessionStorage.setItem('aquabill_auth', JSON.stringify(session));
    setAuth(session);
  };

  const logout = () => {
    sessionStorage.removeItem('aquabill_auth');
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, loginAsAdmin, loginAsConsumer, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
