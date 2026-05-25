from flask import Blueprint, g
from sqlalchemy import func, extract, case, or_
from datetime import datetime, date, timedelta
from app import db
from app.models.student import Student
from app.models.lead import Lead
from app.models.fee import FeePayment
from app.models.admission import Admission
from app.models.attendance import StudentAttendance
from app.models.staff import Staff
from app.utils.decorators import school_required
from app.utils.helpers import success_response, error_response, get_teacher_scope
from app.models.academic import TeacherSubject, Timetable, Subject, ExamSchedule
from app.models.student import Section
from sqlalchemy.orm import joinedload

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/', methods=['GET'])
@school_required
def get_dashboard():
    school_id = g.school_id
    today = date.today()
    month_start = today.replace(day=1)

    # Teacher scoping
    scope = get_teacher_scope()
    
    try:
        if scope and scope['section_ids']:
            total_students = Student.query.filter(
                Student.school_id == school_id, Student.status == 'active',
                Student.current_section_id.in_(scope['section_ids'])
            ).count()
        elif scope and scope['class_ids']:
            total_students = Student.query.filter(
                Student.school_id == school_id, Student.status == 'active',
                Student.current_class_id.in_(scope['class_ids'])
            ).count()
        else:
            total_students = Student.query.filter_by(school_id=school_id, status='active').count()
    except Exception:
        total_students = 0

    try:
        total_staff = Staff.query.filter_by(school_id=school_id, status='active').count()
    except Exception:
        total_staff = 0
    
    try:
        # Attendance today with teacher scope
        att_query = db.session.query(
            func.count(StudentAttendance.id),
            func.sum(case((StudentAttendance.status == 'present', 1), else_=0))
        ).filter(StudentAttendance.school_id == school_id, StudentAttendance.date == today)
        
        if scope and scope['section_ids']:
            att_query = att_query.filter(StudentAttendance.section_id.in_(scope['section_ids']))
        elif scope and scope['class_ids']:
            att_query = att_query.filter(StudentAttendance.class_id.in_(scope['class_ids']))
        
        att_stats = att_query.first()
        total_marked = att_stats[0] or 0
        present_today = int(att_stats[1] or 0)
    except Exception:
        db.session.rollback()
        total_marked = 0
        present_today = 0
    
    try:
        # Fees this month
        monthly_collection = db.session.query(
            func.coalesce(func.sum(FeePayment.amount_paid), 0)
        ).filter(
            FeePayment.school_id == school_id,
            FeePayment.status == 'completed',
            FeePayment.payment_date >= month_start,
            FeePayment.payment_date <= today
        ).scalar()
    except Exception:
        db.session.rollback()
        monthly_collection = 0
    
    try:
        # Leads + Admissions in fewer round trips
        new_leads = Lead.query.filter(
            Lead.school_id == school_id,
            Lead.created_at >= month_start
        ).count()
    except Exception:
        new_leads = 0
    
    try:
        pending_admissions = Admission.query.filter(
            Admission.school_id == school_id,
            Admission.status.notin_(['enrolled', 'rejected'])
        ).count()
    except Exception:
        pending_admissions = 0
    
    try:
        # Recent leads (no relationship lazy-loads needed — Lead.to_dict() is lightweight)
        recent_leads = Lead.query.filter_by(school_id=school_id).order_by(
            Lead.created_at.desc()
        ).limit(5).all()
    except Exception:
        db.session.rollback()
        recent_leads = []
    
    try:
        # Recent payments - eager load student to avoid N+1
        recent_payments = FeePayment.query.options(
            joinedload(FeePayment.student)
        ).filter_by(
            school_id=school_id, status='completed'
        ).order_by(FeePayment.created_at.desc()).limit(5).all()
    except Exception:
        db.session.rollback()
        recent_payments = []
    
    return success_response({
        'stats': {
            'total_students': total_students,
            'total_staff': total_staff,
            'attendance_today': {
                'present': present_today,
                'total_marked': total_marked,
                'percentage': round((present_today / total_marked * 100), 1) if total_marked > 0 else 0
            },
            'monthly_fee_collection': float(monthly_collection),
            'new_leads_this_month': new_leads,
            'pending_admissions': pending_admissions
        },
        'recent_leads': [l.to_dict() for l in recent_leads],
        'recent_payments': [p.to_dict() for p in recent_payments]
    })


# ─── Teacher Dashboard ───────────────────────────────────────

@dashboard_bp.route('/teacher', methods=['GET'])
@school_required
def get_teacher_dashboard():
    from app.models.user import User
    school_id = g.school_id
    user = User.query.get(g.user_id)
    if not user:
        return error_response('User not found', 404)

    staff = Staff.query.filter_by(school_id=school_id, user_id=g.user_id).first()
    if not staff:
        return error_response('Staff record not found', 404)

    today = date.today()
    day_map = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    today_day = day_map[today.weekday()]

    # Teacher's subjects
    subjects = TeacherSubject.query.filter_by(
        teacher_id=staff.id, school_id=school_id, status='active'
    ).options(
        joinedload(TeacherSubject.subject),
        joinedload(TeacherSubject.class_ref),
        joinedload(TeacherSubject.section_ref)
    ).all()

    # Sections where teacher is class teacher / co-class teacher
    my_sections = Section.query.filter(
        Section.school_id == school_id,
        or_(Section.class_teacher_id == staff.id, Section.co_class_teacher_id == staff.id)
    ).all()
    my_section_ids = [s.id for s in my_sections]

    # Student count in teacher's sections
    student_count = Student.query.filter(
        Student.school_id == school_id,
        Student.status == 'active',
        Student.section_id.in_(my_section_ids)
    ).count() if my_section_ids else 0

    # Today's attendance for teacher's sections
    att_stats = None
    if my_section_ids:
        att_stats = db.session.query(
            func.count(StudentAttendance.id),
            func.sum(case((StudentAttendance.status == 'present', 1), else_=0))
        ).filter(
            StudentAttendance.school_id == school_id,
            StudentAttendance.date == today,
            StudentAttendance.section_id.in_(my_section_ids)
        ).first()

    total_marked = att_stats[0] or 0 if att_stats else 0
    present_today = int(att_stats[1] or 0) if att_stats else 0

    # Today's timetable
    today_timetable = Timetable.query.options(
        joinedload(Timetable.subject),
        joinedload(Timetable.class_ref),
        joinedload(Timetable.section_ref)
    ).filter(
        Timetable.school_id == school_id,
        Timetable.teacher_id == staff.id,
        Timetable.day_of_week == today_day
    ).order_by(Timetable.start_time).all()

    # Upcoming exams (next 7 days) - check exam schedules for teacher's subjects
    subject_ids = [ts.subject_id for ts in subjects]
    upcoming_exams = []
    if subject_ids:
        upcoming_exams = db.session.query(ExamSchedule).options(
            joinedload(ExamSchedule.exam),
            joinedload(ExamSchedule.subject),
            joinedload(ExamSchedule.class_ref),
            joinedload(ExamSchedule.section_ref)
        ).filter(
            ExamSchedule.school_id == school_id,
            ExamSchedule.subject_id.in_(subject_ids),
            ExamSchedule.exam_date >= today,
            ExamSchedule.exam_date <= today + timedelta(days=7)
        ).order_by(ExamSchedule.exam_date).all()

    return success_response({
        'teacher': staff.to_dict(),
        'my_classes': [{
            'section_id': s.id,
            'section_name': s.name,
            'class_id': s.class_id,
            'class_name': s.class_ref.name if s.class_ref else None,
            'role': 'Class Teacher' if s.class_teacher_id == staff.id else 'Co-Class Teacher',
            'student_count': Student.query.filter_by(
                school_id=school_id, class_id=s.class_id, section_id=s.id, status='active'
            ).count()
        } for s in my_sections],
        'my_subjects': [{
            'id': ts.id,
            'subject_id': ts.subject_id,
            'subject_name': ts.subject.name if ts.subject else None,
            'class_id': ts.class_id,
            'class_name': ts.class_ref.name if ts.class_ref else None,
            'section_id': ts.section_id,
            'section_name': ts.section_ref.name if ts.section_ref else None,
            'periods_per_week': ts.periods_per_week,
        } for ts in subjects],
        'today_timetable': [{
            'id': t.id,
            'class_name': t.class_ref.name if t.class_ref else None,
            'section_name': t.section_ref.name if t.section_ref else None,
            'subject_name': t.subject.name if t.subject else None,
            'start_time': t.start_time.strftime('%H:%M') if t.start_time else None,
            'end_time': t.end_time.strftime('%H:%M') if t.end_time else None,
            'room_no': t.room_no,
            'period_number': t.period_number,
            'is_break': t.is_break,
        } for t in today_timetable],
        'today_attendance': {
            'present': present_today,
            'total_marked': total_marked,
            'student_count': student_count,
            'percentage': round((present_today / total_marked * 100), 1) if total_marked > 0 else 0
        },
        'upcoming_exams': [{
            'id': e.id,
            'exam_name': e.exam.name if e.exam else None,
            'subject_name': e.subject.name if e.subject else None,
            'class_name': e.class_ref.name if e.class_ref else None,
            'section_name': e.section_ref.name if e.section_ref else None,
            'exam_date': e.exam_date.isoformat() if e.exam_date else None,
            'start_time': e.start_time.strftime('%H:%M') if e.start_time else None,
            'end_time': e.end_time.strftime('%H:%M') if e.end_time else None,
        } for e in upcoming_exams],
    })
