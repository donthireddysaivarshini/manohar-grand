import { getAccessToken } from '../lib/api';

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export async function initCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/auth/csrf/`, {
      credentials: 'include',
    });
    const json = await res.json();
    if (json.success && json.data?.csrfToken) {
      return json.data.csrfToken;
    }
  } catch (err) {
    console.warn('Could not initialize CSRF token from backend:', err);
  }
  return null;
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: any }> {
  const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach JWT Bearer Token if available
  const token = getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const csrfToken = getCookie('csrftoken');
  if (csrfToken && !headers.has('X-CSRFToken')) {
    headers.set('X-CSRFToken', csrfToken);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { success: false, error: json.error || { message: response.statusText } };
    }
    return json;
  } catch (error: any) {
    return { success: false, error: { message: error?.message || 'Network error' } };
  }
}
