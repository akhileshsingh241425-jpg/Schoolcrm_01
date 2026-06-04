# Requirements Document

## Introduction

The Marks Entry System enables controlled, role-based marks entry for exams in the School CRM. The Exam Controller assigns teachers to enter marks for specific class-section-subject combinations based on existing TeacherSubject allocations. Teachers can only enter marks for their assigned subjects. The system provides deadline tracking, auto-status updates when exam time passes, and a lock/unlock mechanism controlled by the Exam Controller to prevent unauthorized modifications after finalization.

## Glossary

- **Marks_Entry_System**: The subsystem responsible for managing marks entry permissions, data entry, locking, and status tracking
- **Exam_Controller**: The user role responsible for managing exams, assigning marks entry permissions, setting deadlines, and locking/unlocking marks
- **Teacher**: The user role that enters marks for assigned class-section-subject combinations
- **Principal**: The user role that oversees all exam operations and can view marks entry status
- **TeacherSubject_Allocation**: The existing mapping (TeacherSubject model) that links a teacher to a subject, class, and section for the current academic year
- **ExamSchedule**: The existing model representing a scheduled exam for a specific class, section, and subject with max_marks, passing_marks, and is_marks_locked fields
- **ExamResult**: The existing model storing individual student marks for an exam schedule
- **Marks_Entry_Assignment**: A record that grants a specific teacher permission to enter marks for a specific ExamSchedule, derived from TeacherSubject_Allocation
- **Marks_Lock**: The state where an ExamSchedule's is_marks_locked field is set to true, preventing further modifications
- **Submission_Deadline**: The date and time by which a teacher must complete marks entry for an assigned ExamSchedule

## Requirements

### Requirement 1: Marks Entry Permission Assignment

**User Story:** As an Exam Controller, I want to assign marks entry permissions to teachers based on their existing TeacherSubject allocations, so that only authorized teachers can enter marks for their designated class-section-subject combinations.

#### Acceptance Criteria

1. WHEN an Exam_Controller initiates marks entry assignment for an exam, THE Marks_Entry_System SHALL retrieve all active TeacherSubject_Allocation records matching the ExamSchedule class_id, section_id, and subject_id combinations
2. WHEN a TeacherSubject_Allocation match is found, THE Marks_Entry_System SHALL create a Marks_Entry_Assignment linking the teacher to the corresponding ExamSchedule
3. WHEN no TeacherSubject_Allocation match exists for an ExamSchedule, THE Marks_Entry_System SHALL flag that ExamSchedule as unassigned and display it to the Exam_Controller; IF the flagging mechanism fails for some schedules, THEN THE Marks_Entry_System SHALL continue processing remaining schedules and report partial assignment results
4. THE Marks_Entry_System SHALL allow the Exam_Controller to manually assign a teacher to an unassigned ExamSchedule
5. THE Marks_Entry_System SHALL enforce a unique constraint of one teacher per ExamSchedule (one teacher per class-section-subject per exam)

### Requirement 2: Marks Entry Access Control

**User Story:** As a Teacher, I want to access only the marks entry forms for my assigned class-section-subject combinations, so that I cannot accidentally modify marks for other subjects or sections.

#### Acceptance Criteria

1. WHEN a Teacher requests the marks entry page, THE Marks_Entry_System SHALL display only the ExamSchedules for which the Teacher has an active Marks_Entry_Assignment
2. WHEN a Teacher attempts to submit marks for an ExamSchedule without a valid Marks_Entry_Assignment, THE Marks_Entry_System SHALL reject the request with an authorization error; IF a Teacher's assignment becomes invalid after they have started entering marks, THEN THE Marks_Entry_System SHALL allow the current submission to complete
3. WHILE a Teacher has multiple Marks_Entry_Assignments across different class-section-subject combinations, THE Marks_Entry_System SHALL display each assignment separately with class, section, and subject labels
4. WHEN an Exam_Controller or Principal requests marks entry status, THE Marks_Entry_System SHALL allow read access to all ExamSchedule marks data regardless of assignment
5. WHEN any Teacher (assigned or not) or Principal views marks for an ExamSchedule, THE Marks_Entry_System SHALL display marks in read-only mode unless the viewer is the assigned teacher for that ExamSchedule
6. THE Marks_Entry_System SHALL allow all teachers and the Principal to view marks for any class-section-subject, but SHALL restrict edit/save operations to only the assigned teacher

### Requirement 3: Marks Data Entry

**User Story:** As a Teacher, I want to enter marks for all students in my assigned class-section-subject, so that exam results are recorded accurately.

#### Acceptance Criteria

1. WHEN a Teacher opens a marks entry form for an assigned ExamSchedule, THE Marks_Entry_System SHALL display all active students belonging to that class_id and section_id with fields for marks_obtained, is_absent, and remarks; WHEN a Teacher opens a marks entry form for an ExamSchedule that is not assigned to them, THE Marks_Entry_System SHALL prevent access to the student list
2. THE Marks_Entry_System SHALL validate that marks_obtained does not exceed the max_marks defined in the ExamSchedule
3. THE Marks_Entry_System SHALL validate that marks_obtained is a non-negative numeric value with up to two decimal places
4. WHEN a Teacher marks a student as is_absent, THE Marks_Entry_System SHALL set marks_obtained to null for that student
5. WHEN a Teacher submits marks, THE Marks_Entry_System SHALL record the teacher's user_id in the entered_by field and the current timestamp in entered_at
6. THE Marks_Entry_System SHALL allow partial saves so that a Teacher can enter marks for some students and return later to complete the rest
7. WHEN a Teacher updates previously entered marks for an ExamSchedule that is not locked, THE Marks_Entry_System SHALL overwrite the existing ExamResult record and update the updated_at timestamp

### Requirement 4: Marks Lock and Unlock Mechanism

**User Story:** As an Exam Controller, I want to lock marks after verification so that no further changes can be made, and unlock them if corrections are needed.

#### Acceptance Criteria

1. WHEN an Exam_Controller locks an ExamSchedule, THE Marks_Entry_System SHALL set is_marks_locked to true on that ExamSchedule record
2. WHILE an ExamSchedule has is_marks_locked set to true, THE Marks_Entry_System SHALL reject all marks entry and update requests for that ExamSchedule; IF a Teacher submits marks while an Exam_Controller is simultaneously unlocking the schedule, THEN THE Marks_Entry_System SHALL process the marks entry since the unlock action takes precedence
3. WHEN an Exam_Controller unlocks an ExamSchedule, THE Marks_Entry_System SHALL set is_marks_locked to false, allowing marks entry to resume
4. THE Marks_Entry_System SHALL allow only users with the Exam_Controller, Principal, or school_admin role to lock or unlock marks
5. WHEN marks are locked, THE Marks_Entry_System SHALL display the locked status visually on the Teacher's marks entry page with a clear indication that editing is disabled

### Requirement 5: Auto-Status Update After Exam Completion

**User Story:** As an Exam Controller, I want the exam status to automatically update to completed when the exam time passes, so that I have accurate real-time status without manual intervention.

#### Acceptance Criteria

1. WHEN the current date and time exceeds the exam_date and end_time of an ExamSchedule, THE Marks_Entry_System SHALL mark the parent Exam status as completed if all its ExamSchedules have passed their end_time
2. WHEN at least one ExamSchedule under an Exam has not yet passed its end_time, THE Marks_Entry_System SHALL retain the Exam status as ongoing
3. THE Marks_Entry_System SHALL execute the auto-status check either via a scheduled background job or on-demand when the Exam_Controller views the exam dashboard

### Requirement 6: Marks Submission Deadline Tracking

**User Story:** As an Exam Controller, I want to set and track deadlines for marks submission per subject, so that I can ensure timely completion of results processing.

#### Acceptance Criteria

1. WHEN an Exam_Controller sets a deadline for an ExamSchedule, THE Marks_Entry_System SHALL store the deadline_date in the MarksEntryDeadline record associated with that exam, class, and subject
2. WHEN the current date and time exceeds the deadline_date and auto_lock is enabled, THE Marks_Entry_System SHALL immediately lock the corresponding ExamSchedule by setting is_marks_locked to true, regardless of whether all teachers have submitted marks
3. WHILE a deadline is approaching (within 24 hours) AND the Teacher has incomplete mark submissions for that subject, THE Marks_Entry_System SHALL display a warning indicator on the Teacher's marks entry dashboard
4. WHEN a Teacher has not submitted any marks and the deadline has passed, THE Marks_Entry_System SHALL flag that assignment as overdue on the Exam_Controller's dashboard

### Requirement 7: Exam Controller Marks Entry Dashboard

**User Story:** As an Exam Controller, I want a dashboard showing marks entry progress across all subjects and teachers, so that I can monitor completion and take action on pending entries.

#### Acceptance Criteria

1. WHEN an Exam_Controller opens the marks entry dashboard for an exam, THE Marks_Entry_System SHALL display each ExamSchedule with: assigned teacher name, subject name, class name, section name, total students, marks entered count, pending count, percentage completion, lock status, and deadline status
2. THE Marks_Entry_System SHALL categorize each ExamSchedule entry status as one of: not_started, in_progress, completed, locked, or overdue
3. WHEN an Exam_Controller filters the dashboard by class, section, or subject, THE Marks_Entry_System SHALL display only matching ExamSchedule records
4. THE Marks_Entry_System SHALL display summary statistics including total schedules, completed count, pending count, and overdue count at the top of the dashboard

### Requirement 8: Bulk Marks Entry Assignment

**User Story:** As an Exam Controller, I want to assign marks entry permissions in bulk for an entire exam, so that I do not have to assign each subject individually.

#### Acceptance Criteria

1. WHEN an Exam_Controller triggers bulk assignment for an exam, THE Marks_Entry_System SHALL match all ExamSchedules under that exam with corresponding active TeacherSubject_Allocation records and create Marks_Entry_Assignments for all matches
2. WHEN bulk assignment completes, THE Marks_Entry_System SHALL return a summary showing: total schedules processed, successfully assigned count, and unassigned count with details of unmatched ExamSchedules
3. IF a Marks_Entry_Assignment already exists for an ExamSchedule, THEN THE Marks_Entry_System SHALL skip that ExamSchedule during bulk assignment without overwriting the existing assignment

### Requirement 9: Grade Auto-Calculation

**User Story:** As a Teacher, I want grades to be automatically calculated based on the grading system when I enter marks, so that I do not have to manually assign grades.

#### Acceptance Criteria

1. WHEN marks are saved for a student, THE Marks_Entry_System SHALL calculate the percentage as (marks_obtained / max_marks) * 100
2. WHEN a GradingSystem is associated with the Exam, THE Marks_Entry_System SHALL determine the grade and grade_point based on the percentage and the grading system's grade ranges
3. THE Marks_Entry_System SHALL always store marks_obtained and percentage regardless of whether a GradingSystem is associated with the Exam; IF no GradingSystem is associated, THEN no grade or grade_point SHALL be assigned

### Requirement 10: Student Dashboard Marks Visibility

**User Story:** As a Student, I want to see my exam marks on my dashboard after the marks are locked, so that I can track my academic performance.

#### Acceptance Criteria

1. WHEN an ExamSchedule has is_marks_locked set to true, THE Marks_Entry_System SHALL make the corresponding ExamResult records visible on the Student's dashboard for students belonging to that class and section
2. WHILE an ExamSchedule has is_marks_locked set to false, THE Marks_Entry_System SHALL NOT display marks to students even if marks have been entered (marks are only visible after lock)
3. WHEN a Student views their dashboard, THE Marks_Entry_System SHALL display locked marks grouped by exam name, showing: subject name, marks obtained, max marks, percentage, grade (if calculated), and pass/fail status
4. WHEN a Parent views their child's portal, THE Marks_Entry_System SHALL display the same locked marks data only when those marks are also visible to the Student
5. THE Marks_Entry_System SHALL display marks in chronological order by exam date, with the most recent exam results shown first
