import React, { useState } from 'react';
import { Card, Text, Button, PinInput, Stack, Group, Alert } from '@mantine/core';
import { IconLock, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import pinService from '../../services/pinService';

const PinSettings: React.FC = () => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSetPin = async () => {
    // Validation
    if (pin.length !== 4) {
      showNotification({
        title: 'Erreur',
        message: 'Le PIN doit contenir exactement 4 chiffres',
        color: 'red',
      });
      return;
    }

    if (pin !== confirmPin) {
      showNotification({
        title: 'Erreur',
        message: 'Les codes PIN ne correspondent pas',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      await pinService.setPin(pin);
      setSuccess(true);
      setPin('');
      setConfirmPin('');
      showNotification({
        title: 'Succès',
        message: 'Votre code PIN a été défini avec succès',
        color: 'green',
      });

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error setting PIN:', error);
      showNotification({
        title: 'Erreur',
        message: error.response?.data?.detail || 'Impossible de définir le code PIN',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card shadow="sm" padding="lg" mt="md">
      <Stack spacing="md">
        <Group>
          <IconLock size={24} />
          <Text weight={500} size="lg">
            Code PIN de Caisse
          </Text>
        </Group>

        <Text size="sm" color="dimmed">
          Définissez un code PIN à 4 chiffres pour sécuriser l'accès à la caisse et permettre le changement rapide d'opérateur.
        </Text>

        {success && (
          <Alert icon={<IconCheck size={16} />} title="PIN défini" color="green">
            Votre code PIN a été enregistré avec succès
          </Alert>
        )}

        <div>
          <Text size="sm" weight={500} mb="xs">
            Nouveau PIN
          </Text>
          <PinInput
            length={4}
            value={pin}
            onChange={setPin}
            type="number"
            mask
            placeholder=""
          />
        </div>

        <div>
          <Text size="sm" weight={500} mb="xs">
            Confirmer le PIN
          </Text>
          <PinInput
            length={4}
            value={confirmPin}
            onChange={setConfirmPin}
            type="number"
            mask
            placeholder=""
          />
        </div>

        <Alert icon={<IconAlertCircle size={16} />} title="Important" color="blue" variant="light">
          <Text size="xs">
            • Le code PIN doit contenir exactement 4 chiffres<br />
            • Ne partagez jamais votre code PIN<br />
            • Vous pourrez modifier votre PIN à tout moment
          </Text>
        </Alert>

        <Button
          leftIcon={<IconLock size={16} />}
          onClick={handleSetPin}
          loading={loading}
          disabled={pin.length !== 4 || confirmPin.length !== 4}
        >
          Définir le code PIN
        </Button>
      </Stack>
    </Card>
  );
};

export default PinSettings;
