import api from './client';

export const parentAPI = {
  listMyChildren: () => api.get('/parent/my-children'),
  getChildOverview: (studentId) => api.get(`/parent/child/${studentId}`),
};
