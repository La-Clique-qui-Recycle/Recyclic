import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/**
 * Composant de redirection après login
 * Redirige l'utilisateur vers la page appropriée selon son rôle
 */
export default function PostLoginRedirect(): JSX.Element {
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAdmin = useAuthStore((s) => s.isAdmin);

  // Redirection basée sur le rôle
  if (isAdmin()) {
    // Les admins vont vers le dashboard admin
    return <Navigate to="/admin" replace />;
  }

  // Les bénévoles vont vers leur dashboard
  return <Navigate to="/dashboard/benevole" replace />;
}
