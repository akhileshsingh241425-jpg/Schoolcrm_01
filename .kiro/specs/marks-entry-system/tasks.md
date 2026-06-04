# Tasks

## Task 1: Create database models and migration for MarksEntryAssignment and MarksEntryDeadline
- [x] 1.1: Create MarksEntryAssignment model in backend/app/models/academic.py with all fields (id, school_id, exam_schedule_id, teacher_id, assigned_by, assigned_at, status, source) and relationships
- [x] 1.2: Create MarksEntryDeadline model in backend/app/models/academic.py with all fields (id, school_id, exam_schedule_id, deadline_date, auto_lock, set_by, created_at, updated_at) and relationships
- [x] 1.3: Create migration script to add marks_entry_assignments and marks_entry_deadlines tables with unique constraints and indexes

## Task 2: Create MarksEntryService with business logic
- [x] 2.1: Create backend/app/services/marks_entry_service.py with bulk_assign method that matches TeacherSubject allocations to ExamSchedules
- [x] 2.2: Add manual_assign method for single teacher-to-schedule assignment with unique constraint validation
- [x] 2.3: Add validate_marks_entry method (max_marks check, non-negative, 2 decimal places, absent handling)
- [x] 2.4: Add calculate_grade method that computes percentage and looks up grade from GradingSystem
- [x] 2.5: Add get_entry_progress method returning marks_entered count and completion percentage
- [x] 2.6: Add check_deadlines_and_lock method that finds expired auto-lock deadlines and locks schedules
- [x] 2.7: Add check_exam_completion method that updates exam status based on schedule end times
- [x] 2.8: Add get_dashboard_data method aggregating marks entry progress with filtering

## Task 3: Create marks entry assignment API routes
- [x] 3.1: Create POST /marks-entry/assignments/bulk endpoint for bulk assignment from TeacherSubject allocations
- [x] 3.2: Create POST /marks-entry/assignments endpoint for manual single assignment
- [x] 3.3: Create GET /marks-entry/assignments endpoint to list assignments for an exam with filters
- [x] 3.4: Create DELETE /marks-entry/assignments/<id> endpoint to revoke an assignment
- [x] 3.5: Create GET /marks-entry/my-assignments endpoint for teachers to get their assigned schedules with progress

## Task 4: Create deadline management API routes
- [x] 4.1: Create POST /marks-entry/deadlines endpoint for setting deadlines (bulk and individual)
- [x] 4.2: Create PUT /marks-entry/deadlines/<id> endpoint for updating a deadline
- [x] 4.3: Create GET /marks-entry/deadlines endpoint to list deadlines for an exam
- [x] 4.4: Create POST /marks-entry/deadlines/check-expired endpoint to trigger deadline check and auto-lock

## Task 5: Enhance existing marks entry endpoint with assignment-based access control
- [x] 5.1: Modify POST /marks/entry to check MarksEntryAssignment for teacher role (require active assignment)
- [x] 5.2: Add max_marks validation (reject if marks_obtained > schedule.max_marks)
- [x] 5.3: Add decimal validation (reject if more than 2 decimal places)
- [x] 5.4: When is_absent=True, force marks_obtained to null
- [x] 5.5: Add grade auto-calculation after marks save (percentage + grade from GradingSystem)
- [x] 5.6: Record entered_by and entered_at/updated_at timestamps on ExamResult

## Task 6: Enhance lock/unlock and add exam status check endpoints
- [x] 6.1: Update POST /marks/lock and POST /marks/unlock to accept principal role
- [x] 6.2: Handle concurrent unlock+submit scenario (unlock takes precedence)
- [x] 6.3: Create POST /marks-entry/check-exam-status endpoint for auto-status update
- [x] 6.4: Create GET /marks-entry/dashboard endpoint with summary and schedule-level progress

## Task 7: Enhance student portal marks visibility
- [x] 7.1: Modify GET /api/student/exams to filter ExamResults by is_marks_locked=True only
- [x] 7.2: Add percentage, grade, and pass/fail status to student results response
- [x] 7.3: Sort results by exam_date descending (most recent first)
- [x] 7.4: Ensure parent portal shows same locked-only marks data

## Task 8: Build Exam Controller Marks Entry Dashboard frontend page
- [x] 8.1: Create frontend/src/pages/exam-controller/MarksEntryDashboard.js with exam selector and summary cards
- [x] 8.2: Add filterable progress table with columns: Class, Section, Subject, Teacher, Progress, Status, Lock, Deadline
- [x] 8.3: Add AssignmentBulkDialog component for triggering bulk assignment with results summary
- [x] 8.4: Add ManualAssignDialog component for assigning teacher to unassigned schedule
- [x] 8.5: Add DeadlineSetDialog component for setting/editing deadlines with auto-lock toggle
- [x] 8.6: Add lock/unlock toggle buttons per schedule row
- [x] 8.7: Add route in App.js at /exam-controller/marks-entry-dashboard

## Task 9: Enhance TeacherMarksEntry frontend page
- [x] 9.1: Replace exam/class/section/subject dropdowns with assignment-based list from GET /marks-entry/my-assignments
- [x] 9.2: Show deadline warning chip (yellow) when within 24 hours of deadline
- [x] 9.3: Show locked indicator (red chip + disabled save) when is_marks_locked=true
- [x] 9.4: Show overdue indicator when deadline has passed
- [x] 9.5: Add "Mark Absent" checkbox per student row that clears marks field
- [x] 9.6: Show auto-calculated grade in read-only column
- [x] 9.7: Show pass/fail indicator based on passing_marks from ExamSchedule

## Task 10: Add marks-entry API functions to frontend api.js
- [x] 10.1: Add marksEntryAPI object with all new endpoint functions (bulk assign, manual assign, list assignments, my-assignments, deadlines CRUD, check-expired, dashboard, check-exam-status)
- [x] 10.2: Update existing academicsAPI if needed for enhanced marks entry calls
