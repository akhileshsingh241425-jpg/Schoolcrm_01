"""Exam Management Routes — Complete exam lifecycle API for Exam Controller."""
from flask import Blueprint, request, g, send_file
from app import db
from app.models.academic import (
    Exam, ExamSchedule, ExamResult, ExamHall, ExamSeating,
    ExamInvigilator, ExamAdmitCard, ReportCard
)
from app.models.exam_extended import (
    ExamDateSheet, QuestionPaper, MarksEntryDeadline, GraceMarks,
    ReExam, ReExamStudent, ExamNotification, ExamGrievance,
    ExamAttendanceRecord, SpecialArrangement, MarksVerification
)
from app.models.student import Student, Class, Section
from app.models.staff import Staff
from app.models.user import User
from app.utils.decorators import school_required, role_required
from app.utils.helpers import success_response, error_response, paginate, validate
from app.services.result_service import process_results, get_subject_analysis
from app.services.seating_service import generate_seating
from app.services import notification_service
from sqlalchemy.orm import joinedload
from datetime import datetime, date
import os, random

exam_mgmt_bp = Blueprint('exam_mgmt', __name__)


# ═══════════════════════════════════════════════════════════
# DATE SHEET
# ═══════════════════════════════════════════════════════════

@exam_mgmt_bp.route('/date-sheet/<int:exam_id>', methods=['GET'])
@school_required
def get_date_sheet(exam_id):
    """Get date sheet (schedules) for an exam."""
    schedules = ExamSchedule.query.filter_by(
        exam_id=exam_id, school_id=g.school_id
    ).order_by(ExamSchedule.exam_date, ExamSchedule.start_time).all()
    
    date_sheet = ExamDateSheet.query.filter_by(exam_id=exam_id, school_id=g.school_id).first()
    
    return success_response({
        'exam_id': exam_id,
        'status': date_sheet.status if date_sheet else 'draft',
        'schedules': [s.to_dict() for s in schedules],
    })


@exam_mgmt_bp.route('/date-sheet/<int:exam_id>/submit', methods=['POST'])
@role_required('exam_controller', 'academic_controller', 'school_admin', 'super_admin')
@validate({})
def submit_date_sheet(exam_id):
    """Submit date sheet for Principal approval."""
    ds = ExamDateSheet.query.filter_by(exam_id=exam_id, school_id=g.school_id).first()
    if not ds:
        ds = ExamDateSheet(school_id=g.school_id, exam_id=exam_id, created_by=g.user_id)
        db.session.add(ds)
    ds.status = 'pending_approval'
    db.session.commit()
    return success_response(ds.to_dict(), 'Date sheet submitted for approval')


@exam_mgmt_bp.route('/date-sheet/<int:exam_id>/approve', methods=['POST'])
@role_required('principal', 'school_admin', 'super_admin')
@validate({})
def approve_date_sheet(exam_id):
    """Principal approves date sheet."""
    ds = ExamDateSheet.query.filter_by(exam_id=exam_id, school_id=g.school_id).first()
    if not ds:
        return error_response('Date sheet not found', 404)
    ds.status = 'approved'
    ds.approved_by = g.user_id
    ds.approved_at = datetime.utcnow()
    db.session.commit()
    return success_response(ds.to_dict(), 'Date sheet approved')


@exam_mgmt_bp.route('/date-sheet/<int:exam_id>/reject', methods=['POST'])
@role_required('principal', 'school_admin', 'super_admin')
@validate({})
def reject_date_sheet(exam_id):
    """Principal rejects date sheet."""
    data = g.get('validated_data') or request.get_json()
    ds = ExamDateSheet.query.filter_by(exam_id=exam_id, school_id=g.school_id).first()
    if not ds:
        return error_response('Date sheet not found', 404)
    ds.status = 'rejected'
    ds.rejection_remarks = data.get('remarks', '')
    db.session.commit()
    return success_response(ds.to_dict(), 'Date sheet rejected')


# ═══════════════════════════════════════════════════════════
# QUESTION PAPERS
# ═══════════════════════════════════════════════════════════

@exam_mgmt_bp.route('/question-papers/<int:exam_id>', methods=['GET'])
@school_required
def list_question_papers(exam_id):
    """List all question papers for an exam."""
    papers = QuestionPaper.query.filter_by(exam_id=exam_id, school_id=g.school_id).all()
    return success_response([p.to_dict() for p in papers])


@exam_mgmt_bp.route('/question-papers/<int:exam_id>/upload', methods=['POST'])
@school_required
def upload_question_paper(exam_id):
    """Teacher uploads question paper."""
    if 'file' not in request.files:
        return error_response('No file provided', 400)
    file = request.files['file']
    if not file.filename.lower().endswith('.pdf'):
        return error_response('Only PDF files allowed', 400)
    # Check size (5MB)
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > 5 * 1024 * 1024:
        return error_response('File exceeds 5MB limit', 413)

    # Save file
    upload_dir = os.path.join('uploads', 'question_papers', str(g.school_id))
    os.makedirs(upload_dir, exist_ok=True)
    import uuid
    filename = f"{uuid.uuid4().hex[:12]}.pdf"
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    class_id = request.form.get('class_id', type=int)
    subject_id = request.form.get('subject_id', type=int)

    # Find staff_id from user_id
    from app.models.staff import Staff
    staff = Staff.query.filter_by(user_id=g.user_id, school_id=g.school_id).first()
    staff_id = staff.id if staff else (request.form.get('staff_id', type=int) or g.user_id)

    paper = QuestionPaper(
        school_id=g.school_id, exam_id=exam_id,
        class_id=class_id, subject_id=subject_id,
        uploaded_by=staff_id,
        file_path=f"/uploads/question_papers/{g.school_id}/{filename}",
        file_size=size,
        set_name=request.form.get('set_name', 'A'),
        max_marks=request.form.get('max_marks', 100),
        duration_minutes=request.form.get('duration_minutes', 180),
        instructions=request.form.get('instructions', ''),
    )
    db.session.add(paper)
    db.session.commit()
    return success_response(paper.to_dict(), 'Paper uploaded', 201)


@exam_mgmt_bp.route('/question-papers/paper/<int:paper_id>/approve', methods=['POST'])
@school_required
@validate({})
def approve_paper(paper_id):
    """Approve question paper. Allowed: exam_controller, principal, school_admin, teacher (for HOD approval)."""
    allowed = ['exam_controller', 'principal', 'school_admin', 'super_admin', 'teacher', 'academic_controller']
    if g.current_user.role and g.current_user.role.name not in allowed:
        return error_response('Insufficient permissions', 403)
    paper = QuestionPaper.query.filter_by(id=paper_id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json() or {}
    paper.status = data.get('status', 'hod_approved')
    # reviewed_by needs staff_id, not user_id
    staff = Staff.query.filter_by(user_id=g.user_id, school_id=g.school_id).first()
    paper.reviewed_by = staff.id if staff else None
    paper.reviewed_at = datetime.utcnow()
    paper.review_remarks = data.get('remarks')
    db.session.commit()
    return success_response(paper.to_dict(), 'Paper status updated')


# ═══════════════════════════════════════════════════════════
# MARKS DEADLINES
# ═══════════════════════════════════════════════════════════

@exam_mgmt_bp.route('/deadlines/<int:exam_id>', methods=['GET'])
@school_required
def get_deadlines(exam_id):
    deadlines = MarksEntryDeadline.query.filter_by(exam_id=exam_id, school_id=g.school_id).all()
    return success_response([d.to_dict() for d in deadlines])


@exam_mgmt_bp.route('/deadlines/<int:exam_id>', methods=['POST'])
@role_required('exam_controller', 'academic_controller', 'school_admin', 'super_admin')
@validate({
    'class_id': {'required': True, 'type': int},
    'subject_id': {'required': True, 'type': int},
    'deadline_date': {'required': True},
})
def set_deadline(exam_id):
    data = g.get('validated_data') or request.get_json()
    dl = MarksEntryDeadline(
        school_id=g.school_id, exam_id=exam_id,
        class_id=data['class_id'], subject_id=data['subject_id'],
        deadline_date=data['deadline_date'],
        auto_lock=data.get('auto_lock', True),
        created_by=g.user_id,
    )
    db.session.add(dl)
    db.session.commit()
    return success_response(dl.to_dict(), 'Deadline set', 201)


# ═══════════════════════════════════════════════════════════
# MARKS ENTRY STATUS TRACKER
# ═══════════════════════════════════════════════════════════

@exam_mgmt_bp.route('/marks-status/<int:exam_id>', methods=['GET'])
@role_required('exam_controller', 'academic_controller', 'principal', 'school_admin', 'super_admin')
def marks_entry_status(exam_id):
    """Track which subjects have marks entered."""
    schedules = ExamSchedule.query.filter_by(exam_id=exam_id, school_id=g.school_id).all()
    status_list = []
    for sched in schedules:
        total_students = Student.query.filter_by(
            school_id=g.school_id, current_class_id=sched.class_id, status='active'
        )
        if sched.section_id:
            total_students = total_students.filter_by(current_section_id=sched.section_id)
        total = total_students.count()

        entered = ExamResult.query.filter_by(
            exam_schedule_id=sched.id, school_id=g.school_id
        ).count()

        status_list.append({
            'schedule_id': sched.id,
            'subject_name': sched.subject.name if sched.subject else None,
            'class_name': sched.class_ref.name if sched.class_ref else None,
            'section_name': sched.section_ref.name if sched.section_ref else None,
            'exam_date': sched.exam_date.isoformat() if sched.exam_date else None,
            'total_students': total,
            'marks_entered': entered,
            'pending': total - entered,
            'is_locked': sched.is_marks_locked,
            'percentage_done': round(entered / total * 100, 1) if total > 0 else 0,
        })

    return success_response(status_list)


# ═══════════════════════════════════════════════════════════
# RESULT PROCESSING
# ═══════════════════════════════════════════════════════════

@exam_mgmt_bp.route('/results/<int:exam_id>/process', methods=['POST'])
@role_required('exam_controller', 'academic_controller', 'school_admin', 'super_admin')
@validate({})
def process_exam_results(exam_id):
    """Trigger result processing."""
    result = process_results(exam_id, g.school_id)
    if 'error' in result:
        return error_response(result['error'])
    return success_response(result, 'Results processed')


@exam_mgmt_bp.route('/results/<int:exam_id>/analysis', methods=['GET'])
@role_required('exam_controller', 'academic_controller', 'principal', 'school_admin', 'super_admin')
def result_analysis(exam_id):
    """Get subject-wise analysis."""
    class_id = request.args.get('class_id', type=int)
    analysis = get_subject_analysis(exam_id, g.school_id, class_id)
    return success_response(analysis)


# ═══════════════════════════════════════════════════════════
# SEATING
# ═══════════════════════════════════════════════════════════

@exam_mgmt_bp.route('/seating/<int:schedule_id>/generate', methods=['POST'])
@role_required('exam_controller', 'academic_controller', 'school_admin', 'super_admin')
@validate({})
def generate_seating_arrangement(schedule_id):
    """Generate seating for an exam schedule."""
    data = g.get('validated_data') or request.get_json() or {}
    mode = data.get('mode', 'roll_number')
    hall_ids = data.get('hall_ids')
    result = generate_seating(schedule_id, g.school_id, mode, hall_ids)
    if 'error' in result:
        return error_response(result['error'])
    return success_response(result, 'Seating generated')


# ═══════════════════════════════════════════════════════════
# EXAM ATTENDANCE
# ═══════════════════════════════════════════════════════════

@exam_mgmt_bp.route('/exam-attendance/<int:schedule_id>', methods=['POST'])
@school_required
@validate({})
def mark_exam_attendance(schedule_id):
    """Mark exam day attendance."""
    data = g.get('validated_data') or request.get_json()
    entries = data.get('entries', [])
    for entry in entries:
        existing = ExamAttendanceRecord.query.filter_by(
            exam_schedule_id=schedule_id, student_id=entry['student_id']
        ).first()
        if existing:
            existing.status = entry['status']
        else:
            rec = ExamAttendanceRecord(
                school_id=g.school_id, exam_schedule_id=schedule_id,
                student_id=entry['student_id'], status=entry['status'],
                hall_id=entry.get('hall_id'),
                marked_by=g.user_id,
            )
            db.session.add(rec)
    db.session.commit()
    return success_response(message=f'{len(entries)} attendance marked')


@exam_mgmt_bp.route('/exam-attendance/<int:schedule_id>', methods=['GET'])
@school_required
def get_exam_attendance(schedule_id):
    records = ExamAttendanceRecord.query.filter_by(
        exam_schedule_id=schedule_id, school_id=g.school_id
    ).all()
    return success_response([r.to_dict() for r in records])


# ═══════════════════════════════════════════════════════════
# GRIEVANCES
# ═══════════════════════════════════════════════════════════

@exam_mgmt_bp.route('/grievances', methods=['GET'])
@school_required
def list_grievances():
    query = ExamGrievance.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(ExamGrievance.created_at.desc())
    return success_response(paginate(query))


@exam_mgmt_bp.route('/grievances', methods=['POST'])
@school_required
@validate({
    'student_id': {'required': True, 'type': int},
    'exam_schedule_id': {'required': True, 'type': int},
    'reason': {'required': True},
})
def create_grievance():
    data = g.get('validated_data') or request.get_json()
    grievance = ExamGrievance(
        school_id=g.school_id, student_id=data['student_id'],
        exam_schedule_id=data['exam_schedule_id'],
        raised_by=g.user_id, reason=data['reason'],
    )
    db.session.add(grievance)
    db.session.commit()
    return success_response(grievance.to_dict(), 'Grievance raised', 201)


@exam_mgmt_bp.route('/grievances/<int:gid>', methods=['PUT'])
@role_required('exam_controller', 'academic_controller', 'school_admin', 'super_admin')
@validate({})
def update_grievance(gid):
    grievance = ExamGrievance.query.filter_by(id=gid, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    for f in ['status', 'assigned_to', 'resolution_remarks', 'corrected_marks']:
        if f in data:
            setattr(grievance, f, data[f])
    if data.get('status') == 'resolved':
        grievance.resolved_by = g.user_id
        grievance.resolved_at = datetime.utcnow()
    db.session.commit()
    return success_response(grievance.to_dict(), 'Updated')


# ═══════════════════════════════════════════════════════════
# GRACE MARKS
# ═══════════════════════════════════════════════════════════

@exam_mgmt_bp.route('/grace-marks/<int:exam_id>', methods=['POST'])
@role_required('principal', 'school_admin', 'super_admin')
@validate({
    'marks_value': {'required': True, 'type': float, 'min': 0},
    'reason': {'required': True},
    'level': {'required': True},
})
def apply_grace_marks(exam_id):
    """Apply grace marks (Principal only)."""
    data = g.get('validated_data') or request.get_json()
    gm = GraceMarks(
        school_id=g.school_id, exam_id=exam_id,
        class_id=data.get('class_id'), subject_id=data.get('subject_id'),
        student_id=data.get('student_id'),
        marks_value=data['marks_value'], reason=data['reason'],
        level=data['level'], applied_by=g.user_id,
    )
    db.session.add(gm)
    db.session.commit()
    return success_response(gm.to_dict(), 'Grace marks applied', 201)


@exam_mgmt_bp.route('/grace-marks/<int:exam_id>', methods=['GET'])
@role_required('exam_controller', 'academic_controller', 'principal', 'school_admin', 'super_admin')
def get_grace_marks(exam_id):
    entries = GraceMarks.query.filter_by(exam_id=exam_id, school_id=g.school_id).all()
    return success_response([e.to_dict() for e in entries])


# ═══════════════════════════════════════════════════════════
# RE-EXAM
# ═══════════════════════════════════════════════════════════

@exam_mgmt_bp.route('/re-exams/<int:exam_id>', methods=['POST'])
@role_required('exam_controller', 'academic_controller', 'school_admin', 'super_admin')
@validate({
    're_exam_type': {'required': True},
    'new_exam_date': {'required': True},
})
def create_re_exam(exam_id):
    data = g.get('validated_data') or request.get_json()
    re = ReExam(
        school_id=g.school_id, original_exam_id=exam_id,
        original_schedule_id=data.get('original_schedule_id'),
        re_exam_type=data['re_exam_type'],
        new_exam_date=data['new_exam_date'],
        start_time=data.get('start_time'), end_time=data.get('end_time'),
        class_id=data.get('class_id'), subject_id=data.get('subject_id'),
        max_marks=data.get('max_marks'),
        reason=data.get('reason'), created_by=g.user_id,
    )
    db.session.add(re)
    db.session.commit()
    return success_response(re.to_dict(), 'Re-exam created', 201)


@exam_mgmt_bp.route('/re-exams/<int:exam_id>', methods=['GET'])
@school_required
def list_re_exams(exam_id):
    re_exams = ReExam.query.filter_by(original_exam_id=exam_id, school_id=g.school_id).all()
    return success_response([r.to_dict() for r in re_exams])


# ═══════════════════════════════════════════════════════════
# NOTIFICATIONS
# ═══════════════════════════════════════════════════════════

@exam_mgmt_bp.route('/notifications', methods=['GET'])
@school_required
def get_notifications():
    notifs = notification_service.get_user_notifications(g.user_id, g.school_id)
    return success_response([n.to_dict() for n in notifs])


@exam_mgmt_bp.route('/notifications/<int:nid>/read', methods=['PUT'])
@school_required
@validate({})
def mark_notification_read(nid):
    notif = ExamNotification.query.filter_by(id=nid, recipient_user_id=g.user_id).first_or_404()
    notif.is_read = True
    db.session.commit()
    return success_response(message='Marked as read')


# ═══════════════════════════════════════════════════════════
# VERIFICATION
# ═══════════════════════════════════════════════════════════

@exam_mgmt_bp.route('/verification/<int:schedule_id>/generate', methods=['POST'])
@role_required('exam_controller', 'academic_controller', 'school_admin', 'super_admin')
@validate({})
def generate_verification(schedule_id):
    """Randomly select students for marks verification."""
    data = g.get('validated_data') or request.get_json() or {}
    count = data.get('count', 5)
    
    results = ExamResult.query.filter_by(
        exam_schedule_id=schedule_id, school_id=g.school_id
    ).filter(ExamResult.is_absent == False).all()
    
    sample = random.sample(results, min(count, len(results)))
    
    verifications = []
    for r in sample:
        v = MarksVerification(
            school_id=g.school_id, exam_schedule_id=schedule_id,
            student_id=r.student_id, entered_marks=r.marks_obtained,
        )
        db.session.add(v)
        verifications.append(v)
    db.session.commit()
    return success_response([v.to_dict() for v in verifications], f'{len(verifications)} selected')


@exam_mgmt_bp.route('/verification/<int:schedule_id>', methods=['GET'])
@role_required('exam_controller', 'academic_controller', 'school_admin', 'super_admin')
def get_verifications(schedule_id):
    vlist = MarksVerification.query.filter_by(
        exam_schedule_id=schedule_id, school_id=g.school_id
    ).all()
    return success_response([v.to_dict() for v in vlist])


# ═══════════════════════════════════════════════════════════
# ROOM SEATING GRID (Room-wise, JSON grid)
# ═══════════════════════════════════════════════════════════

@exam_mgmt_bp.route('/room-seating/<int:exam_id>/<int:hall_id>', methods=['GET'])
@school_required
def get_room_seating(exam_id, hall_id):
    """Get seating grid for a specific room in an exam."""
    date = request.args.get('date')
    start_time = request.args.get('start_time')
    
    from app.models.exam_extended import RoomSeatingGrid
    query = RoomSeatingGrid.query.filter_by(
        school_id=g.school_id, exam_id=exam_id, hall_id=hall_id
    )
    if date:
        query = query.filter_by(date=date)
    if start_time:
        query = query.filter_by(start_time=start_time)
    
    grid = query.order_by(RoomSeatingGrid.id.desc()).first()
    if not grid:
        return success_response(None)
    return success_response(grid.to_dict())


@exam_mgmt_bp.route('/room-seating/<int:exam_id>/<int:hall_id>', methods=['POST'])
@school_required
@validate({})
def save_room_seating(exam_id, hall_id):
    """Save seating grid for a room. Grid is a 2D array: columns x rows, each cell = {class_name, roll_no}."""
    data = g.get('validated_data') or request.get_json()
    grid_data = data.get('grid', [])
    date = data.get('date')
    start_time = data.get('start_time')
    
    from app.models.exam_extended import RoomSeatingGrid
    
    # Upsert
    existing = RoomSeatingGrid.query.filter_by(
        school_id=g.school_id, exam_id=exam_id, hall_id=hall_id,
        date=date, start_time=start_time
    ).first()
    
    if existing:
        existing.grid = grid_data
        existing.num_columns = len(grid_data)
        existing.num_rows = len(grid_data[0]) if grid_data else 0
    else:
        existing = RoomSeatingGrid(
            school_id=g.school_id, exam_id=exam_id, hall_id=hall_id,
            date=date, start_time=start_time,
            grid=grid_data,
            num_columns=len(grid_data),
            num_rows=len(grid_data[0]) if grid_data else 0,
        )
        db.session.add(existing)
    
    db.session.commit()
    return success_response(existing.to_dict(), 'Seating saved')


@exam_mgmt_bp.route('/room-seating/exam/<int:exam_id>', methods=['GET'])
@school_required
def get_all_room_seatings(exam_id):
    """Get all room seatings for an exam (for principal/teacher view)."""
    from app.models.exam_extended import RoomSeatingGrid
    grids = RoomSeatingGrid.query.filter_by(school_id=g.school_id, exam_id=exam_id).all()
    return success_response([g.to_dict() for g in grids])
