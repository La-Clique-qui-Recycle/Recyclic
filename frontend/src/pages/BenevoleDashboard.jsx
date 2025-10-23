import React from 'react';
import { useAuthStore } from '../stores/authStore';

export default function BenevoleDashboard() {
  const currentUser = useAuthStore((s) => s.currentUser);

  return (
    <div>
      <h1>Bienvenue, {currentUser?.first_name || currentUser?.username}!</h1>
      <p>Ceci est votre tableau de bord personnel.</p>
      <p>D'ici, vous pourrez bientôt accéder aux communications internes, aux documents importants et à d'autres outils utiles pour votre mission au sein de l'association.</p>
    </div>
  );
}
