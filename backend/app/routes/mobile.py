from flask import Blueprint
from app.utils.helpers import success_response

mobile_bp = Blueprint('mobile', __name__)

# Bump these on every new APK release (alongside mobile-app/app.json "version").
# min_version: below this, the app blocks usage and forces an update.
# latest_version: shown to the user even when not force-blocked, for a "new version available" note.
MOBILE_VERSION_INFO = {
    'latest_version': '1.0.2',
    'min_version': '1.0.2',
    'download_url': 'http://93.127.194.235/downloads/school-crm-latest.apk',
    'changelog': 'Adds fees, exam results, homework, announcements, hostel and bus info; '
                 'teacher marks entry, homework assign, parent messaging and notices; '
                 'and a new Admin dashboard/leave-approvals/student-lookup/fees role.',
}


@mobile_bp.route('/version', methods=['GET'])
def get_version_info():
    return success_response(MOBILE_VERSION_INFO)
