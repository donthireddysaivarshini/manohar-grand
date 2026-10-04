import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { CustomerUser } from '../types/customer';

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000';

// Token Storage Keys
const ACCESS_TOKEN_KEY = 'sc_access_token';
const REFRESH_TOKEN_KEY = 'sc_refresh_token';

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setTokens = (access: string, refresh?: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Axios Instance
export const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor: Attach Bearer JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s and silent token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and not already retrying
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/auth/token/refresh/') &&
      !originalRequest.url?.includes('/api/auth/login/')
    ) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${BACKEND_URL}/api/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        const newRefreshToken = response.data.refresh || refreshToken;

        setTokens(newAccessToken, newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        clearTokens();
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth Service Endpoints
export interface AuthResponse {
  access: string;
  refresh: string;
  user: CustomerUser;
}

export const authService = {
  // Sign in with Email & Password
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/api/auth/login/', {
      email,
      password,
    });
    const { access, refresh } = res.data;
    setTokens(access, refresh);
    return res.data;
  },

  // Sign up with Name, Email, Password
  signup: async (data: {
    name?: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ user: CustomerUser; message: string }> => {
    const res = await apiClient.post('/api/auth/signup/', data);
    return res.data.data;
  },

  // Google OAuth exchange
  loginWithGoogle: async (code: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/api/auth/google/', {
      code,
      callback_url: 'postmessage',
    });
    const { access, refresh } = res.data;
    setTokens(access, refresh);
    return res.data;
  },

  // Hydrate Current User
  getCurrentUser: async (): Promise<CustomerUser | null> => {
    const token = getAccessToken();
    if (!token) return null;
    try {
      const res = await apiClient.get<CustomerUser>('/api/auth/user/');
      return res.data;
    } catch {
      return null;
    }
  },

  // Update Profile (Phone, Name, Location)
  updateProfile: async (data: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    city?: string;
    state?: string;
  }): Promise<CustomerUser> => {
    const res = await apiClient.patch('/api/auth/profile/', data);
    return res.data.data || res.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/api/auth/logout/');
    } catch (e) {
      console.warn('Logout error ignored:', e);
    } finally {
      clearTokens();
    }
  },
};
