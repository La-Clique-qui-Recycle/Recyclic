import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Recycle, Home, Calculator, Receipt, Users, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { getVersionDisplay } from '../services/buildInfo';

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 120px);
  gap: 1rem;
`;

const HeaderContainer = styled.header`
  background-color: #2e7d32;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin: -20px -20px 1rem -20px;
`;

const Nav = styled.nav`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
`;

const Logo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
`;

const LogoMain = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: bold;
`;

const LogoVersion = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
  font-family: monospace;
  margin-left: 1.75rem;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
`;


const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  ${props => props.$active && `
    background-color: rgba(255, 255, 255, 0.2);
  `}
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
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasCashAccess = useAuthStore((s) => s.hasCashAccess());
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const [versionDisplay, setVersionDisplay] = useState('Version: 1.0.0');

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  // Charger les informations de version
  useEffect(() => {
    getVersionDisplay().then(setVersionDisplay);
  }, []);

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest('[role="menu"]') && !event.target.closest('button[aria-haspopup="menu"]')) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuOpen]);

  // Vue minimale par défaut
  const navItems = [
    { path: '/', label: 'Tableau de bord', icon: Home }
  ];

  // Éléments supplémentaires uniquement si authentifié
  if (isAuthenticated) {
    navItems.push({ path: '/reception', label: 'Réception', icon: Receipt });
  }

  // Caisse accessible aux rôles autorisés (user/manager/admin)
  if (hasCashAccess) {
    navItems.splice(1, 0, { path: '/caisse', label: 'Caisse', icon: Calculator });
  }

  // Administration accessible aux admins uniquement
  if (isAdmin) {
    navItems.push({ path: '/admin', label: 'Administration', icon: Users });
  }

  return (
    <LayoutContainer>
      <HeaderContainer>
        <Nav>
          <Logo>
            <LogoMain>
              <Recycle size={24} />
              Recyclic
            </LogoMain>
            <LogoVersion>
              {versionDisplay}
            </LogoVersion>
          </Logo>
          <NavLinks>
            {navItems.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                $active={location.pathname === path}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
            {isAuthenticated && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span style={{ opacity: 0.95 }}>
                    {currentUser?.username || [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(' ') || 'Utilisateur'}
                  </span>
                  <ChevronDown size={16} />
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    style={{
                      position: 'absolute',
                      right: 0,
                      marginTop: '8px',
                      minWidth: '180px',
                      background: 'white',
                      color: '#333',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      overflow: 'hidden',
                      zIndex: 1000
                    }}
                  >
                    <button
                      role="menuitem"
                      onClick={() => { setMenuOpen(false); navigate('/profil'); }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        color: '#333'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      Mon profil
                    </button>
                    <button
                      role="menuitem"
                      onClick={onLogout}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        color: '#dc2626'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            )}
          </NavLinks>
        </Nav>
      </HeaderContainer>
      <MainContent role="main" aria-label="Contenu principal de l'administration">
        <Outlet />
      </MainContent>
    </LayoutContainer>
  );
};

export default AdminLayout;