import React from 'react';
import { Navigate } from 'react-router';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
