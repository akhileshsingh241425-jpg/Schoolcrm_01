# Implementation Plan: Academic Controller

## Overview

This plan implements the Academic Controller feature — a dedicated staff role for managing academic operations in the School CRM. The implementation adds new models, a new route blueprint with service layer, updates existing route decorators, and registers everything in the app factory. The project uses Flask/Python with SQLAlchemy.

## Tasks

- [x] 1. Models & Migration
  - [x] 1.1 Create new models in `backend/app/models/academic.py`
    - Add `Term` model with fields: id, school_id, academic_year_id, name, start_date, end_date, is_current, created_at, updated_at
    - Add `TimetableSubstitution` model with fields: id, school_id, timetable_id, substitute_teacher_id, date, reason, status (enum: assigned/completed/cancelled), assigned_by, created_at
    - Add `PromotionCriteria` model with fields: id, school_id, class_id, academic_year_id, min_attendance_pct, min_overall_pct, min_subject_pass_count, max_failed_for_compartment, mandatory_subjects (JSON text), created_by, created_at, updated_at
    - Add `PromotionRecord` model with fields: id, school_id, student_id, academic_year_id, from_class_id, from_section_id, to_class_id, to_section_id, recommendation (enum), final_decision (enum), override_reason, overridden_by, attendance_pct, overall_pct, failed_subjects, status (enum), confirmed_by, confirmed_at, created_at
    - Add `AcademicPolicy` model with fields: id, school_id, academic_year_id, policy_type (enum), policy_value (JSON text), description, created_by, created_at, updated_at
    - Include all unique constraints, foreign keys, and relationships as specified in the design
    - Update `backend/app/models/__init__.py` to export new models
    - _Requirements: 2.4, 2.6, 2.7, 5.6, 11.1, 11.2, 12.1, 12.4, 12.5_

  - [x] 1.2 Create database migration script to add new tables and seed the `academic_controller` role
    - Create `backend/add_academic_controller_tables.py` migration script
    - Create tables: `terms`, `timetable_substitutions`, `promotion_criteria`, `promotion_records`, `academic_policies`
    - Insert `academic_controller` role into `roles` table with `is_system_role=True`
    - _Requirements: 1.1, 2.4, 5.6, 11.1, 12.1_

  - [x]* 1.3 Write unit tests for new model creation and constraints
    - Test Term unique constraint (school_id + academic_year_id + name)
    - Test PromotionCriteria unique constraint (school_id + class_id + academic_year_id)
    - Test AcademicPolicy unique constraint (school_id + academic_year_id + policy_type)
    - Test enum field validation for TimetableSubstitution status and PromotionRecord recommendation
    - _Requirements: 2.6, 11.1, 12.1_

- [x] 2. Update existing route decorators
  - [x] 2.1 Update `@role_required` decorators in `backend/app/routes/academics.py`
    - Change `@role_required('school_admin')` to `@role_required('school_admin', 'academic_controller')` on all subject CRUD routes
    - Update class-subject mapping routes
    - Update timetable CRUD routes
    - Update syllabus and progress routes
    - Update lesson plan routes (including approval actions)
    - Update homework viewing routes
    - Update academic calendar routes
    - Update teacher-subject assignment routes
    - Update elective management routes
    - Do NOT update exam-specific routes (marks entry, result publishing, exam halls, seating, invigilators, admit cards, report cards, exam incidents)
    - _Requirements: 1.1, 1.2, 1.3_

  - [x]* 2.2 Write property test for exam endpoint access denial
    - **Property 1: Exam endpoint access denial**
    - Generate random exam-specific endpoints and payloads, verify HTTP 403 for academic_controller role
    - **Validates: Requirements 1.3**

- [x] 3. Service layer
  - [x] 3.1 Create `backend/app/services/timetable_service.py`
    - Implement `check_teacher_conflict(school_id, teacher_id, day, start_time, end_time, exclude_id=None)` → bool
    - Implement `check_room_conflict(school_id, room_no, day, start_time, end_time, exclude_id=None)` → bool
    - Implement `check_class_section_conflict(school_id, class_id, section_id, day, start_time, end_time, exclude_id=None)` → bool
    - Implement `check_substitution_conflict(school_id, teacher_id, date, period_number, exclude_id=None)` → bool
    - Implement `get_teacher_weekly_workload(school_id, teacher_id, academic_year_id)` → int
    - Implement `copy_timetable(school_id, source_year_id, target_year_id, class_id, section_id)` → dict
    - _Requirements: 5.2, 5.3, 5.4, 5.6, 5.7, 5.8_

  - [x] 3.2 Create `backend/app/services/promotion_service.py`
    - Implement `evaluate_student(student, criteria, exam_results, attendance_pct)` → str (promote/compartment/detain)
    - Implement `evaluate_class(school_id, class_id, academic_year_id)` → list[PromotionRecord]
    - Implement `confirm_promotions(school_id, class_id, academic_year_id, confirmed_by)` → dict (summary)
    - Handle edge cases: no criteria defined, results not published, attendance below threshold
    - _Requirements: 11.2, 11.4, 11.5, 11.7, 11.8_

  - [x] 3.3 Create `backend/app/services/academic_analytics_service.py`
    - Implement `get_dashboard_summary(school_id, academic_year_id, term)` → dict
    - Implement `get_class_performance(school_id, class_id, section_id, exam_id)` → dict
    - Implement `get_teacher_performance(school_id, teacher_id)` → dict
    - Implement `get_cross_section_comparison(school_id, class_id, exam_id)` → dict
    - Implement `get_trend_analysis(school_id, class_id, subject_id)` → dict
    - Implement `get_homework_analytics(school_id, filters)` → dict
    - Implement `get_homework_frequency(school_id, class_id, date_range)` → dict
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 14.2_

  - [x]* 3.4 Write property tests for timetable conflict detection
    - **Property 8: Timetable conflict detection**
    - Generate timetable entries with overlapping times, verify teacher/room/class-section conflict detection
    - **Validates: Requirements 5.2, 5.3, 5.4**

  - [x]* 3.5 Write property tests for promotion evaluation logic
    - **Property 12: Promotion evaluation logic**
    - Generate student data with varying attendance, marks, and failed subjects against criteria, verify correct recommendation (promote/compartment/detain)
    - **Validates: Requirements 11.2, 11.5**

  - [x]* 3.6 Write property test for teacher workload calculation
    - **Property 10: Teacher workload calculation accuracy**
    - Generate teacher assignments, verify workload sum matches count of non-break periods
    - **Validates: Requirements 5.7, 6.4**

- [x] 4. Checkpoint - Ensure models, migration, decorators, and services are correct
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. New route blueprint - Term management & Academic year enhancements
  - [x] 5.1 Create `backend/app/routes/academic_controller.py` with blueprint setup and term endpoints
    - Define `academic_controller_bp = Blueprint('academic_controller', __name__)`
    - Implement GET `/terms` — list terms filtered by academic_year_id
    - Implement POST `/terms` — create term with date validation (start < end, within academic year bounds, no overlap with existing terms)
    - Implement PUT `/terms/<id>` — update term with same validations
    - Implement DELETE `/terms/<id>` — delete term (soft delete or check associations)
    - Add academic year `is_current` switching endpoint if not already in academics.py
    - All endpoints use `@school_required` and `@role_required('school_admin', 'academic_controller')`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [x]* 5.2 Write property tests for date validation
    - **Property 2: Date range validation** — verify rejection when start >= end
    - **Property 4: Term and academic year date overlap detection** — verify overlap detection
    - **Property 5: Term dates within academic year bounds** — verify rejection when out of bounds
    - **Validates: Requirements 2.1, 2.4, 2.6, 2.7, 2.8**

- [x] 6. New route blueprint - Timetable conflict detection, substitutions & workload
  - [x] 6.1 Add timetable substitution endpoints to `academic_controller.py`
    - Implement GET `/substitutions` — list substitutions with filters (date, teacher, status)
    - Implement POST `/substitutions` — create substitution with conflict check (substitute teacher availability)
    - Implement PUT `/substitutions/<id>` — update substitution status
    - Implement DELETE `/substitutions/<id>` — cancel substitution
    - Validate that substitution date is current or future
    - Verify permanent timetable entry remains unchanged after substitution
    - _Requirements: 5.6_

  - [x] 6.2 Add teacher workload endpoints to `academic_controller.py`
    - Implement GET `/teacher-workload` — list all teachers with workload summary (total periods, class count, subject count)
    - Implement GET `/teacher-workload/<teacher_id>` — detailed workload for specific teacher
    - Use `timetable_service.get_teacher_weekly_workload()` for calculations
    - _Requirements: 5.7, 6.4_

  - [x]* 6.3 Write property test for substitution integrity
    - **Property 9: Substitution preserves permanent timetable**
    - Generate substitutions, verify original timetable entry's teacher_id remains unchanged and substitute conflicts are rejected
    - **Validates: Requirements 5.6**

- [x] 7. New route blueprint - Lesson plan approval workflow
  - [x] 7.1 Add lesson plan approval endpoints to `academic_controller.py`
    - Implement GET `/lesson-plans/pending` — list submitted plans awaiting review
    - Implement PUT `/lesson-plans/<id>/approve` — approve a submitted lesson plan (set status, approver, timestamp)
    - Implement PUT `/lesson-plans/<id>/reject` — reject with reason (min 10, max 1000 chars)
    - Implement PUT `/lesson-plans/<id>/revision` — request revision with feedback (min 10, max 1000 chars)
    - Implement GET `/lesson-plans/stats` — submission statistics per teacher (submitted, approved, pending counts)
    - Validate state transitions: only `submitted` plans can be approved/rejected/revision-requested
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_

  - [x]* 7.2 Write property test for lesson plan state machine
    - **Property 11: Lesson plan state machine transitions**
    - Generate state transition sequences, verify valid transitions succeed and invalid transitions are rejected
    - **Validates: Requirements 9.1, 9.2, 9.6**

- [x] 8. New route blueprint - Homework oversight & analytics
  - [x] 8.1 Add homework oversight endpoints to `academic_controller.py`
    - Implement GET `/homework/overview` — all homework with filters (class, section, subject, teacher, date range, status)
    - Implement GET `/homework/analytics` — analytics: total count, avg submission count, late submission percentage per class
    - Implement GET `/homework/frequency` — frequency per subject per class (assignments per week)
    - Implement GET `/homework/workload-alerts` — classes with >3 homework due on same date
    - Handle empty state with appropriate message
    - Use `academic_analytics_service` for calculations
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x]* 8.2 Write property test for homework analytics calculations
    - **Property 16: Homework analytics calculations**
    - Generate homework/submission data, verify late submission percentage, submission rate, and frequency calculations
    - **Validates: Requirements 10.2, 10.3, 10.5**

- [x] 9. New route blueprint - Promotion management
  - [x] 9.1 Add promotion management endpoints to `academic_controller.py`
    - Implement GET `/promotions/criteria` — list promotion criteria
    - Implement POST `/promotions/criteria` — define criteria for a class (min_attendance_pct, min_overall_pct, min_subject_pass_count, max_failed_for_compartment, mandatory_subjects)
    - Implement PUT `/promotions/criteria/<id>` — update criteria
    - Implement POST `/promotions/evaluate/<class_id>` — evaluate students against criteria using promotion_service
    - Implement PUT `/promotions/override/<record_id>` — override individual recommendation (require reason ≥10 chars)
    - Implement POST `/promotions/confirm/<class_id>` — confirm and execute promotions (update student records, single transaction)
    - Implement GET `/promotions/summary/<class_id>` — promotion summary report (promoted/detained/compartment counts, overrides)
    - Validate: criteria must exist before evaluation, results must be published
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

- [x] 10. New route blueprint - Academic policies
  - [x] 10.1 Add academic policy endpoints to `academic_controller.py`
    - Implement GET `/policies` — list all policies for school
    - Implement POST `/policies` — create/update policy (policy_type, policy_value as JSON, description)
    - Implement PUT `/policies/<id>` — update specific policy
    - Implement GET `/policies/working-days` — get working days configuration
    - Implement PUT `/policies/working-days` — set working days (1-6 selected days from Monday-Saturday)
    - Enforce unique constraint per school + academic_year + policy_type
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [x]* 10.2 Write property tests for grading and policy validation
    - **Property 13: Grade range non-overlap validation** — generate grade definitions, verify overlap detection
    - **Property 14: Default grading system uniqueness** — generate set-default sequences, verify exactly one default
    - **Validates: Requirements 12.2, 12.3**

- [x] 11. New route blueprint - Reports & Analytics + Dashboard
  - [x] 11.1 Add reports and analytics endpoints to `academic_controller.py`
    - Implement GET `/reports/class-performance` — subject-wise averages, pass/fail counts, grade distribution, term comparison
    - Implement GET `/reports/teacher-performance` — syllabus completion, lesson plan rate, homework count, student averages
    - Implement GET `/reports/cross-section` — side-by-side section comparison with highlighting (>10% deviation)
    - Implement GET `/reports/trends` — term-over-term comparison (up to 4 terms)
    - Implement GET `/reports/export-pdf` — PDF export of any report (within 30 seconds)
    - Handle insufficient data with appropriate message (no empty reports)
    - Use `academic_analytics_service` for all calculations
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

  - [x] 11.2 Add dashboard endpoints to `academic_controller.py`
    - Implement GET `/dashboard` — summary: pending approvals count, at-risk syllabus count, upcoming events count, pending substitutions count
    - Implement GET `/dashboard/notifications` — recent notifications (last 7 days, max 20, ordered by most recent)
    - Support filtering by academic year and term
    - Handle empty state with zero counts and appropriate messages
    - Use `academic_analytics_service.get_dashboard_summary()` for aggregation
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [x]* 11.3 Write property test for syllabus completion calculation
    - **Property 17: Syllabus completion percentage calculation**
    - Generate progress records, verify percentage = sum(percentage_covered) / total entries, capped at 100
    - **Validates: Requirements 8.2**

- [x] 12. Blueprint registration & integration
  - [x] 12.1 Register `academic_controller_bp` in the app factory
    - Import `academic_controller_bp` from `app.routes.academic_controller` in `backend/app/__init__.py`
    - Register with `url_prefix='/api/academic-controller'`
    - Ensure import order is consistent with existing blueprints
    - _Requirements: 1.1, 1.2_

  - [x] 12.2 Update `backend/app/services/__init__.py` to export new services
    - Add imports for `timetable_service`, `promotion_service`, `academic_analytics_service`
    - _Requirements: 5.2, 11.2, 13.1_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All new endpoints use `@school_required` and `@role_required('school_admin', 'academic_controller')` decorators
- Multi-tenant isolation is enforced via `g.school_id` filtering on all queries
- Soft deletes (status/is_active flags) are preferred over hard deletes

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1", "3.2", "3.3"] },
    { "id": 3, "tasks": ["3.4", "3.5", "3.6", "5.1"] },
    { "id": 4, "tasks": ["5.2", "6.1", "6.2", "7.1"] },
    { "id": 5, "tasks": ["6.3", "7.2", "8.1", "9.1"] },
    { "id": 6, "tasks": ["8.2", "10.1", "11.1", "11.2"] },
    { "id": 7, "tasks": ["10.2", "11.3", "12.1", "12.2"] }
  ]
}
```
