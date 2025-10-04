import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft, Calendar, User, Package, Weight, MapPin, FileText, CheckCircle, Clock, Tag } from 'lucide-react';
import { getReceptionTicketDetail } from '../../services/api';

const TicketViewContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
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
  padding: 10px 15px;
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: #e0e0e0;
    border-color: #bbb;
  }
`;

const Title = styled.h1`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: #2e7d32;
  font-size: 2rem;
`;

const TicketInfo = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 20px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #2e7d32;
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: #333;
  min-width: 120px;
`;

const InfoValue = styled.span`
  color: #666;
`;

const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  background: ${props => props.status === 'closed' ? '#e8f5e8' : '#fff3e0'};
  color: ${props => props.status === 'closed' ? '#2e7d32' : '#f57c00'};
  display: flex;
  align-items: center;
  gap: 5px;
`;

const LignesSection = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 20px;
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 20px 0;
  color: #2e7d32;
  font-size: 1.5rem;
`;

const LignesList = styled.div`
  display: grid;
  gap: 15px;
`;

const LigneCard = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 15px;
  background: #fafafa;
`;

const LigneHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const LigneId = styled.span`
  font-weight: 600;
  color: #2e7d32;
`;

const LigneInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
`;

const LigneItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 0.9rem;
`;

const DestinationBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  background: ${props => {
    switch(props.destination) {
      case 'MAGASIN': return '#e3f2fd';
      case 'RECYCLAGE': return '#e8f5e8';
      case 'DECHETERIE': return '#fff3e0';
      default: return '#f5f5f5';
    }
  }};
  color: ${props => {
    switch(props.destination) {
      case 'MAGASIN': return '#1976d2';
      case 'RECYCLAGE': return '#2e7d32';
      case 'DECHETERIE': return '#f57c00';
      default: return '#666';
    }
  }};
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 18px;
`;

const ErrorMessage = styled.div`
  background: #ffebee;
  color: #c62828;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  text-align: center;
`;

const NoLignes = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
`;

const TicketView: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTicket = async () => {
      if (!ticketId) return;
      
      setLoading(true);
      setError(null);
      try {
        const ticketData = await getReceptionTicketDetail(ticketId);
        setTicket(ticketData);
      } catch (err) {
        console.error('Erreur lors du chargement du ticket:', err);
        setError('Impossible de charger les détails du ticket');
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [ticketId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWeight = (weight) => {
    return `${parseFloat(weight).toFixed(2)} kg`;
  };

  const getDestinationLabel = (destination) => {
    switch(destination) {
      case 'MAGASIN': return 'Magasin';
      case 'RECYCLAGE': return 'Recyclage';
      case 'DECHETERIE': return 'Déchetterie';
      default: return destination;
    }
  };

  if (loading) {
    return (
      <TicketViewContainer>
        <LoadingMessage>Chargement des détails du ticket...</LoadingMessage>
      </TicketViewContainer>
    );
  }

  if (error) {
    return (
      <TicketViewContainer>
        <Header>
          <BackButton onClick={() => navigate('/reception')}>
            <ArrowLeft size={20} />
            Retour
          </BackButton>
        </Header>
        <ErrorMessage>{error}</ErrorMessage>
      </TicketViewContainer>
    );
  }

  if (!ticket) {
    return (
      <TicketViewContainer>
        <Header>
          <BackButton onClick={() => navigate('/reception')}>
            <ArrowLeft size={20} />
            Retour
          </BackButton>
        </Header>
        <ErrorMessage>Ticket introuvable</ErrorMessage>
      </TicketViewContainer>
    );
  }

  return (
    <TicketViewContainer>
      <Header>
        <BackButton onClick={() => navigate('/reception')}>
          <ArrowLeft size={20} />
          Retour
        </BackButton>
        <Title>
          <Package size={32} />
          Détails du Ticket #{ticket.id.slice(-8)}
        </Title>
      </Header>

      <TicketInfo>
        <InfoGrid>
          <InfoItem>
            <Calendar size={20} />
            <InfoLabel>Créé le :</InfoLabel>
            <InfoValue>{formatDate(ticket.created_at)}</InfoValue>
          </InfoItem>
          
          <InfoItem>
            <User size={20} />
            <InfoLabel>Bénévole :</InfoLabel>
            <InfoValue>{ticket.benevole_username}</InfoValue>
          </InfoItem>
          
          <InfoItem>
            <Package size={20} />
            <InfoLabel>Articles :</InfoLabel>
            <InfoValue>{ticket.lignes.length} article{ticket.lignes.length > 1 ? 's' : ''}</InfoValue>
          </InfoItem>
          
          <InfoItem>
            <Weight size={20} />
            <InfoLabel>Poids total :</InfoLabel>
            <InfoValue>
              {formatWeight(ticket.lignes.reduce((total, ligne) => total + parseFloat(ligne.poids_kg), 0))}
            </InfoValue>
          </InfoItem>
          
          <InfoItem>
            <InfoLabel>Statut :</InfoLabel>
            <StatusBadge status={ticket.status}>
              {ticket.status === 'closed' ? (
                <>
                  <CheckCircle size={16} />
                  Fermé
                </>
              ) : (
                <>
                  <Clock size={16} />
                  Ouvert
                </>
              )}
            </StatusBadge>
          </InfoItem>
          
          {ticket.closed_at && (
            <InfoItem>
              <Calendar size={20} />
              <InfoLabel>Fermé le :</InfoLabel>
              <InfoValue>{formatDate(ticket.closed_at)}</InfoValue>
            </InfoItem>
          )}
        </InfoGrid>
      </TicketInfo>

      <LignesSection>
        <SectionTitle>
          <FileText size={24} />
          Articles du Ticket
        </SectionTitle>
        
        {ticket.lignes.length === 0 ? (
          <NoLignes>Aucun article dans ce ticket</NoLignes>
        ) : (
          <LignesList>
            {ticket.lignes.map((ligne, index) => (
              <LigneCard key={ligne.id}>
                <LigneHeader>
                  <LigneId>Article #{index + 1}</LigneId>
                  <DestinationBadge destination={ligne.destination}>
                    {getDestinationLabel(ligne.destination)}
                  </DestinationBadge>
                </LigneHeader>
                
                <LigneInfo>
                  <LigneItem>
                    <Weight size={16} />
                    Poids : {formatWeight(ligne.poids_kg)}
                  </LigneItem>
                  
                  <LigneItem>
                    <Tag size={16} />
                    Catégorie : {ligne.dom_category_label || ligne.dom_category_id}
                  </LigneItem>
                  
                  {ligne.notes && (
                    <LigneItem style={{ gridColumn: '1 / -1' }}>
                      <FileText size={16} />
                      Notes : {ligne.notes}
                    </LigneItem>
                  )}
                </LigneInfo>
              </LigneCard>
            ))}
          </LignesList>
        )}
      </LignesSection>
    </TicketViewContainer>
  );
};

export default TicketView;
