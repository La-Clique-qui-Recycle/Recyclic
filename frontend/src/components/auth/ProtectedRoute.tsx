import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?: 'user' | 'admin' | 'super-admin' | 'manager';
  requiredRoles?: Array<'user' | 'admin' | 'super-admin' | 'manager'>;
  adminOnly?: boolean;
  adminPathFallback?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
  adminOnly = false,
  adminPathFallback = '/'
}: ProtectedRouteProps): JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentUser = useAuthStore((s) => s.currentUser);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly) {
    const role = currentUser?.role;
    const isAdmin = role === 'admin' || role === 'super-admin';
    if (!isAdmin) return <Navigate to={adminPathFallback} replace />;
  }

  if (requiredRole) {
    const userRole = currentUser?.role;
    const hasRequiredRole = userRole === requiredRole;

    if (!hasRequiredRole) {
      return <Navigate to={adminPathFallback} replace />;
    }
  }

  if (requiredRoles) {
    const userRole = currentUser?.role;
    const hasRequiredRole = requiredRoles.includes(userRole as any);

    if (!hasRequiredRole) {
      return <Navigate to={adminPathFallback} replace />;
    }
  }

  return children;
}
