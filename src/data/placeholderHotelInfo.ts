import { HotelInfo } from '../types/hotel';
import { CONFIRMED_HOTEL_INFO } from './confirmedInventory';

/**
 * PLACEHOLDER / UNCONFIRMED HOTEL DATA
 * All fields below are temporary placeholders for UI prototype purposes.
 * They will be replaced with official client data in future phases.
 */
export const PLACEHOLDER_HOTEL_INFO: HotelInfo = {
  name: CONFIRMED_HOTEL_INFO.hotelName,
  totalRooms: CONFIRMED_HOTEL_INFO.totalRooms,
  acRooms: CONFIRMED_HOTEL_INFO.acRooms,
  nonAcRooms: CONFIRMED_HOTEL_INFO.nonAcRooms,
  
  address: 'Manohar Grand Luxury Hotel Rooms, KPHB Colony, Kukatpally, Hyderabad, Telangana 500072',
  googleMapsUrl: 'https://maps.app.goo.gl/bRAK5NEYvuFwctyo8?g_st=ac',
  googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3805.1873596687033!2d78.387164!3d17.498567400000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9174ab3993e9%3A0x371cfe2f1aa5bd25!2sManohar%20Grand%20Luxury%20Hotel%20Rooms!5e0!3m2!1sen!2sin!4v1789739548870!5m2!1sen!2sin',
  
  placeholderAddress: 'Manohar Grand Luxury Hotel Rooms, KPHB Colony, Kukatpally, Hyderabad, Telangana 500072',
  placeholderPhone: '+91 [Phone number to be confirmed]',
  placeholderEmail: 'contact@[email to be confirmed]',
  placeholderCheckInTime: '12:00 PM (Standard Check-in)',
  placeholderCheckOutTime: '11:00 AM (Standard Check-out)',
  placeholderDescription: 'Welcome to Manohar Grand Luxury Hotel Rooms. A contemporary hospitality destination offering comfortable stays with modern conveniences, prime connectivity, and warm service.',
  placeholderCancellationPolicy: 'Free cancellation up to 24 hours prior to check-in.',
};
