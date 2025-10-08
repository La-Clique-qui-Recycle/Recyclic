import React from 'react';
import styled from 'styled-components';
import { useAuthStore } from '../stores/authStore';
import { getAuthHeader } from '../services/authService';

const Container = styled.div`
  max-width: 720px;
  margin: 0 auto;
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  padding: 24px;
  margin-bottom: 20px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
`;

const Button = styled.button`
  background: #2e7d32;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 16px;
  cursor: pointer;
`;

const PasswordRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
`;

export default function Profile(): JSX.Element {
  const currentUser = useAuthStore((s) => s.currentUser);
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);

  const [firstName, setFirstName] = React.useState<string>(currentUser?.first_name || '');
  const [lastName, setLastName] = React.useState<string>(currentUser?.last_name || '');
  const [username, setUsername] = React.useState<string>(currentUser?.username || '');
  const [email, setEmail] = React.useState<string>((currentUser as any)?.email || '');

  const [newPassword, setNewPassword] = React.useState<string>('');
  const [confirmPassword, setConfirmPassword] = React.useState<string>('');
  const [showPwd, setShowPwd] = React.useState<boolean>(false);
  const [showPwd2, setShowPwd2] = React.useState<boolean>(false);

  const [savingInfo, setSavingInfo] = React.useState(false);
  const [savingPwd, setSavingPwd] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pwdError, setPwdError] = React.useState<string | null>(null);

  const API_BASE = (import.meta as any).env.REACT_APP_API_URL ?? (import.meta as any).env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, username, email }),
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error('Session expirée, reconnectez-vous');
        try {
          const data = await res.json();
          const detail = Array.isArray(data?.detail) ? data.detail : [];
          const emailErr = detail.find((d: any) => Array.isArray(d?.loc) && d.loc.includes('email'));
          const usernameErr = detail.find((d: any) => Array.isArray(d?.loc) && d.loc.includes('username'));
          if (emailErr) throw new Error('Email invalide');
          if (usernameErr) throw new Error('Identifiant invalide');
        } catch (_) {}
        throw new Error('Erreur lors de la mise à jour du profil');
      }
      const updated = await res.json();
      setCurrentUser(updated);
      setMessage('Informations mises à jour');
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la mise à jour');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSavePassword = async () => {
    setSavingPwd(true);
    setMessage(null);
    setError(null);
    setPwdError(null);
    if (newPassword !== confirmPassword) {
      setSavingPwd(false);
      setPwdError('Les mots de passe ne correspondent pas.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ new_password: newPassword, confirm_password: confirmPassword }),
      });
      if (!res.ok) {
        try {
          const data = await res.json();
          const detail = Array.isArray(data?.detail) ? data.detail : [];
          const confirmErr = detail.find((d: any) => Array.isArray(d?.loc) && d.loc.includes('confirm_password'));
          if (confirmErr) {
            throw new Error('Les mots de passe ne correspondent pas.');
          }
          const pwdStrengthErr = detail.find((d: any) => Array.isArray(d?.loc) && d.loc.includes('new_password'));
          if (pwdStrengthErr) {
            throw new Error('Mot de passe trop faible: 8+ car., majuscule, minuscule, chiffre, spécial');
          }
          throw new Error('Erreur lors de la mise à jour du mot de passe');
        } catch (_) {
          throw new Error('Erreur lors de la mise à jour du mot de passe');
        }
      }
      setMessage('Mot de passe mis à jour');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      if (e?.message === 'Les mots de passe ne correspondent pas.' || e?.message?.startsWith('Mot de passe trop faible')) {
        setPwdError(e.message);
      } else {
        setError(e?.message || 'Erreur lors de la mise à jour du mot de passe');
      }
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <Container>
      <h1>Mon Profil</h1>

      {message && <div style={{ color: '#2e7d32', marginBottom: 12 }}>{message}</div>}
      {error && <div style={{ color: '#c62828', marginBottom: 12 }}>{error}</div>}

      <Card>
        <h2>Informations personnelles</h2>
        <Row>
          <label>Prénom</label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </Row>
        <Row>
          <label>Nom</label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </Row>
        <Row>
          <label>Identifiant</label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} />
        </Row>
      <Row>
        <label>Email</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Row>
        <Button disabled={savingInfo} onClick={handleSaveInfo}>Enregistrer les modifications</Button>
      </Card>

      <Card>
        <h2>Changer le mot de passe</h2>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
          8+ caractères, avec majuscule, minuscule, chiffre et caractère spécial
        </div>
        <PasswordRow>
          <Input
            type={showPwd ? 'text' : 'password'}
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button onClick={() => setShowPwd((v) => !v)} style={{ border: '1px solid #ddd', background: 'white', borderRadius: 6, padding: '0 10px' }}>
            {showPwd ? 'Masquer' : 'Afficher'}
          </button>
        </PasswordRow>
        <PasswordRow style={{ marginTop: 8 }}>
          <Input
            type={showPwd2 ? 'text' : 'password'}
            placeholder="Confirmer le nouveau mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button onClick={() => setShowPwd2((v) => !v)} style={{ border: '1px solid #ddd', background: 'white', borderRadius: 6, padding: '0 10px' }}>
            {showPwd2 ? 'Masquer' : 'Afficher'}
          </button>
        </PasswordRow>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button disabled={savingPwd} onClick={handleSavePassword}>Mettre à jour le mot de passe</Button>
          {pwdError && <span style={{ color: '#c62828', fontSize: 13 }}>{pwdError}</span>}
        </div>
      </Card>
    </Container>
  );
}


