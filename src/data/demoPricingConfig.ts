/**
 * CONFIGURABLE DEMO PRICING & TAX VALUES
 * Tax rate and room rates are demo estimates and must not be treated as confirmed rates.
 */
export const DEMO_PRICING_CONFIG = {
  // Configurable demo tax percentage (e.g. 12% or 0% for demo)
  taxRatePercent: 12,
  isDemoPricing: true,
  taxDisclaimer: 'Demo tax calculation. Official tax rates to be confirmed by hotel management.',
  
  // Base prices per night in INR
  baseRates: {
    'ac-room': 1599, // Confirmed base tariff
    'non-ac-room': 1299, // Confirmed base tariff
  },
} as const;
