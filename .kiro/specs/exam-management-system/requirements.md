# Requirements Document

## Introduction

This document defines the complete requirements for the Exam Management System within the School CRM platform. The system covers the entire exam lifecycle from planning and scheduling through result publication and post-result operations. It is designed for Indian schools following CBSE/State Board patterns, supporting Classes 1-12 with multiple sections and subjects. The system integrates with existing models (Exam, ExamSchedule, ExamResult, ExamHall, ExamSeating, ExamInvigilator, ExamAdmitCard, ReportCard, ExamIncident, MarkEntry, GradingSystem, Grade) and introduces new models for question paper management, date sheet publishing, marks entry deadlines, grace marks, re-examinations, and notifications.

## Glossary

- **Exam_Controller**: A staff member with the role of managing all exam operations including creation, scheduling, hall allocation, invigilator assignment, marks tracking, and result processing
- **Principal**: The school head who approves date sheets, question papers, grace marks, and final results before publication
- **Teacher**: A staff member responsible for uploading question papers, invigilating exams, and entering marks for assigned subjects
- **Student**: A learner enrolled in a class and section who appears for exams and views results
- **Parent**: A guardian of a student who views date sheets, results, and can raise grievances
- **Exam_System**: The backend application (Flask + SQLAlchemy) that processes exam lifecycle operations
- **Portal**: The React frontend application through which users interact with the system
- **Date_Sheet**: A published schedule showing Subject, Date, Time, and Max Marks for each class in an exam
- **Question_Paper**: A PDF document uploaded by a teacher containing exam questions for a specific subject and class
- **Seating_Chart**: A grid layout (Row × Column) showing student seat assignments in an exam hall
- **Admit_Card**: A document containing student identity, exam schedule, and hall/seat allocation for an exam
- **Report_Card**: A document summarizing a student's performance across all subjects in an exam including grades, ranks, and remarks
- **Marks_Entry**: The process of recording marks obtained by students in each subject component
- **Grace_Marks**: Additional marks added by the Principal to student scores as moderation
- **UFM**: Unfair Means — a case where a student is caught using prohibited methods during an exam
- **Compartment**: A status where a student fails in 1-2 subjects and is allowed to appear in a re-examination
- **Detained**: A status where a student fails in 3 or more subjects and must repeat the academic year
- **Re_Exam**: A supplementary examination conducted for compartment students, improvement candidates, or rescheduled papers
- **HOD**: Head of Department — a senior teacher who reviews question papers before submission to Exam Controller
- **Invigilator**: A teacher assigned to supervise students during an exam in a specific hall
- **Exam_Notification**: An automated alert or reminder sent to users regarding exam-related deadlines and events
- **Shift**: A time slot (Morning or Afternoon) during which exams are conducted on a given day

## Requirements

### Requirement 1: Exam Creation and Planning

**User Story:** As an Exam Controller, I want to create and configure exams with type, date range, and class groups, so that the exam lifecycle can be initiated and tracked.

#### Acceptance Criteria

1. WHEN the Exam Controller submits exam details (name, exam type, start date, end date, classes involved, academic year), THE Exam_System SHALL create a new exam record with status "upcoming"
2. THE Exam_System SHALL support the following exam types: Unit Test, Mid Term, Half Yearly, Annual, Practical, Pre-Board, and Board Practice
3. WHEN the Exam Controller specifies class groups, THE Exam_System SHALL associate the exam with one or more classes (e.g., "Class 9-10" or "Class 1-5")
4. THE Exam_System SHALL enforce that start_date is before or equal to end_date for every exam
5. THE Exam_System SHALL enforce that exam name is unique within the same academic year and school
6. WHEN the Exam Controller edits an exam with status "upcoming", THE Exam_System SHALL allow modification of all exam fields
7. WHEN the Exam Controller attempts to edit an exam with status "ongoing" or "completed", THE Exam_System SHALL restrict modifications to description and instructions only
8. WHEN the Exam Controller deletes an exam with status "upcoming" and no associated schedules, THE Exam_System SHALL remove the exam record
9. IF the Exam Controller attempts to delete an exam with existing schedules or results, THEN THE Exam_System SHALL reject the deletion and return an error message indicating dependent records exist

### Requirement 2: Date Sheet Creation and Approval

**User Story:** As an Exam Controller, I want to create date sheets specifying subject-wise exam dates and times per class, so that students and teachers know the exam schedule.

#### Acceptance Criteria

1. WHEN the Exam Controller creates a date sheet entry, THE Exam_System SHALL record the exam_id, class_id, subject_id, exam_date, start_time, end_time, max_marks, and passing_marks
2. THE Exam_System SHALL support different schedules for different classes within the same exam
3. THE Exam_System SHALL support Morning shift (before 12:00) and Afternoon shift (12:00 onwards) for the same exam date
4. WHEN the Exam Controller submits a date sheet for approval, THE Exam_System SHALL set the date sheet status to "pending_approval" and notify the Principal
5. WHEN the Principal approves the date sheet, THE Exam_System SHALL set the date sheet status to "approved" and make it visible to Teachers, Students, and Parents
6. WHEN the Principal rejects the date sheet, THE Exam_System SHALL set the status to "rejected" and include rejection remarks for the Exam Controller
7. IF the Exam Controller creates two exam schedules for the same class on the same date and same time slot, THEN THE Exam_System SHALL reject the entry and return a conflict error
8. THE Exam_System SHALL validate that exam dates fall within the exam start_date and end_date range
9. WHEN a Student or Parent requests the date sheet, THE Exam_System SHALL return only approved date sheets for the student's class
10. THE Exam_System SHALL generate a downloadable PDF of the approved date sheet grouped by class

### Requirement 3: Question Paper Management

**User Story:** As a Teacher, I want to upload question papers for my assigned subjects, so that the Exam Controller can collect and manage all papers before the exam.

#### Acceptance Criteria

1. WHEN a Teacher uploads a question paper, THE Exam_System SHALL store the file (PDF format, maximum 5MB) with metadata: subject_id, class_id, exam_id, max_marks, duration, and instructions
2. THE Exam_System SHALL restrict question paper uploads to Teachers assigned to the respective subject and class
3. THE Exam_System SHALL support multiple paper sets (Set A, Set B) for the same subject and class
4. WHEN a Teacher submits a question paper, THE Exam_System SHALL set the paper status to "submitted" and notify the HOD for review
5. WHEN the HOD approves the question paper, THE Exam_System SHALL set the status to "hod_approved" and notify the Exam Controller
6. WHEN the Exam Controller collects the paper, THE Exam_System SHALL set the status to "collected"
7. WHERE the Principal approval option is enabled, THE Exam_System SHALL require Principal approval before marking the paper as "final_approved"
8. THE Exam_System SHALL restrict question paper visibility to Exam Controller, HOD, Principal, and the uploading Teacher only
9. WHEN the Exam Controller views the paper tracking dashboard, THE Exam_System SHALL display submission status (submitted, pending, hod_approved, collected, final_approved) for each subject and class
10. WHEN a paper submission deadline passes with pending papers, THE Exam_System SHALL send reminder notifications to the respective Teachers
11. IF a Student or Parent attempts to access question papers, THEN THE Exam_System SHALL deny access and return an authorization error

### Requirement 4: Hall and Seating Arrangement

**User Story:** As an Exam Controller, I want to assign halls and generate seating arrangements for each exam day, so that students know where to sit and supervision is organized.

#### Acceptance Criteria

1. WHEN the Exam Controller assigns a hall to an exam schedule, THE Exam_System SHALL validate that the hall capacity is sufficient for the number of students
2. THE Exam_System SHALL support three seating arrangement modes: Roll Number Order, Random, and Mixed (students from different classes in the same hall)
3. WHEN the Exam Controller generates a seating arrangement, THE Exam_System SHALL assign each student a specific seat with row_number and column_number based on the selected mode
4. THE Exam_System SHALL generate a printable seating chart displaying the hall layout as a grid with student names and roll numbers
5. IF the number of students exceeds the total capacity of assigned halls for an exam schedule, THEN THE Exam_System SHALL display a warning indicating insufficient seating capacity
6. WHEN a Student views their exam details on the Portal, THE Exam_System SHALL display the assigned hall name and seat number for each scheduled exam
7. THE Exam_System SHALL prevent assigning the same seat to multiple students in the same hall for the same exam schedule
8. WHEN the Exam Controller regenerates seating for an exam schedule, THE Exam_System SHALL replace the previous seating arrangement entirely

### Requirement 5: Invigilator Duty Assignment

**User Story:** As an Exam Controller, I want to assign teachers as invigilators with specific roles and schedules, so that each exam hall is properly supervised.

#### Acceptance Criteria

1. WHEN the Exam Controller assigns an invigilator, THE Exam_System SHALL record the staff_id, exam_schedule_id, hall_id, and role (Chief Invigilator, Assistant Invigilator, or Relief/Flying Squad)
2. THE Exam_System SHALL validate that a subject teacher is not assigned as invigilator for their own subject's exam
3. IF the Exam Controller assigns a teacher who is already assigned to another hall for the same exam schedule, THEN THE Exam_System SHALL reject the assignment and return a conflict error
4. WHEN a Teacher views their portal, THE Exam_System SHALL display their invigilator duty schedule showing date, time, hall, and role
5. WHEN the Exam Controller requests a duty swap due to teacher leave, THE Exam_System SHALL allow reassignment of the invigilator to a different available teacher
6. THE Exam_System SHALL ensure at least one Chief Invigilator is assigned to each hall for every exam schedule
7. THE Exam_System SHALL generate a printable duty chart showing all invigilator assignments grouped by date and hall

### Requirement 6: Admit Card Generation

**User Story:** As an Exam Controller, I want to generate admit cards for all students appearing in an exam, so that students have official documentation for exam entry.

#### Acceptance Criteria

1. WHEN the Exam Controller triggers admit card generation for a class, THE Exam_System SHALL create admit card records for all active students in that class with status "generated"
2. THE Exam_System SHALL include on each admit card: student photo, full name, roll number, class, section, exam schedule (subject, date, time), and hall/seat allocation
3. THE Exam_System SHALL support bulk generation (all students in a class) and individual generation
4. THE Exam_System SHALL generate downloadable PDF admit cards (individual and bulk as a combined PDF)
5. WHEN a Student accesses their portal, THE Exam_System SHALL allow downloading their admit card with status "generated" or "issued"
6. WHEN the Exam Controller revokes an admit card (for disciplinary reasons), THE Exam_System SHALL set the status to "revoked" and the student SHALL no longer be able to download the admit card
7. IF admit card generation is triggered before hall/seat allocation is complete, THEN THE Exam_System SHALL generate the admit card without seat details and mark it as "partial"

### Requirement 7: Exam Day Attendance

**User Story:** As an Invigilator, I want to mark student attendance for each exam, so that absent students are recorded and tracked.

#### Acceptance Criteria

1. WHEN an Invigilator marks attendance for an exam schedule, THE Exam_System SHALL record each student as "present" or "absent" for that specific exam
2. THE Exam_System SHALL pre-populate the attendance list with all students assigned to the hall for that exam schedule
3. WHEN a student is marked absent, THE Exam_System SHALL automatically set is_absent to true in the corresponding ExamResult record
4. THE Exam_System SHALL allow the Exam Controller to view a consolidated attendance report showing present/absent counts per exam schedule
5. IF attendance is submitted after the exam end_time plus 60 minutes, THEN THE Exam_System SHALL still accept the submission but flag it as "late_entry"

### Requirement 8: Exam Incident Reporting

**User Story:** As an Invigilator, I want to report incidents during exams such as cheating or medical emergencies, so that appropriate action can be documented and taken.

#### Acceptance Criteria

1. WHEN an Invigilator reports an incident, THE Exam_System SHALL record the exam_schedule_id, student_id (if applicable), hall_id, incident type, description, severity, and action taken
2. THE Exam_System SHALL support incident types: cheating, disruption, unfair_means, medical, paper_leak, and other
3. THE Exam_System SHALL support severity levels: low, medium, high, and critical
4. WHEN an incident of type "unfair_means" is reported with severity "high" or "critical", THE Exam_System SHALL flag the student's result for that exam schedule as "withheld"
5. WHEN an incident of type "paper_leak" is reported, THE Exam_System SHALL notify the Exam Controller and Principal immediately
6. THE Exam_System SHALL allow the Exam Controller to view all incidents filtered by exam, date, type, and severity
7. WHEN a UFM case is confirmed, THE Exam_System SHALL mark the student's marks as cancelled for that specific paper and set remarks to "UFM - Marks Cancelled"

### Requirement 9: Marks Entry and Collection

**User Story:** As a Teacher, I want to enter marks for students in my assigned subjects within the deadline, so that results can be processed on time.

#### Acceptance Criteria

1. WHEN a Teacher enters marks, THE Exam_System SHALL record marks_obtained for each student per exam_schedule, supporting component-wise entry (Theory, Practical, Internal Assessment)
2. THE Exam_System SHALL restrict marks entry to Teachers assigned to the respective subject and class
3. THE Exam_System SHALL validate that marks_obtained does not exceed max_marks for any component
4. WHEN a student was absent, THE Exam_System SHALL allow the Teacher to mark the student as "AB" (absent) instead of entering marks
5. THE Exam_System SHALL enforce marks entry deadlines set by the Exam Controller per exam and subject
6. IF a Teacher attempts to enter marks after the deadline and the marks are locked, THEN THE Exam_System SHALL reject the entry and display a "marks locked" message
7. WHEN the Exam Controller locks marks for a subject, THE Exam_System SHALL prevent any further modifications by Teachers
8. WHEN the Exam Controller unlocks marks for a subject, THE Exam_System SHALL allow Teachers to resume editing within the new deadline
9. THE Exam_System SHALL display a marks entry tracking dashboard showing: subjects with completed entry, subjects with pending entry, and days remaining until deadline
10. WHEN a marks entry deadline is approaching (2 days remaining), THE Exam_System SHALL send reminder notifications to Teachers with pending entries
11. WHEN a marks entry deadline passes with pending entries, THE Exam_System SHALL escalate to the Principal with a list of non-compliant Teachers

### Requirement 10: Grace Marks and Moderation

**User Story:** As a Principal, I want to add grace marks or apply moderation to student scores, so that results can be adjusted fairly before publication.

#### Acceptance Criteria

1. WHEN the Principal applies grace marks, THE Exam_System SHALL record the exam_id, subject_id (optional for all subjects), class_id, grace_marks_value, reason, and applied_by
2. THE Exam_System SHALL support grace marks application at three levels: all students in a class, all students in a subject, or individual students
3. WHEN grace marks are applied, THE Exam_System SHALL add the grace marks value to each affected student's marks_obtained without exceeding max_marks
4. THE Exam_System SHALL maintain an audit trail of all grace marks applications including who applied, when, and the reason
5. IF grace marks would cause a student's total to exceed max_marks, THEN THE Exam_System SHALL cap the marks at max_marks
6. THE Exam_System SHALL restrict grace marks application to the Principal role only

### Requirement 11: Result Processing and Calculation

**User Story:** As an Exam Controller, I want the system to automatically calculate totals, percentages, grades, and ranks, so that results are processed accurately and consistently.

#### Acceptance Criteria

1. WHEN the Exam Controller triggers result processing for an exam, THE Exam_System SHALL calculate total_marks, percentage, and grade for each student based on the configured grading system
2. THE Exam_System SHALL calculate ranks at three levels: section-wise, class-wise, and overall for the exam
3. THE Exam_System SHALL determine pass/fail status based on passing_marks configured for each subject
4. WHEN a student fails in 1 or 2 subjects, THE Exam_System SHALL set the result_status to "compartment"
5. WHEN a student fails in 3 or more subjects, THE Exam_System SHALL set the result_status to "fail" (detained)
6. THE Exam_System SHALL generate subject-wise analysis: average marks, highest marks, lowest marks, and pass percentage per subject per class
7. THE Exam_System SHALL generate a class-wise performance comparison showing overall pass percentage and average percentage per class
8. THE Exam_System SHALL generate a topper list (top 3 students) per class and per section
9. WHEN component-wise marks exist (Theory + Practical + Internal), THE Exam_System SHALL calculate the weighted total based on component weightage
10. THE Exam_System SHALL handle absent students by excluding them from rank calculations while marking their result_status appropriately

### Requirement 12: Report Card Generation

**User Story:** As an Exam Controller, I want to generate report cards with complete academic performance details, so that students and parents receive formal result documentation.

#### Acceptance Criteria

1. WHEN the Exam Controller triggers report card generation, THE Exam_System SHALL create report card records with status "draft" containing: all subject marks, grades, total, percentage, rank, attendance percentage, and result status
2. THE Exam_System SHALL include teacher remarks and principal remarks fields on each report card
3. THE Exam_System SHALL support bulk generation (class-wise) and individual report card generation
4. THE Exam_System SHALL generate downloadable PDF report cards using the school's configured template (including school logo and format)
5. THE Exam_System SHALL support report card statuses: draft, published, and archived
6. WHEN the Exam Controller publishes report cards, THE Exam_System SHALL change status from "draft" to "published" and make them accessible to Students and Parents
7. THE Exam_System SHALL support PDF download of individual report cards and bulk download as a combined PDF per class

### Requirement 13: Result Approval and Publication

**User Story:** As a Principal, I want to review and approve results before they are published to students and parents, so that I can verify accuracy and fairness.

#### Acceptance Criteria

1. WHEN the Exam Controller submits results for approval, THE Exam_System SHALL present the Principal with a summary: class-wise pass percentage, topper list, failure count, and compartment count
2. WHEN the Principal approves results, THE Exam_System SHALL change the exam status to "results_published" and make results visible to Students and Parents
3. WHEN the Principal rejects results, THE Exam_System SHALL return results to the Exam Controller with rejection remarks for correction
4. WHEN results are published, THE Exam_System SHALL send notifications to all Parents of students in the affected classes
5. WHEN results are published, THE Exam_System SHALL allow Students to view subject-wise marks, grades, percentage, and rank on their portal
6. WHEN results are published, THE Exam_System SHALL allow Parents to view their child's results and download the report card from their portal
7. WHILE results are in "pending_approval" status, THE Exam_System SHALL restrict result visibility to Exam Controller and Principal only

### Requirement 14: Re-Examination Management

**User Story:** As an Exam Controller, I want to schedule and manage re-examinations for compartment students, improvement candidates, and rescheduled papers, so that students get additional opportunities as per school policy.

#### Acceptance Criteria

1. WHEN the Exam Controller creates a re-examination, THE Exam_System SHALL record the original exam reference, re-exam type (compartment, supplementary, improvement, rescheduled), eligible students, and new schedule
2. THE Exam_System SHALL automatically identify compartment-eligible students (failed in 1-2 subjects) from the original exam results
3. WHEN a student appears for a re-exam, THE Exam_System SHALL update the student's marks with the re-exam score while retaining the original score for audit
4. THE Exam_System SHALL support improvement exams where a student retains the higher of original and re-exam marks
5. WHEN a paper is rescheduled due to paper leak or cancellation, THE Exam_System SHALL create a re-exam entry linked to the cancelled schedule and notify all affected students
6. THE Exam_System SHALL track re-exam status: scheduled, ongoing, completed, and results_processed
7. IF a compartment student fails the re-exam, THEN THE Exam_System SHALL update the result_status to "fail" (detained)

### Requirement 15: Exam Notifications and Reminders

**User Story:** As an Exam Controller, I want the system to send automated notifications and reminders to relevant users, so that deadlines are met and stakeholders stay informed.

#### Acceptance Criteria

1. WHEN a date sheet is approved, THE Exam_System SHALL send notifications to all Teachers, Students, and Parents of the affected classes
2. WHEN a question paper submission deadline is approaching (3 days before), THE Exam_System SHALL send reminder notifications to Teachers with pending submissions
3. WHEN a marks entry deadline is approaching (2 days before), THE Exam_System SHALL send reminder notifications to Teachers with pending entries
4. WHEN results are published, THE Exam_System SHALL send notifications to all Parents with a link to view results
5. WHEN an invigilator duty is assigned or changed, THE Exam_System SHALL notify the affected Teacher
6. WHEN a re-exam is scheduled, THE Exam_System SHALL notify eligible Students and their Parents
7. THE Exam_System SHALL support notification delivery through in-app notifications and SMS (where configured)
8. THE Exam_System SHALL maintain a notification log recording: recipient, type, message, sent_at, and delivery_status

### Requirement 16: Practical Exam Management

**User Story:** As an Exam Controller, I want to manage practical exams separately with internal and external examiners, so that practical assessments follow the required evaluation process.

#### Acceptance Criteria

1. WHEN the Exam Controller creates a practical exam schedule, THE Exam_System SHALL support assignment of both internal examiner (school teacher) and external examiner
2. THE Exam_System SHALL maintain a separate schedule for practical exams distinct from theory exams
3. THE Exam_System SHALL support component-wise marks entry for practicals: experiment/performance marks, viva marks, and record/file marks
4. WHEN both theory and practical components exist for a subject, THE Exam_System SHALL combine them using configured weightage for the final subject score
5. THE Exam_System SHALL allow the Exam Controller to schedule practical exams on different dates than theory exams for the same subject

### Requirement 17: Role-Based Access Control for Exam Operations

**User Story:** As a system administrator, I want exam operations restricted by user role, so that data integrity and confidentiality are maintained throughout the exam lifecycle.

#### Acceptance Criteria

1. THE Exam_System SHALL restrict exam creation, editing, and deletion to the Exam Controller role
2. THE Exam_System SHALL restrict date sheet approval, result approval, and grace marks application to the Principal role
3. THE Exam_System SHALL restrict question paper upload and marks entry to Teachers assigned to the respective subject and class
4. THE Exam_System SHALL restrict result and report card visibility to Students and Parents only after results are published
5. THE Exam_System SHALL restrict question paper access to Exam Controller, HOD, Principal, and the uploading Teacher
6. WHILE an exam has status "upcoming" or "ongoing", THE Exam_System SHALL restrict result data access to Exam Controller and Principal only
7. THE Exam_System SHALL allow Teachers to view only their own invigilator duties and marks entry for their assigned subjects
8. THE Exam_System SHALL allow Parents to view data only for their own children

### Requirement 18: Special Exam Scenarios

**User Story:** As an Exam Controller, I want the system to handle special scenarios like medical cases, paper leaks, and multiple exam sessions, so that all edge cases in the exam lifecycle are managed.

#### Acceptance Criteria

1. WHEN a student has a medical case during an exam, THE Exam_System SHALL support creating a special arrangement record with: extra time allowance, separate room assignment, and medical certificate reference
2. WHEN a paper leak is confirmed, THE Exam_System SHALL allow the Exam Controller to cancel the affected exam schedule and create a rescheduled exam with a new date
3. THE Exam_System SHALL support multiple exam sessions within an academic year (e.g., 4 Unit Tests + 2 Term Exams) with independent scheduling and results
4. THE Exam_System SHALL support exam groups that consolidate results from multiple exams (e.g., Term 1 = UT1 + UT2 + Half Yearly) with configurable weightage
5. WHEN a student requests an improvement exam, THE Exam_System SHALL verify the student has a previous result for the subject and create a re-exam entry of type "improvement"
6. IF a teacher does not enter marks by the deadline and escalation is triggered, THEN THE Exam_System SHALL send an escalation notification to the Principal with the teacher's name and pending subjects

### Requirement 19: Result Correction and Grievance Handling

**User Story:** As a Parent, I want to raise a grievance for marks rechecking, so that any errors in result processing can be identified and corrected.

#### Acceptance Criteria

1. WHEN a Parent raises a grievance for marks rechecking, THE Exam_System SHALL create a grievance record with: student_id, exam_schedule_id, reason, and status "pending"
2. WHEN the Exam Controller receives a grievance, THE Exam_System SHALL allow initiating a recheck process by assigning it to the respective subject Teacher
3. WHEN a marks correction is needed, THE Exam_System SHALL allow the Exam Controller to unlock the specific student's marks, apply the correction, and re-lock
4. THE Exam_System SHALL maintain an audit trail of all marks corrections including: original marks, corrected marks, corrected_by, corrected_at, and reason
5. WHEN marks are corrected, THE Exam_System SHALL automatically recalculate the student's total, percentage, grade, and rank
6. THE Exam_System SHALL update the grievance status through: pending → under_review → resolved or rejected
7. WHEN a grievance is resolved, THE Exam_System SHALL notify the Parent with the outcome

### Requirement 20: Analytics and Reporting

**User Story:** As a Principal, I want comprehensive exam analytics and reports, so that I can assess academic performance and make informed decisions.

#### Acceptance Criteria

1. THE Exam_System SHALL generate subject-wise analysis reports showing: average marks, highest marks, lowest marks, pass percentage, and grade distribution per class and section
2. THE Exam_System SHALL generate class-wise comparison reports showing overall performance metrics across all sections
3. THE Exam_System SHALL generate teacher performance reports showing: average marks in their subjects, pass percentage, and comparison with school average
4. THE Exam_System SHALL generate student progress reports showing performance trends across multiple exams in the academic year
5. THE Exam_System SHALL generate a consolidated marks sheet per class showing all students with all subject marks in a tabular format
6. THE Exam_System SHALL support exporting all reports as PDF and Excel formats
7. WHEN the Principal views the exam dashboard, THE Exam_System SHALL display: total exams conducted, overall pass percentage, top performers, and subjects needing attention (below 60% pass rate)

### Requirement 21: PDF Generation for Exam Documents

**User Story:** As an Exam Controller, I want to generate and download PDF documents for date sheets, seating charts, duty charts, admit cards, and report cards, so that physical copies can be printed and distributed.

#### Acceptance Criteria

1. THE Exam_System SHALL generate date sheet PDFs grouped by class with school header, exam name, and subject-wise schedule in tabular format
2. THE Exam_System SHALL generate seating chart PDFs showing hall layout as a grid with student names, roll numbers, and class labels
3. THE Exam_System SHALL generate invigilator duty chart PDFs grouped by date showing hall assignments and teacher names
4. THE Exam_System SHALL generate admit card PDFs with student photo, personal details, exam schedule, and hall/seat information
5. THE Exam_System SHALL generate report card PDFs using the school's template with logo, student details, subject-wise marks, grades, ranks, attendance, and remarks
6. THE Exam_System SHALL support bulk PDF generation (class-wise combined PDF) for admit cards, report cards, and marks sheets
7. THE Exam_System SHALL generate consolidated marks sheet PDFs per class in landscape format showing all students and all subjects

### Requirement 22: Marks Entry Deadline Management

**User Story:** As an Exam Controller, I want to set and enforce marks entry deadlines per subject, so that result processing is not delayed by late submissions.

#### Acceptance Criteria

1. WHEN the Exam Controller sets a marks entry deadline, THE Exam_System SHALL record the exam_id, subject_id, class_id, deadline_date, and auto_lock flag
2. WHEN the deadline_date passes and auto_lock is enabled, THE Exam_System SHALL automatically lock marks entry for the respective subject and class
3. THE Exam_System SHALL display remaining days until deadline on the Teacher's marks entry interface
4. WHEN the Exam Controller extends a deadline, THE Exam_System SHALL update the deadline_date and unlock marks if previously auto-locked
5. THE Exam_System SHALL provide a dashboard view showing all deadlines with status: upcoming, approaching (within 2 days), overdue, and completed
6. IF marks entry is incomplete when the deadline passes, THEN THE Exam_System SHALL flag the subject as "overdue" and include it in the escalation report

### Requirement 23: Random Verification of Marks

**User Story:** As an Exam Controller, I want to randomly select answer sheets for verification against entered marks, so that data entry accuracy can be validated.

#### Acceptance Criteria

1. WHEN the Exam Controller initiates random verification for a subject, THE Exam_System SHALL randomly select a configurable number of students (default 5-10) from the marks entry
2. THE Exam_System SHALL display the selected students' entered marks alongside fields for the Exam Controller to record verified marks from the physical answer sheet
3. WHEN a discrepancy is found between entered marks and verified marks, THE Exam_System SHALL flag the entry and notify the respective Teacher
4. THE Exam_System SHALL maintain a verification log recording: verified_by, verified_at, original_marks, verified_marks, and discrepancy_status
5. THE Exam_System SHALL calculate a verification accuracy percentage per Teacher based on discrepancies found

### Requirement 24: Transfer Certificate Integration

**User Story:** As an Exam Controller, I want exam results included in transfer certificates, so that students leaving the school have their academic records documented.

#### Acceptance Criteria

1. WHEN a transfer certificate is generated for a student, THE Exam_System SHALL include the student's latest exam results: subjects, marks, grades, and overall result status
2. THE Exam_System SHALL include the student's result history for all exams in the current academic year on the transfer certificate
3. IF a student has pending re-exam results, THEN THE Exam_System SHALL indicate "Result Awaited" for the pending subjects on the transfer certificate
