from flask import Blueprint, request, g, send_file
from app import db
from app.models.academic import (
    Subject, SubjectComponent, ClassSubject, Timetable,
    ExamType, GradingSystem, Grade,
    Exam, ExamSchedule, ExamGroup, ExamGroupMapping,
    ExamResult, MarkEntry,
    ExamHall, ExamSeating, ExamInvigilator, ExamAdmitCard,
    ReportCard, ExamIncident,
    Syllabus, SyllabusProgress, LessonPlan,
    Homework, HomeworkSubmission, StudyMaterial,
    AcademicCalendar, TeacherSubject,
    ElectiveGroup, ElectiveSubject, StudentElective, StudentSubjectEnrollment
)
from app.models.student import Student, Class, Section, AcademicYear
from app.models.school import School
from app.models.staff import Staff
from app.utils.decorators import school_required, role_required, feature_required
from app.utils.helpers import success_response, error_response, paginate, get_teacher_scope, clean_val, validate
from sqlalchemy import func, case, and_, or_
from datetime import datetime, date

academics_bp = Blueprint('academics', __name__)


# ============================================================
# SUBJECTS - CRUD + Components
# ============================================================

@academics_bp.route('/subjects', methods=['GET'])
@school_required
def list_subjects():
    query = Subject.query.filter_by(school_id=g.school_id)
    active_only = request.args.get('active_only', 'false')
    if active_only == 'true':
        query = query.filter_by(is_active=True)
    subjects = query.order_by(Subject.name).all()
    return success_response([s.to_dict() for s in subjects])


@academics_bp.route('/subjects', methods=['POST'])
@role_required('school_admin', 'academic_controller')
@validate({
    'name': {'required': True, 'message': 'Subject name is required'},
})
def create_subject():
    data = g.get('validated_data') or request.get_json()
    subject = Subject(
        school_id=g.school_id,
        name=data['name'],
        code=data.get('code'),
        type=data.get('type', 'theory'),
        description=data.get('description'),
        credit_hours=data.get('credit_hours'),
        is_elective=data.get('is_elective', False),
    )
    db.session.add(subject)
    db.session.commit()
    return success_response(subject.to_dict(), 'Subject created', 201)


@academics_bp.route('/subjects/<int:subject_id>', methods=['PUT'])
@role_required('school_admin', 'academic_controller')
@validate({})
def update_subject(subject_id):
    subject = Subject.query.filter_by(id=subject_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    for field in ['name', 'code', 'type', 'description', 'credit_hours', 'is_elective', 'is_active']:
        if field in data:
            setattr(subject, field, data[field])
    db.session.commit()
    return success_response(subject.to_dict(), 'Subject updated')


@academics_bp.route('/subjects/<int:subject_id>', methods=['DELETE'])
@role_required('school_admin', 'academic_controller')
def delete_subject(subject_id):
    subject = Subject.query.filter_by(id=subject_id, school_id=g.school_id).first_or_404()
    db.session.delete(subject)
    db.session.commit()
    return success_response(message='Subject deleted')


@academics_bp.route('/subjects/<int:subject_id>/components', methods=['GET'])
@school_required
def list_subject_components(subject_id):
    components = SubjectComponent.query.filter_by(school_id=g.school_id, subject_id=subject_id).all()
    return success_response([c.to_dict() for c in components])


@academics_bp.route('/subjects/<int:subject_id>/components', methods=['POST'])
@role_required('school_admin', 'academic_controller')
@validate({
    'name': {'required': True, 'message': 'Component name is required'},
    'max_marks': {'type': int, 'message': 'Max marks is required'},
})
def add_subject_component(subject_id):
    data = g.get('validated_data') or request.get_json()
    comp = SubjectComponent(
        school_id=g.school_id,
        subject_id=subject_id,
        name=data['name'],
        max_marks=data['max_marks'],
        weightage=data.get('weightage', 100),
        is_mandatory=data.get('is_mandatory', True),
    )
    db.session.add(comp)
    db.session.commit()
    return success_response(comp.to_dict(), 'Component added', 201)


@academics_bp.route('/subjects/components/<int:comp_id>', methods=['DELETE'])
@role_required('school_admin', 'academic_controller')
def delete_subject_component(comp_id):
    comp = SubjectComponent.query.filter_by(id=comp_id, school_id=g.school_id).first_or_404()
    db.session.delete(comp)
    db.session.commit()
    return success_response(message='Component deleted')


# ============================================================
# CLASS-SUBJECT MAPPING
# ============================================================

@academics_bp.route('/class-subjects/<int:class_id>', methods=['GET'])
@school_required
def get_class_subjects(class_id):
    items = ClassSubject.query.filter_by(school_id=g.school_id, class_id=class_id).all()
    return success_response([cs.to_dict() for cs in items])


@academics_bp.route('/class-subjects', methods=['POST'])
@role_required('school_admin', 'academic_controller')
@validate({
    'class_id': {'type': int, 'message': 'Class ID is required'},
    'subject_id': {'type': int, 'message': 'Subject ID is required'},
})
def assign_subject():
    data = g.get('validated_data') or request.get_json()
    existing = ClassSubject.query.filter_by(
        school_id=g.school_id, class_id=data['class_id'], subject_id=data['subject_id']
    ).first()
    if existing:
        return error_response('Subject already assigned to this class', 400)
    cs = ClassSubject(
        school_id=g.school_id,
        class_id=data['class_id'],
        subject_id=data['subject_id'],
        teacher_id=data.get('teacher_id'),
    )
    db.session.add(cs)
    db.session.commit()
    return success_response(cs.to_dict(), 'Subject assigned', 201)


@academics_bp.route('/class-subjects/<int:cs_id>', methods=['PUT'])
@role_required('school_admin', 'academic_controller')
@validate({})
def update_class_subject(cs_id):
    cs = ClassSubject.query.filter_by(id=cs_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    if 'teacher_id' in data:
        cs.teacher_id = data['teacher_id']
    db.session.commit()
    return success_response(cs.to_dict(), 'Updated')


@academics_bp.route('/class-subjects/<int:cs_id>', methods=['DELETE'])
@role_required('school_admin', 'academic_controller')
def remove_class_subject(cs_id):
    cs = ClassSubject.query.filter_by(id=cs_id, school_id=g.school_id).first_or_404()
    db.session.delete(cs)
    db.session.commit()
    return success_response(message='Removed')


# ============================================================
# TIMETABLE
# ============================================================

@academics_bp.route('/timetable', methods=['GET'])
@school_required
def get_timetable():
    class_id = request.args.get('class_id', type=int)
    section_id = request.args.get('section_id', type=int)
    teacher_id = request.args.get('teacher_id', type=int)
    my = request.args.get('my', 'false').lower() == 'true'

    query = Timetable.query.filter_by(school_id=g.school_id)

    # Auto-detect teacher from logged-in user
    if my:
        from app.models.user import User
        user = User.query.get(g.user_id)
        if user and user.role and user.role.name == 'teacher':
            staff = Staff.query.filter_by(school_id=g.school_id, user_id=g.user_id).first()
            if staff:
                teacher_id = staff.id

    scope = get_teacher_scope()
    if scope and scope.get('no_access'):
        return success_response([])
    if scope and not teacher_id and not class_id and not section_id:
        return success_response([])

    if class_id:
        query = query.filter_by(class_id=class_id)
    if section_id:
        query = query.filter_by(section_id=section_id)
    if teacher_id:
        query = query.filter_by(teacher_id=teacher_id)

    items = query.order_by(Timetable.day_of_week, Timetable.start_time).all()
    return success_response([t.to_dict() for t in items])


@academics_bp.route('/timetable', methods=['POST'])
@role_required('school_admin', 'academic_controller')
@validate({
    'class_id': {'type': int, 'message': 'Class ID is required'},
    'section_id': {'type': int, 'message': 'Section ID is required'},
    'subject_id': {'type': int, 'message': 'Subject ID is required'},
    'day_of_week': {'required': True, 'message': 'Day of week is required'},
    'start_time': {'required': True, 'message': 'Start time is required'},
    'end_time': {'required': True, 'message': 'End time is required'},
})
def create_timetable_entry():
    data = g.get('validated_data') or request.get_json()
    entry = Timetable(
        school_id=g.school_id,
        class_id=data['class_id'],
        section_id=data['section_id'],
        subject_id=data['subject_id'],
        teacher_id=data.get('teacher_id'),
        day_of_week=data['day_of_week'],
        start_time=data['start_time'],
        end_time=data['end_time'],
        room_no=data.get('room_no'),
        period_number=data.get('period_number'),
        academic_year_id=data.get('academic_year_id'),
    )
    db.session.add(entry)
    db.session.commit()
    return success_response(entry.to_dict(), 'Timetable entry created', 201)


@academics_bp.route('/timetable/<int:tt_id>', methods=['PUT'])
@role_required('school_admin', 'academic_controller')
@validate({})
def update_timetable_entry(tt_id):
    entry = Timetable.query.filter_by(id=tt_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    for field in ['class_id', 'section_id', 'subject_id', 'teacher_id', 'day_of_week',
                   'start_time', 'end_time', 'room_no', 'period_number']:
        if field in data:
            setattr(entry, field, data[field])
    db.session.commit()
    return success_response(entry.to_dict(), 'Updated')


@academics_bp.route('/timetable/<int:tt_id>', methods=['DELETE'])
@role_required('school_admin', 'academic_controller')
def delete_timetable_entry(tt_id):
    entry = Timetable.query.filter_by(id=tt_id, school_id=g.school_id).first_or_404()
    db.session.delete(entry)
    db.session.commit()
    return success_response(message='Deleted')


@academics_bp.route('/timetable/bulk', methods=['POST'])
@role_required('school_admin', 'academic_controller')
@validate({})
def bulk_create_timetable():
    data = g.get('validated_data') or request.get_json()
    entries = data.get('entries', [])
    created = []
    for e in entries:
        entry = Timetable(
            school_id=g.school_id,
            class_id=e['class_id'],
            section_id=e['section_id'],
            subject_id=e['subject_id'],
            teacher_id=e.get('teacher_id'),
            day_of_week=e['day_of_week'],
            start_time=e['start_time'],
            end_time=e['end_time'],
            room_no=e.get('room_no'),
            period_number=e.get('period_number'),
            academic_year_id=e.get('academic_year_id'),
        )
        db.session.add(entry)
        created.append(entry)
    db.session.commit()
    return success_response([e.to_dict() for e in created], f'{len(created)} entries created', 201)


@academics_bp.route('/timetable/auto-generate', methods=['POST'])
@role_required('school_admin', 'academic_controller')
@validate({
    'class_id': {'type': int, 'message': 'Class ID is required'},
    'section_id': {'type': int},
})
def auto_generate_timetable():
    """
    Auto-generate timetable for a class/section based on teacher-subject assignments.
    Rules:
    1. A teacher cannot be in two classes at the same time (conflict check)
    2. Theory subjects get 5-7 periods/week, practical get 2-3, both get 6-8
    3. Uses TeacherSubject allocations as the source
    4. Distributes subjects evenly across days
    5. No same subject twice in a day (unless periods > days)
    """
    import random
    from datetime import time as dt_time

    data = g.get('validated_data') or request.get_json()
    class_id = data.get('class_id')
    section_id = data.get('section_id')
    periods_per_day = data.get('periods_per_day', 8)
    days = data.get('days', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'])
    start_hour = data.get('start_hour', 8)  # 8 AM
    period_duration = data.get('period_duration', 45)  # minutes
    break_after_period = data.get('break_after_period', 4)  # lunch break after 4th period
    break_duration = data.get('break_duration', 30)  # minutes

    if not class_id or not section_id:
        return error_response('class_id and section_id are required')

    # Get all teacher-subject allocations for this class/section
    allocations = TeacherSubject.query.filter_by(
        school_id=g.school_id,
        class_id=class_id,
        section_id=section_id,
        status='active'
    ).all()

    # Also check allocations without section (applies to all sections of the class)
    allocations_no_section = TeacherSubject.query.filter_by(
        school_id=g.school_id,
        class_id=class_id,
        section_id=None,
        status='active'
    ).all()

    all_allocations = allocations + allocations_no_section

    if not all_allocations:
        return error_response('No teacher-subject allocations found for this class/section. Please assign teachers to subjects first.')

    # Determine periods per week for each subject based on type
    subject_periods = []
    for alloc in all_allocations:
        subject = Subject.query.get(alloc.subject_id)
        if not subject or not subject.is_active:
            continue

        # Use allocation's periods_per_week if set, otherwise use defaults based on type
        if alloc.periods_per_week and alloc.periods_per_week > 0:
            ppw = alloc.periods_per_week
        else:
            if subject.type == 'theory':
                ppw = 6  # 5-7, default 6
            elif subject.type == 'practical':
                ppw = 3  # 2-3, default 3
            else:  # both
                ppw = 7  # 6-8, default 7

        subject_periods.append({
            'allocation_id': alloc.id,
            'subject_id': alloc.subject_id,
            'subject_name': subject.name,
            'subject_type': subject.type,
            'teacher_id': alloc.teacher_id,
            'periods_per_week': ppw,
        })

    total_needed = sum(sp['periods_per_week'] for sp in subject_periods)
    total_available = periods_per_day * len(days)

    # If total needed exceeds available, scale down proportionally
    if total_needed > total_available:
        scale = total_available / total_needed
        for sp in subject_periods:
            sp['periods_per_week'] = max(1, round(sp['periods_per_week'] * scale))
        total_needed = sum(sp['periods_per_week'] for sp in subject_periods)

    # Get existing timetable entries for ALL classes to check teacher conflicts
    existing_entries = Timetable.query.filter_by(school_id=g.school_id).filter(
        Timetable.teacher_id.isnot(None)
    ).all()

    # Build teacher schedule map: teacher_id -> {day -> set of period_numbers}
    teacher_schedule = {}
    for entry in existing_entries:
        # Skip entries for the same class/section (we're regenerating those)
        if entry.class_id == class_id and entry.section_id == section_id:
            continue
        tid = entry.teacher_id
        if tid not in teacher_schedule:
            teacher_schedule[tid] = {d: set() for d in days}
        day = entry.day_of_week
        if day in teacher_schedule[tid] and entry.period_number:
            teacher_schedule[tid][day].add(entry.period_number)

    # Delete existing timetable for this class/section (regenerate)
    Timetable.query.filter_by(
        school_id=g.school_id,
        class_id=class_id,
        section_id=section_id
    ).delete()
    db.session.flush()

    # Build the slot pool: list of (day, period) tuples
    slots = []
    for day in days:
        for period in range(1, periods_per_day + 1):
            slots.append((day, period))

    # Create period-to-time mapping
    def get_period_times(period_num):
        minutes_offset = (period_num - 1) * period_duration
        # Add break time if after break period
        if period_num > break_after_period:
            minutes_offset += break_duration
        start_minutes = start_hour * 60 + minutes_offset
        end_minutes = start_minutes + period_duration
        s_time = dt_time(start_minutes // 60, start_minutes % 60)
        e_time = dt_time(end_minutes // 60, end_minutes % 60)
        return s_time, e_time

    # Distribute subjects across slots
    # Strategy: spread each subject evenly across days, avoid same subject twice per day
    # Also check teacher conflicts

    # Create a grid: day -> period -> None (empty)
    grid = {day: {p: None for p in range(1, periods_per_day + 1)} for day in days}

    # ── Class-teacher-first-period rule ──
    # Reserve period 1 of every day for the section's class teacher (their subject),
    # so each day starts with the class teacher's period.
    section_obj = Section.query.filter_by(id=section_id, school_id=g.school_id).first()
    ct_teacher_id = section_obj.class_teacher_id if section_obj else None
    ct_subject = None
    ct_note = None
    if not ct_teacher_id:
        ct_note = 'No class teacher assigned to this section — first period not reserved.'
    else:
        # Find a subject this class teacher teaches in this class-section
        ct_subject = next((sp for sp in subject_periods if sp['teacher_id'] == ct_teacher_id), None)
        if not ct_subject:
            ct_note = 'Class teacher has no subject assigned for this class — first period not reserved. Assign the class teacher a subject in Teacher Assignment.'

    ct_days_filled = 0
    if ct_subject:
        for day in days:
            # Only reserve if the class teacher is free at period 1 that day
            tid = ct_subject['teacher_id']
            busy = teacher_schedule.get(tid, {}).get(day, set()) if tid else set()
            if 1 in busy:
                continue
            grid[day][1] = ct_subject
            if tid:
                teacher_schedule.setdefault(tid, {d: set() for d in days})
                teacher_schedule[tid][day].add(1)
            ct_days_filled += 1
        # Reduce the class teacher subject's remaining periods by how many we pre-placed
        ct_subject['periods_per_week'] = max(0, ct_subject['periods_per_week'] - ct_days_filled)
        ct_note = f"Class teacher's subject placed in Period 1 on {ct_days_filled} day(s)."

    # Sort subjects by periods_per_week descending (place hardest first)
    subject_periods.sort(key=lambda x: x['periods_per_week'], reverse=True)

    # For each subject, distribute periods across days
    unplaced = []
    for sp in subject_periods:
        periods_to_place = sp['periods_per_week']
        teacher_id = sp['teacher_id']
        subject_id = sp['subject_id']

        # Try to spread evenly: calculate ideal periods per day
        placed = 0
        # Shuffle days to add randomness
        day_order = list(days)
        random.shuffle(day_order)

        # First pass: one period per day
        for day in day_order:
            if placed >= periods_to_place:
                break
            # Find an empty slot on this day where teacher is free
            for period in range(1, periods_per_day + 1):
                if grid[day][period] is not None:
                    continue
                # Check teacher conflict
                if teacher_id and teacher_id in teacher_schedule:
                    if period in teacher_schedule[teacher_id].get(day, set()):
                        continue
                # Place it
                grid[day][period] = sp
                # Mark teacher as busy
                if teacher_id:
                    if teacher_id not in teacher_schedule:
                        teacher_schedule[teacher_id] = {d: set() for d in days}
                    teacher_schedule[teacher_id][day].add(period)
                placed += 1
                break

        # Second pass: if still need more periods, allow 2 per day
        if placed < periods_to_place:
            for day in day_order:
                if placed >= periods_to_place:
                    break
                for period in range(1, periods_per_day + 1):
                    if placed >= periods_to_place:
                        break
                    if grid[day][period] is not None:
                        continue
                    if teacher_id and teacher_id in teacher_schedule:
                        if period in teacher_schedule[teacher_id].get(day, set()):
                            continue
                    grid[day][period] = sp
                    if teacher_id:
                        if teacher_id not in teacher_schedule:
                            teacher_schedule[teacher_id] = {d: set() for d in days}
                        teacher_schedule[teacher_id][day].add(period)
                    placed += 1

        if placed < periods_to_place:
            unplaced.append({'subject': sp['subject_name'], 'needed': periods_to_place, 'placed': placed})

    # Create timetable entries from grid
    created_entries = []
    for day in days:
        for period in range(1, periods_per_day + 1):
            sp = grid[day][period]
            if sp is None:
                continue
            s_time, e_time = get_period_times(period)
            entry = Timetable(
                school_id=g.school_id,
                class_id=class_id,
                section_id=section_id,
                subject_id=sp['subject_id'],
                teacher_id=sp['teacher_id'],
                day_of_week=day,
                start_time=s_time,
                end_time=e_time,
                period_number=period,
            )
            db.session.add(entry)
            created_entries.append(entry)

    db.session.commit()

    result = {
        'entries_created': len(created_entries),
        'total_slots': total_available,
        'slots_filled': len(created_entries),
        'slots_empty': total_available - len(created_entries),
        'class_teacher_note': ct_note,
        'warnings': unplaced if unplaced else None,
        'subject_distribution': [
            {'subject': sp['subject_name'], 'teacher_id': sp['teacher_id'], 'periods': sp['periods_per_week']}
            for sp in subject_periods
        ]
    }

    return success_response(result, f'Timetable generated: {len(created_entries)} periods created')


@academics_bp.route('/timetable/check-conflicts', methods=['POST'])
@role_required('school_admin', 'academic_controller')
@validate({
    'teacher_id': {'type': int, 'message': 'Teacher ID is required'},
    'day_of_week': {'required': True, 'message': 'Day of week is required'},
    'period_number': {'type': int, 'message': 'Period number is required'},
})
def check_timetable_conflicts():
    """Check if a teacher has conflicts at a given day/period"""
    data = g.get('validated_data') or request.get_json()
    teacher_id = data.get('teacher_id')
    day_of_week = data.get('day_of_week')
    period_number = data.get('period_number')
    exclude_id = data.get('exclude_id')  # exclude current entry when editing

    if not teacher_id or not day_of_week or not period_number:
        return error_response('teacher_id, day_of_week, and period_number are required')

    query = Timetable.query.filter_by(
        school_id=g.school_id,
        teacher_id=teacher_id,
        day_of_week=day_of_week,
        period_number=period_number
    )
    if exclude_id:
        query = query.filter(Timetable.id != exclude_id)

    conflict = query.first()
    if conflict:
        return success_response({
            'has_conflict': True,
            'conflict_with': {
                'class_name': conflict.class_ref.name if conflict.class_ref else None,
                'section_name': conflict.section_ref.name if conflict.section_ref else None,
                'subject_name': conflict.subject.name if conflict.subject else None,
            }
        })
    return success_response({'has_conflict': False})


# ============================================================
# EXAM TYPES
# ============================================================

@academics_bp.route('/exam-types', methods=['GET'])
@school_required
def list_exam_types():
    types = ExamType.query.filter_by(school_id=g.school_id).order_by(ExamType.display_order).all()
    return success_response([t.to_dict() for t in types])


@academics_bp.route('/exam-types', methods=['POST'])
@role_required('school_admin', 'academic_controller', 'exam_controller')
@validate({
    'name': {'required': True, 'message': 'Exam type name is required'},
})
def create_exam_type():
    data = g.get('validated_data') or request.get_json()
    et = ExamType(
        school_id=g.school_id,
        name=data['name'],
        code=data.get('code'),
        description=data.get('description'),
        weightage=data.get('weightage', 100),
        display_order=data.get('display_order', 0),
    )
    db.session.add(et)
    db.session.commit()
    return success_response(et.to_dict(), 'Exam type created', 201)


@academics_bp.route('/exam-types/<int:et_id>', methods=['PUT'])
@role_required('school_admin', 'academic_controller', 'exam_controller')
@validate({})
def update_exam_type(et_id):
    et = ExamType.query.filter_by(id=et_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    for field in ['name', 'code', 'description', 'weightage', 'is_active', 'display_order']:
        if field in data:
            setattr(et, field, data[field])
    db.session.commit()
    return success_response(et.to_dict(), 'Updated')


@academics_bp.route('/exam-types/<int:et_id>', methods=['DELETE'])
@role_required('school_admin', 'academic_controller', 'exam_controller')
def delete_exam_type(et_id):
    et = ExamType.query.filter_by(id=et_id, school_id=g.school_id).first_or_404()
    db.session.delete(et)
    db.session.commit()
    return success_response(message='Deleted')


# ============================================================
# GRADING SYSTEMS & GRADES
# ============================================================

@academics_bp.route('/grading-systems', methods=['GET'])
@school_required
def list_grading_systems():
    systems = GradingSystem.query.filter_by(school_id=g.school_id).all()
    return success_response([gs.to_dict() for gs in systems])


@academics_bp.route('/grading-systems', methods=['POST'])
@role_required('school_admin', 'academic_controller')
@validate({
    'name': {'required': True, 'message': 'Grading system name is required'},
})
def create_grading_system():
    data = g.get('validated_data') or request.get_json()
    gs = GradingSystem(
        school_id=g.school_id,
        name=data['name'],
        type=data.get('type', 'percentage'),
        description=data.get('description'),
        is_default=data.get('is_default', False),
    )
    if gs.is_default:
        GradingSystem.query.filter_by(school_id=g.school_id, is_default=True).update({'is_default': False})
    db.session.add(gs)
    db.session.commit()

    # Create grades if provided
    for grade_data in data.get('grades', []):
        grade = Grade(
            grading_system_id=gs.id,
            school_id=g.school_id,
            name=grade_data['name'],
            min_marks=grade_data['min_marks'],
            max_marks=grade_data['max_marks'],
            grade_point=grade_data.get('grade_point'),
            description=grade_data.get('description'),
            is_passing=grade_data.get('is_passing', True),
            display_order=grade_data.get('display_order', 0),
        )
        db.session.add(grade)
    db.session.commit()
    return success_response(gs.to_dict(), 'Grading system created', 201)


@academics_bp.route('/grading-systems/<int:gs_id>', methods=['PUT'])
@role_required('school_admin', 'academic_controller')
@validate({})
def update_grading_system(gs_id):
    gs = GradingSystem.query.filter_by(id=gs_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    for field in ['name', 'type', 'description', 'is_default', 'is_active']:
        if field in data:
            setattr(gs, field, data[field])
    if gs.is_default:
        GradingSystem.query.filter(GradingSystem.school_id == g.school_id, GradingSystem.id != gs.id).update({'is_default': False})
    db.session.commit()
    return success_response(gs.to_dict(), 'Updated')


@academics_bp.route('/grading-systems/<int:gs_id>', methods=['DELETE'])
@role_required('school_admin', 'academic_controller')
def delete_grading_system(gs_id):
    gs = GradingSystem.query.filter_by(id=gs_id, school_id=g.school_id).first_or_404()
    db.session.delete(gs)
    db.session.commit()
    return success_response(message='Deleted')


@academics_bp.route('/grading-systems/<int:gs_id>/grades', methods=['POST'])
@role_required('school_admin', 'academic_controller')
@validate({
    'name': {'required': True, 'message': 'Grade name is required'},
    'min_marks': {'type': int, 'message': 'Min marks is required'},
    'max_marks': {'type': int, 'message': 'Max marks is required'},
})
def add_grade(gs_id):
    data = g.get('validated_data') or request.get_json()
    grade = Grade(
        grading_system_id=gs_id,
        school_id=g.school_id,
        name=data['name'],
        min_marks=data['min_marks'],
        max_marks=data['max_marks'],
        grade_point=data.get('grade_point'),
        description=data.get('description'),
        is_passing=data.get('is_passing', True),
        display_order=data.get('display_order', 0),
    )
    db.session.add(grade)
    db.session.commit()
    return success_response(grade.to_dict(), 'Grade added', 201)


@academics_bp.route('/grading-systems/grades/<int:grade_id>', methods=['PUT'])
@role_required('school_admin', 'academic_controller')
@validate({})
def update_grade(grade_id):
    grade = Grade.query.filter_by(id=grade_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    for field in ['name', 'min_marks', 'max_marks', 'grade_point', 'description', 'is_passing', 'display_order']:
        if field in data:
            setattr(grade, field, data[field])
    db.session.commit()
    return success_response(grade.to_dict(), 'Updated')


@academics_bp.route('/grading-systems/grades/<int:grade_id>', methods=['DELETE'])
@role_required('school_admin', 'academic_controller')
def delete_grade(grade_id):
    grade = Grade.query.filter_by(id=grade_id, school_id=g.school_id).first_or_404()
    db.session.delete(grade)
    db.session.commit()
    return success_response(message='Deleted')


@academics_bp.route('/grading-systems/<int:gs_id>/calculate', methods=['GET'])
@school_required
def calculate_grade(gs_id):
    marks = request.args.get('marks', type=float)
    max_marks = request.args.get('max_marks', type=float, default=100)
    if marks is None:
        return error_response('marks parameter required')
    percentage = (marks / max_marks) * 100 if max_marks > 0 else 0
    grade = Grade.query.filter(
        Grade.grading_system_id == gs_id,
        Grade.school_id == g.school_id,
        Grade.min_marks <= percentage,
        Grade.max_marks >= percentage
    ).first()
    return success_response({
        'percentage': round(percentage, 2),
        'grade': grade.to_dict() if grade else None
    })


# ============================================================
# EXAMS - Full CRUD
# ============================================================

@academics_bp.route('/exams', methods=['GET'])
@school_required
def list_exams():
    query = Exam.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    academic_year_id = request.args.get('academic_year_id', type=int)
    exam_type_id = request.args.get('exam_type_id', type=int)
    if status:
        query = query.filter_by(status=status)
    if academic_year_id:
        query = query.filter_by(academic_year_id=academic_year_id)
    if exam_type_id:
        query = query.filter_by(exam_type_id=exam_type_id)
    # Teacher scoping
    scope = get_teacher_scope()
    if scope and scope['class_ids']:
        query = query.join(ExamSchedule, ExamSchedule.exam_id == Exam.id).filter(
            ExamSchedule.class_id.in_(scope['class_ids'])
        ).distinct()
    query = query.order_by(Exam.start_date.desc())
    return success_response(paginate(query))


@academics_bp.route('/exams/<int:exam_id>', methods=['GET'])
@school_required
def get_exam(exam_id):
    exam = Exam.query.filter_by(id=exam_id, school_id=g.school_id).first_or_404()
    scope = get_teacher_scope()
    if scope:
        if scope.get('no_access'):
            return error_response('Access denied', 403)
        has_access = any(s.class_id in scope.get('class_ids', []) for s in exam.schedules)
        if not has_access:
            return error_response('Access denied', 403)
    return success_response(exam.to_detail_dict())


@academics_bp.route('/exams', methods=['POST'])
@role_required('school_admin', 'teacher', 'exam_controller', 'academic_controller')
@validate({
    'name': {'required': True, 'message': 'Exam name is required'},
    'exam_type_id': {'type': int, 'message': 'Exam type is required'},
    'academic_year_id': {'type': int},
})
def create_exam():
    data = g.get('validated_data') or request.get_json()
    exam = Exam(
        school_id=g.school_id,
        name=data['name'],
        academic_year_id=clean_val(data.get('academic_year_id'), int),
        exam_type_id=clean_val(data.get('exam_type_id'), int),
        grading_system_id=clean_val(data.get('grading_system_id'), int),
        description=clean_val(data.get('description')),
        start_date=clean_val(data.get('start_date')),
        end_date=clean_val(data.get('end_date')),
        instructions=clean_val(data.get('instructions')),
        class_ids=clean_val(data.get('class_ids')) or [],
        created_by=g.user_id if hasattr(g, 'user_id') else None,
    )
    db.session.add(exam)
    db.session.commit()
    return success_response(exam.to_dict(), 'Exam created', 201)


@academics_bp.route('/exams/<int:exam_id>', methods=['PUT'])
@role_required('school_admin', 'teacher', 'exam_controller', 'academic_controller')
@validate({})
def update_exam(exam_id):
    exam = Exam.query.filter_by(id=exam_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    for field in ['name', 'academic_year_id', 'exam_type_id', 'grading_system_id',
                   'description', 'start_date', 'end_date', 'status', 'instructions']:
        if field in data:
            setattr(exam, field, data[field])
    db.session.commit()
    return success_response(exam.to_dict(), 'Exam updated')


@academics_bp.route('/exams/<int:exam_id>', methods=['DELETE'])
@role_required('school_admin', 'exam_controller', 'academic_controller')
def delete_exam(exam_id):
    exam = Exam.query.filter_by(id=exam_id, school_id=g.school_id).first_or_404()
    db.session.delete(exam)
    db.session.commit()
    return success_response(message='Exam deleted')


@academics_bp.route('/exams/<int:exam_id>/status', methods=['PUT'])
@role_required('school_admin', 'exam_controller', 'academic_controller')
@validate({
    'status': {'required': True, 'message': 'Status is required'},
})
def update_exam_status(exam_id):
    exam = Exam.query.filter_by(id=exam_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    exam.status = data['status']
    db.session.commit()
    return success_response(exam.to_dict(), 'Status updated')


# ============================================================
# EXAM SCHEDULES
# ============================================================

@academics_bp.route('/exams/<int:exam_id>/schedules', methods=['GET'])
@school_required
def list_exam_schedules(exam_id):
    query = ExamSchedule.query.filter_by(exam_id=exam_id, school_id=g.school_id)
    scope = get_teacher_scope()
    if scope and scope['class_ids']:
        query = query.filter(ExamSchedule.class_id.in_(scope['class_ids']))
    schedules = query.order_by(ExamSchedule.exam_date, ExamSchedule.start_time).all()
    return success_response([s.to_dict() for s in schedules])


@academics_bp.route('/exams/<int:exam_id>/schedules', methods=['POST'])
@role_required('school_admin', 'teacher', 'exam_controller', 'academic_controller')
@validate({
    'class_id': {'type': int, 'message': 'Class ID is required'},
    'subject_id': {'type': int, 'message': 'Subject ID is required'},
    'exam_date': {'required': True, 'message': 'Exam date is required'},
    'max_marks': {'type': int, 'message': 'Max marks is required'},
})
def add_exam_schedule(exam_id):
    data = g.get('validated_data') or request.get_json()
    schedule = ExamSchedule(
        exam_id=exam_id,
        school_id=g.school_id,
        class_id=data['class_id'],
        subject_id=data['subject_id'],
        section_id=data.get('section_id'),
        exam_date=data['exam_date'],
        start_time=data.get('start_time'),
        end_time=data.get('end_time'),
        max_marks=data['max_marks'],
        passing_marks=data.get('passing_marks'),
        duration_minutes=data.get('duration_minutes'),
        hall_id=data.get('hall_id'),
        instructions=data.get('instructions'),
    )
    db.session.add(schedule)
    db.session.commit()
    return success_response(schedule.to_dict(), 'Schedule added', 201)


@academics_bp.route('/exams/schedules/<int:schedule_id>', methods=['PUT'])
@role_required('school_admin', 'teacher', 'exam_controller', 'academic_controller')
@validate({})
def update_exam_schedule(schedule_id):
    schedule = ExamSchedule.query.filter_by(id=schedule_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    for field in ['class_id', 'subject_id', 'section_id', 'exam_date', 'start_time', 'end_time',
                   'max_marks', 'passing_marks', 'duration_minutes', 'hall_id', 'instructions']:
        if field in data:
            setattr(schedule, field, data[field])
    db.session.commit()
    return success_response(schedule.to_dict(), 'Updated')


@academics_bp.route('/exams/schedules/<int:schedule_id>', methods=['DELETE'])
@role_required('school_admin', 'exam_controller', 'academic_controller')
def delete_exam_schedule(schedule_id):
    schedule = ExamSchedule.query.filter_by(id=schedule_id, school_id=g.school_id).first_or_404()
    db.session.delete(schedule)
    db.session.commit()
    return success_response(message='Deleted')


@academics_bp.route('/exams/<int:exam_id>/schedules/bulk', methods=['POST'])
@role_required('school_admin', 'exam_controller', 'academic_controller')
@validate({})
def bulk_add_schedules(exam_id):
    data = g.get('validated_data') or request.get_json()
    schedules = data.get('schedules', [])
    created = []
    for s in schedules:
        schedule = ExamSchedule(
            exam_id=exam_id,
            school_id=g.school_id,
            class_id=s['class_id'],
            subject_id=s['subject_id'],
            section_id=s.get('section_id'),
            exam_date=s['exam_date'],
            start_time=s.get('start_time'),
            end_time=s.get('end_time'),
            max_marks=s['max_marks'],
            passing_marks=s.get('passing_marks'),
            duration_minutes=s.get('duration_minutes'),
            hall_id=s.get('hall_id'),
        )
        db.session.add(schedule)
        created.append(schedule)
    db.session.commit()
    return success_response([s.to_dict() for s in created], f'{len(created)} schedules added', 201)


# ============================================================
# EXAM GROUPS
# ============================================================

@academics_bp.route('/exam-groups', methods=['GET'])
@school_required
def list_exam_groups():
    groups = ExamGroup.query.filter_by(school_id=g.school_id).all()
    return success_response([g_item.to_dict() for g_item in groups])


@academics_bp.route('/exam-groups', methods=['POST'])
@role_required('school_admin', 'academic_controller', 'exam_controller')
@validate({
    'name': {'required': True, 'message': 'Exam group name is required'},
})
def create_exam_group():
    data = g.get('validated_data') or request.get_json()
    group = ExamGroup(
        school_id=g.school_id,
        name=data['name'],
        academic_year_id=data.get('academic_year_id'),
        description=data.get('description'),
    )
    db.session.add(group)
    db.session.commit()

    for exam_data in data.get('exams', []):
        mapping = ExamGroupMapping(
            exam_group_id=group.id,
            exam_id=exam_data['exam_id'],
            weightage=exam_data.get('weightage', 100),
        )
        db.session.add(mapping)
    db.session.commit()
    return success_response(group.to_dict(), 'Exam group created', 201)


@academics_bp.route('/exam-groups/<int:group_id>', methods=['PUT'])
@role_required('school_admin', 'academic_controller', 'exam_controller')
@validate({})
def update_exam_group(group_id):
    group = ExamGroup.query.filter_by(id=group_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    if 'name' in data:
        group.name = data['name']
    if 'description' in data:
        group.description = data['description']
    db.session.commit()
    return success_response(group.to_dict(), 'Updated')



@academics_bp.route('/exam-groups/<int:group_id>/exams', methods=['POST'])
@role_required('school_admin', 'academic_controller', 'exam_controller')
@validate({
    'exam_id': {'type': int, 'message': 'Exam ID is required'},
})
def add_exam_to_group(group_id):
    data = g.get('validated_data') or request.get_json()
    mapping = ExamGroupMapping(
        exam_group_id=group_id,
        exam_id=data['exam_id'],
        weightage=data.get('weightage', 100),
    )
    db.session.add(mapping)
    db.session.commit()
    return success_response(mapping.to_dict(), 'Exam added to group', 201)


@academics_bp.route('/exam-groups/mappings/<int:mapping_id>', methods=['DELETE'])
@role_required('school_admin', 'academic_controller', 'exam_controller')
def remove_exam_from_group(mapping_id):
    mapping = ExamGroupMapping.query.get_or_404(mapping_id)
    db.session.delete(mapping)
    db.session.commit()
    return success_response(message='Removed')


# ============================================================
# EXAM HALLS
# ============================================================

@academics_bp.route('/exam-halls', methods=['GET'])
@school_required
def list_exam_halls():
    halls = ExamHall.query.filter_by(school_id=g.school_id).all()
    return success_response([h.to_dict() for h in halls])


@academics_bp.route('/exam-halls', methods=['POST'])
@role_required('school_admin', 'exam_controller', 'academic_controller')
@validate({
    'name': {'required': True, 'message': 'Hall name is required'},
    'capacity': {'type': int, 'message': 'Capacity is required'},
})
def create_exam_hall():
    data = g.get('validated_data') or request.get_json()
    hall = ExamHall(
        school_id=g.school_id,
        name=data['name'],
        building=data.get('building'),
        floor=data.get('floor'),
        capacity=data['capacity'],
        rows=data.get('rows'),
        columns=data.get('columns'),
        has_cctv=data.get('has_cctv', False),
    )
    db.session.add(hall)
    db.session.commit()
    return success_response(hall.to_dict(), 'Hall created', 201)


@academics_bp.route('/exam-halls/<int:hall_id>', methods=['PUT'])
@role_required('school_admin', 'exam_controller', 'academic_controller')
@validate({})
def update_exam_hall(hall_id):
    hall = ExamHall.query.filter_by(id=hall_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    for field in ['name', 'building', 'floor', 'capacity', 'rows', 'columns', 'has_cctv', 'is_active']:
        if field in data:
            setattr(hall, field, data[field])
    db.session.commit()
    return success_response(hall.to_dict(), 'Updated')


@academics_bp.route('/exam-halls/<int:hall_id>', methods=['DELETE'])
@role_required('school_admin', 'exam_controller', 'academic_controller')
def delete_exam_hall(hall_id):
    hall = ExamHall.query.filter_by(id=hall_id, school_id=g.school_id).first_or_404()
    db.session.delete(hall)
    db.session.commit()
    return success_response(message='Deleted')


# ============================================================
# SEATING ARRANGEMENT
# ============================================================

@academics_bp.route('/exams/schedules/<int:schedule_id>/seating', methods=['GET'])
@school_required
def get_seating(schedule_id):
    seatings = ExamSeating.query.filter_by(
        school_id=g.school_id, exam_schedule_id=schedule_id
    ).all()
    return success_response([s.to_dict() for s in seatings])


@academics_bp.route('/exams/schedules/<int:schedule_id>/seating/auto', methods=['POST'])
@role_required('school_admin', 'exam_controller', 'academic_controller')
def auto_generate_seating(schedule_id):
    schedule = ExamSchedule.query.filter_by(id=schedule_id, school_id=g.school_id).first_or_404()

    # Clear existing seating
    ExamSeating.query.filter_by(exam_schedule_id=schedule_id, school_id=g.school_id).delete()

    # Get students for this class/section
    student_query = Student.query.filter_by(school_id=g.school_id, current_class_id=schedule.class_id, status='active')
    if schedule.section_id:
        student_query = student_query.filter_by(current_section_id=schedule.section_id)
    students = student_query.order_by(Student.first_name).all()

    # Get available halls
    halls = ExamHall.query.filter_by(school_id=g.school_id, is_active=True).order_by(ExamHall.name).all()
    if not halls:
        return error_response('No active exam halls found', 400)

    seat_no = 1
    hall_idx = 0
    hall_filled = 0
    created = []

    for student in students:
        if hall_idx >= len(halls):
            break
        current_hall = halls[hall_idx]
        row = (hall_filled // (current_hall.columns or 5)) + 1
        col = (hall_filled % (current_hall.columns or 5)) + 1

        seating = ExamSeating(
            school_id=g.school_id,
            exam_schedule_id=schedule_id,
            hall_id=current_hall.id,
            student_id=student.id,
            seat_number=str(seat_no),
            row_number=row,
            column_number=col,
        )
        db.session.add(seating)
        created.append(seating)
        seat_no += 1
        hall_filled += 1

        if hall_filled >= current_hall.capacity:
            hall_idx += 1
            hall_filled = 0

    db.session.commit()
    return success_response([s.to_dict() for s in created], f'{len(created)} seats assigned')


# ============================================================
# INVIGILATORS
# ============================================================

@academics_bp.route('/exams/schedules/<int:schedule_id>/invigilators', methods=['GET'])
@school_required
def list_invigilators(schedule_id):
    invigilators = ExamInvigilator.query.filter_by(
        school_id=g.school_id, exam_schedule_id=schedule_id
    ).all()
    return success_response([i.to_dict() for i in invigilators])


@academics_bp.route('/exams/schedules/<int:schedule_id>/invigilators', methods=['POST'])
@role_required('school_admin', 'exam_controller', 'academic_controller')
@validate({
    'hall_id': {'type': int, 'message': 'Hall ID is required'},
    'staff_id': {'type': int, 'message': 'Staff ID is required'},
})
def assign_invigilator(schedule_id):
    data = g.get('validated_data') or request.get_json()
    inv = ExamInvigilator(
        school_id=g.school_id,
        exam_schedule_id=schedule_id,
        hall_id=data['hall_id'],
        staff_id=data['staff_id'],
        role=data.get('role', 'assistant'),
    )
    db.session.add(inv)
    db.session.commit()
    return success_response(inv.to_dict(), 'Invigilator assigned', 201)


@academics_bp.route('/exams/invigilators/<int:inv_id>', methods=['DELETE'])
@role_required('school_admin', 'exam_controller', 'academic_controller')
def remove_invigilator(inv_id):
    inv = ExamInvigilator.query.filter_by(id=inv_id, school_id=g.school_id).first_or_404()
    db.session.delete(inv)
    db.session.commit()
    return success_response(message='Removed')


# ============================================================
# MARKS ENTRY & RESULTS
# ============================================================

@academics_bp.route('/marks/entry', methods=['POST'])
@role_required('school_admin', 'exam_controller', 'academic_controller', 'teacher')
@validate({
    'exam_schedule_id': {'type': int, 'message': 'Exam schedule ID is required'},
})
def bulk_marks_entry():
    """Bulk marks entry - accepts array of {student_id, marks_obtained, is_absent, remarks}"""
    data = g.get('validated_data') or request.get_json()
    exam_schedule_id = data['exam_schedule_id']

    schedule = ExamSchedule.query.filter_by(id=exam_schedule_id, school_id=g.school_id).first_or_404()

    # Assignment-based access control for teachers
    if hasattr(g, 'current_user') and g.current_user and g.current_user.role and g.current_user.role.name == 'teacher':
        from app.models.academic import MarksEntryAssignment
        staff = Staff.query.filter_by(user_id=g.user_id, school_id=g.school_id).first()
        if not staff:
            return error_response('Staff record not found', 404)
        assignment = MarksEntryAssignment.query.filter_by(
            exam_schedule_id=exam_schedule_id,
            teacher_id=staff.id,
            status='active',
            school_id=g.school_id
        ).first()
        if not assignment:
            return error_response('No marks entry assignment for this schedule', 403)
    else:
        # Admin/exam_controller bypass — check legacy scope for backward compat
        scope = get_teacher_scope()
        if scope:
            if scope.get('no_access'):
                return error_response('Access denied', 403)
            if schedule.subject_id not in scope.get('subject_ids', []) or schedule.class_id not in scope.get('class_ids', []):
                return error_response('Access denied', 403)

    if schedule.is_marks_locked:
        return error_response('Marks are locked for this subject', 403)

    entries = data.get('entries', [])

    # Validate marks using MarksEntryService
    from app.services.marks_entry_service import MarksEntryService
    is_valid, validation_errors = MarksEntryService.validate_marks_entry(entries, schedule)
    if not is_valid:
        return error_response({
            'message': 'Marks validation failed',
            'errors': validation_errors
        }, 400)

    results = []

    for entry in entries:
        student_id = entry['student_id']
        is_absent = entry.get('is_absent', False)
        is_exempted = entry.get('is_exempted', False)

        # If absent, force marks_obtained to None
        marks = None if is_absent else entry.get('marks_obtained')

        # Upsert ExamResult
        result = ExamResult.query.filter_by(
            exam_schedule_id=exam_schedule_id,
            student_id=student_id,
            school_id=g.school_id,
        ).first()

        # Calculate grade if marks provided
        grade_name = None
        grade_point = None
        percentage = None
        if marks is not None and schedule.max_marks and float(schedule.max_marks) > 0:
            exam = schedule.exam
            grading_system_id = exam.grading_system_id if exam else None
            grade_info = MarksEntryService.calculate_grade(
                marks_obtained=marks,
                max_marks=schedule.max_marks,
                grading_system_id=grading_system_id,
                school_id=g.school_id
            )
            percentage = grade_info['percentage']
            grade_name = grade_info['grade_name']
            grade_point = grade_info['grade_point']

        now = datetime.utcnow()

        if result:
            result.marks_obtained = marks
            result.is_absent = is_absent
            result.is_exempted = is_exempted
            result.grade = grade_name
            result.grade_point = grade_point
            result.percentage = percentage
            result.remarks = entry.get('remarks')
            result.entered_by = g.user_id
            result.updated_at = now
        else:
            result = ExamResult(
                exam_schedule_id=exam_schedule_id,
                student_id=student_id,
                school_id=g.school_id,
                marks_obtained=marks,
                is_absent=is_absent,
                is_exempted=is_exempted,
                grade=grade_name,
                grade_point=grade_point,
                percentage=percentage,
                remarks=entry.get('remarks'),
                entered_by=g.user_id,
                entered_at=now,
            )
            db.session.add(result)
        results.append(result)

    db.session.commit()
    return success_response([r.to_dict() for r in results], f'{len(results)} marks entered')


@academics_bp.route('/marks/sheet', methods=['GET'])
@school_required
def get_marks_sheet():
    """Get marks sheet for a specific exam schedule (class + subject)"""
    exam_schedule_id = request.args.get('exam_schedule_id', type=int)
    exam_id = request.args.get('exam_id', type=int)
    class_id = request.args.get('class_id', type=int)
    section_id = request.args.get('section_id', type=int)

    if exam_schedule_id:
        schedule = ExamSchedule.query.filter_by(id=exam_schedule_id, school_id=g.school_id).first_or_404()
        schedules = [schedule]
    elif exam_id and class_id:
        query = ExamSchedule.query.filter_by(exam_id=exam_id, school_id=g.school_id, class_id=class_id)
        if section_id:
            query = query.filter_by(section_id=section_id)
        schedules = query.order_by(ExamSchedule.exam_date).all()
    else:
        return error_response('exam_schedule_id or (exam_id + class_id) required')

    # Teacher scoping on schedules
    scope = get_teacher_scope()
    if scope:
        if scope.get('no_access'):
            return success_response({'students': [], 'schedules': []})
        if scope.get('class_ids'):
            schedules = [s for s in schedules if s.class_id in scope['class_ids']]
        if not schedules:
            return success_response({'students': [], 'schedules': []})

    # Get students for this class
    resolve_class_id = class_id or schedules[0].class_id
    resolve_section_id = section_id or (schedules[0].section_id if len(schedules) == 1 else None)
    student_query = Student.query.filter_by(school_id=g.school_id, current_class_id=resolve_class_id, status='active')
    if resolve_section_id:
        student_query = student_query.filter_by(current_section_id=resolve_section_id)
    if scope and scope.get('section_ids'):
        student_query = student_query.filter(Student.current_section_id.in_(scope['section_ids']))
    students = student_query.order_by(Student.roll_no, Student.first_name).all()

    # Build marks matrix
    marks_data = []
    for student in students:
        student_marks = {
            'student_id': student.id,
            'student_name': f"{student.first_name} {student.last_name}",
            'admission_no': student.admission_no,
            'roll_no': student.roll_no,
            'subjects': []
        }
        total_obtained = 0
        total_max = 0
        for schedule in schedules:
            result = ExamResult.query.filter_by(
                exam_schedule_id=schedule.id,
                student_id=student.id,
                school_id=g.school_id,
            ).first()
            subject_data = {
                'schedule_id': schedule.id,
                'subject_id': schedule.subject_id,
                'subject_name': schedule.subject.name if schedule.subject else None,
                'max_marks': float(schedule.max_marks) if schedule.max_marks else 0,
                'passing_marks': float(schedule.passing_marks) if schedule.passing_marks else 0,
                'marks_obtained': float(result.marks_obtained) if result and result.marks_obtained else None,
                'grade': result.grade if result else None,
                'is_absent': result.is_absent if result else False,
                'is_exempted': result.is_exempted if result else False,
                'remarks': result.remarks if result else None,
            }
            student_marks['subjects'].append(subject_data)
            if result and result.marks_obtained and not result.is_absent:
                total_obtained += float(result.marks_obtained)
            total_max += float(schedule.max_marks) if schedule.max_marks else 0

        student_marks['total_obtained'] = total_obtained
        student_marks['total_max'] = total_max
        student_marks['percentage'] = round((total_obtained / total_max * 100), 2) if total_max > 0 else 0
        marks_data.append(student_marks)

    # Sort by percentage desc for ranking
    marks_data.sort(key=lambda x: x['percentage'], reverse=True)
    for idx, m in enumerate(marks_data):
        m['rank'] = idx + 1

    return success_response({
        'schedules': [s.to_dict() for s in schedules],
        'marks': marks_data,
        'total_students': len(students),
    })


@academics_bp.route('/marks/lock', methods=['POST'])
@role_required('school_admin', 'exam_controller', 'academic_controller', 'principal')
@validate({
    'exam_schedule_id': {'type': int, 'message': 'Exam schedule ID is required'},
})
def lock_marks():
    data = g.get('validated_data') or request.get_json()
    schedule_id = data['exam_schedule_id']
    schedule = ExamSchedule.query.filter_by(id=schedule_id, school_id=g.school_id).first_or_404()
    schedule.is_marks_locked = True
    db.session.commit()
    return success_response(message='Marks locked')


@academics_bp.route('/marks/unlock', methods=['POST'])
@role_required('school_admin', 'exam_controller', 'academic_controller', 'principal')
@validate({
    'exam_schedule_id': {'type': int, 'message': 'Exam schedule ID is required'},
})
def unlock_marks():
    data = g.get('validated_data') or request.get_json()
    schedule_id = data['exam_schedule_id']
    schedule = ExamSchedule.query.filter_by(id=schedule_id, school_id=g.school_id).first_or_404()
    schedule.is_marks_locked = False
    db.session.commit()
    return success_response(message='Marks unlocked')


# ============================================================
# RESULTS & ANALYTICS
# ============================================================

@academics_bp.route('/results', methods=['POST'])
@role_required('school_admin', 'teacher')
@validate({})
def add_results():
    data = g.get('validated_data') or request.get_json()
    results_data = data.get('results', [])

    scope = get_teacher_scope()

    created = []
    for r in results_data:
        if scope:
            if scope.get('no_access'):
                return error_response('Access denied', 403)
            schedule = ExamSchedule.query.get(r['exam_schedule_id'])
            if not schedule or schedule.subject_id not in scope.get('subject_ids', []) or schedule.class_id not in scope.get('class_ids', []):
                return error_response('Access denied', 403)
        result = ExamResult(
            exam_schedule_id=r['exam_schedule_id'],
            student_id=r['student_id'],
            school_id=g.school_id,
            marks_obtained=r.get('marks_obtained'),
            grade=r.get('grade'),
            remarks=r.get('remarks'),
        )
        db.session.add(result)
        created.append(result)

    db.session.commit()
    return success_response([r.to_dict() for r in created], f'{len(created)} results added', 201)


@academics_bp.route('/results/student/<int:student_id>', methods=['GET'])
@school_required
def get_student_results(student_id):
    exam_id = request.args.get('exam_id', type=int)
    query = ExamResult.query.filter_by(student_id=student_id, school_id=g.school_id)
    if exam_id:
        query = query.join(ExamSchedule).filter(ExamSchedule.exam_id == exam_id)
    scope = get_teacher_scope()
    if scope:
        if scope.get('no_access'):
            return success_response([])
        student = Student.query.get(student_id)
        if not student or student.current_section_id not in scope.get('section_ids', []):
            return success_response([])
    results = query.all()
    return success_response([r.to_dict() for r in results])


@academics_bp.route('/results/class', methods=['GET'])
@school_required
def get_class_results():
    """Class-wise results for a specific exam"""
    exam_id = request.args.get('exam_id', type=int)
    class_id = request.args.get('class_id', type=int)
    section_id = request.args.get('section_id', type=int)
    if not exam_id or not class_id:
        return error_response('exam_id and class_id required')

    scope = get_teacher_scope()
    if scope and scope.get('no_access'):
        return success_response([])
    if scope and class_id not in scope.get('class_ids', []):
        return error_response('Access denied', 403)

    schedules = ExamSchedule.query.filter_by(
        exam_id=exam_id, school_id=g.school_id, class_id=class_id
    ).all()

    student_query = Student.query.filter_by(school_id=g.school_id, current_class_id=class_id, status='active')
    if section_id:
        student_query = student_query.filter_by(current_section_id=section_id)
    students = student_query.all()

    class_results = []
    for student in students:
        total_obtained = 0
        total_max = 0
        subjects_passed = 0
        subjects_failed = 0
        subject_results = []

        for schedule in schedules:
            result = ExamResult.query.filter_by(
                exam_schedule_id=schedule.id,
                student_id=student.id,
            ).first()
            max_m = float(schedule.max_marks) if schedule.max_marks else 0
            pass_m = float(schedule.passing_marks) if schedule.passing_marks else 0
            obtained = float(result.marks_obtained) if result and result.marks_obtained else 0

            if result and not result.is_absent:
                total_obtained += obtained
                if obtained >= pass_m:
                    subjects_passed += 1
                else:
                    subjects_failed += 1
            total_max += max_m

            subject_results.append({
                'subject': schedule.subject.name if schedule.subject else None,
                'max_marks': max_m,
                'marks_obtained': obtained,
                'grade': result.grade if result else None,
                'is_absent': result.is_absent if result else False,
            })

        pct = round((total_obtained / total_max * 100), 2) if total_max > 0 else 0
        class_results.append({
            'student_id': student.id,
            'student_name': f"{student.first_name} {student.last_name}",
            'admission_no': student.admission_no,
            'total_obtained': total_obtained,
            'total_max': total_max,
            'percentage': pct,
            'subjects_passed': subjects_passed,
            'subjects_failed': subjects_failed,
            'result_status': 'pass' if subjects_failed == 0 else 'fail',
            'subjects': subject_results,
        })

    class_results.sort(key=lambda x: x['percentage'], reverse=True)
    for idx, r in enumerate(class_results):
        r['rank'] = idx + 1

    # Summary stats
    total = len(class_results)
    passed = sum(1 for r in class_results if r['result_status'] == 'pass')
    avg_pct = round(sum(r['percentage'] for r in class_results) / total, 2) if total > 0 else 0

    return success_response({
        'results': class_results,
        'summary': {
            'total_students': total,
            'passed': passed,
            'failed': total - passed,
            'pass_percentage': round((passed / total * 100), 2) if total > 0 else 0,
            'average_percentage': avg_pct,
            'highest_percentage': class_results[0]['percentage'] if class_results else 0,
            'lowest_percentage': class_results[-1]['percentage'] if class_results else 0,
        }
    })


@academics_bp.route('/results/subject-analysis', methods=['GET'])
@school_required
def subject_analysis():
    """Subject-wise analysis for an exam"""
    exam_id = request.args.get('exam_id', type=int)
    class_id = request.args.get('class_id', type=int)
    if not exam_id:
        return error_response('exam_id required')

    query = ExamSchedule.query.filter_by(exam_id=exam_id, school_id=g.school_id)
    if class_id:
        query = query.filter_by(class_id=class_id)
    schedules = query.all()

    analysis = []
    for schedule in schedules:
        results = ExamResult.query.filter_by(
            exam_schedule_id=schedule.id, school_id=g.school_id
        ).filter(ExamResult.is_absent == False).all()

        if not results:
            analysis.append({
                'subject': schedule.subject.name if schedule.subject else None,
                'max_marks': float(schedule.max_marks) if schedule.max_marks else 0,
                'total_students': 0,
                'appeared': 0,
                'passed': 0,
                'failed': 0,
                'average': 0,
                'highest': 0,
                'lowest': 0,
            })
            continue

        marks_list = [float(r.marks_obtained) for r in results if r.marks_obtained]
        pass_marks = float(schedule.passing_marks) if schedule.passing_marks else 0
        total_appeared = len(marks_list)
        passed = sum(1 for m in marks_list if m >= pass_marks)

        analysis.append({
            'schedule_id': schedule.id,
            'subject': schedule.subject.name if schedule.subject else None,
            'subject_id': schedule.subject_id,
            'max_marks': float(schedule.max_marks) if schedule.max_marks else 0,
            'total_students': ExamResult.query.filter_by(exam_schedule_id=schedule.id).count(),
            'appeared': total_appeared,
            'absent': ExamResult.query.filter_by(exam_schedule_id=schedule.id, is_absent=True).count(),
            'passed': passed,
            'failed': total_appeared - passed,
            'pass_percentage': round((passed / total_appeared * 100), 2) if total_appeared > 0 else 0,
            'average': round(sum(marks_list) / total_appeared, 2) if total_appeared > 0 else 0,
            'highest': max(marks_list) if marks_list else 0,
            'lowest': min(marks_list) if marks_list else 0,
        })

    return success_response(analysis)


@academics_bp.route('/results/toppers', methods=['GET'])
@school_required
def get_toppers():
    """Get top performers for an exam"""
    exam_id = request.args.get('exam_id', type=int)
    class_id = request.args.get('class_id', type=int)
    limit = request.args.get('limit', 10, type=int)
    if not exam_id:
        return error_response('exam_id required')

    schedules_query = ExamSchedule.query.filter_by(exam_id=exam_id, school_id=g.school_id)
    if class_id:
        schedules_query = schedules_query.filter_by(class_id=class_id)
    schedule_ids = [s.id for s in schedules_query.all()]

    if not schedule_ids:
        return success_response([])

    # Aggregate marks per student
    student_totals = db.session.query(
        ExamResult.student_id,
        func.sum(ExamResult.marks_obtained).label('total_marks'),
    ).filter(
        ExamResult.exam_schedule_id.in_(schedule_ids),
        ExamResult.school_id == g.school_id,
        ExamResult.is_absent == False,
    ).group_by(ExamResult.student_id).order_by(
        func.sum(ExamResult.marks_obtained).desc()
    ).limit(limit).all()

    total_max = sum(float(s.max_marks) for s in schedules_query.all() if s.max_marks)

    toppers = []
    for rank, (student_id, total) in enumerate(student_totals, 1):
        student = Student.query.get(student_id)
        if student:
            toppers.append({
                'rank': rank,
                'student_id': student_id,
                'student_name': f"{student.first_name} {student.last_name}",
                'admission_no': student.admission_no,
                'class_name': student.class_ref.name if student.class_ref else None,
                'total_marks': float(total) if total else 0,
                'total_max': total_max,
                'percentage': round((float(total) / total_max * 100), 2) if total_max > 0 and total else 0,
            })

    return success_response(toppers)


# ============================================================
# ADMIT CARDS
# ============================================================

@academics_bp.route('/admit-cards/generate', methods=['POST'])
@role_required('school_admin', 'exam_controller', 'academic_controller')
@validate({
    'exam_id': {'type': int, 'message': 'Exam ID is required'},
})
def generate_admit_cards():
    data = g.get('validated_data') or request.get_json()
    exam_id = data['exam_id']
    class_id = data.get('class_id')
    section_id = data.get('section_id')
    student_ids = data.get('student_ids', [])

    # Get students
    if student_ids:
        students = Student.query.filter(
            Student.id.in_(student_ids),
            Student.school_id == g.school_id,
            Student.status == 'active',
        ).all()
    elif class_id:
        query = Student.query.filter_by(school_id=g.school_id, current_class_id=class_id, status='active')
        if section_id:
            query = query.filter_by(current_section_id=section_id)
        students = query.all()
    else:
        return error_response('class_id or student_ids required')

    created = []
    for student in students:
        existing = ExamAdmitCard.query.filter_by(
            exam_id=exam_id, student_id=student.id, school_id=g.school_id
        ).first()
        if existing:
            continue
        card = ExamAdmitCard(
            school_id=g.school_id,
            exam_id=exam_id,
            student_id=student.id,
            roll_number=student.admission_no,
            status='generated',
        )
        db.session.add(card)
        created.append(card)

    db.session.commit()
    return success_response([c.to_dict() for c in created], f'{len(created)} admit cards generated')


@academics_bp.route('/admit-cards', methods=['GET'])
@school_required
def list_admit_cards():
    exam_id = request.args.get('exam_id', type=int)
    class_id = request.args.get('class_id', type=int)

    query = ExamAdmitCard.query.filter_by(school_id=g.school_id)
    if exam_id:
        query = query.filter_by(exam_id=exam_id)
    if class_id:
        query = query.join(Student).filter(Student.class_id == class_id)

    cards = query.all()
    return success_response([c.to_dict() for c in cards])


@academics_bp.route('/admit-cards/<int:card_id>/status', methods=['PUT'])
@role_required('school_admin', 'exam_controller', 'academic_controller')
@validate({
    'status': {'required': True, 'message': 'Status is required'},
})
def update_admit_card_status(card_id):
    card = ExamAdmitCard.query.filter_by(id=card_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    card.status = data['status']
    if data['status'] == 'issued':
        card.issued_at = datetime.utcnow()
    db.session.commit()
    return success_response(card.to_dict(), 'Status updated')


# ============================================================
# REPORT CARDS
# ============================================================

@academics_bp.route('/report-cards/generate', methods=['POST'])
@role_required('school_admin', 'exam_controller', 'academic_controller')
@validate({
    'exam_id': {'type': int, 'message': 'Exam ID is required'},
    'class_id': {'type': int, 'message': 'Class ID is required'},
})
def generate_report_cards():
    """Generate report cards for students"""
    data = g.get('validated_data') or request.get_json()
    exam_id = data['exam_id']
    class_id = data['class_id']
    section_id = data.get('section_id')
    academic_year_id = data.get('academic_year_id')

    exam = Exam.query.filter_by(id=exam_id, school_id=g.school_id).first_or_404()
    schedules = ExamSchedule.query.filter_by(
        exam_id=exam_id, school_id=g.school_id, class_id=class_id
    ).all()

    student_query = Student.query.filter_by(school_id=g.school_id, current_class_id=class_id, status='active')
    if section_id:
        student_query = student_query.filter_by(current_section_id=section_id)
    students = student_query.all()

    # Compute results for each student
    student_scores = []
    for student in students:
        total_obtained = 0
        total_max = 0
        all_passed = True

        for schedule in schedules:
            result = ExamResult.query.filter_by(
                exam_schedule_id=schedule.id, student_id=student.id
            ).first()
            max_m = float(schedule.max_marks) if schedule.max_marks else 0
            pass_m = float(schedule.passing_marks) if schedule.passing_marks else 0
            obtained = float(result.marks_obtained) if result and result.marks_obtained else 0

            if result and not result.is_absent:
                total_obtained += obtained
                if obtained < pass_m:
                    all_passed = False
            total_max += max_m

        pct = round((total_obtained / total_max * 100), 2) if total_max > 0 else 0

        # Calculate grade
        grade_name = None
        gpa = None
        if exam.grading_system_id:
            grade_obj = Grade.query.filter(
                Grade.grading_system_id == exam.grading_system_id,
                Grade.school_id == g.school_id,
                Grade.min_marks <= pct,
                Grade.max_marks >= pct
            ).first()
            if grade_obj:
                grade_name = grade_obj.name
                gpa = float(grade_obj.grade_point) if grade_obj.grade_point else None

        student_scores.append({
            'student': student,
            'total_obtained': total_obtained,
            'total_max': total_max,
            'percentage': pct,
            'grade': grade_name,
            'gpa': gpa,
            'result_status': 'pass' if all_passed else 'fail',
        })

    # Sort by percentage for ranking
    student_scores.sort(key=lambda x: x['percentage'], reverse=True)

    created = []
    for rank, score in enumerate(student_scores, 1):
        student = score['student']
        # Upsert
        existing = ReportCard.query.filter_by(
            exam_id=exam_id, student_id=student.id, school_id=g.school_id
        ).first()

        if existing:
            existing.total_marks = score['total_obtained']
            existing.total_max_marks = score['total_max']
            existing.percentage = score['percentage']
            existing.grade = score['grade']
            existing.gpa = score['gpa']
            existing.rank_in_class = rank
            existing.total_students = len(students)
            existing.result_status = score['result_status']
            existing.generated_at = datetime.utcnow()
            created.append(existing)
        else:
            rc = ReportCard(
                school_id=g.school_id,
                student_id=student.id,
                exam_id=exam_id,
                academic_year_id=academic_year_id or exam.academic_year_id,
                class_id=class_id,
                total_marks=score['total_obtained'],
                total_max_marks=score['total_max'],
                percentage=score['percentage'],
                grade=score['grade'],
                gpa=score['gpa'],
                rank_in_class=rank,
                total_students=len(students),
                result_status=score['result_status'],
            )
            db.session.add(rc)
            created.append(rc)

    db.session.commit()
    return success_response([rc.to_dict() for rc in created], f'{len(created)} report cards generated')


@academics_bp.route('/report-cards', methods=['GET'])
@school_required
def list_report_cards():
    exam_id = request.args.get('exam_id', type=int)
    class_id = request.args.get('class_id', type=int)
    status = request.args.get('status')

    query = ReportCard.query.filter_by(school_id=g.school_id)
    if exam_id:
        query = query.filter_by(exam_id=exam_id)
    if class_id:
        query = query.filter_by(class_id=class_id)
    if status:
        query = query.filter_by(status=status)

    query = query.order_by(ReportCard.rank_in_class)
    return success_response(paginate(query))


@academics_bp.route('/report-cards/<int:rc_id>', methods=['GET'])
@school_required
def get_report_card(rc_id):
    rc = ReportCard.query.filter_by(id=rc_id, school_id=g.school_id).first_or_404()

    # Get subject-wise results
    schedules = ExamSchedule.query.filter_by(
        exam_id=rc.exam_id, school_id=g.school_id, class_id=rc.class_id
    ).all()

    subjects = []
    for schedule in schedules:
        result = ExamResult.query.filter_by(
            exam_schedule_id=schedule.id, student_id=rc.student_id
        ).first()
        subjects.append({
            'subject': schedule.subject.name if schedule.subject else None,
            'max_marks': float(schedule.max_marks) if schedule.max_marks else 0,
            'marks_obtained': float(result.marks_obtained) if result and result.marks_obtained else 0,
            'grade': result.grade if result else None,
            'is_absent': result.is_absent if result else False,
            'remarks': result.remarks if result else None,
        })

    detail = rc.to_dict()
    detail['subjects'] = subjects
    return success_response(detail)


@academics_bp.route('/report-cards/<int:rc_id>', methods=['PUT'])
@role_required('school_admin', 'exam_controller', 'academic_controller')
@validate({})
def update_report_card(rc_id):
    rc = ReportCard.query.filter_by(id=rc_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    for field in ['teacher_remarks', 'principal_remarks', 'attendance_percentage']:
        if field in data:
            setattr(rc, field, data[field])
    db.session.commit()
    return success_response(rc.to_dict(), 'Updated')


@academics_bp.route('/report-cards/publish', methods=['POST'])
@role_required('school_admin', 'exam_controller', 'academic_controller')
@validate({
    'exam_id': {'type': int, 'message': 'Exam ID is required'},
})
def publish_report_cards():
    data = g.get('validated_data') or request.get_json()
    exam_id = data['exam_id']
    class_id = data.get('class_id')

    query = ReportCard.query.filter_by(school_id=g.school_id, exam_id=exam_id, status='draft')
    if class_id:
        query = query.filter_by(class_id=class_id)

    count = query.update({'status': 'published', 'published_at': datetime.utcnow()})
    db.session.commit()
    return success_response(message=f'{count} report cards published')


@academics_bp.route('/report-cards/student/<int:student_id>', methods=['GET'])
@school_required
def student_report_cards(student_id):
    cards = ReportCard.query.filter_by(
        student_id=student_id, school_id=g.school_id
    ).order_by(ReportCard.generated_at.desc()).all()
    return success_response([rc.to_dict() for rc in cards])


# ============================================================
# REPORT CARD PDF GENERATION
# ============================================================

@academics_bp.route('/report-cards/<int:rc_id>/pdf', methods=['GET'])
@school_required
def download_report_card_pdf(rc_id):
    """Generate and download a professional PDF report card"""
    import io
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm, cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

    rc = ReportCard.query.filter_by(id=rc_id, school_id=g.school_id).first_or_404()
    student = rc.student
    school = School.query.get(g.school_id)
    exam = rc.exam

    # Get subject-wise results
    schedules = ExamSchedule.query.filter_by(
        exam_id=rc.exam_id, school_id=g.school_id, class_id=rc.class_id
    ).all()

    subjects = []
    for schedule in schedules:
        result = ExamResult.query.filter_by(
            exam_schedule_id=schedule.id, student_id=rc.student_id
        ).first()
        max_m = float(schedule.max_marks) if schedule.max_marks else 0
        pass_m = float(schedule.passing_marks) if schedule.passing_marks else 0
        obtained = float(result.marks_obtained) if result and result.marks_obtained else 0
        subjects.append({
            'name': schedule.subject.name if schedule.subject else 'Unknown',
            'max_marks': max_m,
            'passing_marks': pass_m,
            'marks_obtained': obtained,
            'grade': result.grade if result else '-',
            'is_absent': result.is_absent if result else False,
            'passed': obtained >= pass_m and not (result.is_absent if result else True),
        })

    # Build PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            topMargin=15 * mm, bottomMargin=15 * mm,
                            leftMargin=15 * mm, rightMargin=15 * mm)

    styles = getSampleStyleSheet()
    story = []

    # Custom styles
    title_style = ParagraphStyle('SchoolTitle', parent=styles['Title'],
        fontSize=20, spaceAfter=2, textColor=colors.HexColor('#1a237e'),
        fontName='Helvetica-Bold', alignment=TA_CENTER)
    subtitle_style = ParagraphStyle('SubTitle', parent=styles['Normal'],
        fontSize=10, spaceAfter=1, textColor=colors.HexColor('#424242'),
        alignment=TA_CENTER)
    heading_style = ParagraphStyle('SectionHead', parent=styles['Heading2'],
        fontSize=12, textColor=colors.HexColor('#1a237e'),
        fontName='Helvetica-Bold', spaceAfter=6, spaceBefore=10)
    normal_style = ParagraphStyle('NormalText', parent=styles['Normal'],
        fontSize=10, leading=14)
    center_style = ParagraphStyle('CenterText', parent=styles['Normal'],
        fontSize=10, alignment=TA_CENTER)
    bold_style = ParagraphStyle('BoldText', parent=styles['Normal'],
        fontSize=10, fontName='Helvetica-Bold')
    small_style = ParagraphStyle('SmallText', parent=styles['Normal'],
        fontSize=8, textColor=colors.HexColor('#757575'))

    # Color palette
    primary = colors.HexColor('#1a237e')
    accent = colors.HexColor('#3949ab')
    light_bg = colors.HexColor('#e8eaf6')
    success_color = colors.HexColor('#2e7d32')
    fail_color = colors.HexColor('#c62828')
    border_color = colors.HexColor('#bdbdbd')

    # ===== HEADER: School Info =====
    school_name = school.name if school else 'School Name'
    school_address = ', '.join(filter(None, [
        school.address if school else None,
        school.city if school else None,
        school.state if school else None,
        school.pincode if school else None
    ])) or 'School Address'
    school_contact = ', '.join(filter(None, [
        f"Ph: {school.phone}" if school and school.phone else None,
        f"Email: {school.email}" if school and school.email else None,
    ])) or ''

    story.append(Paragraph(school_name.upper(), title_style))
    story.append(Paragraph(school_address, subtitle_style))
    if school_contact:
        story.append(Paragraph(school_contact, subtitle_style))
    story.append(Spacer(1, 3 * mm))
    story.append(HRFlowable(width="100%", thickness=2, color=primary))
    story.append(Spacer(1, 2 * mm))

    # Report Card Title
    exam_name = exam.name if exam else 'Examination'
    academic_year_str = ''
    if rc.academic_year_id:
        ay = AcademicYear.query.get(rc.academic_year_id)
        academic_year_str = f" ({ay.name})" if ay else ''

    rc_title = ParagraphStyle('RCTitle', parent=styles['Title'],
        fontSize=14, textColor=colors.white, fontName='Helvetica-Bold',
        alignment=TA_CENTER, spaceBefore=0, spaceAfter=0)

    # Title bar
    title_data = [[Paragraph(f"REPORT CARD - {exam_name.upper()}{academic_year_str}", rc_title)]]
    title_table = Table(title_data, colWidths=[doc.width])
    title_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), primary),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    story.append(title_table)
    story.append(Spacer(1, 4 * mm))

    # ===== STUDENT INFO =====
    class_name = rc.class_ref.name if rc.class_ref else '-'
    section_name = student.current_section.name if student and student.current_section else '-'
    dob_str = student.date_of_birth.strftime('%d-%m-%Y') if student and student.date_of_birth else '-'

    father_name = '-'
    mother_name = '-'
    if student:
        for p in student.parents:
            if p.relation == 'father':
                father_name = p.name
            elif p.relation == 'mother':
                mother_name = p.name

    info_data = [
        [Paragraph('<b>Student Name:</b>', normal_style),
         Paragraph(f"{student.first_name} {student.last_name}" if student else '-', normal_style),
         Paragraph('<b>Admission No:</b>', normal_style),
         Paragraph(student.admission_no or '-', normal_style)],
        [Paragraph('<b>Class:</b>', normal_style),
         Paragraph(f"{class_name} - {section_name}", normal_style),
         Paragraph('<b>Roll No:</b>', normal_style),
         Paragraph(student.roll_no or '-', normal_style)],
        [Paragraph("<b>Father's Name:</b>", normal_style),
         Paragraph(father_name, normal_style),
         Paragraph('<b>Date of Birth:</b>', normal_style),
         Paragraph(dob_str, normal_style)],
        [Paragraph("<b>Mother's Name:</b>", normal_style),
         Paragraph(mother_name, normal_style),
         Paragraph('<b>Gender:</b>', normal_style),
         Paragraph((student.gender or '-').title() if student else '-', normal_style)],
    ]

    info_table = Table(info_data, colWidths=[doc.width * 0.18, doc.width * 0.32, doc.width * 0.18, doc.width * 0.32])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), light_bg),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 5 * mm))

    # ===== MARKS TABLE =====
    story.append(Paragraph("SUBJECT-WISE MARKS", heading_style))

    # Header
    marks_header = [
        Paragraph('<b>S.No.</b>', center_style),
        Paragraph('<b>Subject</b>', bold_style),
        Paragraph('<b>Max Marks</b>', center_style),
        Paragraph('<b>Marks Obtained</b>', center_style),
        Paragraph('<b>Pass Marks</b>', center_style),
        Paragraph('<b>Grade</b>', center_style),
        Paragraph('<b>Status</b>', center_style),
    ]
    marks_data = [marks_header]

    for i, sub in enumerate(subjects, 1):
        if sub['is_absent']:
            status = Paragraph('<font color="#c62828">ABSENT</font>', center_style)
            obtained_str = 'AB'
        elif sub['passed']:
            status = Paragraph('<font color="#2e7d32">PASS</font>', center_style)
            obtained_str = str(int(sub['marks_obtained']))
        else:
            status = Paragraph('<font color="#c62828">FAIL</font>', center_style)
            obtained_str = str(int(sub['marks_obtained']))

        marks_data.append([
            Paragraph(str(i), center_style),
            Paragraph(sub['name'], normal_style),
            Paragraph(str(int(sub['max_marks'])), center_style),
            Paragraph(obtained_str, center_style),
            Paragraph(str(int(sub['passing_marks'])), center_style),
            Paragraph(sub['grade'] or '-', center_style),
            status,
        ])

    # Total row
    total_max = sum(s['max_marks'] for s in subjects)
    total_obt = sum(s['marks_obtained'] for s in subjects if not s['is_absent'])
    marks_data.append([
        '', Paragraph('<b>TOTAL</b>', bold_style),
        Paragraph(f'<b>{int(total_max)}</b>', center_style),
        Paragraph(f'<b>{int(total_obt)}</b>', center_style),
        '', '',
        Paragraph(f"<b>{rc.result_status.upper() if rc.result_status else 'PASS'}</b>", center_style),
    ])

    col_widths = [doc.width * 0.06, doc.width * 0.28, doc.width * 0.12, doc.width * 0.15,
                  doc.width * 0.12, doc.width * 0.12, doc.width * 0.15]
    marks_table = Table(marks_data, colWidths=col_widths)

    # Table styling
    table_style = [
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), accent),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        # Grid
        ('GRID', (0, 0), (-1, -1), 0.7, border_color),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        # Total row
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e8eaf6')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('LINEABOVE', (0, -1), (-1, -1), 1.5, primary),
    ]

    # Alternate row colors
    for i in range(1, len(marks_data) - 1):
        if i % 2 == 0:
            table_style.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor('#f5f5f5')))

    marks_table.setStyle(TableStyle(table_style))
    story.append(marks_table)
    story.append(Spacer(1, 5 * mm))

    # ===== RESULT SUMMARY =====
    result_color = success_color if rc.result_status == 'pass' else fail_color
    result_text = rc.result_status.upper() if rc.result_status else 'PASS'

    summary_data = [
        [Paragraph('<b>Total Marks</b>', center_style),
         Paragraph('<b>Percentage</b>', center_style),
         Paragraph('<b>Grade</b>', center_style),
         Paragraph('<b>Rank in Class</b>', center_style),
         Paragraph('<b>Result</b>', center_style)],
        [Paragraph(f"{int(total_obt)} / {int(total_max)}", center_style),
         Paragraph(f"<b>{float(rc.percentage):.1f}%</b>" if rc.percentage else '-', center_style),
         Paragraph(f"<b>{rc.grade or '-'}</b>", center_style),
         Paragraph(f"{rc.rank_in_class or '-'} / {rc.total_students or '-'}", center_style),
         Paragraph(f"<b><font color='{'#2e7d32' if rc.result_status == 'pass' else '#c62828'}'>{result_text}</font></b>", center_style)],
    ]

    summary_table = Table(summary_data, colWidths=[doc.width / 5] * 5)
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.7, border_color),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#f0f4ff')),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 5 * mm))

    # ===== REMARKS =====
    if rc.teacher_remarks or rc.principal_remarks or rc.attendance_percentage:
        story.append(Paragraph("REMARKS", heading_style))
        remark_data = []
        if rc.attendance_percentage:
            remark_data.append([Paragraph('<b>Attendance:</b>', normal_style),
                                Paragraph(f"{float(rc.attendance_percentage):.1f}%", normal_style)])
        if rc.teacher_remarks:
            remark_data.append([Paragraph('<b>Teacher Remarks:</b>', normal_style),
                                Paragraph(rc.teacher_remarks, normal_style)])
        if rc.principal_remarks:
            remark_data.append([Paragraph('<b>Principal Remarks:</b>', normal_style),
                                Paragraph(rc.principal_remarks, normal_style)])

        if remark_data:
            remark_table = Table(remark_data, colWidths=[doc.width * 0.25, doc.width * 0.75])
            remark_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fafafa')),
                ('GRID', (0, 0), (-1, -1), 0.5, border_color),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            story.append(remark_table)
            story.append(Spacer(1, 5 * mm))

    # ===== SIGNATURE SECTION =====
    story.append(Spacer(1, 10 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=border_color))
    story.append(Spacer(1, 12 * mm))

    sig_data = [[
        Paragraph('_____________________', center_style),
        Paragraph('_____________________', center_style),
        Paragraph('_____________________', center_style),
    ], [
        Paragraph('Class Teacher', center_style),
        Paragraph('Principal', center_style),
        Paragraph("Parent's Signature", center_style),
    ]]
    sig_table = Table(sig_data, colWidths=[doc.width / 3] * 3)
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(sig_table)

    # Footer
    story.append(Spacer(1, 5 * mm))
    gen_date = rc.generated_at.strftime('%d-%m-%Y') if rc.generated_at else date.today().strftime('%d-%m-%Y')
    story.append(Paragraph(f"Generated on: {gen_date} | This is a computer-generated document.", small_style))

    doc.build(story)
    buffer.seek(0)

    student_name = f"{student.first_name}_{student.last_name}" if student else "student"
    filename = f"ReportCard_{student_name}_{exam_name.replace(' ', '_')}.pdf"

    return send_file(buffer, mimetype='application/pdf', as_attachment=True, download_name=filename)


@academics_bp.route('/report-cards/sample-pdf', methods=['GET'])
@school_required
def generate_sample_report_card():
    """Generate a sample/demo report card PDF with random data for 10th class"""
    import io
    import random
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_LEFT

    school = School.query.get(g.school_id)
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            topMargin=15 * mm, bottomMargin=15 * mm,
                            leftMargin=15 * mm, rightMargin=15 * mm)

    styles = getSampleStyleSheet()
    story = []

    # Styles
    title_style = ParagraphStyle('SchoolTitle', parent=styles['Title'],
        fontSize=20, spaceAfter=2, textColor=colors.HexColor('#1a237e'),
        fontName='Helvetica-Bold', alignment=TA_CENTER)
    subtitle_style = ParagraphStyle('SubTitle', parent=styles['Normal'],
        fontSize=10, spaceAfter=1, textColor=colors.HexColor('#424242'),
        alignment=TA_CENTER)
    heading_style = ParagraphStyle('SectionHead', parent=styles['Heading2'],
        fontSize=12, textColor=colors.HexColor('#1a237e'),
        fontName='Helvetica-Bold', spaceAfter=6, spaceBefore=10)
    normal_style = ParagraphStyle('NormalText', parent=styles['Normal'], fontSize=10, leading=14)
    center_style = ParagraphStyle('CenterText', parent=styles['Normal'], fontSize=10, alignment=TA_CENTER)
    bold_style = ParagraphStyle('BoldText', parent=styles['Normal'], fontSize=10, fontName='Helvetica-Bold')
    small_style = ParagraphStyle('SmallText', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#757575'))

    primary = colors.HexColor('#1a237e')
    accent = colors.HexColor('#3949ab')
    light_bg = colors.HexColor('#e8eaf6')
    border_color = colors.HexColor('#bdbdbd')

    # ===== School Header =====
    school_name = school.name.upper() if school else 'SIKARWAR PUBLIC SCHOOL'
    school_addr = ', '.join(filter(None, [
        school.address if school else 'Main Road',
        school.city if school else 'Gwalior',
        school.state if school else 'Madhya Pradesh',
    ])) or ''
    school_contact = ''
    if school:
        school_contact = ', '.join(filter(None, [
            f"Ph: {school.phone}" if school.phone else None,
            f"Email: {school.email}" if school.email else None,
        ]))

    story.append(Paragraph(school_name, title_style))
    story.append(Paragraph(school_addr, subtitle_style))
    if school_contact:
        story.append(Paragraph(school_contact, subtitle_style))
    story.append(Paragraph('(Affiliated to CBSE, New Delhi)', subtitle_style))
    story.append(Spacer(1, 3 * mm))
    story.append(HRFlowable(width="100%", thickness=2, color=primary))
    story.append(Spacer(1, 2 * mm))

    # Title Bar
    rc_title = ParagraphStyle('RCTitle', parent=styles['Title'],
        fontSize=14, textColor=colors.white, fontName='Helvetica-Bold',
        alignment=TA_CENTER, spaceBefore=0, spaceAfter=0)
    title_data = [[Paragraph("REPORT CARD - ANNUAL EXAMINATION (2025-26)", rc_title)]]
    title_table = Table(title_data, colWidths=[doc.width])
    title_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), primary),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(title_table)
    story.append(Spacer(1, 4 * mm))

    # ===== Random Student Data =====
    student_names = [
        ('Arjun', 'Sikarwar', 'M'), ('Priya', 'Sharma', 'F'), ('Rohit', 'Verma', 'M'),
        ('Ananya', 'Patel', 'F'), ('Vikram', 'Singh', 'M'), ('Sneha', 'Gupta', 'F'),
    ]
    sn = random.choice(student_names)
    adm_no = f"SPS/2023/{random.randint(100, 999)}"
    roll_no = str(random.randint(1, 45))

    info_data = [
        [Paragraph('<b>Student Name:</b>', normal_style),
         Paragraph(f"{sn[0]} {sn[1]}", normal_style),
         Paragraph('<b>Admission No:</b>', normal_style),
         Paragraph(adm_no, normal_style)],
        [Paragraph('<b>Class:</b>', normal_style),
         Paragraph('X - A', normal_style),
         Paragraph('<b>Roll No:</b>', normal_style),
         Paragraph(roll_no, normal_style)],
        [Paragraph("<b>Father's Name:</b>", normal_style),
         Paragraph(f"Mr. Rajendra {sn[1]}", normal_style),
         Paragraph('<b>Date of Birth:</b>', normal_style),
         Paragraph(f"{random.randint(1,28):02d}-{random.randint(1,12):02d}-2010", normal_style)],
        [Paragraph("<b>Mother's Name:</b>", normal_style),
         Paragraph(f"Mrs. Sunita {sn[1]}", normal_style),
         Paragraph('<b>Gender:</b>', normal_style),
         Paragraph('Male' if sn[2] == 'M' else 'Female', normal_style)],
    ]

    info_table = Table(info_data, colWidths=[doc.width * 0.18, doc.width * 0.32, doc.width * 0.18, doc.width * 0.32])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), light_bg),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 5 * mm))

    # ===== 10th Class Subjects =====
    story.append(Paragraph("SUBJECT-WISE MARKS", heading_style))

    subjects_10 = [
        'English', 'Hindi', 'Mathematics', 'Science', 'Social Science',
        'Sanskrit', 'Computer Science', 'Physical Education',
    ]

    def get_grade(pct):
        if pct >= 91: return 'A1'
        elif pct >= 81: return 'A2'
        elif pct >= 71: return 'B1'
        elif pct >= 61: return 'B2'
        elif pct >= 51: return 'C1'
        elif pct >= 41: return 'C2'
        elif pct >= 33: return 'D'
        else: return 'E'

    marks_header = [
        Paragraph('<b>S.No.</b>', center_style),
        Paragraph('<b>Subject</b>', bold_style),
        Paragraph('<b>Max Marks</b>', center_style),
        Paragraph('<b>Marks Obtained</b>', center_style),
        Paragraph('<b>Pass Marks</b>', center_style),
        Paragraph('<b>Grade</b>', center_style),
        Paragraph('<b>Status</b>', center_style),
    ]
    marks_data = [marks_header]

    total_obt = 0
    total_max = 0
    all_passed = True

    for i, subj in enumerate(subjects_10, 1):
        max_m = 100
        pass_m = 33
        obt = random.randint(38, 98)
        total_obt += obt
        total_max += max_m
        passed = obt >= pass_m
        if not passed:
            all_passed = False
        grade = get_grade(obt)

        if passed:
            status = Paragraph('<font color="#2e7d32"><b>PASS</b></font>', center_style)
        else:
            status = Paragraph('<font color="#c62828"><b>FAIL</b></font>', center_style)

        marks_data.append([
            Paragraph(str(i), center_style),
            Paragraph(subj, normal_style),
            Paragraph(str(max_m), center_style),
            Paragraph(str(obt), center_style),
            Paragraph(str(pass_m), center_style),
            Paragraph(grade, center_style),
            status,
        ])

    result_status = 'PASS' if all_passed else 'FAIL'

    marks_data.append([
        '', Paragraph('<b>TOTAL</b>', bold_style),
        Paragraph(f'<b>{total_max}</b>', center_style),
        Paragraph(f'<b>{total_obt}</b>', center_style),
        '', '',
        Paragraph(f"<b>{result_status}</b>", center_style),
    ])

    col_widths = [doc.width * 0.06, doc.width * 0.28, doc.width * 0.12, doc.width * 0.15,
                  doc.width * 0.12, doc.width * 0.12, doc.width * 0.15]
    marks_table = Table(marks_data, colWidths=col_widths)

    table_style = [
        ('BACKGROUND', (0, 0), (-1, 0), accent),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.7, border_color),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e8eaf6')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('LINEABOVE', (0, -1), (-1, -1), 1.5, primary),
    ]
    for i in range(1, len(marks_data) - 1):
        if i % 2 == 0:
            table_style.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor('#f5f5f5')))

    marks_table.setStyle(TableStyle(table_style))
    story.append(marks_table)
    story.append(Spacer(1, 5 * mm))

    # ===== Result Summary =====
    pct = round(total_obt / total_max * 100, 1)
    overall_grade = get_grade(pct)
    rank = random.randint(1, 8)

    summary_data = [
        [Paragraph('<b>Total Marks</b>', center_style),
         Paragraph('<b>Percentage</b>', center_style),
         Paragraph('<b>Grade</b>', center_style),
         Paragraph('<b>Rank in Class</b>', center_style),
         Paragraph('<b>Result</b>', center_style)],
        [Paragraph(f"{total_obt} / {total_max}", center_style),
         Paragraph(f"<b>{pct}%</b>", center_style),
         Paragraph(f"<b>{overall_grade}</b>", center_style),
         Paragraph(f"{rank} / 42", center_style),
         Paragraph(f"<b><font color='{'#2e7d32' if all_passed else '#c62828'}'>{result_status}</font></b>", center_style)],
    ]

    summary_table = Table(summary_data, colWidths=[doc.width / 5] * 5)
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.7, border_color),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#f0f4ff')),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 5 * mm))

    # ===== Remarks =====
    story.append(Paragraph("REMARKS", heading_style))
    attendance = round(random.uniform(85, 98), 1)
    remarks = [
        "Excellent performance! Keep up the good work.",
        "Good academic progress. Can improve in Mathematics.",
        "Shows great potential. Regular practice recommended.",
        "Very dedicated student. Consistent in all subjects.",
    ]
    remark_data = [
        [Paragraph('<b>Attendance:</b>', normal_style), Paragraph(f"{attendance}%", normal_style)],
        [Paragraph('<b>Teacher Remarks:</b>', normal_style), Paragraph(random.choice(remarks), normal_style)],
        [Paragraph('<b>Principal Remarks:</b>', normal_style), Paragraph("Promoted to Class XI", normal_style)],
    ]
    remark_table = Table(remark_data, colWidths=[doc.width * 0.25, doc.width * 0.75])
    remark_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fafafa')),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(remark_table)

    # ===== Grading Scale =====
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("GRADING SCALE", heading_style))
    grading_header = [
        Paragraph('<b>Grade</b>', center_style), Paragraph('<b>Marks Range</b>', center_style),
        Paragraph('<b>Grade</b>', center_style), Paragraph('<b>Marks Range</b>', center_style),
        Paragraph('<b>Grade</b>', center_style), Paragraph('<b>Marks Range</b>', center_style),
        Paragraph('<b>Grade</b>', center_style), Paragraph('<b>Marks Range</b>', center_style),
    ]
    grading_data = [grading_header, [
        Paragraph('A1', center_style), Paragraph('91-100', center_style),
        Paragraph('A2', center_style), Paragraph('81-90', center_style),
        Paragraph('B1', center_style), Paragraph('71-80', center_style),
        Paragraph('B2', center_style), Paragraph('61-70', center_style),
    ], [
        Paragraph('C1', center_style), Paragraph('51-60', center_style),
        Paragraph('C2', center_style), Paragraph('41-50', center_style),
        Paragraph('D', center_style), Paragraph('33-40', center_style),
        Paragraph('E', center_style), Paragraph('Below 33', center_style),
    ]]
    grading_table = Table(grading_data, colWidths=[doc.width / 8] * 8)
    grading_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e8eaf6')),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(grading_table)

    # ===== Signatures =====
    story.append(Spacer(1, 12 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=border_color))
    story.append(Spacer(1, 12 * mm))

    sig_data = [[
        Paragraph('_____________________', center_style),
        Paragraph('_____________________', center_style),
        Paragraph('_____________________', center_style),
    ], [
        Paragraph('Class Teacher', center_style),
        Paragraph('Principal', center_style),
        Paragraph("Parent's Signature", center_style),
    ]]
    sig_table = Table(sig_data, colWidths=[doc.width / 3] * 3)
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(sig_table)

    story.append(Spacer(1, 5 * mm))
    story.append(Paragraph(f"Generated on: {date.today().strftime('%d-%m-%Y')} | This is a computer-generated document.", small_style))

    doc.build(story)
    buffer.seek(0)

    return send_file(buffer, mimetype='application/pdf', as_attachment=True,
                     download_name=f'Sample_ReportCard_ClassX_{date.today().strftime("%Y%m%d")}.pdf')


# ============================================================
# EXAM INCIDENTS
# ============================================================

@academics_bp.route('/exam-incidents', methods=['GET'])
@school_required
def list_incidents():
    exam_id = request.args.get('exam_id', type=int)
    query = ExamIncident.query.filter_by(school_id=g.school_id)
    if exam_id:
        query = query.join(ExamSchedule).filter(ExamSchedule.exam_id == exam_id)
    incidents = query.order_by(ExamIncident.reported_at.desc()).all()
    return success_response([i.to_dict() for i in incidents])


@academics_bp.route('/exam-incidents', methods=['POST'])
@role_required('school_admin', 'teacher', 'exam_controller', 'academic_controller')
@validate({
    'exam_schedule_id': {'type': int, 'message': 'Exam schedule ID is required'},
    'type': {'required': True, 'message': 'Incident type is required'},
    'description': {'required': True, 'message': 'Description is required'},
})
def report_incident():
    data = g.get('validated_data') or request.get_json()
    incident = ExamIncident(
        school_id=g.school_id,
        exam_schedule_id=data['exam_schedule_id'],
        student_id=data.get('student_id'),
        hall_id=data.get('hall_id'),
        type=data['type'],
        description=data['description'],
        severity=data.get('severity', 'medium'),
        action_taken=data.get('action_taken'),
        reported_by=data.get('reported_by'),
    )
    db.session.add(incident)
    db.session.commit()
    return success_response(incident.to_dict(), 'Incident reported', 201)


@academics_bp.route('/exam-incidents/<int:incident_id>', methods=['PUT'])
@role_required('school_admin', 'exam_controller', 'academic_controller')
@validate({})
def update_incident(incident_id):
    incident = ExamIncident.query.filter_by(id=incident_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    for field in ['action_taken', 'severity', 'description']:
        if field in data:
            setattr(incident, field, data[field])
    db.session.commit()
    return success_response(incident.to_dict(), 'Updated')


# ============================================================
# EXAM DASHBOARD & ANALYTICS
# ============================================================

@academics_bp.route('/exam-dashboard', methods=['GET'])
@school_required
def exam_dashboard():
    """Overview dashboard for examination module"""
    scope = get_teacher_scope()

    if scope and scope.get('no_access'):
        return success_response({
            'stats': {
                'total_exams': 0, 'upcoming': 0, 'ongoing': 0, 'completed': 0,
                'results_published': 0, 'total_subjects': 0, 'total_halls': 0,
                'total_report_cards': 0, 'grading_systems': 0, 'exam_types': 0,
            },
            'recent_exams': [],
        })

    base_exam = Exam.query.filter_by(school_id=g.school_id)
    if scope and scope.get('class_ids'):
        scoped_ids = db.session.query(ExamSchedule.exam_id).filter(
            ExamSchedule.class_id.in_(scope['class_ids'])
        ).distinct().subquery()
        base_exam = base_exam.filter(Exam.id.in_(scoped_ids))
        recent_exams = base_exam.order_by(Exam.created_at.desc()).limit(5).all()
    else:
        recent_exams = Exam.query.filter_by(school_id=g.school_id).order_by(Exam.created_at.desc()).limit(5).all()

    total_exams = base_exam.count()
    upcoming = base_exam.filter(Exam.status == 'upcoming').count()
    ongoing = base_exam.filter(Exam.status == 'ongoing').count()
    completed = base_exam.filter(Exam.status == 'completed').count()
    results_published = base_exam.filter(Exam.status == 'results_published').count()

    total_subjects = Subject.query.filter_by(school_id=g.school_id, is_active=True).count()
    total_halls = ExamHall.query.filter_by(school_id=g.school_id, is_active=True).count()
    total_report_cards = ReportCard.query.filter_by(school_id=g.school_id).count()

    # Grading systems count
    grading_systems = GradingSystem.query.filter_by(school_id=g.school_id, is_active=True).count()
    exam_types = ExamType.query.filter_by(school_id=g.school_id, is_active=True).count()

    return success_response({
        'stats': {
            'total_exams': total_exams,
            'upcoming': upcoming,
            'ongoing': ongoing,
            'completed': completed,
            'results_published': results_published,
            'total_subjects': total_subjects,
            'total_halls': total_halls,
            'total_report_cards': total_report_cards,
            'grading_systems': grading_systems,
            'exam_types': exam_types,
        },
        'recent_exams': [e.to_dict() for e in recent_exams],
    })


# ============================================================
# SYLLABUS MANAGEMENT
# ============================================================

@academics_bp.route('/syllabus', methods=['GET'])
@school_required
def get_syllabus():
    """Get syllabus with filters"""
    class_id = request.args.get('class_id')
    subject_id = request.args.get('subject_id')
    academic_year_id = request.args.get('academic_year_id')
    term = request.args.get('term')

    query = Syllabus.query.filter_by(school_id=g.school_id)
    if class_id:
        query = query.filter_by(class_id=class_id)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if academic_year_id:
        query = query.filter_by(academic_year_id=academic_year_id)
    if term:
        query = query.filter_by(term=term)

    # Teacher scoping
    scope = get_teacher_scope()
    if scope:
        if scope.get('no_access'):
            return success_response([])
        if scope.get('class_ids'):
            query = query.filter(Syllabus.class_id.in_(scope['class_ids']))
        if scope.get('subject_ids'):
            query = query.filter(Syllabus.subject_id.in_(scope['subject_ids']))

    syllabus = query.order_by(Syllabus.class_id, Syllabus.subject_id, Syllabus.chapter_number).all()
    return success_response([s.to_dict() for s in syllabus])


@academics_bp.route('/syllabus', methods=['POST'])
@role_required('school_admin', 'academic_controller')
@validate({
    'class_id': {'type': int, 'message': 'Class ID is required'},
    'subject_id': {'type': int, 'message': 'Subject ID is required'},
    'chapter_number': {'type': int, 'message': 'Chapter number is required'},
    'chapter_name': {'required': True, 'message': 'Chapter name is required'},
})
def create_syllabus():
    """Create a syllabus chapter"""
    data = g.get('validated_data') or request.get_json()
    syllabus = Syllabus(
        school_id=g.school_id,
        class_id=data['class_id'],
        subject_id=data['subject_id'],
        academic_year_id=data.get('academic_year_id'),
        chapter_number=data['chapter_number'],
        chapter_name=data['chapter_name'],
        topics=data.get('topics'),
        learning_objectives=data.get('learning_objectives'),
        estimated_hours=data.get('estimated_hours'),
        term=data.get('term', 'term1'),
        display_order=data.get('display_order', 0),
        resources=data.get('resources'),
        created_by=g.current_user.id,
    )
    db.session.add(syllabus)
    db.session.commit()
    return success_response(syllabus.to_dict(), 201)


@academics_bp.route('/syllabus/<int:syllabus_id>', methods=['GET'])
@school_required
def get_syllabus_detail(syllabus_id):
    """Get syllabus chapter detail with progress logs"""
    syllabus = Syllabus.query.filter_by(id=syllabus_id, school_id=g.school_id).first()
    if not syllabus:
        return error_response('Syllabus not found', 404)

    result = syllabus.to_dict()
    result['progress_logs'] = [p.to_dict() for p in syllabus.progress_logs.order_by(SyllabusProgress.date.desc()).all()]
    return success_response(result)


@academics_bp.route('/syllabus/<int:syllabus_id>', methods=['PUT'])
@role_required('school_admin', 'academic_controller')
@validate({})
def update_syllabus(syllabus_id):
    """Update a syllabus chapter"""
    syllabus = Syllabus.query.filter_by(id=syllabus_id, school_id=g.school_id).first()
    if not syllabus:
        return error_response('Syllabus not found', 404)

    data = g.get('validated_data') or request.get_json()
    for field in ['chapter_number', 'chapter_name', 'topics', 'learning_objectives',
                  'estimated_hours', 'term', 'display_order', 'resources', 'status', 'completion_percentage']:
        if field in data:
            setattr(syllabus, field, data[field])
    db.session.commit()
    return success_response(syllabus.to_dict())


@academics_bp.route('/syllabus/<int:syllabus_id>', methods=['DELETE'])
@role_required('school_admin', 'academic_controller')
def delete_syllabus(syllabus_id):
    """Delete a syllabus chapter"""
    syllabus = Syllabus.query.filter_by(id=syllabus_id, school_id=g.school_id).first()
    if not syllabus:
        return error_response('Syllabus not found', 404)
    db.session.delete(syllabus)
    db.session.commit()
    return success_response({'message': 'Syllabus deleted'})


@academics_bp.route('/syllabus/<int:syllabus_id>/progress', methods=['POST'])
@role_required('school_admin', 'academic_controller')
@validate({
    'date': {'required': True, 'message': 'Date is required'},
    'topics_covered': {'required': True, 'message': 'Topics covered is required'},
})
def add_syllabus_progress(syllabus_id):
    """Log daily syllabus progress"""
    syllabus = Syllabus.query.filter_by(id=syllabus_id, school_id=g.school_id).first()
    if not syllabus:
        return error_response('Syllabus not found', 404)

    data = g.get('validated_data') or request.get_json()
    progress = SyllabusProgress(
        school_id=g.school_id,
        syllabus_id=syllabus_id,
        teacher_id=data.get('teacher_id'),
        date=data['date'],
        topics_covered=data['topics_covered'],
        hours_spent=data.get('hours_spent'),
        percentage_covered=data.get('percentage_covered'),
        teaching_method=data.get('teaching_method', 'lecture'),
        remarks=data.get('remarks'),
    )
    db.session.add(progress)

    # Update syllabus completion
    if data.get('percentage_covered'):
        total = db.session.query(func.sum(SyllabusProgress.percentage_covered)).filter_by(syllabus_id=syllabus_id).scalar() or 0
        syllabus.completion_percentage = min(total, 100)
        if syllabus.completion_percentage >= 100:
            syllabus.status = 'completed'
        elif syllabus.completion_percentage > 0:
            syllabus.status = 'in_progress'

    db.session.commit()
    return success_response(progress.to_dict(), 201)


@academics_bp.route('/syllabus-overview', methods=['GET'])
@school_required
def syllabus_overview():
    """Syllabus completion overview by class/subject"""
    class_id = request.args.get('class_id')
    academic_year_id = request.args.get('academic_year_id')

    query = Syllabus.query.filter_by(school_id=g.school_id)
    if class_id:
        query = query.filter_by(class_id=class_id)
    if academic_year_id:
        query = query.filter_by(academic_year_id=academic_year_id)

    syllabus_list = query.all()

    # Group by subject
    subject_stats = {}
    for s in syllabus_list:
        key = s.subject_id
        if key not in subject_stats:
            subject_stats[key] = {
                'subject_id': s.subject_id,
                'subject_name': s.subject.name if s.subject else None,
                'total_chapters': 0,
                'completed': 0,
                'in_progress': 0,
                'not_started': 0,
                'avg_completion': 0,
            }
        subject_stats[key]['total_chapters'] += 1
        subject_stats[key][s.status] += 1
        subject_stats[key]['avg_completion'] += float(s.completion_percentage or 0)

    for key in subject_stats:
        total = subject_stats[key]['total_chapters']
        if total > 0:
            subject_stats[key]['avg_completion'] = round(subject_stats[key]['avg_completion'] / total, 1)

    return success_response({
        'total_chapters': len(syllabus_list),
        'completed': sum(1 for s in syllabus_list if s.status == 'completed'),
        'in_progress': sum(1 for s in syllabus_list if s.status == 'in_progress'),
        'not_started': sum(1 for s in syllabus_list if s.status == 'not_started'),
        'by_subject': list(subject_stats.values()),
    })


# ============================================================
# LESSON PLAN MANAGEMENT
# ============================================================

@academics_bp.route('/lesson-plans', methods=['GET'])
@school_required
def get_lesson_plans():
    """Get lesson plans with filters"""
    teacher_id = request.args.get('teacher_id')
    class_id = request.args.get('class_id')
    subject_id = request.args.get('subject_id')
    status = request.args.get('status')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')

    query = LessonPlan.query.filter_by(school_id=g.school_id)
    if teacher_id:
        query = query.filter_by(teacher_id=teacher_id)
    if class_id:
        query = query.filter_by(class_id=class_id)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if status:
        query = query.filter_by(status=status)
    if date_from:
        query = query.filter(LessonPlan.date >= date_from)
    if date_to:
        query = query.filter(LessonPlan.date <= date_to)

    scope = get_teacher_scope()
    if scope:
        if scope.get('no_access'):
            return success_response([])
        query = query.filter(LessonPlan.class_id.in_(scope.get('class_ids', [])))

    plans = query.order_by(LessonPlan.date.desc()).all()
    return success_response([p.to_dict() for p in plans])


@academics_bp.route('/lesson-plans', methods=['POST'])
@school_required
@validate({
    'class_id': {'type': int, 'message': 'Class ID is required'},
    'subject_id': {'type': int, 'message': 'Subject ID is required'},
    'title': {'required': True, 'message': 'Title is required'},
    'date': {'required': True, 'message': 'Date is required'},
    'topic': {'required': True, 'message': 'Topic is required'},
})
def create_lesson_plan():
    """Create a lesson plan"""
    data = g.get('validated_data') or request.get_json()
    scope = get_teacher_scope()
    if scope:
        if scope.get('no_access'):
            return error_response('Access denied', 403)
        if data.get('class_id') not in scope.get('class_ids', []) or data.get('subject_id') not in scope.get('subject_ids', []):
            return error_response('Access denied', 403)
    plan = LessonPlan(
        school_id=g.school_id,
        teacher_id=data.get('teacher_id'),
        class_id=data['class_id'],
        section_id=data.get('section_id'),
        subject_id=data['subject_id'],
        academic_year_id=data.get('academic_year_id'),
        title=data['title'],
        date=data['date'],
        period_number=data.get('period_number'),
        duration_minutes=data.get('duration_minutes', 40),
        topic=data['topic'],
        subtopics=data.get('subtopics'),
        objectives=data.get('objectives'),
        teaching_methodology=data.get('teaching_methodology'),
        teaching_aids=data.get('teaching_aids'),
        board_work=data.get('board_work'),
        student_activities=data.get('student_activities'),
        assessment_plan=data.get('assessment_plan'),
        homework_given=data.get('homework_given'),
        previous_knowledge=data.get('previous_knowledge'),
        learning_outcomes=data.get('learning_outcomes'),
        differentiation=data.get('differentiation'),
        status=data.get('status', 'draft'),
    )
    db.session.add(plan)
    db.session.commit()
    return success_response(plan.to_dict(), 201)


@academics_bp.route('/lesson-plans/<int:plan_id>', methods=['GET'])
@school_required
def get_lesson_plan_detail(plan_id):
    """Get lesson plan detail"""
    plan = LessonPlan.query.filter_by(id=plan_id, school_id=g.school_id).first()
    if not plan:
        return error_response('Lesson plan not found', 404)
    return success_response(plan.to_dict())


@academics_bp.route('/lesson-plans/<int:plan_id>', methods=['PUT'])
@school_required
@validate({})
def update_lesson_plan(plan_id):
    """Update lesson plan"""
    plan = LessonPlan.query.filter_by(id=plan_id, school_id=g.school_id).first()
    if not plan:
        return error_response('Lesson plan not found', 404)

    data = g.get('validated_data') or request.get_json()
    for field in ['title', 'date', 'period_number', 'duration_minutes', 'topic', 'subtopics',
                  'objectives', 'teaching_methodology', 'teaching_aids', 'board_work',
                  'student_activities', 'assessment_plan', 'homework_given', 'previous_knowledge',
                  'learning_outcomes', 'differentiation', 'reflection', 'status']:
        if field in data:
            setattr(plan, field, data[field])
    db.session.commit()
    return success_response(plan.to_dict())


@academics_bp.route('/lesson-plans/<int:plan_id>/approve', methods=['POST'])
@role_required('school_admin', 'academic_controller')
@validate({
    'action': {'required': True, 'message': 'Action is required'},
})
def approve_lesson_plan(plan_id):
    """Approve or reject a lesson plan"""
    plan = LessonPlan.query.filter_by(id=plan_id, school_id=g.school_id).first()
    if not plan:
        return error_response('Lesson plan not found', 404)

    data = g.get('validated_data') or request.get_json()
    action = data.get('action')  # approve / reject / revision_needed
    if action == 'approve':
        plan.status = 'approved'
        plan.approved_by = g.current_user.id
        plan.approved_at = datetime.utcnow()
    elif action == 'reject':
        plan.status = 'rejected'
        plan.rejection_reason = data.get('reason', '')
    elif action == 'revision_needed':
        plan.status = 'revision_needed'
        plan.rejection_reason = data.get('reason', '')
    else:
        return error_response('Invalid action', 400)

    db.session.commit()
    return success_response(plan.to_dict())


# ============================================================
# HOMEWORK MANAGEMENT
# ============================================================

@academics_bp.route('/homework', methods=['GET'])
@school_required
def get_homework():
    """Get homework assignments"""
    class_id = request.args.get('class_id')
    subject_id = request.args.get('subject_id')
    teacher_id = request.args.get('teacher_id')
    status = request.args.get('status')
    homework_type = request.args.get('homework_type')

    query = Homework.query.filter_by(school_id=g.school_id)
    if class_id:
        query = query.filter_by(class_id=class_id)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if teacher_id:
        query = query.filter_by(teacher_id=teacher_id)
    if status:
        query = query.filter_by(status=status)
    if homework_type:
        query = query.filter_by(homework_type=homework_type)

    scope = get_teacher_scope()
    if scope:
        if scope.get('no_access'):
            return success_response([])
        query = query.filter(Homework.class_id.in_(scope.get('class_ids', [])))

    homework_list = query.order_by(Homework.due_date.desc()).all()
    return success_response([h.to_dict() for h in homework_list])


@academics_bp.route('/homework', methods=['POST'])
@school_required
@validate({
    'class_id': {'type': int, 'message': 'Class ID is required'},
    'subject_id': {'type': int, 'message': 'Subject ID is required'},
    'title': {'required': True, 'message': 'Title is required'},
    'due_date': {'required': True, 'message': 'Due date is required'},
})
def create_homework():
    """Create homework assignment"""
    data = g.get('validated_data') or request.get_json()
    scope = get_teacher_scope()
    if scope:
        if scope.get('no_access'):
            return error_response('Access denied', 403)
        if data.get('class_id') not in scope.get('class_ids', []):
            return error_response('Access denied', 403)
    hw = Homework(
        school_id=g.school_id,
        teacher_id=data.get('teacher_id'),
        class_id=data['class_id'],
        section_id=data.get('section_id'),
        subject_id=data['subject_id'],
        title=data['title'],
        description=data.get('description'),
        instructions=data.get('instructions'),
        homework_type=data.get('homework_type', 'assignment'),
        assigned_date=data.get('assigned_date', date.today().isoformat()),
        due_date=data['due_date'],
        max_marks=data.get('max_marks'),
        attachment_url=data.get('attachment_url'),
        allow_late_submission=data.get('allow_late_submission', False),
        late_penalty_percent=data.get('late_penalty_percent', 0),
        is_graded=data.get('is_graded', True),
        status=data.get('status', 'published'),
    )
    db.session.add(hw)
    db.session.commit()
    return success_response(hw.to_dict(), 201)


@academics_bp.route('/homework/<int:hw_id>', methods=['GET'])
@school_required
def get_homework_detail(hw_id):
    """Get homework with submissions"""
    hw = Homework.query.filter_by(id=hw_id, school_id=g.school_id).first()
    if not hw:
        return error_response('Homework not found', 404)

    result = hw.to_dict()
    result['submissions'] = [s.to_dict() for s in hw.submissions.all()]
    return success_response(result)


@academics_bp.route('/homework/<int:hw_id>', methods=['PUT'])
@school_required
@validate({})
def update_homework(hw_id):
    """Update homework"""
    hw = Homework.query.filter_by(id=hw_id, school_id=g.school_id).first()
    if not hw:
        return error_response('Homework not found', 404)

    data = g.get('validated_data') or request.get_json()
    for field in ['title', 'description', 'instructions', 'homework_type', 'due_date',
                  'max_marks', 'attachment_url', 'allow_late_submission', 'late_penalty_percent',
                  'is_graded', 'status']:
        if field in data:
            setattr(hw, field, data[field])
    db.session.commit()
    return success_response(hw.to_dict())


@academics_bp.route('/homework/<int:hw_id>/submit', methods=['POST'])
@school_required
@validate({
    'student_id': {'type': int, 'message': 'Student ID is required'},
})
def submit_homework(hw_id):
    """Submit homework (by student)"""
    hw = Homework.query.filter_by(id=hw_id, school_id=g.school_id).first()
    if not hw:
        return error_response('Homework not found', 404)

    data = g.get('validated_data') or request.get_json()
    is_late = False
    if hw.due_date and date.today() > hw.due_date:
        if not hw.allow_late_submission:
            return error_response('Late submission not allowed', 400)
        is_late = True

    submission = HomeworkSubmission(
        school_id=g.school_id,
        homework_id=hw_id,
        student_id=data['student_id'],
        submission_text=data.get('submission_text'),
        attachment_url=data.get('attachment_url'),
        is_late=is_late,
    )
    db.session.add(submission)
    db.session.commit()
    return success_response(submission.to_dict(), 201)


@academics_bp.route('/homework/<int:hw_id>/grade', methods=['POST'])
@school_required
@validate({
    'submission_id': {'type': int, 'message': 'Submission ID is required'},
})
def grade_homework(hw_id):
    """Grade a homework submission"""
    data = g.get('validated_data') or request.get_json()
    submission = HomeworkSubmission.query.filter_by(
        id=data['submission_id'], homework_id=hw_id, school_id=g.school_id
    ).first()
    if not submission:
        return error_response('Submission not found', 404)

    submission.marks_obtained = data.get('marks_obtained')
    submission.grade = data.get('grade')
    submission.teacher_remarks = data.get('teacher_remarks')
    submission.graded_by = g.current_user.id
    submission.graded_at = datetime.utcnow()
    submission.status = 'graded'

    db.session.commit()
    return success_response(submission.to_dict())


# ============================================================
# STUDY MATERIALS
# ============================================================

@academics_bp.route('/study-materials', methods=['GET'])
@school_required
def get_study_materials():
    """Get study materials with filters"""
    class_id = request.args.get('class_id')
    subject_id = request.args.get('subject_id')
    material_type = request.args.get('material_type')

    query = StudyMaterial.query.filter_by(school_id=g.school_id, is_active=True)
    if class_id:
        query = query.filter_by(class_id=class_id)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if material_type:
        query = query.filter_by(material_type=material_type)

    scope = get_teacher_scope()
    if scope:
        if scope.get('no_access'):
            return success_response([])
        query = query.filter(StudyMaterial.class_id.in_(scope.get('class_ids', [])))

    materials = query.order_by(StudyMaterial.created_at.desc()).all()
    return success_response([m.to_dict() for m in materials])


@academics_bp.route('/study-materials', methods=['POST'])
@school_required
@validate({
    'class_id': {'type': int, 'message': 'Class ID is required'},
    'subject_id': {'type': int, 'message': 'Subject ID is required'},
    'title': {'required': True, 'message': 'Title is required'},
})
def create_study_material():
    """Upload/create study material"""
    data = g.get('validated_data') or request.get_json()
    scope = get_teacher_scope()
    if scope:
        if scope.get('no_access'):
            return error_response('Access denied', 403)
        if data.get('class_id') not in scope.get('class_ids', []):
            return error_response('Access denied', 403)
    material = StudyMaterial(
        school_id=g.school_id,
        class_id=data['class_id'],
        subject_id=data['subject_id'],
        chapter_id=data.get('chapter_id'),
        uploaded_by=data.get('uploaded_by'),
        title=data['title'],
        description=data.get('description'),
        material_type=data.get('material_type', 'pdf'),
        file_url=data.get('file_url'),
        external_link=data.get('external_link'),
        file_size=data.get('file_size'),
        tags=data.get('tags'),
        is_downloadable=data.get('is_downloadable', True),
    )
    db.session.add(material)
    db.session.commit()
    return success_response(material.to_dict(), 201)


@academics_bp.route('/study-materials/<int:material_id>', methods=['GET'])
@school_required
def get_study_material_detail(material_id):
    """Get study material detail and increment view count"""
    material = StudyMaterial.query.filter_by(id=material_id, school_id=g.school_id).first()
    if not material:
        return error_response('Study material not found', 404)
    material.view_count += 1
    db.session.commit()
    return success_response(material.to_dict())


@academics_bp.route('/study-materials/<int:material_id>', methods=['PUT'])
@school_required
@validate({})
def update_study_material(material_id):
    """Update study material"""
    material = StudyMaterial.query.filter_by(id=material_id, school_id=g.school_id).first()
    if not material:
        return error_response('Study material not found', 404)

    data = g.get('validated_data') or request.get_json()
    for field in ['title', 'description', 'material_type', 'file_url', 'external_link',
                  'tags', 'is_downloadable', 'is_active']:
        if field in data:
            setattr(material, field, data[field])
    db.session.commit()
    return success_response(material.to_dict())


@academics_bp.route('/study-materials/<int:material_id>', methods=['DELETE'])
@school_required
def delete_study_material(material_id):
    """Soft-delete study material"""
    material = StudyMaterial.query.filter_by(id=material_id, school_id=g.school_id).first()
    if not material:
        return error_response('Study material not found', 404)
    material.is_active = False
    db.session.commit()
    return success_response({'message': 'Study material deleted'})


# ============================================================
# ACADEMIC CALENDAR
# ============================================================

@academics_bp.route('/calendar', methods=['GET'])
@school_required
def get_calendar():
    """Get academic calendar events - supports class_id filter"""
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    event_type = request.args.get('event_type')
    class_id = request.args.get('class_id', type=int)

    query = AcademicCalendar.query.filter_by(school_id=g.school_id)
    if event_type:
        query = query.filter_by(event_type=event_type)
    if class_id:
        # Show events for this class + events that apply to 'all'
        query = query.filter(
            or_(
                AcademicCalendar.class_id == class_id,
                AcademicCalendar.applies_to == 'all',
                AcademicCalendar.applies_to == 'students'
            )
        )
    if month and year:
        query = query.filter(
            db.extract('month', AcademicCalendar.start_date) == month,
            db.extract('year', AcademicCalendar.start_date) == year
        )
    elif year:
        query = query.filter(db.extract('year', AcademicCalendar.start_date) == year)

    events = query.order_by(AcademicCalendar.start_date).all()
    return success_response([e.to_dict() for e in events])


@academics_bp.route('/calendar', methods=['POST'])
@role_required('school_admin', 'academic_controller')
@validate({
    'title': {'required': True, 'message': 'Event title is required'},
    'event_type': {'required': True, 'message': 'Event type is required'},
    'start_date': {'required': True, 'message': 'Start date is required'},
})
def create_calendar_event():
    """Create calendar event"""
    data = g.get('validated_data') or request.get_json()
    event = AcademicCalendar(
        school_id=g.school_id,
        academic_year_id=data.get('academic_year_id'),
        title=data['title'],
        description=data.get('description'),
        event_type=data['event_type'],
        start_date=data['start_date'],
        end_date=data.get('end_date'),
        start_time=data.get('start_time'),
        end_time=data.get('end_time'),
        is_holiday=data.get('is_holiday', False),
        applies_to=data.get('applies_to', 'all'),
        class_id=data.get('class_id'),
        color=data.get('color', '#1976d2'),
        is_recurring=data.get('is_recurring', False),
        recurrence_pattern=data.get('recurrence_pattern'),
        notify_parents=data.get('notify_parents', False),
        created_by=g.current_user.id,
    )
    db.session.add(event)
    db.session.commit()
    return success_response(event.to_dict(), 201)


@academics_bp.route('/calendar/<int:event_id>', methods=['PUT'])
@role_required('school_admin', 'academic_controller')
@validate({})
def update_calendar_event(event_id):
    """Update calendar event"""
    event = AcademicCalendar.query.filter_by(id=event_id, school_id=g.school_id).first()
    if not event:
        return error_response('Event not found', 404)

    data = g.get('validated_data') or request.get_json()
    for field in ['title', 'description', 'event_type', 'start_date', 'end_date',
                  'start_time', 'end_time', 'is_holiday', 'applies_to', 'class_id',
                  'color', 'is_recurring', 'recurrence_pattern', 'notify_parents']:
        if field in data:
            setattr(event, field, data[field])
    db.session.commit()
    return success_response(event.to_dict())


@academics_bp.route('/calendar/<int:event_id>', methods=['DELETE'])
@role_required('school_admin', 'academic_controller')
def delete_calendar_event(event_id):
    """Delete calendar event"""
    event = AcademicCalendar.query.filter_by(id=event_id, school_id=g.school_id).first()
    if not event:
        return error_response('Event not found', 404)
    db.session.delete(event)
    db.session.commit()
    return success_response({'message': 'Event deleted'})


# ============================================================
# TEACHER SUBJECT ALLOCATION
# ============================================================

@academics_bp.route('/teacher-subjects', methods=['GET'])
@school_required
def get_teacher_subjects():
    """Get teacher-subject allocations"""
    teacher_id = request.args.get('teacher_id')
    class_id = request.args.get('class_id')
    subject_id = request.args.get('subject_id')

    query = TeacherSubject.query.filter_by(school_id=g.school_id, status='active')
    if teacher_id:
        query = query.filter_by(teacher_id=teacher_id)
    if class_id:
        query = query.filter_by(class_id=class_id)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)

    scope = get_teacher_scope()
    if scope:
        if scope.get('no_access'):
            return success_response([])
        query = query.filter(TeacherSubject.teacher_id == scope['staff_id'])

    allocations = query.all()
    return success_response([a.to_dict() for a in allocations])


@academics_bp.route('/teacher-subjects', methods=['POST'])
@role_required('school_admin', 'academic_controller')
@validate({
    'subject_id': {'type': int, 'message': 'Subject ID is required'},
    'class_id': {'type': int, 'message': 'Class ID is required'},
})
def create_teacher_subject():
    """Allocate subject to teacher. Supports many-to-many:
    a teacher can be assigned to multiple class-sections, and a class can
    have multiple teachers. Skips creation if the same allocation exists."""
    data = g.get('validated_data') or request.get_json()

    # Prevent exact duplicate (same teacher+subject+class+section active)
    existing = TeacherSubject.query.filter_by(
        school_id=g.school_id,
        teacher_id=data.get('teacher_id'),
        subject_id=data['subject_id'],
        class_id=data['class_id'],
        section_id=data.get('section_id'),
        status='active',
    ).first()
    if existing:
        return error_response('This teacher is already assigned to this subject for this class-section', 400)

    alloc = TeacherSubject(
        school_id=g.school_id,
        teacher_id=data.get('teacher_id'),
        subject_id=data['subject_id'],
        class_id=data['class_id'],
        section_id=data.get('section_id'),
        academic_year_id=data.get('academic_year_id'),
        periods_per_week=data.get('periods_per_week', 0),
        is_class_teacher=data.get('is_class_teacher', False),
        assigned_date=data.get('assigned_date'),
    )
    db.session.add(alloc)
    db.session.commit()
    return success_response(alloc.to_dict(), 201)


@academics_bp.route('/teacher-subjects/<int:alloc_id>', methods=['PUT'])
@role_required('school_admin', 'academic_controller')
@validate({})
def update_teacher_subject(alloc_id):
    """Update teacher subject allocation"""
    alloc = TeacherSubject.query.filter_by(id=alloc_id, school_id=g.school_id).first()
    if not alloc:
        return error_response('Allocation not found', 404)

    data = g.get('validated_data') or request.get_json()
    for field in ['periods_per_week', 'is_class_teacher', 'status']:
        if field in data:
            setattr(alloc, field, data[field])
    db.session.commit()
    return success_response(alloc.to_dict())


@academics_bp.route('/teacher-subjects/<int:alloc_id>', methods=['DELETE'])
@role_required('school_admin', 'academic_controller')
def delete_teacher_subject(alloc_id):
    """Remove teacher subject allocation"""
    alloc = TeacherSubject.query.filter_by(id=alloc_id, school_id=g.school_id).first()
    if not alloc:
        return error_response('Allocation not found', 404)
    alloc.status = 'inactive'
    db.session.commit()
    return success_response({'message': 'Allocation removed'})


# ============================================================
# CLASS TEACHER MANAGEMENT
# ============================================================

CLASS_TEACHER_RESPONSIBILITIES = [
    {'key': 'attendance', 'label': 'Daily Attendance Monitoring', 'description': 'Mark and monitor daily attendance of students'},
    {'key': 'parent_communication', 'label': 'Parent Communication', 'description': 'Regular communication with parents regarding student progress'},
    {'key': 'discipline', 'label': 'Student Discipline', 'description': 'Maintain discipline and resolve behavioral issues'},
    {'key': 'report_cards', 'label': 'Report Card Management', 'description': 'Prepare and review report cards, add remarks'},
    {'key': 'ptm', 'label': 'Parent-Teacher Meetings', 'description': 'Organize and conduct PTM sessions'},
    {'key': 'student_welfare', 'label': 'Student Welfare', 'description': 'Monitor student well-being, health, and personal issues'},
    {'key': 'class_management', 'label': 'Class Room Management', 'description': 'Manage seating, cleanliness, and class environment'},
    {'key': 'academic_progress', 'label': 'Academic Progress Tracking', 'description': 'Track and analyze academic performance of students'},
    {'key': 'event_coordination', 'label': 'Event & Activity Coordination', 'description': 'Coordinate class participation in school events'},
    {'key': 'records', 'label': 'Student Records', 'description': 'Maintain updated student records and files'},
    {'key': 'counseling', 'label': 'Basic Counseling', 'description': 'Provide guidance and basic counseling to students'},
    {'key': 'fee_followup', 'label': 'Fee Follow-up', 'description': 'Follow up on pending fee payments with parents'},
]

CO_CLASS_TEACHER_RESPONSIBILITIES = [
    {'key': 'assist_attendance', 'label': 'Assist in Attendance', 'description': 'Help with attendance in absence of class teacher'},
    {'key': 'assist_discipline', 'label': 'Assist in Discipline', 'description': 'Support class teacher in managing discipline'},
    {'key': 'substitute', 'label': 'Substitute for Class Teacher', 'description': 'Handle class responsibilities when class teacher is absent'},
    {'key': 'co_ptm', 'label': 'Assist in PTM', 'description': 'Help organize and manage PTM sessions'},
    {'key': 'activity_support', 'label': 'Co-curricular Activities', 'description': 'Manage co-curricular and extracurricular participation'},
    {'key': 'records_support', 'label': 'Assist in Record Keeping', 'description': 'Help maintain student records and documentation'},
]


@academics_bp.route('/class-teachers', methods=['GET'])
@school_required
def get_class_teachers():
    """Get all class-teacher assignments across sections"""
    class_id = request.args.get('class_id', type=int)

    query = Section.query.filter_by(school_id=g.school_id)
    if class_id:
        query = query.filter_by(class_id=class_id)

    sections = query.all()

    # Batch fetch all related classes and staff to avoid N+1
    class_ids = list(set(sec.class_id for sec in sections))
    staff_ids = list(set(
        [sec.class_teacher_id for sec in sections if sec.class_teacher_id] +
        [sec.co_class_teacher_id for sec in sections if sec.co_class_teacher_id]
    ))
    classes_map = {c.id: c for c in Class.query.filter(Class.id.in_(class_ids)).all()} if class_ids else {}
    staff_map = {s.id: s for s in Staff.query.filter(Staff.id.in_(staff_ids)).all()} if staff_ids else {}

    # Batch fetch student counts per section
    section_ids = [sec.id for sec in sections]
    student_counts = {}
    if section_ids:
        counts = db.session.query(
            Student.current_section_id,
            func.count(Student.id)
        ).filter(
            Student.school_id == g.school_id,
            Student.status == 'active',
            Student.current_section_id.in_(section_ids)
        ).group_by(Student.current_section_id).all()
        student_counts = dict(counts)

    result = []
    for sec in sections:
        cls = classes_map.get(sec.class_id)
        ct = staff_map.get(sec.class_teacher_id)
        cct = staff_map.get(sec.co_class_teacher_id)
        result.append({
            'section_id': sec.id,
            'section_name': sec.name,
            'class_id': sec.class_id,
            'class_name': cls.name if cls else None,
            'capacity': sec.capacity,
            'class_teacher_id': sec.class_teacher_id,
            'class_teacher': ct.to_dict() if ct else None,
            'co_class_teacher_id': sec.co_class_teacher_id,
            'co_class_teacher': cct.to_dict() if cct else None,
            'student_count': student_counts.get(sec.id, 0),
        })
    return success_response(result)


@academics_bp.route('/class-teachers/assign', methods=['POST'])
@role_required('school_admin', 'academic_controller')
@validate({
    'section_id': {'type': int, 'message': 'Section ID is required'},
})
def assign_class_teacher():
    """Assign class teacher and/or co-class teacher to a section"""
    data = g.get('validated_data') or request.get_json()
    section_id = data.get('section_id')
    if not section_id:
        return error_response('section_id is required')

    section = Section.query.filter_by(id=section_id, school_id=g.school_id).first()
    if not section:
        return error_response('Section not found', 404)

    class_teacher_id = data.get('class_teacher_id')
    co_class_teacher_id = data.get('co_class_teacher_id')

    # Validate: same teacher can't be both CT and Co-CT
    ct = class_teacher_id if class_teacher_id is not None else section.class_teacher_id
    cct = co_class_teacher_id if co_class_teacher_id is not None else section.co_class_teacher_id
    if ct and cct and ct == cct:
        return error_response('Class Teacher and Co-Class Teacher cannot be the same person')

    # Validate staff belongs to same school
    if class_teacher_id:
        teacher = Staff.query.filter_by(id=class_teacher_id, school_id=g.school_id, status='active').first()
        if not teacher:
            return error_response('Class teacher not found or inactive')
        # Enforce: one teacher can be class teacher of only ONE section
        conflict = Section.query.filter(
            Section.school_id == g.school_id,
            Section.class_teacher_id == class_teacher_id,
            Section.id != section_id
        ).first()
        if conflict:
            conflict_cls = Class.query.get(conflict.class_id)
            cname = f"{conflict_cls.name if conflict_cls else ''} - {conflict.name}".strip(' -')
            return error_response(
                f'This teacher is already the class teacher of {cname}. '
                f'A teacher can be class teacher of only one section.'
            )
        section.class_teacher_id = class_teacher_id

    if co_class_teacher_id:
        co_teacher = Staff.query.filter_by(id=co_class_teacher_id, school_id=g.school_id, status='active').first()
        if not co_teacher:
            return error_response('Co-class teacher not found or inactive')
        section.co_class_teacher_id = co_class_teacher_id

    # Allow clearing (set to null)
    if 'class_teacher_id' in data and data['class_teacher_id'] is None:
        section.class_teacher_id = None
    if 'co_class_teacher_id' in data and data['co_class_teacher_id'] is None:
        section.co_class_teacher_id = None

    db.session.commit()
    return success_response(section.to_dict_full(), 'Class teacher assigned successfully')


@academics_bp.route('/class-teachers/responsibilities', methods=['GET'])
@school_required
def get_responsibilities():
    """Get list of responsibilities for class teacher and co-class teacher"""
    return success_response({
        'class_teacher': CLASS_TEACHER_RESPONSIBILITIES,
        'co_class_teacher': CO_CLASS_TEACHER_RESPONSIBILITIES
    })


@academics_bp.route('/class-teachers/my-class', methods=['GET'])
@school_required
def get_my_class():
    """Get the class assigned to current logged-in teacher"""
    from app.models.user import User
    user = User.query.get(g.user_id)
    if not user:
        return error_response('User not found', 404)

    staff = Staff.query.filter_by(school_id=g.school_id, user_id=g.user_id).first()
    if not staff:
        return error_response('Staff record not found', 404)

    # Find sections where this staff is class teacher or co-class teacher
    as_ct = Section.query.filter_by(school_id=g.school_id, class_teacher_id=staff.id).all()
    as_cct = Section.query.filter_by(school_id=g.school_id, co_class_teacher_id=staff.id).all()

    result = []
    for sec in as_ct:
        cls = Class.query.get(sec.class_id)
        result.append({
            'section_id': sec.id,
            'section_name': sec.name,
            'class_name': cls.name if cls else None,
            'role': 'Class Teacher',
            'student_count': Student.query.filter_by(school_id=g.school_id, current_class_id=sec.class_id, current_section_id=sec.id, status='active').count(),
            'responsibilities': CLASS_TEACHER_RESPONSIBILITIES
        })
    for sec in as_cct:
        cls = Class.query.get(sec.class_id)
        result.append({
            'section_id': sec.id,
            'section_name': sec.name,
            'class_name': cls.name if cls else None,
            'role': 'Co-Class Teacher',
            'student_count': Student.query.filter_by(school_id=g.school_id, current_class_id=sec.class_id, current_section_id=sec.id, status='active').count(),
            'responsibilities': CO_CLASS_TEACHER_RESPONSIBILITIES
        })

    return success_response(result)


# ============================================================
# CLASS TEACHER — STUDENT SUBJECT ENROLLMENT (scoped to own section)
# A class teacher decides which subjects EACH STUDENT in their section
# will study this academic year. Teacher-to-subject assignment is handled
# separately by the subject teacher / academic controller.
# ============================================================

def _resolve_class_teacher_section():
    """Return (staff, section) for the logged-in class teacher, or (staff, None)."""
    staff = Staff.query.filter_by(school_id=g.school_id, user_id=g.user_id).first()
    if not staff:
        return None, None
    section = Section.query.filter_by(school_id=g.school_id, class_teacher_id=staff.id).first()
    return staff, section


@academics_bp.route('/class-teacher/roster', methods=['GET'])
@school_required
@role_required('teacher')
def class_teacher_roster():
    """Return the class teacher's section, its students, and available subjects,
    plus each student's current subject enrollments for the academic year."""
    staff, section = _resolve_class_teacher_section()
    if not staff:
        return error_response('Staff record not found', 404)
    if not section:
        return error_response('You are not assigned as a class teacher of any section', 403)

    cls = Class.query.get(section.class_id)

    # Current academic year
    ay = AcademicYear.query.filter_by(school_id=g.school_id, is_current=True).first()
    ay_id = ay.id if ay else None

    students = Student.query.filter_by(
        school_id=g.school_id,
        current_class_id=section.class_id,
        current_section_id=section.id,
        status='active'
    ).order_by(Student.roll_no, Student.first_name).all()

    subjects = Subject.query.filter_by(school_id=g.school_id, is_active=True).all()

    # Build enrollment map: student_id -> [subject_id,...]
    enr_query = StudentSubjectEnrollment.query.filter_by(
        school_id=g.school_id, section_id=section.id
    )
    if ay_id:
        enr_query = enr_query.filter_by(academic_year_id=ay_id)
    enrollments = enr_query.all()

    enr_map = {}
    enr_id_map = {}
    for e in enrollments:
        enr_map.setdefault(e.student_id, []).append(e.subject_id)
        enr_id_map[f"{e.student_id}_{e.subject_id}"] = e.id

    return success_response({
        'class_id': section.class_id,
        'class_name': cls.name if cls else None,
        'section_id': section.id,
        'section_name': section.name,
        'academic_year_id': ay_id,
        'subjects': [s.to_dict() for s in subjects],
        'students': [{
            'student_id': s.id,
            'student_name': f"{s.first_name} {s.last_name or ''}".strip(),
            'admission_no': s.admission_no,
            'roll_no': s.roll_no,
            'enrolled_subject_ids': enr_map.get(s.id, []),
        } for s in students],
        'enrollment_ids': enr_id_map,
    })


@academics_bp.route('/class-teacher/enrollments', methods=['POST'])
@school_required
@role_required('teacher')
@validate({
    'student_id': {'type': int, 'message': 'Student ID is required'},
})
def class_teacher_set_enrollments():
    """Set the subjects for a single student in the class teacher's section.

    Body: { student_id, subject_ids: [..] }
    Replaces the student's enrollment set for the current academic year.
    """
    staff, section = _resolve_class_teacher_section()
    if not staff:
        return error_response('Staff record not found', 404)
    if not section:
        return error_response('You are not assigned as a class teacher of any section', 403)

    data = g.get('validated_data') or (request.get_json() or {})
    student_id = data.get('student_id')
    subject_ids = data.get('subject_ids', [])
    if not student_id:
        return error_response('student_id is required', 400)

    # Student must belong to this class teacher's section
    student = Student.query.filter_by(
        id=student_id, school_id=g.school_id,
        current_class_id=section.class_id, current_section_id=section.id
    ).first()
    if not student:
        return error_response('Student is not in your section', 403)

    ay = AcademicYear.query.filter_by(school_id=g.school_id, is_current=True).first()
    ay_id = ay.id if ay else None

    # Remove existing enrollments for this student+year, then re-add the given set
    existing = StudentSubjectEnrollment.query.filter_by(
        school_id=g.school_id, student_id=student_id, academic_year_id=ay_id
    ).all()
    for e in existing:
        db.session.delete(e)

    added = []
    for sid in subject_ids:
        subject = Subject.query.filter_by(id=sid, school_id=g.school_id).first()
        if not subject:
            continue
        enr = StudentSubjectEnrollment(
            school_id=g.school_id, student_id=student_id, subject_id=sid,
            class_id=section.class_id, section_id=section.id,
            academic_year_id=ay_id, enrolled_by=g.user_id
        )
        db.session.add(enr)
        added.append(sid)

    db.session.commit()
    return success_response({'student_id': student_id, 'subject_ids': added},
                            'Student subjects updated')


# ============================================================
# ELECTIVE MANAGEMENT
# ============================================================

@academics_bp.route('/elective-groups', methods=['GET'])
@school_required
def get_elective_groups():
    """Get elective groups"""
    class_id = request.args.get('class_id')
    query = ElectiveGroup.query.filter_by(school_id=g.school_id, is_active=True)
    if class_id:
        query = query.filter_by(class_id=class_id)
    groups = query.all()
    return success_response([g_item.to_dict() for g_item in groups])


@academics_bp.route('/elective-groups', methods=['POST'])
@role_required('school_admin', 'academic_controller')
@validate({
    'name': {'required': True, 'message': 'Group name is required'},
    'class_id': {'type': int, 'message': 'Class ID is required'},
})
def create_elective_group():
    """Create elective group"""
    data = g.get('validated_data') or request.get_json()
    group = ElectiveGroup(
        school_id=g.school_id,
        name=data['name'],
        class_id=data['class_id'],
        academic_year_id=data.get('academic_year_id'),
        min_choices=data.get('min_choices', 1),
        max_choices=data.get('max_choices', 1),
        deadline=data.get('deadline'),
    )
    db.session.add(group)
    db.session.commit()

    # Add subjects to group
    for subj in data.get('subjects', []):
        es = ElectiveSubject(
            group_id=group.id,
            subject_id=subj['subject_id'],
            max_seats=subj.get('max_seats'),
        )
        db.session.add(es)
    db.session.commit()

    return success_response(group.to_dict(), 201)


@academics_bp.route('/elective-groups/<int:group_id>', methods=['PUT'])
@role_required('school_admin', 'academic_controller')
@validate({})
def update_elective_group(group_id):
    """Update elective group"""
    group = ElectiveGroup.query.filter_by(id=group_id, school_id=g.school_id).first()
    if not group:
        return error_response('Group not found', 404)

    data = g.get('validated_data') or request.get_json()
    for field in ['name', 'min_choices', 'max_choices', 'deadline', 'is_active']:
        if field in data:
            setattr(group, field, data[field])
    db.session.commit()
    return success_response(group.to_dict())


@academics_bp.route('/student-electives', methods=['POST'])
@school_required
@validate({
    'group_id': {'type': int, 'message': 'Group ID is required'},
    'student_id': {'type': int, 'message': 'Student ID is required'},
    'subject_id': {'type': int, 'message': 'Subject ID is required'},
})
def select_elective():
    """Student selects elective"""
    data = g.get('validated_data') or request.get_json()
    group = ElectiveGroup.query.filter_by(id=data['group_id'], school_id=g.school_id).first()
    if not group:
        return error_response('Group not found', 404)

    # Check deadline
    if group.deadline and date.today() > group.deadline:
        return error_response('Selection deadline has passed', 400)

    # Check max choices
    existing = StudentElective.query.filter_by(
        student_id=data['student_id'], group_id=data['group_id'], status='selected'
    ).count()
    if existing >= group.max_choices:
        return error_response(f'Maximum {group.max_choices} choices allowed', 400)

    # Check seat availability
    elective_subj = ElectiveSubject.query.filter_by(
        group_id=data['group_id'], subject_id=data['subject_id']
    ).first()
    if elective_subj and elective_subj.max_seats and elective_subj.filled_seats >= elective_subj.max_seats:
        return error_response('No seats available for this subject', 400)

    selection = StudentElective(
        school_id=g.school_id,
        student_id=data['student_id'],
        group_id=data['group_id'],
        subject_id=data['subject_id'],
    )
    db.session.add(selection)

    if elective_subj:
        elective_subj.filled_seats += 1

    db.session.commit()
    return success_response(selection.to_dict(), 201)


# ============================================================
# CURRICULUM DASHBOARD
# ============================================================

@academics_bp.route('/curriculum-dashboard', methods=['GET'])
@school_required
def curriculum_dashboard():
    """Overview dashboard for curriculum module"""
    scope = get_teacher_scope()
    if scope and scope.get('no_access'):
        return success_response({
            'stats': {
                'total_syllabus': 0, 'syllabus_completed': 0, 'syllabus_in_progress': 0,
                'total_lesson_plans': 0, 'pending_approval': 0, 'approved_plans': 0,
                'total_homework': 0, 'active_homework': 0, 'total_submissions': 0,
                'total_materials': 0, 'teacher_allocations': 0,
            },
            'upcoming_events': [],
        })

    base_syllabus = Syllabus.query.filter_by(school_id=g.school_id)
    base_plans = LessonPlan.query.filter_by(school_id=g.school_id)
    base_hw = Homework.query.filter_by(school_id=g.school_id)
    base_materials = StudyMaterial.query.filter_by(school_id=g.school_id, is_active=True)
    base_calendar = AcademicCalendar.query.filter(AcademicCalendar.school_id == g.school_id)
    base_ts = TeacherSubject.query.filter_by(school_id=g.school_id, status='active')

    if scope and scope.get('class_ids'):
        base_syllabus = base_syllabus.filter(Syllabus.class_id.in_(scope['class_ids']))
        base_plans = base_plans.filter(LessonPlan.class_id.in_(scope['class_ids']))
        base_hw = base_hw.filter(Homework.class_id.in_(scope['class_ids']))
        base_materials = base_materials.filter(StudyMaterial.class_id.in_(scope['class_ids']))
        base_calendar = base_calendar.filter(AcademicCalendar.class_id.in_(scope['class_ids']))
        base_ts = base_ts.filter(TeacherSubject.class_id.in_(scope['class_ids']))

    total_syllabus = base_syllabus.count()
    syllabus_completed = base_syllabus.filter(Syllabus.status == 'completed').count()
    syllabus_progress = base_syllabus.filter(Syllabus.status == 'in_progress').count()

    total_lesson_plans = base_plans.count()
    pending_approval = base_plans.filter(LessonPlan.status == 'submitted').count()
    approved_plans = base_plans.filter(LessonPlan.status == 'approved').count()

    total_homework = base_hw.count()
    active_homework = base_hw.filter(Homework.status == 'published').count()
    total_submissions = HomeworkSubmission.query.filter_by(school_id=g.school_id).count()

    total_materials = base_materials.count()

    upcoming_events = base_calendar.filter(
        AcademicCalendar.start_date >= date.today()
    ).order_by(AcademicCalendar.start_date).limit(5).all()

    teacher_alloc = base_ts.count()

    return success_response({
        'stats': {
            'total_syllabus': total_syllabus,
            'syllabus_completed': syllabus_completed,
            'syllabus_in_progress': syllabus_progress,
            'total_lesson_plans': total_lesson_plans,
            'pending_approval': pending_approval,
            'approved_plans': approved_plans,
            'total_homework': total_homework,
            'active_homework': active_homework,
            'total_submissions': total_submissions,
            'total_materials': total_materials,
            'teacher_allocations': teacher_alloc,
        },
        'upcoming_events': [e.to_dict() for e in upcoming_events],
    })
