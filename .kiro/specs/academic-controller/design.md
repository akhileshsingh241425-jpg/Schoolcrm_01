# Design Document: Academic Controller

## Overview

The Academic Controller feature introduces a dedicated staff role (`academic_controller`) to the School CRM backend. This role manages academic operations — curriculum, timetable, teacher assignments, lesson plan approvals, promotions, and academic analytics — while being explicitly excluded from exam-specific operations (marks entry, result publishing, exam halls, seating).

The implementation extends the existing Flask/SQLAlchemy architecture by:
1. Adding the `academic_controller` role to the existing `roles` table
2. Updating `@role_required` decorators on existing academic routes to include `academic_controller`
3. Adding new models: `Term`, `TimetableSubstitution`, `PromotionCriteria`, `PromotionRecord`, `AcademicPolicy`
4. Adding a new route blueprint `academic_controller_bp` for new endpoints
5. Keeping exam-specific routes restricted to `school_admin` and `exam_controller` only

### Design Decisions

- **Separate blueprint vs extending existing**: New endpoints go in a new `academic_controller.py` route file to avoid bloating the existing `academics.py`. Existing routes get decorator updates in-place.
- **Role-based access**: Uses the existing `@role_required()` decorator pattern. No new permission framework needed.
- **Multi-tenant isolation**: All queries filter by `school_id` from `g.school_id`, consistent with existing patterns.
- **Soft deletes**: Deactivation (status/is_active flags) over hard deletes for audit trail.

## Architecture

```mermaid
graph TD
    A[Client Request] --> B[Flask JWT Auth]
    B --> C{@school_required}
    C --> D{@role_required}
    D -->|academic_controller, school_admin| E[Academic Controller Routes]
    D -->|school_admin, exam_controller| F[Exam-Specific Routes]
    D -->|academic_controller, school_admin| G[Existing Academic Routes - Updated]
    E --> H[SQLAlchemy Models]
    F --> H
    G --> H
    H --> I[(PostgreSQL Database)]
```

### Route Organization

| Blueprint | File | Roles Allowed | Purpose |
|-----------|------|---------------|---------|
| `academics_bp` | `academics.py` | `school_admin`, `academic_controller` (updated) | Subjects, timetable, syllabus, lesson plans, homework, calendar, teacher assignments |
| `academic_controller_bp` | `academic_controller.py` (new) | `school_admin`, `academic_controller` | Terms, substitutions, workload, promotions, policies, dashboard, reports |
| `exam_management_bp` | `exam_management.py` | `school_admin`, `exam_controller` | Marks, results, exam halls, seating, admit cards (unchanged) |

### Decorator Update Strategy

Existing routes in `academics.py` currently use `@role_required('school_admin')`. These will be updated to `@role_required('school_admin', 'academic_controller')` for:
- Subject CRUD and components
- Class-subject mapping
- Timetable CRUD
- Syllabus and progress
- Lesson plans (approval actions)
- Homework viewing
- Academic calendar
- Teacher-subject assignments
- Elective management

Routes that remain `school_admin`-only or `exam_controller`-only:
- Exam CRUD, exam schedules
- Marks entry, result publishing
- Exam halls, seating, invigilators
- Admit cards, report cards, exam incidents

## Components and Interfaces

### New Route Blueprint: `academic_controller_bp`

**Prefix:** `/api/academic-controller`

#### Term Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/terms` | List terms (filter by academic_year_id) |
| POST | `/terms` | Create term |
| PUT | `/terms/<id>` | Update term |
| DELETE | `/terms/<id>` | Delete term |

#### Timetable Substitutions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/substitutions` | List substitutions (filter by date, teacher, status) |
| POST | `/substitutions` | Create substitution |
| PUT | `/substitutions/<id>` | Update substitution status |
| DELETE | `/substitutions/<id>` | Cancel substitution |

#### Teacher Workload
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teacher-workload` | List all teachers with workload summary |
| GET | `/teacher-workload/<teacher_id>` | Detailed workload for specific teacher |

#### Lesson Plan Approval
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/lesson-plans/pending` | List submitted plans awaiting review |
| PUT | `/lesson-plans/<id>/approve` | Approve a lesson plan |
| PUT | `/lesson-plans/<id>/reject` | Reject with reason |
| PUT | `/lesson-plans/<id>/revision` | Request revision with feedback |
| GET | `/lesson-plans/stats` | Submission statistics per teacher |

#### Homework Oversight
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/homework/overview` | All homework with filters |
| GET | `/homework/analytics` | Analytics: counts, submission rates, late % |
| GET | `/homework/frequency` | Frequency per subject per class |
| GET | `/homework/workload-alerts` | Classes with >3 homework same date |

#### Promotion Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/promotions/criteria` | List promotion criteria |
| POST | `/promotions/criteria` | Define criteria for a class |
| PUT | `/promotions/criteria/<id>` | Update criteria |
| POST | `/promotions/evaluate/<class_id>` | Evaluate students against criteria |
| PUT | `/promotions/override/<record_id>` | Override individual recommendation |
| POST | `/promotions/confirm/<class_id>` | Confirm and execute promotions |
| GET | `/promotions/summary/<class_id>` | Promotion summary report |

#### Academic Policies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/policies` | List all policies for school |
| POST | `/policies` | Create/update policy |
| PUT | `/policies/<id>` | Update specific policy |
| GET | `/policies/working-days` | Get working days config |
| PUT | `/policies/working-days` | Set working days |

#### Reports & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/class-performance` | Class performance report |
| GET | `/reports/teacher-performance` | Teacher performance report |
| GET | `/reports/cross-section` | Cross-section comparison |
| GET | `/reports/trends` | Term-over-term trends |
| GET | `/reports/export-pdf` | PDF export of any report |

#### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Dashboard summary (counts, alerts, notifications) |
| GET | `/dashboard/notifications` | Recent notifications (last 7 days) |

### Service Layer

New service modules to encapsulate business logic:

**`backend/app/services/timetable_service.py`**
- `check_teacher_conflict(school_id, teacher_id, day, start_time, end_time, exclude_id=None)` → bool
- `check_room_conflict(school_id, room_no, day, start_time, end_time, exclude_id=None)` → bool
- `check_class_section_conflict(school_id, class_id, section_id, day, start_time, end_time, exclude_id=None)` → bool
- `check_substitution_conflict(school_id, teacher_id, date, period_number, exclude_id=None)` → bool
- `get_teacher_weekly_workload(school_id, teacher_id, academic_year_id)` → int
- `copy_timetable(school_id, source_year_id, target_year_id, class_id, section_id)` → dict

**`backend/app/services/promotion_service.py`**
- `evaluate_student(student, criteria, exam_results, attendance_pct)` → str (promote/compartment/detain)
- `evaluate_class(school_id, class_id, academic_year_id)` → list[PromotionRecord]
- `confirm_promotions(school_id, class_id, academic_year_id, confirmed_by)` → dict (summary)

**`backend/app/services/academic_analytics_service.py`**
- `get_dashboard_summary(school_id, academic_year_id, term)` → dict
- `get_class_performance(school_id, class_id, section_id, exam_id)` → dict
- `get_teacher_performance(school_id, teacher_id)` → dict
- `get_cross_section_comparison(school_id, class_id, exam_id)` → dict
- `get_trend_analysis(school_id, class_id, subject_id)` → dict
- `get_homework_analytics(school_id, filters)` → dict
- `get_homework_frequency(school_id, class_id, date_range)` → dict

## Data Models

### New Models

#### Term

```python
class Term(db.Model):
    __tablename__ = 'terms'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    is_current = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    academic_year = db.relationship('AcademicYear')

    __table_args__ = (
        db.UniqueConstraint('school_id', 'academic_year_id', 'name', name='unique_term_per_year'),
    )
```

#### TimetableSubstitution

```python
class TimetableSubstitution(db.Model):
    __tablename__ = 'timetable_substitutions'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    timetable_id = db.Column(db.Integer, db.ForeignKey('timetable.id', ondelete='CASCADE'), nullable=False)
    substitute_teacher_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.String(255))
    status = db.Column(db.Enum('assigned', 'completed', 'cancelled'), default='assigned')
    assigned_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    timetable = db.relationship('Timetable')
    substitute_teacher = db.relationship('Staff')
```

#### PromotionCriteria

```python
class PromotionCriteria(db.Model):
    __tablename__ = 'promotion_criteria'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'))
    min_attendance_pct = db.Column(db.Numeric(5, 2), default=75.00)
    min_overall_pct = db.Column(db.Numeric(5, 2), default=33.00)
    min_subject_pass_count = db.Column(db.Integer, default=0)
    max_failed_for_compartment = db.Column(db.Integer, default=2)
    mandatory_subjects = db.Column(db.Text)  # JSON array of subject_ids
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    class_ref = db.relationship('Class')

    __table_args__ = (
        db.UniqueConstraint('school_id', 'class_id', 'academic_year_id', name='unique_criteria_per_class_year'),
    )
```

#### PromotionRecord

```python
class PromotionRecord(db.Model):
    __tablename__ = 'promotion_records'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'), nullable=False)
    from_class_id = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    from_section_id = db.Column(db.Integer, db.ForeignKey('sections.id'))
    to_class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
    to_section_id = db.Column(db.Integer, db.ForeignKey('sections.id'))
    recommendation = db.Column(db.Enum('promote', 'compartment', 'detain'), nullable=False)
    final_decision = db.Column(db.Enum('promote', 'compartment', 'detain'))
    override_reason = db.Column(db.Text)
    overridden_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    attendance_pct = db.Column(db.Numeric(5, 2))
    overall_pct = db.Column(db.Numeric(5, 2))
    failed_subjects = db.Column(db.Integer, default=0)
    status = db.Column(db.Enum('pending', 'confirmed', 'cancelled'), default='pending')
    confirmed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    confirmed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('Student')
    from_class = db.relationship('Class', foreign_keys=[from_class_id])
    to_class = db.relationship('Class', foreign_keys=[to_class_id])
```

#### AcademicPolicy

```python
class AcademicPolicy(db.Model):
    __tablename__ = 'academic_policies'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'))
    policy_type = db.Column(db.Enum(
        'working_days', 'attendance_threshold', 'grading_default',
        'max_periods_per_day', 'lesson_plan_required'
    ), nullable=False)
    policy_value = db.Column(db.Text, nullable=False)  # JSON value
    description = db.Column(db.String(255))
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('school_id', 'academic_year_id', 'policy_type', name='unique_policy_per_school_year'),
    )
```

### Existing Model Updates

**No schema changes** to existing models. The `AcademicYear` model already has `is_current`. The `LessonPlan` model already has `status`, `approved_by`, `approved_at`, `rejection_reason`. The `Timetable` model already has all needed fields.

### Database Migration

New tables to create:
- `terms`
- `timetable_substitutions`
- `promotion_criteria`
- `promotion_records`
- `academic_policies`

Seed data:
- Insert `academic_controller` role into `roles` table with `is_system_role=True`

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Exam endpoint access denial

*For any* exam-specific endpoint (marks entry, result publishing, exam hall management, exam seating), when accessed by a user with the `academic_controller` role, the system should return HTTP 403 regardless of the request payload or parameters.

**Validates: Requirements 1.3**

### Property 2: Date range validation

*For any* academic year or term where the start date is on or after the end date, the system should reject creation with a validation error.

**Validates: Requirements 2.1, 2.7**

### Property 3: Uniqueness of current academic year

*For any* sequence of "set as current" operations on academic years within a school, at most one academic year should have `is_current=True` at any point in time.

**Validates: Requirements 2.2**

### Property 4: Term and academic year date overlap detection

*For any* two terms within the same academic year where one term's start date falls before the other's end date and its end date falls after the other's start date, the system should reject the second term. Similarly, for any two academic years within the same school with overlapping date ranges, the system should reject the second.

**Validates: Requirements 2.6, 2.8**

### Property 5: Term dates within academic year bounds

*For any* term where the start date is before the parent academic year's start date, or the end date is after the parent academic year's end date, the system should reject creation with a validation error.

**Validates: Requirements 2.4**

### Property 6: Component weightages sum to 100%

*For any* set of mandatory subject components where the sum of weightage values does not equal 100, the system should reject the configuration and report the current total.

**Validates: Requirements 3.5, 3.6**

### Property 7: Duplicate entity rejection

*For any* subject already assigned to a class (same school), attempting to assign the same subject to the same class again should be rejected. For any class name that already exists within the same school, creating another class with the same name should be rejected. For any active TeacherSubject record with the same teacher-subject-class-section combination, creating a duplicate should be rejected. For any existing chapter number in the same class-subject-term-year combination, creating another should be rejected.

**Validates: Requirements 3.3, 4.2, 6.2, 8.6**

### Property 8: Timetable conflict detection

*For any* timetable entry, if the same teacher already has an entry on the same day with overlapping time (new start < existing end AND new end > existing start), the system should reject with a teacher conflict error. If the same room already has an entry on the same day with overlapping time, the system should reject with a room conflict error. If the same class-section already has an entry on the same day with overlapping time, the system should reject with a scheduling conflict error.

**Validates: Requirements 5.2, 5.3, 5.4**

### Property 9: Substitution preserves permanent timetable

*For any* substitution assignment, the original timetable entry's teacher_id should remain unchanged after the substitution is created. Additionally, if the substitute teacher already has a timetable entry or substitution during the same period on the same date, the substitution should be rejected.

**Validates: Requirements 5.6**

### Property 10: Teacher workload calculation accuracy

*For any* teacher, the reported weekly workload should equal the count of non-break timetable periods assigned to that teacher for the active academic year. The displayed total periods per week should equal the sum of `periods_per_week` from all active TeacherSubject assignments.

**Validates: Requirements 5.7, 6.4**

### Property 11: Lesson plan state machine transitions

*For any* lesson plan with status `draft` or `revision_needed`, submitting it should change the status to `submitted`. For any lesson plan with status `approved`, `submitted`, or `rejected`, attempting to submit should be rejected. For any lesson plan not in `submitted` status, attempting to approve, reject, or request revision should be rejected.

**Validates: Requirements 9.1, 9.2, 9.6**

### Property 12: Promotion evaluation logic

*For any* student evaluated against promotion criteria: if attendance is below the minimum threshold, the recommendation should be `detain` regardless of marks. If all criteria are met (attendance, overall percentage, subject passes), the recommendation should be `promote`. If failed subjects do not exceed the compartment maximum and all mandatory subjects are passed, the recommendation should be `compartment`. Otherwise, the recommendation should be `detain`.

**Validates: Requirements 11.2, 11.5**

### Property 13: Grade range non-overlap validation

*For any* set of grade definitions within a grading system where any two grades have overlapping min-max ranges (grade A's min < grade B's max AND grade A's max > grade B's min), the system should reject the configuration.

**Validates: Requirements 12.2**

### Property 14: Default grading system uniqueness

*For any* sequence of "set as default" operations on grading systems within a school, exactly one grading system should have `is_default=True` at any point in time.

**Validates: Requirements 12.3**

### Property 15: Recurring event generation limits

*For any* recurring calendar event, the number of generated instances should not exceed 52 and no instance should have a date beyond the associated academic year's end date.

**Validates: Requirements 7.4**

### Property 16: Homework analytics calculations

*For any* set of homework assignments and submissions within a date range, the late submission percentage should equal (late submissions / total submissions × 100), the submission rate per homework should equal (submissions / enrolled students × 100), and the frequency per subject per class should equal the count of assignments per week in the date range.

**Validates: Requirements 10.2, 10.3, 10.5**

### Property 17: Syllabus completion percentage calculation

*For any* subject-class combination, the displayed completion percentage should equal the sum of `percentage_covered` values from SyllabusProgress records divided by the total number of syllabus entries, capped at 100.

**Validates: Requirements 8.2**

## Error Handling

All endpoints follow the existing `error_response(message, status_code, errors)` pattern.

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET/PUT operations |
| 201 | Successful POST (resource created) |
| 400 | Validation errors (invalid dates, missing fields, constraint violations) |
| 401 | Inactive user attempting access |
| 403 | Insufficient permissions (academic_controller accessing exam routes) |
| 404 | Resource not found within school scope |
| 409 | Conflict (duplicate entries, overlapping dates) |

### Validation Error Response Format

```json
{
  "success": false,
  "message": "Validation error description",
  "errors": {
    "field_name": "Specific field error"
  }
}
```

### Conflict Detection Errors

Timetable conflicts return specific conflict details:
```json
{
  "success": false,
  "message": "Teacher conflict: Teacher X is already assigned to Class Y Section Z during this time",
  "errors": {
    "conflict_type": "teacher|room|class_section",
    "conflicting_entry_id": 123
  }
}
```

### Promotion Processing Errors

```json
{
  "success": false,
  "message": "Cannot process promotions: Final exam results not published",
  "errors": {
    "reason": "results_not_published|no_criteria_defined"
  }
}
```

### Transaction Safety

- Academic year `is_current` switching uses a single transaction (deactivate old + activate new)
- Promotion confirmation uses a single transaction (update all student records)
- Bulk teacher assignments use a single transaction with rollback on failure
- Timetable copy uses a single transaction

## Testing Strategy

### Unit Tests

Focus on specific examples and edge cases:
- Role creation and permission verification
- Individual CRUD operations for each new model
- Specific conflict scenarios (teacher double-booked, room double-booked)
- Promotion edge cases (student with exactly threshold attendance, exactly max failed subjects)
- Lesson plan state transitions (each valid and invalid transition)
- Empty state responses (no data for dashboard, reports)
- PDF export generation
- Notification triggering on calendar events

### Property-Based Tests

**Library:** Hypothesis (Python)

**Configuration:** Minimum 100 iterations per property test.

Each property test references its design document property with a tag comment:
```python
# Feature: academic-controller, Property 1: Exam endpoint access denial
```

Properties to implement as PBT:
1. **Exam endpoint denial** — Generate random exam endpoints and payloads, verify 403 for academic_controller
2. **Date range validation** — Generate random date pairs, verify rejection when start >= end
3. **Current year uniqueness** — Generate sequences of set-current operations, verify invariant
4. **Date overlap detection** — Generate random date ranges, verify overlap detection correctness
5. **Term bounds validation** — Generate term dates relative to year bounds, verify rejection when out of bounds
6. **Component weightages** — Generate random weightage sets, verify rejection when sum ≠ 100
7. **Duplicate entity rejection** — Generate assignment sequences, verify duplicates rejected
8. **Timetable conflicts** — Generate timetable entries with overlapping times, verify conflict detection
9. **Substitution integrity** — Generate substitutions, verify permanent timetable unchanged
10. **Workload calculation** — Generate teacher assignments, verify workload sum matches
11. **Lesson plan state machine** — Generate state transition sequences, verify valid/invalid transitions
12. **Promotion evaluation** — Generate student data and criteria, verify correct recommendation
13. **Grade range overlap** — Generate grade definitions, verify overlap detection
14. **Default grading uniqueness** — Generate set-default sequences, verify exactly one default
15. **Recurring event limits** — Generate recurring events, verify instance count ≤ 52 and within year
16. **Homework analytics** — Generate homework/submission data, verify calculation accuracy
17. **Syllabus completion** — Generate progress records, verify percentage calculation

### Integration Tests

- Full API flow: login as academic_controller → access academic endpoints → verify 403 on exam endpoints
- Promotion workflow: define criteria → evaluate → override → confirm → verify student records updated
- Timetable workflow: create entries → detect conflicts → create substitution → verify workload
- Report generation with real data aggregation
- PDF export end-to-end

### Test Organization

```
backend/tests/
├── test_academic_controller_role.py      # Role & auth tests
├── test_terms.py                         # Term CRUD & validation
├── test_timetable_conflicts.py           # Conflict detection
├── test_substitutions.py                 # Substitution management
├── test_lesson_plan_approval.py          # Approval workflow
├── test_promotions.py                    # Promotion logic
├── test_academic_policies.py             # Policy configuration
├── test_academic_reports.py              # Analytics & reports
├── test_academic_dashboard.py            # Dashboard endpoints
├── properties/
│   ├── test_date_validation_props.py     # Properties 2, 4, 5
│   ├── test_timetable_props.py           # Properties 8, 9, 10
│   ├── test_lesson_plan_props.py         # Property 11
│   ├── test_promotion_props.py           # Property 12
│   ├── test_grading_props.py             # Properties 13, 14
│   ├── test_homework_props.py            # Properties 16, 17
│   └── test_access_control_props.py      # Properties 1, 3, 6, 7, 15
```
