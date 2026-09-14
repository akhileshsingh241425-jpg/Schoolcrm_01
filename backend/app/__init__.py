import os
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix

from config import config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
mail = Mail()
limiter = Limiter(key_func=get_remote_address, default_limits=["5000 per day", "500 per hour"])


def create_app(config_name='default'):
    cfg = config[config_name]
    if hasattr(cfg, 'validate'):
        cfg.validate()
    app = Flask(__name__)
    app.config.from_object(cfg)

    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    allowed_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}})
    mail.init_app(app)
    limiter.init_app(app)

    with app.app_context():
        from app.models import user, school, subscription
        try:
            _deduplicate_roles()
            _seed_roles_if_empty()
            _seed_permissions_if_empty()
            _seed_super_admin_if_empty()
        except Exception:
            pass

    # Silence Flask-Migrate warning about alembic_version
    import logging
    logging.getLogger('alembic.runtime.migration').setLevel(logging.WARNING)

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

    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        return jsonify({'success': False, 'message': f'Invalid token: {error_string}'}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error_string):
        return jsonify({'success': False, 'message': f'Missing token: {error_string}'}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'success': False, 'message': 'Token has expired'}), 401

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
    from app.routes.roles_permissions import roles_bp
    from app.routes.support import support_bp
    from app.routes.mobile import mobile_bp

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
    app.register_blueprint(roles_bp, url_prefix='/api/roles')
    app.register_blueprint(support_bp, url_prefix='/api/support')
    app.register_blueprint(mobile_bp, url_prefix='/api/mobile')

    from flask import send_from_directory

    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads')
        return send_from_directory(upload_dir, filename)

    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        return response

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        if exception:
            db.session.rollback()

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Internal server error'}), 500

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'success': False, 'message': 'Not found'}), 404

    return app


def _deduplicate_roles():
    """Remove duplicate Role rows and enforce unique name constraint."""
    from app.models.user import Role, User, user_roles
    from sqlalchemy import text

    # Find names that appear more than once
    dupes = db.session.query(
        Role.name, db.func.count(Role.id).label('cnt')
    ).group_by(Role.name).having(db.func.count(Role.id) > 1).all()

    if not dupes:
        # Try to add unique index if missing (MySQL)
        try:
            db.session.execute(text(
                "ALTER TABLE roles ADD UNIQUE INDEX uq_role_name (name)"
            ))
            db.session.commit()
        except Exception:
            db.session.rollback()
        return

    for (name, _) in dupes:
        records = Role.query.filter_by(name=name).order_by(Role.id).all()
        keep = records[0]
        delete_ids = [r.id for r in records[1:]]

        # Reassign user primary role
        User.query.filter(User.role_id.in_(delete_ids)).update(
            {User.role_id: keep.id}, synchronize_session=False
        )

        # Reassign user_rows entries
        for did in delete_ids:
            rows = db.session.execute(
                text("SELECT user_id FROM user_roles WHERE role_id = :rid"),
                {'rid': did}
            ).fetchall()
            for (uid,) in rows:
                already = db.session.execute(
                    text("SELECT 1 FROM user_roles WHERE user_id = :uid AND role_id = :rid"),
                    {'uid': uid, 'rid': keep.id}
                ).first()
                if not already:
                    db.session.execute(
                        text("INSERT INTO user_roles (user_id, role_id) VALUES (:uid, :rid)"),
                        {'uid': uid, 'rid': keep.id}
                    )

        # Delete duplicate roles
        for did in delete_ids:
            db.session.execute(text("DELETE FROM roles WHERE id = :id"), {'id': did})

    db.session.commit()

    # Add unique index
    try:
        db.session.execute(text("ALTER TABLE roles ADD UNIQUE INDEX uq_role_name (name)"))
        db.session.commit()
    except Exception:
        db.session.rollback()


def _seed_roles_if_empty():
    from app.models.user import Role
    roles = [
        ('super_admin', 'Platform Super Admin', True),
        ('school_admin', 'School Administrator', True),
        ('principal', 'Principal', True),
        ('teacher', 'Teacher', True),
        ('exam_controller', 'Exam Controller', True),
        ('academic_controller', 'Academic Controller', True),
        ('it_department', 'IT Department', True),
        ('accountant', 'Accountant', True),
        ('counselor', 'Counselor / Marketing', True),
        ('parent', 'Parent', True),
        ('student', 'Student', True),
        ('librarian', 'Librarian', True),
        ('transport_manager', 'Transport Manager', True),
    ]
    for name, desc, system in roles:
        if not Role.query.filter_by(name=name).first():
            db.session.add(Role(name=name, description=desc, is_system_role=system))
    db.session.commit()


def _seed_permissions_if_empty():
    """Seed Permission records so role-permission toggles can save correctly."""
    from app.models.user import Permission, Role, RolePermission
    if Permission.query.first():
        return
    module_keys = [
        'dashboard', 'students', 'staff', 'leads', 'admissions', 'academics',
        'attendance', 'fees', 'communication', 'reports', 'inventory', 'transport',
        'library', 'parents', 'health', 'hostel', 'canteen', 'sports', 'settings',
        'data_import',
    ]
    for mod in module_keys:
        for action in ['view', 'manage']:
            db.session.add(Permission(name=f'{mod}.{action}', module=mod))
    db.session.commit()

    # Grant all modules to super_admin and school_admin by default
    admin_roles = Role.query.filter(Role.name.in_(['super_admin', 'school_admin'])).all()
    all_perm_ids = [p.id for p in Permission.query.all()]
    for role in admin_roles:
        for pid in all_perm_ids:
            if not RolePermission.query.filter_by(role_id=role.id, permission_id=pid, school_id=None).first():
                db.session.add(RolePermission(role_id=role.id, permission_id=pid, school_id=None))

    # Dashboard is default for ALL roles
    dashboard_perms = Permission.query.filter(Permission.module == 'dashboard').all()
    all_roles = Role.query.all()
    for role in all_roles:
        for dp in dashboard_perms:
            if not RolePermission.query.filter_by(role_id=role.id, permission_id=dp.id, school_id=None).first():
                db.session.add(RolePermission(role_id=role.id, permission_id=dp.id, school_id=None))

    db.session.commit()


def _seed_super_admin_if_empty():
    from app.models.user import User, Role
    from app.models.school import School
    role = Role.query.filter_by(name='super_admin').first()
    if not role:
        return
    if User.query.filter_by(role_id=role.id).first():
        return
    email = os.getenv('SUPER_ADMIN_EMAIL')
    password = os.getenv('SUPER_ADMIN_PASSWORD')
    if not email or not password:
        import logging
        logging.warning('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env to create super admin')
        return
    user = User(
        school_id=None,
        role_id=role.id,
        email=email,
        first_name='Super',
        last_name='Admin',
        is_active=True,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
