import React from 'react';
import styled from 'styled-components';
import { Text } from '@mantine/core';
import { useAuthStore } from '../stores/authStore';
import axiosClient from '../api/axiosClient';

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

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  min-height: 60px;
  resize: vertical;
  font-family: inherit;
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

  const [phoneNumber, setPhoneNumber] = React.useState<string>((currentUser as any)?.phone_number || '');
  const [address, setAddress] = React.useState<string>((currentUser as any)?.address || '');
  const [newPassword, setNewPassword] = React.useState<string>('');
  const [confirmPassword, setConfirmPassword] = React.useState<string>('');
  const [showPwd, setShowPwd] = React.useState<boolean>(false);
  const [showPwd2, setShowPwd2] = React.useState<boolean>(false);

  // PIN management state
  const [pin, setPin] = React.useState<string>('');
  const [confirmPin, setConfirmPin] = React.useState<string>('');
  const [currentPassword, setCurrentPassword] = React.useState<string>('');
  const [showPin, setShowPin] = React.useState<boolean>(false);
  const [showPin2, setShowPin2] = React.useState<boolean>(false);
  const [showCurrentPwd, setShowCurrentPwd] = React.useState<boolean>(false);

  const [savingInfo, setSavingInfo] = React.useState(false);
  const [savingPwd, setSavingPwd] = React.useState(false);
  const [savingPin, setSavingPin] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pwdError, setPwdError] = React.useState<string | null>(null);
  const [pinError, setPinError] = React.useState<string | null>(null);

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    setMessage(null);
    setError(null);
    try {
      const response = await axiosClient.put('/users/me', {
        first_name: firstName,
        last_name: lastName,
        username,
        email,
        phone_number: phoneNumber,
        address
      });
      setCurrentUser(response.data);
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
      await axiosClient.put('/users/me/password', {
        new_password: newPassword,
        confirm_password: confirmPassword
      });
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

  const handleSavePin = async () => {
    setSavingPin(true);
    setMessage(null);
    setError(null);
    setPinError(null);
    
    // Validation
    if (pin !== confirmPin) {
      setSavingPin(false);
      setPinError('Les codes PIN ne correspondent pas.');
      return;
    }
    
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setSavingPin(false);
      setPinError('Le code PIN doit contenir exactement 4 chiffres.');
      return;
    }
    
    try {
      const payload: any = { pin };
      
      // Si l'utilisateur a déjà un PIN, inclure le mot de passe actuel
      if ((currentUser as any)?.hashed_pin) {
        if (!currentPassword) {
          setSavingPin(false);
          setPinError('Le mot de passe actuel est requis pour modifier le PIN existant.');
          return;
        }
        payload.current_password = currentPassword;
      }
      
      await axiosClient.put('/users/me/pin', payload);
      setMessage('Code PIN mis à jour avec succès');
      setPin('');
      setConfirmPin('');
      setCurrentPassword('');
    } catch (e: any) {
      if (e?.response?.data?.detail) {
        setPinError(e.response.data.detail);
      } else {
        setError(e?.message || 'Erreur lors de la mise à jour du code PIN');
      }
    } finally {
      setSavingPin(false);
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
      <Row>
        <label>Téléphone</label>
        <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
      </Row>
      <Row>
        <label>Adresse</label>
        <Textarea 
          value={address} 
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Entrez votre adresse complète"
          rows={3}
        />
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

      <Card>
        <h2>Gestion du code PIN</h2>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
          Code PIN à 4 chiffres pour la connexion rapide
        </div>
        
        {/* Affichage du statut du PIN */}
        <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
          <Text size="sm" fw={500}>
            Statut du PIN: {(currentUser as any)?.hashed_pin ? 'Défini' : 'Non défini'}
          </Text>
        </div>
        
        {/* Champ mot de passe actuel (seulement si PIN existe) */}
        {(currentUser as any)?.hashed_pin && (
          <PasswordRow style={{ marginBottom: 8 }}>
            <Input
              type={showCurrentPwd ? 'text' : 'password'}
              placeholder="Mot de passe actuel (requis pour modifier le PIN)"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <button onClick={() => setShowCurrentPwd((v) => !v)} style={{ border: '1px solid #ddd', background: 'white', borderRadius: 6, padding: '0 10px' }}>
              {showCurrentPwd ? 'Masquer' : 'Afficher'}
            </button>
          </PasswordRow>
        )}
        
        {/* Nouveau PIN */}
        <PasswordRow style={{ marginBottom: 8 }}>
          <Input
            type={showPin ? 'text' : 'password'}
            placeholder="Nouveau code PIN (4 chiffres)"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={4}
          />
          <button onClick={() => setShowPin((v) => !v)} style={{ border: '1px solid #ddd', background: 'white', borderRadius: 6, padding: '0 10px' }}>
            {showPin ? 'Masquer' : 'Afficher'}
          </button>
        </PasswordRow>
        
        {/* Confirmation PIN */}
        <PasswordRow style={{ marginBottom: 12 }}>
          <Input
            type={showPin2 ? 'text' : 'password'}
            placeholder="Confirmer le code PIN"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            maxLength={4}
          />
          <button onClick={() => setShowPin2((v) => !v)} style={{ border: '1px solid #ddd', background: 'white', borderRadius: 6, padding: '0 10px' }}>
            {showPin2 ? 'Masquer' : 'Afficher'}
          </button>
        </PasswordRow>
        
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button disabled={savingPin} onClick={handleSavePin}>
            {(currentUser as any)?.hashed_pin ? 'Modifier le code PIN' : 'Définir le code PIN'}
          </Button>
          {pinError && <span style={{ color: '#c62828', fontSize: 13 }}>{pinError}</span>}
        </div>
      </Card>
    </Container>
  );
}


