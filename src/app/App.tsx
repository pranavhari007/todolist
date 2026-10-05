import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../context/AppContext';
import { AppLayout } from '../components/layout/AppLayout';
import { AppRoutes } from './routes';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppLayout>
          <AppRoutes />
        </AppLayout>
      </AppProvider>
    </BrowserRouter>
  );
};
