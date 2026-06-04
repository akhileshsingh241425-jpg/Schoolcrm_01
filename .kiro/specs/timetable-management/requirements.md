# Requirements Document

## Introduction

This document specifies the requirements for enhancing the existing Timetable Management System within the School CRM. The enhancements include dedicated period/slot management, timetable publishing and versioning, teacher-wise and student/parent timetable views, enhanced substitution management with availability detection, and bulk timetable creation capabilities. These features build upon the existing Timetable model, TimetableSubstitution model, and timetable_service.py infrastructure.

## Glossary

- **Timetable_System**: The backend system responsible for managing school timetables, including period slots, timetable entries, versioning, substitutions, and schedule views.
- **PeriodSlot**: A reusable template defining a period's number, name, start time, end time, and break status for a school.
- **TimetableVersion**: A snapshot record tracking published timetable states with version number, status (draft or published), and timestamps.
- **Admin**: A user with the role of school_admin or academic_controller who manages timetable configuration.
- **Teacher**: A staff member assigned to teach periods in the timetable.
- **Student_User**: A user with the student role who views their class-section timetable.
- **Parent_User**: A user with the parent role who views their child's class-section timetable.
- **Academic_Year**: A defined academic year period within which timetables are organized.
- **Class_Section**: A combination of a class and section representing a group of students.
- **Substitution**: A temporary replacement of the assigned teacher for a specific timetable entry on a specific date.

## Requirements

### Requirement 1: Period Slot Management

**User Story:** As an Admin, I want to define reusable period slot templates for my school, so that timetable entries reference consistent period timings.

#### Acceptance Criteria

1. THE Timetable_System SHALL store PeriodSlot records with school_id, period_number, name, start_time, end_time, is_break, and academic_year_id fields.
2. WHEN an Admin creates a PeriodSlot, THE Timetable_System SHALL validate that period_number, name, start_time, and end_time are provided.
3. WHEN an Admin creates a PeriodSlot, THE Timetable_System SHALL validate that start_time is earlier than end_time.
4. WHEN an Admin creates a PeriodSlot with a period_number that already exists for the same school and academic year, THE Timetable_System SHALL reject the request with a duplicate error.
5. WHEN an Admin requests the list of PeriodSlots, THE Timetable_System SHALL return all PeriodSlots for the school filtered by academic_year_id, ordered by period_number.
6. WHEN an Admin updates a PeriodSlot, THE Timetable_System SHALL validate the same constraints as creation.
7. WHEN an Admin deletes a PeriodSlot, THE Timetable_System SHALL remove the PeriodSlot record from the database.
8. IF a PeriodSlot has overlapping time ranges with another PeriodSlot for the same school and academic year, THEN THE Timetable_System SHALL reject the creation or update with a conflict error.

### Requirement 2: Timetable Publishing and Versioning

**User Story:** As an Admin, I want to publish timetable snapshots and maintain version history, so that I can track changes and ensure students and parents see only the published timetable.

#### Acceptance Criteria

1. THE Timetable_System SHALL store TimetableVersion records with school_id, academic_year_id, class_id, section_id, version_number, status (draft or published), published_by, published_at, and notes fields.
2. WHEN an Admin creates a new timetable version, THE Timetable_System SHALL assign the next sequential version_number for the given school, academic year, class, and section combination.
3. WHEN an Admin publishes a timetable version, THE Timetable_System SHALL set the status to published and record the published_at timestamp and published_by user.
4. WHEN an Admin publishes a timetable version, THE Timetable_System SHALL set any previously published version for the same school, academic year, class, and section to draft status.
5. WHEN a Student_User or Parent_User requests the timetable, THE Timetable_System SHALL return only the timetable entries associated with the currently published version.
6. WHEN an Admin requests the version history, THE Timetable_System SHALL return all versions for the specified class-section ordered by version_number descending.
7. IF no published version exists for a class-section, THEN THE Timetable_System SHALL return an empty timetable response to Student_User and Parent_User requests.

### Requirement 3: Teacher-wise Timetable View

**User Story:** As a Teacher, I want to view my full weekly schedule, so that I can see all my assigned periods across all classes and sections.

#### Acceptance Criteria

1. WHEN a Teacher requests their weekly timetable, THE Timetable_System SHALL return all non-break timetable entries assigned to that teacher for the specified academic year.
2. THE Timetable_System SHALL group the teacher's timetable entries by day_of_week and order them by period_number within each day.
3. THE Timetable_System SHALL include class name, section name, subject name, room number, period number, start time, and end time in each timetable entry response.
4. WHEN an Admin requests a teacher's timetable by providing a teacher_id, THE Timetable_System SHALL return the same weekly schedule view for the specified teacher.
5. IF the teacher has no timetable entries for the specified academic year, THEN THE Timetable_System SHALL return an empty schedule with all days represented.

### Requirement 4: Student and Parent Timetable View

**User Story:** As a Student_User or Parent_User, I want to view the class-section timetable in a read-only format, so that I can see the daily schedule.

#### Acceptance Criteria

1. WHEN a Student_User requests their timetable, THE Timetable_System SHALL determine the student's current class_id and section_id and return the published timetable for that class-section.
2. WHEN a Parent_User requests a timetable for their child, THE Timetable_System SHALL determine the child's current class_id and section_id and return the published timetable for that class-section.
3. THE Timetable_System SHALL include subject name, teacher name, room number, period number, start time, end time, and is_break flag in each timetable entry response.
4. THE Timetable_System SHALL group the timetable entries by day_of_week and order them by period_number within each day.
5. THE Timetable_System SHALL include break periods in the response so that the full daily schedule is visible.
6. WHILE a substitution is active for a given date, THE Timetable_System SHALL indicate the substitute teacher name alongside the original teacher in the response for that period.

### Requirement 5: Enhanced Substitution Management

**User Story:** As an Admin, I want to find available substitute teachers and track substitution history, so that I can efficiently manage teacher absences.

#### Acceptance Criteria

1. WHEN an Admin requests available substitute teachers for a specific date and period_number, THE Timetable_System SHALL return a list of teachers who have no timetable entry and no existing substitution assignment for that date and period.
2. THE Timetable_System SHALL exclude teachers who are marked as inactive from the available substitutes list.
3. WHEN an Admin creates a substitution, THE Timetable_System SHALL trigger a notification to the substitute teacher with the date, period, class, section, and subject details.
4. WHEN a substitution status changes to completed or cancelled, THE Timetable_System SHALL trigger a notification to the relevant teachers.
5. WHEN an Admin requests substitution history, THE Timetable_System SHALL return substitution records filtered by date range, teacher_id, class_id, or status.
6. THE Timetable_System SHALL provide a substitution summary report containing total substitutions count, substitutions grouped by teacher, and substitutions grouped by reason for a specified date range.
7. IF no teachers are available for the requested date and period, THEN THE Timetable_System SHALL return an empty list with a message indicating no available substitutes.

### Requirement 6: Bulk Timetable Creation

**User Story:** As an Admin, I want to create an entire weekly timetable for a class-section in a single request, so that I can efficiently set up schedules without making individual API calls.

#### Acceptance Criteria

1. WHEN an Admin submits a bulk timetable creation request, THE Timetable_System SHALL accept an array of timetable entries containing day_of_week, period_number, subject_id, teacher_id, and room_no for each entry.
2. THE Timetable_System SHALL validate all entries in the bulk request before persisting any records.
3. WHEN any entry in the bulk request has a teacher conflict, THE Timetable_System SHALL reject the entire request and return the conflicting entries.
4. WHEN any entry in the bulk request has a room conflict, THE Timetable_System SHALL reject the entire request and return the conflicting entries.
5. WHEN any entry in the bulk request has a class-section time conflict, THE Timetable_System SHALL reject the entire request and return the conflicting entries.
6. THE Timetable_System SHALL associate all bulk-created entries with the specified class_id, section_id, and academic_year_id.
7. WHEN the bulk creation succeeds, THE Timetable_System SHALL return the count of created entries and the list of created timetable records.
8. IF the class-section already has timetable entries for the specified academic year, THEN THE Timetable_System SHALL reject the bulk creation request with an error indicating existing entries must be cleared first.
