import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function ResetPassword(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, loading, error } = useAuthStore();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      // Rediriger vers login si pas de token
      navigate('/login');
    }
  }, [searchParams, navigate]);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une minuscule');
    }
    if (!/\d/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un caractère spécial');
    }

    return errors;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validation côté client
    if (newPassword !== confirmPassword) {
      setValidationError('Les mots de passe ne correspondent pas');
      return;
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setValidationError(passwordErrors.join('. '));
      return;
    }

    try {
      await resetPassword(token, newPassword);
      setIsSuccess(true);
      // Rediriger vers login après 3 secondes
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      // L'erreur est déjà gérée dans le store
    }
  };

  if (isSuccess) {
    return (
      <div style={{ maxWidth: 400, margin: '40px auto', padding: '20px' }}>
        <h2 style={{ color: '#059669' }}>Mot de passe réinitialisé</h2>
        <div style={{ marginBottom: '20px', color: '#059669' }}>
          Votre mot de passe a été réinitialisé avec succès.
        </div>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          Vous allez être redirigé vers la page de connexion dans quelques secondes...
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: '20px' }}>
      <h2>Réinitialiser le mot de passe</h2>
      <p style={{ marginBottom: '20px', color: '#6b7280' }}>
        Entrez votre nouveau mot de passe ci-dessous.
      </p>

      <form onSubmit={onSubmit}>
        <label htmlFor="newPassword">Nouveau mot de passe</label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Entrez votre nouveau mot de passe"
          aria-describedby={validationError ? "password-error" : "password-help"}
          style={{
            width: '100%',
            padding: '10px',
            margin: '8px 0 16px',
            border: '1px solid #d1d5db',
            borderRadius: '4px'
          }}
          required
        />

        <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirmez votre nouveau mot de passe"
          aria-describedby={validationError ? "password-error" : undefined}
          style={{
            width: '100%',
            padding: '10px',
            margin: '8px 0 16px',
            border: '1px solid #d1d5db',
            borderRadius: '4px'
          }}
          required
        />

        <div id="password-help" style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
          Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.
        </div>

        {(error || validationError) && (
          <div id="password-error" style={{ color: '#dc2626', marginBottom: '16px', fontSize: '14px' }}>
            {validationError || error}
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
          {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
        </button>
      </form>
    </div>
  );
}