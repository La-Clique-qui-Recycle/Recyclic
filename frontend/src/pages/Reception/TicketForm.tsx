import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft, Save, Trash2, Edit, Check } from 'lucide-react';
import { useReception } from '../../contexts/ReceptionContext';
import NumericKeypad from '../../components/ui/NumericKeypad';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;

  &:hover {
    background: #5a6268;
  }
`;

const Title = styled.h1`
  margin: 0;
  color: #2e7d32;
  font-size: 1.8rem;
`;

const CloseTicketButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;

  &:hover {
    background: #218838;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  min-height: 600px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const LinesList = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 20px;
`;

const LinesTitle = styled.h2`
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.4rem;
`;

const LineItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 10px;
  background: #f9f9f9;
`;

const LineInfo = styled.div`
  flex: 1;
`;

const LineCategory = styled.div`
  font-weight: 500;
  color: #2e7d32;
  margin-bottom: 5px;
`;

const LineDetails = styled.div`
  font-size: 14px;
  color: #666;
`;

const LineActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;

  &.edit {
    background: #ffc107;
    color: #212529;
    
    &:hover {
      background: #e0a800;
    }
  }

  &.delete {
    background: #dc3545;
    color: white;
    
    &:hover {
      background: #c82333;
    }
  }
`;

const FormSection = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 20px;
`;

const FormTitle = styled.h2`
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.4rem;
`;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
`;

const CategoryButton = styled.button<{ $selected?: boolean }>`
  padding: 15px;
  border: 2px solid ${props => props.$selected ? '#2e7d32' : '#e0e0e0'};
  border-radius: 8px;
  background: ${props => props.$selected ? '#e8f5e8' : 'white'};
  color: ${props => props.$selected ? '#2e7d32' : '#333'};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    border-color: #2e7d32;
    background: #e8f5e8;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #2e7d32;
  }
`;

const WeightInputContainer = styled.div`
  display: flex;
  gap: 15px;
  align-items: flex-start;
`;

const WeightInput = styled(Input)`
  flex: 1;
  font-size: 24px;
  text-align: center;
  font-weight: bold;
  min-height: 60px;
`;

const KeypadContainer = styled.div`
  flex: 1;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #2e7d32;
  }
`;

const AddButton = styled.button`
  width: 100%;
  padding: 15px;
  background: #2e7d32;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background: #1b5e20;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 40px 20px;
`;

// Catégories L1 selon les spécifications
const CATEGORIES = [
  'EEE-1', 'EEE-2', 'EEE-3', 'EEE-4',
  'EEE-5', 'EEE-6', 'EEE-7', 'EEE-8',
  'EEE-9', 'EEE-10', 'EEE-11', 'EEE-12',
  'EEE-13', 'EEE-14'
];

const DESTINATIONS = [
  { value: 'MAGASIN', label: 'Magasin' },
  { value: 'RECYCLAGE', label: 'Recyclage' },
  { value: 'DECHETERIE', label: 'Déchetterie' }
];

const TicketForm: React.FC = () => {
  const navigate = useNavigate();
  const { currentTicket, isLoading, addLineToTicket, updateTicketLine, deleteTicketLine, closeTicket } = useReception();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [destination, setDestination] = useState<'MAGASIN' | 'RECYCLAGE' | 'DECHETERIE'>('MAGASIN');
  const [notes, setNotes] = useState<string>('');
  const [editingLineId, setEditingLineId] = useState<string | null>(null);

  if (!currentTicket) {
    return (
      <Container>
        <div>Erreur: Aucun ticket en cours</div>
      </Container>
    );
  }

  const handleAddLine = async () => {
    if (!selectedCategory || !weight) {
      alert('Veuillez sélectionner une catégorie et saisir un poids');
      return;
    }

    try {
      await addLineToTicket(currentTicket.id, {
        category: selectedCategory,
        weight: parseFloat(weight),
        destination,
        notes: notes || undefined
      });

      // Reset form
      setSelectedCategory('');
      setWeight('');
      setDestination('MAGASIN');
      setNotes('');
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la ligne:', err);
    }
  };

  const handleUpdateLine = async (lineId: string) => {
    if (!selectedCategory || !weight) {
      alert('Veuillez sélectionner une catégorie et saisir un poids');
      return;
    }

    try {
      await updateTicketLine(currentTicket.id, lineId, {
        category: selectedCategory,
        weight: parseFloat(weight),
        destination,
        notes: notes || undefined
      });

      setEditingLineId(null);
      setSelectedCategory('');
      setWeight('');
      setDestination('MAGASIN');
      setNotes('');
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la ligne:', err);
    }
  };

  const handleDeleteLine = async (lineId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette ligne ?')) {
      try {
        await deleteTicketLine(currentTicket.id, lineId);
      } catch (err) {
        console.error('Erreur lors de la suppression de la ligne:', err);
      }
    }
  };

  const handleEditLine = (line: TicketLine) => {
    setEditingLineId(line.id);
    setSelectedCategory(line.category);
    setWeight(line.weight.toString());
    setDestination(line.destination);
    setNotes(line.notes || '');
  };

  const handleCloseTicket = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir clôturer ce ticket ?')) {
      try {
        await closeTicket(currentTicket.id);
        navigate('/reception');
      } catch (err) {
        console.error('Erreur lors de la clôture du ticket:', err);
      }
    }
  };

  const isEditing = editingLineId !== null;

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/reception')}>
          <ArrowLeft size={20} />
          Retour
        </BackButton>
        <Title>Ticket #{currentTicket.id.slice(-8)}</Title>
        <CloseTicketButton onClick={handleCloseTicket} disabled={isLoading}>
          <Check size={20} />
          Clôturer le ticket
        </CloseTicketButton>
      </Header>

      <MainContent>
        <LinesList>
          <LinesTitle>Lignes du ticket ({currentTicket.lines.length})</LinesTitle>
          {currentTicket.lines.length === 0 ? (
            <EmptyState>Aucune ligne ajoutée</EmptyState>
          ) : (
            currentTicket.lines.map((line) => (
              <LineItem key={line.id}>
                <LineInfo>
                  <LineCategory>{line.category}</LineCategory>
                  <LineDetails>
                    {line.weight}kg - {DESTINATIONS.find(d => d.value === line.destination)?.label}
                    {line.notes && ` - ${line.notes}`}
                  </LineDetails>
                </LineInfo>
                <LineActions>
                  <ActionButton 
                    className="edit" 
                    onClick={() => handleEditLine(line)}
                    disabled={isLoading}
                  >
                    <Edit size={16} />
                  </ActionButton>
                  <ActionButton 
                    className="delete" 
                    onClick={() => handleDeleteLine(line.id)}
                    disabled={isLoading}
                  >
                    <Trash2 size={16} />
                  </ActionButton>
                </LineActions>
              </LineItem>
            ))
          )}
        </LinesList>

        <FormSection>
          <FormTitle>
            {isEditing ? 'Modifier la ligne' : 'Ajouter une ligne'}
          </FormTitle>

          <FormGroup>
            <Label>Catégorie *</Label>
            <CategoryGrid>
              {CATEGORIES.map((category) => (
                <CategoryButton
                  key={category}
                  $selected={selectedCategory === category}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </CategoryButton>
              ))}
            </CategoryGrid>
          </FormGroup>

          <FormGroup>
            <Label>Poids (kg) *</Label>
            <WeightInputContainer>
              <WeightInput
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.0"
                readOnly
              />
              <KeypadContainer>
                <NumericKeypad
                  onKeyPress={(key) => {
                    if (key === '.') {
                      if (!weight.includes('.')) {
                        setWeight(weight + key);
                      }
                    } else {
                      setWeight(weight + key);
                    }
                  }}
                  onClear={() => setWeight('')}
                  onBackspace={() => setWeight(weight.slice(0, -1))}
                />
              </KeypadContainer>
            </WeightInputContainer>
          </FormGroup>

          <FormGroup>
            <Label>Destination</Label>
            <Select
              value={destination}
              onChange={(e) => setDestination(e.target.value as 'MAGASIN' | 'RECYCLAGE' | 'DECHETERIE')}
            >
              {DESTINATIONS.map((dest) => (
                <option key={dest.value} value={dest.value}>
                  {dest.label}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Notes (optionnel)</Label>
            <Input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes sur l'objet..."
            />
          </FormGroup>

          <AddButton
            onClick={isEditing ? () => handleUpdateLine(editingLineId!) : handleAddLine}
            disabled={isLoading || !selectedCategory || !weight}
          >
            <Save size={20} style={{ marginRight: '8px' }} />
            {isEditing ? 'Mettre à jour' : 'Ajouter l\'objet'}
          </AddButton>
        </FormSection>
      </MainContent>
    </Container>
  );
};

export default TicketForm;
