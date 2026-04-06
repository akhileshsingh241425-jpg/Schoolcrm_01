import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  school: null,
  features: [],
  allowedModules: [],
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials) => {
    const res = await authAPI.login(credentials);
    const { access_token, refresh_token, user, school, features, allowed_modules } = res.data.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    set({ user, school, features, allowedModules: allowed_modules || [], isAuthenticated: true, isLoading: false });
    return res.data;
  },

  register: async (data) => {
    const res = await authAPI.register(data);
    const { access_token, refresh_token, user, school, features, allowed_modules } = res.data.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    set({ user, school, features: features || [], allowedModules: allowed_modules || [], isAuthenticated: true, isLoading: false });
    return res.data;
  },

  loadUser: async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const res = await authAPI.getMe();
      const { user, school, features, allowed_modules } = res.data.data;
      set({ user, school, features, allowedModules: allowed_modules || [], isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.clear();
      set({ user: null, school: null, features: [], allowedModules: [], isAuthenticated: false, isLoading: false });
    }
  },

  logout: () => {
    localStorage.clear();
    set({ user: null, school: null, features: [], allowedModules: [], isAuthenticated: false });
  },

  hasFeature: (featureName) => {
    return get().features.includes(featureName);
  },

  hasRole: (...roles) => {
    const user = get().user;
    return user && roles.includes(user.role?.name);
  },

  hasModule: (moduleName) => {
    const { allowedModules, user } = get();
    // Admin always has access
    if (user?.role?.name === 'super_admin' || user?.role?.name === 'school_admin') return true;
    return allowedModules.includes(moduleName);
  },
}));

export default useAuthStore;
