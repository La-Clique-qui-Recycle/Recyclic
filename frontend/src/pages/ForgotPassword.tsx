import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function ForgotPassword(): JSX.Element {
  const { forgotPassword, loading, error } = useAuthStore();

  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch {
      // L'erreur est déjà gérée dans le store
    }
  };

  if (isSubmitted) {
    return (
      <div style={{ maxWidth: 400, margin: '40px auto', padding: '20px' }}>
        <h2>Email envoyé</h2>
        <div style={{ marginBottom: '20px', color: '#059669' }}>
          Si un compte est associé à cet email, un lien de réinitialisation a été envoyé.
        </div>
        <div style={{ marginBottom: '20px', fontSize: '14px', color: '#6b7280' }}>
          Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
        </div>
        <Link
          to="/login"
          style={{
            color: '#3b82f6',
            textDecoration: 'none',
            borderBottom: '1px solid #3b82f6'
          }}
        >
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: '20px' }}>
      <h2>Mot de passe oublié</h2>
      <p style={{ marginBottom: '20px', color: '#6b7280' }}>
        Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
      </p>

      <form onSubmit={onSubmit}>
        <label htmlFor="email">Adresse email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Entrez votre adresse email"
          aria-describedby={error ? "email-error" : undefined}
          style={{
            width: '100%',
            padding: '10px',
            margin: '8px 0 16px',
            border: '1px solid #d1d5db',
            borderRadius: '4px'
          }}
          required
        />

        {error && (
          <div id="email-error" style={{ color: '#dc2626', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
          disabled={loading}
        >
          {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
        </button>
      </form>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link
          to="/login"
          style={{
            color: '#6b7280',
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}