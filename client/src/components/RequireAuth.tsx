import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingState } from './StatusViews';

const RequireAuth: React.FC<{ children: React.ReactNode; admin?: boolean }> = ({ children, admin = false }) => {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <LoadingState label="Restoring your session…" minHeight="60vh" />;
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (admin && !user?.isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export default RequireAuth;
