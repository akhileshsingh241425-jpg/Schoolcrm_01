"""Extended Exam Models — New tables for complete exam management system.
Covers: DateSheet, QuestionPaper, Deadlines, GraceMarks, ReExam, Notifications,
Grievances, ExamAttendance, SpecialArrangements, MarksVerification.
"""
from app import db
from datetime import datetime


class ExamDateSheet(db.Model):
    """Published date sheet per exam — tracks approval workflow."""
    __tablename__ = 'exam_date_sheets'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.Enum('draft', 'pending_approval', 'approved', 'rejected'), default='draft')
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    rejection_remarks = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    exam = db.relationship('Exam', backref='date_sheets')

    def to_dict(self):
        return {
            'id': self.id, 'exam_id': self.exam_id,
            'exam_name': self.exam.name if self.exam else None,
            'status': self.status,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'rejection_remarks': self.rejection_remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class QuestionPaper(db.Model):
    """Question papers uploaded by teachers for exam."""
    __tablename__ = 'question_papers'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)  # bytes
    set_name = db.Column(db.String(10), default='A')  # Set A, Set B
    max_marks = db.Column(db.Numeric(5, 2), nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False)
    instructions = db.Column(db.Text)
    status = db.Column(db.Enum('submitted', 'hod_approved', 'collected', 'final_approved', 'rejected'), default='submitted')
    reviewed_by = db.Column(db.Integer, db.ForeignKey('staff.id'))
    reviewed_at = db.Column(db.DateTime)
    review_remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    exam = db.relationship('Exam', backref='question_papers')
    class_ref = db.relationship('Class')
    subject_ref = db.relationship('Subject')
    uploader = db.relationship('Staff', foreign_keys=[uploaded_by])

    def to_dict(self):
        return {
            'id': self.id, 'exam_id': self.exam_id,
            'class_id': self.class_id, 'class_name': self.class_ref.name if self.class_ref else None,
            'subject_id': self.subject_id, 'subject_name': self.subject_ref.name if self.subject_ref else None,
            'uploaded_by': self.uploaded_by,
            'uploaded_by_name': f"{self.uploader.first_name} {self.uploader.last_name or ''}".strip() if self.uploader else None,
            'uploader_name': f"{self.uploader.first_name} {self.uploader.last_name or ''}".strip() if self.uploader else None,
            'file_path': self.file_path, 'file_size': self.file_size,
            'set_name': self.set_name, 'max_marks': float(self.max_marks) if self.max_marks else None,
            'duration_minutes': self.duration_minutes, 'instructions': self.instructions,
            'status': self.status, 'review_remarks': self.review_remarks,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class MarksEntryDeadline(db.Model):
    """Deadline for marks entry per exam per subject/class."""
    __tablename__ = 'marks_entry_deadlines'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    deadline_date = db.Column(db.DateTime, nullable=False)
    auto_lock = db.Column(db.Boolean, default=True)
    is_locked = db.Column(db.Boolean, default=False)
    locked_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    exam = db.relationship('Exam', backref='deadlines')

    def to_dict(self):
        return {
            'id': self.id, 'exam_id': self.exam_id,
            'class_id': self.class_id, 'subject_id': self.subject_id,
            'deadline_date': self.deadline_date.isoformat() if self.deadline_date else None,
            'auto_lock': self.auto_lock, 'is_locked': self.is_locked,
            'locked_at': self.locked_at.isoformat() if self.locked_at else None,
        }


class GraceMarks(db.Model):
    """Grace marks applied by Principal."""
    __tablename__ = 'grace_marks'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'))
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    marks_value = db.Column(db.Numeric(5, 2), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    level = db.Column(db.Enum('class', 'subject', 'individual'), nullable=False)
    applied_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)

    exam = db.relationship('Exam', backref='grace_marks_entries')

    def to_dict(self):
        return {
            'id': self.id, 'exam_id': self.exam_id,
            'class_id': self.class_id, 'subject_id': self.subject_id,
            'student_id': self.student_id,
            'marks_value': float(self.marks_value), 'reason': self.reason,
            'level': self.level,
            'applied_at': self.applied_at.isoformat() if self.applied_at else None,
        }


class ReExam(db.Model):
    """Re-examination (compartment/supplementary/improvement/rescheduled)."""
    __tablename__ = 're_exams'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    original_exam_id = db.Column(db.Integer, db.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False)
    original_schedule_id = db.Column(db.Integer, db.ForeignKey('exam_schedules.id'))
    re_exam_type = db.Column(db.Enum('compartment', 'supplementary', 'improvement', 'rescheduled'), nullable=False)
    new_exam_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time)
    end_time = db.Column(db.Time)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'))
    max_marks = db.Column(db.Numeric(5, 2))
    status = db.Column(db.Enum('scheduled', 'ongoing', 'completed', 'results_processed'), default='scheduled')
    reason = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    original_exam = db.relationship('Exam', backref='re_exams')

    def to_dict(self):
        return {
            'id': self.id, 'original_exam_id': self.original_exam_id,
            'original_exam_name': self.original_exam.name if self.original_exam else None,
            're_exam_type': self.re_exam_type,
            'new_exam_date': self.new_exam_date.isoformat() if self.new_exam_date else None,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'class_id': self.class_id, 'subject_id': self.subject_id,
            'max_marks': float(self.max_marks) if self.max_marks else None,
            'status': self.status, 'reason': self.reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ReExamStudent(db.Model):
    """Students eligible/appeared for re-exam."""
    __tablename__ = 're_exam_students'

    id = db.Column(db.Integer, primary_key=True)
    re_exam_id = db.Column(db.Integer, db.ForeignKey('re_exams.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    original_marks = db.Column(db.Numeric(5, 2))
    re_exam_marks = db.Column(db.Numeric(5, 2))
    final_marks = db.Column(db.Numeric(5, 2))
    status = db.Column(db.Enum('eligible', 'appeared', 'absent', 'result_updated'), default='eligible')

    student = db.relationship('Student')
    re_exam = db.relationship('ReExam', backref='students')

    def to_dict(self):
        s = self.student
        return {
            'id': self.id, 're_exam_id': self.re_exam_id,
            'student_id': self.student_id,
            'student_name': f"{s.first_name} {s.last_name or ''}".strip() if s else None,
            'original_marks': float(self.original_marks) if self.original_marks else None,
            're_exam_marks': float(self.re_exam_marks) if self.re_exam_marks else None,
            'final_marks': float(self.final_marks) if self.final_marks else None,
            'status': self.status,
        }


class ExamNotification(db.Model):
    """Exam-related notifications and reminders."""
    __tablename__ = 'exam_notifications'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'))
    recipient_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # date_sheet_approved, paper_reminder, marks_reminder, etc.
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    delivery_channel = db.Column(db.Enum('in_app', 'sms', 'both'), default='in_app')
    delivery_status = db.Column(db.Enum('pending', 'sent', 'delivered', 'failed'), default='pending')
    sent_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'exam_id': self.exam_id,
            'type': self.type, 'title': self.title, 'message': self.message,
            'is_read': self.is_read, 'delivery_channel': self.delivery_channel,
            'delivery_status': self.delivery_status,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ExamGrievance(db.Model):
    """Parent grievances for marks rechecking."""
    __tablename__ = 'exam_grievances'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    exam_schedule_id = db.Column(db.Integer, db.ForeignKey('exam_schedules.id', ondelete='CASCADE'), nullable=False)
    raised_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.Enum('pending', 'under_review', 'resolved', 'rejected'), default='pending')
    assigned_to = db.Column(db.Integer, db.ForeignKey('staff.id'))
    resolution_remarks = db.Column(db.Text)
    original_marks = db.Column(db.Numeric(5, 2))
    corrected_marks = db.Column(db.Numeric(5, 2))
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    resolved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('Student')

    def to_dict(self):
        s = self.student
        return {
            'id': self.id, 'student_id': self.student_id,
            'student_name': f"{s.first_name} {s.last_name or ''}".strip() if s else None,
            'exam_schedule_id': self.exam_schedule_id,
            'reason': self.reason, 'status': self.status,
            'original_marks': float(self.original_marks) if self.original_marks else None,
            'corrected_marks': float(self.corrected_marks) if self.corrected_marks else None,
            'resolution_remarks': self.resolution_remarks,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ExamAttendanceRecord(db.Model):
    """Exam day attendance per student per paper."""
    __tablename__ = 'exam_attendance'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_schedule_id = db.Column(db.Integer, db.ForeignKey('exam_schedules.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    hall_id = db.Column(db.Integer, db.ForeignKey('exam_halls.id'))
    status = db.Column(db.Enum('present', 'absent'), nullable=False)
    marked_by = db.Column(db.Integer, db.ForeignKey('staff.id'))
    marked_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_late_entry = db.Column(db.Boolean, default=False)

    student = db.relationship('Student')
    schedule = db.relationship('ExamSchedule', backref='attendance_records')

    __table_args__ = (
        db.UniqueConstraint('exam_schedule_id', 'student_id', name='unique_exam_attendance'),
    )

    def to_dict(self):
        s = self.student
        return {
            'id': self.id, 'exam_schedule_id': self.exam_schedule_id,
            'student_id': self.student_id,
            'student_name': f"{s.first_name} {s.last_name or ''}".strip() if s else None,
            'hall_id': self.hall_id, 'status': self.status,
            'is_late_entry': self.is_late_entry,
            'marked_at': self.marked_at.isoformat() if self.marked_at else None,
        }


class SpecialArrangement(db.Model):
    """Special exam arrangements (extra time, separate room, scribe)."""
    __tablename__ = 'special_arrangements'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_schedule_id = db.Column(db.Integer, db.ForeignKey('exam_schedules.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    arrangement_type = db.Column(db.Enum('extra_time', 'separate_room', 'scribe', 'other'), nullable=False)
    extra_time_minutes = db.Column(db.Integer)
    separate_hall_id = db.Column(db.Integer, db.ForeignKey('exam_halls.id'))
    medical_certificate_path = db.Column(db.String(500))
    reason = db.Column(db.Text, nullable=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.Enum('requested', 'approved', 'rejected'), default='requested')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('Student')

    def to_dict(self):
        s = self.student
        return {
            'id': self.id, 'exam_schedule_id': self.exam_schedule_id,
            'student_id': self.student_id,
            'student_name': f"{s.first_name} {s.last_name or ''}".strip() if s else None,
            'arrangement_type': self.arrangement_type,
            'extra_time_minutes': self.extra_time_minutes,
            'reason': self.reason, 'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class MarksVerification(db.Model):
    """Random verification of marks against physical answer sheets."""
    __tablename__ = 'marks_verifications'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_schedule_id = db.Column(db.Integer, db.ForeignKey('exam_schedules.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    entered_marks = db.Column(db.Numeric(5, 2))
    verified_marks = db.Column(db.Numeric(5, 2))
    discrepancy_status = db.Column(db.Enum('match', 'mismatch', 'pending'), default='pending')
    verified_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    verified_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('Student')

    def to_dict(self):
        s = self.student
        return {
            'id': self.id, 'exam_schedule_id': self.exam_schedule_id,
            'student_id': self.student_id,
            'student_name': f"{s.first_name} {s.last_name or ''}".strip() if s else None,
            'entered_marks': float(self.entered_marks) if self.entered_marks else None,
            'verified_marks': float(self.verified_marks) if self.verified_marks else None,
            'discrepancy_status': self.discrepancy_status,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
        }


class RoomSeatingGrid(db.Model):
    """Room-wise seating grid stored as JSON. Each cell = {class_name, roll_no}."""
    __tablename__ = 'room_seating_grids'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False)
    hall_id = db.Column(db.Integer, db.ForeignKey('exam_halls.id', ondelete='CASCADE'), nullable=False)
    date = db.Column(db.String(20))  # exam date
    start_time = db.Column(db.String(10))  # time slot start
    grid = db.Column(db.JSON, default=list)  # 2D array: columns x rows, each = {class_name, roll_no}
    num_columns = db.Column(db.Integer, default=3)
    num_rows = db.Column(db.Integer, default=5)
    created_at = db.Column(db.DateTime, default=db.func.now())
    updated_at = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    hall = db.relationship('ExamHall')
    exam = db.relationship('Exam')

    def to_dict(self):
        return {
            'id': self.id,
            'exam_id': self.exam_id,
            'hall_id': self.hall_id,
            'hall_name': self.hall.name if self.hall else None,
            'date': self.date,
            'start_time': self.start_time,
            'grid': self.grid or [],
            'columns': self.num_columns,
            'rows': self.num_rows,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
