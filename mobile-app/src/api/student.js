import api from './client';

export const studentPortalAPI = {
  me: () => api.get('/student/me'),
  dashboard: () => api.get('/student/dashboard'),
  attendance: () => api.get('/student/attendance'),
  timetable: () => api.get('/student/timetable'),
  fees: () => api.get('/student/fees'),
  exams: () => api.get('/student/exams'),
  homework: (params) => api.get('/student/homework', { params }),
  announcements: () => api.get('/student/announcements'),
  hostel: () => api.get('/student/hostel'),
  library: () => api.get('/student/library'),
  transport: () => api.get('/transport/my-transport'),
};
