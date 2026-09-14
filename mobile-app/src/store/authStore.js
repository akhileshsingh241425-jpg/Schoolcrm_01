import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api/auth';
import { setOnAuthFailure } from '../api/client';

const useAuthStore = create((set, get) => ({
  user: null,
  school: null,
  isAuthenticated: false,
  isLoading: true, // true while we check for a stored token on app boot
  error: null,

  login: async ({ email, password, school_code }) => {
    set({ error: null });
    try {
      const res = await authAPI.login({ email, password, school_code });
      const { access_token, refresh_token, user, school } = res.data.data;
      await AsyncStorage.multiSet([
        ['access_token', access_token],
        ['refresh_token', refresh_token],
      ]);
      set({ user, school, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      set({ error: message });
      return { success: false, message };
    }
  },

  loadUser: async () => {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const res = await authAPI.getMe();
      const { user, school } = res.data.data;
      set({ user, school, isAuthenticated: true, isLoading: false });
    } catch (err) {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
      set({ user: null, school: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    set({ user: null, school: null, isAuthenticated: false });
  },
}));

// Wired up here (rather than in client.js) to avoid a circular import between
// the api client and this store.
setOnAuthFailure(() => {
  useAuthStore.setState({ user: null, school: null, isAuthenticated: false });
});

export default useAuthStore;
