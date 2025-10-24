import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axiosClient from '../../api/axiosClient';

// Styles pour le nouveau layout en grille
const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const AdminCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
`;

const CardDescription = styled.p`
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0 0 16px 0;
  line-height: 1.5;
`;

const LinkList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LinkItem = styled.li`
  margin: 0;
`;

const AdminLink = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  padding: 12px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #374151;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
    color: #111827;
  }

  &:active {
    background: #e5e7eb;
  }
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 24px 0;
`;

const DashboardHomePage = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleNavigateToLatestCashSession = async () => {
    try {
      const response = await axiosClient.get('/v1/cash-sessions/');
      const sessions = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
          ? response.data.data
          : [];

      if (sessions.length > 0 && sessions[0]?.id) {
        navigate(`/admin/cash-sessions/${sessions[0].id}`);
      } else {
        navigate('/admin/reports');
      }
    } catch (error) {
      console.error('Impossible de récupérer les sessions de caisse:', error);
      navigate('/admin/reports');
    }
  };

  return (
    <div>
      <PageTitle>Tableau de Bord d'Administration</PageTitle>
      
      <DashboardGrid>
        {/* Colonne 1 : CONFIGURATION DU SYSTÈME */}
        
        {/* Carte 1 : GESTION DES ACCÈS */}
        <AdminCard>
          <CardTitle>GESTION DES ACCÈS</CardTitle>
          <CardDescription>
            Gérer les comptes utilisateurs, leurs rôles, groupes et les inscriptions en attente.
          </CardDescription>
          <LinkList>
            <LinkItem>
              <AdminLink onClick={() => handleNavigation('/admin/users')}>
                Utilisateurs
              </AdminLink>
            </LinkItem>
            <LinkItem>
              <AdminLink onClick={() => handleNavigation('/admin/groups')}>
                Groupes & Permissions
              </AdminLink>
            </LinkItem>
          </LinkList>
        </AdminCard>

        {/* Carte 2 : GESTION DU CATALOGUE & DES SITES */}
        <AdminCard>
          <CardTitle>GESTION DU CATALOGUE & DES SITES</CardTitle>
          <CardDescription>
            Configurer les objets (catégories, prix), les sites et les postes de caisse.
          </CardDescription>
          <LinkList>
            <LinkItem>
              <AdminLink onClick={() => handleNavigation('/admin/categories')}>
                Catégories & Prix
              </AdminLink>
            </LinkItem>
            <LinkItem>
              <AdminLink onClick={() => handleNavigation('/admin/sites')}>
                Sites de collecte
              </AdminLink>
            </LinkItem>
            <LinkItem>
              <AdminLink onClick={() => handleNavigation('/admin/cash-registers')}>
                Postes de caisse
              </AdminLink>
            </LinkItem>
          </LinkList>
        </AdminCard>

        {/* Colonne 2 : SUPERVISION & OPÉRATIONS */}
        
        {/* Carte 3 : RAPPORTS & JOURNAUX */}
        <AdminCard>
          <CardTitle>RAPPORTS & JOURNAUX</CardTitle>
          <CardDescription>
            Consulter les rapports de ventes, de réception et les journaux d'activité.
          </CardDescription>
          <LinkList>
            <LinkItem>
              <AdminLink onClick={() => handleNavigation('/admin/session-manager')}>
                Gestionnaire de Sessions
              </AdminLink>
            </LinkItem>
            <LinkItem>
              <AdminLink onClick={() => handleNavigation('/admin/reception-reports')}>
                Rapports de Réception
              </AdminLink>
            </LinkItem>
            <LinkItem>
              <AdminLink onClick={() => handleNavigation('/admin/audit-log')}>
                Journal d'Audit
              </AdminLink>
            </LinkItem>
            <LinkItem>
              <AdminLink onClick={() => handleNavigation('/admin/email-logs')}>
                Journal des Emails
              </AdminLink>
            </LinkItem>
          </LinkList>
        </AdminCard>

        {/* Carte 4 : TABLEAUX DE BORD & SANTÉ */}
        <AdminCard>
          <CardTitle>TABLEAUX DE BORD & SANTÉ</CardTitle>
          <CardDescription>
            Visualiser l'état des différents modules en temps réel.
          </CardDescription>
          <LinkList>
            <LinkItem>
              <AdminLink onClick={() => handleNavigation('/admin/reception-stats')}>
                Dashboard de Réception
              </AdminLink>
            </LinkItem>
            <LinkItem>
              <AdminLink onClick={() => handleNavigation('/admin/health')}>
                Dashboard de Santé Système
              </AdminLink>
            </LinkItem>
          </LinkList>
        </AdminCard>

        {/* Carte 5 : PARAMÈTRES GÉNÉRAUX */}
        <AdminCard>
          <CardTitle>PARAMÈTRES GÉNÉRAUX</CardTitle>
          <CardDescription>
            Accéder aux réglages avancés de l'application.
          </CardDescription>
          <LinkList>
            <LinkItem>
              <AdminLink onClick={() => handleNavigation('/admin/settings')}>
                Paramètres
              </AdminLink>
            </LinkItem>
          </LinkList>
        </AdminCard>
      </DashboardGrid>
    </div>
  );
};

export default DashboardHomePage;
