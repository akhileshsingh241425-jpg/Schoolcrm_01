# Requirements Document

## Introduction

This feature upgrades the Teacher Portal to replace hardcoded/static data with real backend-driven functionality across five modules: Assignment System with File Upload, Marks Entry, Teacher Profile, Leave Application, and Payslip Viewing. The system integrates with existing Flask + SQLAlchemy backend models and React + MUI frontend components.

## Glossary

- **Teacher_Portal**: The React frontend application accessible at `/teacher/*` routes, used by staff members with the teacher role.
- **Assignment_System**: The module that allows teachers to create homework/assignments and students to submit responses, backed by the Homework and HomeworkSubmission models.
- **File_Upload_Service**: The backend endpoint responsible for accepting, validating, and storing file attachments for homework assignments and submissions.
- **Marks_Entry_Module**: The UI and API integration that allows teachers to enter exam marks for students in their assigned classes and subjects.
- **Teacher_Profile_Page**: The frontend page displaying real staff data (personal info, employment details, attendance, leave balance) fetched from the backend.
- **Leave_Module**: The module enabling teachers to apply for leave, view leave balance (CL, EL, SL, ML), and track leave history/status.
- **Payslip_Module**: The module displaying real payroll history and enabling PDF payslip downloads via the existing backend PDF generation endpoint.
- **Teacher_Scope**: The set of class_id, section_id, and subject_id combinations assigned to a teacher via TeacherSubject records, plus sections where the teacher is class_teacher or co_class_teacher.
- **Student_Portal**: The React frontend application accessible at `/my-portal` routes, used by students to view homework and submit assignments.

## Requirements

### Requirement 1: File Upload Endpoint

**User Story:** As a teacher or student, I want to upload file attachments for assignments, so that homework materials and submissions can include supporting documents.

#### Acceptance Criteria

1. WHEN a file upload request is received, THE File_Upload_Service SHALL accept files with MIME types of PDF, DOCX, DOC, PNG, JPG, JPEG, and XLS/XLSX.
2. WHEN a file upload request is received, THE File_Upload_Service SHALL reject files exceeding 3 MB with a 413 status code and descriptive error message.
3. WHEN a file upload request contains an unsupported MIME type, THE File_Upload_Service SHALL reject the request with a 400 status code and descriptive error message.
4. WHEN a valid file is uploaded, THE File_Upload_Service SHALL store the file in the `uploads/homework/` directory with a unique filename and return the file URL in the response.
5. THE File_Upload_Service SHALL require a valid authentication token (JWT) before processing any upload request.

### Requirement 2: Teacher Assignment Creation

**User Story:** As a teacher, I want to create homework assignments with optional file attachments for my assigned classes, so that students receive structured work with supporting materials.

#### Acceptance Criteria

1. WHEN a teacher creates an assignment, THE Assignment_System SHALL only allow creation for class_id and subject_id combinations within the Teacher_Scope.
2. WHEN a teacher creates an assignment with a file attachment, THE Assignment_System SHALL associate the uploaded file URL with the Homework record's attachment_url field.
3. THE Assignment_System SHALL display a creation form with fields for title, description, instructions, homework type, due date, max marks, and optional file attachment.
4. WHEN an assignment is created successfully, THE Assignment_System SHALL display the new assignment in the teacher's assignment list sorted by due date descending.
5. WHEN a teacher views their assignments, THE Assignment_System SHALL show submission count and allow navigation to the submissions detail view.

### Requirement 3: Student Assignment Submission

**User Story:** As a student, I want to view pending assignments and submit my work with file attachments, so that I can complete homework digitally.

#### Acceptance Criteria

1. WHEN a student views the homework tab, THE Student_Portal SHALL display pending assignments filtered by the student's current class and section.
2. THE Student_Portal SHALL provide a submission form with a text field and a file upload input for each pending assignment.
3. WHEN a student uploads a submission file, THE File_Upload_Service SHALL enforce the same 3 MB limit and allowed MIME types as teacher uploads.
4. WHEN a student submits after the due date and late submission is not allowed, THE Assignment_System SHALL reject the submission with a descriptive error message.
5. WHEN a student submits after the due date and late submission is allowed, THE Assignment_System SHALL mark the submission as late.
6. WHEN a submission is successful, THE Student_Portal SHALL display a confirmation and update the assignment status to show it has been submitted.

### Requirement 4: Teacher Grading of Submissions

**User Story:** As a teacher, I want to view student submissions and grade them, so that I can provide feedback and marks on completed work.

#### Acceptance Criteria

1. WHEN a teacher selects an assignment, THE Assignment_System SHALL display all submissions with student name, admission number, submission date, late status, and attached file link.
2. THE Assignment_System SHALL provide a grading form with fields for marks obtained, grade, and teacher remarks for each submission.
3. WHEN a teacher submits a grade, THE Assignment_System SHALL update the HomeworkSubmission record with marks_obtained, grade, teacher_remarks, graded_by, and graded_at fields.
4. WHEN grading is complete, THE Assignment_System SHALL update the submission status to "graded".

### Requirement 5: Marks Entry with Real Data

**User Story:** As a teacher, I want to enter exam marks for students in my assigned classes and subjects using real data from the backend, so that results are accurately recorded.

#### Acceptance Criteria

1. WHEN a teacher opens the marks entry page, THE Marks_Entry_Module SHALL populate class, section, and subject dropdowns with values from the Teacher_Scope (not static data).
2. WHEN a teacher selects a class, section, subject, and exam, THE Marks_Entry_Module SHALL fetch and display the student list for that combination from the backend.
3. THE Marks_Entry_Module SHALL display a table with student name, admission number, and an editable marks input field for each student.
4. WHEN a teacher submits marks, THE Marks_Entry_Module SHALL send the data to the POST /api/academics/marks/entry endpoint.
5. IF the marks entry request fails due to validation errors, THEN THE Marks_Entry_Module SHALL display specific error messages indicating which entries failed.

### Requirement 6: Teacher Profile with Real Data

**User Story:** As a teacher, I want to view my profile with real data from the backend, so that I can see accurate personal information, employment details, and attendance records.

#### Acceptance Criteria

1. WHEN the teacher profile page loads, THE Teacher_Profile_Page SHALL fetch staff data from the backend API instead of using hardcoded values.
2. THE Teacher_Profile_Page SHALL display personal information including name, email, phone, qualification, experience, and address from the Staff model.
3. THE Teacher_Profile_Page SHALL display employment details including employee_id, designation, department, date_of_joining, and PAN number from the Staff model.
4. THE Teacher_Profile_Page SHALL display attendance summary (present days, absent days, percentage) for the current academic year.
5. THE Teacher_Profile_Page SHALL display current leave balance (CL, EL, SL, ML — total and used) from the StaffLeaveBalance model.
6. THE Teacher_Profile_Page SHALL display bank details (bank_name, account_number masked, IFSC code) from the StaffSalaryStructure model.

### Requirement 7: Leave Application

**User Story:** As a teacher, I want to apply for leave from my portal, so that I can request time off and track my leave status.

#### Acceptance Criteria

1. THE Leave_Module SHALL display current leave balance showing total and used counts for CL, EL, SL, and ML leave types.
2. THE Leave_Module SHALL provide a leave application form with fields for leave type, from date, to date, reason, and optional document upload.
3. WHEN a teacher submits a leave application, THE Leave_Module SHALL send the request to POST /api/staff/leaves with the teacher's staff_id.
4. WHEN a leave application is submitted successfully, THE Leave_Module SHALL display a confirmation message and add the new entry to the leave history.
5. THE Leave_Module SHALL display leave history showing leave type, dates, days count, status (pending/approved/rejected/cancelled), and remarks.
6. WHEN the from_date is after the to_date, THE Leave_Module SHALL prevent form submission and display a validation error.
7. THE Leave_Module SHALL automatically calculate the number of days between from_date and to_date and populate the days field.

### Requirement 8: Payslip Viewing with Real Data

**User Story:** As a teacher, I want to view my payroll history with real data and download payslip PDFs, so that I can access my salary information.

#### Acceptance Criteria

1. WHEN the payroll page loads, THE Payslip_Module SHALL fetch the teacher's payroll records from the backend API instead of using hardcoded data.
2. THE Payslip_Module SHALL display a summary card showing the current month's net salary amount.
3. THE Payslip_Module SHALL display a payslip history table with columns for month/year, gross salary, deductions, net salary, payment status, and payment date.
4. WHEN a teacher clicks the download button for a paid payslip, THE Payslip_Module SHALL request the PDF from GET /api/staff/payroll/{id}/payslip and trigger a browser file download.
5. WHILE a payslip has payment_status of "pending" or "hold", THE Payslip_Module SHALL disable the download button for that entry.
