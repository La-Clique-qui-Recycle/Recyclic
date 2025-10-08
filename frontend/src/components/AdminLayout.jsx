import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft } from 'lucide-react';
import { ADMIN_NAVIGATION_ITEMS } from '../config/adminRoutes';
import { useAuthStore } from '../stores/authStore';

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 120px);
  gap: 1rem;
`;

const TopNav = styled.nav`
  background-color: #2e7d32;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin: -20px -20px 1rem -20px;
`;

const NavContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const TopNavHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  background-color: rgba(255, 255, 255, 0.1);

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  svg {
    flex-shrink: 0;
  }
`;

const TopNavTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
`;

const TopNavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 0.25rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const TopNavItem = styled.li`
  /* Pas de margin bottom car c'est horizontal */
`;

const TopNavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: white;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  ${props => props.$active && `
    background-color: rgba(255, 255, 255, 0.2);
    font-weight: 600;
  `}

  svg {
    flex-shrink: 0;
  }
`;

const MainContent = styled.main`
  flex: 1;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  min-height: 500px;
`;

const AdminLayout = () => {
  const location = useLocation();
  const { currentUser } = useAuthStore();

  const isActiveRoute = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Filter navigation items based on user role
  const visibleNavigationItems = ADMIN_NAVIGATION_ITEMS.filter(item => {
    // If item requires super-admin, only show for super-admins
    if (item.superAdminOnly) {
      return currentUser?.role === 'super-admin';
    }
    return true;
  });

  return (
    <LayoutContainer>
      <TopNav aria-label="Navigation administrative">
        <NavContent>
          <TopNavHeader>
            <TopNavTitle id="admin-nav-heading">Administration</TopNavTitle>
            <BackLink to="/" aria-label="Retourner à l'application principale">
              <ArrowLeft size={18} aria-hidden="true" />
              Retour à l'application
            </BackLink>
          </TopNavHeader>
          <TopNavList role="list" aria-labelledby="admin-nav-heading">
            {visibleNavigationItems.map(({ path, label, icon: Icon, exact }) => (
              <TopNavItem key={path} role="listitem">
                <TopNavLink
                  to={path}
                  $active={isActiveRoute(path, exact)}
                  aria-current={isActiveRoute(path, exact) ? 'page' : undefined}
                  aria-label={`Naviguer vers ${label}`}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </TopNavLink>
              </TopNavItem>
            ))}
          </TopNavList>
        </NavContent>
      </TopNav>
      <MainContent role="main" aria-label="Contenu principal de l'administration">
        <Outlet />
      </MainContent>
    </LayoutContainer>
  );
};

export default AdminLayout;