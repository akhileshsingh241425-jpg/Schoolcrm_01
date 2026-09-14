from flask import Blueprint, g, request
from app import db
from app.models.device_token import DeviceToken
from app.utils.decorators import school_required
from app.utils.helpers import success_response, error_response, validate

mobile_bp = Blueprint('mobile', __name__)

# Bump these on every new APK release (alongside mobile-app/app.json "version").
# min_version: below this, the app blocks usage and forces an update.
# latest_version: shown to the user even when not force-blocked, for a "new version available" note.
MOBILE_VERSION_INFO = {
    'latest_version': '1.0.3',
    'min_version': '1.0.3',
    'download_url': 'http://93.127.194.235/downloads/school-crm-latest.apk',
    'changelog': 'Adds a Library screen for students (issued books, due dates, fines).',
}


@mobile_bp.route('/version', methods=['GET'])
def get_version_info():
    return success_response(MOBILE_VERSION_INFO)


@mobile_bp.route('/register-push-token', methods=['POST'])
@school_required
@validate({'token': {'required': True}})
def register_push_token():
    data = g.get('validated_data') or request.get_json()
    token = data['token']

    existing = DeviceToken.query.filter_by(expo_push_token=token).first()
    if existing:
        existing.user_id = g.current_user.id
        existing.school_id = g.school_id
        existing.platform = data.get('platform')
    else:
        db.session.add(DeviceToken(
            user_id=g.current_user.id,
            school_id=g.school_id,
            expo_push_token=token,
            platform=data.get('platform'),
        ))
    db.session.commit()
    return success_response(None, 'Push token registered')


@mobile_bp.route('/register-push-token', methods=['DELETE'])
@school_required
@validate({'token': {'required': True}})
def unregister_push_token():
    data = g.get('validated_data') or request.get_json()
    DeviceToken.query.filter_by(expo_push_token=data['token']).delete()
    db.session.commit()
    return success_response(None, 'Push token removed')
