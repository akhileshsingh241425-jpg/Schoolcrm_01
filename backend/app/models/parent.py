from app import db
from datetime import datetime


class ParentProfile(db.Model):
    __tablename__ = 'parent_profiles'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    parent_detail_id = db.Column(db.Integer, db.ForeignKey('parent_details.id'), nullable=True)
    name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(255))
    whatsapp = db.Column(db.String(20))
    photo_url = db.Column(db.String(500))
    address = db.Column(db.Text)
    occupation = db.Column(db.String(100))
    preferred_language = db.Column(db.String(50), default='English')
    notification_preferences = db.Column(db.JSON)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'user_id': self.user_id,
            'parent_detail_id': self.parent_detail_id,
            'name': self.name, 'phone': self.phone, 'email': self.email,
            'whatsapp': self.whatsapp,
            'photo_url': self.photo_url, 'address': self.address,
            'occupation': self.occupation,
            'preferred_language': self.preferred_language,
            'is_active': self.is_active,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class PTMSlot(db.Model):
    __tablename__ = 'ptm_slots'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    ptm_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    slot_duration = db.Column(db.Integer, default=15)
    teacher_id = db.Column(db.Integer, db.ForeignKey('staff.id'))
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
    max_bookings = db.Column(db.Integer, default=1)
    status = db.Column(db.String(20), default='active')
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    teacher = db.relationship('Staff', foreign_keys=[teacher_id])

    def to_dict(self):
        teacher_name = ''
        if self.teacher:
            teacher_name = f"{self.teacher.first_name} {self.teacher.last_name}"
        return {
            'id': self.id, 'title': self.title,
            'ptm_date': str(self.ptm_date) if self.ptm_date else None,
            'start_time': str(self.start_time) if self.start_time else None,
            'end_time': str(self.end_time) if self.end_time else None,
            'slot_duration': self.slot_duration,
            'teacher_id': self.teacher_id, 'teacher_name': teacher_name,
            'class_id': self.class_id,
            'max_bookings': self.max_bookings, 'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class PTMBooking(db.Model):
    __tablename__ = 'ptm_bookings'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    slot_id = db.Column(db.Integer, db.ForeignKey('ptm_slots.id', ondelete='CASCADE'), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('parent_profiles.id'))
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    booking_time = db.Column(db.Time)
    status = db.Column(db.String(20), default='booked')
    notes = db.Column(db.Text)
    feedback = db.Column(db.Text)
    rating = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    slot = db.relationship('PTMSlot', foreign_keys=[slot_id])

    def to_dict(self):
        return {
            'id': self.id, 'slot_id': self.slot_id,
            'parent_id': self.parent_id, 'student_id': self.student_id,
            'booking_time': str(self.booking_time) if self.booking_time else None,
            'status': self.status, 'notes': self.notes,
            'feedback': self.feedback, 'rating': self.rating,
            'slot': self.slot.to_dict() if self.slot else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class FeedbackSurvey(db.Model):
    __tablename__ = 'feedback_surveys'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    survey_type = db.Column(db.String(30), default='general')
    target_audience = db.Column(db.String(30), default='parents')
    questions = db.Column(db.JSON)
    is_anonymous = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'title': self.title, 'description': self.description,
            'survey_type': self.survey_type, 'target_audience': self.target_audience,
            'questions': self.questions, 'is_anonymous': self.is_anonymous,
            'is_active': self.is_active,
            'start_date': str(self.start_date) if self.start_date else None,
            'end_date': str(self.end_date) if self.end_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class FeedbackResponse(db.Model):
    __tablename__ = 'feedback_responses'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    survey_id = db.Column(db.Integer, db.ForeignKey('feedback_surveys.id', ondelete='CASCADE'), nullable=False)
    parent_id = db.Column(db.Integer)
    student_id = db.Column(db.Integer)
    responses = db.Column(db.JSON)
    rating = db.Column(db.Integer)
    comments = db.Column(db.Text)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)

    survey = db.relationship('FeedbackSurvey', foreign_keys=[survey_id])

    def to_dict(self):
        return {
            'id': self.id, 'survey_id': self.survey_id,
            'parent_id': self.parent_id, 'student_id': self.student_id,
            'responses': self.responses, 'rating': self.rating,
            'comments': self.comments,
            'survey_title': self.survey.title if self.survey else None,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
        }


class Grievance(db.Model):
    __tablename__ = 'grievances'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    ticket_no = db.Column(db.String(30))
    parent_id = db.Column(db.Integer)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    category = db.Column(db.String(50), default='general')
    subject = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default='medium')
    status = db.Column(db.String(20), default='open')
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'))
    resolution = db.Column(db.Text)
    resolved_at = db.Column(db.DateTime)
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    parent_feedback = db.Column(db.Text)
    parent_rating = db.Column(db.Integer)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'ticket_no': self.ticket_no,
            'parent_id': self.parent_id, 'student_id': self.student_id,
            'category': self.category, 'subject': self.subject,
            'description': self.description, 'priority': self.priority,
            'status': self.status, 'assigned_to': self.assigned_to,
            'resolution': self.resolution,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'parent_feedback': self.parent_feedback, 'parent_rating': self.parent_rating,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ConsentForm(db.Model):
    __tablename__ = 'consent_forms'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    consent_type = db.Column(db.String(30), default='general')
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
    deadline = db.Column(db.Date)
    is_mandatory = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    responses = db.relationship('ConsentResponse', backref='consent_form', lazy='dynamic')

    def to_dict(self):
        total = self.responses.count() if self.responses else 0
        accepted = self.responses.filter_by(response='accepted').count() if self.responses else 0
        return {
            'id': self.id, 'title': self.title, 'description': self.description,
            'consent_type': self.consent_type, 'class_id': self.class_id,
            'deadline': str(self.deadline) if self.deadline else None,
            'is_mandatory': self.is_mandatory, 'is_active': self.is_active,
            'total_responses': total, 'accepted_count': accepted,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ConsentResponse(db.Model):
    __tablename__ = 'consent_responses'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    consent_form_id = db.Column(db.Integer, db.ForeignKey('consent_forms.id', ondelete='CASCADE'), nullable=False)
    parent_id = db.Column(db.Integer)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    response = db.Column(db.String(20), default='pending')
    remarks = db.Column(db.Text)
    responded_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'consent_form_id': self.consent_form_id,
            'parent_id': self.parent_id, 'student_id': self.student_id,
            'response': self.response, 'remarks': self.remarks,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
        }


class ParentNotification(db.Model):
    __tablename__ = 'parent_notifications'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    parent_id = db.Column(db.Integer)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text)
    notification_type = db.Column(db.String(30), default='general')
    channel = db.Column(db.String(20), default='in_app')
    is_read = db.Column(db.Boolean, default=False)
    read_at = db.Column(db.DateTime)
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'parent_id': self.parent_id,
            'student_id': self.student_id,
            'title': self.title, 'message': self.message,
            'notification_type': self.notification_type,
            'channel': self.channel, 'is_read': self.is_read,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
        }


class ParentMessage(db.Model):
    __tablename__ = 'parent_messages'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    sender_type = db.Column(db.String(20), default='parent')
    sender_id = db.Column(db.Integer, nullable=False)
    receiver_type = db.Column(db.String(20), default='teacher')
    receiver_id = db.Column(db.Integer, nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    subject = db.Column(db.String(255))
    message = db.Column(db.Text, nullable=False)
    attachment_url = db.Column(db.String(500))
    is_read = db.Column(db.Boolean, default=False)
    read_at = db.Column(db.DateTime)
    parent_id = db.Column(db.Integer)
    thread_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'sender_type': self.sender_type, 'sender_id': self.sender_id,
            'receiver_type': self.receiver_type, 'receiver_id': self.receiver_id,
            'student_id': self.student_id,
            'subject': self.subject, 'message': self.message,
            'attachment_url': self.attachment_url,
            'is_read': self.is_read,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'thread_id': self.thread_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class DailyActivity(db.Model):
    __tablename__ = 'daily_activities'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    class_id = db.Column(db.Integer, db.ForeignKey('classes.id'))
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'))
    activity_date = db.Column(db.Date, default=datetime.utcnow)
    activity_type = db.Column(db.String(30), default='general')
    title = db.Column(db.String(255))
    description = db.Column(db.Text)
    photo_urls = db.Column(db.JSON)
    posted_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'class_id': self.class_id,
            'student_id': self.student_id,
            'activity_date': str(self.activity_date) if self.activity_date else None,
            'activity_type': self.activity_type,
            'title': self.title, 'description': self.description,
            'photo_urls': self.photo_urls,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class VolunteerRegistration(db.Model):
    __tablename__ = 'volunteer_registrations'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    parent_id = db.Column(db.Integer)
    parent_name = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    event_name = db.Column(db.String(255), nullable=False)
    event_date = db.Column(db.Date)
    role = db.Column(db.String(100))
    status = db.Column(db.String(20), default='registered')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'parent_id': self.parent_id,
            'parent_name': self.parent_name, 'phone': self.phone,
            'event_name': self.event_name,
            'event_date': str(self.event_date) if self.event_date else None,
            'role': self.role, 'status': self.status, 'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class PickupAuthorization(db.Model):
    __tablename__ = 'pickup_authorizations'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=True)
    authorized_person = db.Column(db.String(255), nullable=False)
    relation = db.Column(db.String(50))
    phone = db.Column(db.String(20), nullable=False)
    photo_url = db.Column(db.String(500))
    id_proof = db.Column(db.String(100))
    otp = db.Column(db.String(10))
    otp_generated_at = db.Column(db.DateTime)
    otp_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'student_id': self.student_id,
            'authorized_person': self.authorized_person,
            'relation': self.relation, 'phone': self.phone,
            'photo_url': self.photo_url, 'id_proof': self.id_proof,
            'otp_verified': self.otp_verified, 'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
