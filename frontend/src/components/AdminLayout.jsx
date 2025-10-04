import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import styled from 'styled-components';
import { ADMIN_NAVIGATION_ITEMS } from '../config/adminRoutes';
import { useAuthStore } from '../stores/authStore';

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 120px);
  gap: 1rem;
`;

const TopNav = styled.nav`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  height: fit-content;
`;

const TopNavTitle = styled.h2`
  margin: 0 0 0.75rem 0;
  font-size: 1.1rem;
  color: #2e7d32;
  border-bottom: 2px solid #e8f5e8;
  padding-bottom: 0.5rem;
  text-align: center;
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
  color: #374151;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;

  &:hover {
    background-color: #f3f4f6;
    color: #2e7d32;
  }

  ${props => props.$active && `
    background-color: #e8f5e8;
    color: #2e7d32;
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
        <TopNavTitle id="admin-nav-heading">Administration</TopNavTitle>
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
      </TopNav>
      <MainContent role="main" aria-label="Contenu principal de l'administration">
        <Outlet />
      </MainContent>
    </LayoutContainer>
  );
};

export default AdminLayout;