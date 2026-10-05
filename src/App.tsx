import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HotelConfigProvider } from './store/HotelConfigContext';
import { InventoryProvider } from './store/InventoryContext';
import { BookingProvider } from './store/BookingContext';
import { AuthProvider } from './store/AuthContext';
import { AppRoutes } from './routes/AppRoutes';
import { ScrollToTop } from './components/common/ScrollToTop';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <HotelConfigProvider>
        <AuthProvider>
          <InventoryProvider>
            <BookingProvider>
              <AppRoutes />
            </BookingProvider>
          </InventoryProvider>
        </AuthProvider>
      </HotelConfigProvider>
    </BrowserRouter>
  );
};

export default App;
