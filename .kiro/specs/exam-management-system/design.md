# Design Document: Exam Management System

## Overview

This design document describes the technical implementation of the complete Exam Management System for the School CRM. The system extends existing models (Exam, ExamSchedule, ExamResult, ExamHall, ExamSeating, ExamInvigilator, ExamAdmitCard, ReportCard, ExamIncident, MarkEntry) and introduces new models and API endpoints to cover the full exam lifecycle.

## Architecture

- **Backend**: Flask + SQLAlchemy + MySQL (existing stack)
- **Frontend**: React 18 + MUI v5 (existing stack)
- **PDF Generation**: ReportLab / WeasyPrint for server-side PDF generation
- **File Storage**: Local filesystem (backend/uploads/question_papers/)
- **Notifications**: In-app notification system + SMS integration (existing communication module)

## Database Design

### New Models Required

### 1. ExamDateSheet Model

```python
class ExamDateSheet(db.Model):
    __tablename__ = 'exam_date_sheets'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.Enum('draft', 'pending_approval', 'approved', 'rejected'), default='draft')
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    rejection_remarks = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### 2. QuestionPaper Model

```python
class QuestionPaper(db.Model):
    __tablename__ = 'question_papers'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)  # in bytes
    set_name = db.Column(db.String(10), default='A')  # Set A, Set B
    max_marks = db.Column(db.Numeric(5, 2), nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False)
    instructions = db.Column(db.Text)
    status = db.Column(db.Enum('submitted', 'hod_approved', 'collected', 'final_approved', 'rejected'), default='submitted')
    reviewed_by = db.Column(db.Integer, db.ForeignKey('staff.id'))
    reviewed_at = db.Column(db.DateTime)
    review_remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### 3. MarksEntryDeadline Model

```python
class MarksEntryDeadline(db.Model):
    __tablename__ = 'marks_entry_deadlines'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    deadline_date = db.Column(db.DateTime, nullable=False)
    auto_lock = db.Column(db.Boolean, default=True)
    is_locked = db.Column(db.Boolean, default=False)
    locked_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

### 4. GraceMarks Model

```python
class GraceMarks(db.Model):
    __tablename__ = 'grace_marks'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'))
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    marks_value = db.Column(db.Numeric(5, 2), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    applied_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    level = db.Column(db.Enum('class', 'subject', 'individual'), nullable=False)
```

### 5. ReExam Model

```python
class ReExam(db.Model):
    __tablename__ = 're_exams'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    original_exam_id = db.Column(db.Integer, db.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False)
    original_schedule_id = db.Column(db.Integer, db.ForeignKey('exam_schedules.id'))
    re_exam_type = db.Column(db.Enum('compartment', 'supplementary', 'improvement', 'rescheduled'), nullable=False)
    new_exam_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time)
    end_time = db.Column(db.Time)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'))
    status = db.Column(db.Enum('scheduled', 'ongoing', 'completed', 'results_processed'), default='scheduled')
    reason = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

### 6. ReExamStudent Model

```python
class ReExamStudent(db.Model):
    __tablename__ = 're_exam_students'
    id = db.Column(db.Integer, primary_key=True)
    re_exam_id = db.Column(db.Integer, db.ForeignKey('re_exams.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    original_marks = db.Column(db.Numeric(5, 2))
    re_exam_marks = db.Column(db.Numeric(5, 2))
    final_marks = db.Column(db.Numeric(5, 2))
    status = db.Column(db.Enum('eligible', 'appeared', 'absent', 'result_updated'), default='eligible')
```

### 7. ExamNotification Model

```python
class ExamNotification(db.Model):
    __tablename__ = 'exam_notifications'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'))
    recipient_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.Enum('date_sheet_approved', 'paper_reminder', 'marks_reminder', 'marks_escalation',
                             'result_published', 'duty_assigned', 'duty_changed', 're_exam_scheduled',
                             'grievance_update', 'incident_alert'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    delivery_channel = db.Column(db.Enum('in_app', 'sms', 'both'), default='in_app')
    delivery_status = db.Column(db.Enum('pending', 'sent', 'delivered', 'failed'), default='pending')
    sent_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

### 8. ExamGrievance Model

```python
class ExamGrievance(db.Model):
    __tablename__ = 'exam_grievances'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    exam_schedule_id = db.Column(db.Integer, db.ForeignKey('exam_schedules.id', ondelete='CASCADE'), nullable=False)
    raised_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.Enum('pending', 'under_review', 'resolved', 'rejected'), default='pending')
    assigned_to = db.Column(db.Integer, db.ForeignKey('staff.id'))
    resolution_remarks = db.Column(db.Text)
    original_marks = db.Column(db.Numeric(5, 2))
    corrected_marks = db.Column(db.Numeric(5, 2))
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    resolved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

### 9. ExamAttendance Model

```python
class ExamAttendance(db.Model):
    __tablename__ = 'exam_attendance'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_schedule_id = db.Column(db.Integer, db.ForeignKey('exam_schedules.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    hall_id = db.Column(db.Integer, db.ForeignKey('exam_halls.id'))
    status = db.Column(db.Enum('present', 'absent'), nullable=False)
    marked_by = db.Column(db.Integer, db.ForeignKey('staff.id'))
    marked_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_late_entry = db.Column(db.Boolean, default=False)
```

### 10. SpecialArrangement Model

```python
class SpecialArrangement(db.Model):
    __tablename__ = 'special_arrangements'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_schedule_id = db.Column(db.Integer, db.ForeignKey('exam_schedules.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    arrangement_type = db.Column(db.Enum('extra_time', 'separate_room', 'scribe', 'other'), nullable=False)
    extra_time_minutes = db.Column(db.Integer)
    separate_hall_id = db.Column(db.Integer, db.ForeignKey('exam_halls.id'))
    medical_certificate_path = db.Column(db.String(500))
    reason = db.Column(db.Text, nullable=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

### 11. MarksVerification Model

```python
class MarksVerification(db.Model):
    __tablename__ = 'marks_verifications'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_schedule_id = db.Column(db.Integer, db.ForeignKey('exam_schedules.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    entered_marks = db.Column(db.Numeric(5, 2))
    verified_marks = db.Column(db.Numeric(5, 2))
    discrepancy_status = db.Column(db.Enum('match', 'mismatch', 'pending'), default='pending')
    verified_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    verified_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

### Modifications to Existing Models

- **Exam**: Add `approval_status` field (pending, approved, rejected) for Principal approval workflow
- **ExamSchedule**: Add `shift` field (morning, afternoon) and `date_sheet_id` foreign key
- **ExamIncident**: Add `paper_leak` to type enum, add `status` field (reported, investigating, resolved)
- **ReportCard**: Already has all needed fields (result_status includes 'compartment', 'withheld')

## API Design

### Exam CRUD APIs (Existing - Extend)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | /api/exams | Create exam | Exam Controller |
| GET | /api/exams | List exams (filtered) | All roles |
| GET | /api/exams/:id | Get exam details | All roles |
| PUT | /api/exams/:id | Update exam | Exam Controller |
| DELETE | /api/exams/:id | Delete exam | Exam Controller |

### Date Sheet APIs (New)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | /api/exams/:id/date-sheet | Create/update date sheet | Exam Controller |
| GET | /api/exams/:id/date-sheet | Get date sheet | All (approved only for students/parents) |
| POST | /api/exams/:id/date-sheet/submit-approval | Submit for approval | Exam Controller |
| POST | /api/exams/:id/date-sheet/approve | Approve date sheet | Principal |
| POST | /api/exams/:id/date-sheet/reject | Reject date sheet | Principal |
| GET | /api/exams/:id/date-sheet/pdf | Download PDF | All (approved only) |

### Question Paper APIs (New)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | /api/exams/:id/question-papers | Upload question paper | Teacher |
| GET | /api/exams/:id/question-papers | List papers (status tracking) | Exam Controller, HOD |
| GET | /api/question-papers/:id | Get paper details | Exam Controller, HOD, Principal |
| POST | /api/question-papers/:id/approve | HOD/Principal approve | HOD, Principal |
| POST | /api/question-papers/:id/reject | Reject paper | HOD, Principal |
| POST | /api/question-papers/:id/collect | Mark as collected | Exam Controller |
| GET | /api/exams/:id/question-papers/status | Paper submission dashboard | Exam Controller |

### Hall & Seating APIs (Existing - Extend)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | /api/exam-schedules/:id/seating/generate | Generate seating arrangement | Exam Controller |
| GET | /api/exam-schedules/:id/seating | Get seating chart | Exam Controller, Students |
| GET | /api/exam-schedules/:id/seating/pdf | Download seating chart PDF | Exam Controller |
| POST | /api/exam-schedules/:id/seating/regenerate | Regenerate seating | Exam Controller |

### Invigilator APIs (Existing - Extend)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | /api/exam-schedules/:id/invigilators | Assign invigilator | Exam Controller |
| GET | /api/exams/:id/invigilators/duty-chart | Get full duty chart | Exam Controller |
| GET | /api/staff/me/invigilator-duties | Teacher's own duties | Teacher |
| PUT | /api/exam-invigilators/:id/swap | Swap invigilator | Exam Controller |
| GET | /api/exams/:id/invigilators/duty-chart/pdf | Download duty chart PDF | Exam Controller |

### Admit Card APIs (Existing - Extend)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | /api/exams/:id/admit-cards/generate | Bulk generate admit cards | Exam Controller |
| GET | /api/exams/:id/admit-cards | List admit cards | Exam Controller |
| GET | /api/admit-cards/:id/pdf | Download individual PDF | Exam Controller, Student |
| GET | /api/exams/:id/admit-cards/bulk-pdf | Download bulk PDF | Exam Controller |
| PUT | /api/admit-cards/:id/revoke | Revoke admit card | Exam Controller |
| GET | /api/students/me/admit-cards | Student's own admit cards | Student |

### Exam Day Operations APIs (New)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | /api/exam-schedules/:id/attendance | Mark attendance | Invigilator |
| GET | /api/exam-schedules/:id/attendance | Get attendance | Exam Controller |
| GET | /api/exams/:id/attendance/report | Consolidated attendance report | Exam Controller |
| POST | /api/exam-schedules/:id/incidents | Report incident | Invigilator, Exam Controller |
| GET | /api/exams/:id/incidents | List incidents | Exam Controller, Principal |
| PUT | /api/incidents/:id | Update incident (action taken) | Exam Controller |

### Marks Entry APIs (Existing - Extend)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | /api/exam-schedules/:id/marks | Enter/update marks | Teacher |
| GET | /api/exam-schedules/:id/marks | Get marks for schedule | Teacher, Exam Controller |
| POST | /api/exam-schedules/:id/marks/lock | Lock marks | Exam Controller |
| POST | /api/exam-schedules/:id/marks/unlock | Unlock marks | Exam Controller |
| GET | /api/exams/:id/marks/status | Marks entry tracking dashboard | Exam Controller |
| POST | /api/exams/:id/marks/deadlines | Set deadlines | Exam Controller |
| GET | /api/exams/:id/marks/deadlines | Get deadlines | Exam Controller, Teacher |

### Grace Marks APIs (New)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | /api/exams/:id/grace-marks | Apply grace marks | Principal |
| GET | /api/exams/:id/grace-marks | Get grace marks history | Principal, Exam Controller |

### Result Processing APIs (Existing - Extend)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | /api/exams/:id/results/process | Trigger result processing | Exam Controller |
| GET | /api/exams/:id/results/summary | Get result summary | Exam Controller, Principal |
| POST | /api/exams/:id/results/submit-approval | Submit for Principal approval | Exam Controller |
| POST | /api/exams/:id/results/approve | Approve and publish | Principal |
| POST | /api/exams/:id/results/reject | Reject results | Principal |
| GET | /api/exams/:id/results/analytics | Get analytics | Principal, Exam Controller |
| GET | /api/students/:id/results | Student results (published only) | Student, Parent |
| GET | /api/exams/:id/toppers | Get topper list | All (after publish) |

### Report Card APIs (Existing - Extend)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | /api/exams/:id/report-cards/generate | Generate report cards | Exam Controller |
| GET | /api/exams/:id/report-cards | List report cards | Exam Controller |
| PUT | /api/report-cards/:id | Update remarks | Exam Controller, Teacher |
| POST | /api/exams/:id/report-cards/publish | Publish report cards | Exam Controller |
| GET | /api/report-cards/:id/pdf | Download individual PDF | All (published only) |
| GET | /api/exams/:id/report-cards/bulk-pdf | Download bulk PDF | Exam Controller |
| GET | /api/students/me/report-cards | Student's own report cards | Student |

### Re-Exam APIs (New)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | /api/exams/:id/re-exams | Create re-exam | Exam Controller |
| GET | /api/exams/:id/re-exams | List re-exams | Exam Controller |
| GET | /api/re-exams/:id/eligible-students | Get eligible students | Exam Controller |
| POST | /api/re-exams/:id/marks | Enter re-exam marks | Teacher |
| POST | /api/re-exams/:id/process-results | Process re-exam results | Exam Controller |

### Grievance APIs (New)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | /api/exam-grievances | Raise grievance | Parent |
| GET | /api/exam-grievances | List grievances | Exam Controller, Parent (own) |
| PUT | /api/exam-grievances/:id | Update grievance status | Exam Controller |
| POST | /api/exam-grievances/:id/resolve | Resolve with correction | Exam Controller |

### Random Verification APIs (New)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | /api/exam-schedules/:id/verification/generate | Generate random sample | Exam Controller |
| GET | /api/exam-schedules/:id/verification | Get verification list | Exam Controller |
| PUT | /api/marks-verifications/:id | Update verified marks | Exam Controller |
| GET | /api/exams/:id/verification/report | Verification accuracy report | Exam Controller |

### Notification APIs (New)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | /api/exam-notifications | Get user's notifications | All |
| PUT | /api/exam-notifications/:id/read | Mark as read | All |
| POST | /api/exams/:id/notifications/send-reminders | Trigger manual reminders | Exam Controller |

## Frontend Components

### Exam Controller Dashboard
- **ExamListPage**: List all exams with filters (type, status, academic year)
- **ExamCreateForm**: Create/edit exam with class group selection
- **DateSheetManager**: Create date sheet entries, submit for approval
- **QuestionPaperTracker**: Dashboard showing paper submission status per subject
- **HallAllocationPage**: Assign halls, generate seating
- **SeatingChartViewer**: Visual grid display of seating arrangement
- **InvigilatorDutyManager**: Assign duties, view duty chart
- **AdmitCardManager**: Generate, view, revoke admit cards
- **MarksEntryTracker**: Dashboard showing entry status, deadlines, lock/unlock
- **ResultProcessingPage**: Trigger processing, view summary, submit for approval
- **ReportCardManager**: Generate, add remarks, publish
- **IncidentList**: View and manage exam incidents
- **GrievanceManager**: Handle parent grievances
- **VerificationPage**: Random verification workflow
- **ReExamManager**: Create and manage re-examinations
- **ExamAnalyticsDashboard**: Charts and reports

### Teacher Portal
- **TeacherExamSchedule**: View exam schedule for assigned subjects
- **QuestionPaperUpload**: Upload papers with metadata
- **InvigilatorDutyView**: View assigned duties
- **MarksEntryForm**: Enter marks per student per subject (component-wise)
- **TeacherResultView**: View results of assigned students

### Principal Portal
- **DateSheetApproval**: Review and approve/reject date sheets
- **ResultApproval**: Review summary and approve/reject results
- **GraceMarksForm**: Apply grace marks with reason
- **PrincipalAnalytics**: School-wide exam performance dashboard
- **EscalationView**: View overdue marks entries and teacher compliance

### Student Portal
- **StudentDateSheet**: View approved date sheet for their class
- **StudentAdmitCard**: Download admit card
- **StudentResults**: View published results
- **StudentReportCard**: Download report card
- **StudentSeatAllocation**: View hall and seat number

### Parent Portal
- **ParentDateSheet**: View child's exam schedule
- **ParentResults**: View child's published results
- **ParentReportCard**: Download child's report card
- **GrievanceForm**: Raise marks rechecking grievance
- **GrievanceStatus**: Track grievance progress

## Key Business Logic

### Seating Arrangement Algorithm
1. **Roll Number Order**: Sort students by roll number, assign seats left-to-right, top-to-bottom
2. **Random**: Shuffle student list, assign seats sequentially
3. **Mixed**: Interleave students from different classes (Class A seat 1, Class B seat 2, etc.)

### Result Processing Algorithm
1. For each student in the exam:
   a. Sum component marks (theory + practical + internal) with weightage
   b. Calculate percentage = (total_obtained / total_max) × 100
   c. Map percentage to grade using configured grading system
   d. Determine pass/fail per subject (marks >= passing_marks)
   e. Count failed subjects: 0 = pass, 1-2 = compartment, 3+ = detained
2. Calculate ranks (excluding absent students):
   a. Section rank: Rank within section by total percentage
   b. Class rank: Rank within class (all sections) by total percentage
3. Generate topper lists (top 3 per section and class)

### Grace Marks Application
1. Identify affected students based on level (class/subject/individual)
2. For each student: new_marks = min(marks_obtained + grace_value, max_marks)
3. Recalculate percentage, grade, and rank after application
4. Log audit trail

### Deadline Auto-Lock Logic
1. Scheduled job checks deadlines every hour
2. If current_time > deadline_date AND auto_lock = True:
   a. Set is_locked = True on corresponding ExamSchedule
   b. Set is_locked = True on MarksEntryDeadline
   c. Send notification to Exam Controller about auto-lock

### Notification Triggers
| Event | Recipients | Channel |
|-------|-----------|---------|
| Date sheet approved | Teachers, Students, Parents of class | In-app + SMS |
| Paper deadline approaching (3 days) | Teacher with pending paper | In-app |
| Marks deadline approaching (2 days) | Teacher with pending marks | In-app |
| Marks deadline passed (overdue) | Principal (escalation) | In-app |
| Results published | Parents of class | In-app + SMS |
| Invigilator duty assigned/changed | Affected teacher | In-app |
| Re-exam scheduled | Eligible students + parents | In-app + SMS |
| Grievance status update | Parent who raised | In-app |
| Incident (paper_leak, critical) | Exam Controller + Principal | In-app |

## File Structure

```
backend/app/
├── models/
│   └── academic.py          # Extend with new models (QuestionPaper, ExamDateSheet, etc.)
├── routes/
│   ├── exams.py             # New - All exam management APIs
│   ├── exam_controller.py   # New - Exam Controller specific operations
│   └── exam_reports.py      # New - PDF generation and analytics
├── services/
│   ├── exam_service.py      # New - Core exam business logic
│   ├── result_service.py    # New - Result processing and calculation
│   ├── seating_service.py   # New - Seating arrangement algorithms
│   ├── notification_service.py  # New - Exam notification logic
│   └── pdf_service.py       # New - PDF generation (date sheet, admit card, report card)
└── utils/
    └── exam_helpers.py      # New - Shared exam utilities

frontend/src/
├── pages/
│   ├── exams/
│   │   ├── ExamListPage.jsx
│   │   ├── ExamCreateForm.jsx
│   │   ├── DateSheetManager.jsx
│   │   ├── QuestionPaperTracker.jsx
│   │   ├── HallAllocationPage.jsx
│   │   ├── SeatingChartViewer.jsx
│   │   ├── InvigilatorDutyManager.jsx
│   │   ├── AdmitCardManager.jsx
│   │   ├── MarksEntryTracker.jsx
│   │   ├── ResultProcessingPage.jsx
│   │   ├── ReportCardManager.jsx
│   │   ├── ReExamManager.jsx
│   │   ├── GrievanceManager.jsx
│   │   ├── VerificationPage.jsx
│   │   └── ExamAnalyticsDashboard.jsx
│   ├── teacher/
│   │   ├── TeacherExamSchedule.jsx
│   │   ├── QuestionPaperUpload.jsx
│   │   ├── MarksEntryForm.jsx
│   │   └── InvigilatorDutyView.jsx
│   ├── principal/
│   │   ├── DateSheetApproval.jsx
│   │   ├── ResultApproval.jsx
│   │   ├── GraceMarksForm.jsx
│   │   └── PrincipalAnalytics.jsx
│   ├── student/
│   │   ├── StudentDateSheet.jsx
│   │   ├── StudentAdmitCard.jsx
│   │   ├── StudentResults.jsx
│   │   └── StudentReportCard.jsx
│   └── parent/
│       ├── ParentResults.jsx
│       ├── ParentReportCard.jsx
│       └── GrievanceForm.jsx
├── components/
│   └── exams/
│       ├── ExamStatusBadge.jsx
│       ├── MarksEntryGrid.jsx
│       ├── SeatingGrid.jsx
│       ├── ResultSummaryCard.jsx
│       └── ExamTimeline.jsx
└── services/
    └── examApi.js           # API client for exam endpoints
```

## Security Considerations

1. **Question Paper Confidentiality**: Papers stored in non-public directory, served only through authenticated API with role check
2. **Marks Integrity**: All marks modifications logged with user_id and timestamp; lock mechanism prevents unauthorized changes
3. **Result Visibility**: Results hidden from students/parents until Principal approves and publishes
4. **Role Enforcement**: Every API endpoint validates user role before processing
5. **File Upload Validation**: Question papers validated for PDF format and 5MB size limit
6. **Audit Trail**: Grace marks, marks corrections, and all approval actions logged with full audit trail

## Performance Considerations

1. **Bulk Operations**: Admit card generation, report card generation, and seating arrangement use batch processing
2. **PDF Generation**: Heavy PDF operations (bulk class-wise) run asynchronously with status polling
3. **Result Processing**: Calculation for large classes (60+ students × 8+ subjects) optimized with batch queries
4. **Indexing**: Composite indexes on (exam_id, class_id, subject_id) and (exam_schedule_id, student_id) for fast lookups
5. **Caching**: Date sheet and published results cached after approval (invalidated on changes)

## Dependencies

- **ReportLab** or **WeasyPrint**: Server-side PDF generation
- **Pillow**: Image processing for student photos in admit cards
- **Celery** (optional): Background task processing for bulk operations
- Existing: Flask, SQLAlchemy, MySQL, React 18, MUI v5
