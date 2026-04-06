from app import db
from datetime import datetime


# =====================================================
# SUBJECT MANAGEMENT
# =====================================================

class Subject(db.Model):
    __tablename__ = 'subjects'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20))
    type = db.Column(db.Enum('theory', 'practical', 'both'), default='theory')
    description = db.Column(db.Text)
    credit_hours = db.Column(db.Numeric(3, 1))
    is_elective = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'school_id': self.school_id,
            'name': self.name,
            'code': self.code,
            'type': self.type,
            'description': self.description,
            'credit_hours': float(self.credit_hours) if self.credit_hours else None,
            'is_elective': self.is_elective,
            'is_active': self.is_active,
        }


class SubjectComponent(db.Model):
    """Subject marking components - theory, practical, internal, project, oral"""
    __tablename__ = 'subject_components'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    max_marks = db.Column(db.Numeric(5, 2), nullable=False)
    weightage = db.Column(db.Numeric(5, 2), default=100)
    is_mandatory = db.Column(db.Boolean, default=True)

    subject = db.relationship('Subject', backref='components')

    def to_dict(self):
        return {
            'id': self.id,
            'subject_id': self.subject_id,
            'name': self.name,
            'max_marks': float(self.max_marks),
            'weightage': float(self.weightage) if self.weightage else 100,
            'is_mandatory': self.is_mandatory,
        }


class ClassSubject(db.Model):
    __tablename__ = 'class_subjects'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('staff.id'))

    subject = db.relationship('Subject', backref='class_subjects')
    teacher = db.relationship('Staff', backref='class_subjects')
    class_ref = db.relationship('Class', backref='class_subjects')

    def to_dict(self):
        return {
            'id': self.id,
            'class_id': self.class_id,
            'class_name': self.class_ref.name if self.class_ref else None,
            'subject': self.subject.to_dict() if self.subject else None,
            'teacher': self.teacher.to_dict() if self.teacher else None,
        }


# =====================================================
# TIMETABLE
# =====================================================

class Timetable(db.Model):
    __tablename__ = 'timetable'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    section_id = db.Column(db.Integer, db.ForeignKey('sections.id', ondelete='CASCADE'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('staff.id'))
    day_of_week = db.Column(db.Enum('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'), nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    room_no = db.Column(db.String(20))
    period_number = db.Column(db.Integer)
    is_break = db.Column(db.Boolean, default=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'))

    subject = db.relationship('Subject')
    teacher = db.relationship('Staff')
    class_ref = db.relationship('Class')
    section_ref = db.relationship('Section')

    def to_dict(self):
        return {
            'id': self.id,
            'class_id': self.class_id,
            'section_id': self.section_id,
            'class_name': self.class_ref.name if self.class_ref else None,
            'section_name': self.section_ref.name if self.section_ref else None,
            'subject': self.subject.to_dict() if self.subject else None,
            'subject_name': self.subject.name if self.subject else None,
            'teacher': self.teacher.to_dict() if self.teacher else None,
            'teacher_name': f"{self.teacher.first_name} {self.teacher.last_name or ''}".strip() if self.teacher else None,
            'day_of_week': self.day_of_week,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'room_no': self.room_no,
            'period_number': self.period_number,
            'is_break': self.is_break,
        }


# =====================================================
# EXAM TYPES & GRADING CONFIGURATION
# =====================================================

class ExamType(db.Model):
    """Configurable exam types per school - Unit Test, Half Yearly, Annual, etc."""
    __tablename__ = 'exam_types'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20))
    description = db.Column(db.Text)
    weightage = db.Column(db.Numeric(5, 2), default=100)
    is_active = db.Column(db.Boolean, default=True)
    display_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'description': self.description,
            'weightage': float(self.weightage) if self.weightage else 100,
            'is_active': self.is_active,
            'display_order': self.display_order,
        }


class GradingSystem(db.Model):
    """Grading system configuration per school"""
    __tablename__ = 'grading_systems'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.Enum('percentage', 'gpa', 'cgpa', 'letter', 'marks'), default='percentage')
    description = db.Column(db.Text)
    is_default = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    grades = db.relationship('Grade', backref='grading_system', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'description': self.description,
            'is_default': self.is_default,
            'is_active': self.is_active,
            'grades': [g.to_dict() for g in self.grades.order_by(Grade.display_order).all()],
        }


class Grade(db.Model):
    """Grade definitions within a grading system"""
    __tablename__ = 'grades'

    id = db.Column(db.Integer, primary_key=True)
    grading_system_id = db.Column(db.Integer, db.ForeignKey('grading_systems.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(10), nullable=False)
    min_marks = db.Column(db.Numeric(5, 2), nullable=False)
    max_marks = db.Column(db.Numeric(5, 2), nullable=False)
    grade_point = db.Column(db.Numeric(3, 1))
    description = db.Column(db.String(100))
    is_passing = db.Column(db.Boolean, default=True)
    display_order = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'grading_system_id': self.grading_system_id,
            'name': self.name,
            'min_marks': float(self.min_marks),
            'max_marks': float(self.max_marks),
            'grade_point': float(self.grade_point) if self.grade_point else None,
            'description': self.description,
            'is_passing': self.is_passing,
            'display_order': self.display_order,
        }


# =====================================================
# EXAM MANAGEMENT
# =====================================================

class Exam(db.Model):
    __tablename__ = 'exams'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'))
    exam_type_id = db.Column(db.Integer, db.ForeignKey('exam_types.id'))
    grading_system_id = db.Column(db.Integer, db.ForeignKey('grading_systems.id'))
    description = db.Column(db.Text)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    status = db.Column(db.Enum('upcoming', 'ongoing', 'completed', 'cancelled', 'results_published'), default='upcoming')
    instructions = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    schedules = db.relationship('ExamSchedule', backref='exam', lazy='dynamic', cascade='all, delete-orphan')
    exam_type = db.relationship('ExamType')
    grading_sys = db.relationship('GradingSystem')
    academic_year = db.relationship('AcademicYear')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'academic_year_id': self.academic_year_id,
            'academic_year': self.academic_year.name if self.academic_year else None,
            'exam_type_id': self.exam_type_id,
            'exam_type': self.exam_type.to_dict() if self.exam_type else None,
            'grading_system_id': self.grading_system_id,
            'description': self.description,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'status': self.status,
            'instructions': self.instructions,
            'schedule_count': self.schedules.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def to_detail_dict(self):
        d = self.to_dict()
        d['schedules'] = [s.to_dict() for s in self.schedules.order_by(ExamSchedule.exam_date, ExamSchedule.start_time).all()]
        return d


class ExamSchedule(db.Model):
    __tablename__ = 'exam_schedules'

    id = db.Column(db.Integer, primary_key=True)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    section_id = db.Column(db.Integer, db.ForeignKey('sections.id'))
    exam_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time)
    end_time = db.Column(db.Time)
    max_marks = db.Column(db.Numeric(5, 2), nullable=False)
    passing_marks = db.Column(db.Numeric(5, 2))
    duration_minutes = db.Column(db.Integer)
    hall_id = db.Column(db.Integer, db.ForeignKey('exam_halls.id'))
    instructions = db.Column(db.Text)
    is_marks_locked = db.Column(db.Boolean, default=False)

    subject = db.relationship('Subject')
    class_ref = db.relationship('Class')
    section_ref = db.relationship('Section')
    hall = db.relationship('ExamHall')

    def to_dict(self):
        return {
            'id': self.id,
            'exam_id': self.exam_id,
            'class_id': self.class_id,
            'class_name': self.class_ref.name if self.class_ref else None,
            'section_id': self.section_id,
            'section_name': self.section_ref.name if self.section_ref else None,
            'subject_id': self.subject_id,
            'subject': self.subject.to_dict() if self.subject else None,
            'exam_date': self.exam_date.isoformat() if self.exam_date else None,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'max_marks': float(self.max_marks) if self.max_marks else None,
            'passing_marks': float(self.passing_marks) if self.passing_marks else None,
            'duration_minutes': self.duration_minutes,
            'hall_id': self.hall_id,
            'hall_name': self.hall.name if self.hall else None,
            'is_marks_locked': self.is_marks_locked,
        }


class ExamGroup(db.Model):
    """Group multiple exams for consolidated results (e.g., Term 1 = UT1 + UT2 + Half Yearly)"""
    __tablename__ = 'exam_groups'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'))
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    mappings = db.relationship('ExamGroupMapping', backref='group', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'academic_year_id': self.academic_year_id,
            'description': self.description,
            'exams': [m.to_dict() for m in self.mappings.all()],
        }


class ExamGroupMapping(db.Model):
    """Map exams to groups with weightage"""
    __tablename__ = 'exam_group_mappings'

    id = db.Column(db.Integer, primary_key=True)
    exam_group_id = db.Column(db.Integer, db.ForeignKey('exam_groups.id', ondelete='CASCADE'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False)
    weightage = db.Column(db.Numeric(5, 2), default=100)

    exam = db.relationship('Exam')

    def to_dict(self):
        return {
            'id': self.id,
            'exam_id': self.exam_id,
            'exam_name': self.exam.name if self.exam else None,
            'weightage': float(self.weightage) if self.weightage else 100,
        }


# =====================================================
# EXAM RESULTS & MARKS
# =====================================================

class ExamResult(db.Model):
    __tablename__ = 'exam_results'

    id = db.Column(db.Integer, primary_key=True)
    exam_schedule_id = db.Column(db.Integer, db.ForeignKey('exam_schedules.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    marks_obtained = db.Column(db.Numeric(5, 2))
    grade = db.Column(db.String(5))
    grade_point = db.Column(db.Numeric(3, 1))
    percentage = db.Column(db.Numeric(5, 2))
    is_absent = db.Column(db.Boolean, default=False)
    is_exempted = db.Column(db.Boolean, default=False)
    remarks = db.Column(db.String(255))
    entered_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    entered_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    schedule = db.relationship('ExamSchedule', backref='results')
    student = db.relationship('Student', backref='exam_results')

    def to_dict(self):
        return {
            'id': self.id,
            'exam_schedule_id': self.exam_schedule_id,
            'student_id': self.student_id,
            'student_name': f"{self.student.first_name} {self.student.last_name}" if self.student else None,
            'admission_no': self.student.admission_no if self.student else None,
            'marks_obtained': float(self.marks_obtained) if self.marks_obtained else None,
            'max_marks': float(self.schedule.max_marks) if self.schedule and self.schedule.max_marks else None,
            'passing_marks': float(self.schedule.passing_marks) if self.schedule and self.schedule.passing_marks else None,
            'grade': self.grade,
            'grade_point': float(self.grade_point) if self.grade_point else None,
            'percentage': float(self.percentage) if self.percentage else None,
            'is_absent': self.is_absent,
            'is_exempted': self.is_exempted,
            'remarks': self.remarks,
            'subject': self.schedule.subject.to_dict() if self.schedule and self.schedule.subject else None,
        }


class MarkEntry(db.Model):
    """Detailed marks entry per subject component (theory, practical, internal, project)"""
    __tablename__ = 'mark_entries'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_schedule_id = db.Column(db.Integer, db.ForeignKey('exam_schedules.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    component_id = db.Column(db.Integer, db.ForeignKey('subject_components.id'))
    marks_obtained = db.Column(db.Numeric(5, 2))
    is_absent = db.Column(db.Boolean, default=False)
    is_exempted = db.Column(db.Boolean, default=False)
    remarks = db.Column(db.String(255))
    entered_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    entered_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('Student')
    schedule = db.relationship('ExamSchedule')
    component = db.relationship('SubjectComponent')

    def to_dict(self):
        return {
            'id': self.id,
            'exam_schedule_id': self.exam_schedule_id,
            'student_id': self.student_id,
            'component_id': self.component_id,
            'component_name': self.component.name if self.component else 'Total',
            'marks_obtained': float(self.marks_obtained) if self.marks_obtained else None,
            'max_marks': float(self.component.max_marks) if self.component else None,
            'is_absent': self.is_absent,
            'is_exempted': self.is_exempted,
            'remarks': self.remarks,
        }


# =====================================================
# EXAM HALL & SEATING
# =====================================================

class ExamHall(db.Model):
    """Exam hall/room management"""
    __tablename__ = 'exam_halls'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    building = db.Column(db.String(100))
    floor = db.Column(db.String(20))
    capacity = db.Column(db.Integer, nullable=False)
    rows = db.Column(db.Integer)
    columns = db.Column(db.Integer)
    has_cctv = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'building': self.building,
            'floor': self.floor,
            'capacity': self.capacity,
            'rows': self.rows,
            'columns': self.columns,
            'has_cctv': self.has_cctv,
            'is_active': self.is_active,
        }


class ExamSeating(db.Model):
    """Seating arrangement per exam per hall"""
    __tablename__ = 'exam_seatings'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_schedule_id = db.Column(db.Integer, db.ForeignKey('exam_schedules.id', ondelete='CASCADE'), nullable=False)
    hall_id = db.Column(db.Integer, db.ForeignKey('exam_halls.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    seat_number = db.Column(db.String(20))
    row_number = db.Column(db.Integer)
    column_number = db.Column(db.Integer)

    hall = db.relationship('ExamHall')
    student = db.relationship('Student')
    schedule = db.relationship('ExamSchedule')

    def to_dict(self):
        return {
            'id': self.id,
            'exam_schedule_id': self.exam_schedule_id,
            'hall_id': self.hall_id,
            'hall_name': self.hall.name if self.hall else None,
            'student_id': self.student_id,
            'student_name': f"{self.student.first_name} {self.student.last_name}" if self.student else None,
            'seat_number': self.seat_number,
            'row_number': self.row_number,
            'column_number': self.column_number,
        }


class ExamInvigilator(db.Model):
    """Invigilator assignment per exam schedule per hall"""
    __tablename__ = 'exam_invigilators'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_schedule_id = db.Column(db.Integer, db.ForeignKey('exam_schedules.id', ondelete='CASCADE'), nullable=False)
    hall_id = db.Column(db.Integer, db.ForeignKey('exam_halls.id', ondelete='CASCADE'), nullable=False)
    staff_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    role = db.Column(db.Enum('chief', 'assistant', 'relief'), default='assistant')

    staff = db.relationship('Staff')
    hall = db.relationship('ExamHall')
    schedule = db.relationship('ExamSchedule')

    def to_dict(self):
        return {
            'id': self.id,
            'exam_schedule_id': self.exam_schedule_id,
            'hall_id': self.hall_id,
            'hall_name': self.hall.name if self.hall else None,
            'staff_id': self.staff_id,
            'staff_name': self.staff.name if self.staff else None,
            'role': self.role,
        }


# =====================================================
# ADMIT CARDS & REPORT CARDS
# =====================================================

class ExamAdmitCard(db.Model):
    """Admit cards for students per exam"""
    __tablename__ = 'exam_admit_cards'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    roll_number = db.Column(db.String(20))
    status = db.Column(db.Enum('generated', 'issued', 'revoked'), default='generated')
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    issued_at = db.Column(db.DateTime)

    exam = db.relationship('Exam')
    student = db.relationship('Student')

    def to_dict(self):
        return {
            'id': self.id,
            'exam_id': self.exam_id,
            'exam_name': self.exam.name if self.exam else None,
            'student_id': self.student_id,
            'student_name': f"{self.student.first_name} {self.student.last_name}" if self.student else None,
            'admission_no': self.student.admission_no if self.student else None,
            'roll_number': self.roll_number,
            'status': self.status,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None,
            'issued_at': self.issued_at.isoformat() if self.issued_at else None,
        }


class ReportCard(db.Model):
    """Generated report cards per student per exam"""
    __tablename__ = 'report_cards'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'))
    exam_group_id = db.Column(db.Integer, db.ForeignKey('exam_groups.id'))
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'))
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
    total_marks = db.Column(db.Numeric(7, 2))
    total_max_marks = db.Column(db.Numeric(7, 2))
    percentage = db.Column(db.Numeric(5, 2))
    grade = db.Column(db.String(10))
    gpa = db.Column(db.Numeric(3, 1))
    rank_in_class = db.Column(db.Integer)
    rank_in_section = db.Column(db.Integer)
    total_students = db.Column(db.Integer)
    attendance_percentage = db.Column(db.Numeric(5, 2))
    teacher_remarks = db.Column(db.Text)
    principal_remarks = db.Column(db.Text)
    result_status = db.Column(db.Enum('pass', 'fail', 'compartment', 'withheld'), default='pass')
    status = db.Column(db.Enum('draft', 'published', 'archived'), default='draft')
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    published_at = db.Column(db.DateTime)

    student = db.relationship('Student')
    exam = db.relationship('Exam')
    class_ref = db.relationship('Class')

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': f"{self.student.first_name} {self.student.last_name}" if self.student else None,
            'admission_no': self.student.admission_no if self.student else None,
            'class_name': self.class_ref.name if self.class_ref else None,
            'exam_id': self.exam_id,
            'exam_name': self.exam.name if self.exam else None,
            'total_marks': float(self.total_marks) if self.total_marks else None,
            'total_max_marks': float(self.total_max_marks) if self.total_max_marks else None,
            'percentage': float(self.percentage) if self.percentage else None,
            'grade': self.grade,
            'gpa': float(self.gpa) if self.gpa else None,
            'rank_in_class': self.rank_in_class,
            'rank_in_section': self.rank_in_section,
            'total_students': self.total_students,
            'attendance_percentage': float(self.attendance_percentage) if self.attendance_percentage else None,
            'teacher_remarks': self.teacher_remarks,
            'principal_remarks': self.principal_remarks,
            'result_status': self.result_status,
            'status': self.status,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None,
            'published_at': self.published_at.isoformat() if self.published_at else None,
        }


# =====================================================
# EXAM INCIDENTS
# =====================================================

class ExamIncident(db.Model):
    """Incidents during exams - cheating, disruption, etc."""
    __tablename__ = 'exam_incidents'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    exam_schedule_id = db.Column(db.Integer, db.ForeignKey('exam_schedules.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    hall_id = db.Column(db.Integer, db.ForeignKey('exam_halls.id'))
    type = db.Column(db.Enum('cheating', 'disruption', 'unfair_means', 'medical', 'other'), nullable=False)
    description = db.Column(db.Text, nullable=False)
    severity = db.Column(db.Enum('low', 'medium', 'high', 'critical'), default='medium')
    action_taken = db.Column(db.Text)
    reported_by = db.Column(db.Integer, db.ForeignKey('staff.id'))
    reported_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('Student')
    reporter = db.relationship('Staff')
    schedule = db.relationship('ExamSchedule')

    def to_dict(self):
        return {
            'id': self.id,
            'exam_schedule_id': self.exam_schedule_id,
            'student_id': self.student_id,
            'student_name': f"{self.student.first_name} {self.student.last_name}" if self.student else None,
            'hall_id': self.hall_id,
            'type': self.type,
            'description': self.description,
            'severity': self.severity,
            'action_taken': self.action_taken,
            'reported_by': self.reported_by,
            'reporter_name': self.reporter.name if self.reporter else None,
            'reported_at': self.reported_at.isoformat() if self.reported_at else None,
        }


# =====================================================
# SYLLABUS & CURRICULUM MANAGEMENT
# =====================================================

class Syllabus(db.Model):
    """Chapter/topic structure per subject per class"""
    __tablename__ = 'syllabus'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'))
    chapter_number = db.Column(db.Integer, nullable=False)
    chapter_name = db.Column(db.String(255), nullable=False)
    topics = db.Column(db.Text)  # JSON array of topics
    learning_objectives = db.Column(db.Text)
    estimated_hours = db.Column(db.Numeric(5, 1))
    term = db.Column(db.Enum('term1', 'term2', 'term3', 'annual'), default='term1')
    display_order = db.Column(db.Integer, default=0)
    resources = db.Column(db.Text)  # JSON: textbook pages, reference links
    status = db.Column(db.Enum('not_started', 'in_progress', 'completed'), default='not_started')
    completion_percentage = db.Column(db.Numeric(5, 2), default=0)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    class_ref = db.relationship('Class')
    subject = db.relationship('Subject')
    academic_year = db.relationship('AcademicYear')
    progress_logs = db.relationship('SyllabusProgress', backref='syllabus', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'school_id': self.school_id,
            'class_id': self.class_id,
            'class_name': self.class_ref.name if self.class_ref else None,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'academic_year_id': self.academic_year_id,
            'chapter_number': self.chapter_number,
            'chapter_name': self.chapter_name,
            'topics': self.topics,
            'learning_objectives': self.learning_objectives,
            'estimated_hours': float(self.estimated_hours) if self.estimated_hours else None,
            'term': self.term,
            'display_order': self.display_order,
            'resources': self.resources,
            'status': self.status,
            'completion_percentage': float(self.completion_percentage) if self.completion_percentage else 0,
            'progress_count': self.progress_logs.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class SyllabusProgress(db.Model):
    """Daily completion logs by teachers"""
    __tablename__ = 'syllabus_progress'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    syllabus_id = db.Column(db.Integer, db.ForeignKey('syllabus.id', ondelete='CASCADE'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('staff.id'))
    date = db.Column(db.Date, nullable=False)
    topics_covered = db.Column(db.Text, nullable=False)
    hours_spent = db.Column(db.Numeric(3, 1))
    percentage_covered = db.Column(db.Numeric(5, 2))
    teaching_method = db.Column(db.Enum('lecture', 'discussion', 'practical', 'project', 'demonstration', 'online', 'other'), default='lecture')
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    teacher = db.relationship('Staff')

    def to_dict(self):
        return {
            'id': self.id,
            'syllabus_id': self.syllabus_id,
            'teacher_id': self.teacher_id,
            'teacher_name': self.teacher.name if self.teacher else None,
            'date': self.date.isoformat() if self.date else None,
            'topics_covered': self.topics_covered,
            'hours_spent': float(self.hours_spent) if self.hours_spent else None,
            'percentage_covered': float(self.percentage_covered) if self.percentage_covered else None,
            'teaching_method': self.teaching_method,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# =====================================================
# LESSON PLAN MANAGEMENT
# =====================================================

class LessonPlan(db.Model):
    """Teacher lesson plans with approval workflow"""
    __tablename__ = 'lesson_plans'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('staff.id'))
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    section_id = db.Column(db.Integer, db.ForeignKey('sections.id'))
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'))
    title = db.Column(db.String(255), nullable=False)
    date = db.Column(db.Date, nullable=False)
    period_number = db.Column(db.Integer)
    duration_minutes = db.Column(db.Integer, default=40)
    topic = db.Column(db.String(255), nullable=False)
    subtopics = db.Column(db.Text)
    objectives = db.Column(db.Text)
    teaching_methodology = db.Column(db.Text)
    teaching_aids = db.Column(db.Text)  # Blackboard, projector, charts, models etc.
    board_work = db.Column(db.Text)
    student_activities = db.Column(db.Text)
    assessment_plan = db.Column(db.Text)
    homework_given = db.Column(db.Text)
    previous_knowledge = db.Column(db.Text)
    learning_outcomes = db.Column(db.Text)
    differentiation = db.Column(db.Text)  # For different learning levels
    reflection = db.Column(db.Text)  # Post-class reflection by teacher
    status = db.Column(db.Enum('draft', 'submitted', 'approved', 'rejected', 'revision_needed'), default='draft')
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    teacher = db.relationship('Staff')
    class_ref = db.relationship('Class')
    section_ref = db.relationship('Section')
    subject = db.relationship('Subject')

    def to_dict(self):
        return {
            'id': self.id,
            'teacher_id': self.teacher_id,
            'teacher_name': self.teacher.name if self.teacher else None,
            'class_id': self.class_id,
            'class_name': self.class_ref.name if self.class_ref else None,
            'section_id': self.section_id,
            'section_name': self.section_ref.name if self.section_ref else None,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'title': self.title,
            'date': self.date.isoformat() if self.date else None,
            'period_number': self.period_number,
            'duration_minutes': self.duration_minutes,
            'topic': self.topic,
            'subtopics': self.subtopics,
            'objectives': self.objectives,
            'teaching_methodology': self.teaching_methodology,
            'teaching_aids': self.teaching_aids,
            'board_work': self.board_work,
            'student_activities': self.student_activities,
            'assessment_plan': self.assessment_plan,
            'homework_given': self.homework_given,
            'previous_knowledge': self.previous_knowledge,
            'learning_outcomes': self.learning_outcomes,
            'differentiation': self.differentiation,
            'reflection': self.reflection,
            'status': self.status,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'rejection_reason': self.rejection_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# =====================================================
# HOMEWORK & ASSIGNMENTS
# =====================================================

class Homework(db.Model):
    """Homework assignments with deadlines"""
    __tablename__ = 'homework'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('staff.id'))
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    section_id = db.Column(db.Integer, db.ForeignKey('sections.id'))
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    instructions = db.Column(db.Text)
    homework_type = db.Column(db.Enum('assignment', 'project', 'worksheet', 'practice', 'reading', 'research', 'other'), default='assignment')
    assigned_date = db.Column(db.Date)
    due_date = db.Column(db.Date, nullable=False)
    max_marks = db.Column(db.Numeric(5, 2))
    attachment_url = db.Column(db.String(500))
    allow_late_submission = db.Column(db.Boolean, default=False)
    late_penalty_percent = db.Column(db.Numeric(5, 2), default=0)
    is_graded = db.Column(db.Boolean, default=True)
    status = db.Column(db.Enum('draft', 'published', 'closed', 'archived'), default='published')
    total_submissions = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    teacher = db.relationship('Staff')
    class_ref = db.relationship('Class')
    section_ref = db.relationship('Section')
    subject = db.relationship('Subject')
    submissions = db.relationship('HomeworkSubmission', backref='homework', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'teacher_id': self.teacher_id,
            'teacher_name': self.teacher.name if self.teacher else None,
            'class_id': self.class_id,
            'class_name': self.class_ref.name if self.class_ref else None,
            'section_id': self.section_id,
            'section_name': self.section_ref.name if self.section_ref else None,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'title': self.title,
            'description': self.description,
            'instructions': self.instructions,
            'homework_type': self.homework_type,
            'assigned_date': self.assigned_date.isoformat() if self.assigned_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'max_marks': float(self.max_marks) if self.max_marks else None,
            'attachment_url': self.attachment_url,
            'allow_late_submission': self.allow_late_submission,
            'late_penalty_percent': float(self.late_penalty_percent) if self.late_penalty_percent else 0,
            'is_graded': self.is_graded,
            'status': self.status,
            'total_submissions': self.submissions.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class HomeworkSubmission(db.Model):
    """Student submissions with grades"""
    __tablename__ = 'homework_submissions'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    homework_id = db.Column(db.Integer, db.ForeignKey('homework.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    submission_text = db.Column(db.Text)
    attachment_url = db.Column(db.String(500))
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_late = db.Column(db.Boolean, default=False)
    marks_obtained = db.Column(db.Numeric(5, 2))
    grade = db.Column(db.String(10))
    teacher_remarks = db.Column(db.Text)
    graded_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    graded_at = db.Column(db.DateTime)
    status = db.Column(db.Enum('submitted', 'graded', 'returned', 'resubmit'), default='submitted')

    student = db.relationship('Student')

    def to_dict(self):
        return {
            'id': self.id,
            'homework_id': self.homework_id,
            'student_id': self.student_id,
            'student_name': f"{self.student.first_name} {self.student.last_name}" if self.student else None,
            'admission_no': self.student.admission_no if self.student else None,
            'submission_text': self.submission_text,
            'attachment_url': self.attachment_url,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'is_late': self.is_late,
            'marks_obtained': float(self.marks_obtained) if self.marks_obtained else None,
            'grade': self.grade,
            'teacher_remarks': self.teacher_remarks,
            'graded_at': self.graded_at.isoformat() if self.graded_at else None,
            'status': self.status,
        }


# =====================================================
# STUDY MATERIALS & RESOURCES
# =====================================================

class StudyMaterial(db.Model):
    """Uploaded resources per subject/chapter"""
    __tablename__ = 'study_materials'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    chapter_id = db.Column(db.Integer, db.ForeignKey('syllabus.id'))
    uploaded_by = db.Column(db.Integer, db.ForeignKey('staff.id'))
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    material_type = db.Column(db.Enum('pdf', 'video', 'link', 'image', 'document', 'presentation', 'audio', 'other'), default='pdf')
    file_url = db.Column(db.String(500))
    external_link = db.Column(db.String(500))
    file_size = db.Column(db.Integer)  # in bytes
    tags = db.Column(db.String(500))  # comma-separated tags
    is_downloadable = db.Column(db.Boolean, default=True)
    view_count = db.Column(db.Integer, default=0)
    download_count = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    class_ref = db.relationship('Class')
    subject = db.relationship('Subject')
    chapter = db.relationship('Syllabus')
    uploader = db.relationship('Staff')

    def to_dict(self):
        return {
            'id': self.id,
            'class_id': self.class_id,
            'class_name': self.class_ref.name if self.class_ref else None,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'chapter_id': self.chapter_id,
            'chapter_name': self.chapter.chapter_name if self.chapter else None,
            'uploaded_by': self.uploaded_by,
            'uploader_name': self.uploader.name if self.uploader else None,
            'title': self.title,
            'description': self.description,
            'material_type': self.material_type,
            'file_url': self.file_url,
            'external_link': self.external_link,
            'file_size': self.file_size,
            'tags': self.tags,
            'is_downloadable': self.is_downloadable,
            'view_count': self.view_count,
            'download_count': self.download_count,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# =====================================================
# ACADEMIC CALENDAR
# =====================================================

class AcademicCalendar(db.Model):
    """Events, holidays, exam dates, PTM all in one place"""
    __tablename__ = 'academic_calendar'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'))
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    event_type = db.Column(db.Enum('holiday', 'exam', 'ptm', 'event', 'cultural', 'sports', 'meeting', 'deadline', 'vacation', 'other'), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)
    start_time = db.Column(db.Time)
    end_time = db.Column(db.Time)
    is_holiday = db.Column(db.Boolean, default=False)
    applies_to = db.Column(db.Enum('all', 'students', 'staff', 'specific_class'), default='all')
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
    color = db.Column(db.String(7), default='#1976d2')  # Hex color for calendar display
    is_recurring = db.Column(db.Boolean, default=False)
    recurrence_pattern = db.Column(db.String(50))  # weekly, monthly, yearly
    notify_parents = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    class_ref = db.relationship('Class')

    def to_dict(self):
        return {
            'id': self.id,
            'academic_year_id': self.academic_year_id,
            'title': self.title,
            'description': self.description,
            'event_type': self.event_type,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'is_holiday': self.is_holiday,
            'applies_to': self.applies_to,
            'class_id': self.class_id,
            'class_name': self.class_ref.name if self.class_ref else None,
            'color': self.color,
            'is_recurring': self.is_recurring,
            'recurrence_pattern': self.recurrence_pattern,
            'notify_parents': self.notify_parents,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# =====================================================
# TEACHER SUBJECT ALLOCATION
# =====================================================

class TeacherSubject(db.Model):
    """Teacher to subject/class mapping with workload tracking"""
    __tablename__ = 'teacher_subjects'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'))
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    section_id = db.Column(db.Integer, db.ForeignKey('sections.id'))
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'))
    periods_per_week = db.Column(db.Integer, default=0)
    is_class_teacher = db.Column(db.Boolean, default=False)
    assigned_date = db.Column(db.Date)
    status = db.Column(db.Enum('active', 'inactive', 'transferred'), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    teacher = db.relationship('Staff')
    subject = db.relationship('Subject')
    class_ref = db.relationship('Class')
    section_ref = db.relationship('Section')

    def to_dict(self):
        return {
            'id': self.id,
            'teacher_id': self.teacher_id,
            'teacher_name': self.teacher.name if self.teacher else None,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'class_id': self.class_id,
            'class_name': self.class_ref.name if self.class_ref else None,
            'section_id': self.section_id,
            'section_name': self.section_ref.name if self.section_ref else None,
            'periods_per_week': self.periods_per_week,
            'is_class_teacher': self.is_class_teacher,
            'assigned_date': self.assigned_date.isoformat() if self.assigned_date else None,
            'status': self.status,
        }


# =====================================================
# ELECTIVE MANAGEMENT
# =====================================================

class ElectiveGroup(db.Model):
    """Elective subject groups for student choice"""
    __tablename__ = 'elective_groups'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'))
    min_choices = db.Column(db.Integer, default=1)
    max_choices = db.Column(db.Integer, default=1)
    deadline = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    class_ref = db.relationship('Class')
    subjects = db.relationship('ElectiveSubject', backref='group', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'class_id': self.class_id,
            'class_name': self.class_ref.name if self.class_ref else None,
            'min_choices': self.min_choices,
            'max_choices': self.max_choices,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'is_active': self.is_active,
            'subjects': [s.to_dict() for s in self.subjects.all()],
        }


class ElectiveSubject(db.Model):
    """Subjects available in an elective group"""
    __tablename__ = 'elective_subjects'

    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('elective_groups.id', ondelete='CASCADE'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    max_seats = db.Column(db.Integer)
    filled_seats = db.Column(db.Integer, default=0)

    subject = db.relationship('Subject')

    def to_dict(self):
        return {
            'id': self.id,
            'group_id': self.group_id,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'max_seats': self.max_seats,
            'filled_seats': self.filled_seats,
            'available_seats': (self.max_seats - self.filled_seats) if self.max_seats else None,
        }


class StudentElective(db.Model):
    """Student elective choices"""
    __tablename__ = 'student_electives'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('elective_groups.id', ondelete='CASCADE'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.Enum('selected', 'confirmed', 'dropped'), default='selected')
    selected_at = db.Column(db.DateTime, default=datetime.utcnow)
    confirmed_at = db.Column(db.DateTime)

    student = db.relationship('Student')
    subject = db.relationship('Subject')
    elective_group = db.relationship('ElectiveGroup')

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': f"{self.student.first_name} {self.student.last_name}" if self.student else None,
            'group_id': self.group_id,
            'group_name': self.elective_group.name if self.elective_group else None,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'status': self.status,
            'selected_at': self.selected_at.isoformat() if self.selected_at else None,
        }
