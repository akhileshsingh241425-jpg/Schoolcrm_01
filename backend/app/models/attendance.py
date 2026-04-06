from app import db
from datetime import datetime


class StudentAttendance(db.Model):
    __tablename__ = 'student_attendance'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    section_id = db.Column(db.Integer, db.ForeignKey('sections.id', ondelete='CASCADE'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.Enum('present', 'absent', 'late', 'half_day', 'leave'), nullable=False)
    period = db.Column(db.Integer)  # NULL = full day, 1-8 = period-wise
    capture_mode = db.Column(db.Enum('manual', 'biometric', 'rfid', 'qr_code', 'face', 'gps'), default='manual')
    check_in_time = db.Column(db.Time)
    check_out_time = db.Column(db.Time)
    remarks = db.Column(db.String(255))
    marked_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('Student', backref='attendance_records')
    class_ref = db.relationship('Class')

    __table_args__ = (
        db.UniqueConstraint('student_id', 'date', 'period', name='unique_student_date_period'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': f"{self.student.first_name} {self.student.last_name or ''}".strip() if self.student else None,
            'class_id': self.class_id,
            'section_id': self.section_id,
            'date': self.date.isoformat() if self.date else None,
            'status': self.status,
            'period': self.period,
            'capture_mode': self.capture_mode,
            'check_in_time': self.check_in_time.isoformat() if self.check_in_time else None,
            'check_out_time': self.check_out_time.isoformat() if self.check_out_time else None,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class StaffAttendance(db.Model):
    __tablename__ = 'staff_attendance'

    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.Enum('present', 'absent', 'late', 'half_day', 'leave'), nullable=False)
    check_in = db.Column(db.Time)
    check_out = db.Column(db.Time)
    capture_mode = db.Column(db.Enum('manual', 'biometric', 'rfid', 'qr_code', 'face', 'gps'), default='manual')
    remarks = db.Column(db.String(255))

    staff = db.relationship('Staff', backref='attendance_records')

    __table_args__ = (
        db.UniqueConstraint('staff_id', 'date', name='unique_staff_date'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'staff_id': self.staff_id,
            'staff_name': f"{self.staff.first_name} {self.staff.last_name or ''}".strip() if self.staff else None,
            'date': self.date.isoformat() if self.date else None,
            'status': self.status,
            'check_in': self.check_in.isoformat() if self.check_in else None,
            'check_out': self.check_out.isoformat() if self.check_out else None,
            'capture_mode': self.capture_mode,
            'remarks': self.remarks
        }


# =====================================================
# LEAVE MANAGEMENT
# =====================================================

class LeaveType(db.Model):
    """Leave type configuration (CL, EL, SL, Medical etc.)"""
    __tablename__ = 'leave_types'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)  # Casual Leave, Sick Leave, etc.
    code = db.Column(db.String(10), nullable=False)   # CL, SL, EL, ML
    applies_to = db.Column(db.Enum('students', 'staff', 'both'), default='both')
    max_days_per_year = db.Column(db.Integer, default=0)  # 0 = unlimited
    requires_document = db.Column(db.Boolean, default=False)
    is_paid = db.Column(db.Boolean, default=True)
    carry_forward = db.Column(db.Boolean, default=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'code': self.code,
            'applies_to': self.applies_to, 'max_days_per_year': self.max_days_per_year,
            'requires_document': self.requires_document, 'is_paid': self.is_paid,
            'carry_forward': self.carry_forward, 'description': self.description,
            'is_active': self.is_active,
        }


class LeaveApplication(db.Model):
    """Student/staff leave requests with approval workflow"""
    __tablename__ = 'leave_applications'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    applicant_type = db.Column(db.Enum('student', 'staff'), nullable=False)
    applicant_id = db.Column(db.Integer, nullable=False)  # student_id or staff_id
    leave_type_id = db.Column(db.Integer, db.ForeignKey('leave_types.id'))
    from_date = db.Column(db.Date, nullable=False)
    to_date = db.Column(db.Date, nullable=False)
    days = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    document_url = db.Column(db.String(500))  # medical certificate etc.
    status = db.Column(db.Enum('pending', 'approved', 'rejected', 'cancelled'), default='pending')
    applied_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    leave_type = db.relationship('LeaveType')

    def to_dict(self):
        return {
            'id': self.id, 'applicant_type': self.applicant_type,
            'applicant_id': self.applicant_id,
            'leave_type_id': self.leave_type_id,
            'leave_type_name': self.leave_type.name if self.leave_type else None,
            'from_date': self.from_date.isoformat() if self.from_date else None,
            'to_date': self.to_date.isoformat() if self.to_date else None,
            'days': self.days, 'reason': self.reason,
            'document_url': self.document_url, 'status': self.status,
            'rejection_reason': self.rejection_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# =====================================================
# LATE ARRIVAL TRACKING
# =====================================================

class LateArrival(db.Model):
    """Gate entry timestamps and late patterns"""
    __tablename__ = 'late_arrivals'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    person_type = db.Column(db.Enum('student', 'staff'), nullable=False)
    person_id = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Date, nullable=False)
    expected_time = db.Column(db.Time)
    arrival_time = db.Column(db.Time, nullable=False)
    late_by_minutes = db.Column(db.Integer)
    reason = db.Column(db.String(500))
    parent_notified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'person_type': self.person_type,
            'person_id': self.person_id,
            'date': self.date.isoformat() if self.date else None,
            'expected_time': self.expected_time.isoformat() if self.expected_time else None,
            'arrival_time': self.arrival_time.isoformat() if self.arrival_time else None,
            'late_by_minutes': self.late_by_minutes,
            'reason': self.reason, 'parent_notified': self.parent_notified,
        }


# =====================================================
# ATTENDANCE RULES & CONFIGURATION
# =====================================================

class AttendanceRule(db.Model):
    """Attendance rules and alert thresholds per school"""
    __tablename__ = 'attendance_rules'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    minimum_percentage = db.Column(db.Numeric(5, 2), default=75.00)
    alert_threshold = db.Column(db.Numeric(5, 2), default=80.00)  # Warn when below
    late_arrival_minutes = db.Column(db.Integer, default=15)  # After X min = late
    half_day_minutes = db.Column(db.Integer, default=120)  # After X min late = half day
    school_start_time = db.Column(db.Time)
    school_end_time = db.Column(db.Time)
    periods_per_day = db.Column(db.Integer, default=8)
    period_duration_minutes = db.Column(db.Integer, default=40)
    auto_notify_parent = db.Column(db.Boolean, default=True)
    notify_on_absent = db.Column(db.Boolean, default=True)
    notify_on_late = db.Column(db.Boolean, default=True)
    working_days = db.Column(db.String(50), default='mon,tue,wed,thu,fri,sat')  # CSV
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'minimum_percentage': float(self.minimum_percentage) if self.minimum_percentage else 75,
            'alert_threshold': float(self.alert_threshold) if self.alert_threshold else 80,
            'late_arrival_minutes': self.late_arrival_minutes,
            'half_day_minutes': self.half_day_minutes,
            'school_start_time': self.school_start_time.isoformat() if self.school_start_time else None,
            'school_end_time': self.school_end_time.isoformat() if self.school_end_time else None,
            'periods_per_day': self.periods_per_day,
            'period_duration_minutes': self.period_duration_minutes,
            'auto_notify_parent': self.auto_notify_parent,
            'notify_on_absent': self.notify_on_absent,
            'notify_on_late': self.notify_on_late,
            'working_days': self.working_days,
        }


# =====================================================
# ATTENDANCE DEVICES
# =====================================================

class AttendanceDevice(db.Model):
    """Biometric/RFID device configuration"""
    __tablename__ = 'attendance_devices'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    device_name = db.Column(db.String(100), nullable=False)
    device_type = db.Column(db.Enum('biometric', 'rfid', 'qr_scanner', 'face_recognition', 'gps'), nullable=False)
    location = db.Column(db.String(200))  # Main gate, Lab, etc.
    serial_number = db.Column(db.String(100))
    ip_address = db.Column(db.String(50))
    status = db.Column(db.Enum('active', 'inactive', 'maintenance'), default='active')
    last_sync = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'device_name': self.device_name,
            'device_type': self.device_type, 'location': self.location,
            'serial_number': self.serial_number, 'ip_address': self.ip_address,
            'status': self.status,
            'last_sync': self.last_sync.isoformat() if self.last_sync else None,
        }


# =====================================================
# EVENT / BUS ATTENDANCE
# =====================================================

class EventAttendance(db.Model):
    """Sports day, cultural event, trip attendance"""
    __tablename__ = 'event_attendance'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    event_name = db.Column(db.String(255), nullable=False)
    event_type = db.Column(db.Enum('sports', 'cultural', 'trip', 'assembly', 'competition', 'other'), default='other')
    event_date = db.Column(db.Date, nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.Enum('present', 'absent', 'excused'), default='present')
    remarks = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('Student')

    def to_dict(self):
        return {
            'id': self.id, 'event_name': self.event_name,
            'event_type': self.event_type,
            'event_date': self.event_date.isoformat() if self.event_date else None,
            'student_id': self.student_id,
            'student_name': self.student.full_name if self.student else None,
            'status': self.status, 'remarks': self.remarks,
        }


# =====================================================
# SUBSTITUTE TEACHER ASSIGNMENT
# =====================================================

class SubstituteAssignment(db.Model):
    """When a teacher is absent, assign a substitute for their timetable slots"""
    __tablename__ = 'substitute_assignments'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    absent_teacher_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    substitute_teacher_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    timetable_id = db.Column(db.Integer, db.ForeignKey('timetable.id', ondelete='CASCADE'))
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'))
    section_id = db.Column(db.Integer, db.ForeignKey('sections.id', ondelete='CASCADE'))
    period_number = db.Column(db.Integer)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'))
    status = db.Column(db.Enum('assigned', 'accepted', 'declined', 'completed', 'cancelled'), default='assigned')
    reason = db.Column(db.String(500))
    remarks = db.Column(db.String(500))
    assigned_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    absent_teacher = db.relationship('Staff', foreign_keys=[absent_teacher_id], backref='absent_substitutions')
    substitute_teacher = db.relationship('Staff', foreign_keys=[substitute_teacher_id], backref='substitute_assignments')
    timetable = db.relationship('Timetable')
    class_ref = db.relationship('Class')
    section_ref = db.relationship('Section')
    subject_ref = db.relationship('Subject')

    __table_args__ = (
        db.UniqueConstraint('school_id', 'date', 'absent_teacher_id', 'period_number', 'class_id', 'section_id',
                            name='unique_substitute_slot'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'absent_teacher_id': self.absent_teacher_id,
            'absent_teacher_name': f"{self.absent_teacher.first_name} {self.absent_teacher.last_name or ''}".strip() if self.absent_teacher else None,
            'substitute_teacher_id': self.substitute_teacher_id,
            'substitute_teacher_name': f"{self.substitute_teacher.first_name} {self.substitute_teacher.last_name or ''}".strip() if self.substitute_teacher else None,
            'timetable_id': self.timetable_id,
            'class_id': self.class_id,
            'class_name': self.class_ref.name if self.class_ref else None,
            'section_id': self.section_id,
            'section_name': self.section_ref.name if self.section_ref else None,
            'period_number': self.period_number,
            'subject_id': self.subject_id,
            'subject_name': self.subject_ref.name if self.subject_ref else None,
            'status': self.status,
            'reason': self.reason,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
