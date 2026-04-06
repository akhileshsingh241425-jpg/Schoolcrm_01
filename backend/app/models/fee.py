from app import db
from datetime import datetime


class FeeCategory(db.Model):
    __tablename__ = 'fee_categories'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'description': self.description}


class FeeStructure(db.Model):
    __tablename__ = 'fee_structures'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'))
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id', ondelete='CASCADE'), nullable=False)
    fee_category_id = db.Column(db.Integer, db.ForeignKey('fee_categories.id', ondelete='CASCADE'), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    due_date = db.Column(db.Date)
    frequency = db.Column(db.Enum('one_time', 'monthly', 'quarterly', 'half_yearly', 'yearly'), default='yearly')
    late_fee_amount = db.Column(db.Numeric(12, 2), default=0)
    late_fee_type = db.Column(db.Enum('fixed', 'percentage', 'per_day'), default='fixed')
    grace_period_days = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)

    category = db.relationship('FeeCategory', backref='structures')
    class_ref = db.relationship('Class', backref='fee_structures')

    def to_dict(self):
        return {
            'id': self.id,
            'class_id': self.class_id,
            'class_name': self.class_ref.name if self.class_ref else None,
            'category': self.category.to_dict() if self.category else None,
            'amount': float(self.amount) if self.amount else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'frequency': self.frequency,
            'late_fee_amount': float(self.late_fee_amount) if self.late_fee_amount else 0,
            'late_fee_type': self.late_fee_type,
            'grace_period_days': self.grace_period_days,
            'is_active': self.is_active
        }


class FeeInstallment(db.Model):
    __tablename__ = 'fee_installments'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    fee_structure_id = db.Column(db.Integer, db.ForeignKey('fee_structures.id', ondelete='CASCADE'), nullable=False)
    installment_no = db.Column(db.Integer, nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    paid_amount = db.Column(db.Numeric(12, 2), default=0)
    late_fee = db.Column(db.Numeric(12, 2), default=0)
    status = db.Column(db.Enum('pending', 'partial', 'paid', 'overdue'), default='pending')
    paid_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('Student', backref='installments')

    def to_dict(self):
        return {
            'id': self.id, 'student_id': self.student_id,
            'student_name': f"{self.student.first_name} {self.student.last_name or ''}".strip() if self.student else '',
            'fee_structure_id': self.fee_structure_id,
            'installment_no': self.installment_no,
            'amount': float(self.amount),
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'paid_amount': float(self.paid_amount or 0),
            'late_fee': float(self.late_fee or 0),
            'balance': float(self.amount) - float(self.paid_amount or 0),
            'status': self.status,
            'paid_date': self.paid_date.isoformat() if self.paid_date else None
        }


class FeePayment(db.Model):
    __tablename__ = 'fee_payments'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    fee_structure_id = db.Column(db.Integer, db.ForeignKey('fee_structures.id', ondelete='CASCADE'), nullable=False)
    installment_id = db.Column(db.Integer, db.ForeignKey('fee_installments.id'), nullable=True)
    amount_paid = db.Column(db.Numeric(12, 2), nullable=False)
    late_fee_paid = db.Column(db.Numeric(12, 2), default=0)
    discount_amount = db.Column(db.Numeric(12, 2), default=0)
    total_amount = db.Column(db.Numeric(12, 2), nullable=False)
    payment_date = db.Column(db.Date, nullable=False)
    payment_mode = db.Column(db.Enum('cash', 'online', 'cheque', 'bank_transfer', 'upi', 'dd'), nullable=False)
    transaction_id = db.Column(db.String(255))
    razorpay_payment_id = db.Column(db.String(255))
    razorpay_order_id = db.Column(db.String(255))
    cheque_no = db.Column(db.String(50))
    cheque_date = db.Column(db.Date)
    bank_name = db.Column(db.String(100))
    cheque_status = db.Column(db.Enum('pending', 'cleared', 'bounced'), nullable=True)
    receipt_no = db.Column(db.String(50))
    status = db.Column(db.Enum('pending', 'completed', 'failed', 'refunded', 'cancelled'), default='pending')
    remarks = db.Column(db.String(255))
    collected_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('Student', backref='payments')
    fee_structure = db.relationship('FeeStructure', backref='payments')

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': f"{self.student.first_name} {self.student.last_name or ''}".strip() if self.student else '',
            'fee_structure_id': self.fee_structure_id,
            'installment_id': self.installment_id,
            'amount_paid': float(self.amount_paid) if self.amount_paid else 0,
            'late_fee_paid': float(self.late_fee_paid or 0),
            'discount_amount': float(self.discount_amount or 0),
            'total_amount': float(self.total_amount) if self.total_amount else 0,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'payment_mode': self.payment_mode,
            'transaction_id': self.transaction_id,
            'cheque_no': self.cheque_no,
            'cheque_status': self.cheque_status,
            'receipt_no': self.receipt_no,
            'status': self.status,
            'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class FeeReceipt(db.Model):
    __tablename__ = 'fee_receipts'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    payment_id = db.Column(db.Integer, db.ForeignKey('fee_payments.id', ondelete='CASCADE'), nullable=False)
    receipt_no = db.Column(db.String(50), nullable=False)
    receipt_date = db.Column(db.Date, nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    amount_in_words = db.Column(db.String(255))
    pdf_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    payment = db.relationship('FeePayment', backref='receipts')
    student = db.relationship('Student', backref='fee_receipts')

    def to_dict(self):
        return {
            'id': self.id, 'receipt_no': self.receipt_no,
            'receipt_date': self.receipt_date.isoformat() if self.receipt_date else None,
            'student_id': self.student_id,
            'student_name': f"{self.student.first_name} {self.student.last_name or ''}".strip() if self.student else '',
            'amount': float(self.amount),
            'amount_in_words': self.amount_in_words,
            'payment_id': self.payment_id, 'pdf_url': self.pdf_url
        }


class FeeDiscount(db.Model):
    __tablename__ = 'fee_discounts'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    fee_category_id = db.Column(db.Integer, db.ForeignKey('fee_categories.id', ondelete='CASCADE'), nullable=False)
    discount_type = db.Column(db.Enum('percentage', 'fixed'), nullable=False)
    discount_value = db.Column(db.Numeric(12, 2), nullable=False)
    reason = db.Column(db.String(255))
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))

    student = db.relationship('Student', backref='fee_discounts')

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'student_name': f"{self.student.first_name} {self.student.last_name or ''}".strip() if self.student else '',
            'fee_category_id': self.fee_category_id,
            'discount_type': self.discount_type,
            'discount_value': float(self.discount_value) if self.discount_value else None,
            'reason': self.reason
        }


class Scholarship(db.Model):
    __tablename__ = 'scholarships'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    scholarship_type = db.Column(db.Enum('merit', 'need_based', 'sports', 'rte', 'government', 'other'), default='merit')
    discount_type = db.Column(db.Enum('percentage', 'fixed'), default='percentage')
    discount_value = db.Column(db.Numeric(12, 2), nullable=False)
    eligibility_criteria = db.Column(db.Text)
    max_recipients = db.Column(db.Integer)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    awards = db.relationship('ScholarshipAward', backref='scholarship', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name,
            'scholarship_type': self.scholarship_type,
            'discount_type': self.discount_type,
            'discount_value': float(self.discount_value),
            'eligibility_criteria': self.eligibility_criteria,
            'max_recipients': self.max_recipients,
            'is_active': self.is_active,
            'awards_count': self.awards.count()
        }


class ScholarshipAward(db.Model):
    __tablename__ = 'scholarship_awards'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    scholarship_id = db.Column(db.Integer, db.ForeignKey('scholarships.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    status = db.Column(db.Enum('pending', 'approved', 'rejected', 'active', 'revoked'), default='pending')
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('Student', backref='scholarship_awards')

    def to_dict(self):
        return {
            'id': self.id, 'scholarship_id': self.scholarship_id,
            'scholarship_name': self.scholarship.name if self.scholarship else '',
            'student_id': self.student_id,
            'student_name': f"{self.student.first_name} {self.student.last_name or ''}".strip() if self.student else '',
            'amount': float(self.amount), 'status': self.status,
            'remarks': self.remarks,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None
        }


class Concession(db.Model):
    __tablename__ = 'concessions'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    fee_category_id = db.Column(db.Integer, db.ForeignKey('fee_categories.id'), nullable=True)
    concession_type = db.Column(db.Enum('percentage', 'fixed'), default='fixed')
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    reason = db.Column(db.Text)
    requested_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    reviewed_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    status = db.Column(db.Enum('pending', 'reviewed', 'approved', 'rejected'), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    student = db.relationship('Student', backref='concessions')

    def to_dict(self):
        return {
            'id': self.id, 'student_id': self.student_id,
            'student_name': f"{self.student.first_name} {self.student.last_name or ''}".strip() if self.student else '',
            'fee_category_id': self.fee_category_id,
            'concession_type': self.concession_type,
            'amount': float(self.amount), 'reason': self.reason,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Expense(db.Model):
    __tablename__ = 'expenses'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    expense_category = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    expense_date = db.Column(db.Date, nullable=False)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=True)
    payment_mode = db.Column(db.Enum('cash', 'cheque', 'bank_transfer', 'upi'), default='cash')
    reference_no = db.Column(db.String(100))
    invoice_no = db.Column(db.String(100))
    department = db.Column(db.String(100))
    budget_head_id = db.Column(db.Integer, db.ForeignKey('budgets.id'), nullable=True)
    receipt_url = db.Column(db.String(500))
    status = db.Column(db.Enum('pending', 'approved', 'paid', 'rejected'), default='pending')
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    vendor = db.relationship('Vendor', backref='expenses')

    def to_dict(self):
        return {
            'id': self.id, 'expense_category': self.expense_category,
            'description': self.description,
            'amount': float(self.amount),
            'expense_date': self.expense_date.isoformat() if self.expense_date else None,
            'vendor_id': self.vendor_id,
            'vendor_name': self.vendor.name if self.vendor else None,
            'payment_mode': self.payment_mode,
            'reference_no': self.reference_no, 'invoice_no': self.invoice_no,
            'department': self.department,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Vendor(db.Model):
    __tablename__ = 'vendors'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    contact_person = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    address = db.Column(db.Text)
    gst_no = db.Column(db.String(20))
    pan_no = db.Column(db.String(15))
    bank_name = db.Column(db.String(100))
    account_no = db.Column(db.String(30))
    ifsc_code = db.Column(db.String(15))
    category = db.Column(db.String(100))
    status = db.Column(db.Enum('active', 'inactive'), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name,
            'contact_person': self.contact_person,
            'phone': self.phone, 'email': self.email,
            'address': self.address, 'gst_no': self.gst_no,
            'pan_no': self.pan_no, 'category': self.category,
            'status': self.status
        }


class PurchaseOrder(db.Model):
    __tablename__ = 'purchase_orders'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    po_number = db.Column(db.String(50), nullable=False)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id', ondelete='CASCADE'), nullable=False)
    order_date = db.Column(db.Date, nullable=False)
    delivery_date = db.Column(db.Date)
    items_description = db.Column(db.Text)
    total_amount = db.Column(db.Numeric(12, 2), nullable=False)
    gst_amount = db.Column(db.Numeric(12, 2), default=0)
    grand_total = db.Column(db.Numeric(12, 2), nullable=False)
    status = db.Column(db.Enum('draft', 'sent', 'acknowledged', 'delivered', 'invoiced', 'paid', 'cancelled'), default='draft')
    remarks = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    vendor = db.relationship('Vendor', backref='purchase_orders')

    def to_dict(self):
        return {
            'id': self.id, 'po_number': self.po_number,
            'vendor_id': self.vendor_id,
            'vendor_name': self.vendor.name if self.vendor else None,
            'order_date': self.order_date.isoformat() if self.order_date else None,
            'delivery_date': self.delivery_date.isoformat() if self.delivery_date else None,
            'items_description': self.items_description,
            'total_amount': float(self.total_amount),
            'gst_amount': float(self.gst_amount or 0),
            'grand_total': float(self.grand_total),
            'status': self.status, 'remarks': self.remarks
        }


class Budget(db.Model):
    __tablename__ = 'budgets'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    academic_year_id = db.Column(db.Integer, db.ForeignKey('academic_years.id'))
    department = db.Column(db.String(100), nullable=False)
    budget_head = db.Column(db.String(100), nullable=False)
    allocated_amount = db.Column(db.Numeric(14, 2), nullable=False)
    spent_amount = db.Column(db.Numeric(14, 2), default=0)
    status = db.Column(db.Enum('draft', 'approved', 'active', 'closed'), default='draft')
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        alloc = float(self.allocated_amount or 0)
        spent = float(self.spent_amount or 0)
        return {
            'id': self.id, 'department': self.department,
            'budget_head': self.budget_head,
            'allocated_amount': alloc,
            'spent_amount': spent,
            'remaining_amount': alloc - spent,
            'utilization_pct': round((spent / alloc * 100), 1) if alloc > 0 else 0,
            'status': self.status, 'remarks': self.remarks
        }


class AccountingEntry(db.Model):
    __tablename__ = 'accounting_entries'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    entry_date = db.Column(db.Date, nullable=False)
    entry_type = db.Column(db.Enum('income', 'expense', 'transfer'), nullable=False)
    account_head = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    debit = db.Column(db.Numeric(14, 2), default=0)
    credit = db.Column(db.Numeric(14, 2), default=0)
    reference_type = db.Column(db.String(50))
    reference_id = db.Column(db.Integer)
    voucher_no = db.Column(db.String(50))
    narration = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'entry_date': self.entry_date.isoformat() if self.entry_date else None,
            'entry_type': self.entry_type,
            'account_head': self.account_head,
            'description': self.description,
            'debit': float(self.debit or 0),
            'credit': float(self.credit or 0),
            'voucher_no': self.voucher_no,
            'narration': self.narration,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class BankReconciliation(db.Model):
    __tablename__ = 'bank_reconciliation'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    bank_name = db.Column(db.String(100), nullable=False)
    account_no = db.Column(db.String(30))
    statement_date = db.Column(db.Date, nullable=False)
    description = db.Column(db.Text)
    debit = db.Column(db.Numeric(14, 2), default=0)
    credit = db.Column(db.Numeric(14, 2), default=0)
    balance = db.Column(db.Numeric(14, 2))
    is_reconciled = db.Column(db.Boolean, default=False)
    matched_entry_id = db.Column(db.Integer, db.ForeignKey('accounting_entries.id'))
    reconciled_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'bank_name': self.bank_name,
            'account_no': self.account_no,
            'statement_date': self.statement_date.isoformat() if self.statement_date else None,
            'description': self.description,
            'debit': float(self.debit or 0),
            'credit': float(self.credit or 0),
            'balance': float(self.balance or 0),
            'is_reconciled': self.is_reconciled,
            'matched_entry_id': self.matched_entry_id
        }


class FeeRefund(db.Model):
    __tablename__ = 'fee_refunds'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    payment_id = db.Column(db.Integer, db.ForeignKey('fee_payments.id'), nullable=True)
    refund_amount = db.Column(db.Numeric(12, 2), nullable=False)
    reason = db.Column(db.Text)
    refund_mode = db.Column(db.Enum('cash', 'cheque', 'bank_transfer', 'upi'), default='bank_transfer')
    reference_no = db.Column(db.String(100))
    status = db.Column(db.Enum('requested', 'approved', 'processed', 'rejected'), default='requested')
    requested_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    processed_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('Student', backref='fee_refunds')

    def to_dict(self):
        return {
            'id': self.id, 'student_id': self.student_id,
            'student_name': f"{self.student.first_name} {self.student.last_name or ''}".strip() if self.student else '',
            'payment_id': self.payment_id,
            'refund_amount': float(self.refund_amount),
            'reason': self.reason, 'refund_mode': self.refund_mode,
            'reference_no': self.reference_no, 'status': self.status,
            'processed_date': self.processed_date.isoformat() if self.processed_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
