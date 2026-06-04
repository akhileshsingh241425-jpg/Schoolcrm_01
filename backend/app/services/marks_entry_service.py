"""Marks Entry Service — assignment, validation, grading, progress, and dashboard logic."""
from app import db
from app.models.academic import (
    MarksEntryAssignment, ScheduleMarksDeadline, ExamSchedule, ExamResult,
    TeacherSubject, Exam, Grade
)
from app.models.student import Student
from app.models.staff import Staff
from datetime import datetime
from decimal import Decimal, InvalidOperation


def bulk_assign(school_id, exam_id, assigned_by_user_id):
    """Match all ExamSchedules under an exam with TeacherSubject allocations.

    For each ExamSchedule, find an active TeacherSubject record matching
    class_id, section_id, and subject_id. Create a MarksEntryAssignment
    for each match. Skip if assignment already exists.

    Continues processing even if some schedules fail.

    Returns:
        dict: {total_schedules, assigned_count, unassigned_count, unassigned_schedules: [...]}
    """
    schedules = ExamSchedule.query.filter_by(
        exam_id=exam_id, school_id=school_id
    ).all()

    total_schedules = len(schedules)
    assigned_count = 0
    unassigned_schedules = []

    for schedule in schedules:
        try:
            # Check if assignment already exists for this schedule
            existing = MarksEntryAssignment.query.filter_by(
                exam_schedule_id=schedule.id,
                school_id=school_id,
                status='active'
            ).first()

            if existing:
                # Already assigned, skip
                assigned_count += 1
                continue

            # Find matching TeacherSubject allocation
            teacher_subject = TeacherSubject.query.filter_by(
                school_id=school_id,
                class_id=schedule.class_id,
                section_id=schedule.section_id,
                subject_id=schedule.subject_id,
                status='active'
            ).first()

            if not teacher_subject:
                unassigned_schedules.append({
                    'exam_schedule_id': schedule.id,
                    'class_name': schedule.class_ref.name if schedule.class_ref else None,
                    'section_name': schedule.section_ref.name if schedule.section_ref else None,
                    'subject_name': schedule.subject.name if schedule.subject else None,
                    'reason': 'no_teacher_subject_match'
                })
                continue

            # Create assignment
            assignment = MarksEntryAssignment(
                school_id=school_id,
                exam_schedule_id=schedule.id,
                teacher_id=teacher_subject.teacher_id,
                assigned_by=assigned_by_user_id,
                status='active',
                source='auto'
            )
            db.session.add(assignment)
            db.session.flush()
            assigned_count += 1

        except Exception:
            # Continue processing remaining schedules on failure
            db.session.rollback()
            unassigned_schedules.append({
                'exam_schedule_id': schedule.id,
                'class_name': schedule.class_ref.name if schedule.class_ref else None,
                'section_name': schedule.section_ref.name if schedule.section_ref else None,
                'subject_name': schedule.subject.name if schedule.subject else None,
                'reason': 'processing_error'
            })
            continue

    db.session.commit()

    return {
        'total_schedules': total_schedules,
        'assigned_count': assigned_count,
        'unassigned_count': len(unassigned_schedules),
        'unassigned_schedules': unassigned_schedules
    }


def manual_assign(school_id, exam_schedule_id, teacher_id, assigned_by_user_id, reassign=False):
    """Assign a teacher to an ExamSchedule with source='manual'.

    If an active assignment already exists:
    - When reassign=True: update it to the new teacher (replace).
    - When reassign=False and same teacher: return the existing assignment (idempotent).
    - When reassign=False and different teacher: raise ValueError.

    Args:
        school_id: School scope.
        exam_schedule_id: The schedule to assign.
        teacher_id: The teacher to assign.
        assigned_by_user_id: User performing the assignment.
        reassign: If True, replace the existing teacher.

    Returns:
        MarksEntryAssignment: The created or updated assignment.

    Raises:
        ValueError: If an active assignment exists for a different teacher and reassign is False.
    """
    existing = MarksEntryAssignment.query.filter_by(
        exam_schedule_id=exam_schedule_id,
        school_id=school_id,
        status='active'
    ).first()

    if existing:
        # Same teacher already assigned — idempotent, just return it
        if existing.teacher_id == teacher_id:
            return existing
        # Different teacher: only replace when reassign requested
        if not reassign:
            raise ValueError(
                f"Assignment already exists for this schedule (assigned to teacher_id={existing.teacher_id})"
            )
        existing.teacher_id = teacher_id
        existing.assigned_by = assigned_by_user_id
        existing.source = 'manual'
        existing.assigned_at = datetime.utcnow()
        db.session.commit()
        return existing

    assignment = MarksEntryAssignment(
        school_id=school_id,
        exam_schedule_id=exam_schedule_id,
        teacher_id=teacher_id,
        assigned_by=assigned_by_user_id,
        status='active',
        source='manual'
    )
    db.session.add(assignment)
    db.session.commit()

    return assignment


def validate_marks_entry(marks_data, exam_schedule):
    """Validate marks entry data against the exam schedule constraints.

    Checks:
    - marks_obtained <= max_marks
    - marks_obtained >= 0
    - max 2 decimal places
    - if is_absent then marks_obtained must be null

    Args:
        marks_data: list of dicts with keys: student_id, marks_obtained, is_absent
        exam_schedule: ExamSchedule instance

    Returns:
        dict: {valid: bool, errors: [...]}
    """
    errors = []
    max_marks = float(exam_schedule.max_marks) if exam_schedule.max_marks else 0

    for i, entry in enumerate(marks_data):
        student_id = entry.get('student_id')
        marks_obtained = entry.get('marks_obtained')
        is_absent = entry.get('is_absent', False)

        # If absent, marks_obtained must be null/None
        if is_absent:
            if marks_obtained is not None:
                errors.append({
                    'student_id': student_id,
                    'index': i,
                    'error': 'marks_obtained must be null when student is marked absent'
                })
            continue

        # If not absent, marks_obtained is required
        if marks_obtained is None:
            continue  # Allow partial saves (no marks yet)

        # Validate numeric value
        try:
            marks_value = Decimal(str(marks_obtained))
        except (InvalidOperation, ValueError, TypeError):
            errors.append({
                'student_id': student_id,
                'index': i,
                'error': 'marks_obtained must be a valid numeric value'
            })
            continue

        # Check non-negative
        if marks_value < 0:
            errors.append({
                'student_id': student_id,
                'index': i,
                'error': 'marks_obtained must be non-negative'
            })
            continue

        # Check max marks
        if float(marks_value) > max_marks:
            errors.append({
                'student_id': student_id,
                'index': i,
                'error': f'marks_obtained ({float(marks_value)}) exceeds max_marks ({max_marks})'
            })

        # Check max 2 decimal places
        if marks_value != marks_value.quantize(Decimal('0.01')):
            errors.append({
                'student_id': student_id,
                'index': i,
                'error': 'marks_obtained must have at most 2 decimal places'
            })

    return {
        'valid': len(errors) == 0,
        'errors': errors
    }


def calculate_grade(marks_obtained, max_marks, exam):
    """Calculate percentage and look up grade from the exam's grading system.

    Args:
        marks_obtained: numeric marks value
        max_marks: maximum marks for the schedule
        exam: Exam instance (has grading_system_id)

    Returns:
        dict: {percentage, grade, grade_point}
    """
    if marks_obtained is None or max_marks is None or float(max_marks) == 0:
        return {'percentage': None, 'grade': None, 'grade_point': None}

    percentage = round((float(marks_obtained) / float(max_marks)) * 100, 2)

    grade_name = None
    grade_point = None

    if exam and exam.grading_system_id:
        # Look up grade from Grade model based on percentage range
        grade = Grade.query.filter(
            Grade.grading_system_id == exam.grading_system_id,
            Grade.min_marks <= Decimal(str(percentage)),
            Grade.max_marks >= Decimal(str(percentage))
        ).first()

        if grade:
            grade_name = grade.name
            grade_point = float(grade.grade_point) if grade.grade_point else None

    return {
        'percentage': percentage,
        'grade': grade_name,
        'grade_point': grade_point
    }


def get_entry_progress(school_id, exam_schedule_id):
    """Count total active students and marks entered for a schedule.

    Returns:
        dict: {total_students, marks_entered, pending, percentage_complete, status}
              status is one of: not_started, in_progress, completed
    """
    schedule = ExamSchedule.query.filter_by(
        id=exam_schedule_id, school_id=school_id
    ).first()

    if not schedule:
        return {
            'total_students': 0,
            'marks_entered': 0,
            'pending': 0,
            'percentage_complete': 0.0,
            'status': 'not_started'
        }

    # Count active students in that class/section
    student_query = Student.query.filter_by(
        school_id=school_id,
        current_class_id=schedule.class_id,
        status='active'
    )
    if schedule.section_id:
        student_query = student_query.filter_by(current_section_id=schedule.section_id)

    total_students = student_query.count()

    # Count ExamResults for this schedule
    marks_entered = ExamResult.query.filter_by(
        exam_schedule_id=exam_schedule_id,
        school_id=school_id
    ).count()

    pending = max(0, total_students - marks_entered)
    percentage_complete = round((marks_entered / total_students * 100), 2) if total_students > 0 else 0.0

    # Determine status
    if marks_entered == 0:
        status = 'not_started'
    elif marks_entered >= total_students:
        status = 'completed'
    else:
        status = 'in_progress'

    return {
        'total_students': total_students,
        'marks_entered': marks_entered,
        'pending': pending,
        'percentage_complete': percentage_complete,
        'status': status
    }


def check_deadlines_and_lock(school_id):
    """Find all expired auto-lock deadlines and lock those schedules.

    Finds MarksEntryDeadline records where:
    - deadline_date < now()
    - auto_lock = True
    - linked ExamSchedule.is_marks_locked = False

    Sets is_marks_locked=True on matched schedules.

    Returns:
        int: Count of newly locked schedules.
    """
    now = datetime.utcnow()

    expired_deadlines = db.session.query(ScheduleMarksDeadline).join(
        ExamSchedule, ScheduleMarksDeadline.exam_schedule_id == ExamSchedule.id
    ).filter(
        ScheduleMarksDeadline.school_id == school_id,
        ScheduleMarksDeadline.deadline_date < now,
        ScheduleMarksDeadline.auto_lock == True,
        ExamSchedule.is_marks_locked == False
    ).all()

    locked_count = 0
    for deadline in expired_deadlines:
        schedule = ExamSchedule.query.get(deadline.exam_schedule_id)
        if schedule and not schedule.is_marks_locked:
            schedule.is_marks_locked = True
            locked_count += 1

    if locked_count > 0:
        db.session.commit()

    return locked_count


def check_exam_completion(school_id, exam_id):
    """Check if all ExamSchedules under an exam have passed their exam_date+end_time.

    If all passed, update Exam.status to 'completed'.
    If some remain, keep as 'ongoing'.

    Returns:
        str: The updated exam status.
    """
    exam = Exam.query.filter_by(id=exam_id, school_id=school_id).first()
    if not exam:
        return None

    schedules = ExamSchedule.query.filter_by(
        exam_id=exam_id, school_id=school_id
    ).all()

    if not schedules:
        return exam.status

    now = datetime.utcnow()
    all_completed = True

    for schedule in schedules:
        if schedule.exam_date and schedule.end_time:
            schedule_end = datetime.combine(schedule.exam_date, schedule.end_time)
            if schedule_end > now:
                all_completed = False
                break
        elif schedule.exam_date:
            # If no end_time, check if exam_date has passed (end of day)
            schedule_end = datetime.combine(schedule.exam_date, datetime.max.time())
            if schedule_end > now:
                all_completed = False
                break
        else:
            # No date info, consider not completed
            all_completed = False
            break

    if all_completed:
        exam.status = 'completed'
    else:
        # Only update to ongoing if currently upcoming
        if exam.status == 'upcoming':
            exam.status = 'ongoing'

    db.session.commit()
    return exam.status


def get_dashboard_data(school_id, exam_id, filters=None):
    """Aggregate marks entry progress for all schedules under an exam.

    For each schedule includes: class_name, section_name, subject_name,
    teacher_name, progress, lock_status, deadline info, entry_status.

    Supports filters: class_id, section_id, subject_id.

    Returns:
        dict: {summary: {total, completed, pending, overdue, locked}, schedules: [...]}
    """
    query = ExamSchedule.query.filter_by(
        exam_id=exam_id, school_id=school_id
    )

    # Apply filters
    if filters:
        if filters.get('class_id'):
            query = query.filter(ExamSchedule.class_id == filters['class_id'])
        if filters.get('section_id'):
            query = query.filter(ExamSchedule.section_id == filters['section_id'])
        if filters.get('subject_id'):
            query = query.filter(ExamSchedule.subject_id == filters['subject_id'])

    schedules = query.all()

    now = datetime.utcnow()
    summary = {
        'total': len(schedules),
        'completed': 0,
        'pending': 0,
        'overdue': 0,
        'locked': 0
    }
    schedule_data = []

    for schedule in schedules:
        # Get assigned teacher
        assignment = MarksEntryAssignment.query.filter_by(
            exam_schedule_id=schedule.id,
            school_id=school_id,
            status='active'
        ).first()

        teacher_name = None
        if assignment and assignment.teacher:
            teacher_name = f"{assignment.teacher.first_name} {assignment.teacher.last_name or ''}".strip()

        # Get progress
        progress = get_entry_progress(school_id, schedule.id)

        # Get deadline info
        deadline = ScheduleMarksDeadline.query.filter_by(
            exam_schedule_id=schedule.id,
            school_id=school_id
        ).first()

        deadline_date = None
        is_overdue = False
        if deadline:
            deadline_date = deadline.deadline_date.isoformat() if deadline.deadline_date else None
            if deadline.deadline_date and deadline.deadline_date < now:
                is_overdue = True

        # Determine entry_status
        if schedule.is_marks_locked:
            entry_status = 'locked'
            summary['locked'] += 1
        elif progress['status'] == 'completed':
            entry_status = 'completed'
            summary['completed'] += 1
        elif is_overdue and progress['status'] != 'completed':
            entry_status = 'overdue'
            summary['overdue'] += 1
        else:
            entry_status = progress['status']  # not_started or in_progress
            summary['pending'] += 1

        schedule_data.append({
            'exam_schedule_id': schedule.id,
            'class_name': schedule.class_ref.name if schedule.class_ref else None,
            'section_name': schedule.section_ref.name if schedule.section_ref else None,
            'subject_name': schedule.subject.name if schedule.subject else None,
            'teacher_name': teacher_name,
            'total_students': progress['total_students'],
            'marks_entered': progress['marks_entered'],
            'pending': progress['pending'],
            'percentage_complete': progress['percentage_complete'],
            'is_marks_locked': schedule.is_marks_locked,
            'entry_status': entry_status,
            'deadline': deadline_date,
            'is_overdue': is_overdue
        })

    return {
        'summary': summary,
        'schedules': schedule_data
    }
