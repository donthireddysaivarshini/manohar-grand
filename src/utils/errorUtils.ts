/**
 * Safe Error Message Parser for Manohar Grand Frontend.
 * Guarantees a string output and prevents React rendering crashes.
 */
export function extractErrorMessage(err: unknown, defaultMessage = 'An unexpected error occurred. Please try again.'): string {
  if (!err) return defaultMessage;
  if (typeof err === 'string') return err;

  const error = err as any;
  const data = error?.response?.data;

  if (data) {
    if (typeof data === 'string') return data;
    if (typeof data.error === 'string') return data.error;
    if (typeof data.error?.message === 'string') return data.error.message;
    if (typeof data.message === 'string') return data.message;
    if (typeof data.detail === 'string') return data.detail;

    // Handle DRF details object: { email: ["This field is required."], password: [...] }
    const details = data.error?.details || data.details;
    if (details && typeof details === 'object') {
      const keys = Object.keys(details);
      if (keys.length > 0) {
        const firstKey = keys[0];
        const val = details[firstKey];
        if (typeof val === 'string') {
          return `${firstKey === 'detail' || firstKey === 'non_field_errors' ? '' : firstKey + ': '}${val}`;
        }
        if (Array.isArray(val) && typeof val[0] === 'string') {
          return `${firstKey === 'detail' || firstKey === 'non_field_errors' ? '' : firstKey + ': '}${val[0]}`;
        }
      }
    }
  }

  if (typeof error?.message === 'string' && error.message.trim().length > 0) {
    return error.message;
  }

  return defaultMessage;
}
