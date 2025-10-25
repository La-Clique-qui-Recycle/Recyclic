import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Stack, Paper, Title, Text, Button, Group } from '@mantine/core';
import { IconBuilding, IconCashRegister, IconArrowLeft } from '@tabler/icons-react';
import styled from 'styled-components';

// Styles pour les boutons de navigation
const NavigationButton = styled(Button)`
  width: 100%;
  height: 120px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.2s ease;
  min-height: 120px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    height: 100px;
    font-size: 1rem;
    min-height: 100px;
  }

  @media (max-width: 480px) {
    height: 90px;
    font-size: 0.95rem;
    min-height: 90px;
  }
`;

const SitesAndRegistersPage = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleBackToDashboard = () => {
    navigate('/admin');
  };

  return (
    <Stack gap={{ base: 'lg', sm: 'xl' }} style={{ gap: '24px' }}>
      {/* Header avec bouton retour */}
      <Group justify="space-between" align="center">
        <Title order={1} size={{ base: 'h2', sm: 'h1' }}>
          Gestion des Sites et Caisses
        </Title>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={16} />}
          onClick={handleBackToDashboard}
        >
          Retour au Dashboard
        </Button>
      </Group>

      {/* Description */}
      <Paper p="md" withBorder bg="gray.0">
        <Text size="md" c="dimmed" ta="center">
          Choisissez l'option que vous souhaitez gérer
        </Text>
      </Paper>

      {/* Navigation principale - 2 boutons */}
      <Paper p="md" withBorder>
        <Stack gap="md" style={{ gap: '16px' }}>
          <Title order={2} size={{ base: 'h4', sm: 'h3' }} mb="sm" ta="center">
            Options de Gestion
          </Title>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NavigationButton
                variant="light"
                color="blue"
                onClick={() => handleNavigation('/admin/sites')}
                leftSection={<IconBuilding size={32} />}
              >
                <Stack gap="xs" align="center">
                  <Text size="lg" fw={700}>Gérer les Sites</Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Configurer les sites de collecte et leurs paramètres
                  </Text>
                </Stack>
              </NavigationButton>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NavigationButton
                variant="light"
                color="green"
                onClick={() => handleNavigation('/admin/cash-registers')}
                leftSection={<IconCashRegister size={32} />}
              >
                <Stack gap="xs" align="center">
                  <Text size="lg" fw={700}>Gérer les Postes de Caisse</Text>
                  <Text size="sm" c="dimmed" ta="center">
                    Configurer les postes de caisse et leurs paramètres
                  </Text>
                </Stack>
              </NavigationButton>
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default SitesAndRegistersPage;
