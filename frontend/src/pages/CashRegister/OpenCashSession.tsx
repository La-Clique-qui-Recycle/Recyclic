import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Title, TextInput, Select, Button, Group, Alert, LoadingOverlay } from '@mantine/core';
import { IconCash, IconUser, IconCurrencyEuro, IconAlertCircle } from '@tabler/icons-react';
import { useCashSessionStore } from '../../stores/cashSessionStore';
import { useAuthStore } from '../../stores/authStore';

interface OpenCashSessionProps {
  onSessionOpened?: (sessionId: string) => void;
}

const OpenCashSession: React.FC<OpenCashSessionProps> = ({ onSessionOpened }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { 
    openSession, 
    loading, 
    error, 
    clearError 
  } = useCashSessionStore();

  const [formData, setFormData] = useState({
    operator_id: currentUser?.id || 'test-user-id',
    initial_amount: 0
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Effacer les erreurs au montage du composant
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.operator_id) {
      errors.operator_id = 'Veuillez sélectionner un opérateur';
    }

    if (formData.initial_amount < 0) {
      errors.initial_amount = 'Le montant initial ne peut pas être négatif';
    }

    if (formData.initial_amount > 10000) {
      errors.initial_amount = 'Le montant initial ne peut pas dépasser 10 000€';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const session = await openSession({
        operator_id: formData.operator_id,
        initial_amount: formData.initial_amount
      });

      if (session) {
        // Redirection vers l'interface de vente
        if (onSessionOpened) {
          onSessionOpened(session.id);
        } else {
          navigate('/cash-register/sale');
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de session:', error);
    }
  };

  const handleCancel = () => {
    navigate('/cash-register');
  };

  return (
    <Container size="sm" py="xl">
      <Paper shadow="sm" p="xl" radius="md">
        <LoadingOverlay visible={loading} />
        
        <Group mb="xl">
          <IconCash size={32} color="#228be6" />
          <Title order={2}>Ouverture de Session de Caisse</Title>
        </Group>

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Erreur"
            color="red"
            mb="md"
            onClose={clearError}
            withCloseButton
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Select
            label="Opérateur"
            placeholder="Sélectionnez l'opérateur"
            value={formData.operator_id}
            onChange={(value) => handleInputChange('operator_id', value || '')}
            data={[
              { value: currentUser?.id || 'test-user-id', label: currentUser?.username || 'Utilisateur actuel' }
            ]}
            required
            error={validationErrors.operator_id}
            icon={<IconUser size={16} />}
            mb="md"
          />

          <TextInput
            label="Fond de caisse initial"
            placeholder="0.00"
            value={String(formData.initial_amount)}
            onChange={(e) => handleInputChange('initial_amount', e.target.value === '' ? 0 : parseFloat(e.target.value))}
            type="number"
            step="0.01"
            min="0"
            max="10000"
            required
            error={validationErrors.initial_amount}
            icon={<IconCurrencyEuro size={16} />}
            mb="xl"
            description="Montant en euros (ex: 50.00)"
          />
          {/* Erreur rendue via TextInput.error pour éviter les doublons */}

          <Group position="right">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              loading={loading}
              leftIcon={<IconCash size={16} />}
            >
              Ouvrir la Session
            </Button>
          </Group>
        </form>
      </Paper>
    </Container>
  );
};

export default OpenCashSession;
