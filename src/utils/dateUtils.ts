/**
 * Date calculation and formatting utilities
 */
export function calculateNights(checkInStr: string, checkOutStr: string): number {
  if (!checkInStr || !checkOutStr) return 0;
  const start = new Date(checkInStr);
  const end = new Date(checkOutStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatDayOfWeek(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { weekday: 'short' });
}

export function getTodayDateString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export function getFutureDateString(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

export function addDaysToDate(dateStr: string, daysToAdd: number): string {
  if (!dateStr) return getFutureDateString(daysToAdd);
  const d = new Date(dateStr);
  d.setDate(d.getDate() + daysToAdd);
  return d.toISOString().split('T')[0];
}

export function isValidDateRange(checkInStr: string, checkOutStr: string): boolean {
  if (!checkInStr || !checkOutStr) return false;
  return new Date(checkOutStr).getTime() > new Date(checkInStr).getTime();
}
