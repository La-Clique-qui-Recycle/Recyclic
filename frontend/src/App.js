import React from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import CashRegister from './pages/CashRegister';
import Deposits from './pages/Deposits';
import Reports from './pages/Reports';

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const MainContent = styled.main`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

function App() {
  return (
    <AppContainer>
      <Header />
      <MainContent>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/caisse" element={<CashRegister />} />
          <Route path="/depots" element={<Deposits />} />
          <Route path="/rapports" element={<Reports />} />
        </Routes>
      </MainContent>
    </AppContainer>
  );
}

export default App;
