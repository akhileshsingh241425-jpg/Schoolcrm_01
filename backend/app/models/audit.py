from app import db
from datetime import datetime


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.BigInteger, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer)
    action = db.Column(db.String(100), nullable=False)
    module = db.Column(db.String(100))
    record_id = db.Column(db.Integer)
    old_values = db.Column(db.JSON)
    new_values = db.Column(db.JSON)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @staticmethod
    def log(school_id, user_id, action, module=None, record_id=None, old_values=None, new_values=None, ip_address=None, user_agent=None):
        log = AuditLog(
            school_id=school_id,
            user_id=user_id,
            action=action,
            module=module,
            record_id=record_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.session.add(log)
        db.session.commit()
        return log
