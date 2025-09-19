import { useState, useEffect } from 'react';

/**
 * Composant pour éviter les erreurs d'hydratation avec Zustand persist
 * Attend que le client soit prêt avant de rendre les enfants
 */
export default function HydrationWrapper({ children }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Pendant l'hydratation, rendre un placeholder simple
  if (!isHydrated) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Chargement...
      </div>
    );
  }

  return children;
}