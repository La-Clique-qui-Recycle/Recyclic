import styled from 'styled-components';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Recycle, Home, Calculator, Package, BarChart3, Users } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

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
  const logout = useAuthStore((s) => s.logout);
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const isCashier = useAuthStore((s) => s.isCashier());

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Tableau de bord', icon: Home },
    { path: '/depots', label: 'Dépôts', icon: Package },
    { path: '/rapports', label: 'Rapports', icon: BarChart3 },
  ];

  // Caisse accessible aux caissiers et admins
  if (isCashier) {
    navItems.splice(1, 0, { path: '/caisse', label: 'Caisse', icon: Calculator });
  }

  // Administration accessible aux admins uniquement
  if (isAdmin) {
    navItems.push({ path: '/admin/users', label: 'Administration', icon: Users });
    navItems.push({ path: '/admin/reports', label: 'Rapports caisse', icon: BarChart3 });
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
            <button 
              onClick={onLogout}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              Déconnexion
            </button>
          )}
        </NavLinks>
      </Nav>
    </HeaderContainer>
  );
}

