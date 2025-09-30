import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { linkTelegramAccount } from '../services/api';

const TelegramAuthContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  color: #2c5530;
  text-align: center;
  margin-bottom: 30px;
`;

const Question = styled.div`
  text-align: center;
  font-size: 18px;
  color: #333;
  margin-bottom: 30px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 30px;
`;

const Button = styled.button`
  background: #2c5530;
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
  min-width: 150px;
  
  &:hover {
    background: #1e3a21;
  }
`;

const SecondaryButton = styled(Button)`
  background: #6c757d;
  
  &:hover {
    background: #545b62;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 30px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-weight: 600;
  color: #333;
`;

const Input = styled.input`
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #2c5530;
  }
`;

const Message = styled.div`
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  text-align: center;
  
  &.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  &.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2c5530;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 10px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const SuccessMessage = styled.div`
  text-align: center;
  padding: 30px;
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
`;

function TelegramAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegisterClick = () => {
    // Rediriger vers /registration en conservant les paramètres d'URL
    const currentParams = searchParams.toString();
    const url = currentParams ? `/inscription?${currentParams}` : '/inscription';
    navigate(url);
  };

  const handleLoginClick = () => {
    setShowLoginForm(true);
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Extraire le telegram_id des paramètres d'URL
      const telegramId = searchParams.get('telegram_id');
      
      if (!telegramId) {
        setMessage({
          type: 'error',
          text: 'Paramètre telegram_id manquant dans l\'URL.'
        });
        return;
      }

      // Préparer les données pour l'API
      const linkData = {
        username: loginData.username,
        password: loginData.password,
        telegram_id: telegramId
      };

      // Appel à l'API
      await linkTelegramAccount(linkData);
      
      // Succès
      setIsSuccess(true);
      setMessage({ type: '', text: '' });
      
    } catch (error) {
      console.error('Erreur lors de la liaison du compte:', error);
      
      // Gestion des erreurs spécifiques
      if (error.response?.status === 401) {
        setMessage({
          type: 'error',
          text: 'Nom d\'utilisateur ou mot de passe incorrect.'
        });
      } else if (error.response?.status === 409) {
        setMessage({
          type: 'error',
          text: 'Ce compte Telegram est déjà lié à un autre utilisateur.'
        });
      } else {
        setMessage({
          type: 'error',
          text: 'Une erreur est survenue lors de la liaison du compte. Veuillez réessayer.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Si succès, afficher le message de succès
  if (isSuccess) {
    return (
      <TelegramAuthContainer>
        <Title>🔗 Liaison de Compte Telegram</Title>
        <SuccessMessage>
          ✅ Votre compte a été lié avec succès !
        </SuccessMessage>
      </TelegramAuthContainer>
    );
  }

  return (
    <TelegramAuthContainer>
      <Title>🔗 Liaison de Compte Telegram</Title>
      
      <Question>
        Avez-vous déjà un compte Recyclic ?
      </Question>
      
      <ButtonContainer>
        <Button onClick={handleRegisterClick}>
          S'inscrire
        </Button>
        <SecondaryButton onClick={handleLoginClick}>
          Se connecter
        </SecondaryButton>
      </ButtonContainer>
      
      {message.text && (
        <Message className={message.type}>
          {message.text}
        </Message>
      )}
      
      {showLoginForm && (
        <Form onSubmit={handleLoginSubmit}>
          <FormGroup>
            <Label htmlFor="username">Identifiant</Label>
            <Input
              type="text"
              id="username"
              name="username"
              value={loginData.username}
              onChange={handleLoginChange}
              placeholder="Votre identifiant"
              required
              disabled={isLoading}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={loginData.password}
              onChange={handleLoginChange}
              placeholder="Votre mot de passe"
              required
              disabled={isLoading}
            />
          </FormGroup>
          
          <Button type="submit" disabled={isLoading}>
            {isLoading && <LoadingSpinner />}
            {isLoading ? 'Liaison en cours...' : 'Lier le compte'}
          </Button>
        </Form>
      )}
    </TelegramAuthContainer>
  );
}

export default TelegramAuth;
