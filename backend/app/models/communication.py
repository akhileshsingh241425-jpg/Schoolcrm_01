from app import db
from datetime import datetime


class Announcement(db.Model):
    __tablename__ = 'announcements'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    target_audience = db.Column(db.Enum('all', 'students', 'parents', 'teachers', 'staff', 'class_specific'), default='all')
    target_class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
    is_published = db.Column(db.Boolean, default=False)
    published_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'target_audience': self.target_audience,
            'is_published': self.is_published,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text)
    type = db.Column(db.Enum('sms', 'whatsapp', 'email', 'push', 'in_app'), nullable=False)
    status = db.Column(db.Enum('pending', 'sent', 'failed'), default='pending')
    sent_at = db.Column(db.DateTime)
    read_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'status': self.status,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class SmsTemplate(db.Model):
    __tablename__ = 'sms_templates'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    template = db.Column(db.Text, nullable=False)
    variables = db.Column(db.JSON)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'template': self.template,
            'variables': self.variables
        }


class AlertSetting(db.Model):
    """School-level auto-alert configuration"""
    __tablename__ = 'alert_settings'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    alert_type = db.Column(db.Enum(
        'late_arrival',           # student not arrived by cutoff time
        'daily_absent',           # daily absent notification
        'monthly_attendance',     # monthly attendance report
        'exam_schedule',          # exam schedule notification
        'exam_result',            # exam result notification
        'fee_reminder',           # fee payment reminder
        'low_attendance_warning'  # attendance below threshold
    ), nullable=False)
    is_enabled = db.Column(db.Boolean, default=True)
    channels = db.Column(db.JSON, default=['email'])  # ['email', 'whatsapp', 'sms']
    config = db.Column(db.JSON, default={})
    # config examples:
    # late_arrival: {"cutoff_time": "10:00", "message_template": "..."}
    # monthly_attendance: {"send_day": 1, "min_attendance_pct": 75}
    # exam_schedule: {"days_before": 3}
    # low_attendance_warning: {"threshold": 75}
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('school_id', 'alert_type', name='unique_alert_type_per_school'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'alert_type': self.alert_type,
            'is_enabled': self.is_enabled,
            'channels': self.channels or ['email'],
            'config': self.config or {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class NotificationLog(db.Model):
    """Log of all sent notifications for tracking"""
    __tablename__ = 'notification_logs'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    alert_type = db.Column(db.String(50), nullable=False)
    channel = db.Column(db.Enum('email', 'whatsapp', 'sms', 'in_app'), nullable=False)
    recipient_name = db.Column(db.String(255))
    recipient_contact = db.Column(db.String(255))  # email or phone
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    subject = db.Column(db.String(255))
    message = db.Column(db.Text)
    status = db.Column(db.Enum('sent', 'failed', 'pending'), default='pending')
    error_message = db.Column(db.Text)
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'alert_type': self.alert_type,
            'channel': self.channel,
            'recipient_name': self.recipient_name,
            'recipient_contact': self.recipient_contact,
            'student_id': self.student_id,
            'subject': self.subject,
            'message': self.message,
            'status': self.status,
            'error_message': self.error_message,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
        }
