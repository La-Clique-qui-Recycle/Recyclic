import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { createCashRegister, updateCashRegister, getSites } from '../../services/api';

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

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  
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
  color: #d32f2f;
  font-size: 12px;
  margin-top: 4px;
`;

interface CashRegister {
  id?: string;
  name: string;
  location?: string;
  site_id?: string;
  is_active: boolean;
}

interface Site {
  id: string;
  name: string;
}

interface CashRegisterFormProps {
  register?: CashRegister | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CashRegisterForm({ register, onSuccess, onCancel }: CashRegisterFormProps) {
  const [formData, setFormData] = useState<CashRegister>({
    name: '',
    location: '',
    site_id: '',
    is_active: true
  });
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (register) {
      setFormData(register);
    }
  }, [register]);

useEffect(() => {
  const loadSites = async () => {
    try {
      const sitesData = await getSites();
      setSites(sitesData);

      if (!register?.id && sitesData.length > 0) {
        setFormData(prev => ({
          ...prev,
          site_id: prev.site_id || sitesData[0].id,
        }));
      }
    } catch (err) {
      console.error('Erreur lors du chargement des sites:', err);
      setError('Impossible de récupérer la liste des sites. Vérifiez la configuration.');
    }
  };
  loadSites();
}, [register?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

  if (!formData.site_id) {
    setLoading(false);
    setError('Veuillez sélectionner un site pour ce poste de caisse.');
    return;
  }

  try {
    if (register?.id) {
      await updateCashRegister(register.id, formData);
    } else {
      await createCashRegister(formData);
    }
    onSuccess();
  } catch (err: any) {
    const message =
      err?.response?.data?.detail ||
      err?.message ||
      'Une erreur est survenue lors de l’enregistrement.';
    setError(message);
  } finally {
    setLoading(false);
  }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <FormContainer>
      <FormTitle>
        {register?.id ? 'Modifier le poste de caisse' : 'Créer un poste de caisse'}
      </FormTitle>
      
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="name">Nom *</Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="location">Localisation</Label>
          <Input
            id="location"
            name="location"
            type="text"
            value={formData.location}
            onChange={handleChange}
            disabled={loading}
            placeholder="Ex: Entrée principale, Atelier..."
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="site_id">Site</Label>
          <Select
            id="site_id"
            name="site_id"
            value={formData.site_id}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">Sélectionner un site</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <CheckboxContainer>
            <Checkbox
              id="is_active"
              name="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={handleChange}
              disabled={loading}
            />
            <Label htmlFor="is_active">Poste actif</Label>
          </CheckboxContainer>
        </FormGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <ButtonGroup>
          <Button type="button" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Enregistrement...' : (register?.id ? 'Modifier' : 'Créer')}
          </Button>
        </ButtonGroup>
      </form>
    </FormContainer>
  );
}
