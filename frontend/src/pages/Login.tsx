import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Recycle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function Login(): JSX.Element {
  const navigate = useNavigate();
  const { login, loading, error } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      // L'erreur est déjà gérée dans le store
      console.error('Login error:', err);
    }
  };

  return (
    <div>
      <PublicBanner>
        <BannerInner>
          <Brand>
            <Recycle size={22} />
            <span>RecyClique</span>
          </Brand>
        </BannerInner>
      </PublicBanner>
      <div style={{ maxWidth: 360, margin: '40px auto' }}>
      <h2>Connexion</h2>
      <form onSubmit={onSubmit}>
        <label htmlFor="username">Nom d'utilisateur</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Entrez votre nom d'utilisateur"
          style={{ width: '100%', padding: 8, margin: '8px 0 16px' }}
          autoComplete="username"
          required
        />
        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Entrez votre mot de passe"
          style={{ width: '100%', padding: 8, margin: '8px 0 16px' }}
          autoComplete="current-password"
          required
        />
        {error && (
          <div style={{ color: 'red', marginBottom: '16px' }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link
          to="/forgot-password"
          style={{
            color: '#3b82f6',
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          Mot de passe oublié ?
        </Link>
      </div>
    </div>
    </div>
  );
}

const PublicBanner = styled.header`
  background-color: #2e7d32;
  color: white;
  padding: 12px 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const BannerInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
`;
