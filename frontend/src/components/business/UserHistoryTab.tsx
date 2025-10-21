import React, { useState, useEffect } from 'react';
import {
  Stack,
  Group,
  TextInput,
  Button,
  Text,
  Timeline,
  Badge,
  Alert,
  Skeleton,
  Pagination,
  Paper,
  MultiSelect
} from '@mantine/core';
import { 
  IconSearch, 
  IconCalendar, 
  IconFilter, 
  IconAlertCircle,
  IconShield,
  IconShoppingCart,
  IconTruck,
  IconUser,
  IconSettings,
  IconX
} from '@tabler/icons-react';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from 'react-hook-form';
import { useAdminStore, HistoryFilters } from '../../stores/adminStore';
import { HistoryEvent } from '../../services/adminService';

interface UserHistoryTabProps {
  userId: string;
}

export const UserHistoryTab: React.FC<UserHistoryTabProps> = ({ userId }) => {
  const {
    userHistory: events,
    historyLoading: loading,
    historyError: error,
    fetchUserHistory
  } = useAdminStore();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { register, handleSubmit, reset, watch, setValue } = useForm<HistoryFilters>({
    defaultValues: {
      startDate: null,
      endDate: null,
      eventType: [],
      search: ''
    }
  });

  const hasActiveFilters = !!(
    watch('startDate') ||
    watch('endDate') ||
    (watch('eventType') && watch('eventType')!.length > 0) ||
    (watch('search') && watch('search')!.trim() !== '')
  );

  useEffect(() => {
    fetchUserHistory(userId);
  }, [userId, fetchUserHistory]);

  const handleFilter = (data: HistoryFilters) => {
    fetchUserHistory(userId, data);
  };

  const handleClearFilters = () => {
    reset();
    fetchUserHistory(userId);
  };

  const getEventIcon = (type: HistoryEvent['type']) => {
    switch (type) {
      case 'ADMINISTRATION':
        return <IconShield size={16} />;
      case 'VENTE':
        return <IconShoppingCart size={16} />;
      case 'DÉPÔT':
        return <IconTruck size={16} />;
      case 'CONNEXION':
        return <IconUser size={16} />;
      default:
        return <IconSettings size={16} />;
    }
  };

  const getEventColor = (type: HistoryEvent['type']) => {
    switch (type) {
      case 'ADMINISTRATION':
        return 'blue';
      case 'VENTE':
        return 'green';
      case 'DÉPÔT':
        return 'orange';
      case 'CONNEXION':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(events.length / itemsPerPage);
  const paginatedEvents = events.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <Stack gap="md">
        <Skeleton height={40} />
        <Skeleton height={200} />
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      {/* Zone de filtres */}
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Text size="sm" fw={500} c="dimmed">
            Filtres
          </Text>
          
          <Group grow>
            <DatePickerInput
              label="Date de début"
              placeholder="Sélectionner une date"
              leftSection={<IconCalendar size={16} />}
              value={watch('startDate')}
              onChange={(date) => setValue('startDate', date)}
            />
            <DatePickerInput
              label="Date de fin"
              placeholder="Sélectionner une date"
              leftSection={<IconCalendar size={16} />}
              value={watch('endDate')}
              onChange={(date) => setValue('endDate', date)}
            />
          </Group>
          
          <Group grow>
            <MultiSelect
              label="Type d'événement"
              placeholder="Sélectionner les types"
              data={[
                { value: 'ADMINISTRATION', label: 'Administration' },
                { value: 'VENTE', label: 'Vente' },
                { value: 'DÉPÔT', label: 'Dépôt' },
                { value: 'CONNEXION', label: 'Connexion' },
                { value: 'AUTRE', label: 'Autre' }
              ]}
              value={watch('eventType')}
              onChange={(values) => setValue('eventType', values)}
            />
            <TextInput
              label="Recherche"
              placeholder="Rechercher dans les événements..."
              leftSection={<IconSearch size={16} />}
              {...register('search')}
            />
          </Group>
          
          <Group justify="flex-end" gap="xs">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              leftSection={<IconX size={16} />}
              size="sm"
            >
              Effacer
            </Button>
            <Button
              onClick={handleSubmit(handleFilter)}
              leftSection={<IconFilter size={16} />}
              size="sm"
            >
              Appliquer
            </Button>
          </Group>
        </Stack>
      </Paper>

      {/* Liste des événements */}
      {error ? (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Erreur"
          color="red"
        >
          {error}
        </Alert>
      ) : paginatedEvents.length === 0 ? (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title={hasActiveFilters ? 'Aucun événement trouvé' : 'Aucune activité enregistrée pour cet utilisateur'}
          color="blue"
        >
          {hasActiveFilters
            ? 'Aucun événement ne correspond aux critères de recherche.'
            : 'Aucune activité enregistrée pour cet utilisateur'}
        </Alert>
      ) : (
        <Timeline active={-1} bulletSize={24} lineWidth={2}>
          {paginatedEvents.map((event) => (
            <Timeline.Item
              key={event.id}
              data-testid="timeline-item"
              bullet={getEventIcon(event.type)}
              title={
                <Group gap="xs">
                  <Text size="sm" fw={500}>
                    {formatTimestamp(event.timestamp)}
                  </Text>
                  <Badge
                    color={getEventColor(event.type)}
                    variant="light"
                    size="sm"
                  >
                    {event.type}
                  </Badge>
                </Group>
              }
            >
              <Text size="sm" c="dimmed">
                {event.description}
              </Text>
            </Timeline.Item>
          ))}
        </Timeline>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Group justify="center">
          <Pagination
            value={currentPage}
            onChange={setCurrentPage}
            total={totalPages}
            size="sm"
          />
        </Group>
      )}

      {/* Informations de pagination */}
      {events.length > 0 && (
        <Group justify="center">
          <Text size="sm" c="dimmed">
            {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, events.length)} sur {events.length} événements
          </Text>
        </Group>
      )}
    </Stack>
  );
};

export default UserHistoryTab;
