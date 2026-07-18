/**
 * Exam Management API Service
 * Covers all exam lifecycle endpoints: date sheet, question papers, seating,
 * invigilators, marks, results, grievances, re-exams, verification, notifications.
 */
import api from './api';

const BASE = '/exam-mgmt';

export const examMgmtAPI = {
  // ═══════════════════════════════════════════════════════════
  // DATE SHEET
  // ═══════════════════════════════════════════════════════════
  getDateSheet: (examId) => api.get(`${BASE}/date-sheet/${examId}`),
  submitDateSheet: (examId) => api.post(`${BASE}/date-sheet/${examId}/submit`),
  approveDateSheet: (examId) => api.post(`${BASE}/date-sheet/${examId}/approve`),
  rejectDateSheet: (examId, data) => api.post(`${BASE}/date-sheet/${examId}/reject`, data),

  // ═══════════════════════════════════════════════════════════
  // QUESTION PAPERS
  // ═══════════════════════════════════════════════════════════
  listQuestionPapers: (examId) => api.get(`${BASE}/question-papers/${examId}`),
  uploadQuestionPaper: (examId, formData) => api.post(`${BASE}/question-papers/${examId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  approveQuestionPaper: (paperId, data) => api.post(`${BASE}/question-papers/paper/${paperId}/approve`, data),

  // ═══════════════════════════════════════════════════════════
  // MARKS DEADLINES
  // ═══════════════════════════════════════════════════════════
  getDeadlines: (examId) => api.get(`${BASE}/deadlines/${examId}`),
  setDeadline: (examId, data) => api.post(`${BASE}/deadlines/${examId}`, data),

  // ═══════════════════════════════════════════════════════════
  // MARKS ENTRY STATUS
  // ═══════════════════════════════════════════════════════════
  getMarksStatus: (examId) => api.get(`${BASE}/marks-status/${examId}`),

  // ═══════════════════════════════════════════════════════════
  // RESULT PROCESSING
  // ═══════════════════════════════════════════════════════════
  processResults: (examId) => api.post(`${BASE}/results/${examId}/process`),
  getResultAnalysis: (examId, params) => api.get(`${BASE}/results/${examId}/analysis`, { params }),

  // ═══════════════════════════════════════════════════════════
  // SEATING
  // ═══════════════════════════════════════════════════════════
  generateSeating: (scheduleId, data) => api.post(`${BASE}/seating/${scheduleId}/generate`, data),

  // ═══════════════════════════════════════════════════════════
  // EXAM ATTENDANCE
  // ═══════════════════════════════════════════════════════════
  markExamAttendance: (scheduleId, data) => api.post(`${BASE}/exam-attendance/${scheduleId}`, data),
  getExamAttendance: (scheduleId) => api.get(`${BASE}/exam-attendance/${scheduleId}`),

  // ═══════════════════════════════════════════════════════════
  // GRIEVANCES
  // ═══════════════════════════════════════════════════════════
  listGrievances: (params) => api.get(`${BASE}/grievances`, { params }),
  createGrievance: (data) => api.post(`${BASE}/grievances`, data),
  updateGrievance: (id, data) => api.put(`${BASE}/grievances/${id}`, data),

  // ═══════════════════════════════════════════════════════════
  // GRACE MARKS
  // ═══════════════════════════════════════════════════════════
  applyGraceMarks: (examId, data) => api.post(`${BASE}/grace-marks/${examId}`, data),
  getGraceMarks: (examId) => api.get(`${BASE}/grace-marks/${examId}`),

  // ═══════════════════════════════════════════════════════════
  // RE-EXAM
  // ═══════════════════════════════════════════════════════════
  createReExam: (examId, data) => api.post(`${BASE}/re-exams/${examId}`, data),
  listReExams: (examId) => api.get(`${BASE}/re-exams/${examId}`),

  // ═══════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════
  getNotifications: () => api.get(`${BASE}/notifications`),
  markNotificationRead: (id) => api.put(`${BASE}/notifications/${id}/read`),

  // ═══════════════════════════════════════════════════════════
  // VERIFICATION
  // ═══════════════════════════════════════════════════════════
  generateVerification: (scheduleId, data) => api.post(`${BASE}/verification/${scheduleId}/generate`, data),
  getVerifications: (scheduleId) => api.get(`${BASE}/verification/${scheduleId}`),

  // ═══════════════════════════════════════════════════════════
  // ROOM SEATING
  // ═══════════════════════════════════════════════════════════
  getRoomSeating: (examId, hallId, params) => api.get(`${BASE}/room-seating/${examId}/${hallId}`, { params }),
  saveRoomSeating: (examId, hallId, data) => api.post(`${BASE}/room-seating/${examId}/${hallId}`, data),
  getAllRoomSeatings: (examId) => api.get(`${BASE}/room-seating/exam/${examId}`),

  // ═══════════════════════════════════════════════════════════
  // SEATING ARRANGEMENT (with approval workflow)
  // ═══════════════════════════════════════════════════════════
  listSeatingArrangements: (params) => api.get(`${BASE}/seating-arrangement`, { params }),
  createSeatingArrangement: (data) => api.post(`${BASE}/seating-arrangement`, data),
  getSeatingArrangement: (id) => api.get(`${BASE}/seating-arrangement/${id}`),
  updateSeatingArrangement: (id, data) => api.put(`${BASE}/seating-arrangement/${id}`, data),
  submitSeatingArrangement: (id) => api.post(`${BASE}/seating-arrangement/${id}/submit`),
  approveSeatingArrangement: (id) => api.post(`${BASE}/seating-arrangement/${id}/approve`),
  rejectSeatingArrangement: (id, data) => api.post(`${BASE}/seating-arrangement/${id}/reject`, data),
};

export default examMgmtAPI;
