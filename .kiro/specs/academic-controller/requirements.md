# Requirements Document

## Introduction

The Academic Controller is a dedicated school staff role responsible for managing the broader academic operations of a school. Unlike the Exam Controller (which focuses on exam lifecycle — scheduling, halls, seating, marks, results), the Academic Controller oversees curriculum planning, subject management, timetable creation, teacher assignments, lesson plan approvals, academic calendar, promotion rules, and academic analytics. This role bridges the gap between the Principal (strategic oversight) and individual teachers (day-to-day teaching), ensuring academic standards are maintained and operations run smoothly.

## Glossary

- **Academic_Controller**: A school staff member with the `academic_controller` role who manages academic operations including curriculum, timetable, teacher assignments, and academic policies
- **Academic_Year**: A defined school year period (e.g., 2025-26) with start and end dates, containing terms/sessions
- **Term**: A subdivision of an Academic_Year (e.g., Term 1, Term 2, Term 3) used for syllabus planning and assessments
- **System**: The School CRM application backend
- **Timetable_Engine**: The module responsible for creating, validating, and managing class timetables
- **Curriculum_Module**: The module responsible for syllabus structure, lesson plans, and study materials
- **Promotion_Engine**: The module responsible for evaluating student promotion criteria and processing promotions/detentions
- **Teacher_Allocation_Module**: The module responsible for assigning teachers to subjects, classes, and sections
- **Academic_Dashboard**: The analytics and reporting interface for the Academic Controller showing key academic metrics
- **Substitution**: A temporary replacement of a teacher in a timetable slot when the assigned teacher is unavailable

## Requirements

### Requirement 1: Academic Controller Role & Authentication

**User Story:** As a school admin, I want to create an Academic Controller user with specific permissions, so that academic operations can be managed by a dedicated staff member.

#### Acceptance Criteria

1. THE System SHALL support an `academic_controller` role in the roles table with permissions granting access to the following modules: subjects, timetable, teacher assignments, syllabus, lesson plans, homework oversight, academic calendar, promotions, and academic reports
2. WHEN an Academic Controller user logs in, THE System SHALL grant access to academic management modules including subjects, timetable, teacher assignments, syllabus, lesson plans, homework oversight, academic calendar, promotions, and academic reports
3. IF an Academic Controller user attempts to access exam-specific operations (marks entry, result publishing, exam hall management, exam seating arrangement), THEN THE System SHALL deny access and return an HTTP 403 response with an error message indicating insufficient permissions
4. THE System SHALL allow the `school_admin` role to create, update, and deactivate Academic Controller users within the same school tenant
5. WHILE an Academic Controller user is inactive (is_active is false), THE System SHALL reject login attempts and API requests for that user with an HTTP 401 response indicating the account is deactivated
6. WHEN a school admin creates an Academic Controller user, THE System SHALL require at minimum: email, password (at least 6 characters), first name, and role assignment

---

### Requirement 2: Academic Year & Term Management

**User Story:** As an Academic Controller, I want to create and manage academic years and terms, so that all academic activities are organized within defined time periods.

#### Acceptance Criteria

1. WHEN the Academic Controller creates a new academic year, THE System SHALL store the name (maximum 50 characters), start date, end date, and active status, and SHALL reject the request with a validation error if the start date is not earlier than the end date
2. THE System SHALL enforce that at most one academic year is marked as `is_current` per school at any time by deactivating the previously current year when a new one is set as current
3. WHEN the Academic Controller switches the current academic year, THE System SHALL set `is_current` to false on the previously current year and set `is_current` to true on the selected year within a single atomic operation
4. WHEN the Academic Controller creates a term within an academic year, THE System SHALL validate that the term start date is on or after the academic year start date and the term end date is on or before the academic year end date, and SHALL reject the request with a validation error if either condition is not met
5. IF the Academic Controller attempts to delete an academic year that has associated exams, timetables, or student records, THEN THE System SHALL reject the deletion and return an error message indicating which association type is preventing deletion
6. IF the Academic Controller provides term dates that overlap with an existing term within the same academic year (where one term's start date falls before another term's end date and its end date falls after that term's start date), THEN THE System SHALL reject the request with a validation error
7. WHEN the Academic Controller creates a term, THE System SHALL store the term name (maximum 50 characters), start date, end date, and the parent academic year reference, and SHALL reject the request if the term start date is not earlier than the term end date
8. IF the Academic Controller attempts to create an academic year with dates that overlap an existing academic year within the same school, THEN THE System SHALL reject the request with a validation error

---

### Requirement 3: Subject Management

**User Story:** As an Academic Controller, I want to create and manage subjects with their components, so that the school's curriculum structure is well-defined.

#### Acceptance Criteria

1. WHEN the Academic Controller creates a subject, THE System SHALL store the name (maximum 100 characters), code (maximum 20 characters), type (theory/practical/both), credit hours (0.0 to 99.9), and elective status
2. WHEN the Academic Controller assigns a subject to a class, THE System SHALL create a ClassSubject record linking the subject to the specified class
3. IF the Academic Controller attempts to assign a subject that is already assigned to the same class within the same school, THEN THE System SHALL reject the assignment and display an error message indicating the subject is already assigned to that class
4. WHEN the Academic Controller deactivates a subject, THE System SHALL set the subject status to inactive, retain all historical data including past class assignments and exam results, and exclude the subject from new class assignments and timetable creation
5. WHEN the Academic Controller adds components to a subject (theory, practical, internal, project), THE System SHALL validate that the weightages of all mandatory components sum to exactly 100 percent before saving
6. IF the mandatory component weightages do not sum to 100 percent, THEN THE System SHALL reject the component configuration and display an error message indicating the current total and the required total of 100 percent
7. WHEN the Academic Controller creates an elective group for a class, THE System SHALL store the group name, minimum choices (at least 1), maximum choices (greater than or equal to minimum choices), seat limit per subject, and selection deadline
8. THE System SHALL enforce that the maximum choices value for an elective group is greater than or equal to the minimum choices value and that the minimum choices value is at least 1

---

### Requirement 4: Class-Section Management

**User Story:** As an Academic Controller, I want to manage classes and sections with class teacher assignments, so that the school's organizational structure is maintained.

#### Acceptance Criteria

1. WHEN the Academic Controller creates a class, THE System SHALL store the name (1 to 50 characters), numeric name (integer), and description (up to 255 characters), and associate the class with the current school
2. IF the Academic Controller attempts to create a class with a name that already exists within the same school, THEN THE System SHALL reject the request and display an error message indicating the class name is already in use
3. WHEN the Academic Controller creates a section within a class, THE System SHALL link the section to the parent class and set the section capacity to a default of 40 students
4. WHEN the Academic Controller assigns a class teacher to a section, THE System SHALL update the Section record's class_teacher_id and set the corresponding TeacherSubject record's `is_class_teacher` field to true
5. THE System SHALL enforce that each section has at most one class teacher at any given time by rejecting any assignment that would result in a second class teacher for the same section
6. IF the Academic Controller attempts to assign a teacher who is already a class teacher of another section, THEN THE System SHALL display a warning indicating which section the teacher is currently assigned to as class teacher, and require explicit confirmation before proceeding with the reassignment
7. WHEN the Academic Controller views student count per section, THE System SHALL display the count of active students enrolled in each section alongside the section's configured capacity

---

### Requirement 5: Timetable Management

**User Story:** As an Academic Controller, I want to create and manage class timetables with conflict detection, so that classes run smoothly without scheduling conflicts.

#### Acceptance Criteria

1. WHEN the Academic Controller creates a timetable entry, THE System SHALL store the class, section, subject, teacher, day of week (monday through saturday), start time (HH:MM format), end time (HH:MM format), room number (up to 20 characters), period number (1–20), and academic year reference
2. WHEN the Academic Controller saves a timetable entry, THE Timetable_Engine SHALL check for time overlap (where the new entry's start time is before an existing entry's end time AND the new entry's end time is after an existing entry's start time on the same day) and reject the entry with an error message indicating the conflict if the same teacher is already assigned to another class during the overlapping time
3. WHEN the Academic Controller saves a timetable entry, THE Timetable_Engine SHALL check for time overlap on the same day and reject the entry with an error message indicating the room conflict if the same room is already assigned to another class-section during the overlapping time
4. WHEN the Academic Controller saves a timetable entry, THE Timetable_Engine SHALL reject the entry with an error message indicating the scheduling conflict if the same class-section already has a subject scheduled during the overlapping time on the same day
5. WHEN the Academic Controller creates a break period, THE System SHALL store the timetable entry with is_break set to true, requiring only class, section, day of week, start time, end time, and period number (subject and teacher are not required for break entries)
6. WHEN the Academic Controller requests a substitution, THE System SHALL allow assigning a different teacher to an existing timetable slot for a specific date (which must be a current or future date) without modifying the permanent timetable, and SHALL reject the assignment if the substitute teacher is already assigned to another class or substitution during the same period on that date
7. WHEN the Academic Controller requests a teacher's weekly workload, THE System SHALL return the total count of non-break timetable periods assigned to that teacher across all classes and sections for the active academic year
8. WHEN the Academic Controller copies a timetable from one academic year to another, THE System SHALL duplicate all timetable entries (excluding substitution assignments) with the new academic year reference and SHALL reject the operation with an error message if the target academic year already has timetable entries for the same class-section

---

### Requirement 6: Teacher-Subject Assignment

**User Story:** As an Academic Controller, I want to assign teachers to subjects and classes, so that every class has qualified teachers for each subject.

#### Acceptance Criteria

1. WHEN the Academic Controller assigns a teacher to a subject-class-section combination, THE Teacher_Allocation_Module SHALL create a TeacherSubject record with the assigned date and active status
2. IF the Academic Controller assigns a teacher to a subject-class-section combination that already has an active TeacherSubject record for the same teacher, THEN THE Teacher_Allocation_Module SHALL reject the assignment and display an error message indicating the duplicate allocation
3. WHEN the Academic Controller assigns a teacher to a subject-class-section combination, THE Teacher_Allocation_Module SHALL require a periods_per_week value between 1 and 40
4. WHEN the Academic Controller views teacher workload, THE System SHALL display total periods per week (sum of periods_per_week from all active assignments), number of active class assignments, and number of distinct active subjects for each teacher
5. IF the Academic Controller assigns a teacher whose total weekly periods (sum of all active assignments including the new one) would exceed 30, THEN THE System SHALL display a workload warning and still allow the Academic Controller to confirm or cancel the assignment
6. WHEN the Academic Controller deactivates a teacher-subject assignment, THE System SHALL set the status to `inactive` and retain the historical record
7. WHEN the Academic Controller bulk-assigns a teacher to multiple class-section combinations for the same subject, THE System SHALL create one TeacherSubject record per class-section combination (up to a maximum of 20 combinations per request) and skip any combinations that already have an active assignment for that teacher, reporting the count of created and skipped records

---

### Requirement 7: Academic Calendar Management

**User Story:** As an Academic Controller, I want to plan and manage the academic calendar, so that all stakeholders are aware of important dates, holidays, and events.

#### Acceptance Criteria

1. WHEN the Academic Controller creates a calendar event, THE System SHALL store the title (maximum 255 characters), description, event type, start date, end date, start time, end time, holiday flag, and target audience (all, students, staff, or specific class)
2. THE System SHALL support event types: holiday, exam, ptm, event, cultural, sports, meeting, deadline, vacation, and other
3. WHEN the Academic Controller marks an event with `notify_parents` as true, THE System SHALL trigger a notification to parents of affected students within 60 seconds of event creation
4. WHEN the Academic Controller creates a recurring event, THE System SHALL store the recurrence pattern (weekly, monthly, or yearly) and generate event instances up to the end of the associated academic year or up to a maximum of 52 instances, whichever comes first
5. THE System SHALL allow the Academic Controller to filter calendar events by academic year, event type, month/year, and class
6. IF the Academic Controller schedules an event on a date already marked as a holiday, THEN THE System SHALL display a conflict warning before saving, and allow the Academic Controller to proceed or cancel
7. IF the Academic Controller sets target audience to "specific class" without selecting a class, THEN THE System SHALL reject the event creation and display an error message indicating that a class must be selected
8. IF the Academic Controller provides an end date that is earlier than the start date, THEN THE System SHALL reject the event and display an error message indicating that the end date must be on or after the start date

---

### Requirement 8: Syllabus & Curriculum Oversight

**User Story:** As an Academic Controller, I want to define syllabus structure and track completion progress, so that curriculum delivery stays on schedule.

#### Acceptance Criteria

1. WHEN the Academic Controller creates a syllabus entry, THE Curriculum_Module SHALL store the class, subject, academic year, chapter number (1 to 99), chapter name (maximum 255 characters), topics, learning objectives, estimated hours (0.5 to 999.9), and term assignment (term1, term2, term3, or annual)
2. THE System SHALL display syllabus completion percentage per subject per class to the Academic Controller, calculated as the sum of percentage_covered values from teacher-reported SyllabusProgress records for that subject-class combination divided by the total number of syllabus entries, capped at 100 percent
3. IF syllabus completion for a subject-class combination is below 70 percent AND less than 30 calendar days remain before the term end date, THEN THE System SHALL display an "at risk" indicator on the Academic Dashboard next to the corresponding subject-class entry
4. THE System SHALL allow the Academic Controller to set the syllabus status (not_started, in_progress, completed) for tracking purposes
5. THE System SHALL allow the Academic Controller to define syllabus entries for all terms (term1, term2, term3, annual) within an academic year by selecting the academic year once and adding entries across multiple terms without re-selecting the academic year
6. IF the Academic Controller attempts to create a syllabus entry with a chapter number that already exists for the same class, subject, term, and academic year combination, THEN THE System SHALL reject the entry and display an error message indicating a duplicate chapter number

---

### Requirement 9: Lesson Plan Approval

**User Story:** As an Academic Controller, I want to review and approve teacher lesson plans, so that teaching quality and curriculum alignment are maintained.

#### Acceptance Criteria

1. WHEN a teacher submits a lesson plan that has status `draft` or `revision_needed`, THE System SHALL change the lesson plan status to `submitted`, record the submission timestamp, and make it visible to the Academic Controller in the pending approvals list
2. IF a teacher attempts to submit a lesson plan that has status `approved`, `submitted`, or `rejected`, THEN THE System SHALL reject the request with a validation error indicating the current status does not allow submission
3. WHEN the Academic Controller approves a lesson plan that has status `submitted`, THE System SHALL set the status to `approved`, record the approver ID, and set the approval timestamp
4. WHEN the Academic Controller rejects a lesson plan that has status `submitted`, THE System SHALL set the status to `rejected`, record the rejection reason (minimum 10 characters, maximum 1000 characters), and send an in-app notification to the teacher indicating the plan was rejected
5. WHEN the Academic Controller requests revision of a lesson plan that has status `submitted`, THE System SHALL set the status to `revision_needed` and record feedback comments (minimum 10 characters, maximum 1000 characters)
6. IF the Academic Controller attempts to approve, reject, or request revision of a lesson plan that does not have status `submitted`, THEN THE System SHALL reject the request with a validation error indicating only submitted plans can be reviewed
7. WHEN a teacher resubmits a lesson plan that has status `revision_needed`, THE System SHALL change the status to `submitted`, clear the previous rejection reason, and reset the approval timestamp to null
8. THE System SHALL allow the Academic Controller to filter lesson plans by status (draft, submitted, approved, rejected, revision_needed), teacher, class, subject, and date range (based on the lesson plan date field)
9. THE System SHALL display lesson plan submission statistics per teacher on the Academic Dashboard including total submitted count, approved count, and pending count (plans with status `submitted` or `revision_needed`)

---

### Requirement 10: Homework & Assignment Oversight

**User Story:** As an Academic Controller, I want to monitor homework patterns across classes, so that student workload is balanced and quality is maintained.

#### Acceptance Criteria

1. THE System SHALL allow the Academic Controller to view all homework assignments across classes with filters for class, section, subject, teacher, date range, and status (draft, published, closed, archived)
2. WHEN the Academic Controller views homework analytics for a selected date range, THE System SHALL display total homework count, average submission count per homework, and late submission percentage (number of late submissions divided by total submissions, multiplied by 100) per class
3. THE System SHALL allow the Academic Controller to view homework frequency per subject per class measured as the number of assignments per week within the selected date range, to identify over-assignment (more than 5 assignments per subject per week) or under-assignment (fewer than 1 assignment per subject per week) patterns
4. IF a class has more than 3 homework assignments due on the same date, THEN THE System SHALL flag this as a workload concern on the Academic_Dashboard
5. THE System SHALL allow the Academic Controller to view for each homework assignment: the submission rate (number of submissions divided by total enrolled students in the assigned class-section, expressed as a percentage) and grading completion status (number of submissions with status "graded" or "returned" divided by total submissions, expressed as a percentage)
6. IF the Academic Controller applies filters that return no homework records, THEN THE System SHALL display an empty-state message indicating no homework matches the selected criteria

---

### Requirement 11: Promotion & Detention Rules

**User Story:** As an Academic Controller, I want to define promotion criteria and process student promotions, so that students are advanced or retained based on clear academic standards.

#### Acceptance Criteria

1. WHEN the Academic Controller defines promotion criteria for a class, THE Promotion_Engine SHALL store the minimum attendance percentage (0 to 100), minimum overall percentage (0 to 100), minimum subject pass count, maximum failed subjects allowed for compartment (1 to 5), and any mandatory subject pass requirements
2. WHEN the Academic Controller initiates the promotion process for a class, THE Promotion_Engine SHALL evaluate each student against the defined criteria using the final/annual exam results for the current academic year and generate a promotion recommendation: "promote" if all criteria are met, "compartment" if failed subjects do not exceed the maximum allowed for compartment and all mandatory subjects are passed, or "detain" otherwise
3. WHEN the Academic Controller overrides an individual promotion recommendation, THE System SHALL require a reason of at least 10 characters and store the override with the original recommendation, new recommendation, reason, and the Academic Controller's identity
4. WHEN the Academic Controller confirms promotions, THE System SHALL update promoted students' records with the new class and section for the next academic year, and retain detained students in their current class and section
5. IF a student does not meet the minimum attendance requirement, THEN THE Promotion_Engine SHALL flag the student as ineligible for promotion regardless of academic marks and assign a "detain" recommendation
6. WHEN the Academic Controller confirms promotions for a class, THE System SHALL generate a promotion summary report showing total students promoted, detained, and given compartment, along with the count of overrides applied
7. IF the Academic Controller initiates the promotion process for a class that has no promotion criteria defined, THEN THE System SHALL reject the request with a validation error indicating that promotion criteria must be configured first
8. IF the Academic Controller initiates the promotion process for a class where final exam results are not yet published, THEN THE System SHALL reject the request with a validation error indicating that exam results must be published before processing promotions

---

### Requirement 12: Academic Policies Configuration

**User Story:** As an Academic Controller, I want to configure academic policies like grading rules and attendance requirements, so that consistent standards are applied across the school.

#### Acceptance Criteria

1. WHEN the Academic Controller configures a grading system, THE System SHALL store the grading type (percentage/GPA/CGPA/letter/marks), grade definitions with min-max ranges (each between 0.00 and 100.00), grade points (0.0 to 10.0), and a pass/fail indicator per grade definition
2. WHEN the Academic Controller configures grade definitions within a grading system, THE System SHALL validate that grade ranges do not overlap and that each grade name is at most 10 characters
3. THE System SHALL allow the Academic Controller to set exactly one default grading system for the school, and WHEN a new default is set, THE System SHALL remove the default designation from the previously default grading system
4. WHEN the Academic Controller sets minimum attendance percentage for exam eligibility, THE System SHALL store this threshold as a value between 1 and 100 per academic year
5. THE System SHALL allow the Academic Controller to configure working days by selecting specific days of the week (Monday through Saturday), storing between 1 and 6 selected days
6. WHEN the Academic Controller updates a grading system, THE System SHALL apply changes only to exams with status "upcoming" and start date after the update date, and SHALL retain all existing exam results and grades unchanged
7. IF the Academic Controller attempts to delete a grading system that is currently set as the default or is assigned to an exam with status "ongoing" or "completed", THEN THE System SHALL reject the deletion and display an error message indicating the grading system is in use

---

### Requirement 13: Academic Reports & Analytics

**User Story:** As an Academic Controller, I want to view academic performance reports and trends, so that I can make data-driven decisions to improve academic outcomes.

#### Acceptance Criteria

1. THE Academic_Dashboard SHALL display a summary of metrics for the current academic year including: average percentage across all subjects and classes, subject-wise pass percentage (students scoring at or above passing marks), syllabus completion rate as a percentage of chapters marked completed versus total chapters, and teacher workload distribution showing the number of assigned periods per teacher per week
2. WHEN the Academic Controller requests a class performance report by selecting a class, section, and exam, THE System SHALL generate subject-wise average marks, count of students who passed and failed per subject, grade distribution showing the count of students in each grade bracket, and a comparison table showing the same class's average percentage in the immediately preceding term's exam of the same type
3. WHEN the Academic Controller requests a teacher performance report by selecting a teacher, THE System SHALL display syllabus completion rate as a percentage of chapters marked completed for the current academic year, lesson plan submission rate as the ratio of submitted or approved lesson plans to total scheduled teaching days, homework count assigned per month, and average student percentage in exams for subjects taught by that teacher
4. WHEN the Academic Controller selects a class and exam for cross-section comparison, THE System SHALL display a side-by-side table of each section's average percentage, pass count, and fail count for each subject, highlighting any section where the average percentage differs from the class-wide average by more than 10 percentage points
5. WHEN the Academic Controller requests trend analysis by selecting a class or subject, THE System SHALL display a term-over-term comparison for up to the last 4 terms within the current academic year, showing average percentage and pass percentage per term
6. WHEN the Academic Controller requests a PDF export for any generated report, THE System SHALL produce a downloadable PDF file containing the currently displayed report data within 30 seconds
7. IF the System has insufficient data to generate a requested report (no exam results published for the selected class, subject, or term), THEN THE System SHALL display a message indicating that no data is available for the selected filters and shall not render an empty report

---

### Requirement 14: Academic Controller Dashboard

**User Story:** As an Academic Controller, I want a dedicated dashboard showing academic operations status, so that I can quickly identify areas needing attention.

#### Acceptance Criteria

1. WHEN the Academic Controller logs in, THE System SHALL display the Academic Dashboard as the default landing page
2. THE Academic_Dashboard SHALL display the count of lesson plans with status "submitted" as pending approvals, the count of syllabus items where completion_percentage is more than 20 percentage points below the expected progress for the current point in the term as at-risk items, the count of academic calendar events with start_date within the next 7 days as upcoming events, and the count of substitute assignments with status "assigned" as pending substitution requests
3. THE Academic_Dashboard SHALL display quick-access links to the following operations: timetable management, teacher assignments, lesson plan approvals, and syllabus tracking
4. THE Academic_Dashboard SHALL display notifications for lesson plan submissions, syllabus completion updates, and promotion process status changes that occurred within the last 7 days, ordered by most recent first, limited to a maximum of 20 notifications
5. THE Academic_Dashboard SHALL allow filtering all displayed data by academic year and by term (term1, term2, term3, annual), defaulting to the current academic year (where is_current is true) and the current term based on today's date
6. IF no data exists for any dashboard section, THEN THE System SHALL display that section with a count of zero and a message indicating no items require attention
