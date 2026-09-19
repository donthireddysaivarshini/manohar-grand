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
  
  // Confirmed Contact & Location Details
  address: 'Plot No: 11, Road No: 1, Vasantha Nagar Colony, Near J.N.T.U Metro Station, Kukatpally, Hyderabad, Telangana',
  nearLandmark: 'Near J.N.T.U Metro Station, Kukatpally',
  googleMapsUrl: 'https://maps.app.goo.gl/bRAK5NEYvuFwctyo8?g_st=ac',
  googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3805.1873596687033!2d78.387164!3d17.498567400000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9174ab3993e9%3A0x371cfe2f1aa5bd25!2sManohar%20Grand%20Luxury%20Hotel%20Rooms!5e0!3m2!1sen!2sin!4v1789739548870!5m2!1sen!2sin',
  
  phones: ['+91 7997044999', '+91 7997022999'],
  primaryPhone: '+91 7997044999',
  email: 'manohargrand1@gmail.com',
  businessHours: '24 Hours (Monday to Sunday - 24/7 Front Desk Service)',
  
  socialLinks: {
    facebook: 'https://www.facebook.com/share/1BfiAX1yuX/',
    instagram: 'https://www.instagram.com/manohargrand?stkn=MTE4eGt2Y2Zyd2F1OA==',
  },
  
  placeholderAddress: 'Plot No: 11, Road No: 1, Vasantha Nagar Colony, Near J.N.T.U Metro Station, Kukatpally, Hyderabad, Telangana',
  placeholderPhone: '+91 7997044999 / +91 7997022999',
  placeholderEmail: 'manohargrand1@gmail.com',
  placeholderCheckInTime: '12:00 PM (Standard Check-in)',
  placeholderCheckOutTime: '11:00 AM (Standard Check-out)',
  placeholderDescription: 'Welcome to Manohar Grand Luxury Hotel Rooms. A contemporary hospitality destination offering 24/7 service, comfortable AC and Non-AC stays with modern conveniences, prime connectivity near JNTU Metro Station, and warm hospitality.',
  placeholderCancellationPolicy: 'Free cancellation up to 24 hours prior to check-in.',
};
