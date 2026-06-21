"""Principal Dashboard & Management API."""
from flask import Blueprint, request, g
from sqlalchemy import func, case, or_, and_
from datetime import datetime, date, timedelta
from app import db
from app.models.student import Student, Section, Class
from app.models.staff import Staff, StaffLeave, StaffLeaveBalance, StaffPayroll
from app.models.attendance import StudentAttendance, StaffAttendance
from app.models.fee import FeePayment, FeeInstallment
from app.models.academic import (
    Exam, ExamSchedule, ExamResult, Homework, TeacherSubject, Timetable
)
from app.models.communication import Announcement
from app.models.principal import ClassObservation, DisciplineCase, TeacherPerformanceScore
from app.utils.decorators import role_required, school_required
from app.utils.helpers import success_response, error_response, paginate, validate
from sqlalchemy.orm import joinedload

principal_bp = Blueprint('principal', __name__)


# ═══════════════════════════════════════════════════════════
# DASHBOARD — All key metrics in one call
# ═══════════════════════════════════════════════════════════

@principal_bp.route('/dashboard', methods=['GET'])
@role_required('principal', 'school_admin', 'super_admin')
def dashboard():
    sid = g.school_id
    today = date.today()
    month_start = today.replace(day=1)

    # ── Student Metrics ──
    total_students = Student.query.filter_by(school_id=sid, status='active').count()

    # Today's student attendance
    att_today = db.session.query(
        func.count(StudentAttendance.id),
        func.sum(case((StudentAttendance.status == 'present', 1), else_=0)),
    ).filter(StudentAttendance.school_id == sid, StudentAttendance.date == today).first()
    student_att_total = att_today[0] or 0
    student_att_present = int(att_today[1] or 0)
    student_att_pct = round(student_att_present / student_att_total * 100, 1) if student_att_total > 0 else 0

    # ── Staff Metrics ──
    total_staff = Staff.query.filter_by(school_id=sid, status='active').count()
    teaching_staff = Staff.query.filter_by(school_id=sid, status='active', staff_type='teaching').count()

    # Today's staff attendance
    staff_att = db.session.query(
        func.count(StaffAttendance.id),
        func.sum(case((StaffAttendance.status == 'present', 1), else_=0)),
    ).filter(StaffAttendance.school_id == sid, StaffAttendance.date == today).first()
    staff_att_total = staff_att[0] or 0
    staff_att_present = int(staff_att[1] or 0)
    staff_att_pct = round(staff_att_present / staff_att_total * 100, 1) if staff_att_total > 0 else 0

    # Absent teachers today
    absent_teachers = db.session.query(StaffAttendance).options(
        joinedload(StaffAttendance.staff)
    ).filter(
        StaffAttendance.school_id == sid,
        StaffAttendance.date == today,
        StaffAttendance.status.in_(['absent', 'leave']),
    ).all()

    # ── Fee Metrics ──
    monthly_collection = db.session.query(
        func.coalesce(func.sum(FeePayment.amount_paid), 0)
    ).filter(
        FeePayment.school_id == sid, FeePayment.status == 'completed',
        FeePayment.payment_date >= month_start, FeePayment.payment_date <= today,
    ).scalar()

    total_fee_due = db.session.query(func.coalesce(func.sum(FeeInstallment.amount), 0)).filter(
        FeeInstallment.school_id == sid
    ).scalar()
    total_fee_paid = db.session.query(func.coalesce(func.sum(FeeInstallment.paid_amount), 0)).filter(
        FeeInstallment.school_id == sid
    ).scalar()
    fee_collection_pct = round(float(total_fee_paid) / float(total_fee_due) * 100, 1) if float(total_fee_due) > 0 else 0

    fee_defaulters = FeeInstallment.query.filter(
        FeeInstallment.school_id == sid,
        FeeInstallment.status.in_(['overdue', 'pending']),
        FeeInstallment.due_date < today,
    ).count()

    # ── Academic Metrics ──
    # Average marks (last exam)
    avg_marks = db.session.query(func.avg(ExamResult.marks_obtained)).filter(
        ExamResult.school_id == sid, ExamResult.marks_obtained.isnot(None)
    ).scalar()

    # Weak students (below 40%)
    weak_students = db.session.query(func.count(func.distinct(ExamResult.student_id))).filter(
        ExamResult.school_id == sid, ExamResult.percentage < 40, ExamResult.percentage.isnot(None)
    ).scalar() or 0

    # Top performers (above 90%)
    top_performers = db.session.query(func.count(func.distinct(ExamResult.student_id))).filter(
        ExamResult.school_id == sid, ExamResult.percentage >= 90
    ).scalar() or 0

    # ── Pending Approvals ──
    pending_leaves = StaffLeave.query.filter_by(school_id=sid, status='pending').count()
    pending_exams = Exam.query.filter_by(school_id=sid, status='upcoming').count()

    # ── Discipline ──
    open_cases = DisciplineCase.query.filter(
        DisciplineCase.school_id == sid,
        DisciplineCase.status.in_(['open', 'in_progress'])
    ).count()

    # ── Alerts ──
    alerts = []
    # Absent teachers
    for att in absent_teachers[:5]:
        s = att.staff
        if s:
            alerts.append({
                'type': 'danger', 'icon': 'person_off',
                'message': f"{s.first_name} {s.last_name or ''} absent today",
                'category': 'staff_attendance',
            })

    # Fee defaulters
    if fee_defaulters > 0:
        alerts.append({
            'type': 'warning', 'icon': 'money_off',
            'message': f"{fee_defaulters} students have overdue fees",
            'category': 'fees',
        })

    # Pending leaves
    if pending_leaves > 0:
        alerts.append({
            'type': 'info', 'icon': 'pending_actions',
            'message': f"{pending_leaves} leave requests pending approval",
            'category': 'leaves',
        })

    # Low homework submission (classes with <60% submission)
    hw_recent = Homework.query.filter(
        Homework.school_id == sid,
        Homework.due_date >= today - timedelta(days=7),
        Homework.due_date <= today,
    ).all()
    for hw in hw_recent[:3]:
        if hw.total_submissions == 0:
            alerts.append({
                'type': 'warning', 'icon': 'assignment_late',
                'message': f"'{hw.title}' - 0 submissions (due: {hw.due_date})",
                'category': 'homework',
            })

    # Open discipline cases
    if open_cases > 0:
        alerts.append({
            'type': 'danger', 'icon': 'gavel',
            'message': f"{open_cases} discipline cases open",
            'category': 'discipline',
        })

    return success_response({
        'metrics': {
            'total_students': total_students,
            'student_attendance_pct': student_att_pct,
            'student_present_today': student_att_present,
            'total_staff': total_staff,
            'teaching_staff': teaching_staff,
            'staff_attendance_pct': staff_att_pct,
            'staff_present_today': staff_att_present,
            'fee_collection_pct': fee_collection_pct,
            'monthly_collection': float(monthly_collection),
            'fee_defaulters': fee_defaulters,
            'avg_marks': round(float(avg_marks), 1) if avg_marks else 0,
            'weak_students': weak_students,
            'top_performers': top_performers,
            'pending_leaves': pending_leaves,
            'pending_exams': pending_exams,
            'open_discipline_cases': open_cases,
        },
        'alerts': alerts,
        'absent_teachers': [{
            'id': a.staff.id if a.staff else None,
            'name': f"{a.staff.first_name} {a.staff.last_name or ''}".strip() if a.staff else 'Unknown',
            'department': a.staff.department if a.staff else None,
        } for a in absent_teachers],
    })


# ═══════════════════════════════════════════════════════════
# TEACHER PERFORMANCE
# ═══════════════════════════════════════════════════════════

@principal_bp.route('/teacher-performance', methods=['GET'])
@role_required('principal', 'school_admin', 'super_admin')
def teacher_performance():
    """Get all teachers with calculated performance metrics."""
    sid = g.school_id
    today = date.today()
    month_start = today.replace(day=1)

    teachers = Staff.query.filter_by(school_id=sid, status='active', staff_type='teaching').all()
    result = []

    for t in teachers:
        # Attendance this month
        att_total = StaffAttendance.query.filter(
            StaffAttendance.staff_id == t.id, StaffAttendance.school_id == sid,
            StaffAttendance.date >= month_start,
        ).count()
        att_present = StaffAttendance.query.filter(
            StaffAttendance.staff_id == t.id, StaffAttendance.school_id == sid,
            StaffAttendance.date >= month_start, StaffAttendance.status == 'present',
        ).count()
        att_pct = round(att_present / att_total * 100, 1) if att_total > 0 else 0

        # Classes assigned
        subjects_count = TeacherSubject.query.filter_by(
            teacher_id=t.id, school_id=sid, status='active'
        ).count()

        # Homework given this month
        hw_count = Homework.query.filter(
            Homework.teacher_id == t.id, Homework.school_id == sid,
            Homework.assigned_date >= month_start,
        ).count()

        # Performance score (latest)
        perf = TeacherPerformanceScore.query.filter_by(
            teacher_id=t.id, school_id=sid
        ).order_by(TeacherPerformanceScore.created_at.desc()).first()

        # Calculate grade from attendance
        grade = 'A+' if att_pct >= 95 else 'A' if att_pct >= 90 else 'B+' if att_pct >= 80 else 'B' if att_pct >= 70 else 'C'

        result.append({
            'id': t.id,
            'name': f"{t.first_name} {t.last_name or ''}".strip(),
            'designation': t.designation,
            'department': t.department,
            'photo_url': t.photo_url,
            'attendance_pct': att_pct,
            'subjects_count': subjects_count,
            'homework_given': hw_count,
            'grade': perf.grade if perf else grade,
            'total_score': float(perf.total_score) if perf else att_pct,
            'performance': perf.to_dict() if perf else None,
        })

    result.sort(key=lambda x: x['total_score'], reverse=True)
    return success_response(result)


# ═══════════════════════════════════════════════════════════
# CLASS OBSERVATIONS
# ═══════════════════════════════════════════════════════════

@principal_bp.route('/observations', methods=['GET'])
@role_required('principal', 'school_admin', 'super_admin')
def list_observations():
    query = ClassObservation.query.filter_by(school_id=g.school_id)
    teacher_id = request.args.get('teacher_id', type=int)
    if teacher_id:
        query = query.filter_by(teacher_id=teacher_id)
    query = query.order_by(ClassObservation.observation_date.desc())
    return success_response(paginate(query))


@principal_bp.route('/observations', methods=['POST'])
@role_required('principal', 'school_admin', 'super_admin')
@validate({'teacher_id': {'required': True, 'type': int}, 'observation_date': {'required': True}})
def create_observation():
    data = g.get('validated_data') or request.get_json()
    # Calculate overall rating
    ratings = [
        data.get('teaching_methodology', 3), data.get('classroom_management', 3),
        data.get('student_engagement', 3), data.get('subject_knowledge', 3),
        data.get('use_of_aids', 3), data.get('communication_skills', 3),
    ]
    overall = round(sum(ratings) / len(ratings), 1)

    obs = ClassObservation(
        school_id=g.school_id, observer_id=g.user_id,
        teacher_id=data['teacher_id'],
        class_id=data.get('class_id'), section_id=data.get('section_id'),
        subject_id=data.get('subject_id'),
        observation_date=data['observation_date'],
        period_number=data.get('period_number'),
        teaching_methodology=data.get('teaching_methodology', 3),
        classroom_management=data.get('classroom_management', 3),
        student_engagement=data.get('student_engagement', 3),
        subject_knowledge=data.get('subject_knowledge', 3),
        use_of_aids=data.get('use_of_aids', 3),
        communication_skills=data.get('communication_skills', 3),
        overall_rating=overall,
        strengths=data.get('strengths'),
        improvements=data.get('improvements'),
        remarks=data.get('remarks'),
        follow_up_date=data.get('follow_up_date'),
    )
    db.session.add(obs)
    db.session.commit()
    return success_response(obs.to_dict(), 'Observation recorded', 201)


@principal_bp.route('/observations/<int:obs_id>', methods=['PUT'])
@role_required('principal', 'school_admin', 'super_admin')
def update_observation(obs_id):
    obs = ClassObservation.query.filter_by(id=obs_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    for f in ['teaching_methodology', 'classroom_management', 'student_engagement',
              'subject_knowledge', 'use_of_aids', 'communication_skills',
              'strengths', 'improvements', 'remarks', 'follow_up_date', 'status']:
        if f in data:
            setattr(obs, f, data[f])
    # Recalculate overall
    ratings = [obs.teaching_methodology, obs.classroom_management, obs.student_engagement,
               obs.subject_knowledge, obs.use_of_aids, obs.communication_skills]
    obs.overall_rating = round(sum(r or 3 for r in ratings) / 6, 1)
    db.session.commit()
    return success_response(obs.to_dict(), 'Updated')


# ═══════════════════════════════════════════════════════════
# DISCIPLINE CASES
# ═══════════════════════════════════════════════════════════

@principal_bp.route('/discipline', methods=['GET'])
@role_required('principal', 'school_admin', 'super_admin', 'teacher')
def list_discipline():
    query = DisciplineCase.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    level = request.args.get('level', type=int)
    if status:
        query = query.filter_by(status=status)
    if level:
        query = query.filter_by(level=level)
    query = query.order_by(DisciplineCase.created_at.desc())
    return success_response(paginate(query))


@principal_bp.route('/discipline', methods=['POST'])
@role_required('principal', 'school_admin', 'super_admin', 'teacher')
@validate({'student_id': {'required': True, 'type': int}, 'description': {'required': True}})
def create_discipline_case():
    data = g.get('validated_data') or request.get_json()
    case = DisciplineCase(
        school_id=g.school_id, student_id=data['student_id'],
        reported_by=g.user_id, case_date=data.get('case_date', date.today().isoformat()),
        category=data.get('category', 'behavior'),
        description=data['description'],
        level=data.get('level', 1),
        action_taken=data.get('action_taken'),
        parent_notified=data.get('parent_notified', False),
    )
    db.session.add(case)
    db.session.commit()
    return success_response(case.to_dict(), 'Case created', 201)


@principal_bp.route('/discipline/<int:case_id>', methods=['PUT'])
@role_required('principal', 'school_admin', 'super_admin')
def update_discipline_case(case_id):
    case = DisciplineCase.query.filter_by(id=case_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    for f in ['level', 'action_taken', 'parent_notified', 'parent_meeting_date',
              'suspension_from', 'suspension_to', 'status', 'resolution_notes']:
        if f in data:
            setattr(case, f, data[f])
    if data.get('status') == 'resolved':
        case.resolved_by = g.user_id
        case.resolved_at = datetime.utcnow()
    db.session.commit()
    return success_response(case.to_dict(), 'Updated')


# ═══════════════════════════════════════════════════════════
# LEAVE APPROVALS
# ═══════════════════════════════════════════════════════════

@principal_bp.route('/pending-leaves', methods=['GET'])
@role_required('principal', 'school_admin', 'super_admin')
def pending_leaves():
    leaves = StaffLeave.query.options(joinedload(StaffLeave.staff)).filter_by(
        school_id=g.school_id, status='pending'
    ).order_by(StaffLeave.created_at.desc()).all()
    return success_response([l.to_dict() for l in leaves])


@principal_bp.route('/approve-leave/<int:leave_id>', methods=['PUT'])
@role_required('principal', 'school_admin', 'super_admin')
def approve_leave(leave_id):
    leave = StaffLeave.query.filter_by(id=leave_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    action = data.get('action', 'approved')  # approved or rejected
    leave.status = action
    leave.approved_by = g.user_id
    leave.approved_at = datetime.utcnow()
    leave.remarks = data.get('remarks')
    db.session.commit()
    return success_response(leave.to_dict(), f'Leave {action}')


# ═══════════════════════════════════════════════════════════
# EXAM APPROVALS
# ═══════════════════════════════════════════════════════════

@principal_bp.route('/exam-approvals', methods=['GET'])
@role_required('principal', 'school_admin', 'super_admin')
def exam_approvals():
    """Get exams pending approval / publication."""
    exams = Exam.query.filter(
        Exam.school_id == g.school_id,
        Exam.status.in_(['upcoming', 'completed']),
    ).order_by(Exam.start_date.desc()).all()
    return success_response([e.to_dict() for e in exams])


@principal_bp.route('/exam-approvals/<int:exam_id>', methods=['PUT'])
@role_required('principal', 'school_admin', 'super_admin')
def update_exam_approval(exam_id):
    exam = Exam.query.filter_by(id=exam_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    if 'status' in data:
        exam.status = data['status']  # results_published
    db.session.commit()
    return success_response(exam.to_dict(), 'Exam status updated')


# ═══════════════════════════════════════════════════════════
# REPORT CARDS — All students' exam results summary
# ═══════════════════════════════════════════════════════════

@principal_bp.route('/report-cards', methods=['GET'])
@role_required('principal', 'school_admin', 'super_admin')
def all_report_cards():
    """List all students with their exam results summary (report card overview).
    Optional query params: class_id, section_id, exam_id."""
    from app.models.academic import ExamResult, ExamSchedule, Exam
    from app.models.student import Student, Class, Section
    sid = g.school_id
    class_id = request.args.get('class_id', type=int)
    section_id = request.args.get('section_id', type=int)
    exam_id = request.args.get('exam_id', type=int)

    # Build result query joined to schedule (only locked/published)
    q = db.session.query(ExamResult).join(ExamSchedule, ExamResult.exam_schedule_id == ExamSchedule.id).filter(
        ExamResult.school_id == sid,
        ExamSchedule.is_marks_locked == True,
    )
    if class_id:
        q = q.filter(ExamSchedule.class_id == class_id)
    if section_id:
        q = q.filter(ExamSchedule.section_id == section_id)
    if exam_id:
        q = q.filter(ExamSchedule.exam_id == exam_id)
    results = q.all()

    # Group by student
    students_map = {}
    for r in results:
        stu = r.student
        if not stu:
            continue
        key = stu.id
        if key not in students_map:
            students_map[key] = {
                'student_id': stu.id,
                'student_name': f"{stu.first_name} {stu.last_name or ''}".strip(),
                'admission_no': stu.admission_no,
                'roll_no': stu.roll_no,
                'class_name': stu.current_class.name if stu.current_class else None,
                'section_name': stu.current_section.name if stu.current_section else None,
                'subjects': [], 'total_obtained': 0, 'total_max': 0,
            }
        max_marks = float(r.schedule.max_marks or 0)
        marks = float(r.marks_obtained or 0)
        students_map[key]['subjects'].append({
            'subject_name': r.schedule.subject.name if r.schedule and r.schedule.subject else None,
            'marks_obtained': marks, 'max_marks': max_marks,
            'grade': r.grade, 'percentage': float(r.percentage) if r.percentage else None,
        })
        students_map[key]['total_obtained'] += marks
        students_map[key]['total_max'] += max_marks

    report_cards = []
    for s in students_map.values():
        s['percentage'] = round(s['total_obtained'] / s['total_max'] * 100, 1) if s['total_max'] else 0
        s['overall_grade'] = ('A+' if s['percentage']>=91 else 'A' if s['percentage']>=81 else 'B+' if s['percentage']>=71 else 'B' if s['percentage']>=61 else 'C+' if s['percentage']>=51 else 'C' if s['percentage']>=41 else 'D' if s['percentage']>=33 else 'F')
        report_cards.append(s)
    report_cards.sort(key=lambda x: x['percentage'], reverse=True)
    return success_response(report_cards)


# ═══════════════════════════════════════════════════════════
# TIMETABLES — All classes' timetable grouped by class-section
# ═══════════════════════════════════════════════════════════

@principal_bp.route('/timetables', methods=['GET'])
@role_required('principal', 'school_admin', 'super_admin')
def all_timetables():
    """Return timetable grouped by class-section for the whole school."""
    from app.models.academic import Timetable
    from app.models.student import Class, Section
    sid = g.school_id
    entries = Timetable.query.filter_by(school_id=sid).order_by(
        Timetable.class_id, Timetable.section_id, Timetable.day_of_week, Timetable.period_number
    ).all()
    groups = {}
    for t in entries:
        key = f"{t.class_id}_{t.section_id}"
        if key not in groups:
            groups[key] = {
                'class_id': t.class_id,
                'section_id': t.section_id,
                'class_name': t.class_ref.name if t.class_ref else None,
                'section_name': t.section_ref.name if t.section_ref else None,
                'entries': [],
            }
        groups[key]['entries'].append(t.to_dict())
    return success_response(list(groups.values()))
