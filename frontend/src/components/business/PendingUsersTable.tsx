import React from 'react';
import {
  Table,
  Button,
  Group,
  Text,
  Badge,
  ActionIcon,
  Tooltip,
  Modal,
  Textarea,
  Stack,
  Alert
} from '@mantine/core';
import { IconCheck, IconX, IconEye, IconAlertCircle } from '@tabler/icons-react';
import { AdminUser, UserStatus } from '../../services/adminService';

interface PendingUsersTableProps {
  users: AdminUser[];
  loading: boolean;
  onApprove: (userId: string, message?: string) => Promise<boolean>;
  onReject: (userId: string, reason?: string) => Promise<boolean>;
  onViewUser: (user: AdminUser) => void;
}

const PendingUsersTable: React.FC<PendingUsersTableProps> = ({
  users,
  loading,
  onApprove,
  onReject,
  onViewUser
}) => {
  const [approveModalOpen, setApproveModalOpen] = React.useState(false);
  const [rejectModalOpen, setRejectModalOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<AdminUser | null>(null);
  const [approveMessage, setApproveMessage] = React.useState('');
  const [rejectReason, setRejectReason] = React.useState('');
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const handleApproveClick = (user: AdminUser) => {
    setSelectedUser(user);
    setApproveMessage('');
    setApproveModalOpen(true);
  };

  const handleRejectClick = (user: AdminUser) => {
    setSelectedUser(user);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedUser) return;
    
    setActionLoading(selectedUser.id);
    try {
      const success = await onApprove(selectedUser.id, approveMessage);
      if (success) {
        setApproveModalOpen(false);
        setSelectedUser(null);
        setApproveMessage('');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedUser) return;
    
    setActionLoading(selectedUser.id);
    try {
      const success = await onReject(selectedUser.id, rejectReason);
      if (success) {
        setRejectModalOpen(false);
        setSelectedUser(null);
        setRejectReason('');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case UserStatus.PENDING:
        return <Badge color="yellow" variant="light">En attente</Badge>;
      case UserStatus.APPROVED:
        return <Badge color="green" variant="light">Approuvé</Badge>;
      case UserStatus.REJECTED:
        return <Badge color="red" variant="light">Rejeté</Badge>;
      default:
        return <Badge color="gray" variant="light">Inconnu</Badge>;
    }
  };

  if (loading) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Chargement...">
        Récupération des utilisateurs en attente...
      </Alert>
    );
  }

  if (users.length === 0) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Aucun utilisateur en attente">
        Tous les utilisateurs ont été traités.
      </Alert>
    );
  }

  return (
    <>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Utilisateur</Table.Th>
            <Table.Th>Telegram ID</Table.Th>
            <Table.Th>Rôle</Table.Th>
            <Table.Th>Statut</Table.Th>
            <Table.Th>Date d'inscription</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users.map((user) => (
            <Table.Tr key={user.id}>
              <Table.Td>
                <div>
                  <Text fw={500}>{user.full_name || user.username || 'Utilisateur'}</Text>
                  {user.first_name && user.last_name && (
                    <Text size="sm" c="dimmed">
                      {user.first_name} {user.last_name}
                    </Text>
                  )}
                </div>
              </Table.Td>
              <Table.Td>
                <Text font="monospace">{user.telegram_id}</Text>
              </Table.Td>
              <Table.Td>
                <Badge variant="outline">{user.role}</Badge>
              </Table.Td>
              <Table.Td>
                {getStatusBadge(user.status)}
              </Table.Td>
              <Table.Td>
                <Text size="sm">
                  {new Date(user.created_at).toLocaleDateString('fr-FR')}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Tooltip label="Voir les détails">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => onViewUser(user)}
                      data-testid={`view-user-${user.id}`}
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Approuver">
                    <ActionIcon
                      variant="subtle"
                      color="green"
                      onClick={() => handleApproveClick(user)}
                      loading={actionLoading === user.id}
                      data-testid={`approve-user-${user.id}`}
                    >
                      <IconCheck size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Rejeter">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleRejectClick(user)}
                      loading={actionLoading === user.id}
                      data-testid={`reject-user-${user.id}`}
                    >
                      <IconX size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {/* Modal d'approbation */}
      <Modal
        opened={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Approuver l'utilisateur"
        centered
      >
        <Stack gap="md">
          <Text>
            Êtes-vous sûr de vouloir approuver l'utilisateur{' '}
            <Text component="span" fw={500}>
              {selectedUser?.full_name || selectedUser?.username}
            </Text> ?
          </Text>
          <Textarea
            label="Message de bienvenue (optionnel)"
            placeholder="Message personnalisé à envoyer à l'utilisateur..."
            value={approveMessage}
            onChange={(e) => setApproveMessage(e.target.value)}
            rows={3}
          />
          <Group justify="flex-end" gap="sm">
            <Button
              variant="outline"
              onClick={() => setApproveModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              color="green"
              onClick={handleApproveConfirm}
              loading={actionLoading === selectedUser?.id}
            >
              Approuver
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal de rejet */}
      <Modal
        opened={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Rejeter l'utilisateur"
        centered
      >
        <Stack gap="md">
          <Text>
            Êtes-vous sûr de vouloir rejeter l'utilisateur{' '}
            <Text component="span" fw={500}>
              {selectedUser?.full_name || selectedUser?.username}
            </Text> ?
          </Text>
          <Textarea
            label="Raison du rejet (optionnel)"
            placeholder="Expliquez pourquoi l'utilisateur est rejeté..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <Group justify="flex-end" gap="sm">
            <Button
              variant="outline"
              onClick={() => setRejectModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              color="red"
              onClick={handleRejectConfirm}
              loading={actionLoading === selectedUser?.id}
            >
              Rejeter
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default PendingUsersTable;
