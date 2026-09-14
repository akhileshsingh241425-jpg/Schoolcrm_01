import api from './client';

export const mobileAPI = {
  getVersionInfo: () => api.get('/mobile/version'),
};
