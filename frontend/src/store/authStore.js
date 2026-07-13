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

  switchSchool: async (schoolCode) => {
    const res = await authAPI.switchSchool(schoolCode);
    const { school, features } = res.data.data;
    set({ school, features: features || [] });
    return res.data;
  },

  clearSchool: () => {
    set({ school: null, features: [] });
  },

  logout: () => {
    localStorage.clear();
    set({ user: null, school: null, features: [], allowedModules: [], isAuthenticated: false });
  },

  hasFeature: (featureName) => {
    return get().features.includes(featureName);
  },

  hasRole: (...roleNames) => {
    const user = get().user;
    if (!user) return false;
    const allRoles = user.roles || (user.role ? [user.role] : []);
    return allRoles.some(r => roleNames.includes(r.name));
  },

  hasModule: (moduleName) => {
    const { allowedModules, user } = get();
    const allRoles = user?.roles || (user?.role ? [user.role] : []);
    const roleNames = allRoles.map(r => r.name);
    // Admin, super_admin, and principal always have access
    if (roleNames.some(n => ['super_admin', 'school_admin', 'principal'].includes(n))) return true;
    return allowedModules.includes(moduleName);
  },

  roleNames: () => {
    const { user } = get();
    if (!user) return [];
    const allRoles = user?.roles || (user?.role ? [user.role] : []);
    return allRoles.map(r => r.name);
  },

  canEditModule: (editorRoles) => {
    const { user } = get();
    if (!user) return false;
    const allRoles = user?.roles || (user?.role ? [user.role] : []);
    const roleNames = allRoles.map(r => r.name);
    // super_admin, school_admin, principal always have full access
    if (roleNames.some(n => ['super_admin', 'school_admin', 'principal'].includes(n))) return true;
    // If user has any of the editor roles, they can edit
    return roleNames.some(r => editorRoles.includes(r));
  },
}));

export default useAuthStore;
