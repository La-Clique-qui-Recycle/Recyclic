import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getSites, deleteSite, getSiteDependencies } from '../../services/api';
import SiteForm from '../../components/business/SiteForm';
import SiteDeleteConfirmationModal from '../../components/business/SiteDeleteConfirmationModal';

const Container = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
`;

const TitleBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const Title = styled.h2`
  margin: 0;
`;

const Button = styled.button`
  background: #2e7d32;
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 6px;
  cursor: pointer;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 10px;
  border-bottom: 1px solid #eee;
`;

const Td = styled.td`
  padding: 10px;
  border-bottom: 1px solid #f5f5f5;
`;

const ActionButton = styled.button<{ variant?: 'edit' | 'delete' }>`
  padding: 4px 8px;
  margin: 0 2px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;

  ${props => props.variant === 'edit' ? `
    background: #2196f3;
    color: white;

    &:hover {
      background: #1976d2;
    }
  ` : `
    background: #f44336;
    color: white;

    &:hover {
      background: #d32f2f;
    }
  `}
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ScreenReaderOnly = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;

  &.sr-only {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }
`;

interface Site {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  is_active: boolean;
}

export default function Sites() {
  const [items, setItems] = useState<Site[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    site: Site | null;
    dependencies?: any;
    checkingDependencies?: boolean;
  }>({
    isOpen: false,
    site: null
  });
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSites();
      // Fallback: ensure data is an array to prevent .map() crashes
      const normalizedItems = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.data)
          ? (data as any).data
          : Array.isArray((data as any)?.results)
            ? (data as any).results
            : [];
      setItems(normalizedItems as Site[]);
    } catch (e: any) {
      console.error('Erreur lors du chargement des sites:', e);
      let errorMessage = 'Erreur de chargement des sites';

      if (e?.response?.status === 401) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (e?.response?.status === 403) {
        errorMessage = 'Vous n\'avez pas les permissions nécessaires pour accéder aux sites.';
      } else if (e?.response?.status === 404) {
        errorMessage = 'Service de gestion des sites temporairement indisponible.';
      } else if (e?.response?.status >= 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer dans quelques instants.';
      } else if (e?.code === 'ERR_NETWORK' || e?.code === 'NETWORK_ERROR' || !navigator.onLine) {
        errorMessage = 'Problème de connexion réseau. Vérifiez votre connexion internet.';
      } else if (e?.message) {
        errorMessage = e.message;
      }

      setError(errorMessage);
      setItems([]); // Prevent crash by ensuring items is always an array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Keyboard navigation support for modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showForm && event.key === 'Escape') {
        handleFormCancel();
      }

      if (deleteModal.isOpen && event.key === 'Escape') {
        handleDeleteCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showForm, deleteModal.isOpen]);

  const handleCreate = () => {
    setEditingSite(null);
    setShowForm(true);
  };

  const handleEdit = (site: Site) => {
    setEditingSite(site);
    setShowForm(true);
  };

  const handleDelete = async (site: Site) => {
    setDeleteModal({
      isOpen: true,
      site,
      dependencies: null,
      checkingDependencies: true,
    });

    try {
      const dependencies = await getSiteDependencies(site.id);
      setDeleteModal((prev) => ({
        ...prev,
        dependencies,
        checkingDependencies: false,
      }));
    } catch (error) {
      console.error('Erreur lors de la vérification des dépendances:', error);
      setDeleteModal((prev) => ({
        ...prev,
        dependencies: {
          error: 'Impossible de vérifier les dépendances du site',
          hasBlockingDependencies: false,
        },
        checkingDependencies: false,
      }));
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingSite(null);
    loadItems();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingSite(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.site) return;

    try {
      setActionLoading(true);
      setError(null); // Clear any previous errors
      await deleteSite(deleteModal.site.id);
      setDeleteModal({
        isOpen: false,
        site: null,
        dependencies: undefined,
        checkingDependencies: false,
      });
      loadItems();
    } catch (e: any) {
      console.error('Erreur lors de la suppression du site:', e);
      let errorMessage = 'Erreur lors de la suppression du site';

      if (e?.response?.status === 401) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (e?.response?.status === 403) {
        errorMessage = 'Vous n\'avez pas les permissions nécessaires pour supprimer ce site.';
      } else if (e?.response?.status === 404) {
        errorMessage = 'Ce site n\'existe plus ou a déjà été supprimé.';
      } else if (e?.response?.status === 409) {
        errorMessage = 'Ce site ne peut pas être supprimé car il est utilisé par d\'autres éléments du système.';
      } else if (e?.response?.status >= 500) {
        errorMessage = 'Erreur serveur lors de la suppression. Veuillez réessayer.';
      } else if (e?.code === 'ERR_NETWORK' || e?.code === 'NETWORK_ERROR' || !navigator.onLine) {
        errorMessage = 'Problème de connexion réseau. Veuillez vérifier votre connexion internet.';
      } else if (e?.response?.data?.detail) {
        errorMessage = e.response.data.detail;
      } else if (e?.message) {
        errorMessage = e.message;
      }

      setError(errorMessage);
      // Keep the modal open to show the error and allow retry
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      site: null,
      dependencies: undefined,
      checkingDependencies: false,
    });
  };

  return (
    <Container>
      <TitleBar>
        <Title id="sites-title">Sites</Title>
        <Button
          onClick={handleCreate}
          aria-label="Créer un nouveau site"
          data-testid="create-site-button"
        >
          Créer un site
        </Button>
      </TitleBar>

      {loading && (
        <div
          role="status"
          aria-live="polite"
          aria-label="Chargement des sites en cours"
          data-testid="loading-indicator"
        >
          Chargement...
        </div>
      )}

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            color: '#d32f2f',
            backgroundColor: '#ffebee',
            border: '1px solid #ffcdd2',
            borderRadius: '4px',
            padding: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          data-testid="error-message"
        >
          <span>{error}</span>
          <Button
            onClick={loadItems}
            style={{
              marginLeft: '16px',
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: '#1976d2',
              color: 'white',
            }}
            aria-label="Réessayer le chargement des sites"
            data-testid="retry-button"
          >
            Réessayer
          </Button>
        </div>
      )}

      {!loading && !error && (
        <Table
          role="table"
          aria-labelledby="sites-title"
          aria-describedby="sites-description"
          data-testid="sites-table"
        >
          <div id="sites-description" className="sr-only">
            Table des sites avec leurs informations et actions disponibles
          </div>
          <thead>
            <tr role="row">
              <Th role="columnheader" scope="col">Nom</Th>
              <Th role="columnheader" scope="col">Adresse</Th>
              <Th role="columnheader" scope="col">Ville</Th>
              <Th role="columnheader" scope="col">Code postal</Th>
              <Th role="columnheader" scope="col">Pays</Th>
              <Th role="columnheader" scope="col">Actif</Th>
              <Th role="columnheader" scope="col">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr role="row">
                <Td role="cell" colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                  <div
                    style={{
                      color: '#666',
                      fontSize: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '16px',
                    }}
                    data-testid="empty-state"
                  >
                    <div style={{ fontSize: '48px', opacity: 0.3 }}>🏢</div>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                        Aucun site configuré
                      </div>
                      <div style={{ fontSize: '14px', marginBottom: '16px' }}>
                        Commencez par créer votre premier site pour organiser vos opérations.
                      </div>
                      <Button
                        onClick={handleCreate}
                        style={{
                          backgroundColor: '#2e7d32',
                          color: 'white',
                          padding: '8px 16px',
                        }}
                        aria-label="Créer le premier site"
                        data-testid="create-first-site-button"
                      >
                        Créer un site
                      </Button>
                    </div>
                  </div>
                </Td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} role="row">
                  <Td role="cell">{item.name}</Td>
                  <Td role="cell">{item.address || '-'}</Td>
                  <Td role="cell">{item.city || '-'}</Td>
                  <Td role="cell">{item.postal_code || '-'}</Td>
                  <Td role="cell">{item.country || '-'}</Td>
                  <Td role="cell">
                    <span
                      aria-label={item.is_active ? 'Site actif' : 'Site inactif'}
                      data-testid={`site-status-${item.id}`}
                    >
                      {item.is_active ? 'Oui' : 'Non'}
                    </span>
                  </Td>
                  <Td role="cell">
                    <ActionButton
                      variant="edit"
                      onClick={() => handleEdit(item)}
                      aria-label={`Modifier le site ${item.name}`}
                      data-testid={`edit-site-${item.id}`}
                      title={`Modifier le site ${item.name}`}
                    >
                      Modifier
                    </ActionButton>
                    <ActionButton
                      variant="delete"
                      onClick={() => handleDelete(item)}
                      aria-label={`Supprimer le site ${item.name}`}
                      data-testid={`delete-site-${item.id}`}
                      title={`Supprimer le site ${item.name}`}
                    >
                      Supprimer
                    </ActionButton>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}

      {showForm && (
        <ModalOverlay
          onClick={handleFormCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby={editingSite ? "edit-site-modal-title" : "create-site-modal-title"}
          data-testid="site-form-modal"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="document"
            aria-describedby="site-form-content"
          >
            <ScreenReaderOnly
              id={editingSite ? "edit-site-modal-title" : "create-site-modal-title"}
            >
              {editingSite ? `Modifier le site ${editingSite.name}` : "Créer un nouveau site"}
            </ScreenReaderOnly>
            <SiteForm
              site={editingSite}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        </ModalOverlay>
      )}

      <SiteDeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        siteName={deleteModal.site?.name || ''}
        dependencies={deleteModal.dependencies}
        checkingDependencies={deleteModal.checkingDependencies}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={actionLoading}
      />
    </Container>
  );
}
