from flask import Blueprint, request, g, current_app, send_from_directory
import os
import uuid
from werkzeug.utils import secure_filename
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


ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@schools_bp.route('/my-school/branding', methods=['PUT'])
@role_required('school_admin')
def update_branding():
    """Update school branding (logo, login bg, banner, tagline, theme)"""
    school = g.school
    data = request.get_json()

    branding_fields = ['tagline', 'theme_color']
    for field in branding_fields:
        if field in data:
            setattr(school, field, data[field])

    db.session.commit()
    return success_response(school.to_dict(), 'Branding updated')


@schools_bp.route('/my-school/upload-image', methods=['POST'])
@role_required('school_admin')
def upload_school_image():
    """Upload logo, login_bg_image, or banner_image"""
    school = g.school
    image_type = request.form.get('type', 'logo')  # logo, login_bg, banner

    if image_type not in ('logo', 'login_bg', 'banner'):
        return error_response('Invalid image type')

    if 'file' not in request.files:
        return error_response('No file provided')

    file = request.files['file']
    if file.filename == '':
        return error_response('No file selected')

    if not allowed_file(file.filename):
        return error_response('File type not allowed')

    # Save file
    upload_dir = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'), 'branding', str(school.id))
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f'{image_type}_{uuid.uuid4().hex[:8]}.{ext}'
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    url = f'/api/schools/uploads/branding/{school.id}/{filename}'

    if image_type == 'logo':
        school.logo_url = url
    elif image_type == 'login_bg':
        school.login_bg_image = url
    elif image_type == 'banner':
        school.banner_image = url

    db.session.commit()
    return success_response({'url': url, 'type': image_type}, 'Image uploaded')


@schools_bp.route('/uploads/branding/<int:school_id>/<filename>')
def serve_branding_image(school_id, filename):
    """Serve uploaded branding images (public)"""
    upload_dir = os.path.join(current_app.config.get('UPLOAD_FOLDER', 'uploads'), 'branding', str(school_id))
    return send_from_directory(upload_dir, filename)


@schools_bp.route('/public/<school_code>', methods=['GET'])
def get_school_public(school_code):
    """Public endpoint - get school branding info for login page"""
    school = School.query.filter_by(code=school_code, is_active=True).first()
    if not school:
        return error_response('School not found', 404)

    return success_response({
        'name': school.name,
        'code': school.code,
        'logo_url': school.logo_url,
        'login_bg_image': school.login_bg_image,
        'banner_image': school.banner_image,
        'tagline': school.tagline,
        'theme_color': school.theme_color,
    })
