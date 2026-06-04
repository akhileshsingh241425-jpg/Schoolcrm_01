"""Academic Controller Routes — Term management, substitutions, workload,
lesson plan approval, homework oversight, promotions, policies, reports, dashboard."""
import json
import io
from datetime import datetime, date, timedelta

from flask import Blueprint, request, g, send_file
from sqlalchemy import func, and_, or_

from app import db
from app.models.academic import (
    Term, TimetableSubstitution, PromotionCriteria, PromotionRecord,
    AcademicPolicy, LessonPlan, Homework, HomeworkSubmission,
    Timetable, TeacherSubject, Syllabus, AcademicCalendar, Subject
)
from app.models.student import Student, Class, Section, AcademicYear
from app.models.staff import Staff
from app.utils.decorators import school_required, role_required
from app.utils.helpers import success_response, error_response
from app.services.timetable_service import (
    check_substitution_conflict, get_teacher_weekly_workload
)
from app.services.promotion_service import evaluate_class, confirm_promotions
from app.services.academic_analytics_service import (
    get_dashboard_summary, get_class_performance, get_teacher_performance,
    get_cross_section_comparison, get_trend_analysis,
    get_homework_analytics, get_homework_frequency
)

academic_controller_bp = Blueprint('academic_controller', __name__)


# ============================================================
# TERM MANAGEMENT
# ============================================================

@academic_controller_bp.route('/terms', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def list_terms():
    """List terms filtered by academic_year_id."""
    academic_year_id = request.args.get('academic_year_id', type=int)

    query = Term.query.filter_by(school_id=g.school_id)
    if academic_year_id:
        query = query.filter_by(academic_year_id=academic_year_id)

    terms = query.order_by(Term.start_date).all()
    return success_response([t.to_dict() for t in terms])


@academic_controller_bp.route('/terms', methods=['POST'])
@school_required
@role_required('school_admin', 'academic_controller')
def create_term():
    """Create a new term with date validation."""
    data = request.get_json()
    if not data:
        return error_response('Request body is required', 400)

    name = data.get('name')
    academic_year_id = data.get('academic_year_id')
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')

    if not all([name, academic_year_id, start_date_str, end_date_str]):
        return error_response('name, academic_year_id, start_date, and end_date are required', 400)

    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return error_response('Invalid date format. Use YYYY-MM-DD', 400)

    # Validate start < end
    if start_date >= end_date:
        return error_response('Start date must be before end date', 400)

    # Validate academic year exists and term is within bounds
    academic_year = AcademicYear.query.filter_by(
        id=academic_year_id, school_id=g.school_id
    ).first()
    if not academic_year:
        return error_response('Academic year not found', 404)

    if start_date < academic_year.start_date or end_date > academic_year.end_date:
        return error_response(
            'Term dates must be within academic year bounds '
            f'({academic_year.start_date.isoformat()} to {academic_year.end_date.isoformat()})',
            400
        )

    # Check overlap with existing terms in same academic year
    overlap = Term.query.filter(
        Term.school_id == g.school_id,
        Term.academic_year_id == academic_year_id,
        Term.start_date < end_date,
        Term.end_date > start_date,
    ).first()
    if overlap:
        return error_response(
            f'Term dates overlap with existing term "{overlap.name}"', 409,
            errors={'conflict_type': 'term_overlap', 'conflicting_term_id': overlap.id}
        )

    # Check unique name within academic year
    existing_name = Term.query.filter_by(
        school_id=g.school_id, academic_year_id=academic_year_id, name=name
    ).first()
    if existing_name:
        return error_response(f'A term named "{name}" already exists in this academic year', 409)

    term = Term(
        school_id=g.school_id,
        academic_year_id=academic_year_id,
        name=name,
        start_date=start_date,
        end_date=end_date,
        is_current=data.get('is_current', False),
    )
    db.session.add(term)
    db.session.commit()

    return success_response(term.to_dict(), 'Term created successfully', 201)


@academic_controller_bp.route('/terms/<int:term_id>', methods=['PUT'])
@school_required
@role_required('school_admin', 'academic_controller')
def update_term(term_id):
    """Update an existing term."""
    term = Term.query.filter_by(id=term_id, school_id=g.school_id).first()
    if not term:
        return error_response('Term not found', 404)

    data = request.get_json()
    if not data:
        return error_response('Request body is required', 400)

    name = data.get('name', term.name)
    start_date_str = data.get('start_date')
    end_date_str = data.get('end_date')

    start_date = term.start_date
    end_date = term.end_date

    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return error_response('Invalid start_date format. Use YYYY-MM-DD', 400)
    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except (ValueError, TypeError):
            return error_response('Invalid end_date format. Use YYYY-MM-DD', 400)

    if start_date >= end_date:
        return error_response('Start date must be before end date', 400)

    # Validate within academic year bounds
    academic_year = AcademicYear.query.filter_by(
        id=term.academic_year_id, school_id=g.school_id
    ).first()
    if academic_year:
        if start_date < academic_year.start_date or end_date > academic_year.end_date:
            return error_response(
                'Term dates must be within academic year bounds', 400
            )

    # Check overlap (exclude current term)
    overlap = Term.query.filter(
        Term.school_id == g.school_id,
        Term.academic_year_id == term.academic_year_id,
        Term.id != term_id,
        Term.start_date < end_date,
        Term.end_date > start_date,
    ).first()
    if overlap:
        return error_response(
            f'Term dates overlap with existing term "{overlap.name}"', 409
        )

    # Check unique name (exclude current)
    if name != term.name:
        existing_name = Term.query.filter(
            Term.school_id == g.school_id,
            Term.academic_year_id == term.academic_year_id,
            Term.name == name,
            Term.id != term_id,
        ).first()
        if existing_name:
            return error_response(f'A term named "{name}" already exists in this academic year', 409)

    term.name = name
    term.start_date = start_date
    term.end_date = end_date
    if 'is_current' in data:
        term.is_current = data['is_current']

    db.session.commit()
    return success_response(term.to_dict(), 'Term updated successfully')


@academic_controller_bp.route('/terms/<int:term_id>', methods=['DELETE'])
@school_required
@role_required('school_admin', 'academic_controller')
def delete_term(term_id):
    """Delete a term."""
    term = Term.query.filter_by(id=term_id, school_id=g.school_id).first()
    if not term:
        return error_response('Term not found', 404)

    db.session.delete(term)
    db.session.commit()
    return success_response(None, 'Term deleted successfully')


@academic_controller_bp.route('/academic-years/<int:year_id>/set-current', methods=['PUT'])
@school_required
@role_required('school_admin', 'academic_controller')
def set_current_academic_year(year_id):
    """Switch the current academic year (single transaction)."""
    academic_year = AcademicYear.query.filter_by(
        id=year_id, school_id=g.school_id
    ).first()
    if not academic_year:
        return error_response('Academic year not found', 404)

    # Deactivate all other academic years for this school
    AcademicYear.query.filter(
        AcademicYear.school_id == g.school_id,
        AcademicYear.id != year_id
    ).update({'is_current': False})

    academic_year.is_current = True
    db.session.commit()

    return success_response(academic_year.to_dict(), 'Current academic year updated')


# ============================================================
# TIMETABLE SUBSTITUTIONS
# ============================================================

@academic_controller_bp.route('/substitutions', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def list_substitutions():
    """List substitutions with filters (date, teacher, status)."""
    query = TimetableSubstitution.query.filter_by(school_id=g.school_id)

    date_str = request.args.get('date')
    teacher_id = request.args.get('teacher_id', type=int)
    status = request.args.get('status')

    if date_str:
        try:
            filter_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            query = query.filter_by(date=filter_date)
        except (ValueError, TypeError):
            pass
    if teacher_id:
        query = query.filter_by(substitute_teacher_id=teacher_id)
    if status:
        query = query.filter_by(status=status)

    subs = query.order_by(TimetableSubstitution.date.desc()).all()
    results = []
    for sub in subs:
        item = {
            'id': sub.id,
            'timetable_id': sub.timetable_id,
            'substitute_teacher_id': sub.substitute_teacher_id,
            'date': sub.date.isoformat() if sub.date else None,
            'reason': sub.reason,
            'status': sub.status,
            'assigned_by': sub.assigned_by,
            'created_at': sub.created_at.isoformat() if sub.created_at else None,
        }
        # Include timetable details
        if sub.timetable:
            item['timetable'] = {
                'period_number': sub.timetable.period_number,
                'day_of_week': sub.timetable.day_of_week,
                'original_teacher_id': sub.timetable.teacher_id,
                'class_id': sub.timetable.class_id,
                'section_id': sub.timetable.section_id,
                'subject_id': sub.timetable.subject_id,
            }
        # Include substitute teacher name
        teacher = Staff.query.get(sub.substitute_teacher_id)
        if teacher:
            item['substitute_teacher_name'] = teacher.full_name if hasattr(teacher, 'full_name') else f"{teacher.first_name} {teacher.last_name}"
        results.append(item)

    return success_response(results)


@academic_controller_bp.route('/substitutions', methods=['POST'])
@school_required
@role_required('school_admin', 'academic_controller')
def create_substitution():
    """Create a substitution with conflict check."""
    data = request.get_json()
    if not data:
        return error_response('Request body is required', 400)

    timetable_id = data.get('timetable_id')
    substitute_teacher_id = data.get('substitute_teacher_id')
    date_str = data.get('date')
    reason = data.get('reason', '')

    if not all([timetable_id, substitute_teacher_id, date_str]):
        return error_response('timetable_id, substitute_teacher_id, and date are required', 400)

    try:
        sub_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return error_response('Invalid date format. Use YYYY-MM-DD', 400)

    # Validate date is current or future
    if sub_date < date.today():
        return error_response('Substitution date must be today or in the future', 400)

    # Validate timetable entry exists
    timetable = Timetable.query.filter_by(
        id=timetable_id, school_id=g.school_id
    ).first()
    if not timetable:
        return error_response('Timetable entry not found', 404)

    # Validate substitute teacher exists
    teacher = Staff.query.filter_by(
        id=substitute_teacher_id, school_id=g.school_id
    ).first()
    if not teacher:
        return error_response('Substitute teacher not found', 404)

    # Check conflict: substitute teacher availability
    has_conflict = check_substitution_conflict(
        g.school_id, substitute_teacher_id, sub_date, timetable.period_number
    )
    if has_conflict:
        return error_response(
            'Substitute teacher has a conflict during this period', 409,
            errors={'conflict_type': 'substitution', 'teacher_id': substitute_teacher_id}
        )

    substitution = TimetableSubstitution(
        school_id=g.school_id,
        timetable_id=timetable_id,
        substitute_teacher_id=substitute_teacher_id,
        date=sub_date,
        reason=reason,
        status='assigned',
        assigned_by=g.user_id,
    )
    db.session.add(substitution)
    db.session.commit()

    return success_response({
        'id': substitution.id,
        'timetable_id': substitution.timetable_id,
        'substitute_teacher_id': substitution.substitute_teacher_id,
        'date': substitution.date.isoformat(),
        'reason': substitution.reason,
        'status': substitution.status,
    }, 'Substitution created successfully', 201)


@academic_controller_bp.route('/substitutions/<int:sub_id>', methods=['PUT'])
@school_required
@role_required('school_admin', 'academic_controller')
def update_substitution(sub_id):
    """Update substitution status."""
    substitution = TimetableSubstitution.query.filter_by(
        id=sub_id, school_id=g.school_id
    ).first()
    if not substitution:
        return error_response('Substitution not found', 404)

    data = request.get_json()
    if not data:
        return error_response('Request body is required', 400)

    status = data.get('status')
    if status and status in ('assigned', 'completed', 'cancelled'):
        substitution.status = status
    elif status:
        return error_response('Invalid status. Must be: assigned, completed, or cancelled', 400)

    if 'reason' in data:
        substitution.reason = data['reason']

    db.session.commit()
    return success_response({
        'id': substitution.id,
        'status': substitution.status,
        'reason': substitution.reason,
    }, 'Substitution updated successfully')


@academic_controller_bp.route('/substitutions/<int:sub_id>', methods=['DELETE'])
@school_required
@role_required('school_admin', 'academic_controller')
def cancel_substitution(sub_id):
    """Cancel a substitution (soft delete via status change)."""
    substitution = TimetableSubstitution.query.filter_by(
        id=sub_id, school_id=g.school_id
    ).first()
    if not substitution:
        return error_response('Substitution not found', 404)

    substitution.status = 'cancelled'
    db.session.commit()
    return success_response(None, 'Substitution cancelled successfully')


# ============================================================
# TEACHER WORKLOAD
# ============================================================

@academic_controller_bp.route('/teacher-workload', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def list_teacher_workload():
    """List all teachers with workload summary."""
    # Get current academic year
    current_year = AcademicYear.query.filter_by(
        school_id=g.school_id, is_current=True
    ).first()
    academic_year_id = current_year.id if current_year else None

    # Get all teachers (staff with designation containing 'teacher' or all staff)
    teachers = Staff.query.filter_by(school_id=g.school_id, status='active').all()

    results = []
    for teacher in teachers:
        # Get weekly workload (non-break periods)
        weekly_periods = 0
        if academic_year_id:
            weekly_periods = get_teacher_weekly_workload(
                g.school_id, teacher.id, academic_year_id
            )

        # Get subject/class count from TeacherSubject
        assignments = TeacherSubject.query.filter_by(
            school_id=g.school_id, teacher_id=teacher.id, status='active'
        ).all()
        class_ids = set(a.class_id for a in assignments)
        subject_ids = set(a.subject_id for a in assignments)

        results.append({
            'teacher_id': teacher.id,
            'teacher_name': f"{teacher.first_name} {teacher.last_name}",
            'designation': teacher.designation if hasattr(teacher, 'designation') else None,
            'weekly_periods': weekly_periods,
            'class_count': len(class_ids),
            'subject_count': len(subject_ids),
        })

    return success_response(results)


@academic_controller_bp.route('/teacher-workload/<int:teacher_id>', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def get_teacher_workload_detail(teacher_id):
    """Detailed workload for a specific teacher."""
    teacher = Staff.query.filter_by(id=teacher_id, school_id=g.school_id).first()
    if not teacher:
        return error_response('Teacher not found', 404)

    current_year = AcademicYear.query.filter_by(
        school_id=g.school_id, is_current=True
    ).first()
    academic_year_id = current_year.id if current_year else None

    weekly_periods = 0
    if academic_year_id:
        weekly_periods = get_teacher_weekly_workload(
            g.school_id, teacher.id, academic_year_id
        )

    # Get detailed assignments
    assignments = TeacherSubject.query.filter_by(
        school_id=g.school_id, teacher_id=teacher.id, status='active'
    ).all()

    assignment_details = []
    for a in assignments:
        class_obj = Class.query.get(a.class_id)
        section_obj = Section.query.get(a.section_id) if a.section_id else None
        subject_obj = Subject.query.get(a.subject_id) if a.subject_id else None
        assignment_details.append({
            'class_id': a.class_id,
            'class_name': class_obj.name if class_obj else None,
            'section_id': a.section_id,
            'section_name': section_obj.name if section_obj else None,
            'subject_id': a.subject_id,
            'subject_name': subject_obj.name if subject_obj else None,
            'periods_per_week': a.periods_per_week if hasattr(a, 'periods_per_week') else None,
        })

    # Get timetable entries for this teacher
    timetable_entries = []
    if academic_year_id:
        entries = Timetable.query.filter_by(
            school_id=g.school_id, teacher_id=teacher.id,
            academic_year_id=academic_year_id
        ).filter(Timetable.is_break == False).order_by(
            Timetable.day_of_week, Timetable.period_number
        ).all()
        for e in entries:
            timetable_entries.append({
                'day_of_week': e.day_of_week,
                'period_number': e.period_number,
                'start_time': e.start_time.strftime('%H:%M') if e.start_time else None,
                'end_time': e.end_time.strftime('%H:%M') if e.end_time else None,
                'class_id': e.class_id,
                'section_id': e.section_id,
                'subject_id': e.subject_id,
            })

    return success_response({
        'teacher_id': teacher.id,
        'teacher_name': f"{teacher.first_name} {teacher.last_name}",
        'weekly_periods': weekly_periods,
        'assignments': assignment_details,
        'timetable': timetable_entries,
    })


# ============================================================
# LESSON PLAN APPROVAL
# ============================================================

@academic_controller_bp.route('/lesson-plans/pending', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def list_pending_lesson_plans():
    """List submitted lesson plans awaiting review."""
    query = LessonPlan.query.filter_by(
        school_id=g.school_id, status='submitted'
    )

    # Optional filters
    teacher_id = request.args.get('teacher_id', type=int)
    class_id = request.args.get('class_id', type=int)
    subject_id = request.args.get('subject_id', type=int)

    if teacher_id:
        query = query.filter_by(teacher_id=teacher_id)
    if class_id:
        query = query.filter_by(class_id=class_id)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)

    plans = query.order_by(LessonPlan.created_at.desc()).all()
    return success_response([p.to_dict() for p in plans])


@academic_controller_bp.route('/lesson-plans/<int:plan_id>/approve', methods=['PUT'])
@school_required
@role_required('school_admin', 'academic_controller')
def approve_lesson_plan(plan_id):
    """Approve a submitted lesson plan."""
    plan = LessonPlan.query.filter_by(id=plan_id, school_id=g.school_id).first()
    if not plan:
        return error_response('Lesson plan not found', 404)

    if plan.status != 'submitted':
        return error_response(
            f'Only submitted plans can be approved. Current status: {plan.status}', 400
        )

    plan.status = 'approved'
    plan.approved_by = g.user_id
    plan.approved_at = datetime.utcnow()
    db.session.commit()

    return success_response(plan.to_dict(), 'Lesson plan approved')


@academic_controller_bp.route('/lesson-plans/<int:plan_id>/reject', methods=['PUT'])
@school_required
@role_required('school_admin', 'academic_controller')
def reject_lesson_plan(plan_id):
    """Reject a submitted lesson plan with reason."""
    plan = LessonPlan.query.filter_by(id=plan_id, school_id=g.school_id).first()
    if not plan:
        return error_response('Lesson plan not found', 404)

    if plan.status != 'submitted':
        return error_response(
            f'Only submitted plans can be rejected. Current status: {plan.status}', 400
        )

    data = request.get_json()
    reason = data.get('reason', '') if data else ''

    if not reason or len(reason.strip()) < 10:
        return error_response('Rejection reason must be at least 10 characters', 400)

    plan.status = 'rejected'
    plan.rejection_reason = reason.strip()
    plan.approved_by = g.user_id
    plan.approved_at = datetime.utcnow()
    db.session.commit()

    return success_response(plan.to_dict(), 'Lesson plan rejected')


@academic_controller_bp.route('/lesson-plans/<int:plan_id>/revision', methods=['PUT'])
@school_required
@role_required('school_admin', 'academic_controller')
def request_lesson_plan_revision(plan_id):
    """Request revision of a submitted lesson plan with feedback."""
    plan = LessonPlan.query.filter_by(id=plan_id, school_id=g.school_id).first()
    if not plan:
        return error_response('Lesson plan not found', 404)

    if plan.status != 'submitted':
        return error_response(
            f'Only submitted plans can be sent for revision. Current status: {plan.status}', 400
        )

    data = request.get_json()
    feedback = data.get('feedback', '') if data else ''

    if not feedback or len(feedback.strip()) < 10:
        return error_response('Revision feedback must be at least 10 characters', 400)

    plan.status = 'revision_needed'
    plan.rejection_reason = feedback.strip()
    plan.approved_by = g.user_id
    plan.approved_at = datetime.utcnow()
    db.session.commit()

    return success_response(plan.to_dict(), 'Revision requested')


@academic_controller_bp.route('/lesson-plans/stats', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def lesson_plan_stats():
    """Submission statistics per teacher."""
    academic_year_id = request.args.get('academic_year_id', type=int)

    query = db.session.query(
        LessonPlan.teacher_id,
        func.count(LessonPlan.id).label('total'),
        func.sum(func.cast(LessonPlan.status == 'submitted', db.Integer)).label('submitted'),
        func.sum(func.cast(LessonPlan.status == 'approved', db.Integer)).label('approved'),
        func.sum(func.cast(LessonPlan.status == 'rejected', db.Integer)).label('rejected'),
        func.sum(func.cast(LessonPlan.status == 'revision_needed', db.Integer)).label('revision_needed'),
        func.sum(func.cast(LessonPlan.status == 'draft', db.Integer)).label('draft'),
    ).filter(LessonPlan.school_id == g.school_id)

    if academic_year_id:
        query = query.filter(LessonPlan.academic_year_id == academic_year_id)

    query = query.group_by(LessonPlan.teacher_id)
    rows = query.all()

    stats = []
    for row in rows:
        teacher = Staff.query.get(row.teacher_id)
        stats.append({
            'teacher_id': row.teacher_id,
            'teacher_name': f"{teacher.first_name} {teacher.last_name}" if teacher else None,
            'total': row.total or 0,
            'submitted': row.submitted or 0,
            'approved': row.approved or 0,
            'rejected': row.rejected or 0,
            'revision_needed': row.revision_needed or 0,
            'draft': row.draft or 0,
        })

    return success_response(stats)


# ============================================================
# HOMEWORK OVERSIGHT
# ============================================================

@academic_controller_bp.route('/homework/overview', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def homework_overview():
    """All homework with filters."""
    query = Homework.query.filter_by(school_id=g.school_id)

    class_id = request.args.get('class_id', type=int)
    section_id = request.args.get('section_id', type=int)
    subject_id = request.args.get('subject_id', type=int)
    teacher_id = request.args.get('teacher_id', type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    status = request.args.get('status')

    if class_id:
        query = query.filter_by(class_id=class_id)
    if section_id:
        query = query.filter_by(section_id=section_id)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if teacher_id:
        query = query.filter_by(teacher_id=teacher_id)
    if start_date:
        try:
            query = query.filter(Homework.assigned_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
        except (ValueError, TypeError):
            pass
    if end_date:
        try:
            query = query.filter(Homework.assigned_date <= datetime.strptime(end_date, '%Y-%m-%d').date())
        except (ValueError, TypeError):
            pass
    if status:
        query = query.filter_by(status=status)

    homework_list = query.order_by(Homework.assigned_date.desc()).all()
    return success_response([h.to_dict() for h in homework_list])


@academic_controller_bp.route('/homework/analytics', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def homework_analytics():
    """Homework analytics: total count, avg submissions, late submission percentage."""
    filters = {
        'class_id': request.args.get('class_id', type=int),
        'section_id': request.args.get('section_id', type=int),
        'subject_id': request.args.get('subject_id', type=int),
        'teacher_id': request.args.get('teacher_id', type=int),
        'start_date': request.args.get('start_date'),
        'end_date': request.args.get('end_date'),
    }
    # Remove None values
    filters = {k: v for k, v in filters.items() if v is not None}

    result = get_homework_analytics(g.school_id, filters)
    return success_response(result)


@academic_controller_bp.route('/homework/frequency', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def homework_frequency():
    """Frequency per subject per class (assignments per week)."""
    class_id = request.args.get('class_id', type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not class_id:
        return error_response('class_id is required', 400)
    if not start_date or not end_date:
        return error_response('start_date and end_date are required', 400)

    result = get_homework_frequency(g.school_id, class_id, {
        'start_date': start_date,
        'end_date': end_date,
    })
    return success_response(result)


@academic_controller_bp.route('/homework/workload-alerts', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def homework_workload_alerts():
    """Classes with >3 homework due on same date."""
    # Find dates where a class has more than 3 homework assignments due
    alerts_query = db.session.query(
        Homework.class_id,
        Homework.due_date,
        func.count(Homework.id).label('homework_count')
    ).filter(
        Homework.school_id == g.school_id,
        Homework.due_date.isnot(None)
    ).group_by(
        Homework.class_id, Homework.due_date
    ).having(func.count(Homework.id) > 3).all()

    alerts = []
    for row in alerts_query:
        class_obj = Class.query.get(row.class_id)
        alerts.append({
            'class_id': row.class_id,
            'class_name': class_obj.name if class_obj else None,
            'due_date': row.due_date.isoformat() if row.due_date else None,
            'homework_count': row.homework_count,
        })

    return success_response(alerts)


# ============================================================
# PROMOTION MANAGEMENT
# ============================================================

@academic_controller_bp.route('/promotions/criteria', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def list_promotion_criteria():
    """List promotion criteria."""
    academic_year_id = request.args.get('academic_year_id', type=int)
    class_id = request.args.get('class_id', type=int)

    query = PromotionCriteria.query.filter_by(school_id=g.school_id)
    if academic_year_id:
        query = query.filter_by(academic_year_id=academic_year_id)
    if class_id:
        query = query.filter_by(class_id=class_id)

    criteria_list = query.all()
    results = []
    for c in criteria_list:
        class_obj = Class.query.get(c.class_id)
        results.append({
            'id': c.id,
            'class_id': c.class_id,
            'class_name': class_obj.name if class_obj else None,
            'academic_year_id': c.academic_year_id,
            'min_attendance_pct': float(c.min_attendance_pct) if c.min_attendance_pct else 75.0,
            'min_overall_pct': float(c.min_overall_pct) if c.min_overall_pct else 33.0,
            'min_subject_pass_count': c.min_subject_pass_count or 0,
            'max_failed_for_compartment': c.max_failed_for_compartment or 2,
            'mandatory_subjects': json.loads(c.mandatory_subjects) if c.mandatory_subjects else [],
            'created_at': c.created_at.isoformat() if c.created_at else None,
        })

    return success_response(results)


@academic_controller_bp.route('/promotions/criteria', methods=['POST'])
@school_required
@role_required('school_admin', 'academic_controller')
def create_promotion_criteria():
    """Define promotion criteria for a class."""
    data = request.get_json()
    if not data:
        return error_response('Request body is required', 400)

    class_id = data.get('class_id')
    academic_year_id = data.get('academic_year_id')

    if not class_id:
        return error_response('class_id is required', 400)

    # Check class exists
    class_obj = Class.query.filter_by(id=class_id, school_id=g.school_id).first()
    if not class_obj:
        return error_response('Class not found', 404)

    # Check unique constraint
    existing = PromotionCriteria.query.filter_by(
        school_id=g.school_id, class_id=class_id, academic_year_id=academic_year_id
    ).first()
    if existing:
        return error_response('Promotion criteria already exist for this class and academic year', 409)

    mandatory_subjects = data.get('mandatory_subjects', [])
    if isinstance(mandatory_subjects, list):
        mandatory_subjects = json.dumps(mandatory_subjects)

    criteria = PromotionCriteria(
        school_id=g.school_id,
        class_id=class_id,
        academic_year_id=academic_year_id,
        min_attendance_pct=data.get('min_attendance_pct', 75.0),
        min_overall_pct=data.get('min_overall_pct', 33.0),
        min_subject_pass_count=data.get('min_subject_pass_count', 0),
        max_failed_for_compartment=data.get('max_failed_for_compartment', 2),
        mandatory_subjects=mandatory_subjects,
        created_by=g.user_id,
    )
    db.session.add(criteria)
    db.session.commit()

    return success_response({
        'id': criteria.id,
        'class_id': criteria.class_id,
        'academic_year_id': criteria.academic_year_id,
        'min_attendance_pct': float(criteria.min_attendance_pct),
        'min_overall_pct': float(criteria.min_overall_pct),
        'min_subject_pass_count': criteria.min_subject_pass_count,
        'max_failed_for_compartment': criteria.max_failed_for_compartment,
    }, 'Promotion criteria created', 201)


@academic_controller_bp.route('/promotions/criteria/<int:criteria_id>', methods=['PUT'])
@school_required
@role_required('school_admin', 'academic_controller')
def update_promotion_criteria(criteria_id):
    """Update promotion criteria."""
    criteria = PromotionCriteria.query.filter_by(
        id=criteria_id, school_id=g.school_id
    ).first()
    if not criteria:
        return error_response('Promotion criteria not found', 404)

    data = request.get_json()
    if not data:
        return error_response('Request body is required', 400)

    if 'min_attendance_pct' in data:
        criteria.min_attendance_pct = data['min_attendance_pct']
    if 'min_overall_pct' in data:
        criteria.min_overall_pct = data['min_overall_pct']
    if 'min_subject_pass_count' in data:
        criteria.min_subject_pass_count = data['min_subject_pass_count']
    if 'max_failed_for_compartment' in data:
        criteria.max_failed_for_compartment = data['max_failed_for_compartment']
    if 'mandatory_subjects' in data:
        mandatory = data['mandatory_subjects']
        if isinstance(mandatory, list):
            criteria.mandatory_subjects = json.dumps(mandatory)
        else:
            criteria.mandatory_subjects = mandatory

    db.session.commit()
    return success_response({
        'id': criteria.id,
        'min_attendance_pct': float(criteria.min_attendance_pct),
        'min_overall_pct': float(criteria.min_overall_pct),
        'min_subject_pass_count': criteria.min_subject_pass_count,
        'max_failed_for_compartment': criteria.max_failed_for_compartment,
    }, 'Promotion criteria updated')


@academic_controller_bp.route('/promotions/evaluate/<int:class_id>', methods=['POST'])
@school_required
@role_required('school_admin', 'academic_controller')
def evaluate_promotions(class_id):
    """Evaluate students against promotion criteria."""
    data = request.get_json() or {}
    academic_year_id = data.get('academic_year_id')

    if not academic_year_id:
        # Use current academic year
        current_year = AcademicYear.query.filter_by(
            school_id=g.school_id, is_current=True
        ).first()
        if not current_year:
            return error_response('No current academic year found', 400)
        academic_year_id = current_year.id

    result = evaluate_class(g.school_id, class_id, academic_year_id)

    if isinstance(result, dict) and 'error' in result:
        status_code = 400
        if result.get('reason') == 'results_not_published':
            status_code = 400
        return error_response(result['error'], status_code, errors={'reason': result.get('reason')})

    # Return summary of evaluation
    promote_count = sum(1 for r in result if r.recommendation == 'promote')
    compartment_count = sum(1 for r in result if r.recommendation == 'compartment')
    detain_count = sum(1 for r in result if r.recommendation == 'detain')

    records = []
    for r in result:
        student = Student.query.get(r.student_id)
        records.append({
            'id': r.id,
            'student_id': r.student_id,
            'student_name': f"{student.first_name} {student.last_name}" if student else None,
            'recommendation': r.recommendation,
            'attendance_pct': float(r.attendance_pct) if r.attendance_pct else 0,
            'overall_pct': float(r.overall_pct) if r.overall_pct else 0,
            'failed_subjects': r.failed_subjects,
        })

    return success_response({
        'total_students': len(result),
        'promote': promote_count,
        'compartment': compartment_count,
        'detain': detain_count,
        'records': records,
    }, 'Evaluation completed', 201)


@academic_controller_bp.route('/promotions/override/<int:record_id>', methods=['PUT'])
@school_required
@role_required('school_admin', 'academic_controller')
def override_promotion(record_id):
    """Override individual promotion recommendation."""
    record = PromotionRecord.query.filter_by(
        id=record_id, school_id=g.school_id
    ).first()
    if not record:
        return error_response('Promotion record not found', 404)

    if record.status != 'pending':
        return error_response('Can only override pending promotion records', 400)

    data = request.get_json()
    if not data:
        return error_response('Request body is required', 400)

    final_decision = data.get('final_decision')
    reason = data.get('reason', '')

    if final_decision not in ('promote', 'compartment', 'detain'):
        return error_response('final_decision must be: promote, compartment, or detain', 400)

    if not reason or len(reason.strip()) < 10:
        return error_response('Override reason must be at least 10 characters', 400)

    record.final_decision = final_decision
    record.override_reason = reason.strip()
    record.overridden_by = g.user_id
    db.session.commit()

    return success_response({
        'id': record.id,
        'student_id': record.student_id,
        'recommendation': record.recommendation,
        'final_decision': record.final_decision,
        'override_reason': record.override_reason,
    }, 'Promotion override applied')


@academic_controller_bp.route('/promotions/confirm/<int:class_id>', methods=['POST'])
@school_required
@role_required('school_admin', 'academic_controller')
def confirm_class_promotions(class_id):
    """Confirm and execute promotions for a class."""
    data = request.get_json() or {}
    academic_year_id = data.get('academic_year_id')

    if not academic_year_id:
        current_year = AcademicYear.query.filter_by(
            school_id=g.school_id, is_current=True
        ).first()
        if not current_year:
            return error_response('No current academic year found', 400)
        academic_year_id = current_year.id

    result = confirm_promotions(g.school_id, class_id, academic_year_id, g.user_id)

    if isinstance(result, dict) and 'error' in result:
        return error_response(result['error'], 400)

    return success_response(result, 'Promotions confirmed successfully')


@academic_controller_bp.route('/promotions/summary/<int:class_id>', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def promotion_summary(class_id):
    """Promotion summary report for a class."""
    academic_year_id = request.args.get('academic_year_id', type=int)

    if not academic_year_id:
        current_year = AcademicYear.query.filter_by(
            school_id=g.school_id, is_current=True
        ).first()
        if current_year:
            academic_year_id = current_year.id

    records = PromotionRecord.query.filter_by(
        school_id=g.school_id,
        from_class_id=class_id,
        academic_year_id=academic_year_id,
    ).all()

    if not records:
        return success_response({
            'total_students': 0,
            'promoted': 0,
            'detained': 0,
            'compartment': 0,
            'pending': 0,
            'confirmed': 0,
            'overrides': 0,
            'records': [],
            'message': 'No promotion records found for this class',
        })

    promote_count = 0
    detain_count = 0
    compartment_count = 0
    pending_count = 0
    confirmed_count = 0
    override_count = 0

    record_details = []
    for r in records:
        decision = r.final_decision if r.final_decision else r.recommendation
        if decision == 'promote':
            promote_count += 1
        elif decision == 'detain':
            detain_count += 1
        elif decision == 'compartment':
            compartment_count += 1

        if r.status == 'pending':
            pending_count += 1
        elif r.status == 'confirmed':
            confirmed_count += 1

        if r.final_decision and r.final_decision != r.recommendation:
            override_count += 1

        student = Student.query.get(r.student_id)
        record_details.append({
            'id': r.id,
            'student_id': r.student_id,
            'student_name': f"{student.first_name} {student.last_name}" if student else None,
            'recommendation': r.recommendation,
            'final_decision': r.final_decision,
            'override_reason': r.override_reason,
            'attendance_pct': float(r.attendance_pct) if r.attendance_pct else 0,
            'overall_pct': float(r.overall_pct) if r.overall_pct else 0,
            'failed_subjects': r.failed_subjects,
            'status': r.status,
        })

    return success_response({
        'total_students': len(records),
        'promoted': promote_count,
        'detained': detain_count,
        'compartment': compartment_count,
        'pending': pending_count,
        'confirmed': confirmed_count,
        'overrides': override_count,
        'records': record_details,
    })


# ============================================================
# ACADEMIC POLICIES
# ============================================================

@academic_controller_bp.route('/policies', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def list_policies():
    """List all policies for school."""
    academic_year_id = request.args.get('academic_year_id', type=int)

    query = AcademicPolicy.query.filter_by(school_id=g.school_id)
    if academic_year_id:
        query = query.filter_by(academic_year_id=academic_year_id)

    policies = query.order_by(AcademicPolicy.policy_type).all()
    results = []
    for p in policies:
        results.append({
            'id': p.id,
            'policy_type': p.policy_type,
            'policy_value': json.loads(p.policy_value) if p.policy_value else None,
            'description': p.description,
            'academic_year_id': p.academic_year_id,
            'created_at': p.created_at.isoformat() if p.created_at else None,
            'updated_at': p.updated_at.isoformat() if p.updated_at else None,
        })

    return success_response(results)


@academic_controller_bp.route('/policies', methods=['POST'])
@school_required
@role_required('school_admin', 'academic_controller')
def create_policy():
    """Create a new academic policy."""
    data = request.get_json()
    if not data:
        return error_response('Request body is required', 400)

    policy_type = data.get('policy_type')
    policy_value = data.get('policy_value')
    description = data.get('description', '')
    academic_year_id = data.get('academic_year_id')

    if not policy_type or policy_value is None:
        return error_response('policy_type and policy_value are required', 400)

    valid_types = [
        'working_days', 'attendance_threshold', 'grading_default',
        'max_periods_per_day', 'lesson_plan_required'
    ]
    if policy_type not in valid_types:
        return error_response(f'Invalid policy_type. Must be one of: {", ".join(valid_types)}', 400)

    # Check unique constraint
    existing = AcademicPolicy.query.filter_by(
        school_id=g.school_id,
        academic_year_id=academic_year_id,
        policy_type=policy_type,
    ).first()
    if existing:
        return error_response(
            f'Policy "{policy_type}" already exists for this academic year. Use PUT to update.', 409
        )

    # Serialize policy_value to JSON string
    if isinstance(policy_value, (dict, list)):
        policy_value_str = json.dumps(policy_value)
    else:
        policy_value_str = json.dumps(policy_value)

    policy = AcademicPolicy(
        school_id=g.school_id,
        academic_year_id=academic_year_id,
        policy_type=policy_type,
        policy_value=policy_value_str,
        description=description,
        created_by=g.user_id,
    )
    db.session.add(policy)
    db.session.commit()

    return success_response({
        'id': policy.id,
        'policy_type': policy.policy_type,
        'policy_value': json.loads(policy.policy_value),
        'description': policy.description,
    }, 'Policy created', 201)


@academic_controller_bp.route('/policies/<int:policy_id>', methods=['PUT'])
@school_required
@role_required('school_admin', 'academic_controller')
def update_policy(policy_id):
    """Update a specific policy."""
    policy = AcademicPolicy.query.filter_by(
        id=policy_id, school_id=g.school_id
    ).first()
    if not policy:
        return error_response('Policy not found', 404)

    data = request.get_json()
    if not data:
        return error_response('Request body is required', 400)

    if 'policy_value' in data:
        value = data['policy_value']
        if isinstance(value, (dict, list)):
            policy.policy_value = json.dumps(value)
        else:
            policy.policy_value = json.dumps(value)
    if 'description' in data:
        policy.description = data['description']

    db.session.commit()
    return success_response({
        'id': policy.id,
        'policy_type': policy.policy_type,
        'policy_value': json.loads(policy.policy_value),
        'description': policy.description,
    }, 'Policy updated')


@academic_controller_bp.route('/policies/working-days', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def get_working_days():
    """Get working days configuration."""
    policy = AcademicPolicy.query.filter_by(
        school_id=g.school_id,
        policy_type='working_days',
    ).first()

    if not policy:
        # Default: Monday to Saturday
        return success_response({
            'working_days': ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
            'is_default': True,
        })

    return success_response({
        'working_days': json.loads(policy.policy_value),
        'is_default': False,
        'policy_id': policy.id,
    })


@academic_controller_bp.route('/policies/working-days', methods=['PUT'])
@school_required
@role_required('school_admin', 'academic_controller')
def set_working_days():
    """Set working days (1-6 selected days from Monday-Saturday)."""
    data = request.get_json()
    if not data:
        return error_response('Request body is required', 400)

    working_days = data.get('working_days', [])
    valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

    if not isinstance(working_days, list) or not working_days:
        return error_response('working_days must be a non-empty list', 400)

    # Validate days
    for day in working_days:
        if day.lower() not in valid_days:
            return error_response(f'Invalid day: {day}. Must be one of: {", ".join(valid_days)}', 400)

    if len(working_days) < 1 or len(working_days) > 6:
        return error_response('Must select between 1 and 6 working days', 400)

    # Normalize to lowercase
    working_days = [d.lower() for d in working_days]

    # Upsert working days policy
    policy = AcademicPolicy.query.filter_by(
        school_id=g.school_id,
        policy_type='working_days',
    ).first()

    if policy:
        policy.policy_value = json.dumps(working_days)
    else:
        policy = AcademicPolicy(
            school_id=g.school_id,
            policy_type='working_days',
            policy_value=json.dumps(working_days),
            description='School working days configuration',
            created_by=g.user_id,
        )
        db.session.add(policy)

    db.session.commit()
    return success_response({'working_days': working_days}, 'Working days updated')


# ============================================================
# REPORTS & ANALYTICS
# ============================================================

@academic_controller_bp.route('/reports/class-performance', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def report_class_performance():
    """Class performance report."""
    class_id = request.args.get('class_id', type=int)
    section_id = request.args.get('section_id', type=int)
    exam_id = request.args.get('exam_id', type=int)

    if not class_id or not exam_id:
        return error_response('class_id and exam_id are required', 400)

    result = get_class_performance(g.school_id, class_id, section_id, exam_id)
    return success_response(result)


@academic_controller_bp.route('/reports/teacher-performance', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def report_teacher_performance():
    """Teacher performance report."""
    teacher_id = request.args.get('teacher_id', type=int)

    if not teacher_id:
        return error_response('teacher_id is required', 400)

    # Validate teacher exists in school
    teacher = Staff.query.filter_by(id=teacher_id, school_id=g.school_id).first()
    if not teacher:
        return error_response('Teacher not found', 404)

    result = get_teacher_performance(g.school_id, teacher_id)
    return success_response(result)


@academic_controller_bp.route('/reports/cross-section', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def report_cross_section():
    """Cross-section comparison."""
    class_id = request.args.get('class_id', type=int)
    exam_id = request.args.get('exam_id', type=int)

    if not class_id or not exam_id:
        return error_response('class_id and exam_id are required', 400)

    result = get_cross_section_comparison(g.school_id, class_id, exam_id)
    return success_response(result)


@academic_controller_bp.route('/reports/trends', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def report_trends():
    """Trend analysis (term-over-term)."""
    class_id = request.args.get('class_id', type=int)
    subject_id = request.args.get('subject_id', type=int)

    if not class_id:
        return error_response('class_id is required', 400)

    result = get_trend_analysis(g.school_id, class_id, subject_id)
    return success_response(result)


@academic_controller_bp.route('/reports/export-pdf', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def export_report_pdf():
    """PDF export of a report."""
    report_type = request.args.get('report_type', 'class-performance')
    class_id = request.args.get('class_id', type=int)
    section_id = request.args.get('section_id', type=int)
    exam_id = request.args.get('exam_id', type=int)
    teacher_id = request.args.get('teacher_id', type=int)
    subject_id = request.args.get('subject_id', type=int)

    # Get report data based on type
    report_data = {}
    title = 'Academic Report'

    if report_type == 'class-performance' and class_id and exam_id:
        report_data = get_class_performance(g.school_id, class_id, section_id, exam_id)
        title = f'Class Performance Report'
    elif report_type == 'teacher-performance' and teacher_id:
        report_data = get_teacher_performance(g.school_id, teacher_id)
        title = f'Teacher Performance Report'
    elif report_type == 'cross-section' and class_id and exam_id:
        report_data = get_cross_section_comparison(g.school_id, class_id, exam_id)
        title = f'Cross-Section Comparison Report'
    elif report_type == 'trends' and class_id:
        report_data = get_trend_analysis(g.school_id, class_id, subject_id)
        title = f'Trend Analysis Report'
    else:
        return error_response('Invalid report_type or missing required parameters', 400)

    # Generate PDF using reportlab
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
    except ImportError:
        return error_response('PDF generation library (reportlab) not installed', 500)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    elements.append(Paragraph(title, styles['Title']))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", styles['Normal']))
    elements.append(Spacer(1, 20))

    # Build table data based on report type
    if report_type == 'class-performance' and report_data.get('subjects'):
        table_data = [['Subject', 'Avg Marks', 'Highest', 'Lowest', 'Pass %', 'Students']]
        for subj in report_data['subjects']:
            table_data.append([
                subj.get('subject_name', ''),
                str(subj.get('avg_marks', 0)),
                str(subj.get('highest_marks', 0)),
                str(subj.get('lowest_marks', 0)),
                f"{subj.get('pass_percentage', 0)}%",
                str(subj.get('total_students', 0)),
            ])
        if table_data and len(table_data) > 1:
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(table)

    elif report_type == 'teacher-performance':
        info_data = [
            ['Metric', 'Value'],
            ['Syllabus Completion Rate', f"{report_data.get('syllabus_completion_rate', 0)}%"],
            ['Lesson Plan Submission Rate', f"{report_data.get('lesson_plan_submission_rate', 0)}%"],
            ['Avg Student Percentage', f"{report_data.get('avg_student_percentage', 0)}%"],
            ['Total Lesson Plans', str(report_data.get('total_lesson_plans', 0))],
            ['Total Syllabus Entries', str(report_data.get('total_syllabus_entries', 0))],
        ]
        table = Table(info_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(table)

    elif report_type == 'cross-section' and report_data.get('sections'):
        table_data = [['Section', 'Overall Avg %']]
        for section in report_data['sections']:
            table_data.append([
                section.get('section_name', ''),
                f"{section.get('overall_avg_percentage', 0)}%",
            ])
        if len(table_data) > 1:
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(table)

    elif report_type == 'trends' and report_data.get('terms'):
        table_data = [['Term', 'Avg %', 'Pass %', 'Students']]
        for term in report_data['terms']:
            table_data.append([
                term.get('term_name', ''),
                f"{term.get('avg_percentage', 0)}%",
                f"{term.get('pass_percentage', 0)}%",
                str(term.get('total_students', 0)),
            ])
        if len(table_data) > 1:
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(table)

    if not elements or len(elements) <= 3:
        elements.append(Paragraph('No data available for this report.', styles['Normal']))

    doc.build(elements)
    buffer.seek(0)

    filename = f"{report_type}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=filename,
    )


# ============================================================
# DASHBOARD
# ============================================================

@academic_controller_bp.route('/dashboard', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def dashboard_summary():
    """Dashboard summary: pending approvals, at-risk syllabus, upcoming events, pending substitutions."""
    academic_year_id = request.args.get('academic_year_id', type=int)
    term_id = request.args.get('term_id', type=int)

    if not academic_year_id:
        current_year = AcademicYear.query.filter_by(
            school_id=g.school_id, is_current=True
        ).first()
        academic_year_id = current_year.id if current_year else None

    summary = get_dashboard_summary(g.school_id, academic_year_id, term_id)
    return success_response(summary)


@academic_controller_bp.route('/dashboard/notifications', methods=['GET'])
@school_required
@role_required('school_admin', 'academic_controller')
def dashboard_notifications():
    """Recent notifications (last 7 days, max 20)."""
    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    notifications = []

    # Recent lesson plan submissions
    recent_plans = LessonPlan.query.filter(
        LessonPlan.school_id == g.school_id,
        LessonPlan.status == 'submitted',
        LessonPlan.created_at >= seven_days_ago,
    ).order_by(LessonPlan.created_at.desc()).limit(10).all()

    for plan in recent_plans:
        teacher = Staff.query.get(plan.teacher_id) if plan.teacher_id else None
        notifications.append({
            'type': 'lesson_plan_submitted',
            'message': f"Lesson plan submitted by {teacher.first_name} {teacher.last_name}" if teacher else "Lesson plan submitted",
            'timestamp': plan.created_at.isoformat() if plan.created_at else None,
            'reference_id': plan.id,
        })

    # Recent substitution assignments
    recent_subs = TimetableSubstitution.query.filter(
        TimetableSubstitution.school_id == g.school_id,
        TimetableSubstitution.created_at >= seven_days_ago,
    ).order_by(TimetableSubstitution.created_at.desc()).limit(5).all()

    for sub in recent_subs:
        teacher = Staff.query.get(sub.substitute_teacher_id) if sub.substitute_teacher_id else None
        notifications.append({
            'type': 'substitution_assigned',
            'message': f"Substitution assigned to {teacher.first_name} {teacher.last_name}" if teacher else "Substitution assigned",
            'timestamp': sub.created_at.isoformat() if sub.created_at else None,
            'reference_id': sub.id,
        })

    # Upcoming calendar events
    today = date.today()
    next_week = today + timedelta(days=7)
    upcoming_events = AcademicCalendar.query.filter(
        AcademicCalendar.school_id == g.school_id,
        AcademicCalendar.start_date >= today,
        AcademicCalendar.start_date <= next_week,
    ).order_by(AcademicCalendar.start_date).limit(5).all()

    for event in upcoming_events:
        notifications.append({
            'type': 'upcoming_event',
            'message': f"Upcoming: {event.title}" if hasattr(event, 'title') else "Upcoming event",
            'timestamp': event.start_date.isoformat() if event.start_date else None,
            'reference_id': event.id,
        })

    # Sort by timestamp descending and limit to 20
    notifications.sort(key=lambda x: x.get('timestamp') or '', reverse=True)
    notifications = notifications[:20]

    return success_response(notifications)
