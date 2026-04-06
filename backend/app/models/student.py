from app import db
from datetime import datetime


class AcademicYear(db.Model):
    __tablename__ = 'academic_years'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    is_current = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'is_current': self.is_current
        }


class Class(db.Model):
    __tablename__ = 'classes'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    numeric_name = db.Column(db.Integer)
    description = db.Column(db.String(255))

    sections = db.relationship('Section', backref='class_ref', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'numeric_name': self.numeric_name,
            'description': self.description,
        }

    def to_dict_with_sections(self):
        return {
            'id': self.id,
            'name': self.name,
            'numeric_name': self.numeric_name,
            'description': self.description,
            'sections': [s.to_dict() for s in self.sections.all()]
        }


class Section(db.Model):
    __tablename__ = 'sections'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    capacity = db.Column(db.Integer, default=40)
    class_teacher_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='SET NULL'), nullable=True)
    co_class_teacher_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='SET NULL'), nullable=True)

    class_teacher = db.relationship('Staff', foreign_keys=[class_teacher_id], backref='class_teacher_of')
    co_class_teacher = db.relationship('Staff', foreign_keys=[co_class_teacher_id], backref='co_class_teacher_of')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'class_id': self.class_id,
            'capacity': self.capacity,
            'class_teacher_id': self.class_teacher_id,
            'co_class_teacher_id': self.co_class_teacher_id,
        }

    def to_dict_full(self):
        return {
            'id': self.id,
            'name': self.name,
            'class_id': self.class_id,
            'capacity': self.capacity,
            'class_teacher_id': self.class_teacher_id,
            'co_class_teacher_id': self.co_class_teacher_id,
            'class_teacher_name': f"{self.class_teacher.first_name} {self.class_teacher.last_name or ''}".strip() if self.class_teacher else None,
            'co_class_teacher_name': f"{self.co_class_teacher.first_name} {self.co_class_teacher.last_name or ''}".strip() if self.co_class_teacher else None,
        }


class Student(db.Model):
    __tablename__ = 'students'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    admission_no = db.Column(db.String(50))
    roll_no = db.Column(db.String(20))
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100))
    gender = db.Column(db.Enum('male', 'female', 'other'))
    date_of_birth = db.Column(db.Date)
    blood_group = db.Column(db.String(5))
    religion = db.Column(db.String(50))
    category = db.Column(db.String(50))
    nationality = db.Column(db.String(50), default='Indian')
    aadhar_no = db.Column(db.String(20))
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    pincode = db.Column(db.String(10))
    photo_url = db.Column(db.String(500))
    current_class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
    current_section_id = db.Column(db.Integer, db.ForeignKey('sections.id'))
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'))
    admission_date = db.Column(db.Date)
    status = db.Column(db.Enum('active', 'inactive', 'graduated', 'transferred', 'dropout'), default='active')
    # New fields for Module 2
    mother_tongue = db.Column(db.String(50))
    emergency_contact = db.Column(db.String(20))
    emergency_person = db.Column(db.String(100))
    medical_conditions = db.Column(db.Text)
    allergies = db.Column(db.Text)
    previous_school = db.Column(db.String(255))
    house_id = db.Column(db.Integer, db.ForeignKey('student_houses.id'))
    transport_mode = db.Column(db.Enum('bus', 'van', 'self', 'walk'), default='self')
    sibling_group_id = db.Column(db.String(50))
    id_card_issued = db.Column(db.Boolean, default=False)
    id_card_no = db.Column(db.String(50))
    behavior_points = db.Column(db.Integer, default=100)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    parents = db.relationship('ParentDetail', backref='student', lazy='dynamic')
    documents = db.relationship('StudentDocument', backref='student', lazy='dynamic')
    current_class = db.relationship('Class', foreign_keys=[current_class_id])
    current_section = db.relationship('Section', foreign_keys=[current_section_id])
    achievements = db.relationship('StudentAchievement', backref='student', lazy='dynamic')
    behavior_logs = db.relationship('StudentBehavior', backref='student', lazy='dynamic')
    timeline = db.relationship('StudentTimeline', backref='student', lazy='dynamic', order_by='StudentTimeline.event_date.desc()')
    counseling = db.relationship('StudentCounseling', backref='student', lazy='dynamic')
    promotions = db.relationship('StudentPromotion', backref='student', lazy='dynamic')
    house = db.relationship('StudentHouse', foreign_keys=[house_id])

    __table_args__ = (
        db.UniqueConstraint('school_id', 'admission_no', name='unique_admission'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'school_id': self.school_id,
            'admission_no': self.admission_no,
            'roll_no': self.roll_no,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': f"{self.first_name} {self.last_name or ''}".strip(),
            'gender': self.gender,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'blood_group': self.blood_group,
            'religion': self.religion,
            'category': self.category,
            'nationality': self.nationality,
            'aadhar_no': self.aadhar_no,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'pincode': self.pincode,
            'photo_url': self.photo_url,
            'current_class': self.current_class.to_dict() if self.current_class else None,
            'current_section': self.current_section.to_dict() if self.current_section else None,
            'admission_date': self.admission_date.isoformat() if self.admission_date else None,
            'status': self.status,
            'mother_tongue': self.mother_tongue,
            'emergency_contact': self.emergency_contact,
            'emergency_person': self.emergency_person,
            'medical_conditions': self.medical_conditions,
            'allergies': self.allergies,
            'previous_school': self.previous_school,
            'house': self.house.to_dict() if self.house else None,
            'transport_mode': self.transport_mode,
            'sibling_group_id': self.sibling_group_id,
            'id_card_issued': self.id_card_issued,
            'id_card_no': self.id_card_no,
            'behavior_points': self.behavior_points,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ParentDetail(db.Model):
    __tablename__ = 'parent_details'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    relation = db.Column(db.Enum('father', 'mother', 'guardian'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(255))
    whatsapp = db.Column(db.String(20))
    occupation = db.Column(db.String(100))
    income = db.Column(db.String(50))
    aadhar_no = db.Column(db.String(20))
    address = db.Column(db.Text)
    qualification = db.Column(db.String(100))
    office_address = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

    def to_dict(self):
        return {
            'id': self.id,
            'relation': self.relation,
            'name': self.name,
            'phone': self.phone,
            'email': self.email,
            'whatsapp': self.whatsapp,
            'occupation': self.occupation,
            'income': self.income,
            'qualification': self.qualification,
            'aadhar_no': self.aadhar_no
        }


class StudentDocument(db.Model):
    __tablename__ = 'student_documents'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    document_type = db.Column(db.String(100), nullable=False)
    document_name = db.Column(db.String(255))
    file_url = db.Column(db.String(500), nullable=False)
    verified = db.Column(db.Boolean, default=False)
    verified_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'document_type': self.document_type,
            'document_name': self.document_name,
            'file_url': self.file_url,
            'verified': self.verified,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None
        }


# ---- Student Promotion / Auto Promotion Engine ----

class StudentPromotion(db.Model):
    __tablename__ = 'student_promotions'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    from_class_id = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    from_section_id = db.Column(db.Integer, db.ForeignKey('sections.id'))
    to_class_id = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    to_section_id = db.Column(db.Integer, db.ForeignKey('sections.id'))
    from_academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'), nullable=False)
    to_academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'), nullable=False)
    promotion_type = db.Column(db.Enum('promoted', 'detained', 'graduated', 'skipped'), default='promoted')
    result_percentage = db.Column(db.Float)
    remarks = db.Column(db.Text)
    promoted_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    promoted_at = db.Column(db.DateTime, default=datetime.utcnow)

    from_class = db.relationship('Class', foreign_keys=[from_class_id])
    to_class = db.relationship('Class', foreign_keys=[to_class_id])

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'from_class': self.from_class.name if self.from_class else None,
            'to_class': self.to_class.name if self.to_class else None,
            'promotion_type': self.promotion_type,
            'result_percentage': self.result_percentage,
            'remarks': self.remarks,
            'promoted_at': self.promoted_at.isoformat() if self.promoted_at else None
        }


# ---- Achievement Portfolio ----

class StudentAchievement(db.Model):
    __tablename__ = 'student_achievements'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    category = db.Column(db.Enum('academic', 'sports', 'cultural', 'science', 'leadership', 'community', 'other'), default='academic')
    level = db.Column(db.Enum('school', 'district', 'state', 'national', 'international'), default='school')
    position = db.Column(db.String(50))
    description = db.Column(db.Text)
    event_date = db.Column(db.Date)
    certificate_url = db.Column(db.String(500))
    points_earned = db.Column(db.Integer, default=0)
    added_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'title': self.title,
            'category': self.category,
            'level': self.level,
            'position': self.position,
            'description': self.description,
            'event_date': self.event_date.isoformat() if self.event_date else None,
            'certificate_url': self.certificate_url,
            'points_earned': self.points_earned,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


# ---- Behavior Points System ----

class StudentBehavior(db.Model):
    __tablename__ = 'student_behaviors'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    behavior_type = db.Column(db.Enum('positive', 'negative'), nullable=False)
    category = db.Column(db.String(100))
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    points = db.Column(db.Integer, default=0)
    action_taken = db.Column(db.Text)
    reported_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    incident_date = db.Column(db.Date, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'behavior_type': self.behavior_type,
            'category': self.category,
            'title': self.title,
            'description': self.description,
            'points': self.points,
            'action_taken': self.action_taken,
            'incident_date': self.incident_date.isoformat() if self.incident_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


# ---- Student Timeline ----

class StudentTimeline(db.Model):
    __tablename__ = 'student_timeline'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    event_type = db.Column(db.Enum('admission', 'promotion', 'achievement', 'behavior', 'medical', 'counseling', 'transfer', 'document', 'fee', 'general'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    event_date = db.Column(db.Date, default=datetime.utcnow)
    metadata_json = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'event_type': self.event_type,
            'title': self.title,
            'description': self.description,
            'event_date': self.event_date.isoformat() if self.event_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


# ---- Counselor / Counseling Records ----

class StudentCounseling(db.Model):
    __tablename__ = 'student_counseling'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    counselor_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    session_date = db.Column(db.Date, nullable=False)
    session_type = db.Column(db.Enum('academic', 'behavioral', 'career', 'personal', 'parent_meeting'), default='academic')
    reason = db.Column(db.String(255))
    notes = db.Column(db.Text)
    recommendations = db.Column(db.Text)
    follow_up_date = db.Column(db.Date)
    status = db.Column(db.Enum('scheduled', 'completed', 'cancelled', 'no_show'), default='scheduled')
    is_confidential = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'session_date': self.session_date.isoformat() if self.session_date else None,
            'session_type': self.session_type,
            'reason': self.reason,
            'notes': self.notes,
            'recommendations': self.recommendations,
            'follow_up_date': self.follow_up_date.isoformat() if self.follow_up_date else None,
            'status': self.status,
            'is_confidential': self.is_confidential,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


# ---- House System ----

class StudentHouse(db.Model):
    __tablename__ = 'student_houses'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    color = db.Column(db.String(20))
    motto = db.Column(db.String(255))
    captain_student_id = db.Column(db.Integer)
    total_points = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        from app.models.student import Student
        captain = Student.query.get(self.captain_student_id) if self.captain_student_id else None
        member_count = Student.query.filter_by(house_id=self.id, status='active').count()
        return {
            'id': self.id,
            'name': self.name,
            'color': self.color,
            'motto': self.motto,
            'captain': captain.to_dict() if captain else None,
            'total_points': self.total_points,
            'member_count': member_count
        }


# ---- Alumni Network ----

class Alumni(db.Model):
    __tablename__ = 'alumni'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    name = db.Column(db.String(255), nullable=False)
    batch_year = db.Column(db.String(20))
    passing_class = db.Column(db.String(50))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(255))
    current_occupation = db.Column(db.String(255))
    current_organization = db.Column(db.String(255))
    higher_education = db.Column(db.String(255))
    address = db.Column(db.Text)
    achievements_after = db.Column(db.Text)
    linkedin_url = db.Column(db.String(500))
    is_mentor = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'name': self.name,
            'batch_year': self.batch_year,
            'passing_class': self.passing_class,
            'phone': self.phone,
            'email': self.email,
            'current_occupation': self.current_occupation,
            'current_organization': self.current_organization,
            'higher_education': self.higher_education,
            'achievements_after': self.achievements_after,
            'is_mentor': self.is_mentor,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


# ---- Student Medical Records ----

class StudentMedical(db.Model):
    __tablename__ = 'student_medical'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    record_type = db.Column(db.Enum('checkup', 'vaccination', 'illness', 'injury', 'allergy', 'other'), default='checkup')
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    doctor_name = db.Column(db.String(255))
    record_date = db.Column(db.Date, nullable=False)
    next_followup = db.Column(db.Date)
    attachment_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'record_type': self.record_type,
            'title': self.title,
            'description': self.description,
            'doctor_name': self.doctor_name,
            'record_date': self.record_date.isoformat() if self.record_date else None,
            'next_followup': self.next_followup.isoformat() if self.next_followup else None,
            'attachment_url': self.attachment_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
