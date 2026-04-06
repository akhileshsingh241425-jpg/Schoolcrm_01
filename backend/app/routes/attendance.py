from flask import Blueprint, request, g
from datetime import date, datetime, timedelta
from sqlalchemy import func, and_, extract, or_
from sqlalchemy.orm import joinedload
from app import db
from app.models.attendance import (
    StudentAttendance, StaffAttendance,
    LeaveType, LeaveApplication,
    LateArrival, AttendanceRule, AttendanceDevice, EventAttendance,
    SubstituteAssignment
)
from app.models.student import Student, Class, Section
from app.models.academic import Timetable, Subject
from app.models.staff import Staff
from app.utils.decorators import school_required, role_required
from app.utils.helpers import success_response, error_response

attendance_bp = Blueprint('attendance', __name__)


def _get_teacher_staff():
    """Get Staff record linked to current user. Returns None if not a teacher."""
    return Staff.query.filter_by(user_id=g.current_user.id, school_id=g.school_id).first()


def _get_teacher_section_ids(staff_id):
    """Get section IDs where this staff is class_teacher or co_class_teacher."""
    sections = Section.query.filter(
        Section.school_id == g.school_id,
        or_(Section.class_teacher_id == staff_id, Section.co_class_teacher_id == staff_id)
    ).all()
    return [s.id for s in sections]


def _is_admin():
    return g.current_user.role.name in ('school_admin', 'super_admin', 'principal')


# =====================================================
# MY CLASSES (for class teacher / co-class teacher)
# =====================================================

@attendance_bp.route('/my-classes', methods=['GET'])
@role_required('school_admin', 'super_admin', 'principal', 'teacher')
def get_my_classes():
    """Return classes & sections assigned to the logged-in teacher.
       Admins get all classes."""
    if _is_admin():
        classes = Class.query.filter_by(school_id=g.school_id).all()
        result = []
        for c in classes:
            sections = Section.query.filter_by(class_id=c.id, school_id=g.school_id).all()
            result.append({
                'id': c.id, 'name': c.name,
                'sections': [s.to_dict_full() for s in sections]
            })
        return success_response(result)

    staff = _get_teacher_staff()
    if not staff:
        return success_response([])

    sections = Section.query.filter(
        Section.school_id == g.school_id,
        or_(Section.class_teacher_id == staff.id, Section.co_class_teacher_id == staff.id)
    ).all()

    # Group by class
    class_map = {}
    for s in sections:
        if s.class_id not in class_map:
            cls = Class.query.get(s.class_id)
            class_map[s.class_id] = {'id': cls.id, 'name': cls.name, 'sections': []}
        class_map[s.class_id]['sections'].append(s.to_dict_full())

    return success_response(list(class_map.values()))


# =====================================================
# STUDENT ATTENDANCE
# =====================================================

@attendance_bp.route('/students', methods=['GET'])
@school_required
def get_student_attendance():
    class_id = request.args.get('class_id', type=int)
    section_id = request.args.get('section_id', type=int)
    att_date = request.args.get('date', date.today().isoformat())

    query = StudentAttendance.query.options(
        joinedload(StudentAttendance.student)
    ).filter_by(school_id=g.school_id, date=att_date)
    if class_id:
        query = query.filter_by(class_id=class_id)
    if section_id:
        query = query.filter_by(section_id=section_id)

    period = request.args.get('period', type=int)
    if period:
        query = query.filter_by(period=period)
    else:
        query = query.filter(StudentAttendance.period.is_(None))

    records = query.all()
    return success_response([r.to_dict() for r in records])


@attendance_bp.route('/students', methods=['POST'])
@role_required('school_admin', 'super_admin', 'principal', 'teacher')
def mark_student_attendance():
    data = request.get_json()
    att_date = data.get('date', date.today().isoformat())
    records = data.get('attendance', [])
    period = data.get('period')  # None = full day
    capture_mode = data.get('capture_mode', 'manual')

    # --- Class teacher / co-class teacher enforcement ---
    allowed_section_ids = None
    if not _is_admin():
        staff = _get_teacher_staff()
        if not staff:
            return error_response('Your user account is not linked to a staff record', 403)
        allowed_section_ids = set(_get_teacher_section_ids(staff.id))
        if not allowed_section_ids:
            return error_response('You are not assigned as class teacher or co-class teacher of any section', 403)

    created = 0
    updated = 0

    # Batch fetch all students to avoid N+1
    student_ids = [r['student_id'] for r in records]
    students_map = {s.id: s for s in Student.query.filter(
        Student.id.in_(student_ids), Student.school_id == g.school_id
    ).all()} if student_ids else {}

    # If teacher, verify all students belong to their sections
    if allowed_section_ids is not None:
        for sid, student in students_map.items():
            if student.current_section_id not in allowed_section_ids:
                return error_response(
                    f'You are not the class teacher for {student.full_name}\'s section. '
                    'Only class teachers or co-class teachers can mark attendance.', 403)

    for record in records:
        existing = StudentAttendance.query.filter_by(
            student_id=record['student_id'],
            date=att_date,
            period=period
        ).first()

        if existing:
            existing.status = record['status']
            existing.remarks = record.get('remarks')
            existing.capture_mode = capture_mode
            updated += 1
        else:
            student = students_map.get(record['student_id'])
            if student:
                att = StudentAttendance(
                    student_id=record['student_id'],
                    school_id=g.school_id,
                    class_id=student.current_class_id,
                    section_id=student.current_section_id,
                    date=att_date,
                    status=record['status'],
                    period=period,
                    capture_mode=capture_mode,
                    check_in_time=record.get('check_in_time'),
                    check_out_time=record.get('check_out_time'),
                    remarks=record.get('remarks'),
                    marked_by=g.current_user.id
                )
                db.session.add(att)
                created += 1

    db.session.commit()
    return success_response(message=f'Attendance marked: {created} new, {updated} updated')


@attendance_bp.route('/students/report', methods=['GET'])
@school_required
def student_attendance_report():
    student_id = request.args.get('student_id', type=int)
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')
    class_id = request.args.get('class_id', type=int)

    query = StudentAttendance.query.options(
        joinedload(StudentAttendance.student)
    ).filter_by(school_id=g.school_id)
    query = query.filter(StudentAttendance.period.is_(None))  # Full-day only

    if student_id:
        query = query.filter_by(student_id=student_id)
    if class_id:
        query = query.filter_by(class_id=class_id)
    if from_date:
        query = query.filter(StudentAttendance.date >= from_date)
    if to_date:
        query = query.filter(StudentAttendance.date <= to_date)

    records = query.order_by(StudentAttendance.date.desc()).all()

    total = len(records)
    present = sum(1 for r in records if r.status == 'present')
    absent = sum(1 for r in records if r.status == 'absent')
    late = sum(1 for r in records if r.status == 'late')
    half_day = sum(1 for r in records if r.status == 'half_day')
    leave = sum(1 for r in records if r.status == 'leave')

    return success_response({
        'records': [r.to_dict() for r in records],
        'summary': {
            'total_days': total,
            'present': present,
            'absent': absent,
            'late': late,
            'half_day': half_day,
            'leave': leave,
            'percentage': round((present / total * 100), 2) if total > 0 else 0
        }
    })


@attendance_bp.route('/students/<int:student_id>', methods=['GET'])
@school_required
def get_student_attendance_detail(student_id):
    """Individual student attendance history"""
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')

    student = Student.query.get_or_404(student_id)
    query = StudentAttendance.query.filter_by(
        student_id=student_id, school_id=g.school_id
    ).filter(StudentAttendance.period.is_(None))

    if from_date:
        query = query.filter(StudentAttendance.date >= from_date)
    if to_date:
        query = query.filter(StudentAttendance.date <= to_date)

    records = query.order_by(StudentAttendance.date.desc()).all()
    total = len(records)
    present = sum(1 for r in records if r.status in ('present', 'late'))

    # Monthly breakdown
    monthly = {}
    for r in records:
        key = r.date.strftime('%Y-%m')
        if key not in monthly:
            monthly[key] = {'present': 0, 'absent': 0, 'late': 0, 'half_day': 0, 'leave': 0, 'total': 0}
        monthly[key][r.status] += 1
        monthly[key]['total'] += 1

    return success_response({
        'student': {'id': student.id, 'name': student.full_name,
                     'class_id': student.current_class_id,
                     'section_id': student.current_section_id},
        'records': [r.to_dict() for r in records[:100]],
        'summary': {
            'total_days': total, 'present': present,
            'absent': sum(1 for r in records if r.status == 'absent'),
            'percentage': round((present / total * 100), 2) if total > 0 else 0
        },
        'monthly': monthly
    })


# =====================================================
# PERIOD-WISE ATTENDANCE
# =====================================================

@attendance_bp.route('/period', methods=['GET'])
@school_required
def get_period_attendance():
    class_id = request.args.get('class_id', type=int)
    section_id = request.args.get('section_id', type=int)
    att_date = request.args.get('date', date.today().isoformat())
    period = request.args.get('period', type=int)

    if not class_id or not period:
        return error_response('class_id and period required')

    query = StudentAttendance.query.options(
        joinedload(StudentAttendance.student)
    ).filter_by(
        school_id=g.school_id, date=att_date, class_id=class_id, period=period
    )
    if section_id:
        query = query.filter_by(section_id=section_id)

    records = query.all()
    return success_response([r.to_dict() for r in records])


@attendance_bp.route('/period', methods=['POST'])
@role_required('school_admin', 'super_admin', 'principal', 'teacher')
def mark_period_attendance():
    data = request.get_json()
    att_date = data.get('date', date.today().isoformat())
    period = data.get('period')
    records = data.get('attendance', [])

    if not period:
        return error_response('period is required')

    # --- Class teacher / co-class teacher enforcement ---
    allowed_section_ids = None
    if not _is_admin():
        staff = _get_teacher_staff()
        if not staff:
            return error_response('Your user account is not linked to a staff record', 403)
        allowed_section_ids = set(_get_teacher_section_ids(staff.id))
        if not allowed_section_ids:
            return error_response('You are not assigned as class teacher or co-class teacher of any section', 403)

    # Batch fetch students
    student_ids = [r['student_id'] for r in records]
    students_map = {s.id: s for s in Student.query.filter(
        Student.id.in_(student_ids), Student.school_id == g.school_id
    ).all()} if student_ids else {}

    # If teacher, verify all students belong to their sections
    if allowed_section_ids is not None:
        for sid, student in students_map.items():
            if student.current_section_id not in allowed_section_ids:
                return error_response(
                    f'You are not the class teacher for {student.full_name}\'s section.', 403)

    created = 0
    for record in records:
        existing = StudentAttendance.query.filter_by(
            student_id=record['student_id'], date=att_date, period=period
        ).first()
        if existing:
            existing.status = record['status']
            existing.remarks = record.get('remarks')
        else:
            student = students_map.get(record['student_id'])
            if student:
                att = StudentAttendance(
                    student_id=record['student_id'],
                    school_id=g.school_id,
                    class_id=student.current_class_id,
                    section_id=student.current_section_id,
                    date=att_date, status=record['status'],
                    period=period, capture_mode='manual',
                    remarks=record.get('remarks'),
                    marked_by=g.current_user.id
                )
                db.session.add(att)
                created += 1

    db.session.commit()
    return success_response(message=f'Period {period} attendance marked: {created} records')


# =====================================================
# STAFF ATTENDANCE
# =====================================================

@attendance_bp.route('/staff', methods=['GET'])
@role_required('school_admin')
def get_staff_attendance():
    att_date = request.args.get('date', date.today().isoformat())
    records = StaffAttendance.query.options(
        joinedload(StaffAttendance.staff)
    ).filter_by(school_id=g.school_id, date=att_date).all()
    return success_response([r.to_dict() for r in records])


@attendance_bp.route('/staff', methods=['POST'])
@role_required('school_admin')
def mark_staff_attendance():
    data = request.get_json()
    att_date = data.get('date', date.today().isoformat())
    records = data.get('attendance', [])
    capture_mode = data.get('capture_mode', 'manual')

    for record in records:
        existing = StaffAttendance.query.filter_by(
            staff_id=record['staff_id'], date=att_date
        ).first()
        if existing:
            existing.status = record['status']
            existing.check_in = record.get('check_in')
            existing.check_out = record.get('check_out')
            existing.capture_mode = capture_mode
        else:
            att = StaffAttendance(
                staff_id=record['staff_id'],
                school_id=g.school_id,
                date=att_date,
                status=record['status'],
                check_in=record.get('check_in'),
                check_out=record.get('check_out'),
                capture_mode=capture_mode,
                remarks=record.get('remarks')
            )
            db.session.add(att)

    db.session.commit()
    return success_response(message='Staff attendance marked')


@attendance_bp.route('/staff/report', methods=['GET'])
@role_required('school_admin')
def staff_attendance_report():
    staff_id = request.args.get('staff_id', type=int)
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')

    query = StaffAttendance.query.options(
        joinedload(StaffAttendance.staff)
    ).filter_by(school_id=g.school_id)
    if staff_id:
        query = query.filter_by(staff_id=staff_id)
    if from_date:
        query = query.filter(StaffAttendance.date >= from_date)
    if to_date:
        query = query.filter(StaffAttendance.date <= to_date)

    records = query.order_by(StaffAttendance.date.desc()).all()
    total = len(records)
    present = sum(1 for r in records if r.status in ('present', 'late'))

    return success_response({
        'records': [r.to_dict() for r in records],
        'summary': {
            'total_days': total, 'present': present,
            'absent': sum(1 for r in records if r.status == 'absent'),
            'late': sum(1 for r in records if r.status == 'late'),
            'percentage': round((present / total * 100), 2) if total > 0 else 0
        }
    })


# =====================================================
# LEAVE MANAGEMENT
# =====================================================

@attendance_bp.route('/leave-types', methods=['GET'])
@school_required
def get_leave_types():
    applies_to = request.args.get('applies_to')
    query = LeaveType.query.filter_by(school_id=g.school_id, is_active=True)
    if applies_to:
        query = query.filter(LeaveType.applies_to.in_([applies_to, 'both']))
    return success_response([lt.to_dict() for lt in query.all()])


@attendance_bp.route('/leave-types', methods=['POST'])
@role_required('school_admin')
def create_leave_type():
    data = request.get_json()
    lt = LeaveType(
        school_id=g.school_id,
        name=data['name'], code=data['code'],
        applies_to=data.get('applies_to', 'both'),
        max_days_per_year=data.get('max_days_per_year', 0),
        requires_document=data.get('requires_document', False),
        is_paid=data.get('is_paid', True),
        carry_forward=data.get('carry_forward', False),
        description=data.get('description')
    )
    db.session.add(lt)
    db.session.commit()
    return success_response(lt.to_dict(), message='Leave type created')


@attendance_bp.route('/leave-types/<int:id>', methods=['PUT'])
@role_required('school_admin')
def update_leave_type(id):
    lt = LeaveType.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for field in ['name', 'code', 'applies_to', 'max_days_per_year', 'requires_document',
                  'is_paid', 'carry_forward', 'description', 'is_active']:
        if field in data:
            setattr(lt, field, data[field])
    db.session.commit()
    return success_response(lt.to_dict(), message='Leave type updated')


@attendance_bp.route('/leave-types/<int:id>', methods=['DELETE'])
@role_required('school_admin')
def delete_leave_type(id):
    lt = LeaveType.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    lt.is_active = False
    db.session.commit()
    return success_response(message='Leave type deactivated')


@attendance_bp.route('/leaves', methods=['GET'])
@school_required
def get_leave_applications():
    status = request.args.get('status')
    applicant_type = request.args.get('applicant_type')
    query = LeaveApplication.query.filter_by(school_id=g.school_id)
    if status:
        query = query.filter_by(status=status)
    if applicant_type:
        query = query.filter_by(applicant_type=applicant_type)
    leaves = query.order_by(LeaveApplication.created_at.desc()).all()
    results = []
    for lv in leaves:
        d = lv.to_dict()
        if lv.applicant_type == 'student':
            s = Student.query.get(lv.applicant_id)
            d['applicant_name'] = s.full_name if s else 'Unknown'
        else:
            s = Staff.query.get(lv.applicant_id)
            d['applicant_name'] = f"{s.first_name} {s.last_name or ''}".strip() if s else 'Unknown'
        results.append(d)
    return success_response(results)


@attendance_bp.route('/leaves', methods=['POST'])
@school_required
def apply_leave():
    data = request.get_json()
    from_d = date.fromisoformat(data['from_date'])
    to_d = date.fromisoformat(data['to_date'])
    days = (to_d - from_d).days + 1

    la = LeaveApplication(
        school_id=g.school_id,
        applicant_type=data['applicant_type'],
        applicant_id=data['applicant_id'],
        leave_type_id=data.get('leave_type_id'),
        from_date=from_d, to_date=to_d, days=days,
        reason=data['reason'],
        document_url=data.get('document_url'),
        applied_by=g.current_user.id
    )
    db.session.add(la)
    db.session.commit()
    return success_response(la.to_dict(), message='Leave application submitted')


@attendance_bp.route('/leaves/<int:id>', methods=['GET'])
@school_required
def get_leave_detail(id):
    la = LeaveApplication.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    d = la.to_dict()
    if la.applicant_type == 'student':
        s = Student.query.get(la.applicant_id)
        d['applicant_name'] = s.full_name if s else 'Unknown'
    else:
        s = Staff.query.get(la.applicant_id)
        d['applicant_name'] = f"{s.first_name} {s.last_name or ''}".strip() if s else 'Unknown'
    return success_response(d)


@attendance_bp.route('/leaves/<int:id>/approve', methods=['PUT'])
@role_required('school_admin')
def approve_reject_leave(id):
    la = LeaveApplication.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    action = data.get('action')  # 'approve' or 'reject'

    if action == 'approve':
        la.status = 'approved'
        la.approved_by = g.current_user.id
        la.approved_at = datetime.utcnow()
        # Auto-mark leave days in attendance
        current_date = la.from_date
        while current_date <= la.to_date:
            if la.applicant_type == 'student':
                student = Student.query.get(la.applicant_id)
                if student:
                    existing = StudentAttendance.query.filter_by(
                        student_id=la.applicant_id, date=current_date, period=None
                    ).first()
                    if not existing:
                        att = StudentAttendance(
                            student_id=la.applicant_id,
                            school_id=g.school_id,
                            class_id=student.current_class_id,
                            section_id=student.current_section_id,
                            date=current_date, status='leave',
                            remarks=f'Leave: {la.reason}',
                            marked_by=g.current_user.id
                        )
                        db.session.add(att)
                    else:
                        existing.status = 'leave'
            current_date += timedelta(days=1)
    elif action == 'reject':
        la.status = 'rejected'
        la.approved_by = g.current_user.id
        la.rejection_reason = data.get('rejection_reason', '')
    else:
        return error_response('action must be approve or reject')

    db.session.commit()
    return success_response(la.to_dict(), message=f'Leave {action}d')


# =====================================================
# LATE ARRIVALS
# =====================================================

@attendance_bp.route('/late-arrivals', methods=['GET'])
@school_required
def get_late_arrivals():
    att_date = request.args.get('date')
    person_type = request.args.get('person_type')
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')

    query = LateArrival.query.filter_by(school_id=g.school_id)
    if att_date:
        query = query.filter_by(date=att_date)
    if person_type:
        query = query.filter_by(person_type=person_type)
    if from_date:
        query = query.filter(LateArrival.date >= from_date)
    if to_date:
        query = query.filter(LateArrival.date <= to_date)

    records = query.order_by(LateArrival.date.desc()).all()
    results = []
    for r in records:
        d = r.to_dict()
        if r.person_type == 'student':
            s = Student.query.get(r.person_id)
            d['person_name'] = s.full_name if s else 'Unknown'
        else:
            s = Staff.query.get(r.person_id)
            d['person_name'] = f"{s.first_name} {s.last_name or ''}".strip() if s else 'Unknown'
        results.append(d)
    return success_response(results)


@attendance_bp.route('/late-arrivals', methods=['POST'])
@role_required('school_admin', 'teacher')
def record_late_arrival():
    data = request.get_json()
    la = LateArrival(
        school_id=g.school_id,
        person_type=data['person_type'],
        person_id=data['person_id'],
        date=data.get('date', date.today().isoformat()),
        expected_time=data.get('expected_time'),
        arrival_time=data['arrival_time'],
        late_by_minutes=data.get('late_by_minutes'),
        reason=data.get('reason'),
        parent_notified=data.get('parent_notified', False)
    )
    db.session.add(la)
    db.session.commit()
    return success_response(la.to_dict(), message='Late arrival recorded')


# =====================================================
# ATTENDANCE RULES
# =====================================================

@attendance_bp.route('/rules', methods=['GET'])
@school_required
def get_attendance_rules():
    rule = AttendanceRule.query.filter_by(school_id=g.school_id).first()
    if not rule:
        return success_response(None)
    return success_response(rule.to_dict())


@attendance_bp.route('/rules', methods=['POST'])
@role_required('school_admin')
def save_attendance_rules():
    data = request.get_json()
    rule = AttendanceRule.query.filter_by(school_id=g.school_id).first()
    if not rule:
        rule = AttendanceRule(school_id=g.school_id)
        db.session.add(rule)

    for field in ['minimum_percentage', 'alert_threshold', 'late_arrival_minutes',
                  'half_day_minutes', 'school_start_time', 'school_end_time',
                  'periods_per_day', 'period_duration_minutes', 'auto_notify_parent',
                  'notify_on_absent', 'notify_on_late', 'working_days']:
        if field in data:
            setattr(rule, field, data[field])

    db.session.commit()
    return success_response(rule.to_dict(), message='Attendance rules saved')


# =====================================================
# ATTENDANCE DEVICES
# =====================================================

@attendance_bp.route('/devices', methods=['GET'])
@role_required('school_admin')
def get_devices():
    devices = AttendanceDevice.query.filter_by(school_id=g.school_id).all()
    return success_response([d.to_dict() for d in devices])


@attendance_bp.route('/devices', methods=['POST'])
@role_required('school_admin')
def add_device():
    data = request.get_json()
    device = AttendanceDevice(
        school_id=g.school_id,
        device_name=data['device_name'],
        device_type=data['device_type'],
        location=data.get('location'),
        serial_number=data.get('serial_number'),
        ip_address=data.get('ip_address')
    )
    db.session.add(device)
    db.session.commit()
    return success_response(device.to_dict(), message='Device added')


@attendance_bp.route('/devices/<int:id>', methods=['PUT'])
@role_required('school_admin')
def update_device(id):
    device = AttendanceDevice.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for field in ['device_name', 'device_type', 'location', 'serial_number', 'ip_address', 'status']:
        if field in data:
            setattr(device, field, data[field])
    db.session.commit()
    return success_response(device.to_dict(), message='Device updated')


@attendance_bp.route('/devices/<int:id>', methods=['DELETE'])
@role_required('school_admin')
def delete_device(id):
    device = AttendanceDevice.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(device)
    db.session.commit()
    return success_response(message='Device deleted')


# =====================================================
# EVENT ATTENDANCE
# =====================================================

@attendance_bp.route('/events', methods=['GET'])
@school_required
def get_event_attendance():
    event_date = request.args.get('date')
    event_type = request.args.get('event_type')
    query = EventAttendance.query.filter_by(school_id=g.school_id)
    if event_date:
        query = query.filter_by(event_date=event_date)
    if event_type:
        query = query.filter_by(event_type=event_type)
    records = query.order_by(EventAttendance.event_date.desc()).all()
    return success_response([r.to_dict() for r in records])


@attendance_bp.route('/events', methods=['POST'])
@role_required('school_admin', 'teacher')
def mark_event_attendance():
    data = request.get_json()
    event_name = data['event_name']
    event_type = data.get('event_type', 'other')
    event_date = data['event_date']
    records = data.get('attendance', [])

    created = 0
    for record in records:
        att = EventAttendance(
            school_id=g.school_id,
            event_name=event_name, event_type=event_type,
            event_date=event_date,
            student_id=record['student_id'],
            status=record.get('status', 'present'),
            remarks=record.get('remarks')
        )
        db.session.add(att)
        created += 1

    db.session.commit()
    return success_response(message=f'Event attendance marked: {created} records')


# =====================================================
# ANALYTICS & DASHBOARD
# =====================================================

@attendance_bp.route('/analytics', methods=['GET'])
@school_required
def attendance_analytics():
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')
    class_id = request.args.get('class_id', type=int)

    if not from_date:
        from_date = (date.today() - timedelta(days=30)).isoformat()
    if not to_date:
        to_date = date.today().isoformat()

    query = StudentAttendance.query.filter_by(school_id=g.school_id)
    query = query.filter(StudentAttendance.period.is_(None))
    query = query.filter(StudentAttendance.date >= from_date, StudentAttendance.date <= to_date)
    if class_id:
        query = query.filter_by(class_id=class_id)

    records = query.all()
    total = len(records)
    present = sum(1 for r in records if r.status in ('present', 'late'))
    absent = sum(1 for r in records if r.status == 'absent')
    late = sum(1 for r in records if r.status == 'late')

    # Daily trend
    daily = {}
    for r in records:
        key = r.date.isoformat()
        if key not in daily:
            daily[key] = {'present': 0, 'absent': 0, 'late': 0, 'total': 0}
        daily[key][r.status if r.status in ('present', 'absent', 'late') else 'present'] += 1
        daily[key]['total'] += 1

    # Class-wise summary
    class_summary = {}
    for r in records:
        cid = r.class_id
        if cid not in class_summary:
            class_summary[cid] = {'present': 0, 'absent': 0, 'total': 0}
        if r.status in ('present', 'late'):
            class_summary[cid]['present'] += 1
        else:
            class_summary[cid]['absent'] += 1
        class_summary[cid]['total'] += 1

    return success_response({
        'overall': {
            'total_records': total, 'present': present,
            'absent': absent, 'late': late,
            'percentage': round((present / total * 100), 2) if total > 0 else 0
        },
        'daily_trend': daily,
        'class_summary': {str(k): v for k, v in class_summary.items()}
    })


@attendance_bp.route('/alerts', methods=['GET'])
@school_required
def attendance_alerts():
    """Students below attendance threshold"""
    rule = AttendanceRule.query.filter_by(school_id=g.school_id).first()
    threshold = float(rule.alert_threshold) if rule else 80.0
    days_back = int(request.args.get('days', 30))
    class_id = request.args.get('class_id', type=int)

    from_date = (date.today() - timedelta(days=days_back)).isoformat()
    to_date = date.today().isoformat()

    student_query = Student.query.filter_by(school_id=g.school_id, status='active')
    if class_id:
        student_query = student_query.filter_by(current_class_id=class_id)

    alerts = []
    for student in student_query.all():
        records = StudentAttendance.query.filter_by(
            student_id=student.id, school_id=g.school_id
        ).filter(
            StudentAttendance.period.is_(None),
            StudentAttendance.date >= from_date,
            StudentAttendance.date <= to_date
        ).all()

        total = len(records)
        if total == 0:
            continue
        present = sum(1 for r in records if r.status in ('present', 'late'))
        pct = round((present / total * 100), 2)

        if pct < threshold:
            alerts.append({
                'student_id': student.id,
                'student_name': student.full_name,
                'class_id': student.current_class_id,
                'section_id': student.current_section_id,
                'total_days': total, 'present': present,
                'percentage': pct,
                'deficit': round(threshold - pct, 2)
            })

    alerts.sort(key=lambda x: x['percentage'])
    return success_response({'threshold': threshold, 'alerts': alerts})


@attendance_bp.route('/dashboard', methods=['GET'])
@school_required
def attendance_dashboard():
    """Overview: today stats + recent trends"""
    today = date.today()

    # Today's student attendance
    today_records = StudentAttendance.query.filter_by(
        school_id=g.school_id, date=today
    ).filter(StudentAttendance.period.is_(None)).all()

    total_students = Student.query.filter_by(school_id=g.school_id, status='active').count()
    present_today = sum(1 for r in today_records if r.status in ('present', 'late'))
    absent_today = sum(1 for r in today_records if r.status == 'absent')
    late_today = sum(1 for r in today_records if r.status == 'late')
    on_leave = sum(1 for r in today_records if r.status == 'leave')
    unmarked = total_students - len(today_records)

    # Today's staff attendance
    staff_records = StaffAttendance.query.filter_by(school_id=g.school_id, date=today).all()
    total_staff = Staff.query.filter_by(school_id=g.school_id).count()
    staff_present = sum(1 for r in staff_records if r.status in ('present', 'late'))

    # Pending leaves
    pending_leaves = LeaveApplication.query.filter_by(
        school_id=g.school_id, status='pending'
    ).count()

    # Late arrivals today
    late_arrivals_count = LateArrival.query.filter_by(
        school_id=g.school_id, date=today
    ).count()

    # Weekly trend (last 7 days)
    weekly = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        day_records = StudentAttendance.query.filter_by(
            school_id=g.school_id, date=d
        ).filter(StudentAttendance.period.is_(None)).all()
        t = len(day_records)
        p = sum(1 for r in day_records if r.status in ('present', 'late'))
        weekly.append({
            'date': d.isoformat(),
            'day': d.strftime('%a'),
            'total': t, 'present': p,
            'percentage': round((p / t * 100), 2) if t > 0 else 0
        })

    return success_response({
        'today': {
            'total_students': total_students,
            'present': present_today, 'absent': absent_today,
            'late': late_today, 'on_leave': on_leave,
            'unmarked': unmarked,
            'percentage': round((present_today / total_students * 100), 2) if total_students > 0 else 0
        },
        'staff': {
            'total': total_staff, 'present': staff_present,
            'absent': total_staff - len(staff_records),
            'percentage': round((staff_present / total_staff * 100), 2) if total_staff > 0 else 0
        },
        'pending_leaves': pending_leaves,
        'late_arrivals_today': late_arrivals_count,
        'weekly_trend': weekly
    })


# =====================================================
# SUBSTITUTE TEACHER MANAGEMENT
# =====================================================

@attendance_bp.route('/substitutions/absent-teachers', methods=['GET'])
@school_required
def get_absent_teachers():
    """Get absent teachers for a date along with their timetable periods"""
    target_date = request.args.get('date', date.today().isoformat())
    try:
        target_date = datetime.strptime(target_date, '%Y-%m-%d').date()
    except ValueError:
        return error_response('Invalid date format')

    day_name = target_date.strftime('%A').lower()

    # Get absent staff
    absent_records = StaffAttendance.query.filter(
        StaffAttendance.school_id == g.school_id,
        StaffAttendance.date == target_date,
        StaffAttendance.status.in_(['absent', 'leave'])
    ).all()

    absent_teacher_ids = [r.staff_id for r in absent_records]
    if not absent_teacher_ids:
        return success_response([])

    # Get timetable periods for absent teachers on that day
    timetable_entries = Timetable.query.filter(
        Timetable.school_id == g.school_id,
        Timetable.teacher_id.in_(absent_teacher_ids),
        Timetable.day_of_week == day_name,
        Timetable.is_break == False
    ).order_by(Timetable.period_number).all()

    # Already assigned substitutes for this date
    existing_subs = SubstituteAssignment.query.filter(
        SubstituteAssignment.school_id == g.school_id,
        SubstituteAssignment.date == target_date,
        SubstituteAssignment.status.in_(['assigned', 'accepted'])
    ).all()
    assigned_keys = {(s.absent_teacher_id, s.period_number, s.class_id, s.section_id) for s in existing_subs}

    # Group periods by teacher
    from collections import defaultdict
    teacher_periods = defaultdict(list)
    for t in timetable_entries:
        key = (t.teacher_id, t.period_number, t.class_id, t.section_id)
        teacher_periods[t.teacher_id].append({
            'timetable_id': t.id,
            'period_number': t.period_number,
            'class_id': t.class_id,
            'class_name': t.class_ref.name if t.class_ref else None,
            'section_id': t.section_id,
            'section_name': t.section_ref.name if t.section_ref else None,
            'subject_id': t.subject_id,
            'subject_name': t.subject.name if t.subject else None,
            'start_time': t.start_time.strftime('%H:%M') if t.start_time else None,
            'end_time': t.end_time.strftime('%H:%M') if t.end_time else None,
            'already_assigned': key in assigned_keys
        })

    # Build response
    result = []
    absent_staff = Staff.query.filter(Staff.id.in_(absent_teacher_ids)).all()
    staff_map = {s.id: s for s in absent_staff}
    attendance_map = {r.staff_id: r.status for r in absent_records}

    for tid in absent_teacher_ids:
        staff = staff_map.get(tid)
        if not staff:
            continue
        periods = teacher_periods.get(tid, [])
        if not periods:
            continue
        result.append({
            'staff_id': tid,
            'teacher_name': f"{staff.first_name} {staff.last_name or ''}".strip(),
            'designation': staff.designation,
            'absence_status': attendance_map.get(tid, 'absent'),
            'periods': periods,
            'total_periods': len(periods),
            'assigned_count': sum(1 for p in periods if p['already_assigned'])
        })

    return success_response(result)


@attendance_bp.route('/substitutions/available-teachers', methods=['GET'])
@school_required
def get_available_teachers():
    """Get teachers who are free (not in timetable) for a given date + period"""
    target_date = request.args.get('date', date.today().isoformat())
    period_number = request.args.get('period_number', type=int)

    if not period_number:
        return error_response('period_number required')

    try:
        target_date = datetime.strptime(target_date, '%Y-%m-%d').date()
    except ValueError:
        return error_response('Invalid date format')

    day_name = target_date.strftime('%A').lower()

    # Teachers who have timetable for this period
    busy_teacher_ids = db.session.query(Timetable.teacher_id).filter(
        Timetable.school_id == g.school_id,
        Timetable.day_of_week == day_name,
        Timetable.period_number == period_number,
        Timetable.is_break == False
    ).distinct().all()
    busy_ids = {t[0] for t in busy_teacher_ids}

    # Teachers already assigned as substitutes for this slot
    already_sub_ids = db.session.query(SubstituteAssignment.substitute_teacher_id).filter(
        SubstituteAssignment.school_id == g.school_id,
        SubstituteAssignment.date == target_date,
        SubstituteAssignment.period_number == period_number,
        SubstituteAssignment.status.in_(['assigned', 'accepted'])
    ).distinct().all()
    busy_ids.update(s[0] for s in already_sub_ids)

    # Absent teachers
    absent_ids = db.session.query(StaffAttendance.staff_id).filter(
        StaffAttendance.school_id == g.school_id,
        StaffAttendance.date == target_date,
        StaffAttendance.status.in_(['absent', 'leave'])
    ).distinct().all()
    busy_ids.update(a[0] for a in absent_ids)

    # Get all active teaching staff who are free
    available = Staff.query.filter(
        Staff.school_id == g.school_id,
        Staff.staff_type == 'teaching',
        Staff.status == 'active',
        ~Staff.id.in_(busy_ids) if busy_ids else True
    ).order_by(Staff.first_name).all()

    return success_response([{
        'staff_id': s.id,
        'name': f"{s.first_name} {s.last_name or ''}".strip(),
        'designation': s.designation,
        'department': s.department,
    } for s in available])


@attendance_bp.route('/substitutions', methods=['GET'])
@school_required
def get_substitutions():
    """List substitution assignments with filters"""
    target_date = request.args.get('date', date.today().isoformat())
    status_filter = request.args.get('status')
    teacher_id = request.args.get('teacher_id', type=int)

    try:
        target_date = datetime.strptime(target_date, '%Y-%m-%d').date()
    except ValueError:
        return error_response('Invalid date format')

    query = SubstituteAssignment.query.filter(
        SubstituteAssignment.school_id == g.school_id,
        SubstituteAssignment.date == target_date
    )

    if status_filter:
        query = query.filter(SubstituteAssignment.status == status_filter)
    if teacher_id:
        query = query.filter(or_(
            SubstituteAssignment.absent_teacher_id == teacher_id,
            SubstituteAssignment.substitute_teacher_id == teacher_id
        ))

    subs = query.order_by(SubstituteAssignment.period_number).all()
    return success_response([s.to_dict() for s in subs])


@attendance_bp.route('/substitutions', methods=['POST'])
@school_required
def create_substitution():
    """Assign a substitute teacher"""
    data = request.get_json()
    required = ['absent_teacher_id', 'substitute_teacher_id', 'date', 'period_number', 'class_id', 'section_id']
    for field in required:
        if field not in data:
            return error_response(f'{field} is required')

    if data['absent_teacher_id'] == data['substitute_teacher_id']:
        return error_response('Absent teacher and substitute cannot be the same')

    try:
        target_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    except ValueError:
        return error_response('Invalid date format')

    # Check duplicate
    existing = SubstituteAssignment.query.filter(
        SubstituteAssignment.school_id == g.school_id,
        SubstituteAssignment.date == target_date,
        SubstituteAssignment.absent_teacher_id == data['absent_teacher_id'],
        SubstituteAssignment.period_number == data['period_number'],
        SubstituteAssignment.class_id == data['class_id'],
        SubstituteAssignment.section_id == data['section_id'],
        SubstituteAssignment.status.in_(['assigned', 'accepted'])
    ).first()
    if existing:
        return error_response('Substitute already assigned for this slot')

    sub = SubstituteAssignment(
        school_id=g.school_id,
        date=target_date,
        absent_teacher_id=data['absent_teacher_id'],
        substitute_teacher_id=data['substitute_teacher_id'],
        timetable_id=data.get('timetable_id'),
        class_id=data['class_id'],
        section_id=data['section_id'],
        period_number=data['period_number'],
        subject_id=data.get('subject_id'),
        status='assigned',
        reason=data.get('reason', ''),
        remarks=data.get('remarks', ''),
        assigned_by=g.current_user.id
    )
    db.session.add(sub)
    db.session.commit()
    return success_response(sub.to_dict(), 'Substitute assigned successfully')


@attendance_bp.route('/substitutions/<int:sub_id>', methods=['PUT'])
@school_required
def update_substitution(sub_id):
    """Update substitution status or details"""
    sub = SubstituteAssignment.query.filter_by(id=sub_id, school_id=g.school_id).first()
    if not sub:
        return error_response('Substitution not found', 404)

    data = request.get_json()

    if 'status' in data:
        sub.status = data['status']
    if 'substitute_teacher_id' in data:
        if data['substitute_teacher_id'] == sub.absent_teacher_id:
            return error_response('Absent teacher and substitute cannot be the same')
        sub.substitute_teacher_id = data['substitute_teacher_id']
    if 'remarks' in data:
        sub.remarks = data['remarks']
    if 'reason' in data:
        sub.reason = data['reason']

    db.session.commit()
    return success_response(sub.to_dict(), 'Substitution updated successfully')


@attendance_bp.route('/substitutions/<int:sub_id>', methods=['DELETE'])
@school_required
def delete_substitution(sub_id):
    """Delete/cancel a substitution"""
    sub = SubstituteAssignment.query.filter_by(id=sub_id, school_id=g.school_id).first()
    if not sub:
        return error_response('Substitution not found', 404)

    db.session.delete(sub)
    db.session.commit()
    return success_response(None, 'Substitution deleted')
