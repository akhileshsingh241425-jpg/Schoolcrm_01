from app import db
from datetime import datetime


class Staff(db.Model):
    __tablename__ = 'staff'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    employee_id = db.Column(db.String(50))
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100))
    gender = db.Column(db.Enum('male', 'female', 'other'))
    date_of_birth = db.Column(db.Date)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(255))
    qualification = db.Column(db.String(255))
    experience_years = db.Column(db.Integer)
    designation = db.Column(db.String(100))
    department = db.Column(db.String(100))
    date_of_joining = db.Column(db.Date)
    salary = db.Column(db.Numeric(12, 2))
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    photo_url = db.Column(db.String(500))
    aadhar_no = db.Column(db.String(20))
    pan_no = db.Column(db.String(20))
    bank_name = db.Column(db.String(100))
    bank_account_no = db.Column(db.String(50))
    ifsc_code = db.Column(db.String(20))
    # HR fields
    staff_type = db.Column(db.Enum('teaching', 'non_teaching', 'admin'), default='teaching')
    contract_type = db.Column(db.Enum('permanent', 'contract', 'probation', 'part_time'), default='permanent')
    probation_end_date = db.Column(db.Date)
    contract_end_date = db.Column(db.Date)
    pf_number = db.Column(db.String(50))
    esi_number = db.Column(db.String(50))
    uan_number = db.Column(db.String(50))
    emergency_contact = db.Column(db.String(20))
    emergency_person = db.Column(db.String(100))
    blood_group = db.Column(db.String(10))
    marital_status = db.Column(db.Enum('single', 'married', 'divorced', 'widowed'))
    spouse_name = db.Column(db.String(100))
    status = db.Column(db.Enum('active', 'inactive', 'resigned', 'terminated', 'on_notice'), default='active')
    exit_date = db.Column(db.Date)
    exit_reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('school_id', 'employee_id', name='unique_employee'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': f"{self.first_name} {self.last_name or ''}".strip(),
            'gender': self.gender,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'phone': self.phone,
            'email': self.email,
            'qualification': self.qualification,
            'experience_years': self.experience_years,
            'designation': self.designation,
            'department': self.department,
            'date_of_joining': self.date_of_joining.isoformat() if self.date_of_joining else None,
            'salary': float(self.salary) if self.salary else None,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'photo_url': self.photo_url,
            'aadhar_no': self.aadhar_no,
            'pan_no': self.pan_no,
            'bank_name': self.bank_name,
            'bank_account_no': self.bank_account_no,
            'ifsc_code': self.ifsc_code,
            'staff_type': self.staff_type,
            'contract_type': self.contract_type,
            'probation_end_date': self.probation_end_date.isoformat() if self.probation_end_date else None,
            'contract_end_date': self.contract_end_date.isoformat() if self.contract_end_date else None,
            'pf_number': self.pf_number,
            'esi_number': self.esi_number,
            'emergency_contact': self.emergency_contact,
            'blood_group': self.blood_group,
            'marital_status': self.marital_status,
            'status': self.status,
            'exit_date': self.exit_date.isoformat() if self.exit_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class StaffDocument(db.Model):
    __tablename__ = 'staff_documents'

    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    document_type = db.Column(db.String(50), nullable=False)  # pan, aadhar, certificate, experience_letter, resume, photo, other
    document_name = db.Column(db.String(200))
    file_url = db.Column(db.String(500))
    verified = db.Column(db.Boolean, default=False)
    verified_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    verified_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    staff = db.relationship('Staff', backref='documents')

    def to_dict(self):
        return {
            'id': self.id,
            'staff_id': self.staff_id,
            'document_type': self.document_type,
            'document_name': self.document_name,
            'file_url': self.file_url,
            'verified': self.verified,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class SalaryStructure(db.Model):
    __tablename__ = 'salary_structures'

    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    basic_salary = db.Column(db.Numeric(12, 2), default=0)
    hra = db.Column(db.Numeric(12, 2), default=0)
    da = db.Column(db.Numeric(12, 2), default=0)
    ta = db.Column(db.Numeric(12, 2), default=0)
    medical_allowance = db.Column(db.Numeric(12, 2), default=0)
    special_allowance = db.Column(db.Numeric(12, 2), default=0)
    other_allowance = db.Column(db.Numeric(12, 2), default=0)
    pf_deduction = db.Column(db.Numeric(12, 2), default=0)
    esi_deduction = db.Column(db.Numeric(12, 2), default=0)
    tds = db.Column(db.Numeric(12, 2), default=0)
    professional_tax = db.Column(db.Numeric(12, 2), default=0)
    other_deduction = db.Column(db.Numeric(12, 2), default=0)
    effective_from = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    staff = db.relationship('Staff', backref='salary_structures')

    @property
    def gross_salary(self):
        return float(self.basic_salary or 0) + float(self.hra or 0) + float(self.da or 0) + \
               float(self.ta or 0) + float(self.medical_allowance or 0) + \
               float(self.special_allowance or 0) + float(self.other_allowance or 0)

    @property
    def total_deductions(self):
        return float(self.pf_deduction or 0) + float(self.esi_deduction or 0) + \
               float(self.tds or 0) + float(self.professional_tax or 0) + float(self.other_deduction or 0)

    @property
    def net_salary(self):
        return self.gross_salary - self.total_deductions

    def to_dict(self):
        return {
            'id': self.id,
            'staff_id': self.staff_id,
            'basic_salary': float(self.basic_salary or 0),
            'hra': float(self.hra or 0),
            'da': float(self.da or 0),
            'ta': float(self.ta or 0),
            'medical_allowance': float(self.medical_allowance or 0),
            'special_allowance': float(self.special_allowance or 0),
            'other_allowance': float(self.other_allowance or 0),
            'pf_deduction': float(self.pf_deduction or 0),
            'esi_deduction': float(self.esi_deduction or 0),
            'tds': float(self.tds or 0),
            'professional_tax': float(self.professional_tax or 0),
            'other_deduction': float(self.other_deduction or 0),
            'gross_salary': self.gross_salary,
            'total_deductions': self.total_deductions,
            'net_salary': self.net_salary,
            'effective_from': self.effective_from.isoformat() if self.effective_from else None,
            'is_active': self.is_active,
        }


class StaffPayroll(db.Model):
    __tablename__ = 'staff_payroll'

    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    basic_salary = db.Column(db.Numeric(12, 2))
    hra = db.Column(db.Numeric(12, 2), default=0)
    da = db.Column(db.Numeric(12, 2), default=0)
    ta = db.Column(db.Numeric(12, 2), default=0)
    medical_allowance = db.Column(db.Numeric(12, 2), default=0)
    special_allowance = db.Column(db.Numeric(12, 2), default=0)
    other_allowance = db.Column(db.Numeric(12, 2), default=0)
    gross_salary = db.Column(db.Numeric(12, 2), default=0)
    pf_deduction = db.Column(db.Numeric(12, 2), default=0)
    esi_deduction = db.Column(db.Numeric(12, 2), default=0)
    tds = db.Column(db.Numeric(12, 2), default=0)
    professional_tax = db.Column(db.Numeric(12, 2), default=0)
    other_deduction = db.Column(db.Numeric(12, 2), default=0)
    total_deductions = db.Column(db.Numeric(12, 2), default=0)
    overtime_hours = db.Column(db.Numeric(6, 2), default=0)
    overtime_amount = db.Column(db.Numeric(12, 2), default=0)
    leave_deduction = db.Column(db.Numeric(12, 2), default=0)
    net_salary = db.Column(db.Numeric(12, 2))
    allowances = db.Column(db.Numeric(12, 2), default=0)
    deductions = db.Column(db.Numeric(12, 2), default=0)
    payment_status = db.Column(db.Enum('pending', 'paid', 'hold'), default='pending')
    payment_date = db.Column(db.Date)
    payment_mode = db.Column(db.String(20))  # bank_transfer, cheque, cash
    transaction_ref = db.Column(db.String(100))
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    staff = db.relationship('Staff', backref='payrolls')

    def to_dict(self):
        s = self.staff
        return {
            'id': self.id,
            'staff_id': self.staff_id,
            'staff_name': f"{s.first_name} {s.last_name or ''}".strip() if s else '',
            'employee_id': s.employee_id if s else '',
            'department': s.department if s else '',
            'month': self.month,
            'year': self.year,
            'basic_salary': float(self.basic_salary or 0),
            'hra': float(self.hra or 0),
            'da': float(self.da or 0),
            'ta': float(self.ta or 0),
            'medical_allowance': float(self.medical_allowance or 0),
            'special_allowance': float(self.special_allowance or 0),
            'other_allowance': float(self.other_allowance or 0),
            'gross_salary': float(self.gross_salary or 0),
            'pf_deduction': float(self.pf_deduction or 0),
            'esi_deduction': float(self.esi_deduction or 0),
            'tds': float(self.tds or 0),
            'professional_tax': float(self.professional_tax or 0),
            'other_deduction': float(self.other_deduction or 0),
            'total_deductions': float(self.total_deductions or 0),
            'overtime_hours': float(self.overtime_hours or 0),
            'overtime_amount': float(self.overtime_amount or 0),
            'leave_deduction': float(self.leave_deduction or 0),
            'net_salary': float(self.net_salary or 0),
            'allowances': float(self.allowances or 0),
            'deductions': float(self.deductions or 0),
            'payment_status': self.payment_status,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'payment_mode': self.payment_mode,
            'transaction_ref': self.transaction_ref,
            'remarks': self.remarks,
        }


class StaffLeave(db.Model):
    __tablename__ = 'staff_leaves'

    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    leave_type = db.Column(db.String(20), nullable=False)  # CL, EL, SL, ML, LWP
    from_date = db.Column(db.Date, nullable=False)
    to_date = db.Column(db.Date, nullable=False)
    days = db.Column(db.Numeric(4, 1), nullable=False)
    reason = db.Column(db.Text)
    document_url = db.Column(db.String(500))
    status = db.Column(db.Enum('pending', 'approved', 'rejected', 'cancelled'), default='pending')
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    staff = db.relationship('Staff', backref='leaves')

    def to_dict(self):
        s = self.staff
        return {
            'id': self.id,
            'staff_id': self.staff_id,
            'staff_name': f"{s.first_name} {s.last_name or ''}".strip() if s else '',
            'leave_type': self.leave_type,
            'from_date': self.from_date.isoformat() if self.from_date else None,
            'to_date': self.to_date.isoformat() if self.to_date else None,
            'days': float(self.days or 0),
            'reason': self.reason,
            'document_url': self.document_url,
            'status': self.status,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class StaffLeaveBalance(db.Model):
    __tablename__ = 'staff_leave_balances'

    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    cl_total = db.Column(db.Integer, default=12)
    cl_used = db.Column(db.Integer, default=0)
    el_total = db.Column(db.Integer, default=15)
    el_used = db.Column(db.Integer, default=0)
    sl_total = db.Column(db.Integer, default=10)
    sl_used = db.Column(db.Integer, default=0)
    ml_total = db.Column(db.Integer, default=0)
    ml_used = db.Column(db.Integer, default=0)

    staff = db.relationship('Staff', backref='leave_balances')

    __table_args__ = (
        db.UniqueConstraint('staff_id', 'year', name='unique_staff_leave_year'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'staff_id': self.staff_id,
            'year': self.year,
            'CL': {'total': self.cl_total, 'used': self.cl_used, 'balance': self.cl_total - self.cl_used},
            'EL': {'total': self.el_total, 'used': self.el_used, 'balance': self.el_total - self.el_used},
            'SL': {'total': self.sl_total, 'used': self.sl_used, 'balance': self.sl_total - self.sl_used},
            'ML': {'total': self.ml_total, 'used': self.ml_used, 'balance': self.ml_total - self.ml_used},
        }


class PerformanceReview(db.Model):
    __tablename__ = 'performance_reviews'

    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    review_period = db.Column(db.String(50))  # e.g. "2025-26 Q1"
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    review_type = db.Column(db.Enum('self', 'peer', 'principal', 'annual'), default='annual')
    teaching_rating = db.Column(db.Integer)  # 1-5
    punctuality_rating = db.Column(db.Integer)
    communication_rating = db.Column(db.Integer)
    knowledge_rating = db.Column(db.Integer)
    teamwork_rating = db.Column(db.Integer)
    overall_rating = db.Column(db.Numeric(3, 1))
    strengths = db.Column(db.Text)
    improvements = db.Column(db.Text)
    goals = db.Column(db.Text)
    comments = db.Column(db.Text)
    status = db.Column(db.Enum('draft', 'submitted', 'acknowledged'), default='draft')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    staff = db.relationship('Staff', backref='reviews')

    def to_dict(self):
        s = self.staff
        return {
            'id': self.id,
            'staff_id': self.staff_id,
            'staff_name': f"{s.first_name} {s.last_name or ''}".strip() if s else '',
            'review_period': self.review_period,
            'review_type': self.review_type,
            'teaching_rating': self.teaching_rating,
            'punctuality_rating': self.punctuality_rating,
            'communication_rating': self.communication_rating,
            'knowledge_rating': self.knowledge_rating,
            'teamwork_rating': self.teamwork_rating,
            'overall_rating': float(self.overall_rating or 0),
            'strengths': self.strengths,
            'improvements': self.improvements,
            'goals': self.goals,
            'comments': self.comments,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Recruitment(db.Model):
    __tablename__ = 'recruitments'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    job_title = db.Column(db.String(200), nullable=False)
    department = db.Column(db.String(100))
    designation = db.Column(db.String(100))
    vacancies = db.Column(db.Integer, default=1)
    description = db.Column(db.Text)
    requirements = db.Column(db.Text)
    salary_range = db.Column(db.String(100))
    application_deadline = db.Column(db.Date)
    status = db.Column(db.Enum('open', 'closed', 'on_hold'), default='open')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'job_title': self.job_title,
            'department': self.department,
            'designation': self.designation,
            'vacancies': self.vacancies,
            'description': self.description,
            'requirements': self.requirements,
            'salary_range': self.salary_range,
            'application_deadline': self.application_deadline.isoformat() if self.application_deadline else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class JobApplication(db.Model):
    __tablename__ = 'job_applications'

    id = db.Column(db.Integer, primary_key=True)
    recruitment_id = db.Column(db.Integer, db.ForeignKey('recruitments.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    applicant_name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    qualification = db.Column(db.String(255))
    experience_years = db.Column(db.Integer)
    resume_url = db.Column(db.String(500))
    cover_letter = db.Column(db.Text)
    status = db.Column(db.Enum('applied', 'shortlisted', 'interview', 'selected', 'rejected', 'offer_sent', 'joined'), default='applied')
    interview_date = db.Column(db.DateTime)
    interview_notes = db.Column(db.Text)
    rating = db.Column(db.Integer)  # 1-5
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    recruitment = db.relationship('Recruitment', backref='applications')

    def to_dict(self):
        return {
            'id': self.id,
            'recruitment_id': self.recruitment_id,
            'job_title': self.recruitment.job_title if self.recruitment else '',
            'applicant_name': self.applicant_name,
            'email': self.email,
            'phone': self.phone,
            'qualification': self.qualification,
            'experience_years': self.experience_years,
            'resume_url': self.resume_url,
            'status': self.status,
            'interview_date': self.interview_date.isoformat() if self.interview_date else None,
            'interview_notes': self.interview_notes,
            'rating': self.rating,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class TrainingRecord(db.Model):
    __tablename__ = 'training_records'

    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    training_name = db.Column(db.String(200), nullable=False)
    training_type = db.Column(db.String(50))  # workshop, seminar, online, certification
    provider = db.Column(db.String(200))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    hours = db.Column(db.Numeric(6, 1))
    cpd_points = db.Column(db.Integer, default=0)
    certificate_url = db.Column(db.String(500))
    status = db.Column(db.Enum('upcoming', 'ongoing', 'completed', 'cancelled'), default='upcoming')
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    staff = db.relationship('Staff', backref='trainings')

    def to_dict(self):
        s = self.staff
        return {
            'id': self.id,
            'staff_id': self.staff_id,
            'staff_name': f"{s.first_name} {s.last_name or ''}".strip() if s else '',
            'training_name': self.training_name,
            'training_type': self.training_type,
            'provider': self.provider,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'hours': float(self.hours or 0),
            'cpd_points': self.cpd_points,
            'certificate_url': self.certificate_url,
            'status': self.status,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class DutyRoster(db.Model):
    __tablename__ = 'duty_rosters'

    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('staff.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    duty_type = db.Column(db.String(50), nullable=False)  # exam_duty, assembly, gate_duty, event, bus_duty
    duty_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time)
    end_time = db.Column(db.Time)
    location = db.Column(db.String(200))
    notes = db.Column(db.Text)
    status = db.Column(db.Enum('assigned', 'completed', 'absent', 'swapped'), default='assigned')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    staff = db.relationship('Staff', backref='duty_rosters')

    def to_dict(self):
        s = self.staff
        return {
            'id': self.id,
            'staff_id': self.staff_id,
            'staff_name': f"{s.first_name} {s.last_name or ''}".strip() if s else '',
            'duty_type': self.duty_type,
            'duty_date': self.duty_date.isoformat() if self.duty_date else None,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'location': self.location,
            'notes': self.notes,
            'status': self.status,
        }
