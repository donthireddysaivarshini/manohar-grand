import { HotelInfo } from '../types/hotel';
import { CONFIRMED_HOTEL_INFO } from './confirmedInventory';

/**
 * HOTEL INFORMATION & POLICIES
 */
export const PLACEHOLDER_HOTEL_INFO: HotelInfo & {
  cancellationPolicy: string;
  guestIdPolicy: string;
  agePolicy: string;
  mattressFeature: string;
} = {
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
  placeholderCheckInTime: '12:00 PM (24/7 Front Desk available)',
  placeholderCheckOutTime: '11:00 AM (Standard Check-out)',
  placeholderDescription: 'Welcome to Manohar Grand Luxury Hotel Rooms. Located in the heart of Kukatpally near JNTU Metro Station, offering premium Wakefit Memory Foam mattresses in every room, 24/7 reception, AC and Non-AC stays, on-site car parking, and warm hospitality.',
  placeholderCancellationPolicy: 'Cancellations made 2+ days (48+ hours) prior to check-in receive a 50% refund. Same-day cancellations or cancellations within 48 hours are non-refundable (0% refund).',
  
  // Specific Policies
  cancellationPolicy: 'Cancellations made 2+ days (48+ hours) before check-in will receive a 50% refund. Cancellations made on the day of stay or within 48 hours of check-in are strictly non-refundable (0% return).',
  guestIdPolicy: 'Original Aadhar Card (or valid Govt. Photo ID) is mandatory for every person checking in.',
  agePolicy: 'Primary guest must be 18 years of age or older to check in.',
  mattressFeature: 'Premium Wakefit Memory Foam Mattresses in each and every bedroom.',
};
