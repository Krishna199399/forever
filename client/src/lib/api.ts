import axios from 'axios';

/**
 * Centralized Axios instance for all API calls.
 *
 * The base URL is read from the VITE_API_BASE_URL environment variable,
 * which allows easy switching between development (localhost:5000)
 * and production (your VPS domain) without touching any page code.
 *
 * Set VITE_API_BASE_URL in your .env file:
 *   - Dev:  VITE_API_BASE_URL=http://localhost:5000
 *   - Prod: VITE_API_BASE_URL=https://yourdomain.com
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 10_000, // 10 seconds — prevents hung requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request Interceptor ---
// Attach any auth headers or log outgoing requests here in the future.
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// --- Response Interceptor ---
// Normalize errors so page components get a consistent error shape.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.error ||
      error?.message ||
      'An unexpected error occurred. Please try again.';

    if (import.meta.env.DEV) {
      console.error(`[API Error] ${error?.config?.method?.toUpperCase()} ${error?.config?.url} →`, message);
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
