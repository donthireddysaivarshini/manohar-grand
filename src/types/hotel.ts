export interface HotelInfo {
  name: string;
  totalRooms: number;
  acRooms: number;
  nonAcRooms: number;
  
  // Location & Maps
  address: string;
  googleMapsUrl: string;
  googleMapsEmbedUrl: string;
  
  // Explicitly labeled placeholder info
  placeholderAddress: string;
  placeholderPhone: string;
  placeholderEmail: string;
  placeholderCheckInTime: string;
  placeholderCheckOutTime: string;
  placeholderDescription: string;
  placeholderCancellationPolicy: string;
}
