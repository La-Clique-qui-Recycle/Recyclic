import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Title, 
  Text, 
  Group, 
  Select, 
  TextInput, 
  Button, 
  Stack, 
  Alert, 
  Pagination, 
  Grid, 
  Paper,
  Table,
  Badge,
  ActionIcon,
  Tooltip,
  Modal,
  ScrollArea,
  Divider
} from '@mantine/core';
import { 
  IconSearch, 
  IconRefresh, 
  IconAlertCircle, 
  IconMail,
  IconEye,
  IconClock,
  IconCheck,
  IconX,
  IconBolt,
  IconClick,
  IconEyeCheck
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useEmailLogsStore } from '../../stores/emailLogsStore';
import { EmailLog, EmailStatus, EmailType } from '../../services/emailLogService';

const AdminEmailLogs: React.FC = () => {
  const {
    emailLogs,
    loading,
    error,
    total,
    page,
    perPage,
    totalPages,
    filters,
    fetchEmailLogs,
    setFilters,
    setPage,
    setPerPage
  } = useEmailLogsStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchEmailLogs();
  }, [fetchEmailLogs]);

  const handleSearch = () => {
    setFilters({
      ...filters,
      recipient_email: searchTerm || undefined,
      page: 1
    });
    setPage(1);
    fetchEmailLogs();
  };

  const handleFilterChange = (key: string, value: string | undefined) => {
    setFilters({
      ...filters,
      [key]: value,
      page: 1
    });
    setPage(1);
    fetchEmailLogs();
  };

  const handleRefresh = () => {
    fetchEmailLogs();
    notifications.show({
      title: 'Actualisation',
      message: 'Liste des emails actualisée',
      color: 'blue'
    });
  };

  const getStatusIcon = (status: EmailStatus) => {
    switch (status) {
      case EmailStatus.SENT:
        return <IconMail size={16} color="blue" />;
      case EmailStatus.DELIVERED:
        return <IconCheck size={16} color="green" />;
          case EmailStatus.OPENED:
            return <IconEyeCheck size={16} color="teal" />;
      case EmailStatus.CLICKED:
        return <IconClick size={16} color="purple" />;
      case EmailStatus.BOUNCED:
        return <IconBolt size={16} color="red" />;
      case EmailStatus.FAILED:
        return <IconX size={16} color="red" />;
      case EmailStatus.PENDING:
        return <IconClock size={16} color="orange" />;
      default:
        return <IconMail size={16} />;
    }
  };

  const getStatusColor = (status: EmailStatus) => {
    switch (status) {
      case EmailStatus.SENT:
        return 'blue';
      case EmailStatus.DELIVERED:
        return 'green';
      case EmailStatus.OPENED:
        return 'teal';
      case EmailStatus.CLICKED:
        return 'purple';
      case EmailStatus.BOUNCED:
        return 'red';
      case EmailStatus.FAILED:
        return 'red';
      case EmailStatus.PENDING:
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getTypeColor = (type: EmailType) => {
    switch (type) {
      case EmailType.PASSWORD_RESET:
        return 'red';
      case EmailType.WELCOME:
        return 'green';
      case EmailType.NOTIFICATION:
        return 'blue';
      case EmailType.ADMIN_NOTIFICATION:
        return 'purple';
      default:
        return 'gray';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR');
  };

  const handleViewDetails = (log: EmailLog) => {
    setSelectedLog(log);
    setDetailModalOpen(true);
  };

  if (error) {
    return (
      <Container size="xl" py="md">
        <Alert icon={<IconAlertCircle size={16} />} title="Erreur" color="red">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Stack spacing="md">
        <Group position="apart">
          <Title order={2}>Journal des Emails</Title>
          <Button
            leftIcon={<IconRefresh size={16} />}
            onClick={handleRefresh}
            loading={loading}
          >
            Actualiser
          </Button>
        </Group>

        {/* Filtres */}
        <Paper p="md" withBorder>
          <Grid>
            <Grid.Col span={12} md={4}>
              <TextInput
                placeholder="Rechercher par email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<IconSearch size={16} />}
              />
            </Grid.Col>
            <Grid.Col span={12} md={3}>
              <Select
                placeholder="Statut"
                value={filters.status || ''}
                onChange={(value) => handleFilterChange('status', value || undefined)}
                data={[
                  { value: '', label: 'Tous les statuts' },
                  { value: EmailStatus.PENDING, label: 'En attente' },
                  { value: EmailStatus.SENT, label: 'Envoyé' },
                  { value: EmailStatus.DELIVERED, label: 'Livré' },
                  { value: EmailStatus.OPENED, label: 'Ouvert' },
                  { value: EmailStatus.CLICKED, label: 'Cliqué' },
                  { value: EmailStatus.BOUNCED, label: 'Rebondi' },
                  { value: EmailStatus.FAILED, label: 'Échec' }
                ]}
              />
            </Grid.Col>
            <Grid.Col span={12} md={3}>
              <Select
                placeholder="Type"
                value={filters.email_type || ''}
                onChange={(value) => handleFilterChange('email_type', value || undefined)}
                data={[
                  { value: '', label: 'Tous les types' },
                  { value: EmailType.PASSWORD_RESET, label: 'Réinitialisation mot de passe' },
                  { value: EmailType.WELCOME, label: 'Bienvenue' },
                  { value: EmailType.NOTIFICATION, label: 'Notification' },
                  { value: EmailType.ADMIN_NOTIFICATION, label: 'Notification admin' },
                  { value: EmailType.OTHER, label: 'Autre' }
                ]}
              />
            </Grid.Col>
            <Grid.Col span={12} md={2}>
              <Button onClick={handleSearch} fullWidth>
                Rechercher
              </Button>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Tableau des emails */}
        <Paper withBorder>
          <ScrollArea>
            <Table striped highlightOnHover>
              <thead>
                <tr>
                  <th>Destinataire</th>
                  <th>Sujet</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Date d'envoi</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {emailLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div>
                        <Text size="sm" weight={500}>{log.recipient_email}</Text>
                        {log.recipient_name && (
                          <Text size="xs" color="dimmed">{log.recipient_name}</Text>
                        )}
                      </div>
                    </td>
                    <td>
                      <Text size="sm" lineClamp={2}>{log.subject}</Text>
                    </td>
                    <td>
                      <Badge color={getTypeColor(log.email_type)} size="sm">
                        {log.email_type}
                      </Badge>
                    </td>
                    <td>
                      <Group spacing="xs">
                        {getStatusIcon(log.status)}
                        <Badge color={getStatusColor(log.status)} size="sm">
                          {log.status}
                        </Badge>
                      </Group>
                    </td>
                    <td>
                      <Text size="sm">{formatDate(log.created_at)}</Text>
                    </td>
                    <td>
                      <Tooltip label="Voir les détails">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => handleViewDetails(log)}
                        >
                          <IconEye size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </ScrollArea>
        </Paper>

        {/* Pagination */}
        {totalPages > 1 && (
          <Group position="center">
            <Pagination
              page={page}
              onChange={setPage}
              total={totalPages}
              size="sm"
            />
          </Group>
        )}

        {/* Modal de détails */}
        <Modal
          opened={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title="Détails de l'email"
          size="lg"
        >
          {selectedLog && (
            <Stack spacing="md">
              <div>
                <Text size="sm" weight={500}>Destinataire</Text>
                <Text>{selectedLog.recipient_email}</Text>
                {selectedLog.recipient_name && (
                  <Text size="sm" color="dimmed">{selectedLog.recipient_name}</Text>
                )}
              </div>

              <div>
                <Text size="sm" weight={500}>Sujet</Text>
                <Text>{selectedLog.subject}</Text>
              </div>

              <div>
                <Text size="sm" weight={500}>Type</Text>
                <Badge color={getTypeColor(selectedLog.email_type)}>
                  {selectedLog.email_type}
                </Badge>
              </div>

              <div>
                <Text size="sm" weight={500}>Statut</Text>
                <Group spacing="xs">
                  {getStatusIcon(selectedLog.status)}
                  <Badge color={getStatusColor(selectedLog.status)}>
                    {selectedLog.status}
                  </Badge>
                </Group>
              </div>

              <Divider />

              <div>
                <Text size="sm" weight={500}>Timestamps</Text>
                <Stack spacing="xs">
                  <Text size="sm">Créé: {formatDate(selectedLog.created_at)}</Text>
                  {selectedLog.sent_at && (
                    <Text size="sm">Envoyé: {formatDate(selectedLog.sent_at)}</Text>
                  )}
                  {selectedLog.delivered_at && (
                    <Text size="sm">Livré: {formatDate(selectedLog.delivered_at)}</Text>
                  )}
                  {selectedLog.opened_at && (
                    <Text size="sm">Ouvert: {formatDate(selectedLog.opened_at)}</Text>
                  )}
                  {selectedLog.clicked_at && (
                    <Text size="sm">Cliqué: {formatDate(selectedLog.clicked_at)}</Text>
                  )}
                  {selectedLog.bounced_at && (
                    <Text size="sm">Rebondi: {formatDate(selectedLog.bounced_at)}</Text>
                  )}
                </Stack>
              </div>

              {selectedLog.error_message && (
                <div>
                  <Text size="sm" weight={500}>Message d'erreur</Text>
                  <Text size="sm" color="red">{selectedLog.error_message}</Text>
                </div>
              )}

              {selectedLog.external_id && (
                <div>
                  <Text size="sm" weight={500}>ID externe</Text>
                  <Text size="sm" color="dimmed">{selectedLog.external_id}</Text>
                </div>
              )}
            </Stack>
          )}
        </Modal>
      </Stack>
    </Container>
  );
};

export default AdminEmailLogs;


