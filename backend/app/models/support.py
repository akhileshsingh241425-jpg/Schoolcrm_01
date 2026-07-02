from app import db
from datetime import datetime


class SupportTicket(db.Model):
    __tablename__ = 'support_tickets'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    ticket_no = db.Column(db.String(20), unique=True)
    subject = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), default='general')  # general, technical, billing, feature_request, bug
    priority = db.Column(db.String(20), default='medium')  # low, medium, high, critical
    status = db.Column(db.String(20), default='open')  # open, in_progress, resolved, closed
    # Response
    response = db.Column(db.Text)
    responded_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    responded_at = db.Column(db.DateTime)
    # Tracking
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'))
    resolved_at = db.Column(db.DateTime)
    closed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        from app.models.user import User
        from app.models.school import School
        user = User.query.get(self.user_id)
        school = School.query.get(self.school_id)
        responder = User.query.get(self.responded_by) if self.responded_by else None
        return {
            'id': self.id,
            'ticket_no': self.ticket_no,
            'school_id': self.school_id,
            'school_name': school.name if school else None,
            'school_code': school.code if school else None,
            'user_id': self.user_id,
            'user_name': f"{user.first_name} {user.last_name or ''}" if user else 'Unknown',
            'user_email': user.email if user else None,
            'subject': self.subject,
            'message': self.message,
            'category': self.category,
            'priority': self.priority,
            'status': self.status,
            'response': self.response,
            'responded_by_name': f"{responder.first_name} {responder.last_name or ''}" if responder else None,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
