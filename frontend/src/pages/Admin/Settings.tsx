import React, { useEffect, useState } from 'react';
import { Container, Title, Card, Text, Switch, Stack, Alert, Button, Group } from '@mantine/core';
import { IconSettings, IconAlertCircle } from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import settingsService from '../../services/settingsService';

const Settings: React.FC = () => {
  const [pinModeEnabled, setPinModeEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const pinMode = await settingsService.getPinModeEnabled();
      setPinModeEnabled(pinMode);
    } catch (error) {
      console.error('Error loading settings:', error);
      showNotification({
        title: 'Erreur',
        message: 'Impossible de charger les paramètres',
        color: 'red',
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handlePinModeToggle = async (value: boolean) => {
    setLoading(true);
    try {
      await settingsService.setPinModeEnabled(value);
      setPinModeEnabled(value);
      showNotification({
        title: 'Succès',
        message: `Mode PIN ${value ? 'activé' : 'désactivé'} avec succès`,
        color: 'green',
      });
    } catch (error) {
      console.error('Error updating PIN mode:', error);
      showNotification({
        title: 'Erreur',
        message: 'Impossible de mettre à jour le mode PIN',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Container size="lg" py="xl">
        <Text>Chargement...</Text>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Group mb="xl">
        <IconSettings size={32} />
        <Title order={1}>Paramètres</Title>
      </Group>

      <Stack spacing="md">
        <Card shadow="sm" padding="lg">
          <Stack spacing="md">
            <div>
              <Text weight={500} size="lg" mb="xs">
                Sécurité de la Caisse
              </Text>
              <Text size="sm" color="dimmed" mb="md">
                Configurez les paramètres de sécurité pour les sessions de caisse
              </Text>
            </div>

            <Switch
              label="Activer le mode PIN pour la caisse"
              description="Lorsqu'activé, les utilisateurs devront saisir un code PIN à 4 chiffres pour changer d'opérateur"
              checked={pinModeEnabled}
              onChange={(event) => handlePinModeToggle(event.currentTarget.checked)}
              disabled={loading}
              size="md"
            />

            {pinModeEnabled && (
              <Alert icon={<IconAlertCircle size={16} />} title="Mode PIN activé" color="blue">
                <Text size="sm">
                  Les utilisateurs peuvent définir leur code PIN à 4 chiffres dans leur profil.
                  Le changement d'opérateur en caisse nécessitera la saisie de ce PIN.
                </Text>
              </Alert>
            )}
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg">
          <Stack spacing="md">
            <div>
              <Text weight={500} size="lg" mb="xs">
                Informations
              </Text>
              <Text size="sm" color="dimmed">
                Mode PIN : {pinModeEnabled ? 'Activé' : 'Désactivé'}
              </Text>
            </div>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
};

export default Settings;
