/**
 * DEMO OCCUPANCY & QUANTITY LIMITS CONFIGURATION
 * 
 * IMPORTANT ARCHITECTURAL NOTE:
 * These limits are temporary UI constraints for frontend demonstration.
 * They are NOT confirmed hotel business policies.
 * 
 * The client must officially confirm:
 * 1. Maximum adults allowed per single reservation
 * 2. Maximum children allowed per single reservation
 * 3. Maximum rooms allowed per direct booking
 * 4. Maximum adult/child occupancy per specific room category
 * 5. Age thresholds for child occupancy (e.g. below 5 yrs, 5-12 yrs)
 * 6. Extra-bed availability, limits, and extra-bed fee structure
 */

export const DEMO_OCCUPANCY_CONFIG = {
  isDemoConfiguration: true,
  disclaimer: 'Temporary UI constraints. Official hotel occupancy limits and extra-bed policies pending client confirmation.',

  limits: {
    minAdults: 1,
    maxAdults: 10,
    defaultAdults: 2,

    minChildren: 0,
    maxChildren: 6,
    defaultChildren: 0,

    minRooms: 1,
    maxRooms: 5,
    defaultRooms: 1,
  },

  categoryOccupancyEstimates: {
    'ac-room': {
      estimatedMaxAdults: 2,
      estimatedMaxChildren: 1,
    },
    'non-ac-room': {
      estimatedMaxAdults: 2,
      estimatedMaxChildren: 1,
    },
  },
} as const;

export type DemoOccupancyConfig = typeof DEMO_OCCUPANCY_CONFIG;
