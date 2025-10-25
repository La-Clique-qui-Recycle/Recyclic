import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Stack, Paper, Title, Text, Button, Group } from '@mantine/core';
import { IconBell, IconChartBar, IconUser, IconCurrencyEuro, IconScale, IconPackage, IconUsers, IconShield, IconTags, IconCash, IconReport, IconActivity, IconSettings, IconBuilding } from '@tabler/icons-react';
import styled from 'styled-components';
import { useAuthStore } from '../../stores/authStore';
import axiosClient from '../../api/axiosClient';
import HeaderAlerts from '../../components/Admin/HeaderAlerts';
import HeaderCA from '../../components/Admin/HeaderCA';
import HeaderUser from '../../components/Admin/HeaderUser';
// Styles pour les boutons des fonctions opérationnelles
const OperationalButton = styled(Button)`
  width: 100%;
  height: 64px; /* Augmenté pour plus de présence */
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.2s ease;
  min-height: 48px; /* Minimum tactile recommandé */
  padding: 12px 16px; /* Padding généreux */

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    height: 60px; /* Plus grand pour le tactile */
  font-size: 0.95rem;
    min-height: 48px; /* Respect du minimum tactile */
  }

  @media (max-width: 480px) {
    height: 56px;
    font-size: 0.9rem;
    min-height: 48px;
  }
`;

// Style spécial pour les boutons Super-Admin
const SuperAdminButton = styled(Button)`
  width: 100%;
  height: 64px;
  font-size: 1rem;
  font-weight: 500; /* Plus discret */
  border-radius: 8px;
  transition: all 0.2s ease;
  min-height: 48px;
  padding: 12px 16px;
  background-color: #f1f5f9; /* Background plus discret */
  border: 1px solid #e2e8f0;
  color: #64748b; /* Couleur plus discrète */

  &:hover {
    transform: translateY(-1px); /* Animation plus subtile */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    background-color: #e2e8f0;
  }

  @media (max-width: 768px) {
    height: 60px;
    font-size: 0.95rem;
    min-height: 48px;
  }

  @media (max-width: 480px) {
    height: 56px;
    font-size: 0.9rem;
    min-height: 48px;
  }
`;

const DashboardHomePage = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const isSuperAdmin = currentUser?.role === 'super-admin';
  

  const handleNavigation = (path) => {
    navigate(path);
  };


  const handleNavigateToLatestCashSession = async () => {
    try {
      const response = await axiosClient.get('/v1/cash-sessions/');
      const sessions = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
          ? response.data.data
          : [];

      if (sessions.length > 0 && sessions[0]?.id) {
        navigate(`/admin/cash-sessions/${sessions[0].id}`);
      } else {
        navigate('/admin/reports');
      }
    } catch (error) {
      console.error('Impossible de récupérer les sessions de caisse:', error);
      navigate('/admin/reports');
    }
  };

  return (
    <Stack gap={{ base: 'lg', sm: 'xl' }} style={{ gap: '24px' }}>
      <Title order={1} size={{ base: 'h2', sm: 'h1' }} ta="center" mb="md">Tableau de Bord d'Administration</Title>
      
      {/* Header - Statut Global - Structure 3 colonnes avec composants avancés */}
      <Paper p={{ base: 'sm', sm: 'md' }} withBorder bg="gray.0">
        <Grid align="center">
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <HeaderAlerts />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <HeaderCA />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <HeaderUser />
          </Grid.Col>
        </Grid>
      </Paper>
      
        {/* Statistiques quotidiennes - 3 cartes horizontales */}
        <Paper p="md" withBorder>
          <Stack gap="md" style={{ gap: '16px' }}>
            <Title order={2} size={{ base: 'h4', sm: 'h3' }} mb="sm">Statistiques quotidiennes</Title>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Paper 
                  p={{ base: 'sm', sm: 'md' }} 
                  withBorder 
                  bg="green.0" 
                  className="stat-card"
                  style={{ borderLeft: '4px solid #059669' }}
                >
                  <Stack gap={{ base: 'xs', sm: 'sm' }} align="center">
                    <IconCurrencyEuro size={32} color="#059669" />
                    <Text size={{ base: 'sm', sm: 'md' }} fw={700} c="dark">Financier</Text>
                    <Text size={{ base: 'xs', sm: 'sm' }} c="dimmed" ta="center">CA + Dons (€)</Text>
                  </Stack>
                </Paper>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Paper 
                  p={{ base: 'sm', sm: 'md' }} 
                  withBorder 
                  bg="blue.0" 
                  className="stat-card"
                  style={{ borderLeft: '4px solid #2563eb' }}
                >
                  <Stack gap={{ base: 'xs', sm: 'sm' }} align="center">
                    <IconScale size={32} color="#2563eb" />
                    <Text size={{ base: 'sm', sm: 'md' }} fw={700} c="dark">Poids reçu</Text>
                    <Text size={{ base: 'xs', sm: 'sm' }} c="dimmed" ta="center">Matières (kg)</Text>
                  </Stack>
                </Paper>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Paper 
                  p={{ base: 'sm', sm: 'md' }} 
                  withBorder 
                  bg="orange.0" 
                  className="stat-card"
                  style={{ borderLeft: '4px solid #d97706' }}
                >
                  <Stack gap={{ base: 'xs', sm: 'sm' }} align="center">
                    <IconPackage size={32} color="#d97706" />
                    <Text size={{ base: 'sm', sm: 'md' }} fw={700} c="dark">Poids sorti</Text>
                    <Text size={{ base: 'xs', sm: 'sm' }} c="dimmed" ta="center">Matières (kg)</Text>
                  </Stack>
                </Paper>
              </Grid.Col>
            </Grid>
          </Stack>
        </Paper>

      {/* Navigation principale - Grille 3x2 */}
      <Paper p="md" withBorder>
        <Stack gap="md" style={{ gap: '16px' }}>
          <Title order={2} size={{ base: 'h4', sm: 'h3' }} mb="sm">Navigation principale</Title>
          <Grid gutter="md">
            {/* Première rangée */}
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <OperationalButton
                variant="light"
                color="blue"
                className="nav-button"
                onClick={() => handleNavigation('/admin/users')}
                leftSection={<IconUsers size={20} />}
              >
                Utilisateurs & Profils
              </OperationalButton>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <OperationalButton
                variant="light"
                color="green"
                className="nav-button"
                onClick={() => handleNavigation('/admin/groups')}
                leftSection={<IconShield size={20} />}
              >
                Groupes & Permissions
              </OperationalButton>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <OperationalButton
                variant="light"
                color="orange"
                className="nav-button"
                onClick={() => handleNavigation('/admin/categories')}
                leftSection={<IconTags size={20} />}
              >
                Catégories & Tarifs
              </OperationalButton>
            </Grid.Col>
            
            {/* Deuxième rangée */}
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <OperationalButton
                variant="light"
                color="purple"
                className="nav-button"
                onClick={() => handleNavigation('/admin/session-manager')}
                leftSection={<IconCash size={20} />}
              >
                Sessions de Caisse
              </OperationalButton>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <OperationalButton
                variant="light"
                color="cyan"
                className="nav-button"
                onClick={() => handleNavigation('/admin/reports')}
                leftSection={<IconReport size={20} />}
              >
                Rapports & Exports
              </OperationalButton>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <OperationalButton
                variant="light"
                color="red"
                className="nav-button"
                onClick={() => handleNavigation('/admin/audit-log')}
                leftSection={<IconActivity size={20} />}
              >
                Activité & Logs
              </OperationalButton>
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>

      {/* Administration Super-Admin - 3 boutons horizontaux */}
      {isSuperAdmin && (
        <Paper p="md" withBorder bg="#f8f9fa" className="super-admin-section">
          <Stack gap="md" style={{ gap: '16px' }}>
            <Title order={2} size={{ base: 'h4', sm: 'h3' }} mb="sm" c="dimmed">Administration Super-Admin</Title>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <SuperAdminButton
                  onClick={() => handleNavigation('/admin/health')}
                  leftSection={<IconActivity size={20} />}
                >
                  Santé Système
                </SuperAdminButton>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <SuperAdminButton
                  onClick={() => handleNavigation('/admin/settings')}
                  leftSection={<IconSettings size={20} />}
                >
                  Paramètres Avancés
                </SuperAdminButton>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <SuperAdminButton
                  onClick={() => handleNavigation('/admin/sites')}
                  leftSection={<IconBuilding size={20} />}
                >
                  Sites & Caisses
                </SuperAdminButton>
              </Grid.Col>
            </Grid>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
};

export default DashboardHomePage;
