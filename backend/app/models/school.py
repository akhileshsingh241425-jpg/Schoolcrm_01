from app import db
from datetime import datetime


class School(db.Model):
    __tablename__ = 'schools'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    pincode = db.Column(db.String(10))
    logo_url = db.Column(db.String(500))
    website = db.Column(db.String(255))
    theme_color = db.Column(db.String(7), default='#1976d2')
    subdomain = db.Column(db.String(100), unique=True)
    custom_domain = db.Column(db.String(255))
    plan = db.Column(db.Enum('basic', 'standard', 'premium'), default='basic')
    subscription_start = db.Column(db.Date)
    subscription_end = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True)
    max_students = db.Column(db.Integer, default=500)
    max_staff = db.Column(db.Integer, default=50)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    features = db.relationship('SchoolFeature', backref='school', lazy='dynamic')
    settings = db.relationship('SchoolSetting', backref='school', lazy='dynamic')
    users = db.relationship('User', backref='school', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'pincode': self.pincode,
            'logo_url': self.logo_url,
            'website': self.website,
            'theme_color': self.theme_color,
            'subdomain': self.subdomain,
            'plan': self.plan,
            'is_active': self.is_active,
            'max_students': self.max_students,
            'max_staff': self.max_staff,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def get_enabled_features(self):
        return [f.feature_name for f in self.features.filter_by(is_enabled=True).all()]


class SchoolFeature(db.Model):
    __tablename__ = 'school_features'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    feature_name = db.Column(db.String(100), nullable=False)
    is_enabled = db.Column(db.Boolean, default=False)

    __table_args__ = (
        db.UniqueConstraint('school_id', 'feature_name', name='unique_school_feature'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'feature_name': self.feature_name,
            'is_enabled': self.is_enabled
        }


class SchoolSetting(db.Model):
    __tablename__ = 'school_settings'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    setting_key = db.Column(db.String(100), nullable=False)
    setting_value = db.Column(db.Text)

    __table_args__ = (
        db.UniqueConstraint('school_id', 'setting_key', name='unique_school_setting'),
    )

    def to_dict(self):
        return {
            'setting_key': self.setting_key,
            'setting_value': self.setting_value
        }
