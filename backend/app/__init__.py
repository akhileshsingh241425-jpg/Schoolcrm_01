from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from config import config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
mail = Mail()
limiter = Limiter(key_func=get_remote_address, default_limits=["5000 per day", "500 per hour"])


def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    mail.init_app(app)
    limiter.init_app(app)

    # ── Global JSON sanitization: empty strings -> None for ALL routes ──
    import json as _json

    def _sanitize(obj):
        if isinstance(obj, dict):
            return {k: _sanitize(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [_sanitize(i) for i in obj]
        if isinstance(obj, str) and (obj.strip() == '' or obj == 'null'):
            return None
        return obj

    @app.before_request
    def sanitize_json_data():
        if request.is_json and request.method in ('POST', 'PUT', 'PATCH'):
            try:
                raw = request.get_data(as_text=True)
                if raw:
                    parsed = _json.loads(raw)
                    cleaned = _sanitize(parsed)
                    request._cached_json = (cleaned, request._cached_json[1] if request._cached_json else {})
            except Exception:
                pass

    # Handle expired/invalid JWT errors gracefully
    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        return jsonify({'success': False, 'message': 'Invalid token', 'error': error_string}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error_string):
        return jsonify({'success': False, 'message': 'Missing token', 'error': error_string}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'success': False, 'message': 'Token has expired'}), 401

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.schools import schools_bp
    from app.routes.students import students_bp
    from app.routes.staff import staff_bp
    from app.routes.leads import leads_bp
    from app.routes.admissions import admissions_bp
    from app.routes.academics import academics_bp
    from app.routes.attendance import attendance_bp
    from app.routes.fees import fees_bp
    from app.routes.communication import communication_bp
    from app.routes.inventory import inventory_bp
    from app.routes.transport import transport_bp
    from app.routes.library import library_bp
    from app.routes.reports import reports_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.parent import parent_bp
    from app.routes.health import health_bp
    from app.routes.hostel import hostel_bp
    from app.routes.canteen import canteen_bp
    from app.routes.sports import sports_bp
    from app.routes.imports import imports_bp
    from app.routes.superadmin import superadmin_bp
    from app.routes.superadmin_staff import staff_bp as platform_staff_bp
    from app.routes.payment_gateway import payment_bp
    from app.routes.student_portal import student_portal_bp
    from app.routes.uploads import uploads_bp
    from app.routes.principal import principal_bp
    from app.routes.exam_management import exam_mgmt_bp
    from app.routes.academic_controller import academic_controller_bp
    from app.routes.global_features import global_bp
    from app.routes.marks_entry import marks_entry_bp
    from app.routes.store import store_bp

    app.register_blueprint(platform_staff_bp)
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(schools_bp, url_prefix='/api/schools')
    app.register_blueprint(students_bp, url_prefix='/api/students')
    app.register_blueprint(staff_bp, url_prefix='/api/staff')
    app.register_blueprint(leads_bp, url_prefix='/api/leads')
    app.register_blueprint(admissions_bp, url_prefix='/api/admissions')
    app.register_blueprint(academics_bp, url_prefix='/api/academics')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
    app.register_blueprint(fees_bp, url_prefix='/api/fees')
    app.register_blueprint(communication_bp, url_prefix='/api/communication')
    app.register_blueprint(inventory_bp, url_prefix='/api/inventory')
    app.register_blueprint(transport_bp, url_prefix='/api/transport')
    app.register_blueprint(library_bp, url_prefix='/api/library')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(parent_bp, url_prefix='/api/parent')
    app.register_blueprint(health_bp, url_prefix='/api/health')
    app.register_blueprint(hostel_bp, url_prefix='/api/hostel')
    app.register_blueprint(canteen_bp, url_prefix='/api/canteen')
    app.register_blueprint(sports_bp, url_prefix='/api/sports')
    app.register_blueprint(imports_bp, url_prefix='/api/imports')
    app.register_blueprint(superadmin_bp, url_prefix='/api/superadmin')
    app.register_blueprint(payment_bp, url_prefix='/api/payments')
    app.register_blueprint(student_portal_bp, url_prefix='/api/student')
    app.register_blueprint(uploads_bp, url_prefix='/api/files')
    app.register_blueprint(principal_bp, url_prefix='/api/principal')
    app.register_blueprint(exam_mgmt_bp, url_prefix='/api/exam-mgmt')
    app.register_blueprint(academic_controller_bp, url_prefix='/api/academic-controller')
    app.register_blueprint(global_bp, url_prefix='/api/global')
    app.register_blueprint(marks_entry_bp, url_prefix='/api/marks-entry')
    app.register_blueprint(store_bp, url_prefix='/api/store')

    # Serve uploaded files (question papers, etc.)
    import os
    from flask import send_from_directory

    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads')
        return send_from_directory(upload_dir, filename)

    return app
