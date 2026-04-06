from flask import Blueprint, request, g
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.health import (
    HealthRecord, InfirmaryVisit, IncidentReport, HealthCheckup,
    VisitorLog, SafetyDrill, MedicationTracking, EmergencyContact,
    WellbeingRecord, SanitizationLog, TemperatureScreen
)
from app.models.user import User
from app.utils.helpers import success_response, error_response, paginate
from app.utils.decorators import school_required
from datetime import datetime, date

health_bp = Blueprint('health', __name__)


@health_bp.before_request
@jwt_required()
def before_request():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return error_response('User not found', 401)
    g.current_user = user
    g.school_id = user.school_id


# ── Dashboard ───────────────────────────────────────────────────
@health_bp.route('/dashboard', methods=['GET'])
@school_required
def dashboard():
    sid = g.school_id
    today = date.today()
    data = {
        'total_health_records': HealthRecord.query.filter_by(school_id=sid).count(),
        'infirmary_today': InfirmaryVisit.query.filter_by(school_id=sid, visit_date=today).count(),
        'open_incidents': IncidentReport.query.filter(IncidentReport.school_id == sid, IncidentReport.status.in_(['reported', 'investigating'])).count(),
        'active_medications': MedicationTracking.query.filter_by(school_id=sid, status='active').count(),
        'visitors_today': VisitorLog.query.filter(VisitorLog.school_id == sid, db.func.date(VisitorLog.entry_time) == today).count(),
        'visitors_in': VisitorLog.query.filter_by(school_id=sid, status='checked_in').count(),
        'upcoming_drills': SafetyDrill.query.filter(SafetyDrill.school_id == sid, SafetyDrill.status == 'scheduled', SafetyDrill.scheduled_date >= today).count(),
        'checkups_this_month': HealthCheckup.query.filter(HealthCheckup.school_id == sid, db.extract('month', HealthCheckup.checkup_date) == today.month, db.extract('year', HealthCheckup.checkup_date) == today.year).count(),
        'wellbeing_alerts': WellbeingRecord.query.filter(WellbeingRecord.school_id == sid, WellbeingRecord.status.in_(['referred', 'in_progress'])).count(),
        'fever_today': TemperatureScreen.query.filter_by(school_id=sid, screen_date=today, is_fever=True).count(),
        'sanitization_today': SanitizationLog.query.filter_by(school_id=sid, cleaning_date=today).count(),
        'emergency_contacts': EmergencyContact.query.filter_by(school_id=sid, is_active=True).count(),
    }
    return success_response(data)


# ── Health Records (Digital Health Card) ────────────────────────
@health_bp.route('/records', methods=['GET'])
@school_required
def list_records():
    q = HealthRecord.query.filter_by(school_id=g.school_id)
    pt = request.args.get('person_type')
    if pt:
        q = q.filter_by(person_type=pt)
    q = q.order_by(HealthRecord.created_at.desc())
    return success_response(paginate(q))


@health_bp.route('/records', methods=['POST'])
@school_required
def create_record():
    d = request.get_json()
    rec = HealthRecord(school_id=g.school_id, **{k: d.get(k) for k in [
        'person_type', 'person_id', 'blood_group', 'height_cm', 'weight_kg', 'bmi',
        'allergies', 'chronic_conditions', 'vaccinations', 'disabilities',
        'vision_left', 'vision_right', 'dental_status',
        'doctor_name', 'doctor_phone', 'insurance_provider', 'insurance_policy_no', 'notes'
    ] if d.get(k) is not None})
    if d.get('insurance_expiry'):
        rec.insurance_expiry = d['insurance_expiry']
    db.session.add(rec)
    db.session.commit()
    return success_response(rec.to_dict(), 'Health record created', 201)


@health_bp.route('/records/<int:id>', methods=['PUT'])
@school_required
def update_record(id):
    rec = HealthRecord.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    d = request.get_json()
    for k in ['person_type', 'person_id', 'blood_group', 'height_cm', 'weight_kg', 'bmi',
              'allergies', 'chronic_conditions', 'vaccinations', 'disabilities',
              'vision_left', 'vision_right', 'dental_status',
              'doctor_name', 'doctor_phone', 'insurance_provider', 'insurance_policy_no',
              'insurance_expiry', 'notes']:
        if k in d:
            setattr(rec, k, d[k])
    db.session.commit()
    return success_response(rec.to_dict(), 'Health record updated')


@health_bp.route('/records/<int:id>', methods=['DELETE'])
@school_required
def delete_record(id):
    rec = HealthRecord.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(rec)
    db.session.commit()
    return success_response(message='Health record deleted')


# ── Infirmary Visits ───────────────────────────────────────────
@health_bp.route('/infirmary', methods=['GET'])
@school_required
def list_infirmary():
    q = InfirmaryVisit.query.filter_by(school_id=g.school_id)
    dt = request.args.get('date')
    if dt:
        q = q.filter_by(visit_date=dt)
    status = request.args.get('status')
    if status:
        q = q.filter_by(status=status)
    q = q.order_by(InfirmaryVisit.created_at.desc())
    return success_response(paginate(q))


@health_bp.route('/infirmary', methods=['POST'])
@school_required
def create_infirmary():
    d = request.get_json()
    v = InfirmaryVisit(school_id=g.school_id)
    for k in ['person_type', 'person_id', 'visit_date', 'complaint', 'diagnosis',
              'treatment', 'medicines_given', 'temperature', 'blood_pressure',
              'referred_to_hospital', 'hospital_name', 'parent_notified',
              'attended_by', 'status', 'follow_up_date', 'notes']:
        if d.get(k) is not None:
            setattr(v, k, d[k])
    if d.get('visit_time'):
        v.visit_time = d['visit_time']
    if d.get('parent_notified'):
        v.notified_at = datetime.utcnow()
    db.session.add(v)
    db.session.commit()
    return success_response(v.to_dict(), 'Infirmary visit recorded', 201)


@health_bp.route('/infirmary/<int:id>', methods=['PUT'])
@school_required
def update_infirmary(id):
    v = InfirmaryVisit.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    d = request.get_json()
    for k in ['diagnosis', 'treatment', 'medicines_given', 'temperature', 'blood_pressure',
              'referred_to_hospital', 'hospital_name', 'parent_notified',
              'attended_by', 'status', 'follow_up_date', 'notes', 'discharge_time']:
        if k in d:
            setattr(v, k, d[k])
    if d.get('parent_notified') and not v.notified_at:
        v.notified_at = datetime.utcnow()
    db.session.commit()
    return success_response(v.to_dict(), 'Infirmary visit updated')


# ── Incident Reports ──────────────────────────────────────────
@health_bp.route('/incidents', methods=['GET'])
@school_required
def list_incidents():
    q = IncidentReport.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        q = q.filter_by(status=status)
    sev = request.args.get('severity')
    if sev:
        q = q.filter_by(severity=sev)
    q = q.order_by(IncidentReport.created_at.desc())
    return success_response(paginate(q))


@health_bp.route('/incidents', methods=['POST'])
@school_required
def create_incident():
    d = request.get_json()
    inc = IncidentReport(school_id=g.school_id, reported_by=g.current_user.id)
    for k in ['incident_type', 'severity', 'title', 'description', 'incident_date', 'incident_time',
              'location', 'persons_involved', 'witnesses', 'first_aid_given', 'first_aid_details',
              'parent_notified', 'police_notified', 'action_taken', 'status']:
        if d.get(k) is not None:
            setattr(inc, k, d[k])
    db.session.add(inc)
    db.session.commit()
    return success_response(inc.to_dict(), 'Incident reported', 201)


@health_bp.route('/incidents/<int:id>', methods=['PUT'])
@school_required
def update_incident(id):
    inc = IncidentReport.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    d = request.get_json()
    for k in ['severity', 'description', 'action_taken', 'status', 'resolution_notes',
              'insurance_claimed', 'insurance_claim_no', 'insurance_amount',
              'parent_notified', 'police_notified']:
        if k in d:
            setattr(inc, k, d[k])
    if d.get('status') == 'resolved' and not inc.resolved_at:
        inc.resolved_at = datetime.utcnow()
    db.session.commit()
    return success_response(inc.to_dict(), 'Incident updated')


# ── Health Checkups ────────────────────────────────────────────
@health_bp.route('/checkups', methods=['GET'])
@school_required
def list_checkups():
    q = HealthCheckup.query.filter_by(school_id=g.school_id)
    ct = request.args.get('checkup_type')
    if ct:
        q = q.filter_by(checkup_type=ct)
    q = q.order_by(HealthCheckup.checkup_date.desc())
    return success_response(paginate(q))


@health_bp.route('/checkups', methods=['POST'])
@school_required
def create_checkup():
    d = request.get_json()
    c = HealthCheckup(school_id=g.school_id)
    for k in ['checkup_name', 'checkup_type', 'checkup_date', 'person_type', 'person_id',
              'height_cm', 'weight_kg', 'bmi', 'vision_left', 'vision_right',
              'dental_status', 'hearing_status', 'blood_pressure', 'hemoglobin',
              'doctor_name', 'findings', 'recommendations', 'follow_up_required', 'status']:
        if d.get(k) is not None:
            setattr(c, k, d[k])
    db.session.add(c)
    db.session.commit()
    return success_response(c.to_dict(), 'Health checkup recorded', 201)


@health_bp.route('/checkups/<int:id>', methods=['PUT'])
@school_required
def update_checkup(id):
    c = HealthCheckup.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    d = request.get_json()
    for k in ['findings', 'recommendations', 'follow_up_required', 'status',
              'height_cm', 'weight_kg', 'bmi', 'vision_left', 'vision_right',
              'dental_status', 'hearing_status', 'blood_pressure', 'hemoglobin', 'doctor_name']:
        if k in d:
            setattr(c, k, d[k])
    db.session.commit()
    return success_response(c.to_dict(), 'Checkup updated')


# ── Visitor Logs ───────────────────────────────────────────────
@health_bp.route('/visitors', methods=['GET'])
@school_required
def list_visitors():
    q = VisitorLog.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        q = q.filter_by(status=status)
    dt = request.args.get('date')
    if dt:
        q = q.filter(db.func.date(VisitorLog.entry_time) == dt)
    q = q.order_by(VisitorLog.created_at.desc())
    return success_response(paginate(q))


@health_bp.route('/visitors', methods=['POST'])
@school_required
def create_visitor():
    d = request.get_json()
    v = VisitorLog(school_id=g.school_id)
    for k in ['visitor_name', 'visitor_phone', 'visitor_email', 'visitor_photo_url',
              'id_type', 'id_number', 'purpose', 'visiting_person', 'visiting_department',
              'badge_number', 'vehicle_number', 'items_carried', 'remarks']:
        if d.get(k) is not None:
            setattr(v, k, d[k])
    v.entry_time = datetime.utcnow()
    v.status = 'checked_in'
    db.session.add(v)
    db.session.commit()
    return success_response(v.to_dict(), 'Visitor checked in', 201)


@health_bp.route('/visitors/<int:id>', methods=['PUT'])
@school_required
def update_visitor(id):
    v = VisitorLog.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    d = request.get_json()
    for k in ['remarks', 'status']:
        if k in d:
            setattr(v, k, d[k])
    if d.get('status') == 'checked_out' and not v.exit_time:
        v.exit_time = datetime.utcnow()
    db.session.commit()
    return success_response(v.to_dict(), 'Visitor updated')


@health_bp.route('/visitors/<int:id>/checkout', methods=['POST'])
@school_required
def checkout_visitor(id):
    v = VisitorLog.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    v.exit_time = datetime.utcnow()
    v.status = 'checked_out'
    db.session.commit()
    return success_response(v.to_dict(), 'Visitor checked out')


# ── Safety Drills ──────────────────────────────────────────────
@health_bp.route('/drills', methods=['GET'])
@school_required
def list_drills():
    q = SafetyDrill.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        q = q.filter_by(status=status)
    q = q.order_by(SafetyDrill.scheduled_date.desc())
    return success_response(paginate(q))


@health_bp.route('/drills', methods=['POST'])
@school_required
def create_drill():
    d = request.get_json()
    dr = SafetyDrill(school_id=g.school_id)
    for k in ['drill_type', 'drill_name', 'scheduled_date', 'scheduled_time',
              'assembly_point', 'conducted_by', 'status', 'next_drill_date']:
        if d.get(k) is not None:
            setattr(dr, k, d[k])
    db.session.add(dr)
    db.session.commit()
    return success_response(dr.to_dict(), 'Safety drill scheduled', 201)


@health_bp.route('/drills/<int:id>', methods=['PUT'])
@school_required
def update_drill(id):
    dr = SafetyDrill.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    d = request.get_json()
    for k in ['actual_date', 'duration_minutes', 'evacuation_time_seconds',
              'participants_count', 'observations', 'issues_found', 'corrective_actions',
              'rating', 'status', 'next_drill_date', 'conducted_by']:
        if k in d:
            setattr(dr, k, d[k])
    db.session.commit()
    return success_response(dr.to_dict(), 'Drill updated')


# ── Medication Tracking ────────────────────────────────────────
@health_bp.route('/medications', methods=['GET'])
@school_required
def list_medications():
    q = MedicationTracking.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        q = q.filter_by(status=status)
    q = q.order_by(MedicationTracking.created_at.desc())
    return success_response(paginate(q))


@health_bp.route('/medications', methods=['POST'])
@school_required
def create_medication():
    d = request.get_json()
    m = MedicationTracking(school_id=g.school_id)
    for k in ['person_type', 'person_id', 'medication_name', 'dosage', 'frequency',
              'timing', 'prescribed_by', 'start_date', 'end_date', 'condition',
              'side_effects', 'parent_consent', 'administered_by', 'status', 'notes']:
        if d.get(k) is not None:
            setattr(m, k, d[k])
    db.session.add(m)
    db.session.commit()
    return success_response(m.to_dict(), 'Medication tracking added', 201)


@health_bp.route('/medications/<int:id>', methods=['PUT'])
@school_required
def update_medication(id):
    m = MedicationTracking.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    d = request.get_json()
    for k in ['dosage', 'frequency', 'timing', 'end_date', 'status', 'notes',
              'administered_by', 'parent_consent']:
        if k in d:
            setattr(m, k, d[k])
    if d.get('administer'):
        m.last_administered = datetime.utcnow()
    db.session.commit()
    return success_response(m.to_dict(), 'Medication updated')


# ── Emergency Contacts ─────────────────────────────────────────
@health_bp.route('/emergency-contacts', methods=['GET'])
@school_required
def list_emergency():
    q = EmergencyContact.query.filter_by(school_id=g.school_id)
    pt = request.args.get('person_type')
    pid = request.args.get('person_id')
    if pt:
        q = q.filter_by(person_type=pt)
    if pid:
        q = q.filter_by(person_id=pid)
    q = q.order_by(EmergencyContact.priority)
    return success_response(paginate(q))


@health_bp.route('/emergency-contacts', methods=['POST'])
@school_required
def create_emergency():
    d = request.get_json()
    ec = EmergencyContact(school_id=g.school_id)
    for k in ['person_type', 'person_id', 'contact_name', 'relationship',
              'phone_primary', 'phone_secondary', 'email', 'address', 'priority']:
        if d.get(k) is not None:
            setattr(ec, k, d[k])
    db.session.add(ec)
    db.session.commit()
    return success_response(ec.to_dict(), 'Emergency contact added', 201)


@health_bp.route('/emergency-contacts/<int:id>', methods=['PUT'])
@school_required
def update_emergency(id):
    ec = EmergencyContact.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    d = request.get_json()
    for k in ['contact_name', 'relationship', 'phone_primary', 'phone_secondary',
              'email', 'address', 'priority', 'is_active']:
        if k in d:
            setattr(ec, k, d[k])
    db.session.commit()
    return success_response(ec.to_dict(), 'Contact updated')


@health_bp.route('/emergency-contacts/<int:id>', methods=['DELETE'])
@school_required
def delete_emergency(id):
    ec = EmergencyContact.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(ec)
    db.session.commit()
    return success_response(message='Contact deleted')


# ── Wellbeing Tracker ──────────────────────────────────────────
@health_bp.route('/wellbeing', methods=['GET'])
@school_required
def list_wellbeing():
    q = WellbeingRecord.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        q = q.filter_by(status=status)
    sid = request.args.get('student_id')
    if sid:
        q = q.filter_by(student_id=sid)
    q = q.order_by(WellbeingRecord.record_date.desc())
    return success_response(paginate(q))


@health_bp.route('/wellbeing', methods=['POST'])
@school_required
def create_wellbeing():
    d = request.get_json()
    w = WellbeingRecord(school_id=g.school_id, recorded_by=g.current_user.id)
    for k in ['student_id', 'record_date', 'mood', 'mood_score', 'sleep_hours',
              'stress_level', 'notes', 'counselor_referral', 'counselor_name',
              'intervention_type', 'intervention_notes', 'follow_up_date', 'status']:
        if d.get(k) is not None:
            setattr(w, k, d[k])
    db.session.add(w)
    db.session.commit()
    return success_response(w.to_dict(), 'Wellbeing record created', 201)


@health_bp.route('/wellbeing/<int:id>', methods=['PUT'])
@school_required
def update_wellbeing(id):
    w = WellbeingRecord.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    d = request.get_json()
    for k in ['mood', 'mood_score', 'stress_level', 'notes', 'counselor_referral',
              'counselor_name', 'intervention_type', 'intervention_notes',
              'follow_up_date', 'status']:
        if k in d:
            setattr(w, k, d[k])
    db.session.commit()
    return success_response(w.to_dict(), 'Wellbeing record updated')


# ── Sanitization Logs ──────────────────────────────────────────
@health_bp.route('/sanitization', methods=['GET'])
@school_required
def list_sanitization():
    q = SanitizationLog.query.filter_by(school_id=g.school_id)
    dt = request.args.get('date')
    if dt:
        q = q.filter_by(cleaning_date=dt)
    area = request.args.get('area_type')
    if area:
        q = q.filter_by(area_type=area)
    q = q.order_by(SanitizationLog.cleaning_date.desc())
    return success_response(paginate(q))


@health_bp.route('/sanitization', methods=['POST'])
@school_required
def create_sanitization():
    d = request.get_json()
    s = SanitizationLog(school_id=g.school_id)
    for k in ['area_name', 'area_type', 'scheduled_time', 'actual_time',
              'cleaned_by', 'verified_by', 'cleaning_date', 'chemicals_used',
              'rating', 'photo_url', 'status', 'remarks']:
        if d.get(k) is not None:
            setattr(s, k, d[k])
    db.session.add(s)
    db.session.commit()
    return success_response(s.to_dict(), 'Sanitization log created', 201)


@health_bp.route('/sanitization/<int:id>', methods=['PUT'])
@school_required
def update_sanitization(id):
    s = SanitizationLog.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    d = request.get_json()
    for k in ['actual_time', 'cleaned_by', 'verified_by', 'chemicals_used',
              'rating', 'photo_url', 'status', 'remarks']:
        if k in d:
            setattr(s, k, d[k])
    db.session.commit()
    return success_response(s.to_dict(), 'Sanitization log updated')


# ── Temperature Screening ──────────────────────────────────────
@health_bp.route('/temperature', methods=['GET'])
@school_required
def list_temperature():
    q = TemperatureScreen.query.filter_by(school_id=g.school_id)
    dt = request.args.get('date')
    if dt:
        q = q.filter_by(screen_date=dt)
    fever = request.args.get('fever_only')
    if fever == 'true':
        q = q.filter_by(is_fever=True)
    q = q.order_by(TemperatureScreen.created_at.desc())
    return success_response(paginate(q))


@health_bp.route('/temperature', methods=['POST'])
@school_required
def create_temperature():
    d = request.get_json()
    t = TemperatureScreen(school_id=g.school_id)
    for k in ['person_type', 'person_id', 'screen_date', 'screen_time',
              'temperature', 'symptoms', 'action_taken', 'screened_by']:
        if d.get(k) is not None:
            setattr(t, k, d[k])
    if t.temperature and float(t.temperature) >= 99.5:
        t.is_fever = True
    db.session.add(t)
    db.session.commit()
    return success_response(t.to_dict(), 'Temperature recorded', 201)
