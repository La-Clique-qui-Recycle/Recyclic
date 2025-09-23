import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { createSite, updateSite } from '../../services/api';

const FormContainer = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
  max-width: 500px;
  margin: 0 auto;
`;

const FormTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #333;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #555;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #2e7d32;
    box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.2);
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Checkbox = styled.input`
  margin: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;

  ${props => props.variant === 'primary' ? `
    background: #2e7d32;
    color: white;

    &:hover {
      background: #1b5e20;
    }
  ` : `
    background: #f5f5f5;
    color: #666;
    border: 1px solid #ddd;

    &:hover {
      background: #e0e0e0;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #f44336;
  font-size: 14px;
  margin-top: 8px;
`;

// Create a global style for screen reader only content
const GlobalStyle = styled.div`
  .sr-only {
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

interface Props {
  site?: Site | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SiteForm({ site, onSuccess, onCancel }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    country: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name || '',
        address: site.address || '',
        city: site.city || '',
        postal_code: site.postal_code || '',
        country: site.country || '',
        is_active: site.is_active
      });
    }
    // Reset validation state when site changes
    setFieldErrors({});
    setTouched({});
    setError(null);
  }, [site]);

  const validateField = (name: string, value: string): string | null => {
    switch (name) {
      case 'name':
        if (!value.trim()) {
          return 'Le nom du site est obligatoire';
        }
        if (value.trim().length < 2) {
          return 'Le nom doit contenir au moins 2 caractères';
        }
        if (value.trim().length > 100) {
          return 'Le nom ne peut pas dépasser 100 caractères';
        }
        return null;

      case 'address':
        if (value && value.length > 200) {
          return 'L\'adresse ne peut pas dépasser 200 caractères';
        }
        return null;

      case 'city':
        if (value && value.length > 100) {
          return 'La ville ne peut pas dépasser 100 caractères';
        }
        return null;

      case 'postal_code':
        if (value && !/^[0-9A-Za-z\s-]{2,10}$/.test(value)) {
          return 'Le code postal doit contenir 2 à 10 caractères alphanumériques';
        }
        return null;

      case 'country':
        if (value && value.length > 100) {
          return 'Le pays ne peut pas dépasser 100 caractères';
        }
        return null;

      default:
        return null;
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    Object.keys(formData).forEach(key => {
      if (key !== 'is_active') {
        const error = validateField(key, formData[key as keyof typeof formData] as string);
        if (error) {
          errors[key] = error;
        }
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched for validation display
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (site) {
        await updateSite(site.id, formData);
      } else {
        await createSite(formData);
      }
      onSuccess();
    } catch (e: any) {
      console.error('Erreur lors de la sauvegarde du site:', e);
      let errorMessage = 'Erreur lors de la sauvegarde';

      if (e?.response?.status === 401) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (e?.response?.status === 403) {
        errorMessage = 'Vous n\'avez pas les permissions nécessaires pour cette action.';
      } else if (e?.response?.status === 409) {
        errorMessage = 'Un site avec ce nom existe déjà.';
      } else if (e?.response?.status === 422) {
        errorMessage = 'Données invalides. Veuillez vérifier les champs.';
        // Handle field-specific validation errors from server
        if (e?.response?.data?.detail && Array.isArray(e.response.data.detail)) {
          const serverErrors: Record<string, string> = {};
          e.response.data.detail.forEach((err: any) => {
            if (err.loc && err.loc.length > 0) {
              const field = err.loc[err.loc.length - 1];
              serverErrors[field] = err.msg;
            }
          });
          setFieldErrors(serverErrors);
        }
      } else if (e?.response?.status >= 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer dans quelques instants.';
      } else if (e?.code === 'NETWORK_ERROR' || !navigator.onLine) {
        errorMessage = 'Problème de connexion réseau. Veuillez vérifier votre connexion internet.';
      } else if (e?.response?.data?.detail) {
        errorMessage = e.response.data.detail;
      } else if (e?.message) {
        errorMessage = e.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }

    // Clear general error when user makes changes
    if (error) {
      setError(null);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate field on blur
    if (name !== 'is_active') {
      const fieldError = validateField(name, value);
      if (fieldError) {
        setFieldErrors(prev => ({
          ...prev,
          [name]: fieldError
        }));
      }
    }
  };

  return (
    <>
      <GlobalStyle />
      <FormContainer
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-form-title"
        aria-describedby="site-form-description"
        data-testid="site-form-container"
      >
      <FormTitle id="site-form-title">
        {site ? 'Modifier le site' : 'Créer un site'}
      </FormTitle>
      <div id="site-form-description" className="sr-only">
        {site
          ? `Formulaire de modification du site ${site.name}. Utilisez Tab pour naviguer entre les champs et Entrée pour soumettre.`
          : 'Formulaire de création d\'un nouveau site. Le nom est obligatoire. Utilisez Tab pour naviguer entre les champs et Entrée pour soumettre.'
        }
      </div>
      <form
        onSubmit={handleSubmit}
        role="form"
        aria-labelledby="site-form-title"
        noValidate
        data-testid="site-form"
      >
        <FormGroup>
          <Label htmlFor="name">Nom *</Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            aria-required="true"
            aria-describedby={`name-description ${fieldErrors.name ? 'name-error' : ''}`}
            aria-invalid={fieldErrors.name ? 'true' : 'false'}
            placeholder="Entrez le nom du site"
            data-testid="site-name-input"
            style={{
              borderColor: fieldErrors.name ? '#f44336' : undefined,
              borderWidth: fieldErrors.name ? '2px' : undefined,
            }}
          />
          <div id="name-description" className="sr-only">
            Le nom du site est obligatoire et doit être unique
          </div>
          {fieldErrors.name && (
            <ErrorMessage
              id="name-error"
              role="alert"
              aria-live="polite"
              data-testid="name-error"
            >
              {fieldErrors.name}
            </ErrorMessage>
          )}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="address">Adresse</Label>
          <Input
            id="address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-describedby={`address-description ${fieldErrors.address ? 'address-error' : ''}`}
            aria-invalid={fieldErrors.address ? 'true' : 'false'}
            placeholder="Entrez l'adresse du site"
            data-testid="site-address-input"
            style={{
              borderColor: fieldErrors.address ? '#f44336' : undefined,
              borderWidth: fieldErrors.address ? '2px' : undefined,
            }}
          />
          <div id="address-description" className="sr-only">
            Adresse physique du site (optionnel)
          </div>
          {fieldErrors.address && (
            <ErrorMessage
              id="address-error"
              role="alert"
              aria-live="polite"
              data-testid="address-error"
            >
              {fieldErrors.address}
            </ErrorMessage>
          )}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="city">Ville</Label>
          <Input
            id="city"
            name="city"
            type="text"
            value={formData.city}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-describedby={`city-description ${fieldErrors.city ? 'city-error' : ''}`}
            aria-invalid={fieldErrors.city ? 'true' : 'false'}
            placeholder="Entrez la ville"
            data-testid="site-city-input"
            style={{
              borderColor: fieldErrors.city ? '#f44336' : undefined,
              borderWidth: fieldErrors.city ? '2px' : undefined,
            }}
          />
          <div id="city-description" className="sr-only">
            Ville où se trouve le site (optionnel)
          </div>
          {fieldErrors.city && (
            <ErrorMessage
              id="city-error"
              role="alert"
              aria-live="polite"
              data-testid="city-error"
            >
              {fieldErrors.city}
            </ErrorMessage>
          )}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="postal_code">Code postal</Label>
          <Input
            id="postal_code"
            name="postal_code"
            type="text"
            value={formData.postal_code}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-describedby={`postal-code-description ${fieldErrors.postal_code ? 'postal-code-error' : ''}`}
            aria-invalid={fieldErrors.postal_code ? 'true' : 'false'}
            placeholder="Entrez le code postal"
            data-testid="site-postal-code-input"
            style={{
              borderColor: fieldErrors.postal_code ? '#f44336' : undefined,
              borderWidth: fieldErrors.postal_code ? '2px' : undefined,
            }}
          />
          <div id="postal-code-description" className="sr-only">
            Code postal du site (optionnel)
          </div>
          {fieldErrors.postal_code && (
            <ErrorMessage
              id="postal-code-error"
              role="alert"
              aria-live="polite"
              data-testid="postal-code-error"
            >
              {fieldErrors.postal_code}
            </ErrorMessage>
          )}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="country">Pays</Label>
          <Input
            id="country"
            name="country"
            type="text"
            value={formData.country}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-describedby={`country-description ${fieldErrors.country ? 'country-error' : ''}`}
            aria-invalid={fieldErrors.country ? 'true' : 'false'}
            placeholder="Entrez le pays"
            data-testid="site-country-input"
            style={{
              borderColor: fieldErrors.country ? '#f44336' : undefined,
              borderWidth: fieldErrors.country ? '2px' : undefined,
            }}
          />
          <div id="country-description" className="sr-only">
            Pays où se trouve le site (optionnel)
          </div>
          {fieldErrors.country && (
            <ErrorMessage
              id="country-error"
              role="alert"
              aria-live="polite"
              data-testid="country-error"
            >
              {fieldErrors.country}
            </ErrorMessage>
          )}
        </FormGroup>

        <FormGroup>
          <CheckboxContainer>
            <Checkbox
              id="is_active"
              name="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={handleChange}
              aria-describedby="active-description"
              data-testid="site-active-checkbox"
            />
            <Label htmlFor="is_active">Site actif</Label>
          </CheckboxContainer>
          <div id="active-description" className="sr-only">
            Cochez cette case pour activer le site. Les sites inactifs ne seront pas disponibles pour les opérations.
          </div>
        </FormGroup>

        {error && (
          <ErrorMessage
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            data-testid="form-error-message"
          >
            {error}
          </ErrorMessage>
        )}

        <ButtonGroup role="group" aria-label="Actions du formulaire">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            aria-label="Annuler et fermer le formulaire"
            data-testid="cancel-button"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            aria-label={
              loading
                ? 'Sauvegarde en cours, veuillez patienter'
                : site
                ? `Modifier le site ${site.name}`
                : 'Créer le nouveau site'
            }
            data-testid="submit-button"
          >
            {loading ? 'Sauvegarde...' : site ? 'Modifier' : 'Créer'}
          </Button>
        </ButtonGroup>
      </form>
    </FormContainer>
    </>
  );
}