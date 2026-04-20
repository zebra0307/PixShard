import axios from 'axios';
import { auth } from '../firebase/config';

// Use VITE_API_BASE_URL in production, proxy in dev (see vite.config.js)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach fresh Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken(/* forceRefresh= */ false);
      config.headers.Authorization = `Bearer ${token}`;
    } catch (err) {
      console.warn('[API] Could not get Firebase token:', err.message);
    }
  }
  return config;
});

// On 401: Firebase token expired — sign out and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      auth.signOut();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
