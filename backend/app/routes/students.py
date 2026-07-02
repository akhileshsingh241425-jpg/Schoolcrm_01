from flask import Blueprint, request, g, current_app, send_file
from app import db
from app.models.student import (
    Student, ParentDetail, StudentDocument, ParentDocument, Class, Section, AcademicYear,
    StudentPromotion, StudentAchievement, StudentBehavior, StudentTimeline,
    StudentCounseling, StudentHouse, Alumni, StudentMedical
)
from app.models.attendance import StudentAttendance
from app.models.staff import Staff
from app.models.school import School
from app.utils.decorators import school_required, role_required
from app.utils.helpers import success_response, error_response, paginate, get_teacher_scope, clean_val, validate
from sqlalchemy import false
from sqlalchemy.orm import joinedload
from datetime import datetime, date
import uuid
import os
import io

students_bp = Blueprint('students', __name__)


def _verify_student_access(student_id):
    scope = get_teacher_scope()
    if not scope:
        return True
    if scope.get('no_access'):
        return False
    student = Student.query.filter_by(id=student_id, school_id=g.school_id).first()
    if not student:
        return False
    if student.current_class_id in scope['class_ids']:
        return True
    if student.current_section_id in scope.get('section_ids', []):
        return True
    return False


# ===================== STUDENT CRUD =====================

@students_bp.route('/', methods=['GET'])
@school_required
def list_students():
    query = Student.query.options(
        joinedload(Student.current_class),
        joinedload(Student.current_section),
        joinedload(Student.house)
    ).filter_by(school_id=g.school_id)

    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)

    class_id = request.args.get('class_id', type=int)
    if class_id:
        query = query.filter_by(current_class_id=class_id)

    section_id = request.args.get('section_id', type=int)
    if section_id:
        query = query.filter_by(current_section_id=section_id)

    # Exact roll number filter (roll numbers are unique within a class)
    roll_no = request.args.get('roll_no')
    if roll_no:
        query = query.filter(Student.roll_no == roll_no.strip())

    academic_year_id = request.args.get('academic_year_id', type=int)
    if academic_year_id:
        query = query.filter_by(academic_year_id=academic_year_id)

    house_id = request.args.get('house_id', type=int)
    if house_id:
        query = query.filter_by(house_id=house_id)

    gender = request.args.get('gender')
    if gender:
        query = query.filter_by(gender=gender)

    search = request.args.get('search')
    if search:
        query = query.filter(
            db.or_(
                Student.first_name.ilike(f'%{search}%'),
                Student.last_name.ilike(f'%{search}%'),
                Student.admission_no.ilike(f'%{search}%'),
                Student.roll_no.ilike(f'%{search}%')
            )
        )

    # Teacher scoping
    scope = get_teacher_scope()
    if scope and scope.get('no_access'):
        return success_response(paginate(query.filter(false())))
    if scope and scope['class_ids']:
        query = query.filter(Student.current_class_id.in_(scope['class_ids']))

    query = query.order_by(Student.created_at.desc())
    return success_response(paginate(query))


@students_bp.route('/search-comprehensive', methods=['GET'])
@school_required
def search_students_comprehensive():
    q = request.args.get('q', '').strip()
    if not q:
        return success_response([])
    like = f'%{q}%'
    scope = get_teacher_scope()
    if scope and scope.get('no_access'):
        return success_response([])
    query = Student.query.options(
        joinedload(Student.current_class),
        joinedload(Student.current_section),
        joinedload(Student.house)
    ).filter(
        Student.school_id == g.school_id,
        db.or_(
            Student.first_name.ilike(like),
            Student.last_name.ilike(like),
            Student.admission_no.ilike(like),
            Student.roll_no.ilike(like)
        )
    )
    if scope and scope['class_ids']:
        query = query.filter(Student.current_class_id.in_(scope['class_ids']))
    students = query.limit(20).all()
    result = []
    for s in students:
        d = s.to_dict()
        d['parents'] = [p.to_dict() for p in s.parents.all()]
        d['documents'] = [doc.to_dict() for doc in s.documents.all()]
        if s.current_section and s.current_section.class_teacher_id:
            ct = Staff.query.get(s.current_section.class_teacher_id)
            d['class_teacher'] = ct.name if ct else None
        else:
            d['class_teacher'] = None
        attendance = StudentAttendance.query.filter(
            StudentAttendance.student_id == s.id,
            StudentAttendance.date >= date.today().replace(day=1)
        ).order_by(StudentAttendance.date.desc()).all()
        d['attendance'] = [a.to_dict() for a in attendance]
        result.append(d)
    return success_response(result)


@students_bp.route('/<int:student_id>', methods=['GET'])
@school_required
def get_student(student_id):
    if not _verify_student_access(student_id):
        return error_response('Access denied', 403)
    student = Student.query.options(
        joinedload(Student.current_class),
        joinedload(Student.current_section),
        joinedload(Student.house)
    ).filter_by(id=student_id, school_id=g.school_id).first_or_404()
    data = student.to_dict()
    data['parents'] = [p.to_dict() for p in student.parents.all()]
    data['documents'] = [d.to_dict() for d in student.documents.all()]
    if student.sibling_group_id:
        siblings = Student.query.filter(
            Student.school_id == g.school_id,
            Student.sibling_group_id == student.sibling_group_id,
            Student.id != student.id
        ).all()
        data['siblings'] = [{'id': s.id, 'full_name': f"{s.first_name} {s.last_name or ''}", 'class': s.current_class.name if s.current_class else None, 'admission_no': s.admission_no} for s in siblings]
    else:
        data['siblings'] = []
    return success_response(data)


@students_bp.route('/360/<int:student_id>', methods=['GET'])
@school_required
def get_student_360(student_id):
    if not _verify_student_access(student_id):
        return error_response('Access denied', 403)
    student = Student.query.options(
        joinedload(Student.current_class),
        joinedload(Student.current_section),
        joinedload(Student.house)
    ).filter_by(id=student_id, school_id=g.school_id).first_or_404()
    data = student.to_dict()
    data['parents'] = [p.to_dict() for p in student.parents.all()]
    data['documents'] = [d.to_dict() for d in student.documents.all()]
    data['achievements'] = [a.to_dict() for a in student.achievements.order_by(StudentAchievement.created_at.desc()).limit(20).all()]
    data['behavior_logs'] = [b.to_dict() for b in student.behavior_logs.order_by(StudentBehavior.created_at.desc()).limit(20).all()]
    data['timeline'] = [t.to_dict() for t in student.timeline.limit(30).all()]
    data['counseling'] = [c.to_dict() for c in student.counseling.order_by(StudentCounseling.session_date.desc()).limit(10).all()]
    data['promotions'] = [p.to_dict() for p in student.promotions.order_by(StudentPromotion.promoted_at.desc()).all()]
    data['medical'] = [m.to_dict() for m in StudentMedical.query.filter_by(student_id=student_id, school_id=g.school_id).order_by(StudentMedical.record_date.desc()).limit(20).all()]
    data['class_teacher'] = None
    if student.current_section and student.current_section.class_teacher_id:
        ct = Staff.query.get(student.current_section.class_teacher_id)
        data['class_teacher'] = ct.name if ct else None
    attendance = StudentAttendance.query.filter(
        StudentAttendance.student_id == student_id,
        StudentAttendance.date >= date.today().replace(day=1)
    ).order_by(StudentAttendance.date.desc()).all()
    data['attendance'] = [a.to_dict() for a in attendance]
    for p in data.get('parents', []):
        p['documents'] = [d.to_dict() for d in ParentDocument.query.filter_by(parent_id=p['id'], school_id=g.school_id).all()]
    if student.sibling_group_id:
        siblings = Student.query.filter(Student.school_id == g.school_id, Student.sibling_group_id == student.sibling_group_id, Student.id != student.id).all()
        data['siblings'] = [{'id': s.id, 'full_name': f"{s.first_name} {s.last_name or ''}", 'class': s.current_class.name if s.current_class else None} for s in siblings]
    else:
        data['siblings'] = []
    data['stats'] = {
        'total_achievements': student.achievements.count(),
        'positive_behavior': student.behavior_logs.filter_by(behavior_type='positive').count(),
        'negative_behavior': student.behavior_logs.filter_by(behavior_type='negative').count(),
        'counseling_sessions': student.counseling.count(),
        'documents_count': student.documents.count()
    }
    return success_response(data)


@students_bp.route('/', methods=['POST'])
@role_required('school_admin', 'teacher', 'counselor', 'principal')
@validate({
    'first_name': {'required': True, 'message': 'Student first name is required'},
    'class_id': {'type': int, 'message': 'Class is required'},
    'section_id': {'type': int},
    'academic_year_id': {'type': int},
    'phone': {'type': str, 'max_len': 20},
    'pincode': {'type': str, 'max_len': 20},
})
def create_student():
    data = g.get('validated_data') or request.get_json()

    student = Student(
        school_id=g.school_id,
        first_name=data['first_name'], last_name=clean_val(data.get('last_name')),
        admission_no=clean_val(data.get('admission_no')), roll_no=clean_val(data.get('roll_no')),
        gender=clean_val(data.get('gender')), date_of_birth=clean_val(data.get('date_of_birth')),
        blood_group=clean_val(data.get('blood_group')), religion=clean_val(data.get('religion')),
        category=clean_val(data.get('category')), nationality=data.get('nationality', 'Indian'),
        mother_tongue=clean_val(data.get('mother_tongue')), aadhar_no=clean_val(data.get('aadhar_no')),
        address=clean_val(data.get('address')), city=clean_val(data.get('city')),
        state=clean_val(data.get('state')), pincode=clean_val(data.get('pincode')),
        current_class_id=clean_val(data.get('class_id'), int),
        current_section_id=clean_val(data.get('section_id'), int),
        academic_year_id=clean_val(data.get('academic_year_id'), int),
        admission_date=clean_val(data.get('admission_date')),
        emergency_contact=clean_val(data.get('emergency_contact')),
        emergency_person=clean_val(data.get('emergency_person')),
        medical_conditions=clean_val(data.get('medical_conditions')),
        allergies=clean_val(data.get('allergies')),
        previous_school=clean_val(data.get('previous_school')),
        house_id=clean_val(data.get('house_id'), int),
        transport_mode=data.get('transport_mode', 'self'),
        status='active'
    )
    db.session.add(student)
    db.session.flush()

    parents = data.get('parents', [])
    for p in parents:
        if p.get('name'):
            parent = ParentDetail(
                student_id=student.id, school_id=g.school_id,
                relation=p.get('relation', 'father'), name=p['name'],
                phone=p.get('phone'), email=p.get('email'),
                occupation=p.get('occupation'), income=p.get('income'),
                qualification=p.get('qualification'), aadhar_no=p.get('aadhar_no')
            )
            db.session.add(parent)

    timeline = StudentTimeline(
        school_id=g.school_id, student_id=student.id,
        event_type='admission', title='Student Registered',
        description=f"Student {student.first_name} admitted to the school",
        event_date=datetime.utcnow().date(), created_by=g.user_id
    )
    db.session.add(timeline)
    db.session.commit()
    return success_response(student.to_dict(), 'Student created', 201)


@students_bp.route('/<int:student_id>', methods=['PUT'])
@role_required('school_admin', 'teacher')
@validate({
    'class_id': {'type': int},
    'section_id': {'type': int},
    'academic_year_id': {'type': int},
    'house_id': {'type': int},
})
def update_student(student_id):
    student = Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()

    updatable = ['first_name', 'last_name', 'roll_no', 'gender', 'date_of_birth',
                 'blood_group', 'religion', 'category', 'nationality', 'mother_tongue',
                 'aadhar_no', 'address', 'city', 'state', 'pincode', 'photo_url',
                 'status', 'emergency_contact', 'emergency_person', 'medical_conditions',
                 'allergies', 'previous_school', 'transport_mode']

    for field in updatable:
        if field in data:
            setattr(student, field, data[field])

    if 'class_id' in data:
        student.current_class_id = data['class_id']
    if 'section_id' in data:
        student.current_section_id = data['section_id']
    if 'academic_year_id' in data:
        student.academic_year_id = data['academic_year_id']
    if 'house_id' in data:
        student.house_id = data['house_id']

    if 'parents' in data:
        for p_data in data['parents']:
            if p_data.get('id'):
                parent = ParentDetail.query.get(p_data['id'])
                if parent and parent.student_id == student.id:
                    for k in ['name', 'phone', 'email', 'occupation', 'income', 'qualification', 'aadhar_no']:
                        if k in p_data:
                            setattr(parent, k, p_data[k])
            elif p_data.get('name'):
                parent = ParentDetail(
                    student_id=student.id, school_id=g.school_id,
                    relation=p_data.get('relation', 'father'), name=p_data['name'],
                    phone=p_data.get('phone'), email=p_data.get('email'),
                    occupation=p_data.get('occupation'), income=p_data.get('income'),
                    qualification=p_data.get('qualification')
                )
                db.session.add(parent)

    db.session.commit()
    return success_response(student.to_dict(), 'Student updated')


@students_bp.route('/<int:student_id>', methods=['DELETE'])
@role_required('school_admin')
def delete_student(student_id):
    student = Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    student.status = 'inactive'
    db.session.commit()
    return success_response(message='Student deactivated')


# ===================== STUDENT DASHBOARD =====================

@students_bp.route('/dashboard', methods=['GET'])
@school_required
def student_dashboard():
    base = Student.query.filter_by(school_id=g.school_id)

    scope = get_teacher_scope()
    if scope and scope.get('no_access'):
        return success_response({
            'total': 0, 'active': 0, 'inactive': 0,
            'graduated': 0, 'transferred': 0,
            'male': 0, 'female': 0,
            'class_distribution': [], 'house_distribution': [],
            'recent_achievements': [], 'recent_behavior': []
        })
    if scope and scope['class_ids']:
        base = base.filter(Student.current_class_id.in_(scope['class_ids']))

    total = base.count()
    active = base.filter_by(status='active').count()
    inactive = base.filter_by(status='inactive').count()
    graduated = base.filter_by(status='graduated').count()
    transferred = base.filter_by(status='transferred').count()
    male = base.filter_by(gender='male', status='active').count()
    female = base.filter_by(gender='female', status='active').count()

    class_dist = db.session.query(
        Class.name, db.func.count(Student.id)
    ).join(Student, Student.current_class_id == Class.id).filter(
        Student.school_id == g.school_id, Student.status == 'active'
    )
    if scope and scope['class_ids']:
        class_dist = class_dist.filter(Student.current_class_id.in_(scope['class_ids']))
    class_dist = class_dist.group_by(Class.name).all()

    house_dist = db.session.query(
        StudentHouse.name, db.func.count(Student.id)
    ).join(Student, Student.house_id == StudentHouse.id).filter(
        Student.school_id == g.school_id, Student.status == 'active'
    )
    if scope and scope['class_ids']:
        house_dist = house_dist.filter(Student.current_class_id.in_(scope['class_ids']))
    house_dist = house_dist.group_by(StudentHouse.name).all()

    recent_achievements = StudentAchievement.query.filter_by(
        school_id=g.school_id
    )
    if scope and scope['class_ids']:
        recent_achievements = recent_achievements.join(Student).filter(Student.current_class_id.in_(scope['class_ids']))
    recent_achievements = recent_achievements.order_by(StudentAchievement.created_at.desc()).limit(5).all()

    recent_behavior = StudentBehavior.query.filter_by(
        school_id=g.school_id, behavior_type='negative'
    )
    if scope and scope['class_ids']:
        recent_behavior = recent_behavior.join(Student).filter(Student.current_class_id.in_(scope['class_ids']))
    recent_behavior = recent_behavior.order_by(StudentBehavior.created_at.desc()).limit(5).all()

    return success_response({
        'total': total, 'active': active, 'inactive': inactive,
        'graduated': graduated, 'transferred': transferred,
        'male': male, 'female': female,
        'class_distribution': [{'class': c, 'count': n} for c, n in class_dist],
        'house_distribution': [{'house': h, 'count': n} for h, n in house_dist],
        'recent_achievements': [a.to_dict() for a in recent_achievements],
        'recent_behavior': [b.to_dict() for b in recent_behavior]
    })


# ===================== CLASSES & SECTIONS =====================

@students_bp.route('/classes', methods=['GET'])
@school_required
def list_classes():
    classes = Class.query.filter_by(school_id=g.school_id).order_by(Class.numeric_name).all()
    return success_response([c.to_dict_with_sections() for c in classes])


@students_bp.route('/classes', methods=['POST'])
@role_required('school_admin')
@validate({
    'name': {'required': True},
})
def create_class():
    data = g.get('validated_data') or request.get_json()
    cls = Class(school_id=g.school_id, name=data['name'],
                numeric_name=data.get('numeric_name'), description=data.get('description'))
    db.session.add(cls)
    db.session.commit()
    return success_response(cls.to_dict(), 'Class created', 201)


@students_bp.route('/sections/<int:class_id>', methods=['GET'])
@school_required
def list_sections(class_id):
    sections = Section.query.filter_by(school_id=g.school_id, class_id=class_id).all()
    return success_response([s.to_dict() for s in sections])


@students_bp.route('/sections', methods=['POST'])
@role_required('school_admin')
@validate({
    'class_id': {'required': True, 'type': int},
    'name': {'required': True},
    'capacity': {'type': int, 'min': 0},
})
def create_section():
    data = g.get('validated_data') or request.get_json()
    section = Section(school_id=g.school_id, class_id=data['class_id'],
                      name=data['name'], capacity=data.get('capacity', 40))
    db.session.add(section)
    db.session.commit()
    return success_response(section.to_dict(), 'Section created', 201)


@students_bp.route('/classes/<int:class_id>', methods=['PUT'])
@role_required('school_admin')
@validate({
    'numeric_name': {'type': int},
})
def update_class(class_id):
    cls = Class.query.filter_by(id=class_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    if 'name' in data:
        cls.name = data['name']
    if 'numeric_name' in data:
        cls.numeric_name = data['numeric_name']
    if 'description' in data:
        cls.description = data['description']
    db.session.commit()
    return success_response(cls.to_dict(), 'Class updated')


@students_bp.route('/classes/<int:class_id>', methods=['DELETE'])
@role_required('school_admin')
def delete_class(class_id):
    cls = Class.query.filter_by(id=class_id, school_id=g.school_id).first_or_404()
    db.session.delete(cls)
    db.session.commit()
    return success_response(message='Class deleted')


@students_bp.route('/sections/<int:section_id>', methods=['PUT'])
@role_required('school_admin')
@validate({
    'capacity': {'type': int, 'min': 0},
    'class_teacher_id': {'type': int},
    'co_class_teacher_id': {'type': int},
})
def update_section(section_id):
    section = Section.query.filter_by(id=section_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    if 'name' in data:
        section.name = data['name']
    if 'capacity' in data:
        section.capacity = data['capacity']
    if 'class_teacher_id' in data:
        section.class_teacher_id = data['class_teacher_id']
    if 'co_class_teacher_id' in data:
        section.co_class_teacher_id = data['co_class_teacher_id']
    db.session.commit()
    return success_response(section.to_dict(), 'Section updated')


@students_bp.route('/sections/<int:section_id>', methods=['DELETE'])
@role_required('school_admin')
def delete_section(section_id):
    section = Section.query.filter_by(id=section_id, school_id=g.school_id).first_or_404()
    db.session.delete(section)
    db.session.commit()
    return success_response(message='Section deleted')


# ===================== ACADEMIC YEARS =====================

@students_bp.route('/academic-years', methods=['GET'])
@school_required
def list_academic_years():
    years = AcademicYear.query.filter_by(school_id=g.school_id).order_by(AcademicYear.start_date.desc()).all()
    return success_response([y.to_dict() for y in years])


@students_bp.route('/academic-years', methods=['POST'])
@role_required('school_admin')
@validate({
    'name': {'required': True},
    'start_date': {'required': True},
    'end_date': {'required': True},
})
def create_academic_year():
    data = g.get('validated_data') or request.get_json()
    if data.get('is_current'):
        AcademicYear.query.filter_by(school_id=g.school_id, is_current=True).update({'is_current': False})
    year = AcademicYear(school_id=g.school_id, name=data['name'],
                        start_date=data['start_date'], end_date=data['end_date'],
                        is_current=data.get('is_current', False))
    db.session.add(year)
    db.session.commit()
    return success_response(year.to_dict(), 'Academic year created', 201)


@students_bp.route('/academic-years/<int:year_id>', methods=['PUT'])
@school_required
@role_required('school_admin')
@validate({
    'name': {'required': True},
    'start_date': {'required': True},
    'end_date': {'required': True},
})
def update_academic_year(year_id):
    year = AcademicYear.query.filter_by(id=year_id, school_id=g.school_id).first()
    if not year:
        return error_response('Academic year not found', 404)
    data = g.get('validated_data') or request.get_json()
    year.name = data['name']
    year.start_date = data['start_date']
    year.end_date = data['end_date']
    if data.get('is_current'):
        AcademicYear.query.filter(
            AcademicYear.school_id == g.school_id,
            AcademicYear.id != year_id
        ).update({'is_current': False})
        year.is_current = True
    elif 'is_current' in data and not data['is_current']:
        year.is_current = False
    db.session.commit()
    return success_response(year.to_dict(), 'Academic year updated')


@students_bp.route('/academic-years/<int:year_id>', methods=['DELETE'])
@school_required
@role_required('school_admin')
def delete_academic_year(year_id):
    year = AcademicYear.query.filter_by(id=year_id, school_id=g.school_id).first()
    if not year:
        return error_response('Academic year not found', 404)
    db.session.delete(year)
    db.session.commit()
    return success_response(None, 'Academic year deleted')


# ===================== PROMOTIONS =====================

@students_bp.route('/promotions', methods=['GET'])
@school_required
def list_promotions():
    query = StudentPromotion.query.filter_by(school_id=g.school_id)
    from_ay = request.args.get('from_academic_year_id', type=int)
    if from_ay:
        query = query.filter_by(from_academic_year_id=from_ay)
    query = query.order_by(StudentPromotion.promoted_at.desc())
    return success_response(paginate(query))


@students_bp.route('/promote', methods=['POST'])
@role_required('school_admin')
@validate({
    'student_id': {'required': True, 'type': int},
    'to_class_id': {'required': True, 'type': int},
    'to_section_id': {'type': int},
    'from_academic_year_id': {'type': int},
    'to_academic_year_id': {'required': True, 'type': int},
    'result_percentage': {'type': float, 'min': 0},
})
def promote_student():
    data = g.get('validated_data') or request.get_json()
    student = Student.query.filter_by(id=data['student_id'], school_id=g.school_id).first_or_404()
    promo = StudentPromotion(
        school_id=g.school_id, student_id=student.id,
        from_class_id=student.current_class_id,
        from_section_id=student.current_section_id,
        to_class_id=data['to_class_id'],
        to_section_id=data.get('to_section_id'),
        from_academic_year_id=student.academic_year_id or data.get('from_academic_year_id'),
        to_academic_year_id=data['to_academic_year_id'],
        promotion_type=data.get('promotion_type', 'promoted'),
        result_percentage=data.get('result_percentage'),
        remarks=data.get('remarks'), promoted_by=g.user_id
    )
    db.session.add(promo)
    student.current_class_id = data['to_class_id']
    student.current_section_id = data.get('to_section_id')
    student.academic_year_id = data['to_academic_year_id']
    if data.get('promotion_type') == 'graduated':
        student.status = 'graduated'

    to_cls = Class.query.get(data['to_class_id'])
    tl = StudentTimeline(
        school_id=g.school_id, student_id=student.id,
        event_type='promotion', title=f"Student {data.get('promotion_type', 'promoted')}",
        description=f"Moved to {to_cls.name if to_cls else 'next class'}",
        event_date=datetime.utcnow().date(), created_by=g.user_id
    )
    db.session.add(tl)
    db.session.commit()
    return success_response(promo.to_dict(), 'Student promoted')


@students_bp.route('/bulk-promote', methods=['POST'])
@role_required('school_admin')
@validate({
    'from_class_id': {'required': True, 'type': int},
    'to_class_id': {'required': True, 'type': int},
    'from_academic_year_id': {'required': True, 'type': int},
    'to_academic_year_id': {'required': True, 'type': int},
    'to_section_id': {'type': int},
})
def bulk_promote():
    data = g.get('validated_data') or request.get_json()
    from_class_id = data['from_class_id']
    to_class_id = data['to_class_id']
    from_ay_id = data['from_academic_year_id']
    to_ay_id = data['to_academic_year_id']
    to_section_id = data.get('to_section_id')
    promotion_type = data.get('promotion_type', 'promoted')
    excluded_ids = data.get('excluded_student_ids', [])

    query = Student.query.filter(
        Student.school_id == g.school_id,
        Student.current_class_id == from_class_id,
        Student.status == 'active'
    )
    if excluded_ids:
        query = query.filter(~Student.id.in_(excluded_ids))
    students = query.all()

    count = 0
    for student in students:
        promo = StudentPromotion(
            school_id=g.school_id, student_id=student.id,
            from_class_id=from_class_id, from_section_id=student.current_section_id,
            to_class_id=to_class_id, to_section_id=to_section_id,
            from_academic_year_id=from_ay_id, to_academic_year_id=to_ay_id,
            promotion_type=promotion_type, promoted_by=g.user_id
        )
        db.session.add(promo)
        student.current_class_id = to_class_id
        if to_section_id:
            student.current_section_id = to_section_id
        student.academic_year_id = to_ay_id
        if promotion_type == 'graduated':
            student.status = 'graduated'
        count += 1

    db.session.commit()
    return success_response({'promoted_count': count}, f'{count} students promoted')


# ===================== ACHIEVEMENTS =====================

@students_bp.route('/<int:student_id>/achievements', methods=['GET'])
@school_required
def list_achievements(student_id):
    if not _verify_student_access(student_id):
        return success_response([])
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    query = StudentAchievement.query.filter_by(student_id=student_id, school_id=g.school_id)
    category = request.args.get('category')
    if category:
        query = query.filter_by(category=category)
    query = query.order_by(StudentAchievement.created_at.desc())
    return success_response(paginate(query))


@students_bp.route('/<int:student_id>/achievements', methods=['POST'])
@role_required('school_admin', 'teacher')
@validate({
    'title': {'required': True},
    'points_earned': {'type': int, 'min': 0},
})
def add_achievement(student_id):
    if not _verify_student_access(student_id):
        return error_response('Access denied', 403)
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    ach = StudentAchievement(
        school_id=g.school_id, student_id=student_id,
        title=data['title'], category=data.get('category', 'academic'),
        level=data.get('level', 'school'), position=data.get('position'),
        description=data.get('description'), event_date=data.get('event_date'),
        certificate_url=data.get('certificate_url'),
        points_earned=data.get('points_earned', 0), added_by=g.user_id
    )
    db.session.add(ach)
    tl = StudentTimeline(
        school_id=g.school_id, student_id=student_id,
        event_type='achievement', title=f"Achievement: {data['title']}",
        event_date=data.get('event_date', datetime.utcnow().date()), created_by=g.user_id
    )
    db.session.add(tl)
    db.session.commit()
    return success_response(ach.to_dict(), 'Achievement added', 201)


@students_bp.route('/achievements/<int:ach_id>', methods=['DELETE'])
@role_required('school_admin')
def delete_achievement(ach_id):
    ach = StudentAchievement.query.filter_by(id=ach_id, school_id=g.school_id).first_or_404()
    db.session.delete(ach)
    db.session.commit()
    return success_response(message='Achievement deleted')


# ===================== BEHAVIOR =====================

@students_bp.route('/<int:student_id>/behavior', methods=['GET'])
@school_required
def list_behavior(student_id):
    if not _verify_student_access(student_id):
        return success_response([])
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    query = StudentBehavior.query.filter_by(student_id=student_id, school_id=g.school_id)
    b_type = request.args.get('type')
    if b_type:
        query = query.filter_by(behavior_type=b_type)
    query = query.order_by(StudentBehavior.created_at.desc())
    return success_response(paginate(query))


@students_bp.route('/<int:student_id>/behavior', methods=['POST'])
@role_required('school_admin', 'teacher', 'counselor')
@validate({
    'behavior_type': {'required': True},
    'title': {'required': True},
    'points': {'type': int, 'min': 0},
})
def add_behavior(student_id):
    if not _verify_student_access(student_id):
        return error_response('Access denied', 403)
    student = Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    beh = StudentBehavior(
        school_id=g.school_id, student_id=student_id,
        behavior_type=data['behavior_type'], category=data.get('category'),
        title=data['title'], description=data.get('description'),
        points=data.get('points', 0), action_taken=data.get('action_taken'),
        reported_by=g.user_id, incident_date=data.get('incident_date', datetime.utcnow().date())
    )
    db.session.add(beh)
    pts = data.get('points', 0)
    if data['behavior_type'] == 'positive':
        student.behavior_points = (student.behavior_points or 100) + pts
    else:
        student.behavior_points = (student.behavior_points or 100) - pts

    tl = StudentTimeline(
        school_id=g.school_id, student_id=student_id,
        event_type='behavior', title=f"Behavior: {data['title']}",
        description=f"{data['behavior_type']} - {pts} points",
        event_date=data.get('incident_date', datetime.utcnow().date()), created_by=g.user_id
    )
    db.session.add(tl)
    db.session.commit()
    return success_response(beh.to_dict(), 'Behavior recorded', 201)


# ===================== TIMELINE =====================

@students_bp.route('/<int:student_id>/timeline', methods=['GET'])
@school_required
def get_timeline(student_id):
    if not _verify_student_access(student_id):
        return success_response([])
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    query = StudentTimeline.query.filter_by(student_id=student_id, school_id=g.school_id)
    event_type = request.args.get('event_type')
    if event_type:
        query = query.filter_by(event_type=event_type)
    query = query.order_by(StudentTimeline.event_date.desc())
    return success_response(paginate(query))


@students_bp.route('/<int:student_id>/timeline', methods=['POST'])
@role_required('school_admin', 'teacher', 'counselor')
@validate({
    'title': {'required': True},
})
def add_timeline(student_id):
    if not _verify_student_access(student_id):
        return error_response('Access denied', 403)
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    tl = StudentTimeline(
        school_id=g.school_id, student_id=student_id,
        event_type=data.get('event_type', 'general'), title=data['title'],
        description=data.get('description'),
        event_date=data.get('event_date', datetime.utcnow().date()), created_by=g.user_id
    )
    db.session.add(tl)
    db.session.commit()
    return success_response(tl.to_dict(), 'Timeline event added', 201)


# ===================== COUNSELING =====================

@students_bp.route('/<int:student_id>/counseling', methods=['GET'])
@school_required
def list_counseling(student_id):
    if not _verify_student_access(student_id):
        return success_response([])
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    query = StudentCounseling.query.filter_by(student_id=student_id, school_id=g.school_id)
    query = query.order_by(StudentCounseling.session_date.desc())
    return success_response(paginate(query))


@students_bp.route('/<int:student_id>/counseling', methods=['POST'])
@role_required('school_admin', 'teacher', 'counselor')
@validate({
    'session_date': {'required': True},
})
def add_counseling(student_id):
    if not _verify_student_access(student_id):
        return error_response('Access denied', 403)
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    cs = StudentCounseling(
        school_id=g.school_id, student_id=student_id,
        counselor_id=g.user_id, session_date=data['session_date'],
        session_type=data.get('session_type', 'academic'),
        reason=data.get('reason'), notes=data.get('notes'),
        recommendations=data.get('recommendations'),
        follow_up_date=data.get('follow_up_date'),
        status=data.get('status', 'scheduled'),
        is_confidential=data.get('is_confidential', False)
    )
    db.session.add(cs)
    tl = StudentTimeline(
        school_id=g.school_id, student_id=student_id,
        event_type='counseling', title=f"Counseling: {data.get('session_type', 'academic')}",
        description=data.get('reason'), event_date=data['session_date'], created_by=g.user_id
    )
    db.session.add(tl)
    db.session.commit()
    return success_response(cs.to_dict(), 'Counseling session added', 201)


@students_bp.route('/counseling/<int:cs_id>', methods=['PUT'])
@role_required('school_admin', 'counselor')
@validate({})
def update_counseling(cs_id):
    cs = StudentCounseling.query.filter_by(id=cs_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    for field in ['notes', 'recommendations', 'follow_up_date', 'status']:
        if field in data:
            setattr(cs, field, data[field])
    db.session.commit()
    return success_response(cs.to_dict(), 'Counseling updated')


# ===================== MEDICAL =====================

@students_bp.route('/<int:student_id>/medical', methods=['GET'])
@school_required
def list_medical(student_id):
    if not _verify_student_access(student_id):
        return success_response([])
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    query = StudentMedical.query.filter_by(student_id=student_id, school_id=g.school_id)
    query = query.order_by(StudentMedical.record_date.desc())
    return success_response(paginate(query))


@students_bp.route('/<int:student_id>/medical', methods=['POST'])
@role_required('school_admin', 'teacher', 'counselor')
@validate({
    'title': {'required': True},
    'record_date': {'required': True},
})
def add_medical(student_id):
    if not _verify_student_access(student_id):
        return error_response('Access denied', 403)
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    med = StudentMedical(
        school_id=g.school_id, student_id=student_id,
        record_type=data.get('record_type', 'checkup'), title=data['title'],
        description=data.get('description'), doctor_name=data.get('doctor_name'),
        record_date=data['record_date'], next_followup=data.get('next_followup'),
        attachment_url=data.get('attachment_url')
    )
    db.session.add(med)
    tl = StudentTimeline(
        school_id=g.school_id, student_id=student_id,
        event_type='medical', title=f"Medical: {data['title']}",
        event_date=data['record_date'], created_by=g.user_id
    )
    db.session.add(tl)
    db.session.commit()
    return success_response(med.to_dict(), 'Medical record added', 201)


# ===================== DOCUMENTS =====================

@students_bp.route('/<int:student_id>/documents', methods=['GET'])
@school_required
def list_documents(student_id):
    if not _verify_student_access(student_id):
        return success_response([])
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    docs = StudentDocument.query.filter_by(student_id=student_id, school_id=g.school_id).all()
    return success_response([d.to_dict() for d in docs])


@students_bp.route('/<int:student_id>/documents', methods=['POST'])
@role_required('school_admin', 'teacher')
@validate({
    'document_type': {'required': True},
    'file_url': {'required': True},
})
def upload_document(student_id):
    if not _verify_student_access(student_id):
        return error_response('Access denied', 403)
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    doc = StudentDocument(
        student_id=student_id, school_id=g.school_id,
        document_type=data['document_type'],
        document_name=data.get('document_name', data['document_type']),
        file_url=data['file_url']
    )
    db.session.add(doc)
    tl = StudentTimeline(
        school_id=g.school_id, student_id=student_id,
        event_type='document', title=f"Document: {data['document_type']}",
        event_date=datetime.utcnow().date(), created_by=g.user_id
    )
    db.session.add(tl)
    db.session.commit()
    return success_response(doc.to_dict(), 'Document uploaded', 201)


@students_bp.route('/documents/<int:doc_id>/verify', methods=['PUT'])
@role_required('school_admin')
def verify_document(doc_id):
    doc = StudentDocument.query.filter_by(id=doc_id, school_id=g.school_id).first_or_404()
    doc.verified = True
    doc.verified_by = g.user_id
    db.session.commit()
    return success_response(doc.to_dict(), 'Document verified')


@students_bp.route('/documents/<int:doc_id>', methods=['DELETE'])
@role_required('school_admin')
def delete_document(doc_id):
    doc = StudentDocument.query.filter_by(id=doc_id, school_id=g.school_id).first_or_404()
    db.session.delete(doc)
    db.session.commit()
    return success_response(message='Document deleted')


@students_bp.route('/<int:student_id>/documents/upload', methods=['POST'])
@role_required('school_admin', 'teacher')
def upload_student_document_file(student_id):
    if not _verify_student_access(student_id):
        return error_response('Access denied', 403)
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    if 'file' not in request.files:
        return error_response('No file provided')
    file = request.files['file']
    if file.filename == '':
        return error_response('No file selected')
    doc_type = request.form.get('document_type', 'other')
    doc_name = request.form.get('document_name', doc_type)
    ext = os.path.splitext(file.filename)[1]
    safe_name = f"{uuid.uuid4().hex}{ext}"
    upload_dir = os.path.join(current_app.root_path, '..', 'uploads', 'student_docs', str(g.school_id), str(student_id))
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, safe_name)
    file.save(file_path)
    file_url = f'/uploads/student_docs/{g.school_id}/{student_id}/{safe_name}'
    doc = StudentDocument(
        student_id=student_id, school_id=g.school_id,
        document_type=doc_type, document_name=doc_name, file_url=file_url
    )
    db.session.add(doc)
    tl = StudentTimeline(
        school_id=g.school_id, student_id=student_id,
        event_type='document', title=f"Document: {doc_type}",
        event_date=datetime.utcnow().date(), created_by=g.user_id
    )
    db.session.add(tl)
    db.session.commit()
    return success_response(doc.to_dict(), 'Document uploaded', 201)


@students_bp.route('/<int:student_id>/parents/<int:parent_id>/documents', methods=['GET'])
@school_required
def list_parent_documents(student_id, parent_id):
    if not _verify_student_access(student_id):
        return success_response([])
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    ParentDetail.query.filter_by(id=parent_id, student_id=student_id).first_or_404()
    docs = ParentDocument.query.filter_by(parent_id=parent_id, school_id=g.school_id).all()
    return success_response([d.to_dict() for d in docs])


@students_bp.route('/<int:student_id>/parents/<int:parent_id>/documents/upload', methods=['POST'])
@role_required('school_admin', 'teacher')
def upload_parent_document_file(student_id, parent_id):
    if not _verify_student_access(student_id):
        return error_response('Access denied', 403)
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    ParentDetail.query.filter_by(id=parent_id, student_id=student_id).first_or_404()
    if 'file' not in request.files:
        return error_response('No file provided')
    file = request.files['file']
    if file.filename == '':
        return error_response('No file selected')
    doc_type = request.form.get('document_type', 'other')
    doc_name = request.form.get('document_name', doc_type)
    ext = os.path.splitext(file.filename)[1]
    safe_name = f"{uuid.uuid4().hex}{ext}"
    upload_dir = os.path.join(current_app.root_path, '..', 'uploads', 'parent_docs', str(g.school_id), str(parent_id))
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, safe_name)
    file.save(file_path)
    file_url = f'/uploads/parent_docs/{g.school_id}/{parent_id}/{safe_name}'
    doc = ParentDocument(
        parent_id=parent_id, school_id=g.school_id,
        document_type=doc_type, document_name=doc_name, file_url=file_url
    )
    db.session.add(doc)
    db.session.commit()
    return success_response(doc.to_dict(), 'Document uploaded', 201)


# ===================== HOUSES =====================

@students_bp.route('/houses', methods=['GET'])
@school_required
def list_houses():
    houses = StudentHouse.query.filter_by(school_id=g.school_id).all()
    return success_response([h.to_dict() for h in houses])


@students_bp.route('/houses', methods=['POST'])
@role_required('school_admin')
@validate({
    'name': {'required': True},
})
def create_house():
    data = g.get('validated_data') or request.get_json()
    house = StudentHouse(school_id=g.school_id, name=data['name'],
                         color=data.get('color'), motto=data.get('motto'))
    db.session.add(house)
    db.session.commit()
    return success_response(house.to_dict(), 'House created', 201)


@students_bp.route('/houses/<int:house_id>', methods=['PUT'])
@role_required('school_admin')
@validate({
    'captain_student_id': {'type': int},
})
def update_house(house_id):
    house = StudentHouse.query.filter_by(id=house_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    for field in ['name', 'color', 'motto', 'captain_student_id']:
        if field in data:
            setattr(house, field, data[field])
    db.session.commit()
    return success_response(house.to_dict(), 'House updated')


@students_bp.route('/assign-house', methods=['POST'])
@role_required('school_admin')
@validate({
    'student_id': {'required': True, 'type': int},
    'house_id': {'required': True, 'type': int},
})
def assign_house():
    data = g.get('validated_data') or request.get_json()
    student = Student.query.filter_by(id=data['student_id'], school_id=g.school_id).first_or_404()
    student.house_id = data['house_id']
    db.session.commit()
    return success_response(student.to_dict(), 'House assigned')


@students_bp.route('/auto-assign-houses', methods=['POST'])
@role_required('school_admin')
def auto_assign_houses():
    houses = StudentHouse.query.filter_by(school_id=g.school_id).all()
    if not houses:
        return error_response('No houses created yet')
    unassigned = Student.query.filter(
        Student.school_id == g.school_id, Student.house_id.is_(None), Student.status == 'active'
    ).all()
    count = 0
    for i, student in enumerate(unassigned):
        student.house_id = houses[i % len(houses)].id
        count += 1
    db.session.commit()
    return success_response({'assigned_count': count}, f'{count} students assigned to houses')


# ===================== SIBLINGS =====================

@students_bp.route('/link-siblings', methods=['POST'])
@role_required('school_admin')
@validate({})
def link_siblings():
    data = g.get('validated_data') or request.get_json()
    student_ids = data.get('student_ids', [])
    if len(student_ids) < 2:
        return error_response('At least 2 students required')
    group_id = None
    for sid in student_ids:
        s = Student.query.filter_by(id=sid, school_id=g.school_id).first()
        if s and s.sibling_group_id:
            group_id = s.sibling_group_id
            break
    if not group_id:
        group_id = str(uuid.uuid4())[:8]
    for sid in student_ids:
        s = Student.query.filter_by(id=sid, school_id=g.school_id).first()
        if s:
            s.sibling_group_id = group_id
    db.session.commit()
    return success_response({'sibling_group_id': group_id}, 'Siblings linked')


@students_bp.route('/<int:student_id>/siblings', methods=['GET'])
@school_required
def get_siblings(student_id):
    if not _verify_student_access(student_id):
        return success_response([])
    student = Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    if not student.sibling_group_id:
        return success_response([])
    siblings = Student.query.filter(
        Student.school_id == g.school_id,
        Student.sibling_group_id == student.sibling_group_id,
        Student.id != student.id
    ).all()
    return success_response([s.to_dict() for s in siblings])


# ===================== ALUMNI =====================

@students_bp.route('/alumni', methods=['GET'])
@school_required
def list_alumni():
    query = Alumni.query.filter_by(school_id=g.school_id)
    batch = request.args.get('batch_year')
    if batch:
        query = query.filter_by(batch_year=batch)
    search = request.args.get('search')
    if search:
        query = query.filter(Alumni.name.ilike(f'%{search}%'))
    query = query.order_by(Alumni.batch_year.desc())
    return success_response(paginate(query))


@students_bp.route('/alumni', methods=['POST'])
@role_required('school_admin')
@validate({
    'name': {'required': True},
})
def create_alumni():
    data = g.get('validated_data') or request.get_json()
    alumni = Alumni(
        school_id=g.school_id, student_id=data.get('student_id'),
        name=data['name'], batch_year=data.get('batch_year'),
        passing_class=data.get('passing_class'), phone=data.get('phone'),
        email=data.get('email'), current_occupation=data.get('current_occupation'),
        current_organization=data.get('current_organization'),
        higher_education=data.get('higher_education'), address=data.get('address'),
        achievements_after=data.get('achievements_after'),
        linkedin_url=data.get('linkedin_url'), is_mentor=data.get('is_mentor', False)
    )
    db.session.add(alumni)
    db.session.commit()
    return success_response(alumni.to_dict(), 'Alumni added', 201)


@students_bp.route('/alumni/<int:alumni_id>', methods=['PUT'])
@role_required('school_admin')
@validate({})
def update_alumni(alumni_id):
    alumni = Alumni.query.filter_by(id=alumni_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    for field in ['name', 'batch_year', 'phone', 'email', 'current_occupation',
                  'current_organization', 'higher_education', 'achievements_after', 'is_mentor']:
        if field in data:
            setattr(alumni, field, data[field])
    db.session.commit()
    return success_response(alumni.to_dict(), 'Alumni updated')


@students_bp.route('/graduate-to-alumni', methods=['POST'])
@role_required('school_admin')
@validate({})
def graduate_to_alumni():
    data = g.get('validated_data') or request.get_json()
    student_ids = data.get('student_ids', [])
    batch_year = data.get('batch_year', str(datetime.utcnow().year))
    count = 0
    for sid in student_ids:
        student = Student.query.filter_by(id=sid, school_id=g.school_id).first()
        if student:
            existing = Alumni.query.filter_by(student_id=student.id, school_id=g.school_id).first()
            if not existing:
                alumni = Alumni(
                    school_id=g.school_id, student_id=student.id,
                    name=f"{student.first_name} {student.last_name or ''}".strip(),
                    batch_year=batch_year,
                    passing_class=student.current_class.name if student.current_class else None
                )
                db.session.add(alumni)
                student.status = 'graduated'
                count += 1
    db.session.commit()
    return success_response({'count': count}, f'{count} students graduated to alumni')


# ===================== ID CARD =====================

@students_bp.route('/<int:student_id>/id-card', methods=['GET'])
@school_required
def get_id_card(student_id):
    if not _verify_student_access(student_id):
        return error_response('Access denied', 403)
    student = Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    data = student.to_dict()
    data['parents'] = [p.to_dict() for p in student.parents.limit(2).all()]
    return success_response(data)


@students_bp.route('/bulk-id-cards', methods=['POST'])
@role_required('school_admin')
@validate({
    'class_id': {'type': int},
    'section_id': {'type': int},
})
def bulk_id_cards():
    data = g.get('validated_data') or request.get_json()
    query = Student.query.filter_by(school_id=g.school_id, status='active')
    if data.get('class_id'):
        query = query.filter_by(current_class_id=data['class_id'])
    if data.get('section_id'):
        query = query.filter_by(current_section_id=data['section_id'])
    students = query.all()
    cards = []
    for s in students:
        card = s.to_dict()
        card['parents'] = [p.to_dict() for p in s.parents.limit(2).all()]
        cards.append(card)
        s.id_card_issued = True
    db.session.commit()
    return success_response(cards, f'{len(cards)} ID cards generated')


@students_bp.route('/<int:student_id>/id-card/pdf', methods=['GET'])
@school_required
def download_id_card_pdf(student_id):
    """Generate and download a professional student ID card PDF"""
    if not _verify_student_access(student_id):
        return error_response('Access denied', 403)
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable, Image
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_LEFT

    student = Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    school = School.query.get(g.school_id)
    parents = list(student.parents.limit(2).all())

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            topMargin=10*mm, bottomMargin=10*mm,
                            leftMargin=15*mm, rightMargin=15*mm)

    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle('SchoolTitle', parent=styles['Title'],
        fontSize=20, spaceAfter=2, textColor=colors.HexColor('#1a237e'),
        fontName='Helvetica-Bold', alignment=TA_CENTER)
    subtitle_style = ParagraphStyle('SubTitle', parent=styles['Normal'],
        fontSize=10, spaceAfter=1, textColor=colors.HexColor('#424242'), alignment=TA_CENTER)
    normal_style = ParagraphStyle('NormalText', parent=styles['Normal'], fontSize=10, leading=14)
    center_style = ParagraphStyle('CenterText', parent=styles['Normal'], fontSize=10, alignment=TA_CENTER)
    bold_style = ParagraphStyle('BoldText', parent=styles['Normal'], fontSize=10, fontName='Helvetica-Bold')
    label_style = ParagraphStyle('Label', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#666666'))
    value_style = ParagraphStyle('Value', parent=styles['Normal'], fontSize=11, fontName='Helvetica-Bold', leading=14)

    primary = colors.HexColor('#1a237e')
    accent = colors.HexColor('#3949ab')
    light_bg = colors.HexColor('#e8eaf6')
    border_color = colors.HexColor('#bdbdbd')

    school_name = school.name.upper() if school else 'SCHOOL NAME'
    school_addr = ', '.join(filter(None, [
        school.address if school else None, school.city if school else None,
        school.state if school else None, school.pincode if school else None
    ])) or ''
    school_contact = ', '.join(filter(None, [
        f"Ph: {school.phone}" if school and school.phone else None,
        f"Email: {school.email}" if school and school.email else None,
    ])) or ''

    story.append(Paragraph(school_name, title_style))
    if school_addr:
        story.append(Paragraph(school_addr, subtitle_style))
    if school_contact:
        story.append(Paragraph(school_contact, subtitle_style))
    story.append(Spacer(1, 4*mm))
    story.append(HRFlowable(width="100%", thickness=2, color=primary))
    story.append(Spacer(1, 4*mm))

    # Title Bar
    card_title = ParagraphStyle('CardTitle', parent=styles['Title'],
        fontSize=13, textColor=colors.white, fontName='Helvetica-Bold', alignment=TA_CENTER)
    title_data = [[Paragraph("STUDENT IDENTITY CARD", card_title)]]
    title_table = Table(title_data, colWidths=[doc.width])
    title_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), primary),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(title_table)
    story.append(Spacer(1, 4*mm))

    # Student info
    father_name = next((p.name for p in parents if p.relation == 'father'), '-')
    mother_name = next((p.name for p in parents if p.relation == 'mother'), '-')
    parent_phone = parents[0].phone if parents else '-'
    class_name = student.current_class.name if student.current_class else '-'
    section_name = student.current_section.name if student.current_section else '-'
    dob_str = student.date_of_birth.strftime('%d-%m-%Y') if student.date_of_birth else '-'

    student_info = [
        [Paragraph('<b>Student Name:</b>', label_style), Paragraph(student.full_name or f"{student.first_name} {student.last_name}", value_style)],
        [Paragraph('<b>Class / Section:</b>', label_style), Paragraph(f"{class_name} - {section_name}", value_style)],
        [Paragraph('<b>Roll No:</b>', label_style), Paragraph(student.roll_no or '-', value_style)],
        [Paragraph('<b>Admission No:</b>', label_style), Paragraph(student.admission_no or '-', value_style)],
        [Paragraph('<b>Date of Birth:</b>', label_style), Paragraph(dob_str, value_style)],
        [Paragraph('<b>Blood Group:</b>', label_style), Paragraph(student.blood_group or '-', value_style)],
        [Paragraph('<b>Gender:</b>', label_style), Paragraph((student.gender or '-').title(), value_style)],
        [Paragraph('<b>Address:</b>', label_style), Paragraph(student.address or '-', normal_style)],
        [Paragraph('<b>Father:</b>', label_style), Paragraph(father_name, value_style)],
        [Paragraph('<b>Mother:</b>', label_style), Paragraph(mother_name, value_style)],
        [Paragraph('<b>Parent Phone:</b>', label_style), Paragraph(parent_phone, value_style)],
    ]

    col_w = [doc.width * 0.25, doc.width * 0.75]
    info_table = Table(student_info, colWidths=col_w)
    info_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fafafa')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 8*mm))

    # ID Card Number and Issue Date
    id_no = student.id_card_no or f"ID-{student.admission_no or student.id}"
    issue_date = date.today().strftime('%d-%m-%Y')
    story.append(HRFlowable(width="100%", thickness=0.5, color=border_color))
    story.append(Spacer(1, 2*mm))
    footer_data = [
        [Paragraph(f'<b>ID Card No:</b> {id_no}', center_style),
         Paragraph(f'<b>Issue Date:</b> {issue_date}', center_style),
         Paragraph('<b>Valid Till:</b> March 2026', center_style)],
    ]
    footer_table = Table(footer_data, colWidths=[doc.width/3, doc.width/3, doc.width/3])
    footer_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(footer_table)

    story.append(Spacer(1, 8*mm))
    sig_data = [
        [Paragraph('_____________________', center_style),
         Paragraph('_____________________', center_style)],
        [Paragraph('Student Signature', center_style),
         Paragraph('Principal Signature', center_style)],
    ]
    sig_table = Table(sig_data, colWidths=[doc.width/2, doc.width/2])
    sig_table.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'CENTER')]))
    story.append(sig_table)

    story.append(Spacer(1, 5*mm))
    story.append(Paragraph("This is a computer-generated document.", ParagraphStyle('Footer', parent=styles['Normal'],
        fontSize=8, textColor=colors.HexColor('#999999'), alignment=TA_CENTER)))

    doc.build(story)
    buffer.seek(0)

    student_name = student.full_name or f"{student.first_name}_{student.last_name}"
    return send_file(buffer, mimetype='application/pdf', as_attachment=True,
                     download_name=f"IDCard_{student_name}.pdf")


# ===================== TRANSFER =====================

@students_bp.route('/<int:student_id>/transfer', methods=['POST'])
@role_required('school_admin')
def transfer_student(student_id):
    student = Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    student.status = 'transferred'
    tl = StudentTimeline(
        school_id=g.school_id, student_id=student_id,
        event_type='transfer', title='Student Transferred',
        description=data.get('reason', 'Transferred to another school'),
        event_date=datetime.utcnow().date(), created_by=g.user_id
    )
    db.session.add(tl)
    db.session.commit()
    return success_response(student.to_dict(), 'Student transferred')


# ===================== SECTION ALLOCATION =====================

@students_bp.route('/smart-allocate', methods=['POST'])
@role_required('school_admin')
def smart_section_allocation():
    data = request.get_json()
    class_id = data['class_id']
    sections = Section.query.filter_by(class_id=class_id, school_id=g.school_id).all()
    if not sections:
        return error_response('No sections found for this class')
    unassigned = Student.query.filter(
        Student.school_id == g.school_id,
        Student.current_class_id == class_id,
        Student.current_section_id.is_(None),
        Student.status == 'active'
    ).all()
    males = [s for s in unassigned if s.gender == 'male']
    females = [s for s in unassigned if s.gender == 'female']
    others = [s for s in unassigned if s.gender not in ('male', 'female')]
    all_sorted = []
    mi, fi, oi = 0, 0, 0
    while mi < len(males) or fi < len(females) or oi < len(others):
        if mi < len(males):
            all_sorted.append(males[mi]); mi += 1
        if fi < len(females):
            all_sorted.append(females[fi]); fi += 1
        if oi < len(others):
            all_sorted.append(others[oi]); oi += 1
    count = 0
    for i, student in enumerate(all_sorted):
        sec = sections[i % len(sections)]
        current_count = Student.query.filter_by(
            current_section_id=sec.id, current_class_id=class_id, status='active'
        ).count()
        if current_count < sec.capacity:
            student.current_section_id = sec.id
            count += 1
    db.session.commit()
    return success_response({'allocated_count': count}, f'{count} students allocated to sections')


# ===================== BULK IMPORT =====================

@students_bp.route('/bulk-import', methods=['POST'])
@role_required('school_admin')
def bulk_import():
    data = request.get_json()
    students_data = data.get('students', [])
    count = 0
    errors = []
    for idx, s_data in enumerate(students_data):
        try:
            if not s_data.get('first_name'):
                errors.append(f"Row {idx+1}: first_name required")
                continue
            student = Student(
                school_id=g.school_id,
                first_name=s_data['first_name'], last_name=s_data.get('last_name'),
                admission_no=s_data.get('admission_no'), roll_no=s_data.get('roll_no'),
                gender=s_data.get('gender'), date_of_birth=s_data.get('date_of_birth'),
                current_class_id=s_data.get('class_id'),
                current_section_id=s_data.get('section_id'),
                academic_year_id=s_data.get('academic_year_id'),
                status='active'
            )
            db.session.add(student)
            count += 1
        except Exception as e:
            errors.append(f"Row {idx+1}: {str(e)}")
    db.session.commit()
    return success_response({'imported': count, 'errors': errors}, f'{count} students imported')
