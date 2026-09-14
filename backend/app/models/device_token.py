from app import db
from datetime import datetime


class DeviceToken(db.Model):
    """An Expo push token for one device a user is logged into.

    A user can have several devices, so tokens are keyed by the token
    string itself rather than one-per-user.
    """
    __tablename__ = 'device_tokens'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    expo_push_token = db.Column(db.String(255), nullable=False, unique=True)
    platform = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
