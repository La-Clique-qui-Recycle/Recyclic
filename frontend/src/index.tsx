import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';
import App from './App.jsx';
import HydrationWrapper from './components/HydrationWrapper.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));

// Désactiver React.StrictMode en production/staging pour éviter le double rendu
const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';

const AppContent = (
  <HydrationWrapper>
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Notifications />
          <Toaster position="top-right" />
        </BrowserRouter>
      </QueryClientProvider>
    </MantineProvider>
  </HydrationWrapper>
);

root.render(
  isProduction ? AppContent : <React.StrictMode>{AppContent}</React.StrictMode>
);
