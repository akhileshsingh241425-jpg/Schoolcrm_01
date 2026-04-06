from flask import Blueprint, request, g
from app import db
from app.models.student import (
    Student, ParentDetail, StudentDocument, Class, Section, AcademicYear,
    StudentPromotion, StudentAchievement, StudentBehavior, StudentTimeline,
    StudentCounseling, StudentHouse, Alumni, StudentMedical
)
from app.utils.decorators import school_required, role_required
from app.utils.helpers import success_response, error_response, paginate
from sqlalchemy.orm import joinedload
from datetime import datetime
import uuid

students_bp = Blueprint('students', __name__)


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

    query = query.order_by(Student.created_at.desc())
    return success_response(paginate(query))


@students_bp.route('/<int:student_id>', methods=['GET'])
@school_required
def get_student(student_id):
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
@role_required('school_admin', 'teacher', 'counselor')
def create_student():
    data = request.get_json()
    if not data.get('first_name'):
        return error_response('First name is required')

    student = Student(
        school_id=g.school_id,
        first_name=data['first_name'], last_name=data.get('last_name'),
        admission_no=data.get('admission_no'), roll_no=data.get('roll_no'),
        gender=data.get('gender'), date_of_birth=data.get('date_of_birth'),
        blood_group=data.get('blood_group'), religion=data.get('religion'),
        category=data.get('category'), nationality=data.get('nationality', 'Indian'),
        mother_tongue=data.get('mother_tongue'), aadhar_no=data.get('aadhar_no'),
        address=data.get('address'), city=data.get('city'),
        state=data.get('state'), pincode=data.get('pincode'),
        current_class_id=data.get('class_id'),
        current_section_id=data.get('section_id'),
        academic_year_id=data.get('academic_year_id'),
        admission_date=data.get('admission_date'),
        emergency_contact=data.get('emergency_contact'),
        emergency_person=data.get('emergency_person'),
        medical_conditions=data.get('medical_conditions'),
        allergies=data.get('allergies'),
        previous_school=data.get('previous_school'),
        house_id=data.get('house_id'),
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
def update_student(student_id):
    student = Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    data = request.get_json()

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
    ).group_by(Class.name).all()

    house_dist = db.session.query(
        StudentHouse.name, db.func.count(Student.id)
    ).join(Student, Student.house_id == StudentHouse.id).filter(
        Student.school_id == g.school_id, Student.status == 'active'
    ).group_by(StudentHouse.name).all()

    recent_achievements = StudentAchievement.query.filter_by(
        school_id=g.school_id
    ).order_by(StudentAchievement.created_at.desc()).limit(5).all()

    recent_behavior = StudentBehavior.query.filter_by(
        school_id=g.school_id, behavior_type='negative'
    ).order_by(StudentBehavior.created_at.desc()).limit(5).all()

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
def create_class():
    data = request.get_json()
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
def create_section():
    data = request.get_json()
    section = Section(school_id=g.school_id, class_id=data['class_id'],
                      name=data['name'], capacity=data.get('capacity', 40))
    db.session.add(section)
    db.session.commit()
    return success_response(section.to_dict(), 'Section created', 201)


# ===================== ACADEMIC YEARS =====================

@students_bp.route('/academic-years', methods=['GET'])
@school_required
def list_academic_years():
    years = AcademicYear.query.filter_by(school_id=g.school_id).order_by(AcademicYear.start_date.desc()).all()
    return success_response([y.to_dict() for y in years])


@students_bp.route('/academic-years', methods=['POST'])
@role_required('school_admin')
def create_academic_year():
    data = request.get_json()
    if data.get('is_current'):
        AcademicYear.query.filter_by(school_id=g.school_id, is_current=True).update({'is_current': False})
    year = AcademicYear(school_id=g.school_id, name=data['name'],
                        start_date=data['start_date'], end_date=data['end_date'],
                        is_current=data.get('is_current', False))
    db.session.add(year)
    db.session.commit()
    return success_response(year.to_dict(), 'Academic year created', 201)


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
def promote_student():
    data = request.get_json()
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
def bulk_promote():
    data = request.get_json()
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
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    query = StudentAchievement.query.filter_by(student_id=student_id, school_id=g.school_id)
    category = request.args.get('category')
    if category:
        query = query.filter_by(category=category)
    query = query.order_by(StudentAchievement.created_at.desc())
    return success_response(paginate(query))


@students_bp.route('/<int:student_id>/achievements', methods=['POST'])
@role_required('school_admin', 'teacher')
def add_achievement(student_id):
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
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
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    query = StudentBehavior.query.filter_by(student_id=student_id, school_id=g.school_id)
    b_type = request.args.get('type')
    if b_type:
        query = query.filter_by(behavior_type=b_type)
    query = query.order_by(StudentBehavior.created_at.desc())
    return success_response(paginate(query))


@students_bp.route('/<int:student_id>/behavior', methods=['POST'])
@role_required('school_admin', 'teacher', 'counselor')
def add_behavior(student_id):
    student = Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
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
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    query = StudentTimeline.query.filter_by(student_id=student_id, school_id=g.school_id)
    event_type = request.args.get('event_type')
    if event_type:
        query = query.filter_by(event_type=event_type)
    query = query.order_by(StudentTimeline.event_date.desc())
    return success_response(paginate(query))


@students_bp.route('/<int:student_id>/timeline', methods=['POST'])
@role_required('school_admin', 'teacher', 'counselor')
def add_timeline(student_id):
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
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
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    query = StudentCounseling.query.filter_by(student_id=student_id, school_id=g.school_id)
    query = query.order_by(StudentCounseling.session_date.desc())
    return success_response(paginate(query))


@students_bp.route('/<int:student_id>/counseling', methods=['POST'])
@role_required('school_admin', 'teacher', 'counselor')
def add_counseling(student_id):
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
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
def update_counseling(cs_id):
    cs = StudentCounseling.query.filter_by(id=cs_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for field in ['notes', 'recommendations', 'follow_up_date', 'status']:
        if field in data:
            setattr(cs, field, data[field])
    db.session.commit()
    return success_response(cs.to_dict(), 'Counseling updated')


# ===================== MEDICAL =====================

@students_bp.route('/<int:student_id>/medical', methods=['GET'])
@school_required
def list_medical(student_id):
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    query = StudentMedical.query.filter_by(student_id=student_id, school_id=g.school_id)
    query = query.order_by(StudentMedical.record_date.desc())
    return success_response(paginate(query))


@students_bp.route('/<int:student_id>/medical', methods=['POST'])
@role_required('school_admin', 'teacher', 'counselor')
def add_medical(student_id):
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
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
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    docs = StudentDocument.query.filter_by(student_id=student_id, school_id=g.school_id).all()
    return success_response([d.to_dict() for d in docs])


@students_bp.route('/<int:student_id>/documents', methods=['POST'])
@role_required('school_admin', 'teacher')
def upload_document(student_id):
    Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
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


# ===================== HOUSES =====================

@students_bp.route('/houses', methods=['GET'])
@school_required
def list_houses():
    houses = StudentHouse.query.filter_by(school_id=g.school_id).all()
    return success_response([h.to_dict() for h in houses])


@students_bp.route('/houses', methods=['POST'])
@role_required('school_admin')
def create_house():
    data = request.get_json()
    house = StudentHouse(school_id=g.school_id, name=data['name'],
                         color=data.get('color'), motto=data.get('motto'))
    db.session.add(house)
    db.session.commit()
    return success_response(house.to_dict(), 'House created', 201)


@students_bp.route('/houses/<int:house_id>', methods=['PUT'])
@role_required('school_admin')
def update_house(house_id):
    house = StudentHouse.query.filter_by(id=house_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for field in ['name', 'color', 'motto', 'captain_student_id']:
        if field in data:
            setattr(house, field, data[field])
    db.session.commit()
    return success_response(house.to_dict(), 'House updated')


@students_bp.route('/assign-house', methods=['POST'])
@role_required('school_admin')
def assign_house():
    data = request.get_json()
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
def link_siblings():
    data = request.get_json()
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
def create_alumni():
    data = request.get_json()
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
def update_alumni(alumni_id):
    alumni = Alumni.query.filter_by(id=alumni_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for field in ['name', 'batch_year', 'phone', 'email', 'current_occupation',
                  'current_organization', 'higher_education', 'achievements_after', 'is_mentor']:
        if field in data:
            setattr(alumni, field, data[field])
    db.session.commit()
    return success_response(alumni.to_dict(), 'Alumni updated')


@students_bp.route('/graduate-to-alumni', methods=['POST'])
@role_required('school_admin')
def graduate_to_alumni():
    data = request.get_json()
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
    student = Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()
    data = student.to_dict()
    data['parents'] = [p.to_dict() for p in student.parents.limit(2).all()]
    return success_response(data)


@students_bp.route('/bulk-id-cards', methods=['POST'])
@role_required('school_admin')
def bulk_id_cards():
    data = request.get_json()
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
