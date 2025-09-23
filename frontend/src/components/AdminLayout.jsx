import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import styled from 'styled-components';
import { ADMIN_NAVIGATION_ITEMS } from '../config/adminRoutes';

const LayoutContainer = styled.div`
  display: flex;
  min-height: calc(100vh - 120px);
  gap: 2rem;
`;

const Sidebar = styled.nav`
  width: 250px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  height: fit-content;
`;

const SidebarTitle = styled.h2`
  margin: 0 0 1.5rem 0;
  font-size: 1.2rem;
  color: #2e7d32;
  border-bottom: 2px solid #e8f5e8;
  padding-bottom: 0.5rem;
`;

const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const NavItem = styled.li`
  margin-bottom: 0.5rem;
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: #374151;
  border-radius: 6px;
  transition: all 0.2s ease;
  font-weight: 500;

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

  const isActiveRoute = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <LayoutContainer>
      <Sidebar aria-label="Navigation administrative">
        <SidebarTitle id="admin-nav-heading">Administration</SidebarTitle>
        <NavList role="list" aria-labelledby="admin-nav-heading">
          {ADMIN_NAVIGATION_ITEMS.map(({ path, label, icon: Icon, exact }) => (
            <NavItem key={path} role="listitem">
              <NavLink
                to={path}
                $active={isActiveRoute(path, exact)}
                aria-current={isActiveRoute(path, exact) ? 'page' : undefined}
                aria-label={`Naviguer vers ${label}`}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </NavLink>
            </NavItem>
          ))}
        </NavList>
      </Sidebar>
      <MainContent role="main" aria-label="Contenu principal de l'administration">
        <Outlet />
      </MainContent>
    </LayoutContainer>
  );
};

export default AdminLayout;