import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import Header from './components/Header.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PostLoginRedirect from './components/PostLoginRedirect';
import { ReceptionProvider } from './contexts/ReceptionContext';
import { useAuthStore } from './stores/authStore';
import axiosClient from './api/axiosClient';

// Lazy loading des pages pour le code-splitting
const BenevoleDashboard = lazy(() => import('./pages/BenevoleDashboard.jsx'));
const UnifiedDashboard = lazy(() => import('./pages/UnifiedDashboard.tsx'));
const CashRegister = lazy(() => import('./pages/CashRegister/CashRegisterDashboard.tsx'));
const OpenCashSession = lazy(() => import('./pages/CashRegister/OpenCashSession.tsx'));
const Sale = lazy(() => import('./pages/CashRegister/Sale.tsx'));
const CloseSession = lazy(() => import('./pages/CashRegister/CloseSession.tsx'));
const Deposits = lazy(() => import('./pages/Deposits.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));
const CashJournal = lazy(() => import('./pages/Admin/Dashboard.tsx'));
const Registration = lazy(() => import('./pages/Registration.jsx'));
const AdminLayout = lazy(() => import('./components/AdminLayout.jsx'));
const DashboardHomePage = lazy(() => import('./pages/Admin/DashboardHomePage.jsx'));
const AdminUsers = lazy(() => import('./pages/Admin/Users.tsx'));
const PendingUsers = lazy(() => import('./pages/Admin/PendingUsers.tsx'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard.tsx'));
const AdminReports = lazy(() => import('./pages/Admin/Reports.tsx'));
const HealthDashboard = lazy(() => import('./pages/Admin/HealthDashboard.tsx'));
const AdminCashRegisters = lazy(() => import('./pages/Admin/CashRegisters.tsx'));
const AdminSites = lazy(() => import('./pages/Admin/Sites.tsx'));
const SessionManager = lazy(() => import('./pages/Admin/SessionManager.tsx'));
const AdminCategories = lazy(() => import('./pages/Admin/Categories.tsx'));
const ReceptionDashboard = lazy(() => import('./pages/Admin/ReceptionDashboard.tsx'));
const ReceptionReports = lazy(() => import('./pages/Admin/ReceptionReports.tsx'));
const CashSessionDetail = lazy(() => import('./pages/Admin/CashSessionDetail.tsx'));
const AdminSettings = lazy(() => import('./pages/Admin/Settings.tsx'));
const AdminGroups = lazy(() => import('./pages/Admin/GroupsReal.tsx'));
const AuditLog = lazy(() => import('./pages/Admin/AuditLog.tsx'));
const EmailLogs = lazy(() => import('./pages/Admin/EmailLogs.tsx'));
const Login = lazy(() => import('./pages/Login.tsx'));
const Signup = lazy(() => import('./pages/Signup.tsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.tsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.tsx'));
const TelegramAuth = lazy(() => import('./pages/TelegramAuth.jsx'));
const Reception = lazy(() => import('./pages/Reception.tsx'));
const TicketForm = lazy(() => import('./pages/Reception/TicketForm.tsx'));
const TicketDetail = lazy(() => import('./pages/Reception/TicketDetail.tsx'));
const TicketView = lazy(() => import('./pages/Reception/TicketView.tsx'));
const ProfilePage = lazy(() => import('./pages/Profile.tsx'));

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const MainContent = styled.main`
  padding: ${props => props.$isKioskMode ? '0' : '20px'};
  max-width: none;
  margin: 0;
  height: ${props => props.$isKioskMode ? '100vh' : 'auto'};
  width: 100%;
`;

// Composant de chargement
const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '200px',
    fontSize: '18px',
    color: '#666'
  }}>
    Chargement...
  </div>
);

function App() {
  const location = useLocation();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Exposer le store globalement pour les intercepteurs
  useEffect(() => {
    window.useAuthStore = useAuthStore;
  }, []);

  // Initialiser l'authentification au démarrage
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    let intervalId = null;

    const sendPing = async () => {
      try {
        await axiosClient.post('/v1/activity/ping');
      } catch (error) {
        console.debug('Activity ping failed', error);
      }
    };

    const stopInterval = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const startInterval = () => {
      if (intervalId !== null) {
        return;
      }
      sendPing();
      // OPTIMIZATION: Increase interval from 60s to 5 minutes (300000ms) to reduce server load
      intervalId = window.setInterval(() => {
        if (!document.hidden) {
          sendPing();
        }
      }, 300000); // 5 minutes
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopInterval();
      } else if (isAuthenticated) {
        startInterval();
      }
    };

    if (isAuthenticated) {
      if (!document.hidden) {
        startInterval();
      }
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopInterval();
    };
  }, [isAuthenticated]);

  // Routes en mode Kiosque (sans header principal)
  const kioskModeRoutes = [
    '/reception/ticket',
    /^\/reception\/ticket\/[^/]+$/,
    /^\/reception\/ticket\/[^/]+\/view$/,
    '/cash-register/sale'
  ];

  // Vérifier si la route actuelle est en mode kiosque
  const isKioskMode = kioskModeRoutes.some(route => {
    if (typeof route === 'string') {
      return location.pathname === route;
    }
    return route.test(location.pathname);
  });

  // Routes d'administration (sans header principal car AdminLayout a son propre menu)
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Pages publiques (sans header)
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/telegram-auth', '/inscription'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // Afficher le header seulement si ce n'est ni kiosque, ni admin, ni page publique
  const shouldShowHeader = !isKioskMode && !isAdminRoute && !isPublicRoute;

  return (
    <ReceptionProvider>
      <AppContainer>
        {shouldShowHeader && <Header />}
        <MainContent $isKioskMode={isKioskMode}>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/telegram-auth" element={<TelegramAuth />} />
            <Route path="/" element={<ProtectedRoute><UnifiedDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/benevole" element={<ProtectedRoute><BenevoleDashboard /></ProtectedRoute>} />
            <Route path="/caisse" element={<ProtectedRoute requiredPermission="caisse.access"><CashRegister /></ProtectedRoute>} />
            <Route path="/cash-register/session/open" element={<ProtectedRoute requiredPermission="caisse.access"><OpenCashSession /></ProtectedRoute>} />
            <Route path="/cash-register/sale" element={<ProtectedRoute requiredPermission="caisse.access"><Sale /></ProtectedRoute>} />
            <Route path="/cash-register/session/close" element={<ProtectedRoute requiredPermission="caisse.access"><CloseSession /></ProtectedRoute>} />
            <Route path="/reception" element={<ProtectedRoute requiredPermission="reception.access"><Reception /></ProtectedRoute>} />
            <Route path="/reception/ticket" element={<ProtectedRoute requiredPermission="reception.access"><TicketForm /></ProtectedRoute>} />
            <Route path="/reception/ticket/:ticketId" element={<ProtectedRoute requiredPermission="reception.access"><TicketForm /></ProtectedRoute>} />
            <Route path="/reception/ticket/:ticketId/view" element={<ProtectedRoute requiredPermission="reception.access"><TicketView /></ProtectedRoute>} />
            <Route path="/profil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/depots" element={<ProtectedRoute><Deposits /></ProtectedRoute>} />
            <Route path="/rapports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/rapports/caisse" element={<ProtectedRoute requiredRoles={['admin', 'super-admin']}><CashJournal /></ProtectedRoute>} />
            <Route path="/inscription" element={<Registration />} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
              <Route index element={<DashboardHomePage />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="cash-sessions/:id" element={<CashSessionDetail />} />
              <Route path="reception-stats" element={<Navigate to="/" replace />} />
              <Route path="reception-reports" element={<ReceptionReports />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="pending" element={<PendingUsers />} />
              <Route path="session-manager" element={<SessionManager />} />
              <Route path="cash-registers" element={<AdminCashRegisters />} />
              <Route path="sites" element={<AdminSites />} />
              <Route path="categories" element={<ProtectedRoute requiredRoles={['admin','super-admin']}><AdminCategories /></ProtectedRoute>} />
              <Route path="groups" element={<ProtectedRoute requiredRoles={['admin','super-admin']}><AdminGroups /></ProtectedRoute>} />
              <Route path="audit-log" element={<ProtectedRoute requiredRoles={['admin','super-admin']}><AuditLog /></ProtectedRoute>} />
              <Route path="email-logs" element={<ProtectedRoute requiredRoles={['admin','super-admin']}><EmailLogs /></ProtectedRoute>} />
              <Route path="health" element={<HealthDashboard />} />
              <Route path="settings" element={<ProtectedRoute requiredRoles={['super-admin']}><AdminSettings /></ProtectedRoute>} />
            </Route>
            </Routes>
          </Suspense>
        </MainContent>
      </AppContainer>
    </ReceptionProvider>
  );
}

export default App;
