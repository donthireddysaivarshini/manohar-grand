import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiHotelConfiguration } from '../types/cms';
import { cmsApiService } from '../services/api/cmsApiService';

const DEFAULT_CONFIG: ApiHotelConfiguration = {
  hotel_name: 'Manohar Grand',
  primary_phone: '+91 94901 02008',
  secondary_phone: '+91 94901 02009',
  email: 'info@manohargrand.com',
  address: 'R.S. Road, Near Clock Tower, Anantapur, Andhra Pradesh 515001, India',
  near_landmark: 'Near Clock Tower',
  google_maps_url: 'https://maps.google.com/?q=Manohar+Grand+Anantapur',
  google_maps_embed_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3859.387!2d77.595!3d14.681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDQwJzUxLjYiTiA3N8KwMzUnNDIuMCJF!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin',
  standard_check_in_time: '12:00 PM',
  standard_check_out_time: '11:00 AM',
  max_late_checkout_hours: 2,
  cancellation_policy_text: 'Free cancellation up to 24 hours before check-in. Cancellations within 24 hours will incur a 1-night room charge.',
  guest_id_policy_text: 'All adult guests must present a valid government-approved photo ID (Aadhaar, Passport, Driving License, Voter ID) at check-in.',
  age_policy_text: 'Primary guest must be at least 18 years of age to check in.',
};

interface HotelConfigContextType {
  config: ApiHotelConfiguration;
  isLoading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
}

const HotelConfigContext = createContext<HotelConfigContextType>({
  config: DEFAULT_CONFIG,
  isLoading: false,
  error: null,
  refreshConfig: async () => {},
});

export const HotelConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ApiHotelConfiguration>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const data = await cmsApiService.getHotelConfig();
      setConfig(data);
      setError(null);
    } catch (err: any) {
      console.warn('Could not load hotel config from API, using defaults:', err.message);
      setError(err.message || 'Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <HotelConfigContext.Provider
      value={{
        config,
        isLoading,
        error,
        refreshConfig: fetchConfig,
      }}
    >
      {children}
    </HotelConfigContext.Provider>
  );
};

export const useHotelConfig = () => useContext(HotelConfigContext);
