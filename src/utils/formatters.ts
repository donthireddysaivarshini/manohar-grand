/**
 * Currency and string formatting helpers
 */
export function formatCurrencyINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDemoPrice(amount: number): string {
  return `${formatCurrencyINR(amount)} (Demo)`;
}
