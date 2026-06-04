# Technical Design

## Overview

The Marks Entry System extends the existing exam infrastructure to provide controlled, permission-based marks entry. It introduces two new models (`MarksEntryAssignment` and `MarksEntryDeadline`) that sit between the existing `TeacherSubject` allocations and `ExamSchedule` records. The system enforces that only assigned teachers can enter marks, provides deadline tracking with auto-lock, and ensures students only see marks after the Exam Controller locks them.

The design builds on top of existing infrastructure:
- Existing `ExamSchedule.is_marks_locked` field for lock state
- Existing `/api/academics/marks/entry` route for bulk marks submission
- Existing `TeacherSubject` model for teacher-class-section-subject mappings
- Existing `ExamResult` model for storing individual student marks
- Existing `TeacherMarksEntry.js` frontend page

## Architecture

### New Models

#### MarksEntryAssignment

Links a teacher to a specific `ExamSchedule`, granting permission to enter marks. Derived from `TeacherSubject` allocations during bulk assignment.

```python
class MarksEntryAssignment(db.Model):
    __tablename__ = 'marks_entry_assignments'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_schedule_id = db.Column(db.Integer, db.ForeignKey('exam_schedules.id', ondelete='CASCADE'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    assigned_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.Enum('active', 'revoked'), default='active')
    source = db.Column(db.Enum('auto', 'manual'), default='auto')  # How assignment was created

    # Relationships
    schedule = db.relationship('ExamSchedule', backref='marks_assignments')
    teacher = db.relationship('Staff', backref='marks_entry_assignments')

    # Constraints
    __table_args__ = (
        db.UniqueConstraint('exam_schedule_id', 'school_id',
                           name='uq_one_teacher_per_schedule'),
    )
```

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| id | Integer PK | Auto-increment primary key |
| school_id | Integer FK | School scope (multi-tenant) |
| exam_schedule_id | Integer FK | The ExamSchedule this assignment covers |
| teacher_id | Integer FK | The staff member assigned to enter marks |
| assigned_by | Integer FK | User who created the assignment |
| assigned_at | DateTime | When the assignment was created |
| status | Enum | 'active' or 'revoked' |
| source | Enum | 'auto' (from TeacherSubject match) or 'manual' |

**Unique Constraint:** One active assignment per `exam_schedule_id` per school (enforces single teacher per ExamSchedule).

---

#### MarksEntryDeadline

Stores deadline configuration per ExamSchedule with optional auto-lock behavior.

```python
class MarksEntryDeadline(db.Model):
    __tablename__ = 'marks_entry_deadlines'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_schedule_id = db.Column(db.Integer, db.ForeignKey('exam_schedules.id', ondelete='CASCADE'), nullable=False)
    deadline_date = db.Column(db.DateTime, nullable=False)
    auto_lock = db.Column(db.Boolean, default=False)
    set_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    schedule = db.relationship('ExamSchedule', backref='deadline')

    __table_args__ = (
        db.UniqueConstraint('exam_schedule_id', 'school_id',
                           name='uq_one_deadline_per_schedule'),
    )
```

**Fields:**
| Field | Type | Description |
|-------|------|-------------|
| id | Integer PK | Auto-increment primary key |
| school_id | Integer FK | School scope |
| exam_schedule_id | Integer FK | The ExamSchedule this deadline applies to |
| deadline_date | DateTime | Deadline for marks submission |
| auto_lock | Boolean | If true, auto-lock marks when deadline passes |
| set_by | Integer FK | User who set the deadline |

---

### API Endpoints

All endpoints are under the existing `/api/academics` blueprint prefix. New marks-entry-specific routes use the `/marks-entry/` sub-path to avoid conflicts with existing `/marks/` routes.

#### Assignment Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/marks-entry/assignments/bulk` | exam_controller, school_admin | Bulk assign teachers from TeacherSubject |
| POST | `/marks-entry/assignments` | exam_controller, school_admin | Manual single assignment |
| GET | `/marks-entry/assignments` | exam_controller, school_admin, principal | List assignments for an exam |
| DELETE | `/marks-entry/assignments/<id>` | exam_controller, school_admin | Revoke an assignment |
| GET | `/marks-entry/my-assignments` | teacher | Get current teacher's assignments |

##### POST `/marks-entry/assignments/bulk`

Auto-matches TeacherSubject allocations to ExamSchedules for an entire exam.

**Request:**
```json
{
  "exam_id": 5,
  "academic_year_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_schedules": 24,
    "assigned": 20,
    "already_assigned": 2,
    "unassigned": [
      {
        "exam_schedule_id": 101,
        "class_name": "10-A",
        "subject_name": "Computer Science",
        "reason": "no_teacher_subject_match"
      }
    ]
  }
}
```

**Logic:**
1. Fetch all ExamSchedules for the given exam_id
2. For each schedule, find active TeacherSubject where `teacher_subjects.class_id = exam_schedules.class_id AND teacher_subjects.section_id = exam_schedules.section_id AND teacher_subjects.subject_id = exam_schedules.subject_id AND teacher_subjects.status = 'active'`
3. If match found and no existing assignment, create MarksEntryAssignment with `source='auto'`
4. If already assigned, skip
5. If no match, add to unassigned list
6. Return summary

##### POST `/marks-entry/assignments`

Manual assignment by Exam Controller.

**Request:**
```json
{
  "exam_schedule_id": 101,
  "teacher_id": 15
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 45,
    "exam_schedule_id": 101,
    "teacher_id": 15,
    "teacher_name": "Rajesh Kumar",
    "source": "manual",
    "status": "active"
  }
}
```

##### GET `/marks-entry/my-assignments`

Returns ExamSchedules assigned to the current teacher, grouped by exam.

**Query Params:** `exam_id` (optional), `status` (optional, default 'active')

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "assignment_id": 45,
      "exam_schedule_id": 101,
      "exam_id": 5,
      "exam_name": "Mid-Term 2024",
      "class_name": "10",
      "section_name": "A",
      "subject_name": "Mathematics",
      "max_marks": 100,
      "is_marks_locked": false,
      "total_students": 35,
      "marks_entered": 20,
      "deadline": "2024-03-15T23:59:00",
      "is_overdue": false,
      "deadline_approaching": true
    }
  ]
}
```

---

#### Deadline Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/marks-entry/deadlines` | exam_controller, school_admin | Set deadline for ExamSchedule(s) |
| PUT | `/marks-entry/deadlines/<id>` | exam_controller, school_admin | Update deadline |
| GET | `/marks-entry/deadlines` | exam_controller, school_admin | List deadlines for an exam |
| POST | `/marks-entry/deadlines/check-expired` | exam_controller, school_admin | Trigger deadline check & auto-lock |

##### POST `/marks-entry/deadlines`

Set deadlines in bulk (one per schedule) or individually.

**Request:**
```json
{
  "deadlines": [
    {
      "exam_schedule_id": 101,
      "deadline_date": "2024-03-15T23:59:00",
      "auto_lock": true
    },
    {
      "exam_schedule_id": 102,
      "deadline_date": "2024-03-15T23:59:00",
      "auto_lock": true
    }
  ]
}
```

##### POST `/marks-entry/deadlines/check-expired`

On-demand check for expired deadlines. Locks schedules where `auto_lock=true` and deadline has passed.

**Response:**
```json
{
  "success": true,
  "data": {
    "checked": 24,
    "auto_locked": 3,
    "already_locked": 5
  }
}
```

---

#### Enhanced Marks Entry Endpoint

The existing `POST /marks/entry` route is enhanced (not replaced) with assignment-based access control.

**Changes to existing `bulk_marks_entry()`:**
1. After fetching the schedule, check `MarksEntryAssignment` for the current teacher
2. If user is teacher role, require active assignment (replaces current `get_teacher_scope()` check)
3. If user is school_admin/exam_controller, allow without assignment (existing behavior)
4. Add max_marks validation: reject if any `marks_obtained > schedule.max_marks`
5. Add decimal validation: reject if marks have more than 2 decimal places
6. When `is_absent=True`, force `marks_obtained=None`

**Updated access control logic:**
```python
# Replace existing scope check with assignment check for teachers
if g.current_user.role.name == 'teacher':
    staff = Staff.query.filter_by(user_id=g.user_id, school_id=g.school_id).first()
    assignment = MarksEntryAssignment.query.filter_by(
        exam_schedule_id=exam_schedule_id,
        teacher_id=staff.id,
        status='active',
        school_id=g.school_id
    ).first()
    if not assignment:
        return error_response('No marks entry assignment for this schedule', 403)
```

---

#### Lock/Unlock Endpoints (Enhanced)

Existing routes `POST /marks/lock` and `POST /marks/unlock` are enhanced to also accept `principal` role.

**Updated role decorator:**
```python
@role_required('school_admin', 'exam_controller', 'principal')
```

No other changes needed — the existing implementation already sets `is_marks_locked` on ExamSchedule.

---

#### Auto-Status Update Endpoint

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/marks-entry/check-exam-status` | exam_controller, school_admin | Check and update exam completion status |

##### POST `/marks-entry/check-exam-status`

**Request:**
```json
{
  "exam_id": 5
}
```

**Logic:**
1. Fetch all ExamSchedules for the exam
2. For each schedule, check if `exam_date + end_time < now()`
3. If ALL schedules have passed their end_time, set `Exam.status = 'completed'`
4. If some have passed but not all, set `Exam.status = 'ongoing'`
5. Return updated status

**Response:**
```json
{
  "success": true,
  "data": {
    "exam_id": 5,
    "previous_status": "ongoing",
    "new_status": "completed",
    "schedules_completed": 24,
    "schedules_pending": 0
  }
}
```

---

#### Dashboard Endpoint

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/marks-entry/dashboard` | exam_controller, school_admin, principal | Marks entry progress dashboard |

##### GET `/marks-entry/dashboard`

**Query Params:** `exam_id` (required), `class_id` (optional), `section_id` (optional), `subject_id` (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_schedules": 24,
      "completed": 15,
      "in_progress": 5,
      "not_started": 2,
      "locked": 12,
      "overdue": 2
    },
    "schedules": [
      {
        "exam_schedule_id": 101,
        "class_name": "10",
        "section_name": "A",
        "subject_name": "Mathematics",
        "assigned_teacher": "Rajesh Kumar",
        "total_students": 35,
        "marks_entered": 35,
        "marks_pending": 0,
        "completion_percentage": 100.0,
        "is_marks_locked": true,
        "status": "completed",
        "deadline": "2024-03-15T23:59:00",
        "is_overdue": false
      }
    ]
  }
}
```

**Status calculation logic:**
- `locked`: `is_marks_locked = true`
- `completed`: all students have marks entered (marks_entered == total_students)
- `in_progress`: some marks entered but not all
- `not_started`: no marks entered
- `overdue`: deadline passed AND status is not `completed` or `locked`

---

#### Student Marks Visibility Endpoint (Enhanced)

The existing `GET /api/student/exams` endpoint in `student_portal.py` is enhanced to filter results by lock status.

**Change:** Add filter `ExamSchedule.is_marks_locked == True` when fetching ExamResults for students.

```python
# In student_portal.py exams() function, modify the results query:
results = ExamResult.query.filter_by(
    student_id=student.id, school_id=g.school_id
).join(ExamSchedule).filter(
    ExamSchedule.is_marks_locked == True  # Only show locked marks
).order_by(ExamSchedule.exam_date.desc()).all()
```

---

### Services

#### MarksEntryService

Business logic layer for marks entry operations. Located at `backend/app/services/marks_entry.py`.

```python
class MarksEntryService:

    @staticmethod
    def bulk_assign(exam_id, academic_year_id, school_id, assigned_by):
        """Match TeacherSubject allocations to ExamSchedules and create assignments."""
        pass

    @staticmethod
    def manual_assign(exam_schedule_id, teacher_id, school_id, assigned_by):
        """Manually assign a teacher to an ExamSchedule."""
        pass

    @staticmethod
    def validate_marks_entry(entries, schedule):
        """Validate marks data before saving.
        - marks_obtained <= max_marks
        - marks_obtained >= 0
        - max 2 decimal places
        - if is_absent, marks_obtained must be null
        """
        pass

    @staticmethod
    def calculate_grade(marks_obtained, max_marks, grading_system_id, school_id):
        """Calculate percentage, grade, and grade_point from marks."""
        pass

    @staticmethod
    def get_entry_progress(exam_schedule_id, school_id):
        """Return marks_entered count, total_students, completion percentage."""
        pass

    @staticmethod
    def check_deadlines_and_lock(school_id):
        """Find expired deadlines with auto_lock=True and lock those schedules."""
        pass

    @staticmethod
    def check_exam_completion(exam_id, school_id):
        """Check if all schedules have passed end_time and update exam status."""
        pass

    @staticmethod
    def get_dashboard_data(exam_id, school_id, filters=None):
        """Aggregate marks entry progress for the dashboard."""
        pass
```

#### DeadlineCheckerJob (Optional Background Task)

If a task scheduler (APScheduler/Celery) is available, a periodic job runs every 15 minutes:
1. Query all `MarksEntryDeadline` where `deadline_date < now()` and `auto_lock = True`
2. Join with `ExamSchedule` where `is_marks_locked = False`
3. Set `is_marks_locked = True` on matched schedules

If no scheduler is configured, the check runs on-demand via `POST /marks-entry/deadlines/check-expired` (called from the dashboard frontend on load).

---

### Frontend Components

#### 1. ExamControllerMarksEntryDashboard (New Page)

**Path:** `frontend/src/pages/exam-controller/MarksEntryDashboard.js`
**Route:** `/exam-controller/marks-entry-dashboard`

**Features:**
- Exam selector dropdown (filters by academic year)
- Summary cards: Total, Completed, In Progress, Not Started, Locked, Overdue
- Filterable table with columns: Class, Section, Subject, Teacher, Progress Bar, Status Chip, Lock Toggle, Deadline
- Bulk actions: Assign All, Lock All Completed, Set Deadlines
- Click row to view marks sheet (read-only)

**Key Components:**
- `AssignmentBulkDialog` — triggers bulk assignment with results summary
- `ManualAssignDialog` — assign teacher to unassigned schedule
- `DeadlineSetDialog` — set/edit deadlines with auto-lock toggle
- `ProgressBar` — visual marks_entered/total_students

#### 2. TeacherMarksEntry (Enhanced Existing Page)

**Path:** `frontend/src/pages/teacher/TeacherMarksEntry.js` (existing)
**Enhancements:**

- Replace exam/class/section/subject dropdowns with assignment-based list from `GET /marks-entry/my-assignments`
- Show deadline warning (yellow chip) when within 24 hours
- Show locked indicator (red chip + disabled save) when `is_marks_locked = true`
- Show overdue indicator when deadline has passed
- Add "Mark Absent" checkbox per student row
- Auto-clear marks field when absent is checked
- Show grade auto-calculated in read-only column
- Show pass/fail indicator based on passing_marks

**Data flow:**
1. On mount, call `GET /marks-entry/my-assignments`
2. Teacher selects an assignment → call `GET /marks/sheet?exam_schedule_id=X`
3. Teacher enters marks → call `POST /marks/entry` with entries array
4. On success, refresh progress count

#### 3. StudentMarksView (Enhanced Existing)

**Path:** `frontend/src/pages/student/StudentExams.js` (existing student portal)
**Enhancement:** The existing `/api/student/exams` endpoint already groups results by exam. The only backend change is filtering by `is_marks_locked = True`. Frontend displays:

- Exam name header
- Table: Subject, Marks Obtained, Max Marks, Percentage, Grade, Pass/Fail
- Sorted by exam date descending (most recent first)
- "Results not yet published" message for exams where marks exist but are not locked

---

## Data Flow

### Marks Entry Permission Flow

```
Exam Controller creates Exam + ExamSchedules
         │
         ▼
Exam Controller triggers "Bulk Assign"
         │
         ▼
System queries TeacherSubject WHERE
  class_id, section_id, subject_id match ExamSchedule
  AND status = 'active'
  AND academic_year_id matches
         │
         ▼
Creates MarksEntryAssignment records
  (source='auto', status='active')
         │
         ▼
Unmatched schedules flagged → Exam Controller
manually assigns via ManualAssignDialog
```

### Marks Entry Flow

```
Teacher opens Marks Entry page
         │
         ▼
GET /marks-entry/my-assignments
  → Returns assigned ExamSchedules with progress
         │
         ▼
Teacher selects assignment
         │
         ▼
GET /marks/sheet?exam_schedule_id=X
  → Returns student list with existing marks
         │
         ▼
Teacher enters/updates marks
         │
         ▼
POST /marks/entry
  │
  ├─ Check: MarksEntryAssignment exists & active? → 403 if not
  ├─ Check: is_marks_locked? → 403 if locked
  ├─ Validate: marks <= max_marks, >= 0, max 2 decimals
  ├─ If is_absent: set marks_obtained = null
  ├─ Calculate: percentage = marks / max_marks * 100
  ├─ Calculate: grade from GradingSystem (if configured)
  └─ Upsert ExamResult records
         │
         ▼
Return updated results with grades
```

### Lock/Unlock Flow

```
Exam Controller views Dashboard
         │
         ▼
Sees schedule with 100% completion
         │
         ▼
Clicks "Lock" → POST /marks/lock {exam_schedule_id}
         │
         ▼
ExamSchedule.is_marks_locked = True
         │
         ▼
Teacher sees "Locked" chip, save disabled
Student sees marks on their dashboard
```

### Deadline Auto-Lock Flow

```
Exam Controller sets deadline with auto_lock=true
         │
         ▼
MarksEntryDeadline record created
         │
         ▼
On dashboard load OR periodic check:
POST /marks-entry/deadlines/check-expired
         │
         ▼
System finds deadlines where:
  deadline_date < now() AND auto_lock = true
  AND schedule.is_marks_locked = false
         │
         ▼
Sets is_marks_locked = true on those schedules
```

### Student Visibility Flow

```
Student opens Exams page
         │
         ▼
GET /api/student/exams
         │
         ▼
Backend queries ExamResult
  JOIN ExamSchedule
  WHERE ExamSchedule.is_marks_locked = True
  AND student_id = current_student
         │
         ▼
Groups by exam, calculates totals
         │
         ▼
Returns only locked results to student
(Unlocked marks are invisible to students)
```

---

## Database Changes

### New Tables

#### `marks_entry_assignments`

```sql
CREATE TABLE marks_entry_assignments (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    exam_schedule_id INTEGER NOT NULL REFERENCES exam_schedules(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    assigned_by INTEGER NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    source VARCHAR(10) DEFAULT 'auto' CHECK (source IN ('auto', 'manual')),
    CONSTRAINT uq_one_teacher_per_schedule UNIQUE (exam_schedule_id, school_id)
);
```

#### `marks_entry_deadlines`

```sql
CREATE TABLE marks_entry_deadlines (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    exam_schedule_id INTEGER NOT NULL REFERENCES exam_schedules(id) ON DELETE CASCADE,
    deadline_date TIMESTAMP NOT NULL,
    auto_lock BOOLEAN DEFAULT FALSE,
    set_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_one_deadline_per_schedule UNIQUE (exam_schedule_id, school_id)
);
```

### Indexes

```sql
-- Fast lookup for teacher's assignments
CREATE INDEX idx_mea_teacher_status ON marks_entry_assignments(teacher_id, status);

-- Fast lookup for exam's assignments
CREATE INDEX idx_mea_schedule ON marks_entry_assignments(exam_schedule_id);

-- Deadline expiry check
CREATE INDEX idx_med_deadline_autolock ON marks_entry_deadlines(deadline_date, auto_lock)
    WHERE auto_lock = TRUE;

-- School scoping
CREATE INDEX idx_mea_school ON marks_entry_assignments(school_id);
CREATE INDEX idx_med_school ON marks_entry_deadlines(school_id);
```

### Migration

A single Flask-Migrate migration file creates both tables and indexes:

```
backend/migrations/versions/xxxx_add_marks_entry_assignment_tables.py
```

**Migration steps:**
1. Create `marks_entry_assignments` table
2. Create `marks_entry_deadlines` table
3. Add indexes
4. No changes to existing tables (ExamSchedule.is_marks_locked already exists)

---

## Security Considerations

- **Multi-tenancy:** All queries include `school_id` filter (existing pattern)
- **Role enforcement:** Assignment endpoints restricted to `exam_controller` and `school_admin`
- **Teacher isolation:** Teachers can only see/edit marks for their assigned schedules
- **Lock integrity:** Locked schedules reject all write operations regardless of role (except unlock by authorized roles)
- **Concurrent access:** The unique constraint on `marks_entry_assignments` prevents duplicate assignments; the existing ExamResult upsert pattern handles concurrent marks entry

## Backward Compatibility

- Existing `POST /marks/entry` continues to work for `school_admin` role without assignment (admin bypass)
- Existing `GET /marks/sheet` is unchanged
- Existing `POST /marks/lock` and `POST /marks/unlock` gain `principal` role access but remain backward compatible
- Student portal gains lock-status filtering but existing data (already entered marks) remains accessible if schedules are locked
