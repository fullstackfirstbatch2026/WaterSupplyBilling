import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Shared components
import Navbar from './components/Navbar';

// Admin components & pages
import AdminSidebar from './components/AdminSidebar';
import Dashboard from './pages/Dashboard';
import Consumers from './pages/Consumers';
import Connections from './pages/Connections';
import Readings from './pages/Readings';
import Bills from './pages/Bills';
import Payments from './pages/Payments';

// Consumer components & pages
import ConsumerSidebar from './components/ConsumerSidebar';
import ConsumerDashboard from './pages/consumer/ConsumerDashboard';
import ConsumerConnection from './pages/consumer/ConsumerConnection';
import ConsumerBills from './pages/consumer/ConsumerBills';
import ConsumerPayments from './pages/consumer/ConsumerPayments';
import ConsumerProfile from './pages/consumer/ConsumerProfile';

// Auth
import Login from './pages/Login';

// ─── Route Guards ─────────────────────────────────────────────────────────────

const RequireAdmin = ({ children }) => {
  const { auth } = useAuth();
  const location = useLocation();
  if (!auth) return <Navigate to="/login" state={{ from: location }} replace />;
  if (auth.role !== 'admin') return <Navigate to="/portal/dashboard" replace />;
  return children;
};

const RequireConsumer = ({ children }) => {
  const { auth } = useAuth();
  const location = useLocation();
  if (!auth) return <Navigate to="/login" state={{ from: location }} replace />;
  if (auth.role !== 'consumer') return <Navigate to="/admin/dashboard" replace />;
  return children;
};

const RedirectIfLoggedIn = ({ children }) => {
  const { auth } = useAuth();
  if (auth?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (auth?.role === 'consumer') return <Navigate to="/portal/dashboard" replace />;
  return children;
};

// ─── Layouts ──────────────────────────────────────────────────────────────────

const AdminLayout = ({ children }) => (
  <div className="app-layout">
    <Navbar />
    <div className="app-body">
      <AdminSidebar />
      <main className="main-content">{children}</main>
    </div>
  </div>
);

const ConsumerLayout = ({ children }) => (
  <div className="app-layout consumer-layout">
    <Navbar role="consumer" />
    <div className="app-body">
      <ConsumerSidebar />
      <main className="main-content consumer-main">{children}</main>
    </div>
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Login */}
      <Route
        path="/login"
        element={
          <RedirectIfLoggedIn>
            <Login />
          </RedirectIfLoggedIn>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin/dashboard"
        element={
          <RequireAdmin>
            <AdminLayout><Dashboard /></AdminLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/consumers"
        element={
          <RequireAdmin>
            <AdminLayout><Consumers /></AdminLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/connections"
        element={
          <RequireAdmin>
            <AdminLayout><Connections /></AdminLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/readings"
        element={
          <RequireAdmin>
            <AdminLayout><Readings /></AdminLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/bills"
        element={
          <RequireAdmin>
            <AdminLayout><Bills /></AdminLayout>
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <RequireAdmin>
            <AdminLayout><Payments /></AdminLayout>
          </RequireAdmin>
        }
      />

      {/* Consumer portal routes */}
      <Route
        path="/portal/dashboard"
        element={
          <RequireConsumer>
            <ConsumerLayout><ConsumerDashboard /></ConsumerLayout>
          </RequireConsumer>
        }
      />
      <Route
        path="/portal/connection"
        element={
          <RequireConsumer>
            <ConsumerLayout><ConsumerConnection /></ConsumerLayout>
          </RequireConsumer>
        }
      />
      <Route
        path="/portal/bills"
        element={
          <RequireConsumer>
            <ConsumerLayout><ConsumerBills /></ConsumerLayout>
          </RequireConsumer>
        }
      />
      <Route
        path="/portal/payments"
        element={
          <RequireConsumer>
            <ConsumerLayout><ConsumerPayments /></ConsumerLayout>
          </RequireConsumer>
        }
      />
      <Route
        path="/portal/profile"
        element={
          <RequireConsumer>
            <ConsumerLayout><ConsumerProfile /></ConsumerLayout>
          </RequireConsumer>
        }
      />

      {/* Catch-all → login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
