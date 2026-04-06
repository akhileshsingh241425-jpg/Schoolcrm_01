from flask import Blueprint, request, g
from app import db
from app.models.school import School, SchoolFeature, SchoolSetting
from app.utils.decorators import super_admin_required, school_required, role_required
from app.utils.helpers import success_response, error_response, paginate

schools_bp = Blueprint('schools', __name__)


@schools_bp.route('/', methods=['GET'])
@super_admin_required
def list_schools():
    query = School.query.order_by(School.created_at.desc())
    
    search = request.args.get('search')
    if search:
        query = query.filter(School.name.ilike(f'%{search}%'))
    
    plan = request.args.get('plan')
    if plan:
        query = query.filter_by(plan=plan)
    
    return success_response(paginate(query))


@schools_bp.route('/<int:school_id>', methods=['GET'])
@super_admin_required
def get_school(school_id):
    school = School.query.get_or_404(school_id)
    data = school.to_dict()
    data['features'] = [f.to_dict() for f in school.features.all()]
    data['settings'] = [s.to_dict() for s in school.settings.all()]
    return success_response(data)


@schools_bp.route('/<int:school_id>', methods=['PUT'])
@super_admin_required
def update_school(school_id):
    school = School.query.get_or_404(school_id)
    data = request.get_json()
    
    updatable = ['name', 'email', 'phone', 'address', 'city', 'state', 'pincode',
                 'logo_url', 'website', 'theme_color', 'plan', 'is_active',
                 'max_students', 'max_staff']
    
    for field in updatable:
        if field in data:
            setattr(school, field, data[field])
    
    db.session.commit()
    return success_response(school.to_dict(), 'School updated')


@schools_bp.route('/<int:school_id>/features', methods=['PUT'])
@super_admin_required
def update_features(school_id):
    school = School.query.get_or_404(school_id)
    data = request.get_json()
    features = data.get('features', {})
    
    for feature_name, enabled in features.items():
        feature = SchoolFeature.query.filter_by(
            school_id=school_id, feature_name=feature_name
        ).first()
        
        if feature:
            feature.is_enabled = enabled
        else:
            feature = SchoolFeature(
                school_id=school_id,
                feature_name=feature_name,
                is_enabled=enabled
            )
            db.session.add(feature)
    
    db.session.commit()
    return success_response(message='Features updated')


@schools_bp.route('/my-school', methods=['GET'])
@school_required
def get_my_school():
    school = g.school
    data = school.to_dict()
    data['features'] = school.get_enabled_features()
    settings = {}
    for s in school.settings.all():
        settings[s.setting_key] = s.setting_value
    data['settings'] = settings
    return success_response(data)


@schools_bp.route('/my-school/settings', methods=['PUT'])
@role_required('school_admin')
def update_my_settings():
    data = request.get_json()
    school_id = g.school_id
    
    for key, value in data.items():
        setting = SchoolSetting.query.filter_by(
            school_id=school_id, setting_key=key
        ).first()
        
        if setting:
            setting.setting_value = str(value)
        else:
            setting = SchoolSetting(
                school_id=school_id,
                setting_key=key,
                setting_value=str(value)
            )
            db.session.add(setting)
    
    db.session.commit()
    return success_response(message='Settings updated')
