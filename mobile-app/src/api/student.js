import api from './client';

export const studentPortalAPI = {
  me: () => api.get('/student/me'),
  dashboard: () => api.get('/student/dashboard'),
  attendance: () => api.get('/student/attendance'),
  timetable: () => api.get('/student/timetable'),
};
