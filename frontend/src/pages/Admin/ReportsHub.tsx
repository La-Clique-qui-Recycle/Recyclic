import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FileText, ShoppingCart, ArrowRight } from 'lucide-react';

const PageContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  margin: 0 0 8px 0;
  font-size: 2rem;
  color: #1b5e20;
  font-weight: 600;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 1rem;
  color: #666;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 32px;
`;

const ReportCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 32px;
  background: #ffffff;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;

  &:hover {
    border-color: #2e7d32;
    box-shadow: 0 4px 12px rgba(46, 125, 50, 0.15);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CardIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: #e8f5e9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  color: #2e7d32;
`;

const CardTitle = styled.h2`
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  color: #1b5e20;
  font-weight: 600;
`;

const CardDescription = styled.p`
  margin: 0 0 16px 0;
  font-size: 0.95rem;
  color: #666;
  line-height: 1.5;
  flex: 1;
`;

const CardLink = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2e7d32;
  font-weight: 500;
  font-size: 0.95rem;
  margin-top: auto;
`;

const ReportsHub: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <Header>
        <Title>Rapports et Exports</Title>
        <Subtitle>
          Accédez aux différents types de rapports et exports disponibles dans le système
        </Subtitle>
      </Header>

      <CardsGrid>
        <ReportCard onClick={() => navigate('/admin/reports/cash-sessions')}>
          <CardIcon>
            <ShoppingCart size={32} />
          </CardIcon>
          <CardTitle>Rapports de Sessions de Caisse</CardTitle>
          <CardDescription>
            Consultez et téléchargez les rapports CSV détaillés générés automatiquement 
            lors de la fermeture de chaque session de caisse. Ces rapports contiennent 
            toutes les informations sur les ventes, les items et les transactions.
          </CardDescription>
          <CardLink>
            Accéder aux rapports <ArrowRight size={16} />
          </CardLink>
        </ReportCard>

        <ReportCard onClick={() => navigate('/admin/reception-reports')}>
          <CardIcon>
            <FileText size={32} />
          </CardIcon>
          <CardTitle>Rapports de Réception</CardTitle>
          <CardDescription>
            Explorez les données de réception avec des filtres avancés (date, catégorie) 
            et exportez les lignes de dépôt au format CSV. Idéal pour les analyses 
            détaillées et la conformité réglementaire.
          </CardDescription>
          <CardLink>
            Accéder aux rapports <ArrowRight size={16} />
          </CardLink>
        </ReportCard>
      </CardsGrid>
    </PageContainer>
  );
};

export default ReportsHub;
