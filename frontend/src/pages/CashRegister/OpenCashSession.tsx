import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Paper, Title, TextInput, Select, Button, Group, Alert, LoadingOverlay } from '@mantine/core';
import { IconCash, IconUser, IconCurrencyEuro, IconAlertCircle, IconBuilding, IconCashRegister } from '@tabler/icons-react';
import { useCashSessionStore } from '../../stores/cashSessionStore';
import { cashSessionService } from '../../services/cashSessionService';
import { useAuthStore } from '../../stores/authStore';
import { CashRegistersApi, SitesApi } from '../../generated/api';

interface OpenCashSessionProps {
  onSessionOpened?: (sessionId: string) => void;
}

const OpenCashSession: React.FC<OpenCashSessionProps> = ({ onSessionOpened }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuthStore();
  const { 
    openSession, 
    loading, 
    error, 
    clearError ,
    resumeSession
  } = useCashSessionStore();

  const [formData, setFormData] = useState({
    operator_id: currentUser?.id || 'test-user-id',
    site_id: currentUser?.site_id || '',
    register_id: '',
    initial_amount: 0
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [sites, setSites] = useState<Array<{value: string, label: string}>>([]);
  const [cashRegisters, setCashRegisters] = useState<Array<{value: string, label: string}>>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingRegisters, setLoadingRegisters] = useState(false);
  const [registerStatus, setRegisterStatus] = useState<{ is_active: boolean; session_id: string | null }>({ is_active: false, session_id: null });
  // Si on vient avec une intention de reprise, tenter immédiatement
  useEffect(() => {
    const tryImmediateResume = async () => {
      const st: any = location.state;
      if (st?.intent === 'resume' && st?.register_id) {
        const status = await cashSessionService.getRegisterSessionStatus(st.register_id);
        if (status.is_active && status.session_id) {
          const ok = await resumeSession(status.session_id);
          if (ok) {
            navigate('/cash-register/sale');
          }
        }
      }
    };
    tryImmediateResume();
  }, [location.state, navigate, resumeSession]);

  // Effacer les erreurs au montage du composant
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Charger les sites au montage
  useEffect(() => {
    loadSites();
  }, []);

  // Charger les caisses quand le site change
  useEffect(() => {
    if (formData.site_id) {
      loadCashRegisters(formData.site_id);
    } else {
      setCashRegisters([]);
      setFormData(prev => ({ ...prev, register_id: '' }));
    }
  }, [formData.site_id]);

  // UX-B10: Vérifier le statut de la caisse quand le register_id change
  useEffect(() => {
    const checkRegisterStatus = async () => {
      if (!formData.register_id) {
        setRegisterStatus({ is_active: false, session_id: null });
        return;
      }
      const status = await cashSessionService.getRegisterSessionStatus(formData.register_id);
      setRegisterStatus(status);
    };
    checkRegisterStatus();
  }, [formData.register_id]);

  const loadSites = async () => {
    setLoadingSites(true);
    try {
      const response = await SitesApi.sitesapiv1sitesget();
      // Mapping robuste des réponses
      const sitesData = Array.isArray(response) ? response :
        (Array.isArray(response?.data) ? response.data :
        (Array.isArray(response?.sites) ? response.sites : []));
      
      const sitesOptions = sitesData.map(site => ({
        value: site.id,
        label: `${site.name} (${site.location || 'Sans localisation'})`
      }));
      setSites(sitesOptions);
      
      // Pré-sélectionner le premier site
      if (sitesOptions.length > 0) {
        setFormData(prev => ({ ...prev, site_id: sitesOptions[0].value }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sites:', error);
      setSites([]);
    } finally {
      setLoadingSites(false);
    }
  };

  const loadCashRegisters = async (siteId: string) => {
    setLoadingRegisters(true);
    try {
      const response = await CashRegistersApi.cashregistersapiv1cashregistersget({ site_id: siteId });
      // Mapping robuste des réponses
      const registersData = Array.isArray(response) ? response :
        (Array.isArray(response?.data) ? response.data :
        (Array.isArray(response?.registers) ? response.registers : []));
      
      const registersOptions = registersData.map(register => ({
        value: register.id,
        label: `${register.name} (${register.location || 'Sans localisation'})`
      }));
      setCashRegisters(registersOptions);
      
      // Pré-sélectionner la première caisse
      if (registersOptions.length > 0) {
        setFormData(prev => ({ ...prev, register_id: registersOptions[0].value }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des caisses:', error);
      setCashRegisters([]);
    } finally {
      setLoadingRegisters(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.operator_id) {
      errors.operator_id = 'Veuillez sélectionner un opérateur';
    } else if (!/^[0-9a-fA-F-]{36}$/.test(formData.operator_id)) {
      errors.operator_id = 'ID opérateur invalide';
    }

    if (!formData.site_id) {
      errors.site_id = 'Veuillez sélectionner un site';
    } else if (!/^[0-9a-fA-F-]{36}$/.test(formData.site_id)) {
      errors.site_id = 'ID site invalide';
    }

    if (!formData.register_id) {
      errors.register_id = 'Veuillez sélectionner une caisse';
    } else if (!/^[0-9a-fA-F-]{36}$/.test(formData.register_id)) {
      errors.register_id = 'ID caisse invalide';
    }

    if (formData.initial_amount < 0) {
      errors.initial_amount = 'Le montant initial ne peut pas être négatif';
    }

    if (formData.initial_amount > 10000) {
      errors.initial_amount = 'Le montant initial ne peut pas dépasser 10 000€';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Logging en dev
    if (import.meta.env.MODE !== 'production') {
      console.debug('Payload session:', formData);
      console.debug('Types des valeurs:', {
        operator_id_type: typeof formData.operator_id,
        site_id_type: typeof formData.site_id,
        register_id_type: typeof formData.register_id,
        initial_amount_type: typeof formData.initial_amount
      });
    }

    try {
      // UX-B10: si une session est active pour cette caisse, reprendre
      if (registerStatus.is_active && registerStatus.session_id) {
        const ok = await resumeSession(registerStatus.session_id);
        if (ok) {
          if (onSessionOpened) {
            onSessionOpened(registerStatus.session_id);
          } else {
            navigate('/cash-register/sale');
          }
          return;
        }
      }

      const session = await openSession({
        operator_id: formData.operator_id,
        site_id: formData.site_id,
        register_id: formData.register_id,
        initial_amount: formData.initial_amount
      });

      if (session) {
        // Redirection vers l'interface de vente
        if (onSessionOpened) {
          onSessionOpened(session.id);
        } else {
          navigate('/cash-register/sale');
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de session:', error);
    }
  };

  const handleCancel = () => {
    navigate('/caisse');
  };

  return (
    <Container size="sm" py="xl">
      <Paper shadow="sm" p="xl" radius="md">
        <LoadingOverlay visible={loading} />
        
        <Group mb="xl">
          <IconCash size={32} color="#228be6" />
          <Title order={2}>Ouverture de Session de Caisse</Title>
        </Group>

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title={error.includes('déjà ouverte') ? 'Session existante' : 'Erreur'}
            color={error.includes('déjà ouverte') ? 'blue' : 'red'}
            mb="md"
            onClose={clearError}
            withCloseButton
          >
            {error}
            {error.includes('déjà ouverte') && (
              <Group mt="sm">
                <Button
                  size="sm"
                  variant="light"
                  onClick={() => navigate('/cash-register/sale')}
                >
                  Aller à la vente
                </Button>
              </Group>
            )}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Select
            label="Opérateur"
            placeholder="Sélectionnez l'opérateur"
            value={formData.operator_id}
            onChange={(value) => handleInputChange('operator_id', value || '')}
            data={[
              { value: currentUser?.id || 'test-user-id', label: currentUser?.username || 'Utilisateur actuel' }
            ]}
            required
            error={validationErrors.operator_id}
            icon={<IconUser size={16} />}
            mb="md"
          />

          <Select
            label="Site"
            placeholder="Sélectionnez un site"
            value={formData.site_id}
            onChange={(value) => handleInputChange('site_id', value || '')}
            data={sites}
            required
            error={validationErrors.site_id}
            icon={<IconBuilding size={16} />}
            mb="md"
            loading={loadingSites}
            disabled={loadingSites}
            description="Choisissez le site où vous travaillez"
          />

          <Select
            label="Caisse"
            placeholder="Sélectionnez une caisse"
            value={formData.register_id}
            onChange={(value) => handleInputChange('register_id', value || '')}
            data={cashRegisters}
            required
            error={validationErrors.register_id}
            icon={<IconCashRegister size={16} />}
            mb="md"
            loading={loadingRegisters}
            disabled={loadingRegisters || !formData.site_id}
            description={!formData.site_id ? "Sélectionnez d'abord un site" : "Choisissez la caisse à utiliser"}
          />

          <TextInput
            label="Fond de caisse initial"
            placeholder="0.00"
            value={String(formData.initial_amount)}
            onChange={(e) => handleInputChange('initial_amount', e.target.value === '' ? 0 : parseFloat(e.target.value))}
            type="number"
            step="0.01"
            min="0"
            max="10000"
            required
            error={validationErrors.initial_amount}
            icon={<IconCurrencyEuro size={16} />}
            mb="xl"
            description="Montant en euros (ex: 50.00)"
          />
          {/* Erreur rendue via TextInput.error pour éviter les doublons */}

          <Group position="right">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Annuler
            </Button>
            {registerStatus.is_active ? (
              <Button
                type="submit"
                loading={loading}
                leftIcon={<IconCash size={16} />}
                color="green"
              >
                Reprendre la Session
              </Button>
            ) : (
              <Button
                type="submit"
                loading={loading}
                leftIcon={<IconCash size={16} />}
              >
                Ouvrir la Session
              </Button>
            )}
          </Group>
        </form>
      </Paper>
    </Container>
  );
};

export default OpenCashSession;
