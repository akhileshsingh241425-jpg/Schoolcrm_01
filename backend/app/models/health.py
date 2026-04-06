from app import db
from datetime import datetime


# ── Health Record (Digital Health Card) ─────────────────────────
class HealthRecord(db.Model):
    __tablename__ = 'health_records'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    person_type = db.Column(db.String(20), default='student')  # student, staff
    person_id = db.Column(db.Integer, nullable=False)
    blood_group = db.Column(db.String(10))
    height_cm = db.Column(db.Numeric(5, 1))
    weight_kg = db.Column(db.Numeric(5, 1))
    bmi = db.Column(db.Numeric(5, 2))
    allergies = db.Column(db.Text)
    chronic_conditions = db.Column(db.Text)
    vaccinations = db.Column(db.Text)
    disabilities = db.Column(db.Text)
    vision_left = db.Column(db.String(20))
    vision_right = db.Column(db.String(20))
    dental_status = db.Column(db.String(50))
    doctor_name = db.Column(db.String(100))
    doctor_phone = db.Column(db.String(20))
    insurance_provider = db.Column(db.String(100))
    insurance_policy_no = db.Column(db.String(50))
    insurance_expiry = db.Column(db.Date)
    notes = db.Column(db.Text)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'person_type': self.person_type, 'person_id': self.person_id,
            'blood_group': self.blood_group,
            'height_cm': float(self.height_cm) if self.height_cm else None,
            'weight_kg': float(self.weight_kg) if self.weight_kg else None,
            'bmi': float(self.bmi) if self.bmi else None,
            'allergies': self.allergies, 'chronic_conditions': self.chronic_conditions,
            'vaccinations': self.vaccinations, 'disabilities': self.disabilities,
            'vision_left': self.vision_left, 'vision_right': self.vision_right,
            'dental_status': self.dental_status,
            'doctor_name': self.doctor_name, 'doctor_phone': self.doctor_phone,
            'insurance_provider': self.insurance_provider,
            'insurance_policy_no': self.insurance_policy_no,
            'insurance_expiry': self.insurance_expiry.isoformat() if self.insurance_expiry else None,
            'notes': self.notes,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Infirmary Visit ────────────────────────────────────────────
class InfirmaryVisit(db.Model):
    __tablename__ = 'infirmary_visits'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    person_type = db.Column(db.String(20), default='student')
    person_id = db.Column(db.Integer, nullable=False)
    visit_date = db.Column(db.Date, nullable=False)
    visit_time = db.Column(db.Time)
    complaint = db.Column(db.Text, nullable=False)
    diagnosis = db.Column(db.Text)
    treatment = db.Column(db.Text)
    medicines_given = db.Column(db.Text)
    temperature = db.Column(db.Numeric(4, 1))
    blood_pressure = db.Column(db.String(20))
    referred_to_hospital = db.Column(db.Boolean, default=False)
    hospital_name = db.Column(db.String(200))
    parent_notified = db.Column(db.Boolean, default=False)
    notified_at = db.Column(db.DateTime)
    attended_by = db.Column(db.String(100))
    status = db.Column(db.String(20), default='treated')  # treated, referred, under_observation
    discharge_time = db.Column(db.Time)
    follow_up_date = db.Column(db.Date)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'person_type': self.person_type, 'person_id': self.person_id,
            'visit_date': self.visit_date.isoformat() if self.visit_date else None,
            'visit_time': self.visit_time.isoformat() if self.visit_time else None,
            'complaint': self.complaint, 'diagnosis': self.diagnosis,
            'treatment': self.treatment, 'medicines_given': self.medicines_given,
            'temperature': float(self.temperature) if self.temperature else None,
            'blood_pressure': self.blood_pressure,
            'referred_to_hospital': self.referred_to_hospital,
            'hospital_name': self.hospital_name,
            'parent_notified': self.parent_notified,
            'notified_at': self.notified_at.isoformat() if self.notified_at else None,
            'attended_by': self.attended_by, 'status': self.status,
            'discharge_time': self.discharge_time.isoformat() if self.discharge_time else None,
            'follow_up_date': self.follow_up_date.isoformat() if self.follow_up_date else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Incident Report ────────────────────────────────────────────
class IncidentReport(db.Model):
    __tablename__ = 'incident_reports'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    incident_type = db.Column(db.String(50), nullable=False)  # injury, fight, bullying, property_damage, medical, other
    severity = db.Column(db.String(20), default='minor')  # minor, moderate, severe, critical
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    incident_date = db.Column(db.Date, nullable=False)
    incident_time = db.Column(db.Time)
    location = db.Column(db.String(200))
    persons_involved = db.Column(db.Text)  # JSON list of person_type+id
    witnesses = db.Column(db.Text)
    first_aid_given = db.Column(db.Boolean, default=False)
    first_aid_details = db.Column(db.Text)
    parent_notified = db.Column(db.Boolean, default=False)
    police_notified = db.Column(db.Boolean, default=False)
    insurance_claimed = db.Column(db.Boolean, default=False)
    insurance_claim_no = db.Column(db.String(50))
    insurance_amount = db.Column(db.Numeric(12, 2))
    action_taken = db.Column(db.Text)
    reported_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    status = db.Column(db.String(20), default='reported')  # reported, investigating, resolved, closed
    resolution_notes = db.Column(db.Text)
    resolved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'incident_type': self.incident_type, 'severity': self.severity,
            'title': self.title, 'description': self.description,
            'incident_date': self.incident_date.isoformat() if self.incident_date else None,
            'incident_time': self.incident_time.isoformat() if self.incident_time else None,
            'location': self.location,
            'persons_involved': self.persons_involved, 'witnesses': self.witnesses,
            'first_aid_given': self.first_aid_given, 'first_aid_details': self.first_aid_details,
            'parent_notified': self.parent_notified, 'police_notified': self.police_notified,
            'insurance_claimed': self.insurance_claimed,
            'insurance_claim_no': self.insurance_claim_no,
            'insurance_amount': float(self.insurance_amount) if self.insurance_amount else None,
            'action_taken': self.action_taken,
            'reported_by': self.reported_by, 'status': self.status,
            'resolution_notes': self.resolution_notes,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Health Checkup (Annual Health Camp) ─────────────────────────
class HealthCheckup(db.Model):
    __tablename__ = 'health_checkups'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    checkup_name = db.Column(db.String(200), nullable=False)
    checkup_type = db.Column(db.String(50), default='annual')  # annual, dental, eye, bmi, general
    checkup_date = db.Column(db.Date, nullable=False)
    person_type = db.Column(db.String(20), default='student')
    person_id = db.Column(db.Integer, nullable=False)
    height_cm = db.Column(db.Numeric(5, 1))
    weight_kg = db.Column(db.Numeric(5, 1))
    bmi = db.Column(db.Numeric(5, 2))
    vision_left = db.Column(db.String(20))
    vision_right = db.Column(db.String(20))
    dental_status = db.Column(db.String(100))
    hearing_status = db.Column(db.String(100))
    blood_pressure = db.Column(db.String(20))
    hemoglobin = db.Column(db.Numeric(4, 1))
    doctor_name = db.Column(db.String(100))
    findings = db.Column(db.Text)
    recommendations = db.Column(db.Text)
    follow_up_required = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default='completed')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'checkup_name': self.checkup_name, 'checkup_type': self.checkup_type,
            'checkup_date': self.checkup_date.isoformat() if self.checkup_date else None,
            'person_type': self.person_type, 'person_id': self.person_id,
            'height_cm': float(self.height_cm) if self.height_cm else None,
            'weight_kg': float(self.weight_kg) if self.weight_kg else None,
            'bmi': float(self.bmi) if self.bmi else None,
            'vision_left': self.vision_left, 'vision_right': self.vision_right,
            'dental_status': self.dental_status, 'hearing_status': self.hearing_status,
            'blood_pressure': self.blood_pressure,
            'hemoglobin': float(self.hemoglobin) if self.hemoglobin else None,
            'doctor_name': self.doctor_name,
            'findings': self.findings, 'recommendations': self.recommendations,
            'follow_up_required': self.follow_up_required, 'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Visitor Log (eVisitor System) ──────────────────────────────
class VisitorLog(db.Model):
    __tablename__ = 'visitor_logs'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    visitor_name = db.Column(db.String(100), nullable=False)
    visitor_phone = db.Column(db.String(20))
    visitor_email = db.Column(db.String(120))
    visitor_photo_url = db.Column(db.String(255))
    id_type = db.Column(db.String(30))  # aadhar, voter_id, driving_license, passport
    id_number = db.Column(db.String(50))
    purpose = db.Column(db.String(200), nullable=False)
    visiting_person = db.Column(db.String(100))
    visiting_department = db.Column(db.String(100))
    entry_time = db.Column(db.DateTime, nullable=False)
    exit_time = db.Column(db.DateTime)
    badge_number = db.Column(db.String(20))
    vehicle_number = db.Column(db.String(30))
    items_carried = db.Column(db.Text)
    otp_sent = db.Column(db.Boolean, default=False)
    otp_verified = db.Column(db.Boolean, default=False)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    status = db.Column(db.String(20), default='checked_in')  # checked_in, checked_out, denied
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'visitor_name': self.visitor_name, 'visitor_phone': self.visitor_phone,
            'visitor_email': self.visitor_email, 'visitor_photo_url': self.visitor_photo_url,
            'id_type': self.id_type, 'id_number': self.id_number,
            'purpose': self.purpose, 'visiting_person': self.visiting_person,
            'visiting_department': self.visiting_department,
            'entry_time': self.entry_time.isoformat() if self.entry_time else None,
            'exit_time': self.exit_time.isoformat() if self.exit_time else None,
            'badge_number': self.badge_number, 'vehicle_number': self.vehicle_number,
            'items_carried': self.items_carried,
            'otp_sent': self.otp_sent, 'otp_verified': self.otp_verified,
            'approved_by': self.approved_by,
            'status': self.status, 'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Safety Drill ───────────────────────────────────────────────
class SafetyDrill(db.Model):
    __tablename__ = 'safety_drills'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    drill_type = db.Column(db.String(50), nullable=False)  # fire, earthquake, lockdown, evacuation, flood
    drill_name = db.Column(db.String(200), nullable=False)
    scheduled_date = db.Column(db.Date, nullable=False)
    scheduled_time = db.Column(db.Time)
    actual_date = db.Column(db.Date)
    duration_minutes = db.Column(db.Integer)
    evacuation_time_seconds = db.Column(db.Integer)
    participants_count = db.Column(db.Integer)
    assembly_point = db.Column(db.String(200))
    conducted_by = db.Column(db.String(100))
    observations = db.Column(db.Text)
    issues_found = db.Column(db.Text)
    corrective_actions = db.Column(db.Text)
    rating = db.Column(db.Integer)  # 1-5
    status = db.Column(db.String(20), default='scheduled')  # scheduled, completed, cancelled
    next_drill_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'drill_type': self.drill_type, 'drill_name': self.drill_name,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'scheduled_time': self.scheduled_time.isoformat() if self.scheduled_time else None,
            'actual_date': self.actual_date.isoformat() if self.actual_date else None,
            'duration_minutes': self.duration_minutes,
            'evacuation_time_seconds': self.evacuation_time_seconds,
            'participants_count': self.participants_count,
            'assembly_point': self.assembly_point, 'conducted_by': self.conducted_by,
            'observations': self.observations, 'issues_found': self.issues_found,
            'corrective_actions': self.corrective_actions, 'rating': self.rating,
            'status': self.status,
            'next_drill_date': self.next_drill_date.isoformat() if self.next_drill_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Medication Tracking ────────────────────────────────────────
class MedicationTracking(db.Model):
    __tablename__ = 'medication_tracking'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    person_type = db.Column(db.String(20), default='student')
    person_id = db.Column(db.Integer, nullable=False)
    medication_name = db.Column(db.String(200), nullable=False)
    dosage = db.Column(db.String(100))
    frequency = db.Column(db.String(50))  # daily, twice_daily, weekly, as_needed
    timing = db.Column(db.String(100))  # before_meal, after_meal, morning, afternoon
    prescribed_by = db.Column(db.String(100))
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)
    condition = db.Column(db.String(200))
    side_effects = db.Column(db.Text)
    parent_consent = db.Column(db.Boolean, default=False)
    administered_by = db.Column(db.String(100))
    last_administered = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='active')  # active, completed, discontinued
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'person_type': self.person_type, 'person_id': self.person_id,
            'medication_name': self.medication_name, 'dosage': self.dosage,
            'frequency': self.frequency, 'timing': self.timing,
            'prescribed_by': self.prescribed_by,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'condition': self.condition, 'side_effects': self.side_effects,
            'parent_consent': self.parent_consent,
            'administered_by': self.administered_by,
            'last_administered': self.last_administered.isoformat() if self.last_administered else None,
            'status': self.status, 'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Emergency Contact ──────────────────────────────────────────
class EmergencyContact(db.Model):
    __tablename__ = 'emergency_contacts'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    person_type = db.Column(db.String(20), default='student')
    person_id = db.Column(db.Integer, nullable=False)
    contact_name = db.Column(db.String(100), nullable=False)
    relationship = db.Column(db.String(50))
    phone_primary = db.Column(db.String(20), nullable=False)
    phone_secondary = db.Column(db.String(20))
    email = db.Column(db.String(120))
    address = db.Column(db.Text)
    priority = db.Column(db.Integer, default=1)  # 1=highest
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'person_type': self.person_type, 'person_id': self.person_id,
            'contact_name': self.contact_name, 'relationship': self.relationship,
            'phone_primary': self.phone_primary, 'phone_secondary': self.phone_secondary,
            'email': self.email, 'address': self.address,
            'priority': self.priority, 'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Well-being Tracker ─────────────────────────────────────────
class WellbeingRecord(db.Model):
    __tablename__ = 'wellbeing_records'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    record_date = db.Column(db.Date, nullable=False)
    mood = db.Column(db.String(30))  # happy, neutral, sad, anxious, angry
    mood_score = db.Column(db.Integer)  # 1-10
    sleep_hours = db.Column(db.Numeric(3, 1))
    stress_level = db.Column(db.String(20))  # low, medium, high, critical
    notes = db.Column(db.Text)
    counselor_referral = db.Column(db.Boolean, default=False)
    counselor_name = db.Column(db.String(100))
    intervention_type = db.Column(db.String(50))  # counseling, parent_meeting, therapy, monitoring
    intervention_notes = db.Column(db.Text)
    follow_up_date = db.Column(db.Date)
    recorded_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    status = db.Column(db.String(20), default='recorded')  # recorded, referred, in_progress, resolved
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'student_id': self.student_id,
            'record_date': self.record_date.isoformat() if self.record_date else None,
            'mood': self.mood, 'mood_score': self.mood_score,
            'sleep_hours': float(self.sleep_hours) if self.sleep_hours else None,
            'stress_level': self.stress_level, 'notes': self.notes,
            'counselor_referral': self.counselor_referral,
            'counselor_name': self.counselor_name,
            'intervention_type': self.intervention_type,
            'intervention_notes': self.intervention_notes,
            'follow_up_date': self.follow_up_date.isoformat() if self.follow_up_date else None,
            'recorded_by': self.recorded_by, 'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Sanitization Log ───────────────────────────────────────────
class SanitizationLog(db.Model):
    __tablename__ = 'sanitization_logs'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    area_name = db.Column(db.String(200), nullable=False)
    area_type = db.Column(db.String(50))  # classroom, toilet, lab, corridor, canteen, playground
    scheduled_time = db.Column(db.Time)
    actual_time = db.Column(db.Time)
    cleaned_by = db.Column(db.String(100))
    verified_by = db.Column(db.String(100))
    cleaning_date = db.Column(db.Date, nullable=False)
    chemicals_used = db.Column(db.Text)
    rating = db.Column(db.Integer)  # 1-5
    photo_url = db.Column(db.String(255))
    status = db.Column(db.String(20), default='completed')  # pending, completed, missed
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'area_name': self.area_name, 'area_type': self.area_type,
            'scheduled_time': self.scheduled_time.isoformat() if self.scheduled_time else None,
            'actual_time': self.actual_time.isoformat() if self.actual_time else None,
            'cleaned_by': self.cleaned_by, 'verified_by': self.verified_by,
            'cleaning_date': self.cleaning_date.isoformat() if self.cleaning_date else None,
            'chemicals_used': self.chemicals_used, 'rating': self.rating,
            'photo_url': self.photo_url, 'status': self.status, 'remarks': self.remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Temperature Screening ──────────────────────────────────────
class TemperatureScreen(db.Model):
    __tablename__ = 'temperature_screens'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    person_type = db.Column(db.String(20), default='student')
    person_id = db.Column(db.Integer, nullable=False)
    screen_date = db.Column(db.Date, nullable=False)
    screen_time = db.Column(db.Time)
    temperature = db.Column(db.Numeric(4, 1), nullable=False)
    is_fever = db.Column(db.Boolean, default=False)
    symptoms = db.Column(db.Text)
    action_taken = db.Column(db.String(100))  # allowed, sent_home, infirmary, isolated
    screened_by = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'person_type': self.person_type, 'person_id': self.person_id,
            'screen_date': self.screen_date.isoformat() if self.screen_date else None,
            'screen_time': self.screen_time.isoformat() if self.screen_time else None,
            'temperature': float(self.temperature) if self.temperature else None,
            'is_fever': self.is_fever, 'symptoms': self.symptoms,
            'action_taken': self.action_taken, 'screened_by': self.screened_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
