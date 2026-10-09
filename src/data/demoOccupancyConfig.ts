/**
 * OFFICIAL OCCUPANCY & CAPACITY POLICIES - MANOHAR GRAND
 * 
 * Confirmed Hotel Rules:
 * 1. Maximum 3 Adults per room.
 * 2. Maximum 1 Child below 10 years per room.
 * 3. Children above 10 years are classified as Adults (subject to the 3-adult room maximum).
 * 4. Maximum occupancy per room: 3 Adults + 1 Child (< 10 yrs).
 */

export const HOTEL_OCCUPANCY_POLICY = {
  isConfirmedPolicy: true,

  perRoomLimits: {
    minAdults: 1,
    maxAdults: 3,
    defaultAdults: 2,

    minChildren: 0,
    maxChildrenBelow10: 1,
    defaultChildren: 0,
    childAgeCutoffYears: 10,

    minRooms: 1,
    maxRooms: 10,
    defaultRooms: 1,
  },

  policyNotice: 'Maximum 3 Adults and 1 Child (below 10 years) permitted per room. Guests aged 10 and above are counted as Adults.',
} as const;

// Backward-compatible export for existing components
export const DEMO_OCCUPANCY_CONFIG = {
  isDemoConfiguration: false,
  disclaimer: HOTEL_OCCUPANCY_POLICY.policyNotice,

  limits: {
    minAdults: 1,
    maxAdultsPerRoom: 3,
    maxAdults: 30,
    defaultAdults: 2,

    minChildren: 0,
    maxChildrenPerRoom: 1,
    maxChildren: 10,
    defaultChildren: 0,
    childAgeCutoffYears: 10,

    minRooms: 1,
    maxRooms: 10,
    defaultRooms: 1,
  },
} as const;

export type HotelOccupancyPolicy = typeof HOTEL_OCCUPANCY_POLICY;
export type DemoOccupancyConfig = typeof DEMO_OCCUPANCY_CONFIG;
