from app import db
from datetime import datetime


class LeadSource(db.Model):
    __tablename__ = 'lead_sources'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {'id': self.id, 'name': self.name}


class Campaign(db.Model):
    __tablename__ = 'campaigns'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    budget = db.Column(db.Numeric(12, 2))
    status = db.Column(db.Enum('planned', 'active', 'completed', 'cancelled'), default='planned')
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'budget': float(self.budget) if self.budget else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Lead(db.Model):
    __tablename__ = 'leads'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_name = db.Column(db.String(255), nullable=False)
    parent_name = db.Column(db.String(255))
    email = db.Column(db.String(255))
    phone = db.Column(db.String(20), nullable=False)
    alternate_phone = db.Column(db.String(20))
    source_id = db.Column(db.Integer, db.ForeignKey('lead_sources.id'))
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'))
    class_interested = db.Column(db.String(50))
    status = db.Column(db.Enum('new', 'contacted', 'interested', 'visit_scheduled', 'visited', 'application', 'admitted', 'lost'), default='new')
    priority = db.Column(db.Enum('low', 'medium', 'high'), default='medium')
    notes = db.Column(db.Text)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    source = db.relationship('LeadSource', backref='leads')
    campaign = db.relationship('Campaign', backref='leads')
    followups = db.relationship('LeadFollowup', backref='lead', lazy='dynamic')
    activities = db.relationship('LeadActivity', backref='lead', lazy='dynamic')
    assignee = db.relationship('User', foreign_keys=[assigned_to])

    def to_dict(self):
        return {
            'id': self.id,
            'student_name': self.student_name,
            'parent_name': self.parent_name,
            'email': self.email,
            'phone': self.phone,
            'source': self.source.to_dict() if self.source else None,
            'campaign': self.campaign.to_dict() if self.campaign else None,
            'class_interested': self.class_interested,
            'status': self.status,
            'priority': self.priority,
            'notes': self.notes,
            'assigned_to': self.assignee.to_dict() if self.assignee else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class LeadFollowup(db.Model):
    __tablename__ = 'lead_followups'

    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    followup_type = db.Column(db.Enum('call', 'whatsapp', 'email', 'visit', 'sms'), nullable=False)
    notes = db.Column(db.Text)
    followup_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.Enum('pending', 'completed', 'missed'), default='pending')
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'followup_type': self.followup_type,
            'notes': self.notes,
            'followup_date': self.followup_date.isoformat() if self.followup_date else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class LeadActivity(db.Model):
    __tablename__ = 'lead_activities'

    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    activity_type = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'activity_type': self.activity_type,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
