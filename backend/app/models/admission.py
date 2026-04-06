from app import db
from datetime import datetime, date
from sqlalchemy import func


class AdmissionSettings(db.Model):
    """School-specific admission configuration"""
    __tablename__ = 'admission_settings'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False, unique=True)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'))
    application_start_date = db.Column(db.Date)
    application_end_date = db.Column(db.Date)
    admission_open = db.Column(db.Boolean, default=True)
    auto_application_no = db.Column(db.Boolean, default=True)
    application_no_prefix = db.Column(db.String(20), default='APP')
    entrance_test_required = db.Column(db.Boolean, default=False)
    document_verification_required = db.Column(db.Boolean, default=True)
    age_verification_enabled = db.Column(db.Boolean, default=True)
    min_age_rules = db.Column(db.JSON)
    required_documents = db.Column(db.JSON)
    admission_fee_required = db.Column(db.Boolean, default=False)
    admission_fee_amount = db.Column(db.Numeric(10, 2), default=0)
    notification_email = db.Column(db.Boolean, default=True)
    notification_sms = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'school_id': self.school_id,
            'academic_year_id': self.academic_year_id,
            'application_start_date': self.application_start_date.isoformat() if self.application_start_date else None,
            'application_end_date': self.application_end_date.isoformat() if self.application_end_date else None,
            'admission_open': self.admission_open,
            'auto_application_no': self.auto_application_no,
            'application_no_prefix': self.application_no_prefix,
            'entrance_test_required': self.entrance_test_required,
            'document_verification_required': self.document_verification_required,
            'age_verification_enabled': self.age_verification_enabled,
            'min_age_rules': self.min_age_rules,
            'required_documents': self.required_documents,
            'admission_fee_required': self.admission_fee_required,
            'admission_fee_amount': float(self.admission_fee_amount) if self.admission_fee_amount else 0,
            'notification_email': self.notification_email,
            'notification_sms': self.notification_sms,
        }


class Admission(db.Model):
    """Main admission application record"""
    __tablename__ = 'admissions'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    application_no = db.Column(db.String(50))
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id'))

    # Student Info
    student_name = db.Column(db.String(255), nullable=False)
    date_of_birth = db.Column(db.Date)
    gender = db.Column(db.Enum('male', 'female', 'other'))
    blood_group = db.Column(db.String(5))
    religion = db.Column(db.String(50))
    category = db.Column(db.String(50))
    nationality = db.Column(db.String(50), default='Indian')
    aadhar_no = db.Column(db.String(20))
    photo_url = db.Column(db.String(500))
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    pincode = db.Column(db.String(10))

    # Father Info
    father_name = db.Column(db.String(255))
    father_phone = db.Column(db.String(20))
    father_email = db.Column(db.String(255))
    father_occupation = db.Column(db.String(100))
    father_income = db.Column(db.String(50))
    father_aadhar = db.Column(db.String(20))
    # Mother Info
    mother_name = db.Column(db.String(255))
    mother_phone = db.Column(db.String(20))
    mother_email = db.Column(db.String(255))
    mother_occupation = db.Column(db.String(100))
    # Guardian Info
    guardian_name = db.Column(db.String(255))
    guardian_phone = db.Column(db.String(20))
    guardian_relation = db.Column(db.String(50))

    # Primary Contact
    phone = db.Column(db.String(20))
    email = db.Column(db.String(255))
    emergency_contact = db.Column(db.String(20))

    # Academic Info
    class_applied = db.Column(db.Integer, db.ForeignKey('classes.id'))
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'))
    previous_school = db.Column(db.String(255))
    previous_class = db.Column(db.String(50))
    previous_percentage = db.Column(db.Numeric(5, 2))
    tc_number = db.Column(db.String(50))
    has_sibling = db.Column(db.Boolean, default=False)
    sibling_admission_no = db.Column(db.String(50))
    sibling_name = db.Column(db.String(255))

    # Transport
    transport_required = db.Column(db.Boolean, default=False)
    pickup_address = db.Column(db.Text)

    # Medical
    medical_conditions = db.Column(db.Text)
    allergies = db.Column(db.Text)
    disability = db.Column(db.String(255))

    # Application Meta
    application_date = db.Column(db.Date, default=date.today)
    application_source = db.Column(db.Enum('online', 'walk_in', 'referral', 'lead', 'campaign'), default='walk_in')
    status = db.Column(db.Enum(
        'applied', 'document_pending', 'document_verified',
        'test_scheduled', 'test_completed',
        'under_review', 'approved', 'rejected',
        'fee_pending', 'enrolled', 'cancelled', 'waitlisted'
    ), default='applied')
    priority = db.Column(db.Enum('normal', 'high', 'urgent'), default='normal')
    remarks = db.Column(db.Text)
    rejection_reason = db.Column(db.Text)

    # Entrance Test
    entrance_test_id = db.Column(db.Integer, db.ForeignKey('admission_tests.id'))
    test_score = db.Column(db.Numeric(5, 2))
    test_result = db.Column(db.Enum('pass', 'fail', 'pending'))
    merit_rank = db.Column(db.Integer)

    # Fees
    admission_fee_paid = db.Column(db.Boolean, default=False)
    admission_fee_amount = db.Column(db.Numeric(10, 2))
    fee_receipt_no = db.Column(db.String(50))
    fee_payment_date = db.Column(db.Date)
    fee_payment_mode = db.Column(db.String(20))

    # Processing
    processed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_date = db.Column(db.DateTime)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    lead = db.relationship('Lead', backref='admission')
    applied_class = db.relationship('Class', foreign_keys=[class_applied])
    academic_year = db.relationship('AcademicYear', foreign_keys=[academic_year_id])
    student = db.relationship('Student', backref='admission_record')
    documents = db.relationship('AdmissionDocument', backref='admission', lazy='dynamic', cascade='all, delete-orphan')
    status_history = db.relationship('AdmissionStatusHistory', backref='admission', lazy='dynamic', cascade='all, delete-orphan', order_by='AdmissionStatusHistory.created_at.desc()')
    entrance_test = db.relationship('AdmissionTest', foreign_keys=[entrance_test_id])
    processor = db.relationship('User', foreign_keys=[processed_by])
    approver = db.relationship('User', foreign_keys=[approved_by])

    __table_args__ = (
        db.UniqueConstraint('school_id', 'application_no', name='unique_application_no'),
        db.Index('idx_admission_school_status', 'school_id', 'status'),
        db.Index('idx_admission_school_class', 'school_id', 'class_applied'),
        db.Index('idx_admission_aadhar', 'school_id', 'aadhar_no'),
    )

    def to_dict(self, include_documents=False, include_history=False):
        result = {
            'id': self.id,
            'application_no': self.application_no,
            'student_name': self.student_name,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'gender': self.gender,
            'blood_group': self.blood_group,
            'religion': self.religion,
            'category': self.category,
            'nationality': self.nationality,
            'aadhar_no': self.aadhar_no,
            'photo_url': self.photo_url,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'pincode': self.pincode,

            'father_name': self.father_name,
            'father_phone': self.father_phone,
            'father_email': self.father_email,
            'father_occupation': self.father_occupation,
            'father_income': self.father_income,
            'mother_name': self.mother_name,
            'mother_phone': self.mother_phone,
            'mother_email': self.mother_email,
            'mother_occupation': self.mother_occupation,
            'guardian_name': self.guardian_name,
            'guardian_phone': self.guardian_phone,
            'guardian_relation': self.guardian_relation,

            'phone': self.phone,
            'email': self.email,
            'emergency_contact': self.emergency_contact,

            'class_applied': self.applied_class.to_dict() if self.applied_class else None,
            'class_applied_id': self.class_applied,
            'academic_year': self.academic_year.to_dict() if self.academic_year else None,
            'academic_year_id': self.academic_year_id,
            'previous_school': self.previous_school,
            'previous_class': self.previous_class,
            'previous_percentage': float(self.previous_percentage) if self.previous_percentage else None,
            'tc_number': self.tc_number,
            'has_sibling': self.has_sibling,
            'sibling_admission_no': self.sibling_admission_no,
            'sibling_name': self.sibling_name,

            'transport_required': self.transport_required,
            'pickup_address': self.pickup_address,
            'medical_conditions': self.medical_conditions,
            'allergies': self.allergies,
            'disability': self.disability,

            'application_date': self.application_date.isoformat() if self.application_date else None,
            'application_source': self.application_source,
            'status': self.status,
            'priority': self.priority,
            'remarks': self.remarks,
            'rejection_reason': self.rejection_reason,

            'test_score': float(self.test_score) if self.test_score else None,
            'test_result': self.test_result,
            'merit_rank': self.merit_rank,

            'admission_fee_paid': self.admission_fee_paid,
            'admission_fee_amount': float(self.admission_fee_amount) if self.admission_fee_amount else None,
            'fee_receipt_no': self.fee_receipt_no,
            'fee_payment_date': self.fee_payment_date.isoformat() if self.fee_payment_date else None,

            'processed_by': self.processor.full_name if self.processor else None,
            'approved_by': self.approver.full_name if self.approver else None,
            'approved_date': self.approved_date.isoformat() if self.approved_date else None,
            'student_id': self.student_id,
            'lead_id': self.lead_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_documents:
            result['documents'] = [d.to_dict() for d in self.documents.all()]
        if include_history:
            result['status_history'] = [h.to_dict() for h in self.status_history.all()]
        return result

    def to_list_dict(self):
        """Lightweight dict for list views"""
        return {
            'id': self.id,
            'application_no': self.application_no,
            'student_name': self.student_name,
            'father_name': self.father_name,
            'phone': self.phone,
            'email': self.email,
            'gender': self.gender,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'class_applied': self.applied_class.to_dict() if self.applied_class else None,
            'class_applied_id': self.class_applied,
            'application_date': self.application_date.isoformat() if self.application_date else None,
            'application_source': self.application_source,
            'status': self.status,
            'priority': self.priority,
            'test_score': float(self.test_score) if self.test_score else None,
            'test_result': self.test_result,
            'merit_rank': self.merit_rank,
            'has_sibling': self.has_sibling,
            'admission_fee_paid': self.admission_fee_paid,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class AdmissionDocument(db.Model):
    """Documents uploaded with admission application"""
    __tablename__ = 'admission_documents'

    id = db.Column(db.Integer, primary_key=True)
    admission_id = db.Column(db.Integer, db.ForeignKey('admissions.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    document_type = db.Column(db.String(50), nullable=False)
    document_name = db.Column(db.String(255))
    file_url = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)
    verified = db.Column(db.Boolean, default=False)
    verified_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    verified_at = db.Column(db.DateTime)
    rejection_reason = db.Column(db.String(255))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    verifier = db.relationship('User', foreign_keys=[verified_by])

    def to_dict(self):
        return {
            'id': self.id,
            'admission_id': self.admission_id,
            'document_type': self.document_type,
            'document_name': self.document_name,
            'file_url': self.file_url,
            'file_size': self.file_size,
            'verified': self.verified,
            'verified_by': self.verifier.full_name if self.verifier else None,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'rejection_reason': self.rejection_reason,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
        }


class AdmissionStatusHistory(db.Model):
    """Track every status change for audit trail"""
    __tablename__ = 'admission_status_history'

    id = db.Column(db.Integer, primary_key=True)
    admission_id = db.Column(db.Integer, db.ForeignKey('admissions.id', ondelete='CASCADE'), nullable=False)
    from_status = db.Column(db.String(30))
    to_status = db.Column(db.String(30), nullable=False)
    changed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    changer = db.relationship('User', foreign_keys=[changed_by])

    def to_dict(self):
        return {
            'id': self.id,
            'from_status': self.from_status,
            'to_status': self.to_status,
            'changed_by': self.changer.full_name if self.changer else None,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class SeatMatrix(db.Model):
    """Class/section wise seat availability"""
    __tablename__ = 'seat_matrix'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    section_id = db.Column(db.Integer, db.ForeignKey('sections.id'))
    total_seats = db.Column(db.Integer, nullable=False, default=40)
    general_seats = db.Column(db.Integer, default=0)
    rte_seats = db.Column(db.Integer, default=0)
    management_seats = db.Column(db.Integer, default=0)
    filled_seats = db.Column(db.Integer, default=0)
    waitlist_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    class_ref = db.relationship('Class', foreign_keys=[class_id])
    section_ref = db.relationship('Section', foreign_keys=[section_id])
    academic_year = db.relationship('AcademicYear', foreign_keys=[academic_year_id])

    __table_args__ = (
        db.UniqueConstraint('school_id', 'academic_year_id', 'class_id', 'section_id', name='unique_seat_matrix'),
    )

    @property
    def available_seats(self):
        return max(0, self.total_seats - self.filled_seats)

    def to_dict(self):
        return {
            'id': self.id,
            'class': self.class_ref.to_dict() if self.class_ref else None,
            'class_id': self.class_id,
            'section': self.section_ref.to_dict() if self.section_ref else None,
            'section_id': self.section_id,
            'academic_year': self.academic_year.to_dict() if self.academic_year else None,
            'total_seats': self.total_seats,
            'general_seats': self.general_seats,
            'rte_seats': self.rte_seats,
            'management_seats': self.management_seats,
            'filled_seats': self.filled_seats,
            'available_seats': self.available_seats,
            'waitlist_count': self.waitlist_count,
        }


class AdmissionWaitlist(db.Model):
    """Queue for overbooked classes"""
    __tablename__ = 'admission_waitlist'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    admission_id = db.Column(db.Integer, db.ForeignKey('admissions.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'), nullable=False)
    position = db.Column(db.Integer, nullable=False)
    status = db.Column(db.Enum('waiting', 'offered', 'accepted', 'declined', 'expired'), default='waiting')
    offered_at = db.Column(db.DateTime)
    responded_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    admission_ref = db.relationship('Admission', backref='waitlist_entry')
    class_ref = db.relationship('Class', foreign_keys=[class_id])

    __table_args__ = (
        db.UniqueConstraint('school_id', 'admission_id', name='unique_waitlist_entry'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'admission_id': self.admission_id,
            'student_name': self.admission_ref.student_name if self.admission_ref else None,
            'class': self.class_ref.to_dict() if self.class_ref else None,
            'position': self.position,
            'status': self.status,
            'offered_at': self.offered_at.isoformat() if self.offered_at else None,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class AdmissionTest(db.Model):
    """Entrance test configuration"""
    __tablename__ = 'admission_tests'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'))
    name = db.Column(db.String(255), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
    test_date = db.Column(db.DateTime)
    duration_minutes = db.Column(db.Integer, default=60)
    total_marks = db.Column(db.Integer, default=100)
    passing_marks = db.Column(db.Integer, default=40)
    venue = db.Column(db.String(255))
    instructions = db.Column(db.Text)
    status = db.Column(db.Enum('draft', 'scheduled', 'ongoing', 'completed', 'cancelled'), default='draft')
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    class_ref = db.relationship('Class', foreign_keys=[class_id])
    results = db.relationship('AdmissionTestResult', backref='test', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'class': self.class_ref.to_dict() if self.class_ref else None,
            'class_id': self.class_id,
            'test_date': self.test_date.isoformat() if self.test_date else None,
            'duration_minutes': self.duration_minutes,
            'total_marks': self.total_marks,
            'passing_marks': self.passing_marks,
            'venue': self.venue,
            'instructions': self.instructions,
            'status': self.status,
            'applicant_count': self.results.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class AdmissionTestResult(db.Model):
    """Individual student test results"""
    __tablename__ = 'admission_test_results'

    id = db.Column(db.Integer, primary_key=True)
    test_id = db.Column(db.Integer, db.ForeignKey('admission_tests.id', ondelete='CASCADE'), nullable=False)
    admission_id = db.Column(db.Integer, db.ForeignKey('admissions.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    marks_obtained = db.Column(db.Numeric(5, 2))
    percentage = db.Column(db.Numeric(5, 2))
    result = db.Column(db.Enum('pass', 'fail', 'absent'), default='absent')
    rank = db.Column(db.Integer)
    remarks = db.Column(db.Text)
    evaluated_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    evaluated_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    admission_ref = db.relationship('Admission', backref='test_results')

    __table_args__ = (
        db.UniqueConstraint('test_id', 'admission_id', name='unique_test_result'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'test_id': self.test_id,
            'admission_id': self.admission_id,
            'student_name': self.admission_ref.student_name if self.admission_ref else None,
            'application_no': self.admission_ref.application_no if self.admission_ref else None,
            'marks_obtained': float(self.marks_obtained) if self.marks_obtained else None,
            'percentage': float(self.percentage) if self.percentage else None,
            'result': self.result,
            'rank': self.rank,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class TransferCertificate(db.Model):
    """Transfer certificate records"""
    __tablename__ = 'transfer_certificates'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    tc_number = db.Column(db.String(50), nullable=False)
    issue_date = db.Column(db.Date, nullable=False, default=date.today)
    reason = db.Column(db.Enum('transfer', 'leaving', 'graduated', 'other'), default='leaving')
    leaving_date = db.Column(db.Date)
    class_at_leaving = db.Column(db.String(50))
    conduct = db.Column(db.String(100), default='Good')
    attendance_percentage = db.Column(db.Numeric(5, 2))
    fee_cleared = db.Column(db.Boolean, default=False)
    library_cleared = db.Column(db.Boolean, default=False)
    remarks = db.Column(db.Text)
    generated_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved = db.Column(db.Boolean, default=False)
    file_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('Student', backref='transfer_certificates')

    __table_args__ = (
        db.UniqueConstraint('school_id', 'tc_number', name='unique_tc_number'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'tc_number': self.tc_number,
            'student_id': self.student_id,
            'student_name': self.student.first_name + ' ' + (self.student.last_name or '') if self.student else None,
            'admission_no': self.student.admission_no if self.student else None,
            'issue_date': self.issue_date.isoformat() if self.issue_date else None,
            'reason': self.reason,
            'leaving_date': self.leaving_date.isoformat() if self.leaving_date else None,
            'class_at_leaving': self.class_at_leaving,
            'conduct': self.conduct,
            'attendance_percentage': float(self.attendance_percentage) if self.attendance_percentage else None,
            'fee_cleared': self.fee_cleared,
            'library_cleared': self.library_cleared,
            'remarks': self.remarks,
            'approved': self.approved,
            'file_url': self.file_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
