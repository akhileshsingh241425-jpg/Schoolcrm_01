from flask import Blueprint, request
from datetime import datetime, date
from werkzeug.security import generate_password_hash
from app import db
from app.models.school import School, SchoolFeature
from app.models.subscription import SubscriptionPlan, SchoolSubscription
from app.models.user import User, Role
from app.models.audit import AuditLog
from app.utils.decorators import super_admin_required
from app.utils.helpers import success_response, error_response, paginate

superadmin_bp = Blueprint('superadmin', __name__)


# ─── Dashboard Stats ───────────────────────────────────────────────
@superadmin_bp.route('/dashboard', methods=['GET'])
@super_admin_required
def dashboard():
    try:
        total_schools = School.query.count()
    except Exception:
        total_schools = 0

    try:
        active_schools = School.query.filter_by(is_active=True).count()
    except Exception:
        active_schools = 0

    try:
        total_students = db.session.execute(
            db.text("SELECT COUNT(*) FROM students")
        ).scalar() or 0
    except Exception:
        total_students = 0

    try:
        total_staff = db.session.execute(
            db.text("SELECT COUNT(*) FROM staff")
        ).scalar() or 0
    except Exception:
        total_staff = 0

    try:
        total_revenue = db.session.query(
            db.func.sum(SchoolSubscription.amount)
        ).filter_by(payment_status='paid').scalar() or 0
    except Exception:
        db.session.rollback()
        total_revenue = 0

    # Recent subscriptions
    try:
        recent_subs = SchoolSubscription.query.order_by(
            SchoolSubscription.created_at.desc()
        ).limit(10).all()
    except Exception:
        db.session.rollback()
        recent_subs = []

    # Plan-wise breakdown
    try:
        plan_breakdown = db.session.query(
            School.plan, db.func.count(School.id)
        ).group_by(School.plan).all()
    except Exception:
        db.session.rollback()
        plan_breakdown = []

    return success_response({
        'total_schools': total_schools,
        'active_schools': active_schools,
        'inactive_schools': total_schools - active_schools,
        'total_students': total_students,
        'total_staff': total_staff,
        'total_revenue': float(total_revenue),
        'plan_breakdown': {p: c for p, c in plan_breakdown} if plan_breakdown else {},
        'recent_subscriptions': [s.to_dict() for s in recent_subs],
    })


# ─── Manage Schools ────────────────────────────────────────────────
@superadmin_bp.route('/schools', methods=['GET'])
@super_admin_required
def list_schools():
    query = School.query.order_by(School.created_at.desc())

    search = request.args.get('search')
    if search:
        query = query.filter(
            db.or_(School.name.ilike(f'%{search}%'), School.code.ilike(f'%{search}%'))
        )

    plan = request.args.get('plan')
    if plan:
        query = query.filter_by(plan=plan)

    status = request.args.get('status')
    if status == 'active':
        query = query.filter_by(is_active=True)
    elif status == 'inactive':
        query = query.filter_by(is_active=False)

    return success_response(paginate(query))


@superadmin_bp.route('/schools/<int:school_id>', methods=['GET'])
@super_admin_required
def get_school(school_id):
    school = School.query.get_or_404(school_id)
    data = school.to_dict()
    data['features'] = [f.to_dict() for f in school.features.all()]
    data['settings'] = [s.to_dict() for s in school.settings.all()]

    # Student/staff counts
    data['student_count'] = db.session.execute(
        db.text("SELECT COUNT(*) FROM students WHERE school_id = :sid"),
        {'sid': school_id}
    ).scalar() or 0
    data['staff_count'] = db.session.execute(
        db.text("SELECT COUNT(*) FROM staff WHERE school_id = :sid"),
        {'sid': school_id}
    ).scalar() or 0

    # Current subscription
    sub = SchoolSubscription.query.filter_by(
        school_id=school_id, payment_status='paid'
    ).order_by(SchoolSubscription.end_date.desc()).first()
    data['current_subscription'] = sub.to_dict() if sub else None

    return success_response(data)


@superadmin_bp.route('/schools/<int:school_id>', methods=['PUT'])
@super_admin_required
def update_school(school_id):
    school = School.query.get_or_404(school_id)
    data = request.get_json()

    updatable = ['name', 'email', 'phone', 'address', 'city', 'state', 'pincode',
                 'logo_url', 'website', 'theme_color', 'plan', 'is_active',
                 'max_students', 'max_staff', 'tagline']

    for field in updatable:
        if field in data:
            setattr(school, field, data[field])

    db.session.commit()
    return success_response(school.to_dict(), 'School updated')


@superadmin_bp.route('/schools/<int:school_id>/toggle', methods=['POST'])
@super_admin_required
def toggle_school(school_id):
    school = School.query.get_or_404(school_id)
    school.is_active = not school.is_active
    db.session.commit()
    status = 'activated' if school.is_active else 'deactivated'
    return success_response(school.to_dict(), f'School {status}')


@superadmin_bp.route('/schools/<int:school_id>/features', methods=['PUT'])
@super_admin_required
def update_features(school_id):
    School.query.get_or_404(school_id)
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
                school_id=school_id, feature_name=feature_name, is_enabled=enabled
            )
            db.session.add(feature)

    db.session.commit()
    return success_response(message='Features updated')


# ─── Subscription Plans ────────────────────────────────────────────
@superadmin_bp.route('/plans', methods=['GET'])
@super_admin_required
def list_plans():
    plans = SubscriptionPlan.query.all()
    return success_response([p.to_dict() for p in plans])


@superadmin_bp.route('/plans', methods=['POST'])
@super_admin_required
def create_plan():
    data = request.get_json()
    plan = SubscriptionPlan(
        name=data['name'],
        description=data.get('description'),
        monthly_price=data.get('monthly_price'),
        yearly_price=data.get('yearly_price'),
        max_students=data.get('max_students'),
        max_staff=data.get('max_staff'),
        features=data.get('features', []),
        is_active=data.get('is_active', True),
    )
    db.session.add(plan)
    db.session.commit()
    return success_response(plan.to_dict(), 'Plan created')


@superadmin_bp.route('/plans/<int:plan_id>', methods=['PUT'])
@super_admin_required
def update_plan(plan_id):
    plan = SubscriptionPlan.query.get_or_404(plan_id)
    data = request.get_json()
    for field in ['name', 'description', 'monthly_price', 'yearly_price',
                  'max_students', 'max_staff', 'features', 'is_active']:
        if field in data:
            setattr(plan, field, data[field])
    db.session.commit()
    return success_response(plan.to_dict(), 'Plan updated')


@superadmin_bp.route('/plans/<int:plan_id>', methods=['DELETE'])
@super_admin_required
def delete_plan(plan_id):
    plan = SubscriptionPlan.query.get_or_404(plan_id)
    plan.is_active = False
    db.session.commit()
    return success_response(message='Plan deactivated')


# ─── School Subscriptions ──────────────────────────────────────────
@superadmin_bp.route('/subscriptions', methods=['GET'])
@super_admin_required
def list_subscriptions():
    query = SchoolSubscription.query.order_by(SchoolSubscription.created_at.desc())

    school_id = request.args.get('school_id')
    if school_id:
        query = query.filter_by(school_id=school_id)

    status = request.args.get('status')
    if status:
        query = query.filter_by(payment_status=status)

    return success_response(paginate(query))


@superadmin_bp.route('/subscriptions', methods=['POST'])
@super_admin_required
def create_subscription():
    """Assign subscription to a school"""
    data = request.get_json()

    school = School.query.get_or_404(data['school_id'])
    plan = SubscriptionPlan.query.get_or_404(data['plan_id'])

    billing = data.get('billing_cycle', 'yearly')
    amount = float(plan.yearly_price) if billing == 'yearly' else float(plan.monthly_price)

    sub = SchoolSubscription(
        school_id=school.id,
        plan_id=plan.id,
        billing_cycle=billing,
        amount=data.get('amount', amount),
        start_date=data.get('start_date', date.today().isoformat()),
        end_date=data['end_date'],
        payment_status=data.get('payment_status', 'paid'),
    )
    db.session.add(sub)

    # Update school plan and limits
    school.plan = plan.name.lower()
    school.max_students = plan.max_students
    school.max_staff = plan.max_staff
    school.subscription_start = sub.start_date
    school.subscription_end = sub.end_date

    # Enable plan features
    for feature_name in (plan.features or []):
        feat = SchoolFeature.query.filter_by(
            school_id=school.id, feature_name=feature_name
        ).first()
        if feat:
            feat.is_enabled = True
        else:
            db.session.add(SchoolFeature(
                school_id=school.id, feature_name=feature_name, is_enabled=True
            ))

    db.session.commit()
    return success_response(sub.to_dict(), 'Subscription created')


@superadmin_bp.route('/subscriptions/<int:sub_id>', methods=['PUT'])
@super_admin_required
def update_subscription(sub_id):
    sub = SchoolSubscription.query.get_or_404(sub_id)
    data = request.get_json()
    for field in ['payment_status', 'end_date', 'amount']:
        if field in data:
            setattr(sub, field, data[field])
    db.session.commit()
    return success_response(sub.to_dict(), 'Subscription updated')


# ─── Public Plans (no auth) ────────────────────────────────────────
@superadmin_bp.route('/public/plans', methods=['GET'])
def public_plans():
    """Public endpoint for schools to see available plans"""
    plans = SubscriptionPlan.query.filter_by(is_active=True).all()
    return success_response([p.to_dict() for p in plans])

# ─── Create School ───────────────────────────────────────────────────────
@superadmin_bp.route('/schools', methods=['POST'])
@super_admin_required
def create_school():
    data = request.get_json()
    if not data.get('name') or not data.get('email'):
        return error_response('School name and email are required', 400)

    if School.query.filter_by(email=data['email']).first():
        return error_response('A school with this email already exists', 409)

    # Generate unique school code
    base_code = data['name'][:3].upper()
    code = base_code
    counter = 1
    while School.query.filter_by(code=code).first():
        code = f"{base_code}{counter}"
        counter += 1

    school = School(
        name=data['name'],
        code=code,
        email=data['email'],
        phone=data.get('phone'),
        address=data.get('address'),
        city=data.get('city'),
        state=data.get('state'),
        pincode=data.get('pincode'),
        country=data.get('country', 'India'),
        website=data.get('website'),
        principal_name=data.get('principal_name'),
        principal_email=data.get('principal_email'),
        principal_phone=data.get('principal_phone'),
        board=data.get('board', 'CBSE'),
        school_type=data.get('school_type', 'co-ed'),
        established_year=data.get('established_year'),
        registration_number=data.get('registration_number'),
        is_active=True,
        plan='basic',
    )
    db.session.add(school)
    db.session.flush()  # get school.id

    # Enable requested features
    for feature_name in (data.get('features') or []):
        db.session.add(SchoolFeature(school_id=school.id, feature_name=feature_name, is_enabled=True))

    # Optionally create school admin user
    admin_data = data.get('admin')
    if admin_data and admin_data.get('email') and admin_data.get('password'):
        admin_role = Role.query.filter_by(name='school_admin').first()
        if admin_role:
            admin_user = User(
                school_id=school.id,
                role_id=admin_role.id,
                email=admin_data['email'],
                first_name=admin_data.get('first_name', ''),
                last_name=admin_data.get('last_name', ''),
                is_active=True,
            )
            admin_user.set_password(admin_data['password'])
            db.session.add(admin_user)

    db.session.commit()
    return success_response(school.to_dict(), 'School created successfully', 201)


# ─── Manage Users ────────────────────────────────────────────────────────
@superadmin_bp.route('/users', methods=['GET'])
@super_admin_required
def list_users():
    query = User.query.join(Role).order_by(User.created_at.desc())

    search = request.args.get('search', '').strip()
    if search:
        query = query.filter(
            db.or_(
                User.email.ilike(f'%{search}%'),
                User.first_name.ilike(f'%{search}%'),
                User.last_name.ilike(f'%{search}%'),
            )
        )

    school_id = request.args.get('school_id')
    if school_id:
        query = query.filter(User.school_id == school_id)

    role = request.args.get('role')
    if role:
        query = query.filter(Role.name == role)

    result = paginate(query)
    # Enrich users with role and school info
    users = []
    for u in result.get('items', result if isinstance(result, list) else []):
        d = u.to_dict() if hasattr(u, 'to_dict') else u
        if hasattr(u, 'role') and u.role:
            d['role'] = {'id': u.role.id, 'name': u.role.name}
        school = School.query.get(u.school_id) if hasattr(u, 'school_id') else None
        d['school'] = {'id': school.id, 'name': school.name} if school else None
        users.append(d)

    if isinstance(result, dict):
        result['items'] = users
        result['users'] = users
    return success_response(result)


@superadmin_bp.route('/users', methods=['POST'])
@super_admin_required
def create_user():
    data = request.get_json()
    if not data.get('email') or not data.get('password'):
        return error_response('Email and password are required', 400)

    role = Role.query.filter_by(name=data.get('role', 'school_admin')).first()
    if not role:
        return error_response('Invalid role', 400)

    school_id = data.get('school_id')
    if not school_id:
        # For super_admin role, use school_id=1 (or first school)
        first_school = School.query.first()
        school_id = first_school.id if first_school else 1

    if User.query.filter_by(school_id=school_id, email=data['email']).first():
        return error_response('User with this email already exists in this school', 409)

    user = User(
        school_id=school_id,
        role_id=role.id,
        email=data['email'],
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', ''),
        is_active=True,
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return success_response(user.to_dict(), 'User created'), 201


@superadmin_bp.route('/users/<int:user_id>/toggle', methods=['POST'])
@super_admin_required
def toggle_user(user_id):
    user = User.query.get_or_404(user_id)
    # Protect super admins
    if user.role and user.role.name == 'super_admin':
        return error_response('Cannot disable a super admin account', 403)
    user.is_active = not user.is_active
    db.session.commit()
    status = 'enabled' if user.is_active else 'disabled'
    return success_response(user.to_dict(), f'User {status}')


@superadmin_bp.route('/users/<int:user_id>/reset-password', methods=['PUT'])
@super_admin_required
def reset_user_password(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    password = data.get('password', '')
    if len(password) < 6:
        return error_response('Password must be at least 6 characters', 400)
    user.set_password(password)
    db.session.commit()
    return success_response(message='Password reset successfully')


# ─── System Settings ─────────────────────────────────────────────────────
_system_settings_store = {}  # In-memory fallback; replace with DB table if needed

@superadmin_bp.route('/system-settings', methods=['GET'])
@super_admin_required
def get_system_settings():
    return success_response(_system_settings_store)


@superadmin_bp.route('/system-settings', methods=['PUT'])
@super_admin_required
def save_system_settings():
    data = request.get_json()
    _system_settings_store.update(data or {})
    return success_response(_system_settings_store, 'Settings saved')


# ─── Audit Logs ──────────────────────────────────────────────────────────
@superadmin_bp.route('/audit-logs', methods=['GET'])
@super_admin_required
def get_audit_logs():
    query = AuditLog.query.order_by(AuditLog.created_at.desc())

    search = request.args.get('search', '').strip()
    action = request.args.get('action', '').strip()
    if action:
        query = query.filter(AuditLog.action == action)

    result = paginate(query)

    # Enrich logs with user info
    logs = []
    items = result.get('items', result) if isinstance(result, dict) else result
    for log in items:
        d = {
            'id': log.id,
            'action': log.action,
            'module': log.module,
            'resource_id': log.record_id,
            'ip_address': log.ip_address,
            'created_at': log.created_at.isoformat() if log.created_at else None,
            'details': str(log.new_values or log.old_values or ''),
        }
        user = User.query.get(log.user_id) if log.user_id else None
        d['user_name'] = f"{user.first_name} {user.last_name}".strip() if user else 'System'
        d['user_email'] = user.email if user else ''
        # Apply search filter
        if search:
            searchable = f"{d['user_name']} {d['user_email']} {d['action']} {d['details']}".lower()
            if search.lower() not in searchable:
                continue
        logs.append(d)

    if isinstance(result, dict):
        result['logs'] = logs
        result['items'] = logs
    return success_response(result)