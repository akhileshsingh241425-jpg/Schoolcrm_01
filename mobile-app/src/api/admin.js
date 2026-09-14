import api from './client';

export const adminAPI = {
  getDashboard: () => api.get('/dashboard/'),
  getLeaves: (status) => api.get('/staff/leaves', { params: status ? { status } : {} }),
  approveLeave: (id, action, remarks) => api.put(`/staff/leaves/${id}/approve`, { action, remarks }),
  searchStudents: (q) => api.get('/students/', { params: q ? { search: q } : {} }),
  getFeesDashboard: () => api.get('/fees/dashboard'),
};
