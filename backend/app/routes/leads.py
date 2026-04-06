from flask import Blueprint, request, g
from app import db
from app.models.lead import Lead, LeadSource, LeadFollowup, LeadActivity, Campaign
from app.utils.decorators import school_required, role_required, feature_required
from app.utils.helpers import success_response, error_response, paginate

leads_bp = Blueprint('leads', __name__)


@leads_bp.route('/', methods=['GET'])
@school_required
@feature_required('marketing_crm')
def list_leads():
    query = Lead.query.filter_by(school_id=g.school_id)
    
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    
    priority = request.args.get('priority')
    if priority:
        query = query.filter_by(priority=priority)
    
    source_id = request.args.get('source_id', type=int)
    if source_id:
        query = query.filter_by(source_id=source_id)
    
    search = request.args.get('search')
    if search:
        query = query.filter(
            db.or_(
                Lead.student_name.ilike(f'%{search}%'),
                Lead.parent_name.ilike(f'%{search}%'),
                Lead.phone.ilike(f'%{search}%')
            )
        )
    
    query = query.order_by(Lead.created_at.desc())
    return success_response(paginate(query))


@leads_bp.route('/<int:lead_id>', methods=['GET'])
@school_required
@feature_required('marketing_crm')
def get_lead(lead_id):
    lead = Lead.query.filter_by(id=lead_id, school_id=g.school_id).first_or_404()
    data = lead.to_dict()
    data['followups'] = [f.to_dict() for f in lead.followups.order_by(LeadFollowup.followup_date.desc()).all()]
    data['activities'] = [a.to_dict() for a in lead.activities.order_by(LeadActivity.created_at.desc()).all()]
    return success_response(data)


@leads_bp.route('/', methods=['POST'])
@school_required
@feature_required('marketing_crm')
def create_lead():
    data = request.get_json()
    if not data.get('student_name') or not data.get('phone'):
        return error_response('Student name and phone are required')
    
    lead = Lead(
        school_id=g.school_id,
        student_name=data['student_name'],
        parent_name=data.get('parent_name'),
        email=data.get('email'),
        phone=data['phone'],
        alternate_phone=data.get('alternate_phone'),
        source_id=data.get('source_id'),
        campaign_id=data.get('campaign_id'),
        class_interested=data.get('class_interested'),
        priority=data.get('priority', 'medium'),
        notes=data.get('notes'),
        assigned_to=data.get('assigned_to') or g.current_user.id
    )
    db.session.add(lead)
    db.session.flush()
    
    # Log activity
    activity = LeadActivity(
        lead_id=lead.id,
        school_id=g.school_id,
        activity_type='created',
        description='Lead created',
        created_by=g.current_user.id
    )
    db.session.add(activity)
    db.session.commit()
    
    return success_response(lead.to_dict(), 'Lead created', 201)


@leads_bp.route('/<int:lead_id>', methods=['PUT'])
@school_required
@feature_required('marketing_crm')
def update_lead(lead_id):
    lead = Lead.query.filter_by(id=lead_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    
    old_status = lead.status
    
    updatable = ['student_name', 'parent_name', 'email', 'phone', 'alternate_phone',
                 'source_id', 'campaign_id', 'class_interested', 'status', 'priority',
                 'notes', 'assigned_to']
    
    for field in updatable:
        if field in data:
            setattr(lead, field, data[field])
    
    # Log status change
    if 'status' in data and data['status'] != old_status:
        activity = LeadActivity(
            lead_id=lead.id,
            school_id=g.school_id,
            activity_type='status_change',
            description=f'Status changed from {old_status} to {data["status"]}',
            created_by=g.current_user.id
        )
        db.session.add(activity)
    
    db.session.commit()
    return success_response(lead.to_dict(), 'Lead updated')


@leads_bp.route('/<int:lead_id>/followups', methods=['POST'])
@school_required
@feature_required('marketing_crm')
def add_followup(lead_id):
    lead = Lead.query.filter_by(id=lead_id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    
    followup = LeadFollowup(
        lead_id=lead.id,
        school_id=g.school_id,
        followup_type=data['followup_type'],
        notes=data.get('notes'),
        followup_date=data['followup_date'],
        created_by=g.current_user.id
    )
    db.session.add(followup)
    db.session.commit()
    
    return success_response(followup.to_dict(), 'Follow-up added', 201)


# ---- Lead Sources ----

@leads_bp.route('/sources', methods=['GET'])
@school_required
def list_sources():
    sources = LeadSource.query.filter_by(school_id=g.school_id).all()
    return success_response([s.to_dict() for s in sources])


@leads_bp.route('/sources', methods=['POST'])
@role_required('school_admin', 'counselor')
def create_source():
    data = request.get_json()
    source = LeadSource(school_id=g.school_id, name=data['name'])
    db.session.add(source)
    db.session.commit()
    return success_response(source.to_dict(), 'Source created', 201)


# ---- Campaigns ----

@leads_bp.route('/campaigns', methods=['GET'])
@school_required
@feature_required('marketing_crm')
def list_campaigns():
    query = Campaign.query.filter_by(school_id=g.school_id).order_by(Campaign.created_at.desc())
    return success_response(paginate(query))


@leads_bp.route('/campaigns', methods=['POST'])
@role_required('school_admin', 'counselor')
def create_campaign():
    data = request.get_json()
    campaign = Campaign(
        school_id=g.school_id,
        name=data['name'],
        description=data.get('description'),
        start_date=data.get('start_date'),
        end_date=data.get('end_date'),
        budget=data.get('budget'),
        status=data.get('status', 'planned'),
        created_by=g.current_user.id
    )
    db.session.add(campaign)
    db.session.commit()
    return success_response(campaign.to_dict(), 'Campaign created', 201)
