"""Marks Entry System Routes — Assignment management, deadlines, marks submission,
lock/unlock, status checks, and dashboard."""

from datetime import datetime, timedelta
from flask import Blueprint, request, g
from app import db
from app.utils.decorators import school_required, role_required
from app.utils.helpers import success_response, error_response
from app.services.marks_entry_service import (
    bulk_assign, manual_assign, validate_marks_entry, calculate_grade,
    get_entry_progress, check_deadlines_and_lock, check_exam_completion,
    get_dashboard_data
)
from app.models.academic import (
    MarksEntryAssignment, ScheduleMarksDeadline, ExamSchedule, ExamResult, Exam
)
from app.models.staff import Staff

marks_entry_bp = Blueprint('marks_entry', __name__)


# ============================================================
# ASSIGNMENT ROUTES (Task 3)
# ============================================================

@marks_entry_bp.route('/assignments/bulk', methods=['POST'])
@school_required
@role_required('exam_controller', 'school_admin', 'principal')
def bulk_assign_route():
    """Bulk assign teachers from TeacherSubject allocations to ExamSchedules."""
    data = request.get_json()
    exam_id = data.get('exam_id')

    if not exam_id:
        return error_response('exam_id is required', 400)

    result = bulk_assign(
        school_id=g.school_id,
        exam_id=exam_id,
        assigned_by_user_id=g.user_id
    )
    return success_response(result, 'Bulk assignment completed')


@marks_entry_bp.route('/assignments', methods=['POST'])
@school_required
@role_required('exam_controller', 'school_admin')
def manual_assign_route():
    """Manually assign a single teacher to an ExamSchedule."""
    data = request.get_json()
    exam_schedule_id = data.get('exam_schedule_id')
    teacher_id = data.get('teacher_id')
    reassign = data.get('reassign', False)

    if not exam_schedule_id or not teacher_id:
        return error_response('exam_schedule_id and teacher_id are required', 400)

    try:
        assignment = manual_assign(
            school_id=g.school_id,
            exam_schedule_id=exam_schedule_id,
            teacher_id=teacher_id,
            assigned_by_user_id=g.user_id,
            reassign=reassign
        )
        return success_response(assignment.to_dict(), 'Assignment saved')
    except ValueError as e:
        return error_response(str(e), 400)


@marks_entry_bp.route('/assignments', methods=['GET'])
@school_required
@role_required('exam_controller', 'school_admin', 'principal')
def list_assignments():
    """List all assignments for an exam with optional status filter."""
    exam_id = request.args.get('exam_id', type=int)
    status = request.args.get('status')

    if not exam_id:
        return error_response('exam_id query parameter is required', 400)

    query = db.session.query(MarksEntryAssignment).join(
        ExamSchedule, MarksEntryAssignment.exam_schedule_id == ExamSchedule.id
    ).filter(
        ExamSchedule.exam_id == exam_id,
        MarksEntryAssignment.school_id == g.school_id
    )

    if status:
        query = query.filter(MarksEntryAssignment.status == status)

    assignments = query.all()
    return success_response([a.to_dict() for a in assignments])


@marks_entry_bp.route('/assignments/<int:assignment_id>', methods=['DELETE'])
@school_required
@role_required('exam_controller', 'school_admin')
def revoke_assignment(assignment_id):
    """Revoke an assignment (sets status='revoked')."""
    assignment = MarksEntryAssignment.query.filter_by(
        id=assignment_id,
        school_id=g.school_id
    ).first()

    if not assignment:
        return error_response('Assignment not found', 404)

    if assignment.status == 'revoked':
        return error_response('Assignment is already revoked', 400)

    assignment.status = 'revoked'
    db.session.commit()

    return success_response(assignment.to_dict(), 'Assignment revoked')


@marks_entry_bp.route('/my-assignments', methods=['GET'])
@school_required
@role_required('teacher')
def my_assignments():
    """Get current teacher's active assignments with progress info."""
    staff = Staff.query.filter_by(user_id=g.user_id, school_id=g.school_id).first()
    if not staff:
        return error_response('Staff record not found', 404)

    # Build query for active assignments
    query = MarksEntryAssignment.query.filter_by(
        teacher_id=staff.id,
        status='active',
        school_id=g.school_id
    )

    # Optional filter by exam_id
    exam_id = request.args.get('exam_id', type=int)
    if exam_id:
        query = query.join(
            ExamSchedule, MarksEntryAssignment.exam_schedule_id == ExamSchedule.id
        ).filter(ExamSchedule.exam_id == exam_id)

    assignments = query.all()
    now = datetime.utcnow()

    result = []
    for assignment in assignments:
        schedule = assignment.schedule
        if not schedule:
            continue

        exam = schedule.exam if schedule else None

        # Get progress
        progress = get_entry_progress(g.school_id, schedule.id)

        # Get deadline
        deadline = ScheduleMarksDeadline.query.filter_by(
            exam_schedule_id=schedule.id,
            school_id=g.school_id
        ).first()

        deadline_date = deadline.deadline_date if deadline else None
        is_overdue = False
        deadline_approaching = False

        if deadline_date:
            if deadline_date < now:
                is_overdue = True
            elif deadline_date - now <= timedelta(hours=24):
                deadline_approaching = True

        result.append({
            'assignment_id': assignment.id,
            'exam_schedule_id': schedule.id,
            'exam_id': exam.id if exam else None,
            'exam_name': exam.name if exam else None,
            'class_name': schedule.class_ref.name if schedule.class_ref else None,
            'section_name': schedule.section_ref.name if schedule.section_ref else None,
            'subject_name': schedule.subject.name if schedule.subject else None,
            'max_marks': float(schedule.max_marks) if schedule.max_marks else None,
            'is_marks_locked': schedule.is_marks_locked,
            'total_students': progress['total_students'],
            'marks_entered': progress['marks_entered'],
            'deadline': deadline_date.isoformat() if deadline_date else None,
            'is_overdue': is_overdue,
            'deadline_approaching': deadline_approaching,
        })

    return success_response(result)


# ============================================================
# DEADLINE ROUTES (Task 4)
# ============================================================

@marks_entry_bp.route('/deadlines', methods=['POST'])
@school_required
@role_required('exam_controller', 'school_admin')
def set_deadlines():
    """Set deadlines for one or more ExamSchedules (bulk or individual).

    Accepts either:
    - {deadlines: [{exam_schedule_id, deadline_date, auto_lock}, ...]}  (bulk)
    - {exam_schedule_id, deadline_date, auto_lock}  (single)
    - {exam_id, deadline_date, auto_lock}  (all schedules for an exam)
    """
    data = request.get_json()

    # Support bulk via exam_id (set same deadline for all schedules in an exam)
    if 'exam_id' in data and 'deadlines' not in data:
        exam_id = data['exam_id']
        deadline_date_str = data.get('deadline_date')
        auto_lock = data.get('auto_lock', False)

        if not deadline_date_str:
            return error_response('deadline_date is required', 400)

        schedules = ExamSchedule.query.filter_by(
            exam_id=exam_id, school_id=g.school_id
        ).all()

        if not schedules:
            return error_response('No schedules found for this exam', 404)

        # Build deadlines array from all schedules
        deadlines_data = [
            {'exam_schedule_id': s.id, 'deadline_date': deadline_date_str, 'auto_lock': auto_lock}
            for s in schedules
        ]
    elif 'exam_schedule_id' in data and 'deadlines' not in data:
        # Single deadline
        deadlines_data = [{
            'exam_schedule_id': data['exam_schedule_id'],
            'deadline_date': data.get('deadline_date'),
            'auto_lock': data.get('auto_lock', False)
        }]
    else:
        deadlines_data = data.get('deadlines', [])

    if not deadlines_data:
        return error_response('No deadline data provided', 400)

    created = []
    updated = []
    errors = []

    for item in deadlines_data:
        exam_schedule_id = item.get('exam_schedule_id')
        deadline_date_str = item.get('deadline_date')
        auto_lock = item.get('auto_lock', False)

        if not exam_schedule_id or not deadline_date_str:
            errors.append({
                'exam_schedule_id': exam_schedule_id,
                'error': 'exam_schedule_id and deadline_date are required'
            })
            continue

        # Verify schedule exists in this school
        schedule = ExamSchedule.query.filter_by(
            id=exam_schedule_id, school_id=g.school_id
        ).first()
        if not schedule:
            errors.append({
                'exam_schedule_id': exam_schedule_id,
                'error': 'Exam schedule not found'
            })
            continue

        # Parse deadline date
        try:
            deadline_date = datetime.fromisoformat(deadline_date_str)
        except (ValueError, TypeError):
            errors.append({
                'exam_schedule_id': exam_schedule_id,
                'error': 'Invalid deadline_date format. Use ISO format.'
            })
            continue

        # Upsert: check if deadline already exists
        existing = ScheduleMarksDeadline.query.filter_by(
            exam_schedule_id=exam_schedule_id,
            school_id=g.school_id
        ).first()

        if existing:
            existing.deadline_date = deadline_date
            existing.auto_lock = auto_lock
            existing.set_by = g.user_id
            existing.updated_at = datetime.utcnow()
            updated.append(existing.to_dict())
        else:
            deadline_obj = ScheduleMarksDeadline(
                school_id=g.school_id,
                exam_schedule_id=exam_schedule_id,
                deadline_date=deadline_date,
                auto_lock=auto_lock,
                set_by=g.user_id
            )
            db.session.add(deadline_obj)
            created.append(deadline_obj)

    db.session.commit()

    return success_response({
        'created': len(created),
        'updated': len(updated),
        'errors': errors,
        'deadlines': [d.to_dict() for d in created] + updated
    }, 'Deadlines processed')


@marks_entry_bp.route('/deadlines/<int:deadline_id>', methods=['PUT'])
@school_required
@role_required('exam_controller', 'school_admin')
def update_deadline(deadline_id):
    """Update an existing deadline's date and/or auto_lock setting."""
    deadline = ScheduleMarksDeadline.query.filter_by(
        id=deadline_id, school_id=g.school_id
    ).first()

    if not deadline:
        return error_response('Deadline not found', 404)

    data = request.get_json()

    if 'deadline_date' in data:
        try:
            deadline.deadline_date = datetime.fromisoformat(data['deadline_date'])
        except (ValueError, TypeError):
            return error_response('Invalid deadline_date format. Use ISO format.', 400)

    if 'auto_lock' in data:
        deadline.auto_lock = data['auto_lock']

    deadline.set_by = g.user_id
    deadline.updated_at = datetime.utcnow()
    db.session.commit()

    return success_response(deadline.to_dict(), 'Deadline updated')


@marks_entry_bp.route('/deadlines', methods=['GET'])
@school_required
@role_required('exam_controller', 'school_admin', 'principal', 'teacher')
def list_deadlines():
    """List all deadlines for an exam."""
    exam_id = request.args.get('exam_id', type=int)
    if not exam_id:
        return error_response('exam_id query parameter is required', 400)

    deadlines = db.session.query(ScheduleMarksDeadline).join(
        ExamSchedule, ScheduleMarksDeadline.exam_schedule_id == ExamSchedule.id
    ).filter(
        ExamSchedule.exam_id == exam_id,
        ScheduleMarksDeadline.school_id == g.school_id
    ).all()

    return success_response([d.to_dict() for d in deadlines])


@marks_entry_bp.route('/deadlines/check-expired', methods=['POST'])
@school_required
@role_required('exam_controller', 'school_admin')
def check_expired_deadlines():
    """Trigger deadline check and auto-lock expired schedules."""
    locked_count = check_deadlines_and_lock(g.school_id)
    return success_response({'locked_count': locked_count}, 'Deadline check completed')


# ============================================================
# MARKS SUBMISSION (Task 5)
# ============================================================

@marks_entry_bp.route('/submit', methods=['POST'])
@school_required
@role_required('teacher')
def submit_marks():
    """Enhanced marks entry endpoint with assignment-based access control.

    Body: {exam_schedule_id, marks: [{student_id, marks_obtained, is_absent, remarks}]}

    Checks:
    - Assignment exists for the current teacher
    - Schedule is not locked
    - Validates marks (max_marks, non-negative, 2 decimal places)
    - When is_absent=True, forces marks_obtained=None
    - Calculates grade/percentage
    - Records entered_by and entered_at
    """
    data = request.get_json()
    exam_schedule_id = data.get('exam_schedule_id')
    marks_data = data.get('marks', [])

    if not exam_schedule_id:
        return error_response('exam_schedule_id is required', 400)

    if not marks_data:
        return error_response('marks array is required', 400)

    # Get teacher's staff record
    staff = Staff.query.filter_by(user_id=g.user_id, school_id=g.school_id).first()
    if not staff:
        return error_response('Staff record not found', 404)

    # Check assignment exists for this teacher
    assignment = MarksEntryAssignment.query.filter_by(
        exam_schedule_id=exam_schedule_id,
        teacher_id=staff.id,
        status='active',
        school_id=g.school_id
    ).first()

    if not assignment:
        return error_response('No marks entry assignment for this schedule', 403)

    # Get the exam schedule
    schedule = ExamSchedule.query.filter_by(
        id=exam_schedule_id, school_id=g.school_id
    ).first()

    if not schedule:
        return error_response('Exam schedule not found', 404)

    # Check if schedule is locked
    if schedule.is_marks_locked:
        return error_response('Marks entry is locked for this schedule', 403)

    # Validate marks data
    validation = validate_marks_entry(marks_data, schedule)
    if not validation['valid']:
        return error_response('Marks validation failed', 400, validation['errors'])

    # Get the exam for grade calculation
    exam = Exam.query.get(schedule.exam_id)

    # Process each mark entry
    results = []
    for entry in marks_data:
        student_id = entry.get('student_id')
        marks_obtained = entry.get('marks_obtained')
        is_absent = entry.get('is_absent', False)
        remarks = entry.get('remarks')

        # Force marks_obtained to None when absent
        if is_absent:
            marks_obtained = None

        # Calculate grade if marks provided
        grade_info = {'percentage': None, 'grade': None, 'grade_point': None}
        if marks_obtained is not None:
            grade_info = calculate_grade(marks_obtained, schedule.max_marks, exam)

        # Upsert ExamResult
        existing_result = ExamResult.query.filter_by(
            exam_schedule_id=exam_schedule_id,
            student_id=student_id,
            school_id=g.school_id
        ).first()

        if existing_result:
            existing_result.marks_obtained = marks_obtained
            existing_result.is_absent = is_absent
            existing_result.remarks = remarks
            existing_result.percentage = grade_info['percentage']
            existing_result.grade = grade_info['grade']
            existing_result.grade_point = grade_info['grade_point']
            existing_result.entered_by = g.user_id
            existing_result.updated_at = datetime.utcnow()
            results.append(existing_result)
        else:
            new_result = ExamResult(
                exam_schedule_id=exam_schedule_id,
                student_id=student_id,
                school_id=g.school_id,
                marks_obtained=marks_obtained,
                is_absent=is_absent,
                remarks=remarks,
                percentage=grade_info['percentage'],
                grade=grade_info['grade'],
                grade_point=grade_info['grade_point'],
                entered_by=g.user_id,
                entered_at=datetime.utcnow()
            )
            db.session.add(new_result)
            results.append(new_result)

    db.session.commit()

    # Get updated progress
    progress = get_entry_progress(g.school_id, exam_schedule_id)

    return success_response({
        'saved_count': len(results),
        'progress': progress
    }, 'Marks saved successfully')


# ============================================================
# LOCK/UNLOCK ROUTES (Task 6)
# ============================================================

@marks_entry_bp.route('/lock', methods=['POST'])
@school_required
@role_required('exam_controller', 'principal', 'school_admin')
def lock_marks():
    """Lock marks entry for an exam schedule (sets is_marks_locked=True)."""
    data = request.get_json()
    exam_schedule_id = data.get('exam_schedule_id')

    if not exam_schedule_id:
        return error_response('exam_schedule_id is required', 400)

    schedule = ExamSchedule.query.filter_by(
        id=exam_schedule_id, school_id=g.school_id
    ).first()

    if not schedule:
        return error_response('Exam schedule not found', 404)

    if schedule.is_marks_locked:
        return error_response('Schedule is already locked', 400)

    schedule.is_marks_locked = True
    db.session.commit()

    return success_response({
        'exam_schedule_id': schedule.id,
        'is_marks_locked': True
    }, 'Marks locked successfully')


@marks_entry_bp.route('/unlock', methods=['POST'])
@school_required
@role_required('exam_controller', 'principal', 'school_admin')
def unlock_marks():
    """Unlock marks entry for an exam schedule (sets is_marks_locked=False).

    Unlock takes precedence in concurrent scenarios — if a teacher submits
    while an admin unlocks, the unlock wins and the schedule remains editable.
    """
    data = request.get_json()
    exam_schedule_id = data.get('exam_schedule_id')

    if not exam_schedule_id:
        return error_response('exam_schedule_id is required', 400)

    schedule = ExamSchedule.query.filter_by(
        id=exam_schedule_id, school_id=g.school_id
    ).first()

    if not schedule:
        return error_response('Exam schedule not found', 404)

    # Unlock takes precedence — always set to False regardless of current state
    schedule.is_marks_locked = False
    db.session.commit()

    return success_response({
        'exam_schedule_id': schedule.id,
        'is_marks_locked': False
    }, 'Marks unlocked successfully')


# ============================================================
# STATUS & DASHBOARD ROUTES (Task 6 continued)
# ============================================================

@marks_entry_bp.route('/check-exam-status', methods=['POST'])
@school_required
@role_required('exam_controller', 'school_admin')
def check_exam_status():
    """Check and auto-update exam completion status based on schedule end times."""
    data = request.get_json()
    exam_id = data.get('exam_id')

    if not exam_id:
        return error_response('exam_id is required', 400)

    new_status = check_exam_completion(g.school_id, exam_id)

    if new_status is None:
        return error_response('Exam not found', 404)

    return success_response({
        'exam_id': exam_id,
        'status': new_status
    }, 'Exam status checked')


@marks_entry_bp.route('/dashboard', methods=['GET'])
@school_required
@role_required('exam_controller', 'school_admin', 'principal')
def dashboard():
    """Marks entry progress dashboard with summary and per-schedule details."""
    exam_id = request.args.get('exam_id', type=int)
    if not exam_id:
        return error_response('exam_id query parameter is required', 400)

    filters = {}
    class_id = request.args.get('class_id', type=int)
    section_id = request.args.get('section_id', type=int)
    subject_id = request.args.get('subject_id', type=int)

    if class_id:
        filters['class_id'] = class_id
    if section_id:
        filters['section_id'] = section_id
    if subject_id:
        filters['subject_id'] = subject_id

    result = get_dashboard_data(
        school_id=g.school_id,
        exam_id=exam_id,
        filters=filters if filters else None
    )

    return success_response(result)
