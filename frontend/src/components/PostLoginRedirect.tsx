import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Composant de redirection après login
 * Redirige tous les utilisateurs vers la page d'accueil unifiée
 */
export default function PostLoginRedirect(): JSX.Element {
  // Tous les utilisateurs vont vers le dashboard unifié
  return <Navigate to="/" replace />;
}
