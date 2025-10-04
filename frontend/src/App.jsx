import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Header from './components/Header.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ReceptionProvider } from './contexts/ReceptionContext';

// Lazy loading des pages pour le code-splitting
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const CashRegister = lazy(() => import('./pages/CashRegister/CashRegisterDashboard.tsx'));
const OpenCashSession = lazy(() => import('./pages/CashRegister/OpenCashSession.tsx'));
const Sale = lazy(() => import('./pages/CashRegister/Sale.tsx'));
const CloseSession = lazy(() => import('./pages/CashRegister/CloseSession.tsx'));
const Deposits = lazy(() => import('./pages/Deposits.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));
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
const AdminCategories = lazy(() => import('./pages/Admin/Categories.tsx'));
const ReceptionDashboard = lazy(() => import('./pages/Admin/ReceptionDashboard.tsx'));
const ReceptionReports = lazy(() => import('./pages/Admin/ReceptionReports.tsx'));
const Login = lazy(() => import('./pages/Login.tsx'));
const Signup = lazy(() => import('./pages/Signup.tsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.tsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.tsx'));
const TelegramAuth = lazy(() => import('./pages/TelegramAuth.jsx'));
const Reception = lazy(() => import('./pages/Reception.tsx'));
const TicketForm = lazy(() => import('./pages/Reception/TicketForm.tsx'));
const TicketDetail = lazy(() => import('./pages/Reception/TicketDetail.tsx'));
const TicketView = lazy(() => import('./pages/Reception/TicketView.tsx'));

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const MainContent = styled.main`
  padding: ${props => props.$isKioskMode ? '0' : '20px'};
  max-width: ${props => props.$isKioskMode ? 'none' : '1200px'};
  margin: 0 auto;
  height: ${props => props.$isKioskMode ? '100vh' : 'auto'};
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

  // Routes en mode Kiosque (sans header principal)
  const kioskModeRoutes = [
    '/reception/ticket',
    /^\/reception\/ticket\/[^/]+$/,
    /^\/reception\/ticket\/[^/]+\/view$/
  ];

  // Vérifier si la route actuelle est en mode kiosque
  const isKioskMode = kioskModeRoutes.some(route => {
    if (typeof route === 'string') {
      return location.pathname === route;
    }
    return route.test(location.pathname);
  });

  return (
    <ReceptionProvider>
      <AppContainer>
        {!isKioskMode && <Header />}
        <MainContent $isKioskMode={isKioskMode}>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/telegram-auth" element={<TelegramAuth />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/caisse" element={<ProtectedRoute requiredRoles={['user', 'admin', 'super-admin']}><CashRegister /></ProtectedRoute>} />
            <Route path="/cash-register/session/open" element={<ProtectedRoute requiredRoles={['user', 'admin', 'super-admin']}><OpenCashSession /></ProtectedRoute>} />
            <Route path="/cash-register/sale" element={<ProtectedRoute requiredRoles={['user', 'admin', 'super-admin']}><Sale /></ProtectedRoute>} />
            <Route path="/cash-register/session/close" element={<ProtectedRoute requiredRoles={['user', 'admin', 'super-admin']}><CloseSession /></ProtectedRoute>} />
            <Route path="/reception" element={<ProtectedRoute><Reception /></ProtectedRoute>} />
            <Route path="/reception/ticket" element={<ProtectedRoute><TicketForm /></ProtectedRoute>} />
            <Route path="/reception/ticket/:ticketId" element={<ProtectedRoute><TicketForm /></ProtectedRoute>} />
            <Route path="/reception/ticket/:ticketId/view" element={<ProtectedRoute><TicketView /></ProtectedRoute>} />
            <Route path="/depots" element={<ProtectedRoute><Deposits /></ProtectedRoute>} />
            <Route path="/rapports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/inscription" element={<Registration />} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
              <Route index element={<DashboardHomePage />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="reception-stats" element={<ReceptionDashboard />} />
              <Route path="reception-reports" element={<ReceptionReports />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="pending" element={<PendingUsers />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="cash-registers" element={<AdminCashRegisters />} />
              <Route path="sites" element={<AdminSites />} />
              <Route path="categories" element={<ProtectedRoute requiredRoles={['super-admin']}><AdminCategories /></ProtectedRoute>} />
              <Route path="health" element={<HealthDashboard />} />
              <Route path="settings" element={<AdminDashboard />} />
            </Route>
            </Routes>
          </Suspense>
        </MainContent>
      </AppContainer>
    </ReceptionProvider>
  );
}

export default App;
