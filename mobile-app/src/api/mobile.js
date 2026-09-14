import api from './client';

export const mobileAPI = {
  getVersionInfo: () => api.get('/mobile/version'),
  registerPushToken: (token, platform) => api.post('/mobile/register-push-token', { token, platform }),
};
