import api from './client';

export const teacherAPI = {
  getMyClasses: () => api.get('/dashboard/teacher'),
  getRoster: (sectionId, date) =>
    api.get('/attendance/students', { params: { section_id: sectionId, date } }),
  markAttendance: (data) => api.post('/attendance/students', data),
  getMyTimetable: () => api.get('/academics/timetable', { params: { my: true } }),
};
