from flask import Blueprint, request, g
from app import db
from app.models.admission import (
    Admission, AdmissionDocument, AdmissionStatusHistory,
    SeatMatrix, AdmissionWaitlist, AdmissionTest, AdmissionTestResult,
    AdmissionSettings, TransferCertificate
)
from app.models.student import Student, Class, Section, AcademicYear, ParentDetail
from app.utils.decorators import school_required, role_required, feature_required
from app.utils.helpers import success_response, error_response, paginate
from datetime import datetime, date
from sqlalchemy import func, or_
from sqlalchemy.orm import joinedload, subqueryload
import os
import uuid

admissions_bp = Blueprint('admissions', __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads', 'admissions')


def generate_application_no(school_id):
    """Generate unique application number"""
    settings = AdmissionSettings.query.filter_by(school_id=school_id).first()
    prefix = settings.application_no_prefix if settings else 'APP'
    year = date.today().year
    count = Admission.query.filter_by(school_id=school_id).filter(
        func.year(Admission.created_at) == year
    ).count()
    return f"{prefix}-{year}-{str(count + 1).zfill(5)}"


def check_age_eligibility(dob, class_id, school_id):
    """Check if student meets age requirement for the class"""
    if not dob:
        return True, None
    settings = AdmissionSettings.query.filter_by(school_id=school_id).first()
    if not settings or not settings.age_verification_enabled or not settings.min_age_rules:
        return True, None
    cls = Class.query.get(class_id)
    if not cls or not cls.numeric_name:
        return True, None
    min_age = settings.min_age_rules.get(str(cls.numeric_name))
    if not min_age:
        return True, None
    today = date.today()
    age = (today - dob).days / 365.25
    if age < float(min_age):
        return False, f"Student age ({age:.1f} years) is below minimum ({min_age} years) for {cls.name}"
    return True, None


def check_duplicate_aadhar(aadhar_no, school_id, exclude_id=None):
    """Check if Aadhaar already exists"""
    if not aadhar_no:
        return False
    query = Admission.query.filter_by(school_id=school_id, aadhar_no=aadhar_no)
    if exclude_id:
        query = query.filter(Admission.id != exclude_id)
    query = query.filter(Admission.status.notin_(['rejected', 'cancelled']))
    return query.first() is not None


def add_status_history(admission_id, from_status, to_status, user_id, remarks=None):
    """Log status change"""
    history = AdmissionStatusHistory(
        admission_id=admission_id,
        from_status=from_status,
        to_status=to_status,
        changed_by=user_id,
        remarks=remarks
    )
    db.session.add(history)


def detect_sibling(admission):
    """Auto-detect sibling based on parent phone/aadhaar"""
    if not admission.father_phone and not admission.father_aadhar:
        return
    query = Student.query.filter_by(school_id=admission.school_id, status='active')
    existing = None
    if admission.father_phone:
        parent = ParentDetail.query.filter_by(
            school_id=admission.school_id, phone=admission.father_phone, relation='father'
        ).first()
        if parent:
            existing = Student.query.get(parent.student_id)
    if existing:
        admission.has_sibling = True
        admission.sibling_name = existing.first_name + ' ' + (existing.last_name or '')
        admission.sibling_admission_no = existing.admission_no


# ======================== SETTINGS ========================

@admissions_bp.route('/settings', methods=['GET'])
@school_required
@feature_required('admission')
def get_settings():
    settings = AdmissionSettings.query.filter_by(school_id=g.school_id).first()
    if not settings:
        settings = AdmissionSettings(
            school_id=g.school_id,
            required_documents=['birth_certificate', 'aadhaar', 'photo', 'tc', 'marksheet']
        )
        db.session.add(settings)
        db.session.commit()
    return success_response(settings.to_dict())


@admissions_bp.route('/settings', methods=['PUT'])
@role_required('school_admin')
def update_settings():
    data = request.get_json()
    settings = AdmissionSettings.query.filter_by(school_id=g.school_id).first()
    if not settings:
        settings = AdmissionSettings(school_id=g.school_id)
        db.session.add(settings)

    updatable = [
        'academic_year_id', 'application_start_date', 'application_end_date',
        'admission_open', 'auto_application_no', 'application_no_prefix',
        'entrance_test_required', 'document_verification_required',
        'age_verification_enabled', 'min_age_rules', 'required_documents',
        'admission_fee_required', 'admission_fee_amount',
        'notification_email', 'notification_sms'
    ]
    for field in updatable:
        if field in data:
            setattr(settings, field, data[field])

    db.session.commit()
    return success_response(settings.to_dict(), 'Settings updated')


# ======================== APPLICATIONS CRUD ========================

@admissions_bp.route('/', methods=['GET'])
@school_required
@feature_required('admission')
def list_admissions():
    query = Admission.query.options(
        joinedload(Admission.applied_class)
    ).filter_by(school_id=g.school_id)

    # Filters
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)

    class_id = request.args.get('class_id', type=int)
    if class_id:
        query = query.filter_by(class_applied=class_id)

    source = request.args.get('source')
    if source:
        query = query.filter_by(application_source=source)

    priority = request.args.get('priority')
    if priority:
        query = query.filter_by(priority=priority)

    academic_year_id = request.args.get('academic_year_id', type=int)
    if academic_year_id:
        query = query.filter_by(academic_year_id=academic_year_id)

    date_from = request.args.get('date_from')
    if date_from:
        query = query.filter(Admission.application_date >= date_from)

    date_to = request.args.get('date_to')
    if date_to:
        query = query.filter(Admission.application_date <= date_to)

    # Search
    search = request.args.get('search', '').strip()
    if search:
        search_filter = f"%{search}%"
        query = query.filter(or_(
            Admission.student_name.ilike(search_filter),
            Admission.application_no.ilike(search_filter),
            Admission.father_name.ilike(search_filter),
            Admission.phone.ilike(search_filter),
            Admission.email.ilike(search_filter),
            Admission.aadhar_no.ilike(search_filter),
        ))

    # Sort
    sort = request.args.get('sort', 'created_at')
    order = request.args.get('order', 'desc')
    sort_col = getattr(Admission, sort, Admission.created_at)
    query = query.order_by(sort_col.desc() if order == 'desc' else sort_col.asc())

    # Paginate
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return success_response({
        'items': [a.to_list_dict() for a in pagination.items],
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev,
    })


@admissions_bp.route('/<int:admission_id>', methods=['GET'])
@school_required
@feature_required('admission')
def get_admission(admission_id):
    admission = Admission.query.options(
        joinedload(Admission.applied_class),
    ).filter_by(id=admission_id, school_id=g.school_id).first_or_404()
    return success_response(admission.to_dict(include_documents=True, include_history=True))


@admissions_bp.route('/', methods=['POST'])
@school_required
@feature_required('admission')
def create_admission():
    data = request.get_json()
    if not data.get('student_name'):
        return error_response('Student name is required')

    # Check admission open
    settings = AdmissionSettings.query.filter_by(school_id=g.school_id).first()
    if settings and not settings.admission_open:
        return error_response('Admissions are currently closed')

    # Check date window
    if settings and settings.application_end_date:
        if date.today() > settings.application_end_date:
            return error_response('Application deadline has passed')

    # Parse DOB and check age
    dob = None
    if data.get('date_of_birth'):
        try:
            dob = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
        except ValueError:
            return error_response('Invalid date of birth format. Use YYYY-MM-DD')

    if data.get('class_applied') and dob:
        eligible, msg = check_age_eligibility(dob, data['class_applied'], g.school_id)
        if not eligible:
            return error_response(msg)

    # Check duplicate Aadhaar
    if data.get('aadhar_no'):
        if check_duplicate_aadhar(data['aadhar_no'], g.school_id):
            return error_response('An application with this Aadhaar number already exists')

    # Check seat availability
    if data.get('class_applied'):
        seat = SeatMatrix.query.filter_by(
            school_id=g.school_id, class_id=data['class_applied']
        ).first()
        if seat and seat.available_seats <= 0:
            data['_auto_waitlist'] = True

    # Generate application number
    app_no = generate_application_no(g.school_id)

    admission = Admission(
        school_id=g.school_id,
        application_no=app_no,
        lead_id=data.get('lead_id'),
        student_name=data['student_name'],
        date_of_birth=dob,
        gender=data.get('gender'),
        blood_group=data.get('blood_group'),
        religion=data.get('religion'),
        category=data.get('category'),
        nationality=data.get('nationality', 'Indian'),
        aadhar_no=data.get('aadhar_no'),
        address=data.get('address'),
        city=data.get('city'),
        state=data.get('state'),
        pincode=data.get('pincode'),

        father_name=data.get('father_name'),
        father_phone=data.get('father_phone'),
        father_email=data.get('father_email'),
        father_occupation=data.get('father_occupation'),
        father_income=data.get('father_income'),
        father_aadhar=data.get('father_aadhar'),
        mother_name=data.get('mother_name'),
        mother_phone=data.get('mother_phone'),
        mother_email=data.get('mother_email'),
        mother_occupation=data.get('mother_occupation'),
        guardian_name=data.get('guardian_name'),
        guardian_phone=data.get('guardian_phone'),
        guardian_relation=data.get('guardian_relation'),

        phone=data.get('phone') or data.get('father_phone'),
        email=data.get('email') or data.get('father_email'),
        emergency_contact=data.get('emergency_contact'),

        class_applied=data.get('class_applied'),
        academic_year_id=data.get('academic_year_id'),
        previous_school=data.get('previous_school'),
        previous_class=data.get('previous_class'),
        previous_percentage=data.get('previous_percentage'),
        tc_number=data.get('tc_number'),
        has_sibling=data.get('has_sibling', False),
        sibling_admission_no=data.get('sibling_admission_no'),
        sibling_name=data.get('sibling_name'),

        transport_required=data.get('transport_required', False),
        pickup_address=data.get('pickup_address'),
        medical_conditions=data.get('medical_conditions'),
        allergies=data.get('allergies'),
        disability=data.get('disability'),

        application_source=data.get('application_source', 'walk_in'),
        priority=data.get('priority', 'normal'),
        remarks=data.get('remarks'),
        processed_by=g.current_user.id,
    )

    # Auto-detect sibling
    detect_sibling(admission)

    db.session.add(admission)
    db.session.flush()

    # Add status history
    add_status_history(admission.id, None, 'applied', g.current_user.id, 'Application submitted')

    # Auto-waitlist if no seats
    if data.get('_auto_waitlist'):
        admission.status = 'waitlisted'
        add_status_history(admission.id, 'applied', 'waitlisted', g.current_user.id, 'No seats available, auto-waitlisted')
        wl_count = AdmissionWaitlist.query.filter_by(
            school_id=g.school_id, class_id=data['class_applied'], status='waiting'
        ).count()
        waitlist = AdmissionWaitlist(
            school_id=g.school_id,
            admission_id=admission.id,
            class_id=data['class_applied'],
            academic_year_id=data.get('academic_year_id') or 0,
            position=wl_count + 1,
        )
        db.session.add(waitlist)

    db.session.commit()
    return success_response(admission.to_dict(), 'Application submitted successfully', 201)


@admissions_bp.route('/<int:admission_id>', methods=['PUT'])
@school_required
@feature_required('admission')
def update_admission(admission_id):
    admission = Admission.query.filter_by(id=admission_id, school_id=g.school_id).first_or_404()
    data = request.get_json()

    if admission.status == 'enrolled':
        return error_response('Cannot edit enrolled application')

    # Cannot edit after approval (only admin can)
    if admission.status == 'approved' and g.current_user.role.name not in ('school_admin', 'super_admin'):
        return error_response('Only admin can edit approved applications')

    # DOB age check if class or DOB is changing
    if data.get('date_of_birth') or data.get('class_applied'):
        dob = data.get('date_of_birth')
        if dob:
            try:
                dob = datetime.strptime(dob, '%Y-%m-%d').date()
            except ValueError:
                return error_response('Invalid date format')
        else:
            dob = admission.date_of_birth
        cls_id = data.get('class_applied', admission.class_applied)
        if dob and cls_id:
            eligible, msg = check_age_eligibility(dob, cls_id, g.school_id)
            if not eligible:
                return error_response(msg)

    # Aadhar dup check
    if data.get('aadhar_no') and data['aadhar_no'] != admission.aadhar_no:
        if check_duplicate_aadhar(data['aadhar_no'], g.school_id, exclude_id=admission_id):
            return error_response('Aadhaar number already exists')

    editable_fields = [
        'student_name', 'date_of_birth', 'gender', 'blood_group', 'religion', 'category',
        'nationality', 'aadhar_no', 'address', 'city', 'state', 'pincode',
        'father_name', 'father_phone', 'father_email', 'father_occupation', 'father_income', 'father_aadhar',
        'mother_name', 'mother_phone', 'mother_email', 'mother_occupation',
        'guardian_name', 'guardian_phone', 'guardian_relation',
        'phone', 'email', 'emergency_contact',
        'class_applied', 'academic_year_id', 'previous_school', 'previous_class',
        'previous_percentage', 'tc_number', 'has_sibling', 'sibling_admission_no', 'sibling_name',
        'transport_required', 'pickup_address', 'medical_conditions', 'allergies', 'disability',
        'priority', 'remarks',
    ]

    for field in editable_fields:
        if field in data:
            value = data[field]
            if field == 'date_of_birth' and isinstance(value, str):
                value = datetime.strptime(value, '%Y-%m-%d').date()
            setattr(admission, field, value)

    db.session.commit()
    return success_response(admission.to_dict(), 'Application updated')


@admissions_bp.route('/<int:admission_id>', methods=['DELETE'])
@role_required('school_admin')
def delete_admission(admission_id):
    admission = Admission.query.filter_by(id=admission_id, school_id=g.school_id).first_or_404()
    if admission.status == 'enrolled':
        return error_response('Cannot delete enrolled application')
    db.session.delete(admission)
    db.session.commit()
    return success_response(None, 'Application deleted')


# ======================== STATUS MANAGEMENT ========================

@admissions_bp.route('/<int:admission_id>/status', methods=['PUT'])
@school_required
@feature_required('admission')
def update_status(admission_id):
    admission = Admission.query.filter_by(id=admission_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    new_status = data.get('status')
    remarks = data.get('remarks', '')

    if not new_status:
        return error_response('Status is required')

    valid_transitions = {
        'applied': ['document_pending', 'under_review', 'test_scheduled', 'approved', 'rejected', 'cancelled', 'waitlisted'],
        'document_pending': ['document_verified', 'rejected', 'cancelled'],
        'document_verified': ['test_scheduled', 'under_review', 'approved', 'rejected'],
        'test_scheduled': ['test_completed', 'cancelled'],
        'test_completed': ['under_review', 'approved', 'rejected'],
        'under_review': ['approved', 'rejected', 'waitlisted'],
        'approved': ['fee_pending', 'enrolled', 'cancelled'],
        'fee_pending': ['enrolled', 'cancelled'],
        'rejected': ['applied'],  # re-open
        'waitlisted': ['approved', 'rejected', 'cancelled'],
        'cancelled': ['applied'],  # re-open
    }

    allowed = valid_transitions.get(admission.status, [])
    if new_status not in allowed:
        return error_response(f'Cannot move from {admission.status} to {new_status}')

    old_status = admission.status
    admission.status = new_status

    if new_status == 'approved':
        admission.approved_by = g.current_user.id
        admission.approved_date = datetime.utcnow()

    if new_status == 'rejected':
        admission.rejection_reason = data.get('rejection_reason', remarks)

    add_status_history(admission.id, old_status, new_status, g.current_user.id, remarks)
    db.session.commit()
    return success_response(admission.to_dict(), f'Status updated to {new_status}')


# ======================== ENROLLMENT ========================

@admissions_bp.route('/<int:admission_id>/enroll', methods=['POST'])
@role_required('school_admin')
def enroll_student(admission_id):
    admission = Admission.query.filter_by(id=admission_id, school_id=g.school_id).first_or_404()

    if admission.status == 'enrolled':
        return error_response('Already enrolled')

    if admission.status not in ('approved', 'fee_pending'):
        return error_response('Application must be approved before enrollment')

    data = request.get_json() or {}

    # Create student record
    name_parts = admission.student_name.split()
    student = Student(
        school_id=g.school_id,
        first_name=name_parts[0],
        last_name=' '.join(name_parts[1:]) if len(name_parts) > 1 else '',
        admission_no=data.get('admission_no'),
        roll_no=data.get('roll_no'),
        gender=admission.gender,
        date_of_birth=admission.date_of_birth,
        blood_group=admission.blood_group,
        religion=admission.religion,
        category=admission.category,
        nationality=admission.nationality,
        aadhar_no=admission.aadhar_no,
        address=admission.address,
        city=admission.city,
        state=admission.state,
        pincode=admission.pincode,
        photo_url=admission.photo_url,
        current_class_id=admission.class_applied,
        current_section_id=data.get('section_id'),
        academic_year_id=admission.academic_year_id,
        admission_date=data.get('admission_date') or date.today().isoformat(),
        status='active'
    )
    db.session.add(student)
    db.session.flush()

    # Create parent details
    if admission.father_name:
        father = ParentDetail(
            student_id=student.id,
            school_id=g.school_id,
            relation='father',
            name=admission.father_name,
            phone=admission.father_phone,
            email=admission.father_email,
            occupation=admission.father_occupation,
            income=admission.father_income,
            aadhar_no=admission.father_aadhar,
        )
        db.session.add(father)

    if admission.mother_name:
        mother = ParentDetail(
            student_id=student.id,
            school_id=g.school_id,
            relation='mother',
            name=admission.mother_name,
            phone=admission.mother_phone,
            email=admission.mother_email,
            occupation=admission.mother_occupation,
        )
        db.session.add(mother)

    if admission.guardian_name:
        guardian = ParentDetail(
            student_id=student.id,
            school_id=g.school_id,
            relation='guardian',
            name=admission.guardian_name,
            phone=admission.guardian_phone,
        )
        db.session.add(guardian)

    # Update admission
    old_status = admission.status
    admission.status = 'enrolled'
    admission.student_id = student.id
    add_status_history(admission.id, old_status, 'enrolled', g.current_user.id, f'Enrolled as student #{student.id}')

    # Update seat matrix
    seat = SeatMatrix.query.filter_by(school_id=g.school_id, class_id=admission.class_applied).first()
    if seat:
        seat.filled_seats = (seat.filled_seats or 0) + 1

    # Update lead if linked
    if admission.lead_id and admission.lead:
        admission.lead.status = 'admitted'

    db.session.commit()
    return success_response(student.to_dict(), 'Student enrolled successfully', 201)


# ======================== DOCUMENTS ========================

@admissions_bp.route('/<int:admission_id>/documents', methods=['GET'])
@school_required
@feature_required('admission')
def list_documents(admission_id):
    admission = Admission.query.filter_by(id=admission_id, school_id=g.school_id).first_or_404()
    docs = AdmissionDocument.query.filter_by(admission_id=admission_id, school_id=g.school_id).all()
    return success_response([d.to_dict() for d in docs])


@admissions_bp.route('/<int:admission_id>/documents', methods=['POST'])
@school_required
@feature_required('admission')
def upload_document(admission_id):
    admission = Admission.query.filter_by(id=admission_id, school_id=g.school_id).first_or_404()

    if 'file' not in request.files:
        return error_response('No file provided')

    file = request.files['file']
    if not file.filename:
        return error_response('No file selected')

    doc_type = request.form.get('document_type', 'other')
    allowed_ext = {'pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'}
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in allowed_ext:
        return error_response(f'File type .{ext} not allowed. Use: {", ".join(allowed_ext)}')

    # Max 5MB
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > 5 * 1024 * 1024:
        return error_response('File size exceeds 5MB limit')

    # Save file
    school_dir = os.path.join(UPLOAD_FOLDER, str(g.school_id))
    os.makedirs(school_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(school_dir, filename)
    file.save(filepath)

    doc = AdmissionDocument(
        admission_id=admission_id,
        school_id=g.school_id,
        document_type=doc_type,
        document_name=file.filename,
        file_url=f'/uploads/admissions/{g.school_id}/{filename}',
        file_size=size,
    )
    db.session.add(doc)
    db.session.commit()
    return success_response(doc.to_dict(), 'Document uploaded', 201)


@admissions_bp.route('/<int:admission_id>/documents/<int:doc_id>/verify', methods=['PUT'])
@role_required('school_admin', 'receptionist')
def verify_document(admission_id, doc_id):
    doc = AdmissionDocument.query.filter_by(
        id=doc_id, admission_id=admission_id, school_id=g.school_id
    ).first_or_404()
    data = request.get_json() or {}

    doc.verified = data.get('verified', True)
    doc.verified_by = g.current_user.id
    doc.verified_at = datetime.utcnow()
    if not doc.verified:
        doc.rejection_reason = data.get('rejection_reason', '')

    db.session.commit()
    return success_response(doc.to_dict(), 'Document verification updated')


@admissions_bp.route('/<int:admission_id>/documents/<int:doc_id>', methods=['DELETE'])
@school_required
@feature_required('admission')
def delete_document(admission_id, doc_id):
    doc = AdmissionDocument.query.filter_by(
        id=doc_id, admission_id=admission_id, school_id=g.school_id
    ).first_or_404()
    # Remove file
    filepath = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), doc.file_url.lstrip('/'))
    if os.path.exists(filepath):
        os.remove(filepath)
    db.session.delete(doc)
    db.session.commit()
    return success_response(None, 'Document deleted')


# ======================== SEAT MATRIX ========================

@admissions_bp.route('/seat-matrix', methods=['GET'])
@school_required
@feature_required('admission')
def get_seat_matrix():
    academic_year_id = request.args.get('academic_year_id', type=int)
    query = SeatMatrix.query.filter_by(school_id=g.school_id)
    if academic_year_id:
        query = query.filter_by(academic_year_id=academic_year_id)
    seats = query.all()
    return success_response([s.to_dict() for s in seats])


@admissions_bp.route('/seat-matrix', methods=['POST'])
@role_required('school_admin')
def create_seat_matrix():
    data = request.get_json()
    required = ['class_id', 'total_seats', 'academic_year_id']
    for field in required:
        if not data.get(field):
            return error_response(f'{field} is required')

    existing = SeatMatrix.query.filter_by(
        school_id=g.school_id,
        academic_year_id=data['academic_year_id'],
        class_id=data['class_id'],
        section_id=data.get('section_id'),
    ).first()
    if existing:
        return error_response('Seat matrix already exists for this class/section/year')

    seat = SeatMatrix(
        school_id=g.school_id,
        academic_year_id=data['academic_year_id'],
        class_id=data['class_id'],
        section_id=data.get('section_id'),
        total_seats=data['total_seats'],
        general_seats=data.get('general_seats', 0),
        rte_seats=data.get('rte_seats', 0),
        management_seats=data.get('management_seats', 0),
    )
    db.session.add(seat)
    db.session.commit()
    return success_response(seat.to_dict(), 'Seat matrix created', 201)


@admissions_bp.route('/seat-matrix/<int:seat_id>', methods=['PUT'])
@role_required('school_admin')
def update_seat_matrix(seat_id):
    seat = SeatMatrix.query.filter_by(id=seat_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for field in ['total_seats', 'general_seats', 'rte_seats', 'management_seats', 'filled_seats']:
        if field in data:
            setattr(seat, field, data[field])
    db.session.commit()
    return success_response(seat.to_dict(), 'Seat matrix updated')


# ======================== WAITLIST ========================

@admissions_bp.route('/waitlist', methods=['GET'])
@school_required
@feature_required('admission')
def get_waitlist():
    class_id = request.args.get('class_id', type=int)
    query = AdmissionWaitlist.query.filter_by(school_id=g.school_id)
    if class_id:
        query = query.filter_by(class_id=class_id)
    status_filter = request.args.get('status', 'waiting')
    if status_filter:
        query = query.filter_by(status=status_filter)
    entries = query.order_by(AdmissionWaitlist.position).all()
    return success_response([e.to_dict() for e in entries])


@admissions_bp.route('/waitlist/<int:wl_id>/offer', methods=['POST'])
@role_required('school_admin')
def offer_waitlist_seat(wl_id):
    entry = AdmissionWaitlist.query.filter_by(id=wl_id, school_id=g.school_id).first_or_404()
    if entry.status != 'waiting':
        return error_response('Can only offer to waiting entries')

    entry.status = 'offered'
    entry.offered_at = datetime.utcnow()

    # Update admission status
    admission = Admission.query.get(entry.admission_id)
    if admission:
        old = admission.status
        admission.status = 'approved'
        admission.approved_by = g.current_user.id
        admission.approved_date = datetime.utcnow()
        add_status_history(admission.id, old, 'approved', g.current_user.id, 'Seat offered from waitlist')

    db.session.commit()
    return success_response(entry.to_dict(), 'Seat offered')


# ======================== ENTRANCE TESTS ========================

@admissions_bp.route('/tests', methods=['GET'])
@school_required
@feature_required('admission')
def list_tests():
    query = AdmissionTest.query.filter_by(school_id=g.school_id)
    class_id = request.args.get('class_id', type=int)
    if class_id:
        query = query.filter_by(class_id=class_id)
    tests = query.order_by(AdmissionTest.test_date.desc()).all()
    return success_response([t.to_dict() for t in tests])


@admissions_bp.route('/tests', methods=['POST'])
@role_required('school_admin')
def create_test():
    data = request.get_json()
    if not data.get('name'):
        return error_response('Test name is required')

    test = AdmissionTest(
        school_id=g.school_id,
        academic_year_id=data.get('academic_year_id'),
        name=data['name'],
        class_id=data.get('class_id'),
        test_date=datetime.strptime(data['test_date'], '%Y-%m-%dT%H:%M') if data.get('test_date') else None,
        duration_minutes=data.get('duration_minutes', 60),
        total_marks=data.get('total_marks', 100),
        passing_marks=data.get('passing_marks', 40),
        venue=data.get('venue'),
        instructions=data.get('instructions'),
        status=data.get('status', 'draft'),
        created_by=g.current_user.id,
    )
    db.session.add(test)
    db.session.commit()
    return success_response(test.to_dict(), 'Test created', 201)


@admissions_bp.route('/tests/<int:test_id>', methods=['PUT'])
@role_required('school_admin')
def update_test(test_id):
    test = AdmissionTest.query.filter_by(id=test_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for field in ['name', 'class_id', 'duration_minutes', 'total_marks', 'passing_marks', 'venue', 'instructions', 'status']:
        if field in data:
            setattr(test, field, data[field])
    if data.get('test_date'):
        test.test_date = datetime.strptime(data['test_date'], '%Y-%m-%dT%H:%M')
    db.session.commit()
    return success_response(test.to_dict(), 'Test updated')


@admissions_bp.route('/tests/<int:test_id>/assign', methods=['POST'])
@role_required('school_admin', 'receptionist')
def assign_applicants_to_test(test_id):
    """Assign multiple applicants to a test"""
    test = AdmissionTest.query.filter_by(id=test_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    admission_ids = data.get('admission_ids', [])

    if not admission_ids:
        return error_response('No applicants selected')

    count = 0
    for aid in admission_ids:
        adm = Admission.query.filter_by(id=aid, school_id=g.school_id).first()
        if not adm:
            continue
        existing = AdmissionTestResult.query.filter_by(test_id=test_id, admission_id=aid).first()
        if existing:
            continue
        result = AdmissionTestResult(
            test_id=test_id,
            admission_id=aid,
            school_id=g.school_id,
        )
        db.session.add(result)
        if adm.status in ('applied', 'document_verified'):
            old = adm.status
            adm.status = 'test_scheduled'
            adm.entrance_test_id = test_id
            add_status_history(adm.id, old, 'test_scheduled', g.current_user.id, f'Assigned to test: {test.name}')
        count += 1

    db.session.commit()
    return success_response({'assigned': count}, f'{count} applicants assigned to test')


@admissions_bp.route('/tests/<int:test_id>/results', methods=['GET'])
@school_required
@feature_required('admission')
def get_test_results(test_id):
    test = AdmissionTest.query.filter_by(id=test_id, school_id=g.school_id).first_or_404()
    results = AdmissionTestResult.query.filter_by(test_id=test_id, school_id=g.school_id)\
        .order_by(AdmissionTestResult.rank.asc().nullslast()).all()
    return success_response({
        'test': test.to_dict(),
        'results': [r.to_dict() for r in results],
    })


@admissions_bp.route('/tests/<int:test_id>/results', methods=['POST'])
@role_required('school_admin')
def submit_test_results(test_id):
    """Bulk submit test results"""
    test = AdmissionTest.query.filter_by(id=test_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    results_data = data.get('results', [])

    for r in results_data:
        result = AdmissionTestResult.query.filter_by(
            test_id=test_id, admission_id=r['admission_id']
        ).first()
        if not result:
            continue
        marks = r.get('marks_obtained', 0)
        result.marks_obtained = marks
        result.percentage = (float(marks) / test.total_marks * 100) if test.total_marks > 0 else 0
        result.result = 'pass' if float(marks) >= test.passing_marks else 'fail'
        result.remarks = r.get('remarks')
        result.evaluated_by = g.current_user.id
        result.evaluated_at = datetime.utcnow()

        # Update admission
        adm = Admission.query.get(r['admission_id'])
        if adm:
            adm.test_score = marks
            adm.test_result = result.result
            if adm.status == 'test_scheduled':
                old = adm.status
                adm.status = 'test_completed'
                add_status_history(adm.id, old, 'test_completed', g.current_user.id,
                                   f'Test score: {marks}/{test.total_marks}')

    # Auto-calculate ranks
    all_results = AdmissionTestResult.query.filter_by(test_id=test_id)\
        .filter(AdmissionTestResult.result != 'absent')\
        .order_by(AdmissionTestResult.marks_obtained.desc()).all()
    for i, r in enumerate(all_results):
        r.rank = i + 1
        if r.admission_ref:
            r.admission_ref.merit_rank = i + 1

    test.status = 'completed'
    db.session.commit()
    return success_response(None, 'Results submitted and ranks generated')


@admissions_bp.route('/merit-list/<int:class_id>', methods=['GET'])
@school_required
@feature_required('admission')
def get_merit_list(class_id):
    """Get merit list for a class"""
    admissions = Admission.query.filter_by(
        school_id=g.school_id, class_applied=class_id
    ).filter(
        Admission.merit_rank.isnot(None)
    ).order_by(Admission.merit_rank).all()
    return success_response([a.to_list_dict() for a in admissions])


# ======================== TRANSFER CERTIFICATES ========================

@admissions_bp.route('/transfer-certificates', methods=['GET'])
@school_required
@feature_required('admission')
def list_transfer_certificates():
    query = TransferCertificate.query.filter_by(school_id=g.school_id)
    status = request.args.get('approved')
    if status is not None:
        query = query.filter_by(approved=status.lower() == 'true')
    tcs = query.order_by(TransferCertificate.created_at.desc()).all()
    return success_response([tc.to_dict() for tc in tcs])


@admissions_bp.route('/transfer-certificates', methods=['POST'])
@role_required('school_admin', 'receptionist')
def generate_transfer_certificate():
    data = request.get_json()
    student_id = data.get('student_id')
    if not student_id:
        return error_response('Student ID is required')

    student = Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()

    # Generate TC number
    year = date.today().year
    count = TransferCertificate.query.filter_by(school_id=g.school_id).count()
    tc_number = f"TC-{year}-{str(count + 1).zfill(5)}"

    tc = TransferCertificate(
        school_id=g.school_id,
        student_id=student_id,
        tc_number=tc_number,
        issue_date=date.today(),
        reason=data.get('reason', 'leaving'),
        leaving_date=datetime.strptime(data['leaving_date'], '%Y-%m-%d').date() if data.get('leaving_date') else date.today(),
        class_at_leaving=student.current_class.name if student.current_class else None,
        conduct=data.get('conduct', 'Good'),
        fee_cleared=data.get('fee_cleared', False),
        library_cleared=data.get('library_cleared', False),
        remarks=data.get('remarks'),
        generated_by=g.current_user.id,
    )
    db.session.add(tc)
    db.session.commit()
    return success_response(tc.to_dict(), 'Transfer Certificate generated', 201)


@admissions_bp.route('/transfer-certificates/<int:tc_id>/approve', methods=['PUT'])
@role_required('school_admin')
def approve_transfer_certificate(tc_id):
    tc = TransferCertificate.query.filter_by(id=tc_id, school_id=g.school_id).first_or_404()
    tc.approved = True
    tc.approved_by = g.current_user.id

    # Deactivate student
    student = Student.query.get(tc.student_id)
    if student:
        student.status = 'transferred' if tc.reason == 'transfer' else 'inactive'

    db.session.commit()
    return success_response(tc.to_dict(), 'TC approved and student deactivated')


# ======================== BULK IMPORT ========================

@admissions_bp.route('/bulk-import', methods=['POST'])
@role_required('school_admin')
def bulk_import():
    """Import admissions from JSON array"""
    data = request.get_json()
    records = data.get('records', [])
    if not records:
        return error_response('No records provided')

    created = 0
    errors = []
    for i, rec in enumerate(records):
        if not rec.get('student_name'):
            errors.append(f'Row {i+1}: Student name is required')
            continue
        try:
            app_no = generate_application_no(g.school_id)
            admission = Admission(
                school_id=g.school_id,
                application_no=app_no,
                student_name=rec['student_name'],
                father_name=rec.get('father_name'),
                phone=rec.get('phone'),
                email=rec.get('email'),
                gender=rec.get('gender'),
                date_of_birth=datetime.strptime(rec['date_of_birth'], '%Y-%m-%d').date() if rec.get('date_of_birth') else None,
                class_applied=rec.get('class_applied'),
                academic_year_id=rec.get('academic_year_id'),
                previous_school=rec.get('previous_school'),
                application_source=rec.get('application_source', 'walk_in'),
                category=rec.get('category'),
                address=rec.get('address'),
                processed_by=g.current_user.id,
            )
            db.session.add(admission)
            created += 1
        except Exception as e:
            errors.append(f'Row {i+1}: {str(e)}')

    db.session.commit()
    return success_response({
        'created': created,
        'errors': errors,
        'total': len(records),
    }, f'{created} applications imported')


# ======================== DASHBOARD / ANALYTICS ========================

@admissions_bp.route('/dashboard', methods=['GET'])
@school_required
@feature_required('admission')
def admission_dashboard():
    school_id = g.school_id

    total = Admission.query.filter_by(school_id=school_id).count()

    # Status breakdown
    status_counts = db.session.query(
        Admission.status, func.count(Admission.id)
    ).filter_by(school_id=school_id).group_by(Admission.status).all()
    by_status = {s: c for s, c in status_counts}

    # Source breakdown
    source_counts = db.session.query(
        Admission.application_source, func.count(Admission.id)
    ).filter_by(school_id=school_id).group_by(Admission.application_source).all()
    by_source = {s: c for s, c in source_counts}

    # Class breakdown
    class_counts = db.session.query(
        Class.name, func.count(Admission.id)
    ).join(Class, Admission.class_applied == Class.id)\
     .filter(Admission.school_id == school_id)\
     .group_by(Class.name).all()
    by_class = {c: n for c, n in class_counts}

    # Gender breakdown
    gender_counts = db.session.query(
        Admission.gender, func.count(Admission.id)
    ).filter_by(school_id=school_id).filter(
        Admission.gender.isnot(None)
    ).group_by(Admission.gender).all()
    by_gender = {g_: c for g_, c in gender_counts}

    # Monthly trend (last 12 months)
    monthly = db.session.query(
        func.date_format(Admission.created_at, '%Y-%m').label('month'),
        func.count(Admission.id)
    ).filter_by(school_id=school_id).group_by('month').order_by('month').all()
    monthly_trend = [{'month': m, 'count': c} for m, c in monthly]

    # Conversion rate
    enrolled = by_status.get('enrolled', 0)
    conversion_rate = round((enrolled / total * 100), 1) if total > 0 else 0

    # Recent applications
    recent = Admission.query.filter_by(school_id=school_id)\
        .order_by(Admission.created_at.desc()).limit(10).all()

    return success_response({
        'total_applications': total,
        'by_status': by_status,
        'by_source': by_source,
        'by_class': by_class,
        'by_gender': by_gender,
        'monthly_trend': monthly_trend,
        'conversion_rate': conversion_rate,
        'enrolled_count': enrolled,
        'pending_count': by_status.get('applied', 0) + by_status.get('under_review', 0) + by_status.get('document_pending', 0),
        'rejected_count': by_status.get('rejected', 0),
        'waitlisted_count': by_status.get('waitlisted', 0),
        'recent_applications': [a.to_list_dict() for a in recent],
    })
