import React from 'react';
import styled from 'styled-components';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { Recycle, Home, Calculator, BarChart3, Users, Receipt } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { ADMIN_ROUTES } from '../config/adminRoutes';

const HeaderContainer = styled.header`
  background-color: #2e7d32;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: bold;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
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

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const hasCashAccess = useAuthStore((s) => s.hasCashAccess());
  const [menuOpen, setMenuOpen] = React.useState(false);

  const onLogout = () => {
    logout();
    navigate('/login');
  };

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

  // Journal de Caisse retiré du menu principal (désormais dans Administration)

  // Administration accessible aux admins uniquement
  if (isAdmin) {
    navItems.push({ path: ADMIN_ROUTES.HOME, label: 'Administration', icon: Users });
  }
  
  return (
    <HeaderContainer>
      <Nav>
        <Logo>
          <Recycle size={24} />
          Recyclic
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
                      cursor: 'pointer'
                    }}
                  >
                    Mon Profil
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); onLogout(); }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          )}
        </NavLinks>
      </Nav>
    </HeaderContainer>
  );
}

