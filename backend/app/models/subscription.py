from app import db
from datetime import datetime, date


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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'monthly_price': float(self.monthly_price) if self.monthly_price else None,
            'yearly_price': float(self.yearly_price) if self.yearly_price else None,
            'max_students': self.max_students,
            'max_staff': self.max_staff,
            'features': self.features,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class SchoolSubscription(db.Model):
    __tablename__ = 'school_subscriptions'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    plan_id = db.Column(db.Integer, db.ForeignKey('subscription_plans.id'), nullable=False)
    billing_cycle = db.Column(db.Enum('monthly', 'yearly'), default='yearly')
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    addon_amount = db.Column(db.Numeric(12, 2), default=0)  # Total add-on feature cost
    total_amount = db.Column(db.Numeric(12, 2), default=0)  # amount + addon_amount
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    payment_status = db.Column(db.Enum('pending', 'paid', 'failed'), default='pending')
    razorpay_subscription_id = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    school = db.relationship('School', backref='subscriptions')
    plan = db.relationship('SubscriptionPlan', backref='subscriptions')
    payments = db.relationship('SubscriptionPayment', backref='subscription', lazy='dynamic')
    addons = db.relationship('SubscriptionFeatureAddOn', backref='subscription', lazy='dynamic',
                             cascade='all, delete-orphan')

    def to_dict(self):
        total_paid = db.session.query(db.func.coalesce(db.func.sum(SubscriptionPayment.amount), 0)).filter(
            SubscriptionPayment.subscription_id == self.id,
            SubscriptionPayment.status == 'completed'
        ).scalar()
        addon_list = [a.to_dict() for a in self.addons.all()]
        addon_total = float(self.addon_amount or 0)
        base_amount = float(self.amount or 0)
        total = float(self.total_amount or base_amount + addon_total)

        # Calculate days remaining
        days_remaining = 0
        if self.end_date:
            days_remaining = max(0, (self.end_date - date.today()).days)

        return {
            'id': self.id,
            'school_id': self.school_id,
            'plan': self.plan.to_dict() if self.plan else None,
            'billing_cycle': self.billing_cycle,
            'amount': base_amount,
            'addon_amount': addon_total,
            'total_amount': total,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'payment_status': self.payment_status,
            'total_paid': float(total_paid) if total_paid else 0,
            'days_remaining': days_remaining,
            'addons': addon_list,
        }


class SubscriptionFeatureAddOn(db.Model):
    """Add-on features purchased on top of the base plan — like mobile recharge add-on packs."""
    __tablename__ = 'subscription_feature_addons'

    id = db.Column(db.Integer, primary_key=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey('school_subscriptions.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    feature_name = db.Column(db.String(100), nullable=False)
    feature_label = db.Column(db.String(200))  # Human-readable label
    price = db.Column(db.Numeric(12, 2), nullable=False)  # Monthly or yearly price for this add-on
    billing_cycle = db.Column(db.Enum('monthly', 'yearly'), default='yearly')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    school = db.relationship('School', backref='subscription_addons')

    def to_dict(self):
        return {
            'id': self.id,
            'subscription_id': self.subscription_id,
            'school_id': self.school_id,
            'feature_name': self.feature_name,
            'feature_label': self.feature_label or self.feature_name,
            'price': float(self.price) if self.price else 0,
            'billing_cycle': self.billing_cycle,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
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
    payment_type = db.Column(db.Enum('subscription', 'recharge', 'addon'), default='subscription')  # Type of payment
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
            'payment_type': self.payment_type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


# ─── Available Add-on Features Catalog ───────────────────────────────────
# This is a static catalog of features that can be added on top of any plan.
# Each add-on has a monthly and yearly price.

ADDON_FEATURES_CATALOG = [
    {'feature_name': 'library', 'label': 'Library Management', 'monthly_price': 500, 'yearly_price': 5000},
    {'feature_name': 'transport', 'label': 'Transport Management', 'monthly_price': 800, 'yearly_price': 8000},
    {'feature_name': 'hostel', 'label': 'Hostel Management', 'monthly_price': 1000, 'yearly_price': 10000},
    {'feature_name': 'canteen', 'label': 'Canteen Management', 'monthly_price': 600, 'yearly_price': 6000},
    {'feature_name': 'sports', 'label': 'Sports & Extra-Curricular', 'monthly_price': 400, 'yearly_price': 4000},
    {'feature_name': 'inventory', 'label': 'Inventory Management', 'monthly_price': 500, 'yearly_price': 5000},
    {'feature_name': 'health_safety', 'label': 'Health & Safety', 'monthly_price': 300, 'yearly_price': 3000},
    {'feature_name': 'communication', 'label': 'Communication (WhatsApp/SMS)', 'monthly_price': 700, 'yearly_price': 7000},
    {'feature_name': 'online_exam', 'label': 'Online Exam System', 'monthly_price': 600, 'yearly_price': 6000},
    {'feature_name': 'parent_portal', 'label': 'Parent Portal', 'monthly_price': 400, 'yearly_price': 4000},
    {'feature_name': 'store', 'label': 'Store Management', 'monthly_price': 500, 'yearly_price': 5000},
    {'feature_name': 'data_import', 'label': 'Data Import/Migration', 'monthly_price': 200, 'yearly_price': 2000},
]
