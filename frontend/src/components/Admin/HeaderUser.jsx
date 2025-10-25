import React, { useState, useEffect } from 'react';
import { Paper, Text, Group, Collapse, Stack, Badge, Button, Avatar } from '@mantine/core';
import { IconUser, IconChevronDown, IconChevronUp, IconUsers } from '@tabler/icons-react';
import { useAuthStore } from '../../stores/authStore';
import axiosClient from '../../api/axiosClient';

const HeaderUser = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = useAuthStore((state) => state.currentUser);

  useEffect(() => {
    fetchConnectedUsers();
    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(fetchConnectedUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchConnectedUsers = async () => {
    try {
      setLoading(true);
      
      // Récupérer les statuts des utilisateurs (en ligne/hors ligne)
      const response = await axiosClient.get('/v1/admin/users/statuses');
      
      if (response.data?.user_statuses?.length > 0) {
        // Filtrer uniquement les utilisateurs en ligne
        const onlineStatuses = response.data.user_statuses.filter(status => status.is_online);
        
        // Récupérer les informations complètes des utilisateurs en ligne
        const usersResponse = await axiosClient.get('/v1/users/');
        const allUsers = usersResponse.data || [];
        
        // Combiner les statuts avec les informations utilisateurs
        const onlineUsersWithInfo = onlineStatuses.map(status => {
          const userInfo = allUsers.find(user => user.id === status.user_id);
          return {
            ...status,
            ...userInfo,
            // Garder les infos de statut
            is_online: status.is_online,
            last_login: status.last_login,
            minutes_since_login: status.minutes_since_login
          };
        });
        
        setConnectedUsers(onlineUsersWithInfo);
        console.log('Utilisateurs en ligne avec infos:', onlineUsersWithInfo.length, 'sur', response.data.user_statuses.length);
      } else {
        setConnectedUsers([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      setConnectedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleUsers = () => {
    setIsOpen(!isOpen);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'super-admin':
        return 'red';
      case 'admin':
        return 'blue';
      case 'operator':
        return 'green';
      default:
        return 'green'; // Bénévole en vert
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'super-admin':
        return 'Super-Admin';
      case 'admin':
        return 'Admin';
      case 'operator':
        return 'Opérateur';
      default:
        return 'Bénévole';
    }
  };

  return (
    <Paper p="sm" withBorder bg="gray.0" style={{ borderRadius: '8px' }}>
      <Group gap="xs" align="center" justify="space-between">
        <Group gap="xs" align="center">
          <IconUser size={16} color="#64748b" />
          <Text size="sm" fw={600} c="dark">
            Utilisateurs connectés
          </Text>
          {connectedUsers.length > 0 && (
            <Badge size="sm" color="blue" variant="light">
              {connectedUsers.length}
            </Badge>
          )}
        </Group>
        
        {connectedUsers.length > 0 && (
          <Button
            variant="subtle"
            size="xs"
            onClick={toggleUsers}
            rightSection={isOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
          >
            {isOpen ? 'Masquer' : 'Voir'}
          </Button>
        )}
      </Group>

      <Collapse in={isOpen}>
        <Stack gap="xs" mt="sm">
          {loading ? (
            <Group justify="center" p="sm">
              <Text size="sm" c="dimmed">Chargement...</Text>
            </Group>
          ) : connectedUsers.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" p="sm">
              Aucun utilisateur connecté
            </Text>
          ) : (
            <>
              
              {connectedUsers.map((user) => (
                <Paper
                  key={user.user_id || user.id}
                  p="xs"
                  withBorder
                  style={{ backgroundColor: '#f8f9fa' }}
                >
                  <Group gap="xs" align="center">
                    <Avatar size="sm" color={getRoleColor(user.role)}>
                      {user.first_name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'B'}
                    </Avatar>
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Text size="sm" fw={500} c="dark">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user.username || `Bénévole ${user.user_id}`
                        }
                      </Text>
                      <Badge size="xs" color={getRoleColor(user.role)} variant="light">
                        {getRoleLabel(user.role)}
                      </Badge>
                    </Stack>
                    {user.last_login && (
                      <Text size="xs" c="dimmed">
                        {new Date(user.last_login).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    )}
                  </Group>
                </Paper>
              ))}
            </>
          )}
        </Stack>
      </Collapse>
    </Paper>
  );
};

export default HeaderUser;
