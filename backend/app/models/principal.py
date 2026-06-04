"""Models for Principal-specific features: Class Observations, Discipline Levels, Teacher Performance."""
from app import db
from datetime import datetime


class ClassObservation(db.Model):
    """Principal/VP visits a class and rates the teacher's performance."""
    __tablename__ = 'class_observations'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    observer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # Principal/VP
    teacher_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
    section_id = db.Column(db.Integer, db.ForeignKey('sections.id'))
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'))
    observation_date = db.Column(db.Date, nullable=False)
    period_number = db.Column(db.Integer)

    # Ratings (1-5)
    teaching_methodology = db.Column(db.Integer, default=3)
    classroom_management = db.Column(db.Integer, default=3)
    student_engagement = db.Column(db.Integer, default=3)
    subject_knowledge = db.Column(db.Integer, default=3)
    use_of_aids = db.Column(db.Integer, default=3)
    communication_skills = db.Column(db.Integer, default=3)
    overall_rating = db.Column(db.Numeric(3, 1))

    strengths = db.Column(db.Text)
    improvements = db.Column(db.Text)
    remarks = db.Column(db.Text)
    follow_up_date = db.Column(db.Date)
    status = db.Column(db.Enum('draft', 'shared_with_teacher', 'acknowledged'), default='draft')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    teacher = db.relationship('Staff', backref='observations')
    class_ref = db.relationship('Class')
    section_ref = db.relationship('Section')
    subject_ref = db.relationship('Subject')

    def to_dict(self):
        t = self.teacher
        return {
            'id': self.id,
            'teacher_id': self.teacher_id,
            'teacher_name': f"{t.first_name} {t.last_name or ''}".strip() if t else None,
            'class_name': self.class_ref.name if self.class_ref else None,
            'section_name': self.section_ref.name if self.section_ref else None,
            'subject_name': self.subject_ref.name if self.subject_ref else None,
            'observation_date': self.observation_date.isoformat() if self.observation_date else None,
            'period_number': self.period_number,
            'teaching_methodology': self.teaching_methodology,
            'classroom_management': self.classroom_management,
            'student_engagement': self.student_engagement,
            'subject_knowledge': self.subject_knowledge,
            'use_of_aids': self.use_of_aids,
            'communication_skills': self.communication_skills,
            'overall_rating': float(self.overall_rating) if self.overall_rating else None,
            'strengths': self.strengths,
            'improvements': self.improvements,
            'remarks': self.remarks,
            'follow_up_date': self.follow_up_date.isoformat() if self.follow_up_date else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class DisciplineCase(db.Model):
    """Student discipline cases with escalation levels."""
    __tablename__ = 'discipline_cases'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    reported_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    case_date = db.Column(db.Date, nullable=False)
    category = db.Column(db.String(50), nullable=False)  # attendance, behavior, academic, bullying, property_damage, other
    description = db.Column(db.Text, nullable=False)

    # Discipline Level (1-5)
    level = db.Column(db.Integer, default=1)  # 1=Warning, 2=Parent Meeting, 3=Detention, 4=Suspension, 5=Expulsion
    action_taken = db.Column(db.Text)
    parent_notified = db.Column(db.Boolean, default=False)
    parent_meeting_date = db.Column(db.Date)
    suspension_from = db.Column(db.Date)
    suspension_to = db.Column(db.Date)

    status = db.Column(db.Enum('open', 'in_progress', 'resolved', 'escalated'), default='open')
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    resolved_at = db.Column(db.DateTime)
    resolution_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('Student', backref='discipline_cases')

    def to_dict(self):
        s = self.student
        level_labels = {1: 'Warning', 2: 'Parent Meeting', 3: 'Detention', 4: 'Suspension', 5: 'Expulsion'}
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': f"{s.first_name} {s.last_name or ''}".strip() if s else None,
            'class_name': s.current_class.name if s and s.current_class else None,
            'section_name': s.current_section.name if s and s.current_section else None,
            'case_date': self.case_date.isoformat() if self.case_date else None,
            'category': self.category,
            'description': self.description,
            'level': self.level,
            'level_label': level_labels.get(self.level, 'Unknown'),
            'action_taken': self.action_taken,
            'parent_notified': self.parent_notified,
            'parent_meeting_date': self.parent_meeting_date.isoformat() if self.parent_meeting_date else None,
            'suspension_from': self.suspension_from.isoformat() if self.suspension_from else None,
            'suspension_to': self.suspension_to.isoformat() if self.suspension_to else None,
            'status': self.status,
            'resolution_notes': self.resolution_notes,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class TeacherPerformanceScore(db.Model):
    """Monthly/Quarterly teacher performance scoring."""
    __tablename__ = 'teacher_performance_scores'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    period = db.Column(db.String(20), nullable=False)  # '2026-05', '2026-Q1'
    
    # Scoring components (out of 100 each)
    attendance_score = db.Column(db.Numeric(5, 2), default=0)  # Based on % present
    punctuality_score = db.Column(db.Numeric(5, 2), default=0)  # Late arrivals
    marks_entry_score = db.Column(db.Numeric(5, 2), default=0)  # Timeliness of marks
    homework_score = db.Column(db.Numeric(5, 2), default=0)  # Homework given & checked
    syllabus_score = db.Column(db.Numeric(5, 2), default=0)  # Syllabus completion %
    student_result_score = db.Column(db.Numeric(5, 2), default=0)  # Student pass %
    observation_score = db.Column(db.Numeric(5, 2), default=0)  # From class observations
    
    total_score = db.Column(db.Numeric(5, 2), default=0)
    grade = db.Column(db.String(5))  # A+, A, B+, B, C
    
    remarks = db.Column(db.Text)
    scored_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    teacher = db.relationship('Staff', backref='performance_scores')

    def to_dict(self):
        t = self.teacher
        return {
            'id': self.id,
            'teacher_id': self.teacher_id,
            'teacher_name': f"{t.first_name} {t.last_name or ''}".strip() if t else None,
            'designation': t.designation if t else None,
            'department': t.department if t else None,
            'period': self.period,
            'attendance_score': float(self.attendance_score or 0),
            'punctuality_score': float(self.punctuality_score or 0),
            'marks_entry_score': float(self.marks_entry_score or 0),
            'homework_score': float(self.homework_score or 0),
            'syllabus_score': float(self.syllabus_score or 0),
            'student_result_score': float(self.student_result_score or 0),
            'observation_score': float(self.observation_score or 0),
            'total_score': float(self.total_score or 0),
            'grade': self.grade,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
