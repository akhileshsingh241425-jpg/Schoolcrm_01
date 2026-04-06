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

    def to_dict(self):
        return {
            'id': self.id,
            'school_id': self.school_id,
            'plan': self.plan.to_dict() if self.plan else None,
            'billing_cycle': self.billing_cycle,
            'amount': float(self.amount) if self.amount else None,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'payment_status': self.payment_status
        }
