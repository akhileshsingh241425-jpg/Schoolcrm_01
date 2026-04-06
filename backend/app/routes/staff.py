from flask import Blueprint, request, g
from app import db
from app.models.staff import (
    Staff, StaffPayroll, StaffDocument, SalaryStructure,
    StaffLeave, StaffLeaveBalance, PerformanceReview,
    Recruitment, JobApplication, TrainingRecord, DutyRoster
)
from app.models.user import User, Role
from app.utils.decorators import school_required, role_required
from app.utils.helpers import success_response, error_response, paginate
from sqlalchemy.orm import joinedload
from datetime import datetime, date

staff_bp = Blueprint('staff', __name__)


# ─── Staff CRUD ────────────────────────────────────────────

@staff_bp.route('/', methods=['GET'])
@school_required
def list_staff():
    query = Staff.query.filter_by(school_id=g.school_id)

    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)

    department = request.args.get('department')
    if department:
        query = query.filter_by(department=department)

    staff_type = request.args.get('staff_type')
    if staff_type:
        query = query.filter_by(staff_type=staff_type)

    designation = request.args.get('designation')
    if designation:
        query = query.filter_by(designation=designation)

    search = request.args.get('search')
    if search:
        query = query.filter(
            db.or_(
                Staff.first_name.ilike(f'%{search}%'),
                Staff.last_name.ilike(f'%{search}%'),
                Staff.employee_id.ilike(f'%{search}%'),
                Staff.phone.ilike(f'%{search}%')
            )
        )

    query = query.order_by(Staff.created_at.desc())
    return success_response(paginate(query))


@staff_bp.route('/<int:staff_id>', methods=['GET'])
@school_required
def get_staff(staff_id):
    member = Staff.query.filter_by(id=staff_id, school_id=g.school_id).first_or_404()
    return success_response(member.to_dict())


@staff_bp.route('/<int:staff_id>/profile', methods=['GET'])
@school_required
def get_staff_profile(staff_id):
    member = Staff.query.filter_by(id=staff_id, school_id=g.school_id).first_or_404()
    data = member.to_dict()
    # Add documents
    docs = StaffDocument.query.filter_by(staff_id=staff_id, school_id=g.school_id).all()
    data['documents'] = [d.to_dict() for d in docs]
    # Add salary structure
    sal = SalaryStructure.query.filter_by(staff_id=staff_id, school_id=g.school_id, is_active=True).first()
    data['salary_structure'] = sal.to_dict() if sal else None
    # Leave balance
    yr = date.today().year
    lb = StaffLeaveBalance.query.filter_by(staff_id=staff_id, school_id=g.school_id, year=yr).first()
    data['leave_balance'] = lb.to_dict() if lb else None
    # Recent reviews
    reviews = PerformanceReview.query.filter_by(staff_id=staff_id, school_id=g.school_id) \
        .order_by(PerformanceReview.created_at.desc()).limit(3).all()
    data['recent_reviews'] = [r.to_dict() for r in reviews]
    return success_response(data)


@staff_bp.route('/', methods=['POST'])
@role_required('school_admin')
def create_staff():
    data = request.get_json()
    if not data.get('first_name'):
        return error_response('First name is required')

    member = Staff(
        school_id=g.school_id,
        employee_id=data.get('employee_id'),
        first_name=data['first_name'],
        last_name=data.get('last_name'),
        gender=data.get('gender'),
        date_of_birth=data.get('date_of_birth'),
        phone=data.get('phone'),
        email=data.get('email'),
        qualification=data.get('qualification'),
        experience_years=data.get('experience_years'),
        designation=data.get('designation'),
        department=data.get('department'),
        date_of_joining=data.get('date_of_joining'),
        salary=data.get('salary'),
        address=data.get('address'),
        city=data.get('city'),
        state=data.get('state'),
        aadhar_no=data.get('aadhar_no'),
        pan_no=data.get('pan_no'),
        bank_name=data.get('bank_name'),
        bank_account_no=data.get('bank_account_no'),
        ifsc_code=data.get('ifsc_code'),
        staff_type=data.get('staff_type', 'teaching'),
        contract_type=data.get('contract_type', 'permanent'),
        probation_end_date=data.get('probation_end_date'),
        contract_end_date=data.get('contract_end_date'),
        pf_number=data.get('pf_number'),
        esi_number=data.get('esi_number'),
        uan_number=data.get('uan_number'),
        emergency_contact=data.get('emergency_contact'),
        emergency_person=data.get('emergency_person'),
        blood_group=data.get('blood_group'),
        marital_status=data.get('marital_status'),
        spouse_name=data.get('spouse_name'),
    )
    db.session.add(member)
    db.session.flush()

    # Create user account if email provided
    if data.get('email') and data.get('create_login', False):
        role_name = data.get('role', 'teacher')
        role = Role.query.filter_by(name=role_name).first()
        if role:
            user = User(
                school_id=g.school_id,
                role_id=role.id,
                email=data['email'],
                first_name=data['first_name'],
                last_name=data.get('last_name', ''),
                phone=data.get('phone')
            )
            user.set_password(data.get('password', 'Welcome@123'))
            db.session.add(user)
            db.session.flush()
            member.user_id = user.id

    # Initialize leave balance
    yr = date.today().year
    lb = StaffLeaveBalance(
        staff_id=member.id, school_id=g.school_id, year=yr,
        cl_total=12, el_total=15, sl_total=10
    )
    db.session.add(lb)

    db.session.commit()
    return success_response(member.to_dict(), 'Staff member created', 201)


@staff_bp.route('/<int:staff_id>', methods=['PUT'])
@role_required('school_admin')
def update_staff(staff_id):
    member = Staff.query.filter_by(id=staff_id, school_id=g.school_id).first_or_404()
    data = request.get_json()

    updatable = ['first_name', 'last_name', 'gender', 'phone', 'email',
                 'qualification', 'experience_years', 'designation', 'department',
                 'salary', 'address', 'city', 'state', 'photo_url', 'status',
                 'bank_name', 'bank_account_no', 'ifsc_code', 'aadhar_no', 'pan_no',
                 'staff_type', 'contract_type', 'probation_end_date', 'contract_end_date',
                 'pf_number', 'esi_number', 'uan_number', 'emergency_contact',
                 'emergency_person', 'blood_group', 'marital_status', 'spouse_name']

    for field in updatable:
        if field in data:
            setattr(member, field, data[field])

    db.session.commit()
    return success_response(member.to_dict(), 'Staff updated')


# ─── HR Dashboard ──────────────────────────────────────────

@staff_bp.route('/dashboard', methods=['GET'])
@school_required
def hr_dashboard():
    sid = g.school_id
    total = Staff.query.filter_by(school_id=sid).count()
    active = Staff.query.filter_by(school_id=sid, status='active').count()
    teaching = Staff.query.filter_by(school_id=sid, staff_type='teaching', status='active').count()
    non_teaching = Staff.query.filter_by(school_id=sid, status='active').filter(Staff.staff_type != 'teaching').count()

    # Pending leaves
    pending_leaves = StaffLeave.query.filter_by(school_id=sid, status='pending').count()

    # Pending payroll this month
    now = date.today()
    pending_payroll = StaffPayroll.query.filter_by(
        school_id=sid, month=now.month, year=now.year, payment_status='pending'
    ).count()

    # Open positions
    open_positions = Recruitment.query.filter_by(school_id=sid, status='open').count()

    # Department wise count
    dept_counts = db.session.query(
        Staff.department, db.func.count(Staff.id)
    ).filter_by(school_id=sid, status='active').group_by(Staff.department).all()

    # Contract expiring in 30 days
    from datetime import timedelta
    expiring = Staff.query.filter(
        Staff.school_id == sid,
        Staff.contract_end_date != None,
        Staff.contract_end_date <= now + timedelta(days=30),
        Staff.contract_end_date >= now,
        Staff.status == 'active'
    ).count()

    return success_response({
        'total_staff': total,
        'active_staff': active,
        'teaching_staff': teaching,
        'non_teaching_staff': non_teaching,
        'pending_leaves': pending_leaves,
        'pending_payroll': pending_payroll,
        'open_positions': open_positions,
        'contracts_expiring': expiring,
        'department_wise': [{'department': d or 'Unassigned', 'count': c} for d, c in dept_counts],
    })


# ─── Staff Documents ──────────────────────────────────────

@staff_bp.route('/<int:staff_id>/documents', methods=['GET'])
@school_required
def list_documents(staff_id):
    docs = StaffDocument.query.filter_by(staff_id=staff_id, school_id=g.school_id).all()
    return success_response([d.to_dict() for d in docs])


@staff_bp.route('/<int:staff_id>/documents', methods=['POST'])
@role_required('school_admin')
def add_document(staff_id):
    Staff.query.filter_by(id=staff_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    doc = StaffDocument(
        staff_id=staff_id, school_id=g.school_id,
        document_type=data['document_type'],
        document_name=data.get('document_name'),
        file_url=data.get('file_url'),
    )
    db.session.add(doc)
    db.session.commit()
    return success_response(doc.to_dict(), 'Document added', 201)


@staff_bp.route('/documents/<int:doc_id>/verify', methods=['PUT'])
@role_required('school_admin')
def verify_document(doc_id):
    doc = StaffDocument.query.filter_by(id=doc_id, school_id=g.school_id).first_or_404()
    doc.verified = True
    doc.verified_by = g.current_user.id
    doc.verified_at = datetime.utcnow()
    db.session.commit()
    return success_response(doc.to_dict(), 'Document verified')


@staff_bp.route('/documents/<int:doc_id>', methods=['DELETE'])
@role_required('school_admin')
def delete_document(doc_id):
    doc = StaffDocument.query.filter_by(id=doc_id, school_id=g.school_id).first_or_404()
    db.session.delete(doc)
    db.session.commit()
    return success_response(None, 'Document deleted')


# ─── Salary Structure ─────────────────────────────────────

@staff_bp.route('/salary-structures', methods=['GET'])
@role_required('school_admin')
def list_salary_structures():
    query = SalaryStructure.query.filter_by(school_id=g.school_id)
    staff_id = request.args.get('staff_id', type=int)
    if staff_id:
        query = query.filter_by(staff_id=staff_id)
    active_only = request.args.get('active_only')
    if active_only:
        query = query.filter_by(is_active=True)
    structs = query.all()
    return success_response([s.to_dict() for s in structs])


@staff_bp.route('/salary-structures', methods=['POST'])
@role_required('school_admin')
def create_salary_structure():
    data = request.get_json()
    staff_id = data['staff_id']
    Staff.query.filter_by(id=staff_id, school_id=g.school_id).first_or_404()
    # Deactivate existing
    SalaryStructure.query.filter_by(staff_id=staff_id, school_id=g.school_id, is_active=True) \
        .update({'is_active': False})
    ss = SalaryStructure(
        staff_id=staff_id, school_id=g.school_id,
        basic_salary=data.get('basic_salary', 0),
        hra=data.get('hra', 0), da=data.get('da', 0), ta=data.get('ta', 0),
        medical_allowance=data.get('medical_allowance', 0),
        special_allowance=data.get('special_allowance', 0),
        other_allowance=data.get('other_allowance', 0),
        pf_deduction=data.get('pf_deduction', 0),
        esi_deduction=data.get('esi_deduction', 0),
        tds=data.get('tds', 0),
        professional_tax=data.get('professional_tax', 0),
        other_deduction=data.get('other_deduction', 0),
        effective_from=data.get('effective_from'),
        is_active=True,
    )
    db.session.add(ss)
    db.session.commit()
    return success_response(ss.to_dict(), 'Salary structure created', 201)


@staff_bp.route('/salary-structures/<int:ss_id>', methods=['PUT'])
@role_required('school_admin')
def update_salary_structure(ss_id):
    ss = SalaryStructure.query.filter_by(id=ss_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for f in ['basic_salary', 'hra', 'da', 'ta', 'medical_allowance', 'special_allowance',
              'other_allowance', 'pf_deduction', 'esi_deduction', 'tds', 'professional_tax',
              'other_deduction', 'effective_from', 'is_active']:
        if f in data:
            setattr(ss, f, data[f])
    db.session.commit()
    return success_response(ss.to_dict(), 'Salary structure updated')


# ─── Payroll ───────────────────────────────────────────────

@staff_bp.route('/payroll', methods=['GET'])
@role_required('school_admin')
def list_payroll():
    query = StaffPayroll.query.options(
        joinedload(StaffPayroll.staff)
    ).filter_by(school_id=g.school_id)

    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)
    if month:
        query = query.filter_by(month=month)
    if year:
        query = query.filter_by(year=year)

    status = request.args.get('status')
    if status:
        query = query.filter_by(payment_status=status)

    query = query.order_by(StaffPayroll.created_at.desc())
    return success_response(paginate(query))


@staff_bp.route('/payroll/generate', methods=['POST'])
@role_required('school_admin')
def generate_payroll():
    data = request.get_json()
    month = data['month']
    year = data['year']

    staff_list = Staff.query.filter_by(school_id=g.school_id, status='active').all()
    generated = 0

    for member in staff_list:
        existing = StaffPayroll.query.filter_by(
            staff_id=member.id, school_id=g.school_id, month=month, year=year
        ).first()
        if existing:
            continue

        ss = SalaryStructure.query.filter_by(
            staff_id=member.id, school_id=g.school_id, is_active=True
        ).first()

        if ss:
            basic = float(ss.basic_salary or 0)
            hra = float(ss.hra or 0)
            da_val = float(ss.da or 0)
            ta_val = float(ss.ta or 0)
            med = float(ss.medical_allowance or 0)
            spec = float(ss.special_allowance or 0)
            oth_a = float(ss.other_allowance or 0)
            gross = basic + hra + da_val + ta_val + med + spec + oth_a

            pf = float(ss.pf_deduction or 0)
            esi = float(ss.esi_deduction or 0)
            tds_val = float(ss.tds or 0)
            pt = float(ss.professional_tax or 0)
            oth_d = float(ss.other_deduction or 0)
            total_ded = pf + esi + tds_val + pt + oth_d

            net = gross - total_ded
        else:
            basic = float(member.salary or 0)
            gross = basic
            total_ded = 0
            net = basic
            hra = da_val = ta_val = med = spec = oth_a = 0
            pf = esi = tds_val = pt = oth_d = 0

        payroll = StaffPayroll(
            staff_id=member.id, school_id=g.school_id,
            month=month, year=year,
            basic_salary=basic, hra=hra, da=da_val, ta=ta_val,
            medical_allowance=med, special_allowance=spec,
            other_allowance=oth_a, gross_salary=gross,
            pf_deduction=pf, esi_deduction=esi, tds=tds_val,
            professional_tax=pt, other_deduction=oth_d,
            total_deductions=total_ded,
            allowances=gross - basic, deductions=total_ded,
            net_salary=net, payment_status='pending',
        )
        db.session.add(payroll)
        generated += 1

    db.session.commit()
    return success_response({'generated': generated}, f'Payroll generated for {generated} staff')


@staff_bp.route('/payroll/<int:payroll_id>', methods=['PUT'])
@role_required('school_admin')
def update_payroll(payroll_id):
    pr = StaffPayroll.query.filter_by(id=payroll_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for f in ['payment_status', 'payment_date', 'payment_mode', 'transaction_ref',
              'remarks', 'overtime_hours', 'overtime_amount', 'leave_deduction']:
        if f in data:
            setattr(pr, f, data[f])
    if 'leave_deduction' in data or 'overtime_amount' in data:
        pr.net_salary = float(pr.gross_salary or 0) - float(pr.total_deductions or 0) - \
                        float(pr.leave_deduction or 0) + float(pr.overtime_amount or 0)
    db.session.commit()
    return success_response(pr.to_dict(), 'Payroll updated')


@staff_bp.route('/payroll', methods=['POST'])
@role_required('school_admin')
def create_payroll():
    data = request.get_json()
    payroll = StaffPayroll(
        staff_id=data['staff_id'], school_id=g.school_id,
        month=data['month'], year=data['year'],
        basic_salary=data.get('basic_salary'),
        allowances=data.get('allowances', 0),
        deductions=data.get('deductions', 0),
        net_salary=data.get('net_salary'),
        gross_salary=data.get('gross_salary', data.get('basic_salary', 0)),
        total_deductions=data.get('deductions', 0),
        payment_status=data.get('payment_status', 'pending')
    )
    db.session.add(payroll)
    db.session.commit()
    return success_response(payroll.to_dict(), 'Payroll entry created', 201)


# ─── Staff Leave ───────────────────────────────────────────

@staff_bp.route('/leaves', methods=['GET'])
@school_required
def list_leaves():
    query = StaffLeave.query.options(
        joinedload(StaffLeave.staff)
    ).filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    staff_id = request.args.get('staff_id', type=int)
    if staff_id:
        query = query.filter_by(staff_id=staff_id)
    query = query.order_by(StaffLeave.created_at.desc())
    return success_response(paginate(query))


@staff_bp.route('/leaves', methods=['POST'])
@school_required
def apply_leave():
    data = request.get_json()
    leave = StaffLeave(
        staff_id=data['staff_id'], school_id=g.school_id,
        leave_type=data['leave_type'],
        from_date=data['from_date'], to_date=data['to_date'],
        days=data['days'], reason=data.get('reason'),
        document_url=data.get('document_url'),
    )
    db.session.add(leave)
    db.session.commit()
    return success_response(leave.to_dict(), 'Leave applied', 201)


@staff_bp.route('/leaves/<int:leave_id>/approve', methods=['PUT'])
@role_required('school_admin')
def approve_leave(leave_id):
    leave = StaffLeave.query.filter_by(id=leave_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    action = data.get('action', 'approved')
    leave.status = action
    leave.approved_by = g.current_user.id
    leave.approved_at = datetime.utcnow()
    leave.remarks = data.get('remarks')

    if action == 'approved':
        yr = leave.from_date.year if isinstance(leave.from_date, date) else date.today().year
        lb = StaffLeaveBalance.query.filter_by(
            staff_id=leave.staff_id, school_id=g.school_id, year=yr
        ).first()
        if lb:
            lt = leave.leave_type.upper()
            days = int(leave.days)
            if lt == 'CL':
                lb.cl_used = (lb.cl_used or 0) + days
            elif lt == 'EL':
                lb.el_used = (lb.el_used or 0) + days
            elif lt == 'SL':
                lb.sl_used = (lb.sl_used or 0) + days
            elif lt == 'ML':
                lb.ml_used = (lb.ml_used or 0) + days

    db.session.commit()
    return success_response(leave.to_dict(), f'Leave {action}')


@staff_bp.route('/leave-balance', methods=['GET'])
@school_required
def get_leave_balance():
    staff_id = request.args.get('staff_id', type=int)
    yr = request.args.get('year', type=int, default=date.today().year)
    if staff_id:
        lb = StaffLeaveBalance.query.filter_by(staff_id=staff_id, school_id=g.school_id, year=yr).first()
        return success_response(lb.to_dict() if lb else None)
    lbs = StaffLeaveBalance.query.filter_by(school_id=g.school_id, year=yr).all()
    result = []
    for lb in lbs:
        d = lb.to_dict()
        s = Staff.query.get(lb.staff_id)
        d['staff_name'] = f"{s.first_name} {s.last_name or ''}".strip() if s else ''
        result.append(d)
    return success_response(result)


@staff_bp.route('/leave-balance', methods=['POST'])
@role_required('school_admin')
def set_leave_balance():
    data = request.get_json()
    staff_id = data['staff_id']
    yr = data.get('year', date.today().year)
    lb = StaffLeaveBalance.query.filter_by(staff_id=staff_id, school_id=g.school_id, year=yr).first()
    if not lb:
        lb = StaffLeaveBalance(staff_id=staff_id, school_id=g.school_id, year=yr)
        db.session.add(lb)
    for f in ['cl_total', 'el_total', 'sl_total', 'ml_total', 'cl_used', 'el_used', 'sl_used', 'ml_used']:
        if f in data:
            setattr(lb, f, data[f])
    db.session.commit()
    return success_response(lb.to_dict(), 'Leave balance updated')


# ─── Performance Reviews ──────────────────────────────────

@staff_bp.route('/reviews', methods=['GET'])
@school_required
def list_reviews():
    query = PerformanceReview.query.options(
        joinedload(PerformanceReview.staff)
    ).filter_by(school_id=g.school_id)
    staff_id = request.args.get('staff_id', type=int)
    if staff_id:
        query = query.filter_by(staff_id=staff_id)
    review_type = request.args.get('review_type')
    if review_type:
        query = query.filter_by(review_type=review_type)
    query = query.order_by(PerformanceReview.created_at.desc())
    return success_response(paginate(query))


@staff_bp.route('/reviews', methods=['POST'])
@role_required('school_admin')
def create_review():
    data = request.get_json()
    ratings = [data.get(f, 0) or 0 for f in
               ['teaching_rating', 'punctuality_rating', 'communication_rating',
                'knowledge_rating', 'teamwork_rating']]
    valid = [r for r in ratings if r > 0]
    overall = sum(valid) / len(valid) if valid else 0

    review = PerformanceReview(
        staff_id=data['staff_id'], school_id=g.school_id,
        review_period=data.get('review_period'),
        reviewer_id=g.current_user.id,
        review_type=data.get('review_type', 'annual'),
        teaching_rating=data.get('teaching_rating'),
        punctuality_rating=data.get('punctuality_rating'),
        communication_rating=data.get('communication_rating'),
        knowledge_rating=data.get('knowledge_rating'),
        teamwork_rating=data.get('teamwork_rating'),
        overall_rating=round(overall, 1),
        strengths=data.get('strengths'),
        improvements=data.get('improvements'),
        goals=data.get('goals'),
        comments=data.get('comments'),
        status=data.get('status', 'submitted'),
    )
    db.session.add(review)
    db.session.commit()
    return success_response(review.to_dict(), 'Review submitted', 201)


@staff_bp.route('/reviews/<int:rev_id>', methods=['PUT'])
@role_required('school_admin')
def update_review(rev_id):
    review = PerformanceReview.query.filter_by(id=rev_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for f in ['teaching_rating', 'punctuality_rating', 'communication_rating',
              'knowledge_rating', 'teamwork_rating', 'strengths', 'improvements',
              'goals', 'comments', 'status']:
        if f in data:
            setattr(review, f, data[f])
    ratings = [review.teaching_rating or 0, review.punctuality_rating or 0,
               review.communication_rating or 0, review.knowledge_rating or 0,
               review.teamwork_rating or 0]
    valid = [r for r in ratings if r > 0]
    review.overall_rating = round(sum(valid) / len(valid), 1) if valid else 0
    db.session.commit()
    return success_response(review.to_dict(), 'Review updated')


# ─── Recruitment ───────────────────────────────────────────

@staff_bp.route('/recruitment', methods=['GET'])
@school_required
def list_recruitment():
    query = Recruitment.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(Recruitment.created_at.desc())
    return success_response(paginate(query))


@staff_bp.route('/recruitment', methods=['POST'])
@role_required('school_admin')
def create_recruitment():
    data = request.get_json()
    rec = Recruitment(
        school_id=g.school_id,
        job_title=data['job_title'],
        department=data.get('department'),
        designation=data.get('designation'),
        vacancies=data.get('vacancies', 1),
        description=data.get('description'),
        requirements=data.get('requirements'),
        salary_range=data.get('salary_range'),
        application_deadline=data.get('application_deadline'),
    )
    db.session.add(rec)
    db.session.commit()
    return success_response(rec.to_dict(), 'Job posting created', 201)


@staff_bp.route('/recruitment/<int:rec_id>', methods=['PUT'])
@role_required('school_admin')
def update_recruitment(rec_id):
    rec = Recruitment.query.filter_by(id=rec_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for f in ['job_title', 'department', 'designation', 'vacancies', 'description',
              'requirements', 'salary_range', 'application_deadline', 'status']:
        if f in data:
            setattr(rec, f, data[f])
    db.session.commit()
    return success_response(rec.to_dict(), 'Job posting updated')


@staff_bp.route('/recruitment/<int:rec_id>/applications', methods=['GET'])
@school_required
def list_applications(rec_id):
    query = JobApplication.query.options(
        joinedload(JobApplication.recruitment)
    ).filter_by(recruitment_id=rec_id, school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(JobApplication.created_at.desc())
    return success_response(paginate(query))


@staff_bp.route('/recruitment/<int:rec_id>/applications', methods=['POST'])
@role_required('school_admin')
def add_application(rec_id):
    Recruitment.query.filter_by(id=rec_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    application = JobApplication(
        recruitment_id=rec_id, school_id=g.school_id,
        applicant_name=data['applicant_name'],
        email=data.get('email'), phone=data.get('phone'),
        qualification=data.get('qualification'),
        experience_years=data.get('experience_years'),
        resume_url=data.get('resume_url'),
        cover_letter=data.get('cover_letter'),
    )
    db.session.add(application)
    db.session.commit()
    return success_response(application.to_dict(), 'Application added', 201)


@staff_bp.route('/applications/<int:app_id>', methods=['PUT'])
@role_required('school_admin')
def update_application(app_id):
    application = JobApplication.query.filter_by(id=app_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for f in ['status', 'interview_date', 'interview_notes', 'rating']:
        if f in data:
            setattr(application, f, data[f])
    db.session.commit()
    return success_response(application.to_dict(), 'Application updated')


# ─── Training / Professional Development ──────────────────

@staff_bp.route('/trainings', methods=['GET'])
@school_required
def list_trainings():
    query = TrainingRecord.query.filter_by(school_id=g.school_id)
    staff_id = request.args.get('staff_id', type=int)
    if staff_id:
        query = query.filter_by(staff_id=staff_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(TrainingRecord.created_at.desc())
    return success_response(paginate(query))


@staff_bp.route('/trainings', methods=['POST'])
@role_required('school_admin')
def create_training():
    data = request.get_json()
    tr = TrainingRecord(
        staff_id=data['staff_id'], school_id=g.school_id,
        training_name=data['training_name'],
        training_type=data.get('training_type'),
        provider=data.get('provider'),
        start_date=data.get('start_date'),
        end_date=data.get('end_date'),
        hours=data.get('hours'),
        cpd_points=data.get('cpd_points', 0),
        certificate_url=data.get('certificate_url'),
        status=data.get('status', 'upcoming'),
        remarks=data.get('remarks'),
    )
    db.session.add(tr)
    db.session.commit()
    return success_response(tr.to_dict(), 'Training record created', 201)


@staff_bp.route('/trainings/<int:tr_id>', methods=['PUT'])
@role_required('school_admin')
def update_training(tr_id):
    tr = TrainingRecord.query.filter_by(id=tr_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for f in ['training_name', 'training_type', 'provider', 'start_date',
              'end_date', 'hours', 'cpd_points', 'certificate_url', 'status', 'remarks']:
        if f in data:
            setattr(tr, f, data[f])
    db.session.commit()
    return success_response(tr.to_dict(), 'Training updated')


# ─── Duty Roster ──────────────────────────────────────────

@staff_bp.route('/duties', methods=['GET'])
@school_required
def list_duties():
    query = DutyRoster.query.filter_by(school_id=g.school_id)
    staff_id = request.args.get('staff_id', type=int)
    if staff_id:
        query = query.filter_by(staff_id=staff_id)
    duty_type = request.args.get('duty_type')
    if duty_type:
        query = query.filter_by(duty_type=duty_type)
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')
    if from_date:
        query = query.filter(DutyRoster.duty_date >= from_date)
    if to_date:
        query = query.filter(DutyRoster.duty_date <= to_date)
    query = query.order_by(DutyRoster.duty_date.desc())
    return success_response(paginate(query))


@staff_bp.route('/duties', methods=['POST'])
@role_required('school_admin')
def create_duty():
    data = request.get_json()
    duty = DutyRoster(
        staff_id=data['staff_id'], school_id=g.school_id,
        duty_type=data['duty_type'],
        duty_date=data['duty_date'],
        start_time=data.get('start_time'),
        end_time=data.get('end_time'),
        location=data.get('location'),
        notes=data.get('notes'),
    )
    db.session.add(duty)
    db.session.commit()
    return success_response(duty.to_dict(), 'Duty assigned', 201)


@staff_bp.route('/duties/<int:duty_id>', methods=['PUT'])
@role_required('school_admin')
def update_duty(duty_id):
    duty = DutyRoster.query.filter_by(id=duty_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for f in ['staff_id', 'duty_type', 'duty_date', 'start_time', 'end_time',
              'location', 'notes', 'status']:
        if f in data:
            setattr(duty, f, data[f])
    db.session.commit()
    return success_response(duty.to_dict(), 'Duty updated')


@staff_bp.route('/duties/<int:duty_id>', methods=['DELETE'])
@role_required('school_admin')
def delete_duty(duty_id):
    duty = DutyRoster.query.filter_by(id=duty_id, school_id=g.school_id).first_or_404()
    db.session.delete(duty)
    db.session.commit()
    return success_response(None, 'Duty deleted')


# ─── Exit Process ─────────────────────────────────────────

@staff_bp.route('/<int:staff_id>/exit', methods=['POST'])
@role_required('school_admin')
def initiate_exit(staff_id):
    member = Staff.query.filter_by(id=staff_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    member.status = 'on_notice'
    member.exit_date = data.get('exit_date')
    member.exit_reason = data.get('exit_reason')
    db.session.commit()
    return success_response(member.to_dict(), 'Exit process initiated')


@staff_bp.route('/<int:staff_id>/exit/complete', methods=['POST'])
@role_required('school_admin')
def complete_exit(staff_id):
    member = Staff.query.filter_by(id=staff_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    member.status = data.get('final_status', 'resigned')
    if data.get('exit_date'):
        member.exit_date = data['exit_date']
    db.session.commit()
    return success_response(member.to_dict(), 'Exit completed')


# ─── Workload Dashboard ──────────────────────────────────

@staff_bp.route('/workload', methods=['GET'])
@school_required
def workload_dashboard():
    from app.models.academic import Timetable, TeacherSubject
    teachers = Staff.query.filter_by(
        school_id=g.school_id, staff_type='teaching', status='active'
    ).all()

    result = []
    for t in teachers:
        periods = Timetable.query.filter_by(teacher_id=t.id, school_id=g.school_id).count()
        subjects = TeacherSubject.query.filter_by(teacher_id=t.id, school_id=g.school_id).count()
        result.append({
            'staff_id': t.id,
            'name': f"{t.first_name} {t.last_name or ''}".strip(),
            'designation': t.designation,
            'department': t.department,
            'periods_per_week': periods,
            'subjects_count': subjects,
        })

    result.sort(key=lambda x: x['periods_per_week'], reverse=True)
    return success_response(result)
