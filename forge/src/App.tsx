import React, { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

/* Layout */
import MainLayout from './layouts/MainLayout';

/* Public Pages (No Layout) */
import Login from './pages/Login';
import Signup from './pages/Signup';
import EmailVerification from './pages/EmailVerification';
import PasswordReset from './pages/PasswordReset';

/* Protected Pages (With Layout) */
import Dashboard from './pages/Dashboard';
import WorkflowList from './pages/WorkflowList';
import WorkflowDetail from './pages/WorkflowDetail';
import WorkflowBuilder from './pages/WorkflowBuilder';
import AgentList from './pages/AgentList';
import AgentDetail from './pages/AgentDetail';
import APIKeyManagement from './pages/APIKeyManagement';
import UserProfile from './pages/UserProfile';

import './styles/App.css';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="route-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * PublicRoute Component
 * Routes that should redirect authenticated users away
 * (e.g., login/signup pages)
 */
const PublicRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="route-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

/**
 * ScrollToTop Component
 * Automatically scrolls to top when route changes
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

/**
 * App Component
 * Main application component with React Router v6 configuration
 * Defines all routes and protected route logic
 */
const App: React.FC = () => {
  const [appReady, setAppReady] = useState(false);
  const { initializeAuth } = useAuth();

  // Initialize authentication on app startup
  useEffect(() => {
    const initApp = async () => {
      try {
        await initializeAuth();
        setAppReady(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Still set ready to show error UI
        setAppReady(true);
      }
    };

    initApp();
  }, [initializeAuth]);

  if (!appReady) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Initializing Forge...</p>
      </div>
    );
  }

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public Routes - No Layout */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-email"
          element={
            <PublicRoute>
              <EmailVerification />
            </PublicRoute>
          }
        />
        <Route
          path="/password-reset"
          element={
            <PublicRoute>
              <PasswordReset />
            </PublicRoute>
          }
        />

        {/* Protected Routes - With MainLayout */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Workflow Routes */}
          <Route path="/workflows" element={<WorkflowList />} />
          <Route path="/workflows/new" element={<WorkflowBuilder />} />
          <Route path="/workflows/:id" element={<WorkflowDetail />} />
          <Route path="/workflows/:id/edit" element={<WorkflowBuilder />} />

          {/* Agent Routes */}
          <Route path="/agents" element={<AgentList />} />
          <Route path="/agents/new" element={<AgentDetail />} />
          <Route path="/agents/:id" element={<AgentDetail />} />

          {/* Settings Routes */}
          <Route path="/api-keys" element={<APIKeyManagement />} />
          <Route path="/profile" element={<UserProfile />} />

          {/* Fallback for authenticated routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <div className="not-found">
              <h1>404 - Page Not Found</h1>
              <p>The page you're looking for doesn't exist.</p>
              <a href="/dashboard" className="not-found-link">
                Go back to dashboard
              </a>
            </div>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
