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
from app.models.hostel import HostelAllocation, MessMenu
from app.models.library import LibraryIssue
from app.utils.decorators import school_required
from app.utils.helpers import success_response, error_response, working_records


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
    override_id = request.args.get('student_id', type=str)
    if override_id and user.role and user.has_role(
        'school_admin', 'super_admin', 'principal', 'teacher'
    ):
        return Student.query.filter_by(admission_no=override_id, school_id=school_id).first()

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
        student_id=student.admission_no, school_id=g.school_id
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
        StudentAttendance.student_id == student.admission_no,
        StudentAttendance.school_id == school_id,
        StudentAttendance.date >= year_ago,
        StudentAttendance.period.is_(None),
    ).all()
    att_records = working_records(att_records, school_id, context='student')
    total = len(att_records)
    present = sum(1 for r in att_records if r.status in ('present', 'late'))
    absent = sum(1 for r in att_records if r.status == 'absent')
    late = sum(1 for r in att_records if r.status == 'late')

    # Fees
    installments = FeeInstallment.query.filter_by(
        student_id=student.admission_no, school_id=school_id
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
        student_id=student.admission_no, school_id=school_id
    ).order_by(ExamResult.id.desc()).limit(5).all()

    return success_response({
        'student': {
            'id': student.admission_no,
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
        StudentAttendance.student_id == student.admission_no,
        StudentAttendance.school_id == g.school_id,
        StudentAttendance.period.is_(None),
    ).order_by(StudentAttendance.date.desc()).all()
    records = working_records(records, g.school_id, context='student')

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


@student_portal_bp.route('/attendance/monthly', methods=['GET'])
@school_required
def student_attendance_monthly():
    student = _resolve_student()
    if not student:
        return error_response('No student profile linked to this account', 404)

    month = request.args.get('month')
    if not month:
        today = date.today()
        month = f"{today.year}-{today.month:02d}"

    year, mon = month.split('-')
    from_date = date(int(year), int(mon), 1)
    if int(mon) == 12:
        to_date = date(int(year) + 1, 1, 1)
    else:
        to_date = date(int(year), int(mon) + 1, 1)

    records = StudentAttendance.query.filter(
        StudentAttendance.student_id == student.admission_no,
        StudentAttendance.school_id == g.school_id,
        StudentAttendance.period.is_(None),
        StudentAttendance.date >= from_date,
        StudentAttendance.date < to_date,
    ).order_by(StudentAttendance.date.desc()).all()
    records = working_records(records, g.school_id, context='student')

    total = len(records)
    present = sum(1 for r in records if r.status in ('present', 'late', 'half_day'))
    absent = sum(1 for r in records if r.status == 'absent')
    late = sum(1 for r in records if r.status == 'late')
    half_day = sum(1 for r in records if r.status == 'half_day')
    leave = sum(1 for r in records if r.status == 'leave')

    return success_response({
        'month': month,
        'records': [r.to_dict() for r in records],
        'summary': {
            'total_days': total,
            'present': present,
            'absent': absent,
            'late': late,
            'half_day': half_day,
            'leave': leave,
            'percentage': round(present / total * 100, 1) if total else 0,
        },
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
        student_id=student.admission_no, school_id=g.school_id
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
        subject_result['subject_name'] = (r.schedule.subject.name if r.schedule and r.schedule.subject else None)
        max_marks = float(r.schedule.max_marks) if r.schedule and r.schedule.max_marks else None
        marks = float(r.marks_obtained) if r.marks_obtained is not None else None
        passing_marks = float(r.schedule.passing_marks) if r.schedule and r.schedule.passing_marks else None

        subject_result['percentage'] = round(marks / max_marks * 100, 2) if marks is not None and max_marks else None
        subject_result['grade'] = r.grade
        subject_result['grade_point'] = float(r.grade_point) if r.grade_point else None

        # Compute grade dynamically if missing
        if not subject_result['grade'] and marks is not None and max_marks:
            exam_obj = r.schedule.exam if r.schedule else None
            from app.services.marks_entry_service import calculate_grade
            grade_info = calculate_grade(marks, max_marks, exam_obj)
            subject_result['grade'] = grade_info.get('grade')
            subject_result['grade_point'] = grade_info.get('grade_point')
            if not subject_result['percentage'] and grade_info.get('percentage'):
                subject_result['percentage'] = grade_info['percentage']

        # Default grade from percentage if still no grading system configured
        if not subject_result['grade'] and subject_result['percentage'] is not None:
            pct = subject_result['percentage']
            if pct >= 90:
                subject_result['grade'] = 'A+'
            elif pct >= 80:
                subject_result['grade'] = 'A'
            elif pct >= 70:
                subject_result['grade'] = 'B+'
            elif pct >= 60:
                subject_result['grade'] = 'B'
            elif pct >= 50:
                subject_result['grade'] = 'C'
            elif pct >= 40:
                subject_result['grade'] = 'D'
            elif pct >= 33:
                subject_result['grade'] = 'E'
            else:
                subject_result['grade'] = 'F'

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
        # Overall grade from total percentage
        pct = b['percentage']
        if pct >= 90:
            b['grade'] = 'A+'
        elif pct >= 80:
            b['grade'] = 'A'
        elif pct >= 70:
            b['grade'] = 'B+'
        elif pct >= 60:
            b['grade'] = 'B'
        elif pct >= 50:
            b['grade'] = 'C'
        elif pct >= 40:
            b['grade'] = 'D'
        elif pct >= 33:
            b['grade'] = 'E'
        else:
            b['grade'] = 'F'

    report_cards = ReportCard.query.filter_by(
        student_id=student.admission_no, school_id=g.school_id
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


# ───────────────────── STUDENT EXAMS LIST (all statuses) ─────────────────────

def _derive_exam_status(exam, schedules):
    """Derive exam status from its papers' dates and statuses.
    - cancelled: all papers cancelled
    - completed: last paper date < today
    - ongoing:   first paper date <= today <= last paper date
    - upcoming:  first paper date > today (or all postponed → rescheduled as upcoming)
    """
    today = date.today()
    if not schedules:
        return exam.status or 'upcoming'

    all_cancelled = all(getattr(s, 'paper_status', 'scheduled') == 'cancelled' for s in schedules)
    if all_cancelled:
        return 'cancelled'

    effective_dates = []
    for s in schedules:
        if getattr(s, 'paper_status', 'scheduled') == 'postponed' and s.postponed_to:
            effective_dates.append(s.postponed_to)
        elif getattr(s, 'paper_status', 'scheduled') != 'cancelled':
            effective_dates.append(s.exam_date)

    if not effective_dates:
        return 'cancelled'

    first_date = min(effective_dates)
    last_date = max(effective_dates)

    if last_date < today:
        return 'completed'
    elif first_date <= today:
        return 'ongoing'
    else:
        return 'upcoming'


@student_portal_bp.route('/exams-list', methods=['GET'])
@school_required
def exams_list():
    """All exams for student with derived status from papers."""
    student = _resolve_student()
    if not student:
        return error_response('No student profile linked to this account', 404)

    from app.models.academic import ExamSchedule

    all_exams = Exam.query.filter(
        Exam.school_id == g.school_id,
    ).order_by(Exam.start_date.desc()).all()

    result = []
    for exam in all_exams:
        if student.current_class_id and exam.class_ids:
            if student.current_class_id not in exam.class_ids:
                continue

        schedules = ExamSchedule.query.filter_by(
            exam_id=exam.id, school_id=g.school_id
        ).order_by(ExamSchedule.exam_date, ExamSchedule.start_time).all()

        derived = _derive_exam_status(exam, schedules)

        result.append({
            'id': exam.id,
            'name': exam.name,
            'description': exam.description,
            'start_date': exam.start_date.isoformat() if exam.start_date else None,
            'end_date': exam.end_date.isoformat() if exam.end_date else None,
            'exam_type': exam.exam_type.name if exam.exam_type else None,
            'status': derived,
            'total_papers': len(schedules),
            'db_status': exam.status,
        })

    return success_response(result)


@student_portal_bp.route('/exams-list/<int:exam_id>/datesheet', methods=['GET'])
@school_required
def exams_list_datesheet(exam_id):
    """Datesheet for a specific exam (student view)."""
    student = _resolve_student()
    if not student:
        return error_response('No student profile linked to this account', 404)

    from app.models.academic import ExamSchedule

    exam = Exam.query.filter_by(id=exam_id, school_id=g.school_id).first()
    if not exam:
        return error_response('Exam not found', 404)

    schedules = ExamSchedule.query.filter_by(
        exam_id=exam_id, school_id=g.school_id
    ).order_by(ExamSchedule.exam_date, ExamSchedule.start_time).all()

    today = date.today()
    enriched = []
    for s in schedules:
        ps = getattr(s, 'paper_status', 'scheduled') or 'scheduled'
        if ps == 'scheduled':
            if s.exam_date < today:
                paper_status = 'completed'
            elif s.exam_date == today:
                paper_status = 'today'
            else:
                paper_status = 'upcoming'
        else:
            paper_status = ps

        enriched.append({
            **s.to_dict(),
            'paper_status': paper_status,
        })

    return success_response({
        'exam': {
            'id': exam.id,
            'name': exam.name,
            'start_date': exam.start_date.isoformat() if exam.start_date else None,
            'end_date': exam.end_date.isoformat() if exam.end_date else None,
        },
        'schedules': enriched,
    })


@student_portal_bp.route('/exams-list/<int:exam_id>/seating', methods=['GET'])
@school_required
def exams_list_seating(exam_id):
    """Full room seating layout for a specific exam (student view) with own seat highlighted."""
    student = _resolve_student()
    if not student:
        return error_response('No student profile linked to this account', 404)

    from app.models.academic import ExamSeating as ExamSeatingModel, ExamSchedule
    from app.models.exam_extended import ExamSeatingArrangement, RoomSeatingGrid
    from app.models.student import Student, Class, Section

    exam = Exam.query.filter_by(id=exam_id, school_id=g.school_id).first()
    if not exam:
        return error_response('Exam not found', 404)

    schedule_ids = [s.id for s in ExamSchedule.query.filter_by(
        exam_id=exam_id, school_id=g.school_id
    ).all()]

    my_seat = None
    room_hall = None
    room_title = None
    room_date = None
    room_time = None
    all_seats = []

    # Build student lookup maps for resolving grid cells
    all_students = Student.query.filter_by(school_id=g.school_id, status='active').all()

    def _student_class_section(s):
        cls_name = ''
        if s.current_class_id:
            cls = Class.query.get(s.current_class_id)
            if cls:
                cls_name = cls.name
        if s.current_section_id:
            sec = Section.query.get(s.current_section_id)
            if sec:
                cls_name = f"{cls_name}-{sec.name}" if cls_name else sec.name
        return cls_name

    my_class_section = _student_class_section(student).lower()

    # Map: "classsection_rollno" -> student
    class_roll_to_student = {}
    for s in all_students:
        cs = _student_class_section(s)
        if cs and s.roll_no:
            key = f"{cs.lower()}_{str(s.roll_no).strip().lower()}"
            class_roll_to_student[key] = s

    def cell_matches_student(cell):
        if not isinstance(cell, dict):
            return False
        cell_roll = (cell.get('roll_no', '') or '').strip()
        cell_class = (cell.get('class_section', '') or '').strip().lower()
        if not cell_roll:
            return False
        if cell_class and cell_roll:
            key = f"{cell_class}_{cell_roll.strip().lower()}"
            resolved = class_roll_to_student.get(key)
            if resolved and resolved.admission_no == student.admission_no:
                return True
        return False

    def resolve_cell_name(cell):
        if not isinstance(cell, dict):
            return ''
        cell_roll = (cell.get('roll_no', '') or '').strip()
        cell_class = (cell.get('class_section', '') or '').strip().lower()
        if cell_class and cell_roll:
            key = f"{cell_class}_{cell_roll.strip().lower()}"
            resolved = class_roll_to_student.get(key)
            if resolved:
                return f"{resolved.first_name} {resolved.last_name}"
        return cell.get('class_section', '') or cell_roll

    # 1) Check ExamSeating (per-student seating from generate_seating)
    if schedule_ids:
        my_seating = ExamSeatingModel.query.filter(
            ExamSeatingModel.exam_schedule_id.in_(schedule_ids),
            ExamSeatingModel.student_id == student.admission_no,
        ).first()

        if my_seating:
            hall_seats = ExamSeatingModel.query.filter(
                ExamSeatingModel.exam_schedule_id.in_(schedule_ids),
                ExamSeatingModel.hall_id == my_seating.hall_id,
            ).all()

            my_seat = {'column': my_seating.column_number, 'row': my_seating.row_number}
            room_hall = my_seating.hall.name if my_seating.hall else None
            room_title = my_seating.hall.name if my_seating.hall else None
            schedule = ExamSchedule.query.get(my_seating.exam_schedule_id)
            if schedule:
                room_date = str(schedule.exam_date) if schedule.exam_date else None
                room_time = str(schedule.start_time) if schedule.start_time else None
            all_seats = [{
                'row': s.row_number,
                'column': s.column_number,
                'roll_no': s.student_id,
                'class_section': f"{s.student.first_name} {s.student.last_name}" if s.student else '',
                'is_me': s.student_id == student.admission_no,
            } for s in hall_seats]

    # 2) Fallback: ExamSeatingArrangement (grid-based approved arrangements)
    if not my_seat:
        approved = ExamSeatingArrangement.query.filter_by(
            exam_id=exam_id, school_id=g.school_id, status='approved'
        ).all()
        for arr in approved:
            grid = arr.grid or []
            for col_idx, col in enumerate(grid):
                if isinstance(col, list):
                    for row_idx, cell in enumerate(col):
                        if cell_matches_student(cell):
                            my_seat = {'column': col_idx + 1, 'row': row_idx + 1}
                            room_hall = arr.hall.name if arr.hall else None
                            room_title = arr.title
                            all_seats = []
                            for c_idx, c in enumerate(grid):
                                if isinstance(c, list):
                                    for r_idx, cell2 in enumerate(c):
                                        if isinstance(cell2, dict):
                                            roll = cell2.get('roll_no', '').strip()
                                            name = resolve_cell_name(cell2)
                                            all_seats.append({
                                                'row': r_idx + 1,
                                                'column': c_idx + 1,
                                                'roll_no': roll,
                                                'class_section': name,
                                                'is_me': cell_matches_student(cell2),
                                            })
                            break
                if my_seat:
                    break
            if my_seat:
                break

    # 3) Fallback: RoomSeatingGrid (room-wise saved grids)
    if not my_seat:
        grids = RoomSeatingGrid.query.filter_by(
            exam_id=exam_id, school_id=g.school_id
        ).all()
        for rg in grids:
            grid = rg.grid or []
            for col_idx, col in enumerate(grid):
                if isinstance(col, list):
                    for row_idx, cell in enumerate(col):
                        if cell_matches_student(cell):
                            my_seat = {'column': col_idx + 1, 'row': row_idx + 1}
                            room_hall = rg.hall.name if rg.hall else None
                            room_title = rg.hall.name if rg.hall else None
                            room_date = str(rg.date) if rg.date else None
                            room_time = str(rg.start_time) if rg.start_time else None
                            all_seats = []
                            for c_idx, c in enumerate(grid):
                                if isinstance(c, list):
                                    for r_idx, cell2 in enumerate(c):
                                        if isinstance(cell2, dict):
                                            roll = cell2.get('roll_no', '') or cell2.get('admission_no', '')
                                            name = resolve_cell_name(cell2)
                                            all_seats.append({
                                                'row': r_idx + 1,
                                                'column': c_idx + 1,
                                                'roll_no': roll,
                                                'class_section': name,
                                                'is_me': cell_matches_student(cell2),
                                            })
                            break
                if my_seat:
                    break
            if my_seat:
                break

    if not my_seat:
        return success_response({
            'exam_id': exam_id,
            'my_seat': None,
            'room': None,
            'grid': [],
        })

    return success_response({
        'exam_id': exam_id,
        'my_seat': my_seat,
        'room': {'hall': room_hall, 'title': room_title, 'date': room_date, 'start_time': room_time},
        'grid': all_seats,
    })


# ───────────────────────────── FEES (read-only) ─────────────────────────────

@student_portal_bp.route('/fees', methods=['GET'])
@school_required
def fees():
    student = _resolve_student()
    if not student:
        return error_response('No student profile linked to this account', 404)

    installments = FeeInstallment.query.filter_by(
        student_id=student.admission_no, school_id=g.school_id
    ).order_by(FeeInstallment.due_date).all()
    payments = FeePayment.query.filter_by(
        student_id=student.admission_no, school_id=g.school_id
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


# ───────────────────────────── LIBRARY ─────────────────────────────

@student_portal_bp.route('/library', methods=['GET'])
@school_required
def library():
    student = _resolve_student()
    if not student:
        return error_response('No student profile linked to this account', 404)

    issues = LibraryIssue.query.filter_by(
        school_id=g.school_id, issued_to=student.admission_no, issued_to_type='student'
    ).order_by(LibraryIssue.issue_date.desc()).all()

    current = [i for i in issues if i.status in ('issued', 'overdue')]
    history = [i for i in issues if i.status in ('returned', 'lost')]
    total_fine_due = sum(float(i.fine_amount or 0) for i in current + history if not i.fine_paid)

    return success_response({
        'current': [i.to_dict() for i in current],
        'history': [i.to_dict() for i in history[:20]],
        'total_fine_due': total_fine_due,
    })


# ───────────────────────────── HOSTEL ─────────────────────────────

@student_portal_bp.route('/hostel', methods=['GET'])
@school_required
def hostel():
    student = _resolve_student()
    if not student:
        return error_response('No student profile linked to this account', 404)

    allocation = HostelAllocation.query.filter_by(
        student_id=student.admission_no, school_id=g.school_id, status='active'
    ).order_by(HostelAllocation.allocation_date.desc()).first()

    if not allocation:
        return success_response({'has_hostel': False})

    today = date.today()
    menu = MessMenu.query.filter(
        MessMenu.school_id == g.school_id,
        MessMenu.day_of_week == today.strftime('%A'),
        MessMenu.is_active == True,
    ).all()

    return success_response({
        'has_hostel': True,
        'allocation': allocation.to_dict(),
        'today_menu': [m.to_dict() for m in menu],
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
            DailyActivity.student_id == student.admission_no,
        ),
    ).order_by(DailyActivity.activity_date.desc()).limit(30)
    return success_response([a.to_dict() for a in q.all()])


# ─────────────────────── MY SYLLABUS PROGRESS (read-only) ───────────────────────

@student_portal_bp.route('/my-syllabus', methods=['GET'])
@school_required
def my_syllabus():
    student = _resolve_student()
    if not student:
        return error_response('No student profile linked to this account', 404)

    from app.models.academic import Syllabus, ClassSubject, TeacherSubject, Subject

    class_id = student.current_class_id
    if not class_id and student.current_section_id:
        sec = Section.query.get(student.current_section_id)
        if sec:
            class_id = sec.class_id

    if not class_id:
        return success_response([])

    all_subjects = ClassSubject.query.filter_by(
        school_id=g.school_id, class_id=class_id
    ).all()

    subject_teacher = {}
    for cs in all_subjects:
        teacher_name = None
        if cs.teacher_id and cs.teacher:
            teacher_name = f"{cs.teacher.first_name} {cs.teacher.last_name or ''}".strip()
        subject_teacher[cs.subject_id] = {
            'teacher_name': teacher_name,
            'class_subject_id': cs.id,
        }

    ts_rows = TeacherSubject.query.filter_by(
        school_id=g.school_id, class_id=class_id, status='active'
    ).all()
    for ts in ts_rows:
        if ts.subject_id not in subject_teacher or not subject_teacher[ts.subject_id]['teacher_name']:
            tname = None
            if ts.teacher_id and ts.teacher:
                tname = f"{ts.teacher.first_name} {ts.teacher.last_name or ''}".strip()
            if tname:
                subject_teacher[ts.subject_id] = {
                    'teacher_name': tname,
                    'class_subject_id': subject_teacher.get(ts.subject_id, {}).get('class_subject_id'),
                }

    syllabus = Syllabus.query.filter(
        Syllabus.school_id == g.school_id,
        Syllabus.class_id == class_id,
    ).order_by(Syllabus.subject_id, Syllabus.chapter_number).all()

    grouped = {}
    for s in syllabus:
        key = f"{s.class_id}_{s.subject_id}"
        if key not in grouped:
            grouped[key] = {
                'class_id': s.class_id,
                'class_name': s.class_ref.name if s.class_ref else None,
                'subject_id': s.subject_id,
                'subject_name': s.subject.name if s.subject else None,
                'teacher_name': subject_teacher.get(s.subject_id, {}).get('teacher_name'),
                'book_name': None,
                'total_chapters': 0,
                'completed_chapters': 0,
                'completion_pct': 0,
                'chapters': [],
            }
        if s.chapter_number is None:
            grouped[key]['book_name'] = s.book_name
            grouped[key]['total_chapters'] = s.total_chapters or 0
        else:
            grouped[key]['chapters'].append({
                'id': s.id,
                'chapter_number': s.chapter_number,
                'chapter_name': s.chapter_name,
                'topics': s.topics,
                'completion_percentage': s.completion_percentage or 0,
                'status': s.status or 'not_started',
                'estimated_hours': s.estimated_hours,
            })
            if (s.completion_percentage or 0) >= 100:
                grouped[key]['completed_chapters'] += 1

    for g_val in grouped.values():
        total = g_val['total_chapters'] or len(g_val['chapters'])
        g_val['total_chapters'] = total
        g_val['completion_pct'] = round(
            g_val['completed_chapters'] / total * 100, 1
        ) if total else 0

    for subject_id, info in subject_teacher.items():
        key = f"{class_id}_{subject_id}"
        if key not in grouped:
            subj = Subject.query.get(subject_id)
            grouped[key] = {
                'class_id': class_id,
                'class_name': None,
                'subject_id': subject_id,
                'subject_name': subj.name if subj else None,
                'teacher_name': info.get('teacher_name'),
                'book_name': None,
                'total_chapters': 0,
                'completed_chapters': 0,
                'completion_pct': 0,
                'chapters': [],
            }

    result = list(grouped.values())
    result.sort(key=lambda x: (x['subject_name'] or '').lower())
    return success_response(result)


# ─────────────────────── MY PROFILE (read-only, no password editing) ───────────────────────

@student_portal_bp.route('/my-profile', methods=['GET'])
@school_required
def my_profile():
    student = _resolve_student()
    if not student:
        return error_response('No student profile linked to this account', 404)

    from app.models.student import ParentDetail

    result = student.to_dict()

    if student.current_section_id:
        section = Section.query.get(student.current_section_id)
        if section:
            result['section_name'] = section.name
            if section.class_ref:
                result['class_name'] = section.class_ref.name
            if section.class_teacher:
                ct = section.class_teacher
                result['class_teacher'] = {
                    'name': f"{ct.first_name} {ct.last_name or ''}".strip(),
                    'email': ct.email, 'phone': ct.phone,
                }

    result['parents'] = [{
        'name': p.name, 'relation': p.relation,
        'phone': p.phone, 'email': p.email,
    } for p in ParentDetail.query.filter_by(
        school_id=g.school_id,
        student_id=student.admission_no,
    ).all()]

    from app.models.user import User
    user = User.query.get(student.user_id) if student.user_id else None
    if user:
        result['login_email'] = user.email
        result['username'] = getattr(user, 'username', None)

    result.pop('password_hash', None)
    result.pop('password', None)

    return success_response(result)


# ─────────────────────── STUDENT EVENTS (all events visible, with audience labels) ───────────────────────

@student_portal_bp.route('/events', methods=['GET'])
@school_required
def student_events():
    from app.models.academic import AcademicCalendar
    from datetime import date as _date

    events = AcademicCalendar.query.filter_by(
        school_id=g.school_id
    ).order_by(AcademicCalendar.start_date.desc()).all()

    today = _date.today()
    result = []
    for e in events:
        end = e.end_date or e.start_date
        is_upcoming = e.start_date > today
        is_active = not is_upcoming and not (end < today)
        d = e.to_dict()
        audience = _build_audience_label(d)
        d['audience'] = audience
        d['is_upcoming'] = is_upcoming
        d['is_active'] = is_active
        result.append(d)

    return success_response(result)


def _build_audience_label(d):
    applies = d.get('applies_to', 'all')
    class_names = d.get('class_names') or []
    class_name = d.get('class_name')

    if applies == 'all':
        return 'This event is for all students and staff'
    elif applies == 'students':
        return 'This event is for all students'
    elif applies == 'staff':
        return 'This event is for staff only'
    elif applies == 'specific_class':
        names = class_names if class_names else ([class_name] if class_name else [])
        if len(names) > 1:
            joined = ', '.join(names[:-1]) + f' and {names[-1]}'
            return f'This event is only for {joined} students'
        elif len(names) == 1:
            return f'This event is only for {names[0]} students'
        else:
            return 'This event is for specific class students'
    return 'This event is for all students and staff'
