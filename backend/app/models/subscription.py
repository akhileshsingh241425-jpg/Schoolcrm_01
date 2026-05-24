from app import db
from datetime import datetime


class SubscriptionPlan(db.Model):
    __tablename__ = 'subscription_plans'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    monthly_price = db.Column(db.Numeric(12, 2))
    yearly_price = db.Column(db.Numeric(12, 2))
    max_students = db.Column(db.Integer)
    max_staff = db.Column(db.Integer)
    features = db.Column(db.JSON)
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'monthly_price': float(self.monthly_price) if self.monthly_price else None,
            'yearly_price': float(self.yearly_price) if self.yearly_price else None,
            'max_students': self.max_students,
            'max_staff': self.max_staff,
            'features': self.features
        }


class SchoolSubscription(db.Model):
    __tablename__ = 'school_subscriptions'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    plan_id = db.Column(db.Integer, db.ForeignKey('subscription_plans.id'), nullable=False)
    billing_cycle = db.Column(db.Enum('monthly', 'yearly'), default='yearly')
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    payment_status = db.Column(db.Enum('pending', 'paid', 'failed'), default='pending')
    razorpay_subscription_id = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    school = db.relationship('School', backref='subscriptions')
    plan = db.relationship('SubscriptionPlan', backref='subscriptions')
    payments = db.relationship('SubscriptionPayment', backref='subscription', lazy='dynamic')

    def to_dict(self):
        total_paid = db.session.query(db.func.coalesce(db.func.sum(SubscriptionPayment.amount), 0)).filter(
            SubscriptionPayment.subscription_id == self.id,
            SubscriptionPayment.status == 'completed'
        ).scalar()
        return {
            'id': self.id,
            'school_id': self.school_id,
            'plan': self.plan.to_dict() if self.plan else None,
            'billing_cycle': self.billing_cycle,
            'amount': float(self.amount) if self.amount else None,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'payment_status': self.payment_status,
            'total_paid': float(total_paid) if total_paid else 0
        }


class SubscriptionPayment(db.Model):
    __tablename__ = 'subscription_payments'

    id = db.Column(db.Integer, primary_key=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey('school_subscriptions.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    payment_date = db.Column(db.Date, nullable=False)
    payment_mode = db.Column(db.Enum('cash', 'online', 'bank_transfer', 'cheque', 'upi', 'dd'), nullable=False)
    transaction_id = db.Column(db.String(255))
    receipt_no = db.Column(db.String(50), nullable=False)
    status = db.Column(db.Enum('completed', 'pending', 'failed', 'refunded'), default='completed')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    school = db.relationship('School', backref='subscription_payments')

    def to_dict(self):
        return {
            'id': self.id,
            'subscription_id': self.subscription_id,
            'school_id': self.school_id,
            'amount': float(self.amount) if self.amount else None,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'payment_mode': self.payment_mode,
            'transaction_id': self.transaction_id,
            'receipt_no': self.receipt_no,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
