import api from './client';

export const teacherAPI = {
  getMyClasses: () => api.get('/dashboard/teacher'),
  getRoster: (sectionId, date) =>
    api.get('/attendance/students', { params: { section_id: sectionId, date } }),
  markAttendance: (data) => api.post('/attendance/students', data),
  getMyTimetable: () => api.get('/academics/timetable', { params: { my: true } }),

  // Marks entry
  getMarksAssignments: (examId) =>
    api.get('/marks-entry/my-assignments', { params: examId ? { exam_id: examId } : {} }),
  getMarksSheet: (examScheduleId) =>
    api.get('/academics/marks/sheet', { params: { exam_schedule_id: examScheduleId } }),
  submitMarks: (data) => api.post('/academics/marks/entry', data),

  // Homework assign
  getMySubjects: () => api.get('/academics/teacher-subjects'),
  assignHomework: (data) => api.post('/academics/homework', data),

  getStudentDetail: (studentId) => api.get(`/students/${studentId}`),

  // Messages (with parents)
  getMessages: (studentId) => api.get('/parent/messages', { params: { student_id: studentId } }),
  sendMessage: (data) => api.post('/parent/messages', data),
  markMessageRead: (id) => api.put(`/parent/messages/${id}/read`),

  // Notices / announcements
  postAnnouncement: (data) => api.post('/communication/announcements', data),
};
