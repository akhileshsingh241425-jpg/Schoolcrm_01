from flask import Blueprint, request, g
from datetime import datetime, timedelta
from sqlalchemy import func
from app import db
from app.models.parent import (
    ParentProfile, PTMSlot, PTMBooking, FeedbackSurvey, FeedbackResponse,
    Grievance, ConsentForm, ConsentResponse, ParentNotification, ParentMessage,
    DailyActivity, VolunteerRegistration, PickupAuthorization
)
from app.models.student import Student, ParentDetail, Section
from app.models.attendance import StudentAttendance
from app.models.fee import FeeInstallment, FeePayment
from app.models.academic import ExamResult, ReportCard, Homework, Timetable
from app.models.staff import Staff
from app.utils.decorators import school_required, role_required
from app.utils.helpers import success_response, error_response, paginate
from sqlalchemy.orm import joinedload

parent_bp = Blueprint('parent', __name__)


# ============ PARENT PROFILES ============
@parent_bp.route('/profiles', methods=['GET'])
@school_required
def list_profiles():
    query = ParentProfile.query.filter_by(school_id=g.school_id)
    search = request.args.get('search', '')
    if search:
        query = query.filter(ParentProfile.name.ilike(f'%{search}%'))
    query = query.order_by(ParentProfile.name)
    return success_response(paginate(query))


@parent_bp.route('/profiles', methods=['POST'])
@role_required('school_admin', 'teacher')
def create_profile():
    data = request.get_json()
    profile = ParentProfile(
        school_id=g.school_id,
        user_id=data.get('user_id'),
        parent_detail_id=data.get('parent_detail_id'),
        name=data['name'],
        phone=data.get('phone'),
        email=data.get('email'),
        address=data.get('address'),
        occupation=data.get('occupation'),
        preferred_language=data.get('preferred_language', 'English'),
    )
    db.session.add(profile)
    db.session.commit()
    return success_response(profile.to_dict(), 'Parent profile created', 201)


@parent_bp.route('/profiles/<int:profile_id>', methods=['GET'])
@school_required
def get_profile(profile_id):
    profile = ParentProfile.query.filter_by(id=profile_id, school_id=g.school_id).first_or_404()
    data = profile.to_dict()
    # Get linked students via parent_details
    if profile.parent_detail_id:
        pd = ParentDetail.query.get(profile.parent_detail_id)
        if pd and pd.student_id:
            student = Student.query.get(pd.student_id)
            if student:
                data['students'] = [student.to_dict()]
    return success_response(data)


@parent_bp.route('/profiles/<int:profile_id>', methods=['PUT'])
@role_required('school_admin', 'teacher')
def update_profile(profile_id):
    profile = ParentProfile.query.filter_by(id=profile_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for field in ['name', 'phone', 'email', 'address', 'occupation', 'preferred_language', 'photo_url']:
        if field in data:
            setattr(profile, field, data[field])
    db.session.commit()
    return success_response(profile.to_dict(), 'Profile updated')


@parent_bp.route('/profiles/<int:profile_id>', methods=['DELETE'])
@role_required('school_admin')
def delete_profile(profile_id):
    profile = ParentProfile.query.filter_by(id=profile_id, school_id=g.school_id).first_or_404()
    db.session.delete(profile)
    db.session.commit()
    return success_response(message='Profile deleted')


# ============ DASHBOARD / OVERVIEW ============
@parent_bp.route('/dashboard', methods=['GET'])
@school_required
def parent_dashboard():
    total_profiles = ParentProfile.query.filter_by(school_id=g.school_id).count()
    active_ptm = PTMSlot.query.filter_by(school_id=g.school_id, status='active').count()
    open_grievances = Grievance.query.filter_by(school_id=g.school_id).filter(
        Grievance.status.in_(['open', 'in_progress'])
    ).count()
    active_surveys = FeedbackSurvey.query.filter_by(school_id=g.school_id, is_active=True).count()
    pending_consents = ConsentForm.query.filter_by(school_id=g.school_id, is_active=True).count()
    total_messages = ParentMessage.query.filter_by(school_id=g.school_id).count()
    unread_messages = ParentMessage.query.filter_by(school_id=g.school_id, is_read=False).count()
    recent_activities = DailyActivity.query.filter_by(school_id=g.school_id).order_by(
        DailyActivity.created_at.desc()
    ).limit(5).all()

    return success_response({
        'total_profiles': total_profiles,
        'active_ptm_slots': active_ptm,
        'open_grievances': open_grievances,
        'active_surveys': active_surveys,
        'pending_consents': pending_consents,
        'total_messages': total_messages,
        'unread_messages': unread_messages,
        'recent_activities': [a.to_dict() for a in recent_activities],
    })


# ============ PTM SLOTS ============
@parent_bp.route('/ptm/slots', methods=['GET'])
@school_required
def list_ptm_slots():
    query = PTMSlot.query.options(
        joinedload(PTMSlot.teacher)
    ).filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(PTMSlot.ptm_date.desc())
    return success_response(paginate(query))


@parent_bp.route('/ptm/slots', methods=['POST'])
@role_required('school_admin', 'teacher')
def create_ptm_slot():
    data = request.get_json()
    slot = PTMSlot(
        school_id=g.school_id,
        title=data['title'],
        ptm_date=data['ptm_date'],
        start_time=data['start_time'],
        end_time=data['end_time'],
        slot_duration=data.get('slot_duration', 15),
        teacher_id=data.get('teacher_id'),
        class_id=data.get('class_id'),
        max_bookings=data.get('max_bookings', 1),
        status=data.get('status', 'active'),
        created_by=g.current_user.id
    )
    db.session.add(slot)
    db.session.commit()
    return success_response(slot.to_dict(), 'PTM slot created', 201)


@parent_bp.route('/ptm/slots/<int:slot_id>', methods=['PUT'])
@role_required('school_admin', 'teacher')
def update_ptm_slot(slot_id):
    slot = PTMSlot.query.filter_by(id=slot_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for field in ['title', 'ptm_date', 'start_time', 'end_time', 'slot_duration', 'teacher_id', 'class_id', 'max_bookings', 'status']:
        if field in data:
            setattr(slot, field, data[field])
    db.session.commit()
    return success_response(slot.to_dict(), 'PTM slot updated')


@parent_bp.route('/ptm/slots/<int:slot_id>', methods=['DELETE'])
@role_required('school_admin')
def delete_ptm_slot(slot_id):
    slot = PTMSlot.query.filter_by(id=slot_id, school_id=g.school_id).first_or_404()
    db.session.delete(slot)
    db.session.commit()
    return success_response(message='PTM slot deleted')


# ============ PTM BOOKINGS ============
@parent_bp.route('/ptm/bookings', methods=['GET'])
@school_required
def list_ptm_bookings():
    query = PTMBooking.query.options(
        joinedload(PTMBooking.slot)
    ).filter_by(school_id=g.school_id)
    slot_id = request.args.get('slot_id')
    if slot_id:
        query = query.filter_by(slot_id=slot_id)
    query = query.order_by(PTMBooking.created_at.desc())
    return success_response(paginate(query))


@parent_bp.route('/ptm/bookings', methods=['POST'])
@school_required
def create_ptm_booking():
    data = request.get_json()
    # Check if slot has capacity
    slot = PTMSlot.query.filter_by(id=data['slot_id'], school_id=g.school_id).first_or_404()
    current_bookings = PTMBooking.query.filter_by(slot_id=slot.id, status='booked').count()
    if current_bookings >= slot.max_bookings:
        return error_response('Slot is fully booked', 400)

    booking = PTMBooking(
        school_id=g.school_id,
        slot_id=data['slot_id'],
        parent_id=data.get('parent_id'),
        student_id=data.get('student_id'),
        booking_time=data.get('booking_time'),
        notes=data.get('notes'),
        status='booked'
    )
    db.session.add(booking)
    db.session.commit()
    return success_response(booking.to_dict(), 'PTM booked successfully', 201)


@parent_bp.route('/ptm/bookings/<int:booking_id>', methods=['PUT'])
@school_required
def update_ptm_booking(booking_id):
    booking = PTMBooking.query.filter_by(id=booking_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for field in ['status', 'notes', 'feedback', 'rating']:
        if field in data:
            setattr(booking, field, data[field])
    db.session.commit()
    return success_response(booking.to_dict(), 'Booking updated')


# ============ FEEDBACK SURVEYS ============
@parent_bp.route('/surveys', methods=['GET'])
@school_required
def list_surveys():
    query = FeedbackSurvey.query.filter_by(school_id=g.school_id)
    active_only = request.args.get('active')
    if active_only:
        query = query.filter_by(is_active=True)
    query = query.order_by(FeedbackSurvey.created_at.desc())
    return success_response(paginate(query))


@parent_bp.route('/surveys', methods=['POST'])
@role_required('school_admin', 'teacher')
def create_survey():
    data = request.get_json()
    survey = FeedbackSurvey(
        school_id=g.school_id,
        title=data['title'],
        description=data.get('description'),
        survey_type=data.get('survey_type', 'general'),
        target_audience=data.get('target_audience', 'parents'),
        questions=data.get('questions', []),
        is_anonymous=data.get('is_anonymous', False),
        is_active=data.get('is_active', True),
        start_date=data.get('start_date'),
        end_date=data.get('end_date'),
        created_by=g.current_user.id
    )
    db.session.add(survey)
    db.session.commit()
    return success_response(survey.to_dict(), 'Survey created', 201)


@parent_bp.route('/surveys/<int:survey_id>', methods=['PUT'])
@role_required('school_admin', 'teacher')
def update_survey(survey_id):
    survey = FeedbackSurvey.query.filter_by(id=survey_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for field in ['title', 'description', 'survey_type', 'target_audience', 'questions', 'is_anonymous', 'is_active', 'start_date', 'end_date']:
        if field in data:
            setattr(survey, field, data[field])
    db.session.commit()
    return success_response(survey.to_dict(), 'Survey updated')


@parent_bp.route('/surveys/<int:survey_id>', methods=['DELETE'])
@role_required('school_admin')
def delete_survey(survey_id):
    survey = FeedbackSurvey.query.filter_by(id=survey_id, school_id=g.school_id).first_or_404()
    db.session.delete(survey)
    db.session.commit()
    return success_response(message='Survey deleted')


# ============ FEEDBACK RESPONSES ============
@parent_bp.route('/surveys/<int:survey_id>/responses', methods=['GET'])
@school_required
def list_survey_responses(survey_id):
    query = FeedbackResponse.query.options(
        joinedload(FeedbackResponse.survey)
    ).filter_by(school_id=g.school_id, survey_id=survey_id)
    query = query.order_by(FeedbackResponse.submitted_at.desc())
    return success_response(paginate(query))


@parent_bp.route('/surveys/<int:survey_id>/responses', methods=['POST'])
@school_required
def submit_survey_response(survey_id):
    data = request.get_json()
    response = FeedbackResponse(
        school_id=g.school_id,
        survey_id=survey_id,
        parent_id=data.get('parent_id'),
        student_id=data.get('student_id'),
        responses=data.get('responses', {}),
        rating=data.get('rating'),
        comments=data.get('comments')
    )
    db.session.add(response)
    db.session.commit()
    return success_response(response.to_dict(), 'Response submitted', 201)


# ============ GRIEVANCES ============
@parent_bp.route('/grievances', methods=['GET'])
@school_required
def list_grievances():
    query = Grievance.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    category = request.args.get('category')
    priority = request.args.get('priority')
    if status:
        query = query.filter_by(status=status)
    if category:
        query = query.filter_by(category=category)
    if priority:
        query = query.filter_by(priority=priority)
    query = query.order_by(Grievance.created_at.desc())
    return success_response(paginate(query))


@parent_bp.route('/grievances', methods=['POST'])
@school_required
def create_grievance():
    data = request.get_json()
    # Generate ticket number
    count = Grievance.query.filter_by(school_id=g.school_id).count()
    ticket_no = f"GRV-{g.school_id}-{count + 1:04d}"

    grievance = Grievance(
        school_id=g.school_id,
        ticket_no=ticket_no,
        parent_id=data.get('parent_id'),
        student_id=data.get('student_id'),
        category=data.get('category', 'general'),
        subject=data['subject'],
        description=data['description'],
        priority=data.get('priority', 'medium'),
        status='open',
        created_by=g.current_user.id
    )
    db.session.add(grievance)
    db.session.commit()
    return success_response(grievance.to_dict(), 'Grievance submitted', 201)


@parent_bp.route('/grievances/<int:grievance_id>', methods=['GET'])
@school_required
def get_grievance(grievance_id):
    grievance = Grievance.query.filter_by(id=grievance_id, school_id=g.school_id).first_or_404()
    return success_response(grievance.to_dict())


@parent_bp.route('/grievances/<int:grievance_id>', methods=['PUT'])
@role_required('school_admin', 'teacher')
def update_grievance(grievance_id):
    grievance = Grievance.query.filter_by(id=grievance_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for field in ['category', 'subject', 'description', 'priority', 'status', 'assigned_to', 'resolution']:
        if field in data:
            setattr(grievance, field, data[field])
    if data.get('status') == 'resolved' and not grievance.resolved_at:
        grievance.resolved_at = datetime.utcnow()
        grievance.resolved_by = g.current_user.id
    db.session.commit()
    return success_response(grievance.to_dict(), 'Grievance updated')


# ============ CONSENT FORMS ============
@parent_bp.route('/consent', methods=['GET'])
@school_required
def list_consent_forms():
    query = ConsentForm.query.filter_by(school_id=g.school_id)
    active = request.args.get('active')
    if active:
        query = query.filter_by(is_active=True)
    query = query.order_by(ConsentForm.created_at.desc())
    return success_response(paginate(query))


@parent_bp.route('/consent', methods=['POST'])
@role_required('school_admin', 'teacher')
def create_consent_form():
    data = request.get_json()
    form = ConsentForm(
        school_id=g.school_id,
        title=data['title'],
        description=data.get('description'),
        consent_type=data.get('consent_type', 'general'),
        class_id=data.get('class_id'),
        deadline=data.get('deadline'),
        is_mandatory=data.get('is_mandatory', False),
        is_active=data.get('is_active', True),
        created_by=g.current_user.id
    )
    db.session.add(form)
    db.session.commit()
    return success_response(form.to_dict(), 'Consent form created', 201)


@parent_bp.route('/consent/<int:form_id>', methods=['PUT'])
@role_required('school_admin', 'teacher')
def update_consent_form(form_id):
    form = ConsentForm.query.filter_by(id=form_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for field in ['title', 'description', 'consent_type', 'class_id', 'deadline', 'is_mandatory', 'is_active']:
        if field in data:
            setattr(form, field, data[field])
    db.session.commit()
    return success_response(form.to_dict(), 'Consent form updated')


@parent_bp.route('/consent/<int:form_id>', methods=['DELETE'])
@role_required('school_admin')
def delete_consent_form(form_id):
    form = ConsentForm.query.filter_by(id=form_id, school_id=g.school_id).first_or_404()
    db.session.delete(form)
    db.session.commit()
    return success_response(message='Consent form deleted')


@parent_bp.route('/consent/<int:form_id>/responses', methods=['GET'])
@school_required
def list_consent_responses(form_id):
    query = ConsentResponse.query.filter_by(school_id=g.school_id, consent_form_id=form_id)
    return success_response(paginate(query))


@parent_bp.route('/consent/<int:form_id>/responses', methods=['POST'])
@school_required
def submit_consent_response(form_id):
    data = request.get_json()
    resp = ConsentResponse(
        school_id=g.school_id,
        consent_form_id=form_id,
        parent_id=data.get('parent_id'),
        student_id=data.get('student_id'),
        response=data.get('response', 'accepted'),
        remarks=data.get('remarks'),
        responded_at=datetime.utcnow()
    )
    db.session.add(resp)
    db.session.commit()
    return success_response(resp.to_dict(), 'Consent response submitted', 201)


# ============ PARENT MESSAGES ============
@parent_bp.route('/messages', methods=['GET'])
@school_required
def list_messages():
    query = ParentMessage.query.filter_by(school_id=g.school_id)
    # If parent role, only show their messages
    if g.current_user.role and g.current_user.role.name == 'parent':
        query = query.filter(
            ((ParentMessage.sender_type == 'parent') & (ParentMessage.sender_id == g.current_user.id)) |
            ((ParentMessage.receiver_type == 'parent') & (ParentMessage.receiver_id == g.current_user.id))
        )
    student_id = request.args.get('student_id')
    if student_id:
        query = query.filter_by(student_id=student_id)
    teacher_id = request.args.get('teacher_id')
    if teacher_id:
        query = query.filter(
            ((ParentMessage.sender_type == 'teacher') & (ParentMessage.sender_id == int(teacher_id))) |
            ((ParentMessage.receiver_type == 'teacher') & (ParentMessage.receiver_id == int(teacher_id)))
        )
    query = query.order_by(ParentMessage.created_at.desc())
    result = paginate(query)
    # Enrich with sender/receiver names
    for item in result.get('items', []):
        if item.get('sender_type') == 'parent':
            from app.models.user import User
            u = db.session.get(User, item['sender_id'])
            item['sender_name'] = u.full_name if u else 'Parent'
        elif item.get('sender_type') == 'teacher':
            s = db.session.get(Staff, item['sender_id'])
            item['sender_name'] = f"{s.first_name} {s.last_name or ''}".strip() if s else 'Teacher'
        if item.get('receiver_type') == 'teacher':
            s = db.session.get(Staff, item['receiver_id'])
            item['receiver_name'] = f"{s.first_name} {s.last_name or ''}".strip() if s else 'Teacher'
        elif item.get('receiver_type') == 'parent':
            from app.models.user import User
            u = db.session.get(User, item['receiver_id'])
            item['receiver_name'] = u.full_name if u else 'Parent'
    return success_response(result)


@parent_bp.route('/messages', methods=['POST'])
@school_required
def send_message():
    data = request.get_json()
    # Determine sender type based on role
    sender_type = 'parent' if (g.current_user.role and g.current_user.role.name == 'parent') else data.get('sender_type', 'staff')
    msg = ParentMessage(
        school_id=g.school_id,
        sender_type=sender_type,
        sender_id=g.current_user.id,
        receiver_type=data.get('receiver_type', 'teacher'),
        receiver_id=data['receiver_id'],
        student_id=data.get('student_id'),
        subject=data.get('subject'),
        message=data['message'],
        parent_id=data.get('parent_id'),
        thread_id=data.get('thread_id'),
    )
    db.session.add(msg)
    db.session.commit()
    return success_response(msg.to_dict(), 'Message sent', 201)


@parent_bp.route('/messages/<int:msg_id>/read', methods=['PUT'])
@school_required
def mark_message_read(msg_id):
    msg = ParentMessage.query.filter_by(id=msg_id, school_id=g.school_id).first_or_404()
    msg.is_read = True
    msg.read_at = datetime.utcnow()
    db.session.commit()
    return success_response(message='Message marked as read')


# ============ DAILY ACTIVITIES ============
@parent_bp.route('/activities', methods=['GET'])
@school_required
def list_activities():
    query = DailyActivity.query.filter_by(school_id=g.school_id)
    class_id = request.args.get('class_id')
    if class_id:
        query = query.filter_by(class_id=class_id)
    query = query.order_by(DailyActivity.activity_date.desc())
    return success_response(paginate(query))


@parent_bp.route('/activities', methods=['POST'])
@role_required('school_admin', 'teacher')
def create_activity():
    data = request.get_json()
    activity = DailyActivity(
        school_id=g.school_id,
        class_id=data.get('class_id'),
        student_id=data.get('student_id'),
        activity_date=data.get('activity_date', datetime.utcnow().date()),
        activity_type=data.get('activity_type', 'general'),
        title=data.get('title'),
        description=data.get('description'),
        photo_urls=data.get('photo_urls'),
        posted_by=g.current_user.id
    )
    db.session.add(activity)
    db.session.commit()
    return success_response(activity.to_dict(), 'Activity posted', 201)


@parent_bp.route('/activities/<int:activity_id>', methods=['DELETE'])
@role_required('school_admin', 'teacher')
def delete_activity(activity_id):
    activity = DailyActivity.query.filter_by(id=activity_id, school_id=g.school_id).first_or_404()
    db.session.delete(activity)
    db.session.commit()
    return success_response(message='Activity deleted')


# ============ NOTIFICATIONS ============
@parent_bp.route('/notifications', methods=['GET'])
@school_required
def list_notifications():
    query = ParentNotification.query.filter_by(school_id=g.school_id)
    n_type = request.args.get('type')
    if n_type:
        query = query.filter_by(notification_type=n_type)
    query = query.order_by(ParentNotification.created_at.desc())
    return success_response(paginate(query))


@parent_bp.route('/notifications', methods=['POST'])
@role_required('school_admin', 'teacher')
def send_notification():
    data = request.get_json()
    notif = ParentNotification(
        school_id=g.school_id,
        parent_id=data.get('parent_id'),
        student_id=data.get('student_id'),
        title=data['title'],
        message=data.get('message'),
        notification_type=data.get('notification_type', 'general'),
        channel=data.get('channel', 'in_app'),
    )
    db.session.add(notif)
    db.session.commit()
    return success_response(notif.to_dict(), 'Notification sent', 201)


@parent_bp.route('/notifications/<int:notif_id>/read', methods=['PUT'])
@school_required
def mark_notification_read(notif_id):
    notif = ParentNotification.query.filter_by(id=notif_id, school_id=g.school_id).first_or_404()
    notif.is_read = True
    notif.read_at = datetime.utcnow()
    db.session.commit()
    return success_response(message='Notification marked as read')


# ============ VOLUNTEERS ============
@parent_bp.route('/volunteers', methods=['GET'])
@school_required
def list_volunteers():
    query = VolunteerRegistration.query.filter_by(school_id=g.school_id)
    query = query.order_by(VolunteerRegistration.created_at.desc())
    return success_response(paginate(query))


@parent_bp.route('/volunteers', methods=['POST'])
@school_required
def register_volunteer():
    data = request.get_json()
    vol = VolunteerRegistration(
        school_id=g.school_id,
        parent_id=data.get('parent_id'),
        parent_name=data.get('parent_name'),
        phone=data.get('phone'),
        event_name=data['event_name'],
        event_date=data.get('event_date'),
        role=data.get('role'),
        notes=data.get('notes'),
    )
    db.session.add(vol)
    db.session.commit()
    return success_response(vol.to_dict(), 'Volunteer registered', 201)


@parent_bp.route('/volunteers/<int:vol_id>', methods=['PUT'])
@role_required('school_admin')
def update_volunteer(vol_id):
    vol = VolunteerRegistration.query.filter_by(id=vol_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for field in ['status', 'role', 'notes']:
        if field in data:
            setattr(vol, field, data[field])
    db.session.commit()
    return success_response(vol.to_dict(), 'Volunteer updated')


# ============ PICKUP AUTHORIZATION ============
@parent_bp.route('/pickup', methods=['GET'])
@school_required
def list_pickup_auth():
    query = PickupAuthorization.query.filter_by(school_id=g.school_id)
    student_id = request.args.get('student_id')
    if student_id:
        query = query.filter_by(student_id=student_id)
    query = query.order_by(PickupAuthorization.created_at.desc())
    return success_response(paginate(query))


@parent_bp.route('/pickup', methods=['POST'])
@school_required
def create_pickup_auth():
    data = request.get_json()
    auth = PickupAuthorization(
        school_id=g.school_id,
        student_id=data.get('student_id'),
        authorized_person=data['authorized_person'],
        relation=data.get('relation'),
        phone=data['phone'],
        id_proof=data.get('id_proof'),
        is_active=data.get('is_active', True),
    )
    db.session.add(auth)
    db.session.commit()
    return success_response(auth.to_dict(), 'Pickup authorization created', 201)


@parent_bp.route('/pickup/<int:auth_id>', methods=['PUT'])
@school_required
def update_pickup_auth(auth_id):
    auth = PickupAuthorization.query.filter_by(id=auth_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for field in ['authorized_person', 'relation', 'phone', 'id_proof', 'is_active']:
        if field in data:
            setattr(auth, field, data[field])
    db.session.commit()
    return success_response(auth.to_dict(), 'Pickup authorization updated')


@parent_bp.route('/pickup/<int:auth_id>', methods=['DELETE'])
@school_required
def delete_pickup_auth(auth_id):
    auth = PickupAuthorization.query.filter_by(id=auth_id, school_id=g.school_id).first_or_404()
    db.session.delete(auth)
    db.session.commit()
    return success_response(message='Pickup authorization deleted')


# ============ CHILD COMPREHENSIVE VIEW ============
@parent_bp.route('/child/<int:student_id>', methods=['GET'])
@school_required
def get_child_overview(student_id):
    """Get comprehensive overview of a student for parent portal"""
    student = Student.query.filter_by(id=student_id, school_id=g.school_id).first_or_404()

    # If parent role, verify this is their child
    if g.current_user.role and g.current_user.role.name == 'parent':
        linked = ParentDetail.query.filter_by(
            student_id=student_id, school_id=g.school_id, user_id=g.current_user.id
        ).first()
        if not linked:
            return error_response('Unauthorized access', 403)

    data = student.to_dict()

    # Class teacher info
    if student.current_section_id:
        section = Section.query.get(student.current_section_id)
        if section:
            if section.class_teacher:
                ct = section.class_teacher
                data['class_teacher'] = {
                    'id': ct.id, 'name': f"{ct.first_name} {ct.last_name or ''}".strip(),
                    'phone': ct.phone, 'email': ct.email,
                    'photo_url': ct.photo_url if hasattr(ct, 'photo_url') else None,
                    'designation': ct.designation if hasattr(ct, 'designation') else None,
                }
            if section.co_class_teacher:
                cct = section.co_class_teacher
                data['co_class_teacher'] = {
                    'id': cct.id, 'name': f"{cct.first_name} {cct.last_name or ''}".strip(),
                    'phone': cct.phone, 'email': cct.email,
                }

    # Parents info
    data['parents'] = [p.to_dict() for p in ParentDetail.query.filter_by(
        student_id=student_id, school_id=g.school_id).all()]

    # --- ATTENDANCE ---
    att_records = StudentAttendance.query.filter_by(
        student_id=student_id, school_id=g.school_id
    ).filter(StudentAttendance.period.is_(None)).order_by(StudentAttendance.date.desc()).all()

    total_att = len(att_records)
    present_count = sum(1 for r in att_records if r.status in ('present', 'late'))
    absent_count = sum(1 for r in att_records if r.status == 'absent')
    late_count = sum(1 for r in att_records if r.status == 'late')

    monthly_att = {}
    for r in att_records:
        key = r.date.strftime('%Y-%m')
        if key not in monthly_att:
            monthly_att[key] = {'present': 0, 'absent': 0, 'late': 0, 'total': 0, 'month': key}
        if r.status in ('present', 'late'):
            monthly_att[key]['present'] += 1
        elif r.status == 'absent':
            monthly_att[key]['absent'] += 1
        if r.status == 'late':
            monthly_att[key]['late'] += 1
        monthly_att[key]['total'] += 1

    data['attendance'] = {
        'total_days': total_att,
        'present': present_count,
        'absent': absent_count,
        'late': late_count,
        'percentage': round((present_count / total_att * 100), 1) if total_att > 0 else 0,
        'monthly': sorted(monthly_att.values(), key=lambda x: x['month'], reverse=True),
        'recent': [r.to_dict() for r in att_records[:15]]
    }

    # --- FEES ---
    installments = FeeInstallment.query.filter_by(
        student_id=student_id, school_id=g.school_id
    ).order_by(FeeInstallment.due_date).all()

    total_fee = sum(float(i.amount) for i in installments)
    total_paid = sum(float(i.paid_amount or 0) for i in installments)
    total_pending = total_fee - total_paid
    overdue = [i for i in installments if i.status in ('pending', 'overdue', 'partial') and i.due_date and i.due_date < datetime.utcnow().date()]

    recent_payments = FeePayment.query.filter_by(
        student_id=student_id, school_id=g.school_id
    ).order_by(FeePayment.payment_date.desc()).limit(10).all()

    data['fees'] = {
        'total_fee': total_fee,
        'total_paid': total_paid,
        'total_pending': total_pending,
        'overdue_count': len(overdue),
        'overdue_amount': sum(float(i.amount) - float(i.paid_amount or 0) for i in overdue),
        'installments': [i.to_dict() for i in installments],
        'recent_payments': [p.to_dict() for p in recent_payments]
    }

    # --- EXAM RESULTS ---
    results = ExamResult.query.filter_by(
        student_id=student_id, school_id=g.school_id
    ).order_by(ExamResult.entered_at.desc()).all()

    # Group by exam
    exams_map = {}
    for r in results:
        exam_name = r.schedule.exam.name if r.schedule and r.schedule.exam else 'Unknown'
        if exam_name not in exams_map:
            exams_map[exam_name] = {'exam': exam_name, 'subjects': [], 'total_marks': 0, 'obtained': 0}
        exams_map[exam_name]['subjects'].append(r.to_dict())
        if r.marks_obtained:
            exams_map[exam_name]['obtained'] += float(r.marks_obtained)
        if r.schedule and r.schedule.max_marks:
            exams_map[exam_name]['total_marks'] += float(r.schedule.max_marks)

    for exam_data in exams_map.values():
        if exam_data['total_marks'] > 0:
            exam_data['percentage'] = round(exam_data['obtained'] / exam_data['total_marks'] * 100, 1)
        else:
            exam_data['percentage'] = 0

    report_cards = ReportCard.query.filter_by(
        student_id=student_id, school_id=g.school_id
    ).order_by(ReportCard.generated_at.desc()).all()

    data['exams'] = {
        'results_by_exam': list(exams_map.values()),
        'total_exams': len(exams_map),
        'report_cards': [rc.to_dict() for rc in report_cards]
    }

    # --- HOMEWORK ---
    hw_query = Homework.query.filter_by(school_id=g.school_id)
    if student.current_class_id:
        hw_query = hw_query.filter_by(class_id=student.current_class_id)
    if student.current_section_id:
        hw_query = hw_query.filter(
            (Homework.section_id == student.current_section_id) | (Homework.section_id.is_(None))
        )
    homeworks = hw_query.order_by(Homework.due_date.desc()).limit(20).all()
    data['homework'] = [h.to_dict() for h in homeworks]

    # --- TIMETABLE ---
    if student.current_class_id:
        timetable = Timetable.query.filter_by(
            school_id=g.school_id, class_id=student.current_class_id
        )
        if student.current_section_id:
            timetable = timetable.filter(
                (Timetable.section_id == student.current_section_id) | (Timetable.section_id.is_(None))
            )
        timetable = timetable.order_by(Timetable.day_of_week, Timetable.period_number).all()
        data['timetable'] = [t.to_dict() for t in timetable]
    else:
        data['timetable'] = []

    # --- LIBRARY ---
    try:
        from app.models.library import LibraryIssue
        lib_issues = LibraryIssue.query.filter_by(
            student_id=student_id, school_id=g.school_id
        ).order_by(LibraryIssue.issue_date.desc()).limit(20).all()
        data['library'] = [li.to_dict() for li in lib_issues]
    except Exception:
        data['library'] = []

    # --- TRANSPORT ---
    try:
        from app.models.transport import TransportStudent
        transport = TransportStudent.query.filter_by(student_id=student_id).first()
        data['transport'] = transport.to_dict() if transport else None
    except Exception:
        data['transport'] = None

    # --- HEALTH ---
    try:
        from app.models.student import StudentMedical
        medical = StudentMedical.query.filter_by(
            student_id=student_id, school_id=g.school_id
        ).order_by(StudentMedical.record_date.desc()).limit(10).all()
        data['health'] = [m.to_dict() for m in medical]
    except Exception:
        data['health'] = []

    # --- DAILY ACTIVITIES ---
    activities = DailyActivity.query.filter_by(school_id=g.school_id)
    if student.current_class_id:
        activities = activities.filter(
            (DailyActivity.class_id == student.current_class_id) | (DailyActivity.class_id.is_(None))
        )
    activities = activities.order_by(DailyActivity.created_at.desc()).limit(10).all()
    data['activities'] = [a.to_dict() for a in activities]

    # --- UPCOMING EXAMS ---
    try:
        from app.models.academic import ExamSchedule, Exam
        upcoming_query = ExamSchedule.query.filter(
            ExamSchedule.school_id == g.school_id,
            ExamSchedule.exam_date >= datetime.utcnow().date()
        )
        if student.current_class_id:
            upcoming_query = upcoming_query.filter_by(class_id=student.current_class_id)
        if student.current_section_id:
            upcoming_query = upcoming_query.filter(
                (ExamSchedule.section_id == student.current_section_id) | (ExamSchedule.section_id.is_(None))
            )
        upcoming_exams = upcoming_query.order_by(ExamSchedule.exam_date, ExamSchedule.start_time).limit(20).all()
        exam_list = []
        for ue in upcoming_exams:
            item = ue.to_dict()
            exam = Exam.query.get(ue.exam_id)
            item['exam_name'] = exam.name if exam else 'Unknown'
            exam_list.append(item)
        data['upcoming_exams'] = exam_list
    except Exception:
        data['upcoming_exams'] = []

    return success_response(data)


# ============ LIST STUDENTS FOR PARENT ============
@parent_bp.route('/my-children', methods=['GET'])
@school_required
def list_my_children():
    """List all students linked to the logged-in parent"""
    search = request.args.get('search', '')
    class_id = request.args.get('class_id')

    # If parent role, only show their linked children
    if g.current_user.role and g.current_user.role.name == 'parent':
        linked_details = ParentDetail.query.filter_by(
            school_id=g.school_id, user_id=g.current_user.id
        ).all()
        student_ids = [pd.student_id for pd in linked_details]
        if not student_ids:
            return success_response([])
        query = Student.query.filter(
            Student.id.in_(student_ids),
            Student.school_id == g.school_id,
            Student.status == 'active'
        )
    else:
        # Admin / staff - support search across all
        query = Student.query.filter_by(school_id=g.school_id, status='active')

    if search:
        query = query.filter(
            (Student.first_name.ilike(f'%{search}%')) |
            (Student.last_name.ilike(f'%{search}%')) |
            (Student.admission_no.ilike(f'%{search}%'))
        )
    if class_id:
        query = query.filter_by(current_class_id=class_id)

    query = query.order_by(Student.first_name)
    students = query.limit(50).all()

    result = []
    for s in students:
        item = {
            'id': s.id, 'name': f"{s.first_name} {s.last_name or ''}".strip(),
            'admission_no': s.admission_no, 'roll_no': s.roll_no,
            'photo_url': s.photo_url,
            'class_name': s.current_class.name if s.current_class else None,
            'section_name': s.current_section.name if s.current_section else None,
            'gender': s.gender
        }
        parents = ParentDetail.query.filter_by(student_id=s.id, school_id=g.school_id).all()
        item['parents'] = [{'name': p.name, 'relation': p.relation, 'phone': p.phone} for p in parents]
        result.append(item)

    return success_response(result)
