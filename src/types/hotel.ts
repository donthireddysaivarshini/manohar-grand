export interface HotelInfo {
  name: string;
  totalRooms: number;
  acRooms: number;
  nonAcRooms: number;
  
  // Location & Address
  address: string;
  nearLandmark: string;
  googleMapsUrl: string;
  googleMapsEmbedUrl: string;
  
  // Contact
  phones: string[];
  primaryPhone: string;
  email: string;
  
  // Operational Hours
  businessHours: string;
  
  // Social Links
  socialLinks: {
    facebook: string;
    instagram: string;
    linkedin?: string;
  };

  // Explicitly labeled placeholder info
  placeholderAddress: string;
  placeholderPhone: string;
  placeholderEmail: string;
  placeholderCheckInTime: string;
  placeholderCheckOutTime: string;
  placeholderDescription: string;
  placeholderCancellationPolicy: string;
}
