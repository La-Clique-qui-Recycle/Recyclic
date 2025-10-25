import React, { useState, useEffect } from 'react';
import { Paper, Text, Group, Collapse, Stack, Badge, Button, Loader } from '@mantine/core';
import { IconBell, IconChevronDown, IconChevronUp, IconAlertTriangle, IconPackage, IconCurrencyEuro, IconCash } from '@tabler/icons-react';
import axiosClient from '../../api/axiosClient';

const HeaderAlerts = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      
      console.log('Récupération des alertes...');
      
      // Récupérer les alertes depuis les endpoints existants
      const [currentSessionResponse, ticketsResponse] = await Promise.all([
        axiosClient.get('/v1/cash-sessions/current'),
        axiosClient.get('/v1/reception/tickets?status=opened&per_page=100')
      ]);

      console.log('Session courante:', currentSessionResponse.data);
      console.log('Tickets de réception ouverts:', ticketsResponse.data);

      const newAlerts = [];

      // Sessions de caisse ouvertes
      if (currentSessionResponse.data && currentSessionResponse.data !== null) {
        const session = currentSessionResponse.data;
        if (session.status === 'open') {
          const openTime = new Date(session.opened_at);
          const hoursOpen = Math.floor((Date.now() - openTime.getTime()) / (1000 * 60 * 60));
          const minutesOpen = Math.floor((Date.now() - openTime.getTime()) / (1000 * 60));
          
          // Alerte pour toute session ouverte (plus de 2h ou moins)
          newAlerts.push({
            id: `session-${session.id}`,
            type: 'info',
            icon: <IconCash size={16} />,
            title: 'Session caisse ouverte',
            message: hoursOpen > 0 ? `Depuis ${hoursOpen}h` : `Depuis ${minutesOpen}min`,
            color: '#10b981' // Vert doux et reposant
          });
        }
      } else {
        console.log('Aucune session ouverte trouvée');
      }

      // Tickets de réception ouverts
      if (ticketsResponse.data?.tickets?.length > 0) {
        const openTickets = ticketsResponse.data.tickets; // Déjà filtrés par status=opened
        console.log('Tickets ouverts trouvés:', openTickets.length);
        
        if (openTickets.length > 1) {
          newAlerts.push({
            id: `tickets-${openTickets.length}`,
            type: 'info',
            icon: <IconPackage size={16} />,
            title: 'Tickets de réception ouverts',
            message: `${openTickets.length} tickets en cours`,
            color: '#06b6d4' // Cyan doux et reposant
          });
        }
      }

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAlerts = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Paper p="sm" withBorder bg="gray.0" style={{ borderRadius: '8px' }}>
      <Group gap="xs" align="center" justify="space-between">
        <Group gap="xs" align="center">
          <IconBell size={16} color="#64748b" />
          <Text size="sm" c="dimmed" fw={500}>Notifications</Text>
          {alerts.length > 0 && (
            <Badge size="sm" color="blue" variant="light">
              {alerts.length}
            </Badge>
          )}
        </Group>
        
        <Button
          variant="subtle"
          size="xs"
          onClick={toggleAlerts}
          rightSection={isOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        >
          {isOpen ? 'Masquer' : 'Voir'}
        </Button>
      </Group>

      <Collapse in={isOpen}>
        <Stack gap="xs" mt="sm">
          {loading ? (
            <Group justify="center" p="sm">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">Chargement des notifications...</Text>
            </Group>
          ) : alerts.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" p="sm">
              Aucune notification
            </Text>
          ) : (
            alerts.map((alert) => (
              <Paper
                key={alert.id}
                p="xs"
                withBorder
                style={{
                  borderLeft: `3px solid ${alert.color}`,
                  backgroundColor: `${alert.color}10`
                }}
              >
                <Group gap="xs" align="flex-start">
                  <div style={{ color: alert.color }}>
                    {alert.icon}
                  </div>
                  <Stack gap={2} style={{ flex: 1 }}>
                    <Text size="sm" fw={500} c="dark">
                      {alert.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {alert.message}
                    </Text>
                  </Stack>
                </Group>
              </Paper>
            ))
          )}
        </Stack>
      </Collapse>
    </Paper>
  );
};

export default HeaderAlerts;
