import React, { useState, useEffect } from 'react';
import { Modal, Title, Text, Stack, Button, Group, PinInput, Select, Card, Avatar } from '@mantine/core';
import { IconLock, IconUser, IconLogin } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import pinService from '../../services/pinService';
import settingsService from '../../services/settingsService';
import { useAuthStore } from '../../stores/authStore';

interface Operator {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

interface OperatorLockScreenProps {
  opened: boolean;
  onClose: () => void;
  onOperatorChange: (accessToken: string, operator: Operator) => void;
  availableOperators: Operator[];
}

const OperatorLockScreen: React.FC<OperatorLockScreenProps> = ({
  opened,
  onClose,
  onOperatorChange,
  availableOperators,
}) => {
  const [pinMode, setPinMode] = useState(false);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    if (opened) {
      loadPinMode();
    }
  }, [opened]);

  const loadPinMode = async () => {
    try {
      const enabled = await settingsService.getPinModeEnabled();
      setPinMode(enabled);
    } catch (error) {
      console.error('Error loading PIN mode:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const getOperatorDisplayName = (operator: Operator) => {
    if (operator.first_name || operator.last_name) {
      return `${operator.first_name || ''} ${operator.last_name || ''}`.trim();
    }
    return operator.username;
  };

  const handlePinAuth = async () => {
    if (!selectedOperatorId) {
      showNotification({
        title: 'Erreur',
        message: 'Veuillez sélectionner un opérateur',
        color: 'red',
      });
      return;
    }

    if (pin.length !== 4) {
      showNotification({
        title: 'Erreur',
        message: 'Veuillez saisir un code PIN à 4 chiffres',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await pinService.authenticateWithPin(selectedOperatorId, pin);

      const operator: Operator = {
        id: response.user_id,
        username: response.username,
        role: response.role,
      };

      onOperatorChange(response.access_token, operator);

      showNotification({
        title: 'Succès',
        message: `Bienvenue ${response.username}`,
        color: 'green',
      });

      // Reset form
      setPin('');
      setSelectedOperatorId('');
      onClose();
    } catch (error: any) {
      console.error('Error authenticating with PIN:', error);
      showNotification({
        title: 'Erreur',
        message: error.response?.data?.detail || 'Code PIN invalide',
        color: 'red',
      });
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOperator = (operatorId: string) => {
    setSelectedOperatorId(operatorId);
  };

  const selectedOperator = availableOperators.find(op => op.id === selectedOperatorId);

  if (loadingSettings) {
    return (
      <Modal opened={opened} onClose={onClose} title="Changement d'opérateur" size="md">
        <Text>Chargement...</Text>
      </Modal>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconLock size={24} />
          <Title order={3}>Changement d'opérateur</Title>
        </Group>
      }
      size="md"
      closeOnClickOutside={false}
      closeOnEscape={false}
    >
      <Stack spacing="md">
        <Text size="sm" color="dimmed">
          {pinMode
            ? 'Sélectionnez un opérateur et saisissez votre code PIN'
            : 'Sélectionnez un opérateur pour continuer'}
        </Text>

        {/* Liste des opérateurs */}
        <Stack spacing="xs">
          <Text size="sm" weight={500}>
            Opérateurs disponibles
          </Text>

          {availableOperators.map((operator) => (
            <Card
              key={operator.id}
              padding="md"
              withBorder
              style={{
                cursor: 'pointer',
                backgroundColor: selectedOperatorId === operator.id ? '#f0f7ff' : 'white',
                borderColor: selectedOperatorId === operator.id ? '#228be6' : '#dee2e6',
              }}
              onClick={() => handleSelectOperator(operator.id)}
            >
              <Group>
                <Avatar color="blue" radius="xl">
                  <IconUser size={20} />
                </Avatar>
                <div style={{ flex: 1 }}>
                  <Text weight={500}>{getOperatorDisplayName(operator)}</Text>
                  <Text size="xs" color="dimmed">
                    {operator.username}
                  </Text>
                </div>
              </Group>
            </Card>
          ))}
        </Stack>

        {/* Section PIN (si mode PIN activé) */}
        {pinMode && selectedOperatorId && (
          <Stack spacing="xs">
            <Text size="sm" weight={500}>
              Code PIN pour {selectedOperator ? getOperatorDisplayName(selectedOperator) : ''}
            </Text>
            <PinInput
              length={4}
              value={pin}
              onChange={setPin}
              type="number"
              mask
              placeholder=""
              size="lg"
              autoFocus
            />
          </Stack>
        )}

        {/* Boutons d'action */}
        <Group position="right" mt="md">
          <Button variant="subtle" onClick={onClose}>
            Annuler
          </Button>
          <Button
            leftIcon={<IconLogin size={16} />}
            onClick={pinMode ? handlePinAuth : () => {
              if (!selectedOperatorId) {
                showNotification({
                  title: 'Erreur',
                  message: 'Veuillez sélectionner un opérateur',
                  color: 'red',
                });
                return;
              }
              // En mode sans PIN, on change directement l'opérateur
              // (ceci devrait être géré par le parent)
              const operator = availableOperators.find(op => op.id === selectedOperatorId);
              if (operator) {
                // Note: Sans PIN, on devrait utiliser le token actuel de l'utilisateur connecté
                // Ceci est une simplification - à adapter selon les besoins
                showNotification({
                  title: 'Info',
                  message: 'Le changement sans PIN nécessite une implémentation spécifique',
                  color: 'orange',
                });
              }
            }}
            loading={loading}
            disabled={!selectedOperatorId || (pinMode && pin.length !== 4)}
          >
            Changer d'opérateur
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default OperatorLockScreen;
