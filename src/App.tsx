import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { InventoryProvider } from './store/InventoryContext';
import { BookingProvider } from './store/BookingContext';
import { AuthProvider } from './store/AuthContext';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <InventoryProvider>
        <BookingProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BookingProvider>
      </InventoryProvider>
    </BrowserRouter>
  );
};

export default App;
