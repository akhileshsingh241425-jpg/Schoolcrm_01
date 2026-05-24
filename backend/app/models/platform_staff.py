from app import db
from datetime import datetime


class PlatformStaff(db.Model):
    __tablename__ = 'platform_staff'

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.String(50), unique=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100))
    gender = db.Column(db.Enum('male', 'female', 'other'))
    date_of_birth = db.Column(db.Date)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(255), unique=True)
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
    staff_type = db.Column(db.Enum('admin', 'technical', 'support', 'management'), default='admin')
    contract_type = db.Column(db.Enum('permanent', 'contract', 'probation', 'part_time'), default='permanent')
    pf_number = db.Column(db.String(50))
    emergency_contact = db.Column(db.String(20))
    emergency_person = db.Column(db.String(100))
    blood_group = db.Column(db.String(10))
    status = db.Column(db.Enum('active', 'inactive', 'resigned', 'terminated'), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    attendance = db.relationship('PlatformStaffAttendance', backref='staff', lazy='dynamic')
    payrolls = db.relationship('PlatformStaffPayroll', backref='staff', lazy='dynamic')
    leaves = db.relationship('PlatformStaffLeave', backref='staff', lazy='dynamic')

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
            'pf_number': self.pf_number,
            'emergency_contact': self.emergency_contact,
            'emergency_person': self.emergency_person,
            'blood_group': self.blood_group,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class PlatformStaffAttendance(db.Model):
    __tablename__ = 'platform_staff_attendance'

    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('platform_staff.id', ondelete='CASCADE'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.Enum('present', 'absent', 'late', 'half_day', 'leave'), nullable=False)
    check_in = db.Column(db.Time)
    check_out = db.Column(db.Time)
    remarks = db.Column(db.String(255))

    __table_args__ = (db.UniqueConstraint('staff_id', 'date', name='unique_platform_attendance'),)

    def to_dict(self):
        return {
            'id': self.id,
            'staff_id': self.staff_id,
            'date': self.date.isoformat() if self.date else None,
            'status': self.status,
            'check_in': self.check_in.isoformat() if self.check_in else None,
            'check_out': self.check_out.isoformat() if self.check_out else None,
            'remarks': self.remarks,
        }


class PlatformStaffPayroll(db.Model):
    __tablename__ = 'platform_staff_payroll'

    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('platform_staff.id', ondelete='CASCADE'), nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    basic_salary = db.Column(db.Numeric(12, 2))
    allowances = db.Column(db.Numeric(12, 2), default=0)
    deductions = db.Column(db.Numeric(12, 2), default=0)
    net_salary = db.Column(db.Numeric(12, 2))
    overtime_amount = db.Column(db.Numeric(12, 2), default=0)
    leave_deduction = db.Column(db.Numeric(12, 2), default=0)
    payment_status = db.Column(db.Enum('pending', 'paid', 'hold'), default='pending')
    payment_date = db.Column(db.Date)
    payment_mode = db.Column(db.Enum('bank_transfer', 'cheque', 'cash'))
    transaction_ref = db.Column(db.String(255))
    remarks = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'staff_id': self.staff_id,
            'month': self.month,
            'year': self.year,
            'basic_salary': float(self.basic_salary) if self.basic_salary else None,
            'allowances': float(self.allowances) if self.allowances else 0,
            'deductions': float(self.deductions) if self.deductions else 0,
            'net_salary': float(self.net_salary) if self.net_salary else None,
            'overtime_amount': float(self.overtime_amount) if self.overtime_amount else 0,
            'leave_deduction': float(self.leave_deduction) if self.leave_deduction else 0,
            'payment_status': self.payment_status,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'payment_mode': self.payment_mode,
            'transaction_ref': self.transaction_ref,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class PlatformStaffLeave(db.Model):
    __tablename__ = 'platform_staff_leaves'

    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('platform_staff.id', ondelete='CASCADE'), nullable=False)
    leave_type = db.Column(db.Enum('CL', 'EL', 'SL', 'ML', 'LWP'), nullable=False)
    from_date = db.Column(db.Date, nullable=False)
    to_date = db.Column(db.Date, nullable=False)
    days = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.Text)
    document_url = db.Column(db.String(500))
    status = db.Column(db.Enum('pending', 'approved', 'rejected', 'cancelled'), default='pending')
    approved_by = db.Column(db.Integer)
    approved_at = db.Column(db.DateTime)
    remarks = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'staff_id': self.staff_id,
            'leave_type': self.leave_type,
            'from_date': self.from_date.isoformat() if self.from_date else None,
            'to_date': self.to_date.isoformat() if self.to_date else None,
            'days': self.days,
            'reason': self.reason,
            'document_url': self.document_url,
            'status': self.status,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
