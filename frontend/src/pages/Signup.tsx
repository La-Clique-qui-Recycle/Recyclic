import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Signup(): JSX.Element {
  const navigate = useNavigate();
  const { signup, loading, error } = useAuthStore();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validatePasswords = () => {
    if (password !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswords()) {
      return;
    }

    try {
      await signup(username, password, email || undefined);
      setSuccessMessage('Compte créé avec succès ! Votre compte est en attente de validation par un administrateur.');
      // Réinitialiser le formulaire
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      // L'erreur est déjà gérée dans le store
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: '0 20px' }}>
      <h2>Créer un compte</h2>

      {successMessage && (
        <div style={{
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #c3e6cb'
        }}>
          {successMessage}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <label htmlFor="username">Nom d'utilisateur *</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Entrez votre nom d'utilisateur"
          style={{ width: '100%', padding: 8, margin: '8px 0 16px' }}
          minLength={3}
          maxLength={50}
          required
        />

        <label htmlFor="email">Email (optionnel)</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Entrez votre email"
          style={{ width: '100%', padding: 8, margin: '8px 0 16px' }}
        />

        <label htmlFor="password">Mot de passe *</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Entrez votre mot de passe"
          style={{ width: '100%', padding: 8, margin: '8px 0 16px' }}
          minLength={8}
          required
        />

        <label htmlFor="confirmPassword">Confirmer le mot de passe *</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={validatePasswords}
          placeholder="Confirmez votre mot de passe"
          style={{ width: '100%', padding: 8, margin: '8px 0 16px' }}
          minLength={8}
          required
        />

        {passwordError && (
          <div style={{ color: 'red', marginBottom: '16px' }}>
            {passwordError}
          </div>
        )}

        {error && (
          <div style={{ color: 'red', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          style={{ width: '100%', padding: '12px', marginBottom: '16px' }}
          disabled={loading || !!passwordError}
        >
          {loading ? 'Création du compte...' : 'Créer le compte'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        Vous avez déjà un compte ?{' '}
        <button
          onClick={() => navigate('/login')}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
        >
          Se connecter
        </button>
      </div>
    </div>
  );
}