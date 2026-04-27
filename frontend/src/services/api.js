import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` },
          });
          const newToken = res.data.data.access_token;
          localStorage.setItem('access_token', newToken);
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ---- API Service Functions ----

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register-school', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  // Roles & Users
  listRoles: () => api.get('/auth/roles'),
  updateRolePermissions: (roleId, data) => api.put(`/auth/roles/${roleId}/permissions`, data),
  listUsers: (params) => api.get('/auth/users', { params }),
  createUser: (data) => api.post('/auth/users', data),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  listModules: () => api.get('/auth/modules'),
};

// Dashboard
export const dashboardAPI = {
  get: () => api.get('/dashboard/'),
};

// Students
export const studentsAPI = {
  list: (params) => api.get('/students/', { params }),
  get: (id) => api.get(`/students/${id}`),
  get360: (id) => api.get(`/students/360/${id}`),
  create: (data) => api.post('/students/', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  dashboard: () => api.get('/students/dashboard'),
  listClasses: () => api.get('/students/classes'),
  createClass: (data) => api.post('/students/classes', data),
  listSections: (classId) => api.get(`/students/sections/${classId}`),
  createSection: (data) => api.post('/students/sections', data),
  listAcademicYears: () => api.get('/students/academic-years'),
  createAcademicYear: (data) => api.post('/students/academic-years', data),
  // Promotions
  listPromotions: (params) => api.get('/students/promotions', { params }),
  promote: (data) => api.post('/students/promote', data),
  bulkPromote: (data) => api.post('/students/bulk-promote', data),
  // Achievements
  listAchievements: (id, params) => api.get(`/students/${id}/achievements`, { params }),
  addAchievement: (id, data) => api.post(`/students/${id}/achievements`, data),
  deleteAchievement: (id) => api.delete(`/students/achievements/${id}`),
  // Behavior
  listBehavior: (id, params) => api.get(`/students/${id}/behavior`, { params }),
  addBehavior: (id, data) => api.post(`/students/${id}/behavior`, data),
  // Timeline
  getTimeline: (id, params) => api.get(`/students/${id}/timeline`, { params }),
  addTimeline: (id, data) => api.post(`/students/${id}/timeline`, data),
  // Counseling
  listCounseling: (id, params) => api.get(`/students/${id}/counseling`, { params }),
  addCounseling: (id, data) => api.post(`/students/${id}/counseling`, data),
  updateCounseling: (id, data) => api.put(`/students/counseling/${id}`, data),
  // Medical
  listMedical: (id, params) => api.get(`/students/${id}/medical`, { params }),
  addMedical: (id, data) => api.post(`/students/${id}/medical`, data),
  // Documents
  listDocuments: (id) => api.get(`/students/${id}/documents`),
  uploadDocument: (id, data) => api.post(`/students/${id}/documents`, data),
  verifyDocument: (id) => api.put(`/students/documents/${id}/verify`),
  deleteDocument: (id) => api.delete(`/students/documents/${id}`),
  // Houses
  listHouses: () => api.get('/students/houses'),
  createHouse: (data) => api.post('/students/houses', data),
  updateHouse: (id, data) => api.put(`/students/houses/${id}`, data),
  assignHouse: (data) => api.post('/students/assign-house', data),
  autoAssignHouses: () => api.post('/students/auto-assign-houses'),
  // Siblings
  linkSiblings: (data) => api.post('/students/link-siblings', data),
  getSiblings: (id) => api.get(`/students/${id}/siblings`),
  // Alumni
  listAlumni: (params) => api.get('/students/alumni', { params }),
  createAlumni: (data) => api.post('/students/alumni', data),
  updateAlumni: (id, data) => api.put(`/students/alumni/${id}`, data),
  graduateToAlumni: (data) => api.post('/students/graduate-to-alumni', data),
  // ID Card
  getIdCard: (id) => api.get(`/students/${id}/id-card`),
  bulkIdCards: (data) => api.post('/students/bulk-id-cards', data),
  // Transfer
  transfer: (id, data) => api.post(`/students/${id}/transfer`, data),
  // Smart allocation
  smartAllocate: (data) => api.post('/students/smart-allocate', data),
  // Bulk import
  bulkImport: (data) => api.post('/students/bulk-import', data),
};

// Staff
export const staffAPI = {
  list: (params) => api.get('/staff/', { params }),
  get: (id) => api.get(`/staff/${id}`),
  getProfile: (id) => api.get(`/staff/${id}/profile`),
  create: (data) => api.post('/staff/', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  dashboard: () => api.get('/staff/dashboard'),
  // Documents
  listDocuments: (staffId) => api.get(`/staff/${staffId}/documents`),
  addDocument: (staffId, data) => api.post(`/staff/${staffId}/documents`, data),
  verifyDocument: (docId) => api.put(`/staff/documents/${docId}/verify`),
  deleteDocument: (docId) => api.delete(`/staff/documents/${docId}`),
  // Salary Structure
  listSalaryStructures: (params) => api.get('/staff/salary-structures', { params }),
  createSalaryStructure: (data) => api.post('/staff/salary-structures', data),
  updateSalaryStructure: (id, data) => api.put(`/staff/salary-structures/${id}`, data),
  // Payroll
  listPayroll: (params) => api.get('/staff/payroll', { params }),
  generatePayroll: (data) => api.post('/staff/payroll/generate', data),
  updatePayroll: (id, data) => api.put(`/staff/payroll/${id}`, data),
  createPayroll: (data) => api.post('/staff/payroll', data),
  // Leave
  listLeaves: (params) => api.get('/staff/leaves', { params }),
  applyLeave: (data) => api.post('/staff/leaves', data),
  approveLeave: (id, data) => api.put(`/staff/leaves/${id}/approve`, data),
  getLeaveBalance: (params) => api.get('/staff/leave-balance', { params }),
  setLeaveBalance: (data) => api.post('/staff/leave-balance', data),
  // Performance
  listReviews: (params) => api.get('/staff/reviews', { params }),
  createReview: (data) => api.post('/staff/reviews', data),
  updateReview: (id, data) => api.put(`/staff/reviews/${id}`, data),
  // Recruitment
  listRecruitment: (params) => api.get('/staff/recruitment', { params }),
  createRecruitment: (data) => api.post('/staff/recruitment', data),
  updateRecruitment: (id, data) => api.put(`/staff/recruitment/${id}`, data),
  listApplications: (recId, params) => api.get(`/staff/recruitment/${recId}/applications`, { params }),
  addApplication: (recId, data) => api.post(`/staff/recruitment/${recId}/applications`, data),
  updateApplication: (appId, data) => api.put(`/staff/applications/${appId}`, data),
  // Training
  listTrainings: (params) => api.get('/staff/trainings', { params }),
  createTraining: (data) => api.post('/staff/trainings', data),
  updateTraining: (id, data) => api.put(`/staff/trainings/${id}`, data),
  // Duty Roster
  listDuties: (params) => api.get('/staff/duties', { params }),
  createDuty: (data) => api.post('/staff/duties', data),
  updateDuty: (id, data) => api.put(`/staff/duties/${id}`, data),
  deleteDuty: (id) => api.delete(`/staff/duties/${id}`),
  // Exit
  initiateExit: (staffId, data) => api.post(`/staff/${staffId}/exit`, data),
  completeExit: (staffId, data) => api.post(`/staff/${staffId}/exit/complete`, data),
  // Workload
  getWorkload: () => api.get('/staff/workload'),
};

// Leads (CRM)
export const leadsAPI = {
  list: (params) => api.get('/leads/', { params }),
  get: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads/', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  addFollowup: (id, data) => api.post(`/leads/${id}/followups`, data),
  listSources: () => api.get('/leads/sources'),
  createSource: (data) => api.post('/leads/sources', data),
  listCampaigns: (params) => api.get('/leads/campaigns', { params }),
  createCampaign: (data) => api.post('/leads/campaigns', data),
};

// Admissions
export const admissionsAPI = {
  list: (params) => api.get('/admissions/', { params }),
  get: (id) => api.get(`/admissions/${id}`),
  create: (data) => api.post('/admissions/', data),
  update: (id, data) => api.put(`/admissions/${id}`, data),
  delete: (id) => api.delete(`/admissions/${id}`),
  updateStatus: (id, data) => api.put(`/admissions/${id}/status`, data),
  enroll: (id, data) => api.post(`/admissions/${id}/enroll`, data),
  // Documents
  getDocuments: (id) => api.get(`/admissions/${id}/documents`),
  uploadDocument: (id, formData) => api.post(`/admissions/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  verifyDocument: (admId, docId, data) => api.put(`/admissions/${admId}/documents/${docId}/verify`, data),
  deleteDocument: (admId, docId) => api.delete(`/admissions/${admId}/documents/${docId}`),
  // Seat Matrix
  getSeatMatrix: (params) => api.get('/admissions/seat-matrix', { params }),
  createSeatMatrix: (data) => api.post('/admissions/seat-matrix', data),
  updateSeatMatrix: (id, data) => api.put(`/admissions/seat-matrix/${id}`, data),
  // Waitlist
  getWaitlist: (params) => api.get('/admissions/waitlist', { params }),
  offerWaitlistSeat: (id) => api.post(`/admissions/waitlist/${id}/offer`),
  // Tests
  listTests: (params) => api.get('/admissions/tests', { params }),
  createTest: (data) => api.post('/admissions/tests', data),
  updateTest: (id, data) => api.put(`/admissions/tests/${id}`, data),
  assignToTest: (testId, data) => api.post(`/admissions/tests/${testId}/assign`, data),
  getTestResults: (testId) => api.get(`/admissions/tests/${testId}/results`),
  submitTestResults: (testId, data) => api.post(`/admissions/tests/${testId}/results`, data),
  getMeritList: (classId) => api.get(`/admissions/merit-list/${classId}`),
  // Transfer Certificates
  listTC: () => api.get('/admissions/transfer-certificates'),
  generateTC: (data) => api.post('/admissions/transfer-certificates', data),
  approveTC: (id) => api.put(`/admissions/transfer-certificates/${id}/approve`),
  // Settings & Dashboard
  getSettings: () => api.get('/admissions/settings'),
  updateSettings: (data) => api.put('/admissions/settings', data),
  getDashboard: () => api.get('/admissions/dashboard'),
  // Bulk
  bulkImport: (data) => api.post('/admissions/bulk-import', data),
};

// Academics & Examinations
export const academicsAPI = {
  // Subjects
  listSubjects: (params) => api.get('/academics/subjects', { params }),
  createSubject: (data) => api.post('/academics/subjects', data),
  updateSubject: (id, data) => api.put(`/academics/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/academics/subjects/${id}`),
  // Subject Components
  listComponents: (subjectId) => api.get(`/academics/subjects/${subjectId}/components`),
  addComponent: (subjectId, data) => api.post(`/academics/subjects/${subjectId}/components`, data),
  deleteComponent: (compId) => api.delete(`/academics/subjects/components/${compId}`),
  // Class-Subject Mapping
  getClassSubjects: (classId) => api.get(`/academics/class-subjects/${classId}`),
  assignSubject: (data) => api.post('/academics/class-subjects', data),
  updateClassSubject: (id, data) => api.put(`/academics/class-subjects/${id}`, data),
  removeClassSubject: (id) => api.delete(`/academics/class-subjects/${id}`),
  // Timetable
  getTimetable: (params) => api.get('/academics/timetable', { params }),
  createTimetable: (data) => api.post('/academics/timetable', data),
  updateTimetable: (id, data) => api.put(`/academics/timetable/${id}`, data),
  deleteTimetable: (id) => api.delete(`/academics/timetable/${id}`),
  bulkCreateTimetable: (data) => api.post('/academics/timetable/bulk', data),
  // Exam Types
  listExamTypes: () => api.get('/academics/exam-types'),
  createExamType: (data) => api.post('/academics/exam-types', data),
  updateExamType: (id, data) => api.put(`/academics/exam-types/${id}`, data),
  deleteExamType: (id) => api.delete(`/academics/exam-types/${id}`),
  // Grading Systems
  listGradingSystems: () => api.get('/academics/grading-systems'),
  createGradingSystem: (data) => api.post('/academics/grading-systems', data),
  updateGradingSystem: (id, data) => api.put(`/academics/grading-systems/${id}`, data),
  deleteGradingSystem: (id) => api.delete(`/academics/grading-systems/${id}`),
  addGrade: (gsId, data) => api.post(`/academics/grading-systems/${gsId}/grades`, data),
  updateGrade: (gradeId, data) => api.put(`/academics/grading-systems/grades/${gradeId}`, data),
  deleteGrade: (gradeId) => api.delete(`/academics/grading-systems/grades/${gradeId}`),
  calculateGrade: (gsId, params) => api.get(`/academics/grading-systems/${gsId}/calculate`, { params }),
  // Exams
  listExams: (params) => api.get('/academics/exams', { params }),
  getExam: (id) => api.get(`/academics/exams/${id}`),
  createExam: (data) => api.post('/academics/exams', data),
  updateExam: (id, data) => api.put(`/academics/exams/${id}`, data),
  deleteExam: (id) => api.delete(`/academics/exams/${id}`),
  updateExamStatus: (id, data) => api.put(`/academics/exams/${id}/status`, data),
  // Exam Schedules
  listSchedules: (examId) => api.get(`/academics/exams/${examId}/schedules`),
  addExamSchedule: (examId, data) => api.post(`/academics/exams/${examId}/schedules`, data),
  updateSchedule: (scheduleId, data) => api.put(`/academics/exams/schedules/${scheduleId}`, data),
  deleteSchedule: (scheduleId) => api.delete(`/academics/exams/schedules/${scheduleId}`),
  bulkAddSchedules: (examId, data) => api.post(`/academics/exams/${examId}/schedules/bulk`, data),
  // Exam Groups
  listExamGroups: () => api.get('/academics/exam-groups'),
  createExamGroup: (data) => api.post('/academics/exam-groups', data),
  updateExamGroup: (id, data) => api.put(`/academics/exam-groups/${id}`, data),
  deleteExamGroup: (id) => api.delete(`/academics/exam-groups/${id}`),
  addExamToGroup: (groupId, data) => api.post(`/academics/exam-groups/${groupId}/exams`, data),
  removeExamFromGroup: (mappingId) => api.delete(`/academics/exam-groups/mappings/${mappingId}`),
  // Exam Halls
  listExamHalls: () => api.get('/academics/exam-halls'),
  createExamHall: (data) => api.post('/academics/exam-halls', data),
  updateExamHall: (id, data) => api.put(`/academics/exam-halls/${id}`, data),
  deleteExamHall: (id) => api.delete(`/academics/exam-halls/${id}`),
  // Seating
  getSeating: (scheduleId) => api.get(`/academics/exams/schedules/${scheduleId}/seating`),
  autoGenerateSeating: (scheduleId) => api.post(`/academics/exams/schedules/${scheduleId}/seating/auto`),
  // Invigilators
  listInvigilators: (scheduleId) => api.get(`/academics/exams/schedules/${scheduleId}/invigilators`),
  assignInvigilator: (scheduleId, data) => api.post(`/academics/exams/schedules/${scheduleId}/invigilators`, data),
  removeInvigilator: (invId) => api.delete(`/academics/exams/invigilators/${invId}`),
  // Marks Entry
  bulkMarksEntry: (data) => api.post('/academics/marks/entry', data),
  getMarksSheet: (params) => api.get('/academics/marks/sheet', { params }),
  lockMarks: (data) => api.post('/academics/marks/lock', data),
  unlockMarks: (data) => api.post('/academics/marks/unlock', data),
  // Results & Analytics
  addResults: (data) => api.post('/academics/results', data),
  getStudentResults: (studentId, params) => api.get(`/academics/results/student/${studentId}`, { params }),
  getClassResults: (params) => api.get('/academics/results/class', { params }),
  getSubjectAnalysis: (params) => api.get('/academics/results/subject-analysis', { params }),
  getToppers: (params) => api.get('/academics/results/toppers', { params }),
  // Admit Cards
  generateAdmitCards: (data) => api.post('/academics/admit-cards/generate', data),
  listAdmitCards: (params) => api.get('/academics/admit-cards', { params }),
  updateAdmitCardStatus: (id, data) => api.put(`/academics/admit-cards/${id}/status`, data),
  // Report Cards
  generateReportCards: (data) => api.post('/academics/report-cards/generate', data),
  listReportCards: (params) => api.get('/academics/report-cards', { params }),
  getReportCard: (id) => api.get(`/academics/report-cards/${id}`),
  updateReportCard: (id, data) => api.put(`/academics/report-cards/${id}`, data),
  publishReportCards: (data) => api.post('/academics/report-cards/publish', data),
  studentReportCards: (studentId) => api.get(`/academics/report-cards/student/${studentId}`),
  downloadReportCardPDF: (id) => api.get(`/academics/report-cards/${id}/pdf`, { responseType: 'blob' }),
  downloadSampleReportCard: () => api.get('/academics/report-cards/sample-pdf', { responseType: 'blob' }),
  // Exam Incidents
  listIncidents: (params) => api.get('/academics/exam-incidents', { params }),
  reportIncident: (data) => api.post('/academics/exam-incidents', data),
  updateIncident: (id, data) => api.put(`/academics/exam-incidents/${id}`, data),
  // Dashboard
  getExamDashboard: () => api.get('/academics/exam-dashboard'),
  // Curriculum Dashboard
  getCurriculumDashboard: () => api.get('/academics/curriculum-dashboard'),
  // Syllabus
  listSyllabus: (params) => api.get('/academics/syllabus', { params }),
  createSyllabus: (data) => api.post('/academics/syllabus', data),
  getSyllabus: (id) => api.get(`/academics/syllabus/${id}`),
  updateSyllabus: (id, data) => api.put(`/academics/syllabus/${id}`, data),
  deleteSyllabus: (id) => api.delete(`/academics/syllabus/${id}`),
  addSyllabusProgress: (id, data) => api.post(`/academics/syllabus/${id}/progress`, data),
  getSyllabusOverview: (params) => api.get('/academics/syllabus-overview', { params }),
  // Lesson Plans
  listLessonPlans: (params) => api.get('/academics/lesson-plans', { params }),
  createLessonPlan: (data) => api.post('/academics/lesson-plans', data),
  getLessonPlan: (id) => api.get(`/academics/lesson-plans/${id}`),
  updateLessonPlan: (id, data) => api.put(`/academics/lesson-plans/${id}`, data),
  deleteLessonPlan: (id) => api.delete(`/academics/lesson-plans/${id}`),
  approveLessonPlan: (id, data) => api.post(`/academics/lesson-plans/${id}/approve`, data),
  // Homework
  listHomework: (params) => api.get('/academics/homework', { params }),
  createHomework: (data) => api.post('/academics/homework', data),
  getHomework: (id) => api.get(`/academics/homework/${id}`),
  updateHomework: (id, data) => api.put(`/academics/homework/${id}`, data),
  deleteHomework: (id) => api.delete(`/academics/homework/${id}`),
  submitHomework: (id, data) => api.post(`/academics/homework/${id}/submit`, data),
  gradeHomework: (id, data) => api.post(`/academics/homework/${id}/grade`, data),
  // Study Materials
  listStudyMaterials: (params) => api.get('/academics/study-materials', { params }),
  createStudyMaterial: (data) => api.post('/academics/study-materials', data),
  getStudyMaterial: (id) => api.get(`/academics/study-materials/${id}`),
  updateStudyMaterial: (id, data) => api.put(`/academics/study-materials/${id}`, data),
  deleteStudyMaterial: (id) => api.delete(`/academics/study-materials/${id}`),
  // Academic Calendar
  getCalendar: (params) => api.get('/academics/calendar', { params }),
  createCalendarEvent: (data) => api.post('/academics/calendar', data),
  updateCalendarEvent: (id, data) => api.put(`/academics/calendar/${id}`, data),
  deleteCalendarEvent: (id) => api.delete(`/academics/calendar/${id}`),
  // Teacher Subject Allocation
  listTeacherSubjects: (params) => api.get('/academics/teacher-subjects', { params }),
  createTeacherSubject: (data) => api.post('/academics/teacher-subjects', data),
  updateTeacherSubject: (id, data) => api.put(`/academics/teacher-subjects/${id}`, data),
  deleteTeacherSubject: (id) => api.delete(`/academics/teacher-subjects/${id}`),
  // Class Teacher Management
  getClassTeachers: (params) => api.get('/academics/class-teachers', { params }),
  assignClassTeacher: (data) => api.post('/academics/class-teachers/assign', data),
  getClassTeacherResponsibilities: () => api.get('/academics/class-teachers/responsibilities'),
  getMyClass: () => api.get('/academics/class-teachers/my-class'),
  // Elective Management
  listElectiveGroups: (params) => api.get('/academics/elective-groups', { params }),
  createElectiveGroup: (data) => api.post('/academics/elective-groups', data),
  updateElectiveGroup: (id, data) => api.put(`/academics/elective-groups/${id}`, data),
  selectElective: (data) => api.post('/academics/student-electives', data),
};

// Attendance
export const attendanceAPI = {
  // My classes (class teacher / co-class teacher)
  getMyClasses: () => api.get('/attendance/my-classes'),

  // Student attendance
  getStudent: (params) => api.get('/attendance/students', { params }),
  markStudent: (data) => api.post('/attendance/students', data),
  studentReport: (params) => api.get('/attendance/students/report', { params }),
  getStudentDetail: (id, params) => api.get(`/attendance/students/${id}`, { params }),

  // Period-wise
  getPeriod: (params) => api.get('/attendance/period', { params }),
  markPeriod: (data) => api.post('/attendance/period', data),

  // Staff attendance
  getStaff: (params) => api.get('/attendance/staff', { params }),
  markStaff: (data) => api.post('/attendance/staff', data),
  staffReport: (params) => api.get('/attendance/staff/report', { params }),

  // Leave types
  getLeaveTypes: (params) => api.get('/attendance/leave-types', { params }),
  createLeaveType: (data) => api.post('/attendance/leave-types', data),
  updateLeaveType: (id, data) => api.put(`/attendance/leave-types/${id}`, data),
  deleteLeaveType: (id) => api.delete(`/attendance/leave-types/${id}`),

  // Leave applications
  getLeaves: (params) => api.get('/attendance/leaves', { params }),
  applyLeave: (data) => api.post('/attendance/leaves', data),
  getLeaveDetail: (id) => api.get(`/attendance/leaves/${id}`),
  approveRejectLeave: (id, data) => api.put(`/attendance/leaves/${id}/approve`, data),

  // Late arrivals
  getLateArrivals: (params) => api.get('/attendance/late-arrivals', { params }),
  recordLateArrival: (data) => api.post('/attendance/late-arrivals', data),

  // Rules
  getRules: () => api.get('/attendance/rules'),
  saveRules: (data) => api.post('/attendance/rules', data),

  // Devices
  getDevices: () => api.get('/attendance/devices'),
  addDevice: (data) => api.post('/attendance/devices', data),
  updateDevice: (id, data) => api.put(`/attendance/devices/${id}`, data),
  deleteDevice: (id) => api.delete(`/attendance/devices/${id}`),

  // Events
  getEvents: (params) => api.get('/attendance/events', { params }),
  markEvent: (data) => api.post('/attendance/events', data),

  // Analytics & Dashboard
  analytics: (params) => api.get('/attendance/analytics', { params }),
  alerts: (params) => api.get('/attendance/alerts', { params }),
  dashboard: () => api.get('/attendance/dashboard'),

  // Substitutions
  getAbsentTeachers: (params) => api.get('/attendance/substitutions/absent-teachers', { params }),
  getAvailableTeachers: (params) => api.get('/attendance/substitutions/available-teachers', { params }),
  getSubstitutions: (params) => api.get('/attendance/substitutions', { params }),
  createSubstitution: (data) => api.post('/attendance/substitutions', data),
  updateSubstitution: (id, data) => api.put(`/attendance/substitutions/${id}`, data),
  deleteSubstitution: (id) => api.delete(`/attendance/substitutions/${id}`),
};

// Fees / Finance
export const feesAPI = {
  // Dashboard
  dashboard: () => api.get('/fees/dashboard'),

  // Categories
  listCategories: () => api.get('/fees/categories'),
  createCategory: (data) => api.post('/fees/categories', data),

  // Structures
  listStructures: (params) => api.get('/fees/structures', { params }),
  createStructure: (data) => api.post('/fees/structures', data),
  updateStructure: (id, data) => api.put(`/fees/structures/${id}`, data),

  // Installments
  listInstallments: (params) => api.get('/fees/installments', { params }),
  generateInstallments: (data) => api.post('/fees/installments/generate', data),

  // Payments
  listPayments: (params) => api.get('/fees/payments', { params }),
  recordPayment: (data) => api.post('/fees/payments', data),

  // Defaulters
  getDefaulters: (params) => api.get('/fees/defaulters', { params }),

  // Pending (legacy)
  getPending: (params) => api.get('/fees/pending', { params }),

  // Receipts
  listReceipts: (params) => api.get('/fees/receipts', { params }),
  getReceipt: (id) => api.get(`/fees/receipts/${id}`),

  // Scholarships
  listScholarships: () => api.get('/fees/scholarships'),
  createScholarship: (data) => api.post('/fees/scholarships', data),
  awardScholarship: (id, data) => api.post(`/fees/scholarships/${id}/award`, data),
  listScholarshipAwards: (params) => api.get('/fees/scholarship-awards', { params }),
  updateScholarshipAward: (id, data) => api.put(`/fees/scholarship-awards/${id}`, data),

  // Concessions
  listConcessions: (params) => api.get('/fees/concessions', { params }),
  createConcession: (data) => api.post('/fees/concessions', data),
  approveConcession: (id, data) => api.put(`/fees/concessions/${id}/approve`, data),

  // Refunds
  listRefunds: (params) => api.get('/fees/refunds', { params }),
  createRefund: (data) => api.post('/fees/refunds', data),
  updateRefund: (id, data) => api.put(`/fees/refunds/${id}`, data),

  // Discounts
  listDiscounts: (params) => api.get('/fees/discounts', { params }),
  addDiscount: (data) => api.post('/fees/discounts', data),

  // Expenses
  listExpenses: (params) => api.get('/fees/expenses', { params }),
  createExpense: (data) => api.post('/fees/expenses', data),
  updateExpense: (id, data) => api.put(`/fees/expenses/${id}`, data),

  // Vendors
  listVendors: (params) => api.get('/fees/vendors', { params }),
  createVendor: (data) => api.post('/fees/vendors', data),
  updateVendor: (id, data) => api.put(`/fees/vendors/${id}`, data),

  // Purchase Orders
  listPurchaseOrders: (params) => api.get('/fees/purchase-orders', { params }),
  createPurchaseOrder: (data) => api.post('/fees/purchase-orders', data),
  updatePurchaseOrder: (id, data) => api.put(`/fees/purchase-orders/${id}`, data),

  // Budgets
  listBudgets: (params) => api.get('/fees/budgets', { params }),
  createBudget: (data) => api.post('/fees/budgets', data),
  updateBudget: (id, data) => api.put(`/fees/budgets/${id}`, data),

  // Accounting / Ledger
  listAccounting: (params) => api.get('/fees/accounting', { params }),
  createAccountingEntry: (data) => api.post('/fees/accounting', data),

  // Reports
  reportPnl: (params) => api.get('/fees/reports/pnl', { params }),
  reportBalanceSheet: (params) => api.get('/fees/reports/balance-sheet', { params }),

  // Cheque Tracking
  listCheques: (params) => api.get('/fees/cheque-tracking', { params }),
  updateCheque: (id, data) => api.put(`/fees/cheque-tracking/${id}`, data),

  // Bank Reconciliation
  listBankReconciliation: (params) => api.get('/fees/bank-reconciliation', { params }),
  createBankReconciliation: (data) => api.post('/fees/bank-reconciliation', data),
  matchBankEntry: (id, data) => api.put(`/fees/bank-reconciliation/${id}/match`, data),
};

// Communication
export const communicationAPI = {
  listAnnouncements: (params) => api.get('/communication/announcements', { params }),
  createAnnouncement: (data) => api.post('/communication/announcements', data),
  listNotifications: (params) => api.get('/communication/notifications', { params }),
  markRead: (id) => api.put(`/communication/notifications/${id}/read`),
  send: (data) => api.post('/communication/send', data),
  listTemplates: () => api.get('/communication/sms-templates'),
  createTemplate: (data) => api.post('/communication/sms-templates', data),
  // Alert Settings
  getAlertSettings: () => api.get('/communication/alert-settings'),
  saveAlertSetting: (data) => api.post('/communication/alert-settings', data),
  deleteAlertSetting: (id) => api.delete(`/communication/alert-settings/${id}`),
  // Alert Triggers
  triggerLateArrival: (data) => api.post('/communication/alerts/late-arrival', data),
  triggerMonthlyAttendance: (data) => api.post('/communication/alerts/monthly-attendance', data),
  triggerExamNotification: (data) => api.post('/communication/alerts/exam-notification', data),
  // Notification Logs
  getNotificationLogs: (params) => api.get('/communication/notification-logs', { params }),
  // WhatsApp & IVR
  sendWhatsApp: (data) => api.post('/communication/whatsapp/send', data),
  initiateCall: (data) => api.post('/communication/ivr/call', data),
  getApiConfig: () => api.get('/communication/api-config'),
};

// Parent Engagement
export const parentAPI = {
  // Dashboard
  getDashboard: () => api.get('/parent/dashboard'),

  // Profiles
  listProfiles: (params) => api.get('/parent/profiles', { params }),
  createProfile: (data) => api.post('/parent/profiles', data),
  getProfile: (id) => api.get(`/parent/profiles/${id}`),
  updateProfile: (id, data) => api.put(`/parent/profiles/${id}`, data),
  deleteProfile: (id) => api.delete(`/parent/profiles/${id}`),

  // PTM Slots
  listPTMSlots: (params) => api.get('/parent/ptm/slots', { params }),
  createPTMSlot: (data) => api.post('/parent/ptm/slots', data),
  updatePTMSlot: (id, data) => api.put(`/parent/ptm/slots/${id}`, data),
  deletePTMSlot: (id) => api.delete(`/parent/ptm/slots/${id}`),

  // PTM Bookings
  listPTMBookings: (params) => api.get('/parent/ptm/bookings', { params }),
  createPTMBooking: (data) => api.post('/parent/ptm/bookings', data),
  updatePTMBooking: (id, data) => api.put(`/parent/ptm/bookings/${id}`, data),

  // Surveys
  listSurveys: (params) => api.get('/parent/surveys', { params }),
  createSurvey: (data) => api.post('/parent/surveys', data),
  updateSurvey: (id, data) => api.put(`/parent/surveys/${id}`, data),
  deleteSurvey: (id) => api.delete(`/parent/surveys/${id}`),
  listSurveyResponses: (surveyId, params) => api.get(`/parent/surveys/${surveyId}/responses`, { params }),
  submitSurveyResponse: (surveyId, data) => api.post(`/parent/surveys/${surveyId}/responses`, data),

  // Grievances
  listGrievances: (params) => api.get('/parent/grievances', { params }),
  createGrievance: (data) => api.post('/parent/grievances', data),
  getGrievance: (id) => api.get(`/parent/grievances/${id}`),
  updateGrievance: (id, data) => api.put(`/parent/grievances/${id}`, data),

  // Consent Forms
  listConsentForms: (params) => api.get('/parent/consent', { params }),
  createConsentForm: (data) => api.post('/parent/consent', data),
  updateConsentForm: (id, data) => api.put(`/parent/consent/${id}`, data),
  deleteConsentForm: (id) => api.delete(`/parent/consent/${id}`),
  listConsentResponses: (formId, params) => api.get(`/parent/consent/${formId}/responses`, { params }),
  submitConsentResponse: (formId, data) => api.post(`/parent/consent/${formId}/responses`, data),

  // Messages
  listMessages: (params) => api.get('/parent/messages', { params }),
  sendMessage: (data) => api.post('/parent/messages', data),
  markMessageRead: (id) => api.put(`/parent/messages/${id}/read`),

  // Daily Activities
  listActivities: (params) => api.get('/parent/activities', { params }),
  createActivity: (data) => api.post('/parent/activities', data),
  deleteActivity: (id) => api.delete(`/parent/activities/${id}`),

  // Notifications
  listNotifications: (params) => api.get('/parent/notifications', { params }),
  sendNotification: (data) => api.post('/parent/notifications', data),
  markNotificationRead: (id) => api.put(`/parent/notifications/${id}/read`),

  // Volunteers
  listVolunteers: (params) => api.get('/parent/volunteers', { params }),
  registerVolunteer: (data) => api.post('/parent/volunteers', data),
  updateVolunteer: (id, data) => api.put(`/parent/volunteers/${id}`, data),

  // Pickup Authorization
  listPickupAuth: (params) => api.get('/parent/pickup', { params }),
  createPickupAuth: (data) => api.post('/parent/pickup', data),
  updatePickupAuth: (id, data) => api.put(`/parent/pickup/${id}`, data),
  deletePickupAuth: (id) => api.delete(`/parent/pickup/${id}`),

  // Child Overview (comprehensive)
  getChildOverview: (studentId) => api.get(`/parent/child/${studentId}`),
  listMyChildren: (params) => api.get('/parent/my-children', { params }),
};

// Reports
export const reportsAPI = {
  admission: (params) => api.get('/reports/admission', { params }),
  feeCollection: (params) => api.get('/reports/fee-collection', { params }),
  attendance: (params) => api.get('/reports/attendance', { params }),
  marketing: (params) => api.get('/reports/marketing', { params }),
  overview: () => api.get('/reports/overview'),
};

// Schools (Admin)
export const schoolsAPI = {
  list: (params) => api.get('/schools/', { params }),
  get: (id) => api.get(`/schools/${id}`),
  update: (id, data) => api.put(`/schools/${id}`, data),
  updateFeatures: (id, data) => api.put(`/schools/${id}/features`, data),
  getMySchool: () => api.get('/schools/my-school'),
  updateSettings: (data) => api.put('/schools/my-school/settings', data),
};

// Inventory & Asset Management
export const inventoryAPI = {
  // Dashboard
  getDashboard: () => api.get('/inventory/dashboard'),
  // Asset Categories
  listAssetCategories: () => api.get('/inventory/asset-categories'),
  createAssetCategory: (data) => api.post('/inventory/asset-categories', data),
  // Assets
  listAssets: (params) => api.get('/inventory/assets', { params }),
  createAsset: (data) => api.post('/inventory/assets', data),
  getAsset: (id) => api.get(`/inventory/assets/${id}`),
  updateAsset: (id, data) => api.put(`/inventory/assets/${id}`, data),
  deleteAsset: (id) => api.delete(`/inventory/assets/${id}`),
  // Asset Maintenance
  listMaintenance: (params) => api.get('/inventory/maintenance', { params }),
  createMaintenance: (data) => api.post('/inventory/maintenance', data),
  updateMaintenance: (id, data) => api.put(`/inventory/maintenance/${id}`, data),
  // Inventory Categories
  listCategories: () => api.get('/inventory/categories'),
  createCategory: (data) => api.post('/inventory/categories', data),
  // Inventory Items
  listItems: (params) => api.get('/inventory/items', { params }),
  createItem: (data) => api.post('/inventory/items', data),
  updateItem: (id, data) => api.put(`/inventory/items/${id}`, data),
  // Transactions
  listTransactions: (params) => api.get('/inventory/transactions', { params }),
  addTransaction: (data) => api.post('/inventory/transactions', data),
  // Purchase Requests
  listPurchaseRequests: (params) => api.get('/inventory/purchase-requests', { params }),
  createPurchaseRequest: (data) => api.post('/inventory/purchase-requests', data),
  updatePurchaseRequest: (id, data) => api.put(`/inventory/purchase-requests/${id}`, data),
  // Purchase Orders
  listPurchaseOrders: (params) => api.get('/inventory/purchase-orders', { params }),
  createPurchaseOrder: (data) => api.post('/inventory/purchase-orders', data),
  updatePurchaseOrder: (id, data) => api.put(`/inventory/purchase-orders/${id}`, data),
  // Vendor Quotations
  listQuotations: (params) => api.get('/inventory/quotations', { params }),
  createQuotation: (data) => api.post('/inventory/quotations', data),
  updateQuotation: (id, data) => api.put(`/inventory/quotations/${id}`, data),
  // Asset Disposals
  listDisposals: (params) => api.get('/inventory/disposals', { params }),
  createDisposal: (data) => api.post('/inventory/disposals', data),
  updateDisposal: (id, data) => api.put(`/inventory/disposals/${id}`, data),
};

// Transport
export const transportAPI = {
  // Dashboard
  getDashboard: () => api.get('/transport/dashboard'),
  // Vehicles
  listVehicles: (params) => api.get('/transport/vehicles', { params }),
  createVehicle: (data) => api.post('/transport/vehicles', data),
  getVehicle: (id) => api.get(`/transport/vehicles/${id}`),
  updateVehicle: (id, data) => api.put(`/transport/vehicles/${id}`, data),
  deleteVehicle: (id) => api.delete(`/transport/vehicles/${id}`),
  // Drivers
  listDrivers: (params) => api.get('/transport/drivers', { params }),
  createDriver: (data) => api.post('/transport/drivers', data),
  getDriver: (id) => api.get(`/transport/drivers/${id}`),
  updateDriver: (id, data) => api.put(`/transport/drivers/${id}`, data),
  deleteDriver: (id) => api.delete(`/transport/drivers/${id}`),
  // Routes
  listRoutes: (params) => api.get('/transport/routes', { params }),
  createRoute: (data) => api.post('/transport/routes', data),
  getRoute: (id) => api.get(`/transport/routes/${id}`),
  updateRoute: (id, data) => api.put(`/transport/routes/${id}`, data),
  deleteRoute: (id) => api.delete(`/transport/routes/${id}`),
  // Stops
  listStops: (routeId) => api.get(`/transport/routes/${routeId}/stops`),
  addStop: (routeId, data) => api.post(`/transport/routes/${routeId}/stops`, data),
  updateStop: (id, data) => api.put(`/transport/stops/${id}`, data),
  deleteStop: (id) => api.delete(`/transport/stops/${id}`),
  // Student Transport
  listStudents: (params) => api.get('/transport/students', { params }),
  assign: (data) => api.post('/transport/assign', data),
  updateAssignment: (id, data) => api.put(`/transport/assign/${id}`, data),
  // GPS
  listGPS: (params) => api.get('/transport/gps', { params }),
  logGPS: (data) => api.post('/transport/gps', data),
  latestGPS: () => api.get('/transport/gps/latest'),
  // Maintenance
  listMaintenance: (params) => api.get('/transport/maintenance', { params }),
  createMaintenance: (data) => api.post('/transport/maintenance', data),
  updateMaintenance: (id, data) => api.put(`/transport/maintenance/${id}`, data),
  // Fuel Logs
  listFuelLogs: (params) => api.get('/transport/fuel-logs', { params }),
  createFuelLog: (data) => api.post('/transport/fuel-logs', data),
  updateFuelLog: (id, data) => api.put(`/transport/fuel-logs/${id}`, data),
  // Transport Fees
  listFees: (params) => api.get('/transport/fees', { params }),
  createFee: (data) => api.post('/transport/fees', data),
  updateFee: (id, data) => api.put(`/transport/fees/${id}`, data),
  // SOS Alerts
  listSOSAlerts: (params) => api.get('/transport/sos-alerts', { params }),
  createSOSAlert: (data) => api.post('/transport/sos-alerts', data),
  updateSOSAlert: (id, data) => api.put(`/transport/sos-alerts/${id}`, data),
  // Trips
  listTrips: (params) => api.get('/transport/trips', { params }),
  createTrip: (data) => api.post('/transport/trips', data),
  updateTrip: (id, data) => api.put(`/transport/trips/${id}`, data),
  // Route Change Requests
  listRouteRequests: (params) => api.get('/transport/route-requests', { params }),
  createRouteRequest: (data) => api.post('/transport/route-requests', data),
  updateRouteRequest: (id, data) => api.put(`/transport/route-requests/${id}`, data),
  // Speed Alerts
  listSpeedAlerts: (params) => api.get('/transport/speed-alerts', { params }),
  createSpeedAlert: (data) => api.post('/transport/speed-alerts', data),
  acknowledgeSpeedAlert: (id) => api.put(`/transport/speed-alerts/${id}`, { acknowledged: true }),
};

// Library
export const libraryAPI = {
  // Dashboard
  getDashboard: () => api.get('/library/dashboard'),
  // Categories
  listCategories: () => api.get('/library/categories'),
  createCategory: (data) => api.post('/library/categories', data),
  updateCategory: (id, data) => api.put(`/library/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/library/categories/${id}`),
  // Books
  listBooks: (params) => api.get('/library/books', { params }),
  createBook: (data) => api.post('/library/books', data),
  updateBook: (id, data) => api.put(`/library/books/${id}`, data),
  deleteBook: (id) => api.delete(`/library/books/${id}`),
  // Copies
  listCopies: (params) => api.get('/library/copies', { params }),
  createCopy: (data) => api.post('/library/copies', data),
  updateCopy: (id, data) => api.put(`/library/copies/${id}`, data),
  deleteCopy: (id) => api.delete(`/library/copies/${id}`),
  // Issues
  listIssues: (params) => api.get('/library/issues', { params }),
  issueBook: (data) => api.post('/library/issue', data),
  returnBook: (id) => api.put(`/library/return/${id}`),
  // Reservations
  listReservations: (params) => api.get('/library/reservations', { params }),
  createReservation: (data) => api.post('/library/reservations', data),
  updateReservation: (id, data) => api.put(`/library/reservations/${id}`, data),
  deleteReservation: (id) => api.delete(`/library/reservations/${id}`),
  // Fines
  listFines: (params) => api.get('/library/fines', { params }),
  createFine: (data) => api.post('/library/fines', data),
  updateFine: (id, data) => api.put(`/library/fines/${id}`, data),
  // E-Resources
  listEbooks: (params) => api.get('/library/ebooks', { params }),
  createEbook: (data) => api.post('/library/ebooks', data),
  updateEbook: (id, data) => api.put(`/library/ebooks/${id}`, data),
  deleteEbook: (id) => api.delete(`/library/ebooks/${id}`),
  // Periodicals
  listPeriodicals: (params) => api.get('/library/periodicals', { params }),
  createPeriodical: (data) => api.post('/library/periodicals', data),
  updatePeriodical: (id, data) => api.put(`/library/periodicals/${id}`, data),
  deletePeriodical: (id) => api.delete(`/library/periodicals/${id}`),
  // Reading History
  listReadingHistory: (params) => api.get('/library/reading-history', { params }),
  createReadingHistory: (data) => api.post('/library/reading-history', data),
  updateReadingHistory: (id, data) => api.put(`/library/reading-history/${id}`, data),
  deleteReadingHistory: (id) => api.delete(`/library/reading-history/${id}`),
  // Budget
  listBudget: (params) => api.get('/library/budget', { params }),
  createBudget: (data) => api.post('/library/budget', data),
  updateBudget: (id, data) => api.put(`/library/budget/${id}`, data),
  deleteBudget: (id) => api.delete(`/library/budget/${id}`),
  // ISBN Lookup
  isbnLookup: (isbn) => api.get(`/library/isbn-lookup/${isbn}`),
  // Bulk Import
  bulkImportBooks: (data) => api.post('/library/books/bulk-import', data),
};

// Health & Safety
export const healthAPI = {
  // Dashboard
  getDashboard: () => api.get('/health/dashboard'),
  // Health Records
  listRecords: (params) => api.get('/health/records', { params }),
  createRecord: (data) => api.post('/health/records', data),
  updateRecord: (id, data) => api.put(`/health/records/${id}`, data),
  deleteRecord: (id) => api.delete(`/health/records/${id}`),
  // Infirmary
  listInfirmary: (params) => api.get('/health/infirmary', { params }),
  createInfirmary: (data) => api.post('/health/infirmary', data),
  updateInfirmary: (id, data) => api.put(`/health/infirmary/${id}`, data),
  // Incidents
  listIncidents: (params) => api.get('/health/incidents', { params }),
  createIncident: (data) => api.post('/health/incidents', data),
  updateIncident: (id, data) => api.put(`/health/incidents/${id}`, data),
  // Health Checkups
  listCheckups: (params) => api.get('/health/checkups', { params }),
  createCheckup: (data) => api.post('/health/checkups', data),
  updateCheckup: (id, data) => api.put(`/health/checkups/${id}`, data),
  // Visitors
  listVisitors: (params) => api.get('/health/visitors', { params }),
  createVisitor: (data) => api.post('/health/visitors', data),
  updateVisitor: (id, data) => api.put(`/health/visitors/${id}`, data),
  checkoutVisitor: (id) => api.post(`/health/visitors/${id}/checkout`),
  // Safety Drills
  listDrills: (params) => api.get('/health/drills', { params }),
  createDrill: (data) => api.post('/health/drills', data),
  updateDrill: (id, data) => api.put(`/health/drills/${id}`, data),
  // Medications
  listMedications: (params) => api.get('/health/medications', { params }),
  createMedication: (data) => api.post('/health/medications', data),
  updateMedication: (id, data) => api.put(`/health/medications/${id}`, data),
  // Emergency Contacts
  listEmergency: (params) => api.get('/health/emergency-contacts', { params }),
  createEmergency: (data) => api.post('/health/emergency-contacts', data),
  updateEmergency: (id, data) => api.put(`/health/emergency-contacts/${id}`, data),
  deleteEmergency: (id) => api.delete(`/health/emergency-contacts/${id}`),
  // Wellbeing
  listWellbeing: (params) => api.get('/health/wellbeing', { params }),
  createWellbeing: (data) => api.post('/health/wellbeing', data),
  updateWellbeing: (id, data) => api.put(`/health/wellbeing/${id}`, data),
  // Sanitization
  listSanitization: (params) => api.get('/health/sanitization', { params }),
  createSanitization: (data) => api.post('/health/sanitization', data),
  updateSanitization: (id, data) => api.put(`/health/sanitization/${id}`, data),
  // Temperature
  listTemperature: (params) => api.get('/health/temperature', { params }),
  createTemperature: (data) => api.post('/health/temperature', data),
};

export const hostelAPI = {
  getDashboard: () => api.get('/hostel/dashboard'),
  // Blocks
  listBlocks: (params) => api.get('/hostel/blocks', { params }),
  createBlock: (data) => api.post('/hostel/blocks', data),
  updateBlock: (id, data) => api.put(`/hostel/blocks/${id}`, data),
  deleteBlock: (id) => api.delete(`/hostel/blocks/${id}`),
  // Rooms
  listRooms: (params) => api.get('/hostel/rooms', { params }),
  createRoom: (data) => api.post('/hostel/rooms', data),
  updateRoom: (id, data) => api.put(`/hostel/rooms/${id}`, data),
  deleteRoom: (id) => api.delete(`/hostel/rooms/${id}`),
  // Allocations
  listAllocations: (params) => api.get('/hostel/allocations', { params }),
  createAllocation: (data) => api.post('/hostel/allocations', data),
  updateAllocation: (id, data) => api.put(`/hostel/allocations/${id}`, data),
  deleteAllocation: (id) => api.delete(`/hostel/allocations/${id}`),
  // Mess Menu
  listMessMenu: (params) => api.get('/hostel/mess-menu', { params }),
  createMessMenu: (data) => api.post('/hostel/mess-menu', data),
  updateMessMenu: (id, data) => api.put(`/hostel/mess-menu/${id}`, data),
  deleteMessMenu: (id) => api.delete(`/hostel/mess-menu/${id}`),
  // Mess Attendance
  listMessAttendance: (params) => api.get('/hostel/mess-attendance', { params }),
  createMessAttendance: (data) => api.post('/hostel/mess-attendance', data),
  updateMessAttendance: (id, data) => api.put(`/hostel/mess-attendance/${id}`, data),
  // Outpass
  listOutpass: (params) => api.get('/hostel/outpass', { params }),
  createOutpass: (data) => api.post('/hostel/outpass', data),
  updateOutpass: (id, data) => api.put(`/hostel/outpass/${id}`, data),
  deleteOutpass: (id) => api.delete(`/hostel/outpass/${id}`),
  // Visitors
  listVisitors: (params) => api.get('/hostel/visitors', { params }),
  createVisitor: (data) => api.post('/hostel/visitors', data),
  updateVisitor: (id, data) => api.put(`/hostel/visitors/${id}`, data),
  deleteVisitor: (id) => api.delete(`/hostel/visitors/${id}`),
  // Complaints
  listComplaints: (params) => api.get('/hostel/complaints', { params }),
  createComplaint: (data) => api.post('/hostel/complaints', data),
  updateComplaint: (id, data) => api.put(`/hostel/complaints/${id}`, data),
  deleteComplaint: (id) => api.delete(`/hostel/complaints/${id}`),
  // Inspections
  listInspections: (params) => api.get('/hostel/inspections', { params }),
  createInspection: (data) => api.post('/hostel/inspections', data),
  updateInspection: (id, data) => api.put(`/hostel/inspections/${id}`, data),
  deleteInspection: (id) => api.delete(`/hostel/inspections/${id}`),
};

// ==================== CANTEEN API ====================
export const canteenAPI = {
  getDashboard: () => api.get('/canteen/dashboard'),
  // Menu
  listMenu: (params) => api.get('/canteen/menu', { params }),
  createMenuItem: (data) => api.post('/canteen/menu', data),
  updateMenuItem: (id, data) => api.put(`/canteen/menu/${id}`, data),
  deleteMenuItem: (id) => api.delete(`/canteen/menu/${id}`),
  // Wallets
  listWallets: (params) => api.get('/canteen/wallets', { params }),
  createWallet: (data) => api.post('/canteen/wallets', data),
  updateWallet: (id, data) => api.put(`/canteen/wallets/${id}`, data),
  topupWallet: (id, data) => api.post(`/canteen/wallets/${id}/topup`, data),
  // Transactions
  listTransactions: (params) => api.get('/canteen/transactions', { params }),
  createTransaction: (data) => api.post('/canteen/transactions', data),
  // Inventory
  listInventory: (params) => api.get('/canteen/inventory', { params }),
  createInventory: (data) => api.post('/canteen/inventory', data),
  updateInventory: (id, data) => api.put(`/canteen/inventory/${id}`, data),
  deleteInventory: (id) => api.delete(`/canteen/inventory/${id}`),
  // Vendors
  listVendors: (params) => api.get('/canteen/vendors', { params }),
  createVendor: (data) => api.post('/canteen/vendors', data),
  updateVendor: (id, data) => api.put(`/canteen/vendors/${id}`, data),
  deleteVendor: (id) => api.delete(`/canteen/vendors/${id}`),
  // Preorders
  listPreorders: (params) => api.get('/canteen/preorders', { params }),
  createPreorder: (data) => api.post('/canteen/preorders', data),
  updatePreorder: (id, data) => api.put(`/canteen/preorders/${id}`, data),
  deletePreorder: (id) => api.delete(`/canteen/preorders/${id}`),
};

// ==================== SPORTS API ====================
export const sportsAPI = {
  getDashboard: () => api.get('/sports/dashboard'),
  // Sports
  listSports: (params) => api.get('/sports/sports', { params }),
  createSport: (data) => api.post('/sports/sports', data),
  updateSport: (id, data) => api.put(`/sports/sports/${id}`, data),
  deleteSport: (id) => api.delete(`/sports/sports/${id}`),
  // Teams
  listTeams: (params) => api.get('/sports/teams', { params }),
  createTeam: (data) => api.post('/sports/teams', data),
  updateTeam: (id, data) => api.put(`/sports/teams/${id}`, data),
  deleteTeam: (id) => api.delete(`/sports/teams/${id}`),
  // Tournaments
  listTournaments: (params) => api.get('/sports/tournaments', { params }),
  createTournament: (data) => api.post('/sports/tournaments', data),
  updateTournament: (id, data) => api.put(`/sports/tournaments/${id}`, data),
  deleteTournament: (id) => api.delete(`/sports/tournaments/${id}`),
  // Matches
  listMatches: (params) => api.get('/sports/matches', { params }),
  createMatch: (data) => api.post('/sports/matches', data),
  updateMatch: (id, data) => api.put(`/sports/matches/${id}`, data),
  deleteMatch: (id) => api.delete(`/sports/matches/${id}`),
  // Clubs
  listClubs: (params) => api.get('/sports/clubs', { params }),
  createClub: (data) => api.post('/sports/clubs', data),
  updateClub: (id, data) => api.put(`/sports/clubs/${id}`, data),
  deleteClub: (id) => api.delete(`/sports/clubs/${id}`),
  // Club Members
  listClubMembers: (params) => api.get('/sports/club-members', { params }),
  addClubMember: (data) => api.post('/sports/club-members', data),
  updateClubMember: (id, data) => api.put(`/sports/club-members/${id}`, data),
  removeClubMember: (id) => api.delete(`/sports/club-members/${id}`),
  // Events
  listEvents: (params) => api.get('/sports/events', { params }),
  createEvent: (data) => api.post('/sports/events', data),
  updateEvent: (id, data) => api.put(`/sports/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/sports/events/${id}`),
  // Bookings
  listBookings: (params) => api.get('/sports/bookings', { params }),
  createBooking: (data) => api.post('/sports/bookings', data),
  updateBooking: (id, data) => api.put(`/sports/bookings/${id}`, data),
  deleteBooking: (id) => api.delete(`/sports/bookings/${id}`),
  // Fitness
  listFitness: (params) => api.get('/sports/fitness', { params }),
  createFitness: (data) => api.post('/sports/fitness', data),
  updateFitness: (id, data) => api.put(`/sports/fitness/${id}`, data),
  deleteFitness: (id) => api.delete(`/sports/fitness/${id}`),
  // Certificates
  listCertificates: (params) => api.get('/sports/certificates', { params }),
  createCertificate: (data) => api.post('/sports/certificates', data),
  updateCertificate: (id, data) => api.put(`/sports/certificates/${id}`, data),
  deleteCertificate: (id) => api.delete(`/sports/certificates/${id}`),
};

// ---- Data Import / Migration API ----
export const importsAPI = {
  // Templates
  listTemplates: () => api.get('/imports/templates'),
  downloadTemplate: (key) => api.get(`/imports/templates/${key}/download`, { responseType: 'blob' }),
  getTemplatePassword: () => api.get('/imports/template-password'),

  // Validate (preview before import)
  validateImport: (type, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/imports/validate/${type}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  // Execute import
  executeImport: (type, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/imports/execute/${type}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  // Stats
  getImportStats: () => api.get('/imports/stats'),
};

// Schools - branding
export const brandingAPI = {
  updateBranding: (data) => api.put('/schools/my-school/branding', data),
  uploadImage: (formData) => api.post('/schools/my-school/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getPublicSchool: (code) => api.get(`/schools/public/${code}`),
};

// Super Admin
export const superAdminAPI = {
  dashboard: () => api.get('/superadmin/dashboard'),
  // Schools
  listSchools: (params) => api.get('/superadmin/schools', { params }),
  getSchool: (id) => api.get(`/superadmin/schools/${id}`),
  createSchool: (data) => api.post('/superadmin/schools', data),
  updateSchool: (id, data) => api.put(`/superadmin/schools/${id}`, data),
  toggleSchool: (id) => api.post(`/superadmin/schools/${id}/toggle`),
  updateFeatures: (id, data) => api.put(`/superadmin/schools/${id}/features`, data),
  // Plans
  listPlans: () => api.get('/superadmin/plans'),
  createPlan: (data) => api.post('/superadmin/plans', data),
  updatePlan: (id, data) => api.put(`/superadmin/plans/${id}`, data),
  deletePlan: (id) => api.delete(`/superadmin/plans/${id}`),
  // Subscriptions
  listSubscriptions: (params) => api.get('/superadmin/subscriptions', { params }),
  createSubscription: (data) => api.post('/superadmin/subscriptions', data),
  updateSubscription: (id, data) => api.put(`/superadmin/subscriptions/${id}`, data),
  // Users
  listUsers: (params) => api.get('/superadmin/users', { params }),
  createUser: (data) => api.post('/superadmin/users', data),
  toggleUser: (id) => api.post(`/superadmin/users/${id}/toggle`),
  resetUserPassword: (id, password) => api.put(`/superadmin/users/${id}/reset-password`, { password }),
  // System Settings
  getSystemSettings: () => api.get('/superadmin/system-settings'),
  saveSystemSettings: (data) => api.put('/superadmin/system-settings', data),
  // Audit Logs
  getAuditLogs: (params) => api.get('/superadmin/audit-logs', { params }),
  // Public
  publicPlans: () => api.get('/superadmin/public/plans'),
};

// Payment Gateway API
export const paymentAPI = {
  // Gateway config (public keys only)
  getGatewayConfig: () => api.get('/payments/gateway-config'),

  // Razorpay
  createRazorpayOrder: (data) => api.post('/payments/razorpay/create-order', data),
  verifyRazorpayPayment: (data) => api.post('/payments/razorpay/verify', data),

  // Paytm
  initiatePaytm: (data) => api.post('/payments/paytm/initiate', data),
  verifyPaytm: (data) => api.post('/payments/paytm/verify', data),

  // Payment status
  checkStatus: (paymentId) => api.get(`/payments/status/${paymentId}`),

  // Payment gateway settings (admin)
  getSettings: () => api.get('/payments/settings'),
  saveSettings: (data) => api.post('/payments/settings', data),
};
