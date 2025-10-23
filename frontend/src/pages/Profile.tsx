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

const MessageContainer = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
`;

const SuccessMessage = styled(MessageContainer)`
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
`;

const ErrorMessage = styled(MessageContainer)`
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
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
  const [showPin, setShowPin] = React.useState<boolean>(false);
  const [showPin2, setShowPin2] = React.useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = React.useState<string>('');
  const [showCurrentPwd, setShowCurrentPwd] = React.useState<boolean>(false);

  const [savingInfo, setSavingInfo] = React.useState(false);
  const [savingPwd, setSavingPwd] = React.useState(false);
  const [savingPin, setSavingPin] = React.useState(false);
  
  // Messages contextuels par section
  const [infoMessage, setInfoMessage] = React.useState<string | null>(null);
  const [infoError, setInfoError] = React.useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = React.useState<string | null>(null);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [pinMessage, setPinMessage] = React.useState<string | null>(null);
  const [pinError, setPinError] = React.useState<string | null>(null);

  // Charger les données utilisateur au montage du composant
  React.useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await axiosClient.get('/v1/users/me');
        const userData = response.data;
        
        // Mettre à jour les états avec les données récupérées
        setFirstName(userData.first_name || '');
        setLastName(userData.last_name || '');
        setUsername(userData.username || '');
        setEmail(userData.email || '');
        setPhoneNumber(userData.phone_number || '');
        setAddress(userData.address || '');
        
        // Mettre à jour le store avec les données complètes
        setCurrentUser(userData);
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
      }
    };

    loadUserData();
  }, [setCurrentUser]);

  const handleSaveInfo = async () => {
    setSavingInfo(true);
    setInfoMessage(null);
    setInfoError(null);
    try {
      const response = await axiosClient.put('/v1/users/me', {
        first_name: firstName,
        last_name: lastName,
        username,
        email,
        phone_number: phoneNumber,
        address
      });
      setCurrentUser(response.data);
      setInfoMessage('Informations mises à jour avec succès');
    } catch (e: any) {
      // Gestion spécifique de l'erreur 409 Conflict pour email dupliqué
      if (e?.response?.status === 409) {
        const errorMessage = e?.response?.data?.detail || 'Un compte avec cet email existe déjà';
        setInfoError(errorMessage);
      } else {
        setInfoError(e?.message || 'Erreur lors de la mise à jour');
      }
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSavePassword = async () => {
    setSavingPwd(true);
    setPasswordMessage(null);
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setSavingPwd(false);
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }
    try {
      await axiosClient.put('/v1/users/me/password', {
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      setPasswordMessage('Mot de passe mis à jour avec succès');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      if (e?.message === 'Les mots de passe ne correspondent pas.' || e?.message?.startsWith('Mot de passe trop faible')) {
        setPasswordError(e.message);
      } else if (e?.response?.status === 422) {
        setPasswordError('Le mot de passe doit contenir au moins 8 caractères avec majuscule, minuscule, chiffre et caractère spécial');
      } else {
        setPasswordError(e?.message || 'Erreur lors de la mise à jour du mot de passe');
      }
    } finally {
      setSavingPwd(false);
    }
  };

  const handleSavePin = async () => {
    setSavingPin(true);
    setPinMessage(null);
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
      
      await axiosClient.put('/v1/users/me/pin', payload);
      setPinMessage('Code PIN mis à jour avec succès');
      setPin('');
      setConfirmPin('');
    } catch (e: any) {
      if (e?.response?.data?.detail) {
        setPinError(e.response.data.detail);
      } else {
        setPinError(e?.message || 'Erreur lors de la mise à jour du code PIN');
      }
    } finally {
      setSavingPin(false);
    }
  };

  return (
    <Container>
      <h1>Mon Profil</h1>

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
        {infoMessage && <SuccessMessage>{infoMessage}</SuccessMessage>}
        {infoError && <ErrorMessage>{infoError}</ErrorMessage>}
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
        <div style={{ marginTop: 12 }}>
          <Button disabled={savingPwd} onClick={handleSavePassword}>Mettre à jour le mot de passe</Button>
          {passwordMessage && <SuccessMessage>{passwordMessage}</SuccessMessage>}
          {passwordError && <ErrorMessage>{passwordError}</ErrorMessage>}
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
        
        <div style={{ marginTop: 12 }}>
          <Button disabled={savingPin} onClick={handleSavePin}>
            {(currentUser as any)?.hashed_pin ? 'Modifier le code PIN' : 'Définir le code PIN'}
          </Button>
          {pinMessage && <SuccessMessage>{pinMessage}</SuccessMessage>}
          {pinError && <ErrorMessage>{pinError}</ErrorMessage>}
        </div>
      </Card>
    </Container>
  );
}


