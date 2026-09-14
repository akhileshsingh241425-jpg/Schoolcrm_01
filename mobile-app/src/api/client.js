import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Set by the auth store so the interceptor can force a logout on refresh failure,
// without this module needing to import the store directly (avoids a circular import).
let onAuthFailure = () => {};
export const setOnAuthFailure = (fn) => {
  onAuthFailure = fn;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {},
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          );
          const newAccessToken = res.data.data.access_token;
          await AsyncStorage.setItem('access_token', newAccessToken);
          error.config.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(error.config);
        } catch (refreshError) {
          await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
          onAuthFailure();
          return Promise.reject(refreshError);
        }
      } else {
        onAuthFailure();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
