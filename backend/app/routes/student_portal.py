"""Student-facing portal API.

Endpoints under /api/student/* return data scoped to the currently
logged-in student (User.role == 'student'). Each user account is linked
to exactly one Student row via Student.user_id.
"""
from flask import Blueprint, g, request
from datetime import datetime, date, timedelta
from sqlalchemy import or_

from app import db
from app.models.user import User
from app.models.student import Student, ParentDetail, Section
from app.models.attendance import StudentAttendance
from app.models.fee import FeeInstallment, FeePayment
from app.models.academic import (
    Timetable, Homework, ExamResult, ExamSchedule, Exam, ReportCard, Subject
)
from app.models.communication import Announcement
from app.models.parent import DailyActivity
from app.utils.decorators import school_required
from app.utils.helpers import success_response, error_response


student_portal_bp = Blueprint('student_portal', __name__)


def _resolve_student():
    """Return the Student row for the currently logged-in user, or
    None if the user is not linked to any student.

    For staff/admin testing, a `?student_id=` query param can be passed.
    Students themselves can never override their own scope.
    """
    user = g.current_user
    school_id = g.school_id

    # Staff / admin override (useful for impersonation / testing)
    override_id = request.args.get('student_id', type=int)
    if override_id and user.role and user.role.name in (
        'school_admin', 'super_admin', 'principal', 'teacher'
    ):
        return Student.query.filter_by(id=override_id, school_id=school_id).first()

    return Student.query.filter_by(user_id=user.id, school_id=school_id).first()


# ───────────────────────────── PROFILE ─────────────────────────────

@student_portal_bp.route('/me', methods=['GET'])
@school_required
def me():
    student = _resolve_student()
    if not student:
        return error_response('No student profile linked to this account', 404)

    data = student.to_dict()

    # Class teacher / co-class teacher
    if student.current_section_id:
        section = Section.query.get(student.current_section_id)
        if section:
            if section.class_teacher:
                ct = section.class_teacher
                data['class_teacher'] = {
                    'id': ct.id,
                    'name': f"{ct.first_name} {ct.last_name or ''}".strip(),
                    'phone': ct.phone, 'email': ct.email,
                    'designation': ct.designation, 'photo_url': ct.photo_url,
                }
            if section.co_class_teacher:
                cct = section.co_class_teacher
                data['co_class_teacher'] = {
                    'id': cct.id,
                    'name': f"{cct.first_name} {cct.last_name or ''}".strip(),
                    'phone': cct.phone, 'email': cct.email,
                    'designation': cct.designation, 'photo_url': cct.photo_url,
                }

    # Parents (read-only contact info)
    data['parents'] = [{
        'id': p.id, 'name': p.name, 'relation': p.relation,
        'phone': p.phone, 'email': p.email,
        'occupation': p.occupation,
    } for p in ParentDetail.query.filter_by(
        student_id=student.id, school_id=g.school_id
    ).all()]

    return success_response(data)


# ───────────────────────────── DASHBOARD SUMMARY ─────────────────────────────

@student_portal_bp.route('/dashboard', methods=['GET'])
@school_required
def dashboard():
    student = _resolve_student()
    if not student:
        return error_response('No student profile linked to this account', 404)

    school_id = g.school_id
    today = date.today()

    # Attendance summary (current academic year heuristic: last 12 months)
    year_ago = today - timedelta(days=365)
    att_records = StudentAttendance.query.filter(
        StudentAttendance.student_id == student.id,
        StudentAttendance.school_id == school_id,
        StudentAttendance.date >= year_ago,
        StudentAttendance.period.is_(None),
    ).all()
    total = len(att_records)
    present = sum(1 for r in att_records if r.status in ('present', 'late'))
    absent = sum(1 for r in att_records if r.status == 'absent')
    late = sum(1 for r in att_records if r.status == 'late')

    # Fees
    installments = FeeInstallment.query.filter_by(
        student_id=student.id, school_id=school_id
    ).all()
    total_fee = sum(float(i.amount) for i in installments)
    total_paid = sum(float(i.paid_amount or 0) for i in installments)
    overdue = sum(1 for i in installments
                  if i.status in ('pending', 'overdue', 'partial')
                  and i.due_date and i.due_date < today)

    # Upcoming exams (next 14 days, in student's class/section)
    upcoming_q = ExamSchedule.query.filter(
        ExamSchedule.school_id == school_id,
        ExamSchedule.exam_date >= today,
        ExamSchedule.exam_date <= today + timedelta(days=14),
    )
    if student.current_class_id:
        upcoming_q = upcoming_q.filter_by(class_id=student.current_class_id)
    if student.current_section_id:
        upcoming_q = upcoming_q.filter(or_(
            ExamSchedule.section_id == student.current_section_id,
            ExamSchedule.section_id.is_(None),
        ))
    upcoming_exams = upcoming_q.order_by(
        ExamSchedule.exam_date, ExamSchedule.start_time
    ).limit(10).all()

    # Pending homework (due in next 7 days, not past)
    hw_q = Homework.query.filter(
        Homework.school_id == school_id,
        Homework.class_id == student.current_class_id,
    )
    if student.current_section_id:
        hw_q = hw_q.filter(or_(
            Homework.section_id == student.current_section_id,
            Homework.section_id.is_(None),
        ))
    pending_hw = hw_q.filter(
        Homework.due_date >= today
    ).order_by(Homework.due_date).limit(5).all()

    # Today's classes
    day_map = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    today_day = day_map[today.weekday()]
    today_tt_q = Timetable.query.filter_by(
        school_id=school_id,
        class_id=student.current_class_id,
        day_of_week=today_day,
    )
    if student.current_section_id:
        today_tt_q = today_tt_q.filter(or_(
            Timetable.section_id == student.current_section_id,
            Timetable.section_id.is_(None),
        ))
    today_tt = today_tt_q.order_by(Timetable.start_time).all()

    # Recent results (last 5 entries)
    recent_results = ExamResult.query.filter_by(
        student_id=student.id, school_id=school_id
    ).order_by(ExamResult.id.desc()).limit(5).all()

    return success_response({
        'student': {
            'id': student.id,
            'name': f"{student.first_name} {student.last_name or ''}".strip(),
            'admission_no': student.admission_no,
            'roll_no': student.roll_no,
            'photo_url': student.photo_url,
            'class_name': student.current_class.name if student.current_class else None,
            'section_name': student.current_section.name if student.current_section else None,
        },
        'attendance': {
            'total_days': total,
            'present': present,
            'absent': absent,
            'late': late,
            'percentage': round(present / total * 100, 1) if total else 0,
        },
        'fees': {
            'total': total_fee,
            'paid': total_paid,
            'pending': max(total_fee - total_paid, 0),
            'overdue_count': overdue,
        },
        'today_timetable': [t.to_dict() for t in today_tt],
        'upcoming_exams': [{
            **e.to_dict(),
            'exam_name': (Exam.query.get(e.exam_id).name
                          if e.exam_id and Exam.query.get(e.exam_id) else None),
        } for e in upcoming_exams],
        'pending_homework': [h.to_dict() for h in pending_hw],
        'recent_results': [r.to_dict() for r in recent_results],
    })


# ───────────────────────────── ATTENDANCE ─────────────────────────────

@student_portal_bp.route('/attendance', methods=['GET'])
@school_required
def attendance():
    student = _resolve_student()
    if not student:
        return error_response('No student profile linked to this account', 404)

    records = StudentAttendance.query.filter(
        StudentAttendance.student_id == student.id,
        StudentAttendance.school_id == g.school_id,
        StudentAttendance.period.is_(None),
    ).order_by(StudentAttendance.date.desc()).all()

    total = len(records)
    present = sum(1 for r in records if r.status in ('present', 'late'))
    absent = sum(1 for r in records if r.status == 'absent')
    late = sum(1 for r in records if r.status == 'late')
    leave = sum(1 for r in records if r.status == 'leave')

    monthly = {}
    for r in records:
        key = r.date.strftime('%Y-%m')
        m = monthly.setdefault(key, {
            'month': key, 'present': 0, 'absent': 0, 'late': 0, 'leave': 0, 'total': 0
        })
        if r.status in ('present', 'late'):
            m['present'] += 1
        elif r.status == 'absent':
            m['absent'] += 1
        elif r.status == 'leave':
            m['leave'] += 1
        if r.status == 'late':
            m['late'] += 1
        m['total'] += 1

    return success_response({
        'summary': {
            'total_days': total, 'present': present, 'absent': absent,
            'late': late, 'leave': leave,
            'percentage': round(present / total * 100, 1) if total else 0,
        },
        'monthly': sorted(monthly.values(), key=lambda x: x['month'], reverse=True),
        'recent': [{
            'date': r.date.isoformat() if r.date else None,
            'status': r.status,
            'remarks': r.remarks,
        } for r in records[:60]],
    })


# ───────────────────────────── TIMETABLE ─────────────────────────────

@student_portal_bp.route('/timetable', methods=['GET'])
@school_required
def timetable():
    student = _resolve_student()
    if not student:
        return error_response('No student profile linked to this account', 404)

    if not student.current_class_id:
        return success_response([])

    q = Timetable.query.filter_by(
        school_id=g.school_id,
        class_id=student.current_class_id,
    )
    if student.current_section_id:
        q = q.filter(or_(
            Timetable.section_id == student.current_section_id,
            Timetable.section_id.is_(None),
        ))
    items = q.order_by(Timetable.day_of_week, Timetable.start_time).all()
    return success_response([t.to_dict() for t in items])


# ───────────────────────────── HOMEWORK ─────────────────────────────

@student_portal_bp.route('/homework', methods=['GET'])
@school_required
def homework():
    student = _resolve_student()
    if not student:
        return error_response('No student profile linked to this account', 404)

    if not student.current_class_id:
        return success_response([])

    status = request.args.get('status')  # pending|past
    q = Homework.query.filter_by(
        school_id=g.school_id,
        class_id=student.current_class_id,
    )
    if student.current_section_id:
        q = q.filter(or_(
            Homework.section_id == student.current_section_id,
            Homework.section_id.is_(None),
        ))
    today = date.today()
    if status == 'pending':
        q = q.filter(Homework.due_date >= today)
    elif status == 'past':
        q = q.filter(Homework.due_date < today)

    items = q.order_by(Homework.due_date.desc()).limit(50).all()
    return success_response([h.to_dict() for h in items])


# ───────────────────────────── EXAMS / RESULTS ─────────────────────────────

@student_portal_bp.route('/exams', methods=['GET'])
@school_required
def exams():
    student = _resolve_student()
    if not student:
        return error_response('No student profile linked to this account', 404)

    today = date.today()

    # Upcoming
    up_q = ExamSchedule.query.filter(
        ExamSchedule.school_id == g.school_id,
        ExamSchedule.exam_date >= today,
    )
    if student.current_class_id:
        up_q = up_q.filter_by(class_id=student.current_class_id)
    if student.current_section_id:
        up_q = up_q.filter(or_(
            ExamSchedule.section_id == student.current_section_id,
            ExamSchedule.section_id.is_(None),
        ))
    upcoming = up_q.order_by(ExamSchedule.exam_date, ExamSchedule.start_time).limit(30).all()

    # Past results grouped by exam — only show locked (published) marks
    results = ExamResult.query.filter_by(
        student_id=student.id, school_id=g.school_id
    ).join(ExamSchedule).filter(
        ExamSchedule.is_marks_locked == True
    ).order_by(ExamSchedule.exam_date.desc()).all()

    grouped = {}
    for r in results:
        exam_name = r.schedule.exam.name if r.schedule and r.schedule.exam else 'Unknown'
        bucket = grouped.setdefault(exam_name, {
            'exam': exam_name, 'subjects': [], 'total_marks': 0, 'obtained': 0,
        })
        # Build subject result with percentage, grade, and pass/fail
        subject_result = r.to_dict()
        max_marks = float(r.schedule.max_marks) if r.schedule and r.schedule.max_marks else None
        marks = float(r.marks_obtained) if r.marks_obtained is not None else None
        passing_marks = float(r.schedule.passing_marks) if r.schedule and r.schedule.passing_marks else None

        subject_result['percentage'] = round(marks / max_marks * 100, 2) if marks is not None and max_marks else None
        subject_result['grade'] = r.grade
        subject_result['grade_point'] = float(r.grade_point) if r.grade_point else None
        subject_result['pass_fail'] = (
            'pass' if marks is not None and passing_marks is not None and marks >= passing_marks
            else 'fail' if marks is not None and passing_marks is not None
            else 'absent' if r.is_absent
            else None
        )

        bucket['subjects'].append(subject_result)
        if r.marks_obtained is not None:
            bucket['obtained'] += float(r.marks_obtained)
        if r.schedule and r.schedule.max_marks:
            bucket['total_marks'] += float(r.schedule.max_marks)

    for b in grouped.values():
        b['percentage'] = round(b['obtained'] / b['total_marks'] * 100, 1) if b['total_marks'] else 0

    report_cards = ReportCard.query.filter_by(
        student_id=student.id, school_id=g.school_id
    ).order_by(ReportCard.generated_at.desc()).all()

    return success_response({
        'upcoming': [{
            **e.to_dict(),
            'exam_name': (Exam.query.get(e.exam_id).name
                          if e.exam_id and Exam.query.get(e.exam_id) else None),
        } for e in upcoming],
        'results_by_exam': list(grouped.values()),
        'report_cards': [rc.to_dict() for rc in report_cards],
    })


# ───────────────────────────── FEES (read-only) ─────────────────────────────

@student_portal_bp.route('/fees', methods=['GET'])
@school_required
def fees():
    student = _resolve_student()
    if not student:
        return error_response('No student profile linked to this account', 404)

    installments = FeeInstallment.query.filter_by(
        student_id=student.id, school_id=g.school_id
    ).order_by(FeeInstallment.due_date).all()
    payments = FeePayment.query.filter_by(
        student_id=student.id, school_id=g.school_id
    ).order_by(FeePayment.payment_date.desc()).limit(20).all()

    total = sum(float(i.amount) for i in installments)
    paid = sum(float(i.paid_amount or 0) for i in installments)
    today = date.today()
    overdue = [i for i in installments
               if i.status in ('pending', 'overdue', 'partial')
               and i.due_date and i.due_date < today]

    return success_response({
        'summary': {
            'total': total,
            'paid': paid,
            'pending': max(total - paid, 0),
            'overdue_count': len(overdue),
            'overdue_amount': sum(float(i.amount) - float(i.paid_amount or 0) for i in overdue),
        },
        'installments': [i.to_dict() for i in installments],
        'recent_payments': [p.to_dict() for p in payments],
    })


# ───────────────────────────── ANNOUNCEMENTS ─────────────────────────────

@student_portal_bp.route('/announcements', methods=['GET'])
@school_required
def announcements():
    student = _resolve_student()
    if not student:
        return error_response('No student profile linked to this account', 404)

    # All-school + students-targeted + class-specific for student's class
    q = Announcement.query.filter(
        Announcement.school_id == g.school_id,
        Announcement.is_published == True,
        or_(
            Announcement.target_audience.in_(('all', 'students')),
            db.and_(
                Announcement.target_audience == 'class_specific',
                Announcement.target_class_id == student.current_class_id,
            ),
        ),
    ).order_by(Announcement.published_at.desc()).limit(30)
    return success_response([a.to_dict() for a in q.all()])


# ───────────────────────────── DAILY ACTIVITIES ─────────────────────────────

@student_portal_bp.route('/activities', methods=['GET'])
@school_required
def activities():
    student = _resolve_student()
    if not student:
        return error_response('No student profile linked to this account', 404)

    q = DailyActivity.query.filter(
        DailyActivity.school_id == g.school_id,
        or_(
            DailyActivity.class_id == student.current_class_id,
            DailyActivity.class_id.is_(None),
            DailyActivity.student_id == student.id,
        ),
    ).order_by(DailyActivity.activity_date.desc()).limit(30)
    return success_response([a.to_dict() for a in q.all()])
