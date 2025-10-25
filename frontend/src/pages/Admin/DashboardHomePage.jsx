import React, { useState, useEffect } from 'react';
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
  
  // États simples pour les valeurs des statistiques
  const [stats, setStats] = useState({
    ca: 0,
    donations: 0,
    weightReceived: 0,
    weightSold: 0
  });

  const handleNavigation = (path) => {
    navigate(path);
  };

  // Récupération simple des valeurs selon B37-12
  const fetchStats = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      // 1. Statistiques financières + poids vendu
      const financialResponse = await axiosClient.get('/v1/cash-sessions/stats/summary', {
        params: {
          date_from: startOfDay.toISOString(),
          date_to: endOfDay.toISOString()
        }
      });
      
      // 2. Poids des matières reçues
      const receptionResponse = await axiosClient.get('/v1/stats/reception/summary', {
        params: {
          date_from: startOfDay.toISOString(),
          date_to: endOfDay.toISOString()
        }
      });
      
      setStats({
        ca: financialResponse.data.total_sales || 0,
        donations: financialResponse.data.total_donations || 0,
        weightReceived: Number(receptionResponse.data.total_weight) || 0,
        weightSold: Number(financialResponse.data.total_weight_sold) || 0
      });
      
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);


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
    <Stack gap={{ base: 'xs', sm: 'sm' }} style={{ gap: '8px' }}>
      <Title order={1} size={{ base: 'h1', sm: 'h1' }} ta="center" mb="xs" mt={0} fw={700}>Tableau de Bord d'Administration</Title>
      
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
      
        {/* Statistiques quotidiennes - 3 cartes harmonisées */}
        <Paper p="sm" withBorder>
          <Stack gap="sm" style={{ gap: '12px' }}>
            <Title order={2} size={{ base: 'h4', sm: 'h3' }} mb="xs">Statistiques quotidiennes</Title>
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              alignItems: 'stretch',
              '@media (max-width: 768px)': {
                flexDirection: 'column',
                gap: '12px'
              }
            }}>
              <Paper 
                p="md" 
                withBorder 
                bg="green.0" 
                className="stat-card"
                style={{ 
                  borderLeft: '4px solid #059669',
                  flex: 1,
                  minHeight: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  background: 'white'
                }}
              >
                <Stack gap="xs" align="center">
                  <Group gap="xs" align="center">
                    <IconCurrencyEuro size={20} color="#059669" />
                    <Text size="md" fw={600} c="dark">Financier</Text>
                  </Group>
                  <Text size="xl" fw={700} c="dark" style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
                    {(stats.ca + stats.donations).toFixed(2)}€
                  </Text>
                  <Text size="sm" c="dimmed" ta="center" style={{ fontSize: '14px', color: '#666' }}>
                    CA: {stats.ca.toFixed(2)}€ • Dons: {stats.donations.toFixed(2)}€
                  </Text>
                </Stack>
              </Paper>
              <Paper 
                p="md" 
                withBorder 
                bg="orange.0" 
                className="stat-card"
                style={{ 
                  borderLeft: '4px solid #d97706',
                  flex: 1,
                  minHeight: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  background: 'white'
                }}
              >
                <Stack gap="xs" align="center">
                  <Group gap="xs" align="center">
                    <IconPackage size={20} color="#d97706" />
                    <Text size="md" fw={600} c="dark">Poids sorti</Text>
                  </Group>
                  <Text size="xl" fw={700} c="dark" style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
                    {stats.weightSold.toFixed(1)} kg
                  </Text>
                  <Text size="sm" c="dimmed" ta="center" style={{ fontSize: '14px', color: '#666' }}>
                    Sorti aujourd'hui
                  </Text>
                </Stack>
              </Paper>
              <Paper 
                p="md" 
                withBorder 
                bg="blue.0" 
                className="stat-card"
                style={{ 
                  borderLeft: '4px solid #2563eb',
                  flex: 1,
                  minHeight: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  background: 'white'
                }}
              >
                <Stack gap="xs" align="center">
                  <Group gap="xs" align="center">
                    <IconScale size={20} color="#2563eb" />
                    <Text size="md" fw={600} c="dark">Poids reçu</Text>
                  </Group>
                  <Text size="xl" fw={700} c="dark" style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
                    {stats.weightReceived.toFixed(1)} kg
                  </Text>
                  <Text size="sm" c="dimmed" ta="center" style={{ fontSize: '14px', color: '#666' }}>
                    Reçu aujourd'hui
                  </Text>
                </Stack>
              </Paper>
            </div>
          </Stack>
        </Paper>

      {/* Navigation principale - Grille 3x2 */}
      <Paper p="sm" withBorder>
        <Stack gap="sm" style={{ gap: '12px' }}>
          <Title order={2} size={{ base: 'h4', sm: 'h3' }} mb="xs">Navigation principale</Title>
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
        <Paper p="sm" withBorder bg="#f8f9fa" className="super-admin-section">
          <Stack gap="sm" style={{ gap: '12px' }}>
            <Title order={2} size={{ base: 'h4', sm: 'h3' }} mb="xs" c="dimmed">Administration Super-Admin</Title>
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
                  onClick={() => handleNavigation('/admin/sites-and-registers')}
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
