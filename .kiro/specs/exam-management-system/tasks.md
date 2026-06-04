# Tasks: Exam Management System

## Task 1: Database Models - New Tables

### 1.1 Create ExamDateSheet model
- [ ] Add `ExamDateSheet` model to `backend/app/models/academic.py` with fields: id, school_id, exam_id, status (draft/pending_approval/approved/rejected), approved_by, approved_at, rejection_remarks, created_by, created_at, updated_at
- [ ] Add relationship to Exam model
- [ ] Add `to_dict()` method

### 1.2 Create QuestionPaper model
- [ ] Add `QuestionPaper` model with fields: id, school_id, exam_id, class_id, subject_id, uploaded_by, file_path, file_size, set_name, max_marks, duration_minutes, instructions, status (submitted/hod_approved/collected/final_approved/rejected), reviewed_by, reviewed_at, review_remarks, created_at, updated_at
- [ ] Add relationships to Exam, Class, Subject, Staff
- [ ] Add `to_dict()` method

### 1.3 Create MarksEntryDeadline model
- [ ] Add `MarksEntryDeadline` model with fields: id, school_id, exam_id, class_id, subject_id, deadline_date, auto_lock, is_locked, locked_at, created_by, created_at
- [ ] Add relationships and `to_dict()` method

### 1.4 Create GraceMarks model
- [ ] Add `GraceMarks` model with fields: id, school_id, exam_id, class_id, subject_id, student_id, marks_value, reason, applied_by, applied_at, level (class/subject/individual)
- [ ] Add relationships and `to_dict()` method

### 1.5 Create ReExam and ReExamStudent models
- [ ] Add `ReExam` model with fields: id, school_id, original_exam_id, original_schedule_id, re_exam_type (compartment/supplementary/improvement/rescheduled), new_exam_date, start_time, end_time, class_id, subject_id, status, reason, created_by, created_at
- [ ] Add `ReExamStudent` model with fields: id, re_exam_id, student_id, original_marks, re_exam_marks, final_marks, status (eligible/appeared/absent/result_updated)
- [ ] Add relationships and `to_dict()` methods

### 1.6 Create ExamNotification model
- [ ] Add `ExamNotification` model with fields: id, school_id, exam_id, recipient_user_id, type, title, message, is_read, delivery_channel, delivery_status, sent_at, created_at
- [ ] Add relationships and `to_dict()` method

### 1.7 Create ExamGrievance model
- [ ] Add `ExamGrievance` model with fields: id, school_id, student_id, exam_schedule_id, raised_by, reason, status (pending/under_review/resolved/rejected), assigned_to, resolution_remarks, original_marks, corrected_marks, resolved_by, resolved_at, created_at
- [ ] Add relationships and `to_dict()` method

### 1.8 Create ExamAttendance model
- [ ] Add `ExamAttendance` model with fields: id, school_id, exam_schedule_id, student_id, hall_id, status (present/absent), marked_by, marked_at, is_late_entry
- [ ] Add relationships and `to_dict()` method

### 1.9 Create SpecialArrangement model
- [ ] Add `SpecialArrangement` model with fields: id, school_id, exam_schedule_id, student_id, arrangement_type (extra_time/separate_room/scribe/other), extra_time_minutes, separate_hall_id, medical_certificate_path, reason, approved_by, created_at
- [ ] Add relationships and `to_dict()` method

### 1.10 Create MarksVerification model
- [ ] Add `MarksVerification` model with fields: id, school_id, exam_schedule_id, student_id, entered_marks, verified_marks, discrepancy_status (match/mismatch/pending), verified_by, verified_at, created_at
- [ ] Add relationships and `to_dict()` method

### 1.11 Modify existing models
- [ ] Add `shift` field (Enum: morning/afternoon) to ExamSchedule model
- [ ] Add `date_sheet_id` foreign key to ExamSchedule model
- [ ] Add `paper_leak` to ExamIncident type enum
- [ ] Add `status` field (reported/investigating/resolved) to ExamIncident model
- [ ] Run database migration script to create all new tables and alter existing ones

## Task 2: Backend Services - Core Business Logic

### 2.1 Create Exam Service (exam_service.py)
- [ ] Create `backend/app/services/exam_service.py`
- [ ] Implement `create_exam(data, user)` - validate dates, create exam record
- [ ] Implement `update_exam(exam_id, data, user)` - validate status-based edit restrictions
- [ ] Implement `delete_exam(exam_id, user)` - validate no dependent records
- [ ] Implement `get_exams(filters, user)` - role-based filtering
- [ ] Implement `submit_date_sheet_for_approval(exam_id, user)` - status transition
- [ ] Implement `approve_date_sheet(exam_id, user, remarks)` - Principal approval
- [ ] Implement `reject_date_sheet(exam_id, user, remarks)` - Principal rejection

### 2.2 Create Result Service (result_service.py)
- [ ] Create `backend/app/services/result_service.py`
- [ ] Implement `process_results(exam_id)` - calculate totals, percentages, grades for all students
- [ ] Implement `calculate_ranks(exam_id)` - section-wise, class-wise ranking
- [ ] Implement `determine_pass_fail(student_results)` - pass/compartment/detained logic
- [ ] Implement `apply_grace_marks(exam_id, data, user)` - apply and recalculate
- [ ] Implement `generate_subject_analysis(exam_id, class_id)` - avg, highest, lowest, pass %
- [ ] Implement `generate_class_comparison(exam_id)` - cross-class performance
- [ ] Implement `generate_topper_list(exam_id, class_id)` - top 3 per section/class

### 2.3 Create Seating Service (seating_service.py)
- [ ] Create `backend/app/services/seating_service.py`
- [ ] Implement `generate_seating(exam_schedule_id, mode, halls)` - main entry point
- [ ] Implement `_roll_number_order(students, halls)` - sequential assignment
- [ ] Implement `_random_order(students, halls)` - shuffled assignment
- [ ] Implement `_mixed_order(students_by_class, halls)` - interleaved classes
- [ ] Implement `validate_capacity(students_count, halls)` - check sufficient seats
- [ ] Implement `regenerate_seating(exam_schedule_id, mode)` - clear and regenerate

### 2.4 Create Notification Service (notification_service.py)
- [ ] Create `backend/app/services/notification_service.py`
- [ ] Implement `send_notification(recipient_id, type, title, message, channel)` - create and dispatch
- [ ] Implement `send_bulk_notifications(recipient_ids, type, title, message)` - batch send
- [ ] Implement `send_date_sheet_approved_notification(exam_id)` - notify teachers, students, parents
- [ ] Implement `send_paper_reminder(exam_id)` - remind teachers with pending papers
- [ ] Implement `send_marks_reminder(exam_id)` - remind teachers with pending marks
- [ ] Implement `send_marks_escalation(exam_id)` - escalate to Principal
- [ ] Implement `send_result_published_notification(exam_id)` - notify parents
- [ ] Implement `send_duty_notification(staff_id, schedule_id)` - notify invigilator
- [ ] Implement `send_re_exam_notification(re_exam_id)` - notify eligible students

### 2.5 Create PDF Service (pdf_service.py)
- [ ] Create `backend/app/services/pdf_service.py`
- [ ] Implement `generate_date_sheet_pdf(exam_id, class_id)` - tabular date sheet
- [ ] Implement `generate_seating_chart_pdf(exam_schedule_id, hall_id)` - grid layout
- [ ] Implement `generate_duty_chart_pdf(exam_id)` - duty assignments by date
- [ ] Implement `generate_admit_card_pdf(admit_card_id)` - individual admit card
- [ ] Implement `generate_bulk_admit_cards_pdf(exam_id, class_id)` - combined PDF
- [ ] Implement `generate_report_card_pdf(report_card_id)` - individual report card
- [ ] Implement `generate_bulk_report_cards_pdf(exam_id, class_id)` - combined PDF
- [ ] Implement `generate_marks_sheet_pdf(exam_id, class_id)` - consolidated marks sheet

## Task 3: Backend Routes - Exam CRUD & Date Sheet

### 3.1 Create exam routes file
- [ ] Create `backend/app/routes/exams.py` with Blueprint registration
- [ ] Implement `POST /api/exams` - create exam (Exam Controller only)
- [ ] Implement `GET /api/exams` - list exams with filters (type, status, academic_year, class)
- [ ] Implement `GET /api/exams/<id>` - get exam details with schedules
- [ ] Implement `PUT /api/exams/<id>` - update exam (status-based restrictions)
- [ ] Implement `DELETE /api/exams/<id>` - delete exam (no dependents check)

### 3.2 Date sheet routes
- [ ] Implement `POST /api/exams/<id>/schedules` - add schedule entries (subject, date, time, marks)
- [ ] Implement `GET /api/exams/<id>/date-sheet` - get date sheet (role-based visibility)
- [ ] Implement `POST /api/exams/<id>/date-sheet/submit-approval` - submit for Principal approval
- [ ] Implement `POST /api/exams/<id>/date-sheet/approve` - Principal approves
- [ ] Implement `POST /api/exams/<id>/date-sheet/reject` - Principal rejects with remarks
- [ ] Implement `GET /api/exams/<id>/date-sheet/pdf` - download date sheet PDF
- [ ] Add validation: no duplicate subject on same date/time for same class
- [ ] Add validation: exam dates within exam start_date and end_date

## Task 4: Backend Routes - Question Paper Management

### 4.1 Question paper routes
- [ ] Implement `POST /api/exams/<id>/question-papers` - upload paper (Teacher, PDF only, max 5MB)
- [ ] Implement `GET /api/exams/<id>/question-papers` - list papers with status (Exam Controller, HOD)
- [ ] Implement `GET /api/question-papers/<id>` - get paper details (restricted access)
- [ ] Implement `GET /api/question-papers/<id>/download` - download paper file (restricted access)
- [ ] Implement `POST /api/question-papers/<id>/approve` - HOD approves
- [ ] Implement `POST /api/question-papers/<id>/reject` - HOD/Principal rejects with remarks
- [ ] Implement `POST /api/question-papers/<id>/collect` - Exam Controller marks collected
- [ ] Implement `GET /api/exams/<id>/question-papers/status` - submission status dashboard
- [ ] Add file validation (PDF format, 5MB limit)
- [ ] Add role validation (teacher must be assigned to subject/class)

## Task 5: Backend Routes - Hall, Seating & Invigilator

### 5.1 Seating arrangement routes
- [ ] Implement `POST /api/exam-schedules/<id>/seating/generate` - generate seating (mode: roll_number/random/mixed)
- [ ] Implement `GET /api/exam-schedules/<id>/seating` - get seating chart
- [ ] Implement `GET /api/exam-schedules/<id>/seating/pdf` - download seating chart PDF
- [ ] Implement `POST /api/exam-schedules/<id>/seating/regenerate` - clear and regenerate
- [ ] Add capacity validation before generation

### 5.2 Invigilator routes
- [ ] Implement `POST /api/exam-schedules/<id>/invigilators` - assign invigilator
- [ ] Implement `GET /api/exams/<id>/invigilators/duty-chart` - full duty chart
- [ ] Implement `GET /api/staff/me/invigilator-duties` - teacher's own duties
- [ ] Implement `PUT /api/exam-invigilators/<id>/swap` - swap duty to another teacher
- [ ] Implement `GET /api/exams/<id>/invigilators/duty-chart/pdf` - download duty chart PDF
- [ ] Add validation: subject teacher cannot invigilate own subject
- [ ] Add validation: teacher not double-booked for same time slot
- [ ] Add validation: at least one chief invigilator per hall

## Task 6: Backend Routes - Admit Cards

### 6.1 Admit card routes
- [ ] Implement `POST /api/exams/<id>/admit-cards/generate` - bulk generate for class
- [ ] Implement `GET /api/exams/<id>/admit-cards` - list admit cards with filters
- [ ] Implement `GET /api/admit-cards/<id>/pdf` - download individual admit card PDF
- [ ] Implement `GET /api/exams/<id>/admit-cards/bulk-pdf` - download bulk PDF for class
- [ ] Implement `PUT /api/admit-cards/<id>/revoke` - revoke admit card
- [ ] Implement `GET /api/students/me/admit-cards` - student's own admit cards
- [ ] Handle partial admit cards (when seating not yet assigned)

## Task 7: Backend Routes - Exam Day Operations

### 7.1 Attendance routes
- [ ] Implement `POST /api/exam-schedules/<id>/attendance` - mark attendance (bulk: list of student_id + status)
- [ ] Implement `GET /api/exam-schedules/<id>/attendance` - get attendance for schedule
- [ ] Implement `GET /api/exams/<id>/attendance/report` - consolidated attendance report
- [ ] Add late entry flag if submitted after exam end_time + 60 minutes
- [ ] Auto-set is_absent on ExamResult when student marked absent

### 7.2 Incident routes
- [ ] Implement `POST /api/exam-schedules/<id>/incidents` - report incident
- [ ] Implement `GET /api/exams/<id>/incidents` - list incidents with filters (type, severity, date)
- [ ] Implement `PUT /api/incidents/<id>` - update incident (action taken, status)
- [ ] Auto-flag result as "withheld" for UFM incidents with high/critical severity
- [ ] Send notification to Exam Controller and Principal for paper_leak/critical incidents

## Task 8: Backend Routes - Marks Entry & Deadlines

### 8.1 Marks entry routes
- [ ] Implement `POST /api/exam-schedules/<id>/marks` - enter/update marks (component-wise)
- [ ] Implement `GET /api/exam-schedules/<id>/marks` - get marks for schedule
- [ ] Implement `POST /api/exam-schedules/<id>/marks/lock` - lock marks (Exam Controller)
- [ ] Implement `POST /api/exam-schedules/<id>/marks/unlock` - unlock marks (Exam Controller)
- [ ] Add validation: marks_obtained <= max_marks per component
- [ ] Add validation: teacher must be assigned to subject/class
- [ ] Add validation: reject entry if marks are locked
- [ ] Support "AB" (absent) marking

### 8.2 Deadline management routes
- [ ] Implement `POST /api/exams/<id>/marks/deadlines` - set deadlines per subject/class
- [ ] Implement `GET /api/exams/<id>/marks/deadlines` - get all deadlines
- [ ] Implement `PUT /api/marks-deadlines/<id>` - extend deadline
- [ ] Implement `GET /api/exams/<id>/marks/status` - marks entry tracking dashboard (completed/pending/overdue)
- [ ] Implement auto-lock logic (check deadline and lock if auto_lock enabled)

## Task 9: Backend Routes - Grace Marks & Result Processing

### 9.1 Grace marks routes
- [ ] Implement `POST /api/exams/<id>/grace-marks` - apply grace marks (Principal only)
- [ ] Implement `GET /api/exams/<id>/grace-marks` - get grace marks history
- [ ] Add validation: marks cannot exceed max_marks after grace
- [ ] Add audit trail logging for all grace marks applications

### 9.2 Result processing routes
- [ ] Implement `POST /api/exams/<id>/results/process` - trigger result calculation
- [ ] Implement `GET /api/exams/<id>/results/summary` - result summary (pass %, toppers, failures)
- [ ] Implement `POST /api/exams/<id>/results/submit-approval` - submit to Principal
- [ ] Implement `POST /api/exams/<id>/results/approve` - Principal approves and publishes
- [ ] Implement `POST /api/exams/<id>/results/reject` - Principal rejects with remarks
- [ ] Implement `GET /api/students/<id>/results` - student results (published only for student/parent)
- [ ] Implement `GET /api/exams/<id>/toppers` - topper list per class/section
- [ ] Implement `GET /api/exams/<id>/results/analytics` - subject-wise and class-wise analytics

## Task 10: Backend Routes - Report Cards

### 10.1 Report card routes
- [ ] Implement `POST /api/exams/<id>/report-cards/generate` - generate report cards (class-wise)
- [ ] Implement `GET /api/exams/<id>/report-cards` - list report cards with filters
- [ ] Implement `PUT /api/report-cards/<id>` - update remarks (teacher/principal)
- [ ] Implement `POST /api/exams/<id>/report-cards/publish` - publish report cards
- [ ] Implement `GET /api/report-cards/<id>/pdf` - download individual report card PDF
- [ ] Implement `GET /api/exams/<id>/report-cards/bulk-pdf` - download bulk PDF
- [ ] Implement `GET /api/students/me/report-cards` - student's own report cards (published only)

## Task 11: Backend Routes - Re-Exam & Grievances

### 11.1 Re-exam routes
- [ ] Implement `POST /api/exams/<id>/re-exams` - create re-exam (compartment/supplementary/improvement/rescheduled)
- [ ] Implement `GET /api/exams/<id>/re-exams` - list re-exams
- [ ] Implement `GET /api/re-exams/<id>/eligible-students` - auto-identify eligible students
- [ ] Implement `POST /api/re-exams/<id>/marks` - enter re-exam marks
- [ ] Implement `POST /api/re-exams/<id>/process-results` - process re-exam results (update original or keep higher)
- [ ] Handle improvement exam logic (retain higher of original vs re-exam)
- [ ] Handle compartment logic (update result_status if re-exam passed/failed)

### 11.2 Grievance routes
- [ ] Implement `POST /api/exam-grievances` - raise grievance (Parent only)
- [ ] Implement `GET /api/exam-grievances` - list grievances (Exam Controller: all, Parent: own)
- [ ] Implement `PUT /api/exam-grievances/<id>` - update status (assign, review)
- [ ] Implement `POST /api/exam-grievances/<id>/resolve` - resolve with marks correction
- [ ] Auto-recalculate totals, percentage, grade, rank after correction
- [ ] Send notification to Parent on status change

## Task 12: Backend Routes - Verification & Notifications

### 12.1 Random verification routes
- [ ] Implement `POST /api/exam-schedules/<id>/verification/generate` - randomly select students for verification
- [ ] Implement `GET /api/exam-schedules/<id>/verification` - get verification list
- [ ] Implement `PUT /api/marks-verifications/<id>` - update verified marks and discrepancy status
- [ ] Implement `GET /api/exams/<id>/verification/report` - accuracy report per teacher

### 12.2 Notification routes
- [ ] Implement `GET /api/exam-notifications` - get user's notifications (paginated)
- [ ] Implement `PUT /api/exam-notifications/<id>/read` - mark as read
- [ ] Implement `POST /api/exams/<id>/notifications/send-reminders` - trigger manual reminders
- [ ] Register Blueprint and add to app factory

## Task 13: Frontend - API Service & Shared Components

### 13.1 Create exam API service
- [ ] Create `frontend/src/services/examApi.js` with all exam API endpoints
- [ ] Add methods for: exams CRUD, date sheet, question papers, seating, invigilators, admit cards, attendance, incidents, marks, deadlines, grace marks, results, report cards, re-exams, grievances, verification, notifications
- [ ] Add proper error handling and response parsing

### 13.2 Create shared exam components
- [ ] Create `ExamStatusBadge.jsx` - color-coded status badge (upcoming/ongoing/completed/cancelled/results_published)
- [ ] Create `MarksEntryGrid.jsx` - reusable data grid for marks entry with validation
- [ ] Create `SeatingGrid.jsx` - visual grid component for seating chart display
- [ ] Create `ResultSummaryCard.jsx` - summary card showing pass %, toppers, failures
- [ ] Create `ExamTimeline.jsx` - timeline component showing exam lifecycle progress

## Task 14: Frontend - Exam Controller Pages (Part 1)

### 14.1 Exam list and creation
- [ ] Create `ExamListPage.jsx` - list exams with filters (type, status, year), search, pagination
- [ ] Create `ExamCreateForm.jsx` - form with: name, type, dates, class selection, grading system, instructions
- [ ] Add edit mode for existing exams (status-based field restrictions)
- [ ] Add delete confirmation dialog with dependency check

### 14.2 Date sheet manager
- [ ] Create `DateSheetManager.jsx` - tabular interface to add/edit schedule entries per class
- [ ] Add subject, date, time, max marks, passing marks fields per row
- [ ] Add shift selector (morning/afternoon)
- [ ] Add "Submit for Approval" button with confirmation
- [ ] Show approval status and rejection remarks
- [ ] Add "Download PDF" button for approved date sheets

### 14.3 Question paper tracker
- [ ] Create `QuestionPaperTracker.jsx` - dashboard showing submission status per subject/class
- [ ] Show status badges: submitted, pending, hod_approved, collected, final_approved
- [ ] Add "Send Reminder" button for pending papers
- [ ] Add paper details view (metadata, download link for authorized users)

### 14.4 Hall allocation and seating
- [ ] Create `HallAllocationPage.jsx` - assign halls to exam schedules
- [ ] Show hall list with capacity, select halls for each exam day
- [ ] Create `SeatingChartViewer.jsx` - visual grid showing student placements
- [ ] Add seating generation controls (mode selector: roll number/random/mixed)
- [ ] Add "Generate" and "Regenerate" buttons
- [ ] Add "Download Seating Chart PDF" button

## Task 15: Frontend - Exam Controller Pages (Part 2)

### 15.1 Invigilator duty manager
- [ ] Create `InvigilatorDutyManager.jsx` - assign teachers to halls per schedule
- [ ] Add role selector (Chief/Assistant/Relief)
- [ ] Show conflict warnings (subject teacher, double-booking)
- [ ] Add swap functionality for duty changes
- [ ] Add "Download Duty Chart PDF" button

### 15.2 Admit card manager
- [ ] Create `AdmitCardManager.jsx` - generate and manage admit cards
- [ ] Add class-wise bulk generation button
- [ ] Show admit card list with status (generated/issued/revoked)
- [ ] Add revoke functionality with reason
- [ ] Add "Download Bulk PDF" button per class
- [ ] Add individual PDF download links

### 15.3 Marks entry tracker
- [ ] Create `MarksEntryTracker.jsx` - dashboard showing marks entry status per subject/class
- [ ] Show: completed count, pending count, days until deadline, overdue flag
- [ ] Add lock/unlock buttons per subject
- [ ] Add deadline management (set, extend)
- [ ] Add "Send Reminder" button for pending entries
- [ ] Show escalation status for overdue entries

### 15.4 Result processing page
- [ ] Create `ResultProcessingPage.jsx` - trigger and manage result processing
- [ ] Add "Process Results" button with progress indicator
- [ ] Show result summary: pass %, compartment count, detained count, toppers
- [ ] Add subject-wise analysis table (avg, highest, lowest, pass %)
- [ ] Add "Submit for Approval" button
- [ ] Show approval status and rejection remarks

### 15.5 Report card manager
- [ ] Create `ReportCardManager.jsx` - generate and publish report cards
- [ ] Add class-wise generation button
- [ ] Show report card list with status (draft/published/archived)
- [ ] Add remarks entry (teacher remarks, principal remarks)
- [ ] Add "Publish" button
- [ ] Add bulk PDF download per class

## Task 16: Frontend - Exam Controller Pages (Part 3)

### 16.1 Incident management
- [ ] Create `IncidentList.jsx` - view and manage exam incidents
- [ ] Add filters: exam, date, type, severity
- [ ] Show incident details with action taken
- [ ] Add "Update Action" form for resolving incidents

### 16.2 Re-exam manager
- [ ] Create `ReExamManager.jsx` - create and manage re-examinations
- [ ] Add form: type (compartment/supplementary/improvement/rescheduled), date, subject, class
- [ ] Show eligible students list (auto-populated for compartment)
- [ ] Add marks entry for re-exam
- [ ] Add "Process Results" button for re-exam

### 16.3 Grievance manager
- [ ] Create `GrievanceManager.jsx` - handle parent grievances
- [ ] Show grievance list with status filters
- [ ] Add assign-to-teacher functionality
- [ ] Add resolution form with marks correction
- [ ] Show audit trail of corrections

### 16.4 Verification page
- [ ] Create `VerificationPage.jsx` - random marks verification workflow
- [ ] Add "Generate Random Sample" button (configurable count)
- [ ] Show verification table: student, entered marks, verified marks field
- [ ] Calculate and display accuracy percentage per teacher

### 16.5 Exam analytics dashboard
- [ ] Create `ExamAnalyticsDashboard.jsx` - comprehensive analytics view
- [ ] Add charts: subject-wise pass %, class-wise comparison, grade distribution
- [ ] Add student progress trends (across multiple exams)
- [ ] Add teacher performance metrics
- [ ] Add export buttons (PDF, Excel)
- [ ] Add "Subjects Needing Attention" section (below 60% pass rate)

## Task 17: Frontend - Teacher Portal

### 17.1 Teacher exam schedule view
- [ ] Create `TeacherExamSchedule.jsx` - view exam schedule for assigned subjects
- [ ] Show only subjects assigned to the logged-in teacher
- [ ] Display date, time, class, max marks for each scheduled exam

### 17.2 Question paper upload
- [ ] Create `QuestionPaperUpload.jsx` - upload question papers
- [ ] Add form: subject, class, exam, set name, max marks, duration, instructions
- [ ] Add PDF file upload with 5MB validation
- [ ] Show upload history with status tracking
- [ ] Show rejection remarks if paper was rejected

### 17.3 Marks entry form
- [ ] Create `MarksEntryForm.jsx` - enter marks for students
- [ ] Show student list for selected subject/class/exam
- [ ] Support component-wise entry (Theory, Practical, Internal Assessment)
- [ ] Add "AB" (absent) toggle per student
- [ ] Show max marks and validate input (cannot exceed max)
- [ ] Show deadline countdown and locked status
- [ ] Add save (draft) and submit functionality
- [ ] Disable editing when marks are locked

### 17.4 Invigilator duty view
- [ ] Create `InvigilatorDutyView.jsx` - view assigned invigilator duties
- [ ] Show duty schedule: date, time, hall, role
- [ ] Highlight upcoming duties

## Task 18: Frontend - Principal Portal

### 18.1 Date sheet approval
- [ ] Create `DateSheetApproval.jsx` - review and approve/reject date sheets
- [ ] Show date sheet details in tabular format per class
- [ ] Add "Approve" and "Reject" buttons with remarks field
- [ ] Show pending approvals count on dashboard

### 18.2 Result approval
- [ ] Create `ResultApproval.jsx` - review result summary and approve/reject
- [ ] Show: class-wise pass %, topper list, failure count, compartment count
- [ ] Add "Approve & Publish" and "Reject" buttons with remarks
- [ ] Show subject-wise breakdown

### 18.3 Grace marks form
- [ ] Create `GraceMarksForm.jsx` - apply grace marks
- [ ] Add level selector: class-wide, subject-specific, individual student
- [ ] Add marks value and reason fields
- [ ] Show preview of affected students before applying
- [ ] Show grace marks history/audit trail

### 18.4 Principal analytics
- [ ] Create `PrincipalAnalytics.jsx` - school-wide exam performance dashboard
- [ ] Show overall metrics: total exams, pass %, toppers
- [ ] Add class comparison charts
- [ ] Add teacher performance overview
- [ ] Show escalation alerts (overdue marks entries)

## Task 19: Frontend - Student Portal

### 19.1 Student exam views
- [ ] Create `StudentDateSheet.jsx` - view approved date sheet for student's class
- [ ] Create `StudentAdmitCard.jsx` - download admit card (if generated/issued)
- [ ] Create `StudentResults.jsx` - view published results (subject-wise marks, grade, rank)
- [ ] Create `StudentReportCard.jsx` - download published report card PDF
- [ ] Add hall/seat allocation display for upcoming exams
- [ ] Restrict all views to published/approved data only

## Task 20: Frontend - Parent Portal

### 20.1 Parent exam views
- [ ] Create `ParentResults.jsx` - view child's published results
- [ ] Create `ParentReportCard.jsx` - download child's report card PDF
- [ ] Add date sheet view for child's class
- [ ] Restrict to published data only, own children only

### 20.2 Grievance form
- [ ] Create `GrievanceForm.jsx` - raise marks rechecking grievance
- [ ] Add subject selector, reason text field
- [ ] Show grievance history with status tracking
- [ ] Show resolution details when resolved

## Task 21: Integration & Routing

### 21.1 Backend integration
- [ ] Register all new Blueprints in `backend/app/__init__.py`
- [ ] Add role-based decorators to all new routes (exam_controller_required, teacher_required, principal_required, student_required, parent_required)
- [ ] Add exam-related models to `backend/app/models/__init__.py` imports
- [ ] Create database migration script for all new tables

### 21.2 Frontend routing
- [ ] Add exam management routes to React Router configuration
- [ ] Add navigation menu items for each role (Exam Controller, Teacher, Principal, Student, Parent)
- [ ] Add route guards based on user role
- [ ] Add exam section to each portal's sidebar navigation

## Task 22: Testing & Validation

### 22.1 Backend testing
- [ ] Write unit tests for result_service.py (calculation logic, pass/fail/compartment)
- [ ] Write unit tests for seating_service.py (all three modes, capacity validation)
- [ ] Write unit tests for grace marks application (cap at max, audit trail)
- [ ] Write API integration tests for marks entry (validation, lock/unlock, deadline)
- [ ] Write API integration tests for approval workflows (date sheet, results)

### 22.2 Frontend testing
- [ ] Write component tests for MarksEntryGrid (validation, AB marking, lock state)
- [ ] Write component tests for SeatingGrid (display, student placement)
- [ ] Write integration tests for exam creation flow
- [ ] Write integration tests for result viewing (role-based visibility)
