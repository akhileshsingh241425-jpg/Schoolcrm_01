from flask import Blueprint, request, jsonify
from datetime import datetime, date
from app import db
from app.models.platform_staff import PlatformStaff, PlatformStaffAttendance, PlatformStaffPayroll, PlatformStaffLeave
from app.utils.decorators import super_admin_required
from app.utils.helpers import success_response, error_response, paginate

staff_bp = Blueprint('platform_staff', __name__, url_prefix='/api/superadmin/staff')


# ─── CRUD ───────────────────────────────────────────────────────────────
@staff_bp.route('', methods=['GET'])
@super_admin_required
def list_staff():
    query = PlatformStaff.query.order_by(PlatformStaff.created_at.desc())
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    staff_type = request.args.get('staff_type', '')

    if search:
        query = query.filter(
            db.or_(
                PlatformStaff.first_name.ilike(f'%{search}%'),
                PlatformStaff.last_name.ilike(f'%{search}%'),
                PlatformStaff.email.ilike(f'%{search}%'),
                PlatformStaff.employee_id.ilike(f'%{search}%'),
            )
        )
    if status:
        query = query.filter_by(status=status)
    if staff_type:
        query = query.filter_by(staff_type=staff_type)

    return success_response(paginate(query))


@staff_bp.route('/<int:staff_id>', methods=['GET'])
@super_admin_required
def get_staff(staff_id):
    staff = PlatformStaff.query.get_or_404(staff_id)
    data = staff.to_dict()
    data['attendance_summary'] = {
        'present': PlatformStaffAttendance.query.filter_by(staff_id=staff_id, status='present').count(),
        'absent': PlatformStaffAttendance.query.filter_by(staff_id=staff_id, status='absent').count(),
        'late': PlatformStaffAttendance.query.filter_by(staff_id=staff_id, status='late').count(),
        'leave': PlatformStaffAttendance.query.filter_by(staff_id=staff_id, status='leave').count(),
    }
    data['payroll_summary'] = {
        'total_paid': db.session.query(db.func.sum(PlatformStaffPayroll.net_salary)).filter(
            PlatformStaffPayroll.staff_id == staff_id,
            PlatformStaffPayroll.payment_status == 'paid'
        ).scalar() or 0,
        'pending': PlatformStaffPayroll.query.filter_by(staff_id=staff_id, payment_status='pending').count(),
    }
    return success_response(data)


@staff_bp.route('', methods=['POST'])
@super_admin_required
def create_staff():
    data = request.get_json()
    if not data.get('first_name') or not data.get('email'):
        return error_response('First name and email are required', 400)

    if PlatformStaff.query.filter_by(email=data['email']).first():
        return error_response('Staff with this email already exists', 409)

    staff = PlatformStaff(
        employee_id=data.get('employee_id'),
        first_name=data['first_name'],
        last_name=data.get('last_name'),
        gender=data.get('gender'),
        date_of_birth=datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date() if data.get('date_of_birth') else None,
        phone=data.get('phone'),
        email=data['email'],
        qualification=data.get('qualification'),
        experience_years=data.get('experience_years'),
        designation=data.get('designation'),
        department=data.get('department'),
        date_of_joining=datetime.strptime(data['date_of_joining'], '%Y-%m-%d').date() if data.get('date_of_joining') else None,
        salary=data.get('salary'),
        address=data.get('address'),
        city=data.get('city'),
        state=data.get('state'),
        aadhar_no=data.get('aadhar_no'),
        pan_no=data.get('pan_no'),
        bank_name=data.get('bank_name'),
        bank_account_no=data.get('bank_account_no'),
        ifsc_code=data.get('ifsc_code'),
        staff_type=data.get('staff_type', 'admin'),
        contract_type=data.get('contract_type', 'permanent'),
        pf_number=data.get('pf_number'),
        emergency_contact=data.get('emergency_contact'),
        emergency_person=data.get('emergency_person'),
        blood_group=data.get('blood_group'),
        status='active',
    )
    db.session.add(staff)
    db.session.commit()
    return success_response(staff.to_dict(), 'Staff created', 201)


@staff_bp.route('/<int:staff_id>', methods=['PUT'])
@super_admin_required
def update_staff(staff_id):
    staff = PlatformStaff.query.get_or_404(staff_id)
    data = request.get_json()

    updatable = ['first_name', 'last_name', 'gender', 'phone', 'email', 'qualification',
                 'experience_years', 'designation', 'department', 'salary', 'address',
                 'city', 'state', 'aadhar_no', 'pan_no', 'bank_name', 'bank_account_no',
                 'ifsc_code', 'staff_type', 'contract_type', 'pf_number',
                 'emergency_contact', 'emergency_person', 'blood_group', 'status',
                 'employee_id']
    for field in updatable:
        if field in data:
            setattr(staff, field, data[field])

    if data.get('date_of_birth'):
        staff.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
    if data.get('date_of_joining'):
        staff.date_of_joining = datetime.strptime(data['date_of_joining'], '%Y-%m-%d').date()

    db.session.commit()
    return success_response(staff.to_dict(), 'Staff updated')


@staff_bp.route('/<int:staff_id>', methods=['DELETE'])
@super_admin_required
def delete_staff(staff_id):
    staff = PlatformStaff.query.get_or_404(staff_id)
    staff.status = 'inactive'
    db.session.commit()
    return success_response(message='Staff deactivated')


# ─── DASHBOARD ───────────────────────────────────────────────────────────
@staff_bp.route('/dashboard', methods=['GET'])
@super_admin_required
def dashboard():
    total = PlatformStaff.query.count()
    active = PlatformStaff.query.filter_by(status='active').count()
    today = date.today()
    present_today = PlatformStaffAttendance.query.filter_by(date=today, status='present').count()
    pending_payroll = PlatformStaffPayroll.query.filter_by(payment_status='pending').count()
    pending_leaves = PlatformStaffLeave.query.filter_by(status='pending').count()

    return success_response({
        'total': total,
        'active': active,
        'inactive': total - active,
        'present_today': present_today,
        'pending_payroll': pending_payroll,
        'pending_leaves': pending_leaves,
    })


# ─── ATTENDANCE ──────────────────────────────────────────────────────────
@staff_bp.route('/attendance', methods=['GET'])
@super_admin_required
def list_attendance():
    today = date.today()
    from_date = request.args.get('from_date', today.isoformat())
    to_date = request.args.get('to_date', today.isoformat())
    staff_id = request.args.get('staff_id', type=int)

    query = PlatformStaffAttendance.query
    if staff_id:
        query = query.filter_by(staff_id=staff_id)
    query = query.filter(PlatformStaffAttendance.date.between(from_date, to_date))
    query = query.order_by(PlatformStaffAttendance.date.desc(), PlatformStaffAttendance.staff_id)

    records = query.all()
    result = []
    for r in records:
        d = r.to_dict()
        staff = PlatformStaff.query.get(r.staff_id)
        d['staff_name'] = staff.full_name if staff else ''
        d['employee_id'] = staff.employee_id if staff else ''
        result.append(d)
    return success_response(result)


@staff_bp.route('/attendance/mark', methods=['POST'])
@super_admin_required
def mark_attendance():
    data = request.get_json()
    records = data.get('records', [data])
    today = date.today()

    marked = []
    for rec in records:
        att_date = datetime.strptime(rec.get('date', today.isoformat()), '%Y-%m-%d').date()
        existing = PlatformStaffAttendance.query.filter_by(
            staff_id=rec['staff_id'], date=att_date
        ).first()
        if existing:
            existing.status = rec.get('status', existing.status)
            existing.check_in = rec.get('check_in')
            existing.check_out = rec.get('check_out')
            existing.remarks = rec.get('remarks')
        else:
            existing = PlatformStaffAttendance(
                staff_id=rec['staff_id'],
                date=att_date,
                status=rec.get('status', 'present'),
                check_in=rec.get('check_in'),
                check_out=rec.get('check_out'),
                remarks=rec.get('remarks'),
            )
            db.session.add(existing)
        marked.append(existing)
    db.session.commit()
    return success_response([m.to_dict() for m in marked], 'Attendance marked')


@staff_bp.route('/attendance/report', methods=['GET'])
@super_admin_required
def attendance_report():
    from_date = request.args.get('from_date', '')
    to_date = request.args.get('to_date', '')
    month = request.args.get('month', datetime.now().month)
    year = request.args.get('year', datetime.now().year)

    if not from_date or not to_date:
        from_date = date(int(year), int(month), 1).isoformat()
        if int(month) == 12:
            to_date = date(int(year) + 1, 1, 1).isoformat()
        else:
            to_date = date(int(year), int(month) + 1, 1).isoformat()

    staff_list = PlatformStaff.query.filter_by(status='active').all()
    report = []
    for staff in staff_list:
        total = PlatformStaffAttendance.query.filter(
            PlatformStaffAttendance.staff_id == staff.id,
            PlatformStaffAttendance.date.between(from_date, to_date),
        ).count()
        present = PlatformStaffAttendance.query.filter(
            PlatformStaffAttendance.staff_id == staff.id,
            PlatformStaffAttendance.date.between(from_date, to_date),
            PlatformStaffAttendance.status == 'present',
        ).count()
        absent = PlatformStaffAttendance.query.filter(
            PlatformStaffAttendance.staff_id == staff.id,
            PlatformStaffAttendance.date.between(from_date, to_date),
            PlatformStaffAttendance.status == 'absent',
        ).count()
        late = PlatformStaffAttendance.query.filter(
            PlatformStaffAttendance.staff_id == staff.id,
            PlatformStaffAttendance.date.between(from_date, to_date),
            PlatformStaffAttendance.status == 'late',
        ).count()
        report.append({
            'staff_id': staff.id,
            'name': staff.full_name,
            'employee_id': staff.employee_id,
            'designation': staff.designation,
            'total_days': total,
            'present': present,
            'absent': absent,
            'late': late,
            'attendance_pct': round(present / total * 100, 1) if total > 0 else 0,
        })
    report.sort(key=lambda x: x['attendance_pct'])
    return success_response(report)


# ─── PAYROLL ─────────────────────────────────────────────────────────────
@staff_bp.route('/payroll', methods=['GET'])
@super_admin_required
def list_payroll():
    query = PlatformStaffPayroll.query.order_by(PlatformStaffPayroll.year.desc(), PlatformStaffPayroll.month.desc())
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    staff_id = request.args.get('staff_id', type=int)
    status = request.args.get('status', '')

    if month:
        query = query.filter_by(month=month)
    if year:
        query = query.filter_by(year=year)
    if staff_id:
        query = query.filter_by(staff_id=staff_id)
    if status:
        query = query.filter_by(payment_status=status)

    records = query.all()
    result = []
    for r in records:
        d = r.to_dict()
        staff = PlatformStaff.query.get(r.staff_id)
        d['staff_name'] = staff.full_name if staff else ''
        d['employee_id'] = staff.employee_id if staff else ''
        result.append(d)
    return success_response(result)


@staff_bp.route('/payroll/generate', methods=['POST'])
@super_admin_required
def generate_payroll():
    data = request.get_json()
    month = data.get('month', datetime.now().month)
    year = data.get('year', datetime.now().year)

    staff_list = PlatformStaff.query.filter_by(status='active').all()
    created = []
    for staff in staff_list:
        existing = PlatformStaffPayroll.query.filter_by(
            staff_id=staff.id, month=month, year=year
        ).first()
        if existing:
            continue
        salary = float(staff.salary) if staff.salary else 0
        payroll = PlatformStaffPayroll(
            staff_id=staff.id,
            month=month,
            year=year,
            basic_salary=salary,
            allowances=0,
            deductions=0,
            net_salary=salary,
            payment_status='pending',
        )
        db.session.add(payroll)
        created.append(payroll)
    db.session.commit()
    return success_response([p.to_dict() for p in created], f'{len(created)} payroll records generated')


@staff_bp.route('/payroll/<int:payroll_id>', methods=['PUT'])
@super_admin_required
def update_payroll(payroll_id):
    payroll = PlatformStaffPayroll.query.get_or_404(payroll_id)
    data = request.get_json()
    updatable = ['basic_salary', 'allowances', 'deductions', 'payment_status',
                 'payment_date', 'payment_mode', 'transaction_ref', 'remarks',
                 'overtime_amount', 'leave_deduction']
    for field in updatable:
        if field in data:
            setattr(payroll, field, data[field])
    # Recompute net salary
    basic = float(payroll.basic_salary or 0)
    allowances = float(payroll.allowances or 0)
    deductions = float(payroll.deductions or 0)
    overtime = float(payroll.overtime_amount or 0)
    leave_ded = float(payroll.leave_deduction or 0)
    payroll.net_salary = basic + allowances + overtime - deductions - leave_ded
    db.session.commit()
    return success_response(payroll.to_dict(), 'Payroll updated')


# ─── LEAVE ───────────────────────────────────────────────────────────────
@staff_bp.route('/leaves', methods=['GET'])
@super_admin_required
def list_leaves():
    query = PlatformStaffLeave.query.order_by(PlatformStaffLeave.created_at.desc())
    status = request.args.get('status', '')
    staff_id = request.args.get('staff_id', type=int)
    if status:
        query = query.filter_by(status=status)
    if staff_id:
        query = query.filter_by(staff_id=staff_id)

    records = query.all()
    result = []
    for r in records:
        d = r.to_dict()
        staff = PlatformStaff.query.get(r.staff_id)
        d['staff_name'] = staff.full_name if staff else ''
        d['employee_id'] = staff.employee_id if staff else ''
        result.append(d)
    return success_response(result)


@staff_bp.route('/leaves', methods=['POST'])
@super_admin_required
def apply_leave():
    data = request.get_json()
    if not data.get('staff_id') or not data.get('leave_type') or not data.get('from_date') or not data.get('to_date'):
        return error_response('staff_id, leave_type, from_date, to_date are required', 400)

    from_date = datetime.strptime(data['from_date'], '%Y-%m-%d').date()
    to_date = datetime.strptime(data['to_date'], '%Y-%m-%d').date()
    days = (to_date - from_date).days + 1
    if days < 1:
        return error_response('Invalid date range', 400)

    leave = PlatformStaffLeave(
        staff_id=data['staff_id'],
        leave_type=data['leave_type'],
        from_date=from_date,
        to_date=to_date,
        days=days,
        reason=data.get('reason'),
        document_url=data.get('document_url'),
        status='pending',
    )
    db.session.add(leave)
    db.session.commit()
    return success_response(leave.to_dict(), 'Leave applied', 201)


@staff_bp.route('/leaves/<int:leave_id>/approve', methods=['PUT'])
@super_admin_required
def approve_leave(leave_id):
    leave = PlatformStaffLeave.query.get_or_404(leave_id)
    data = request.get_json()
    leave.status = data.get('status', 'approved')
    leave.approved_by = data.get('approved_by')
    leave.approved_at = datetime.utcnow()
    leave.remarks = data.get('remarks')
    db.session.commit()
    return success_response(leave.to_dict(), f'Leave {leave.status}')
