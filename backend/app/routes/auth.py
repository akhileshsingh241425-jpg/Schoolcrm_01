from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models.user import User, Role, Permission, RolePermission
from app.models.school import School, SchoolFeature
from app.utils.decorators import school_required, role_required
from app.utils.helpers import success_response, error_response

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return error_response('No data provided')
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        school_code = data.get('school_code', '').strip()
        
        if not email or not password:
            return error_response('Email and password are required')
        
        # Check for super_admin login (may not need school code)
        user = None
        school = None
        
        # Try to find super_admin by email first
        try:
            super_admin_role = Role.query.filter_by(name='super_admin').first()
            if super_admin_role:
                user = User.query.filter_by(email=email, role_id=super_admin_role.id, is_active=True).first()
        except Exception as e:
            import traceback
            traceback.print_exc()
            super_admin_role = None
            user = None
        
        if user and user.check_password(password):
            # Super admin found - get their school for context (may not exist if schools cleared)
            try:
                school = School.query.get(user.school_id) if user.school_id else None
            except Exception:
                school = None
        else:
            # Normal login - requires school code
            user = None
            if not school_code:
                return error_response('Email, password and school code are required')
            
            school = School.query.filter_by(code=school_code, is_active=True).first()
            if not school:
                return error_response('Invalid school code', 401)
            
            user = User.query.filter_by(school_id=school.id, email=email, is_active=True).first()
            if not user or not user.check_password(password):
                return error_response('Invalid credentials', 401)
        
        # Update last login
        try:
            user.last_login = datetime.utcnow()
            db.session.commit()
        except Exception:
            db.session.rollback()
        
        # Create tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        # Get enabled features (school may be None for super_admin with no school)
        try:
            features = school.get_enabled_features() if school else []
        except Exception:
            features = []
        
        # Get user's allowed modules based on role
        try:
            allowed_modules = user.get_allowed_modules()
        except Exception:
            allowed_modules = []
        
        return success_response({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict(),
            'school': school.to_dict() if school else {},
            'features': features,
            'allowed_modules': allowed_modules
        }, 'Login successful')
    except Exception as e:
        import traceback
        traceback.print_exc()
        return error_response(f'Login error: {str(e)}', 500)


@auth_bp.route('/register-school', methods=['POST'])
def register_school():
    """Register a new school (tenant)"""
    data = request.get_json()
    if not data:
        return error_response('No data provided')
    
    required = ['school_name', 'school_code', 'admin_email', 'admin_password', 'admin_first_name']
    for field in required:
        if not data.get(field):
            return error_response(f'{field} is required')
    
    # Check unique constraints
    if School.query.filter_by(code=data['school_code']).first():
        return error_response('School code already exists')
    
    try:
        # Create school
        school = School(
            name=data['school_name'],
            code=data['school_code'],
            email=data.get('school_email'),
            phone=data.get('school_phone'),
            address=data.get('address'),
            city=data.get('city'),
            state=data.get('state'),
            plan='basic'
        )
        db.session.add(school)
        db.session.flush()
        
        # Enable default features
        default_features = [
            'student_management', 'staff_management', 'fee_management', 
            'attendance', 'communication', 'marketing_crm', 'admission',
            'academic', 'reports', 'inventory', 'transport', 'library'
        ]
        for feature_name in default_features:
            feature = SchoolFeature(
                school_id=school.id,
                feature_name=feature_name,
                is_enabled=True
            )
            db.session.add(feature)
        
        # Create admin user
        admin_role = Role.query.filter_by(name='school_admin').first()
        if not admin_role:
            return error_response('System not initialized properly', 500)
        
        admin = User(
            school_id=school.id,
            role_id=admin_role.id,
            email=data['admin_email'],
            first_name=data['admin_first_name'],
            last_name=data.get('admin_last_name', ''),
            phone=data.get('admin_phone')
        )
        admin.set_password(data['admin_password'])
        db.session.add(admin)
        
        db.session.commit()
        
        # Generate tokens
        access_token = create_access_token(identity=str(admin.id))
        refresh_token = create_refresh_token(identity=str(admin.id))
        
        # Get enabled features
        features = school.get_enabled_features()
        
        # Admin gets all modules
        allowed_modules = admin.get_allowed_modules()
        
        return success_response({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': admin.to_dict(),
            'school': school.to_dict(),
            'features': features,
            'allowed_modules': allowed_modules
        }, 'School registered successfully', 201)
        
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=str(user_id))
    return success_response({'access_token': access_token})


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return error_response('User not found', 404)
    
    school = School.query.get(user.school_id)
    features = school.get_enabled_features() if school else []
    allowed_modules = user.get_allowed_modules()
    
    return success_response({
        'user': user.to_dict(),
        'school': school.to_dict() if school else None,
        'features': features,
        'allowed_modules': allowed_modules
    })


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    data = request.get_json()
    
    if not user:
        return error_response('User not found', 404)
    
    if not data.get('old_password') or not data.get('new_password'):
        return error_response('Old and new passwords are required')
    
    if not user.check_password(data['old_password']):
        return error_response('Current password is incorrect')
    
    if len(data['new_password']) < 8:
        return error_response('Password must be at least 8 characters')
    
    user.set_password(data['new_password'])
    db.session.commit()
    
    return success_response(message='Password changed successfully')


# ============================================================
# ROLES & USER MANAGEMENT
# ============================================================

@auth_bp.route('/roles', methods=['GET'])
@school_required
def list_roles():
    """Get all available roles with their default module access"""
    roles = Role.query.order_by(Role.id).all()
    result = []
    for role in roles:
        # Get modules assigned to this role
        perms = RolePermission.query.filter(
            RolePermission.role_id == role.id,
            db.or_(RolePermission.school_id == g.school_id, RolePermission.school_id.is_(None))
        ).all()
        perm_ids = [rp.permission_id for rp in perms]
        modules = []
        if perm_ids:
            permissions = Permission.query.filter(Permission.id.in_(perm_ids)).all()
            modules = sorted(list(set(p.module for p in permissions)))

        result.append({
            **role.to_dict(),
            'is_system_role': role.is_system_role,
            'modules': modules,
            'user_count': User.query.filter_by(school_id=g.school_id, role_id=role.id, is_active=True).count()
        })
    return success_response(result)


@auth_bp.route('/roles/<int:role_id>/permissions', methods=['PUT'])
@role_required('school_admin')
def update_role_permissions(role_id):
    """Update module permissions for a role (school-specific override)"""
    role = Role.query.get(role_id)
    if not role:
        return error_response('Role not found', 404)

    data = request.get_json()
    modules = data.get('modules', [])

    # Remove existing school-specific permissions for this role
    RolePermission.query.filter_by(role_id=role_id, school_id=g.school_id).delete()

    # Also remove global ones for this role (we'll replace with school-specific)
    RolePermission.query.filter_by(role_id=role_id, school_id=None).delete()

    # Add new permissions
    all_perms = {p.name: p.id for p in Permission.query.all()}
    for module in modules:
        for action in ['view', 'manage']:
            perm_name = f"{module}.{action}"
            perm_id = all_perms.get(perm_name)
            if perm_id:
                db.session.add(RolePermission(role_id=role_id, permission_id=perm_id, school_id=g.school_id))

    db.session.commit()
    return success_response(message='Permissions updated')


@auth_bp.route('/users', methods=['GET'])
@role_required('school_admin')
def list_users():
    """List all users of the school"""
    role_id = request.args.get('role_id', type=int)
    status = request.args.get('status', 'active')
    search = request.args.get('search', '')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    query = User.query.filter_by(school_id=g.school_id)
    if role_id:
        query = query.filter_by(role_id=role_id)
    if status == 'active':
        query = query.filter_by(is_active=True)
    elif status == 'inactive':
        query = query.filter_by(is_active=False)
    if search:
        query = query.filter(
            db.or_(
                User.first_name.ilike(f'%{search}%'),
                User.last_name.ilike(f'%{search}%'),
                User.email.ilike(f'%{search}%')
            )
        )

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return success_response({
        'items': [{
            **u.to_dict(),
            'allowed_modules': u.get_allowed_modules()
        } for u in users],
        'total': total
    })


@auth_bp.route('/users', methods=['POST'])
@role_required('school_admin')
def create_user():
    """Create a new user (staff login account)"""
    data = request.get_json()
    if not data:
        return error_response('No data provided')

    required = ['email', 'password', 'first_name', 'role_id']
    for field in required:
        if not data.get(field):
            return error_response(f'{field} is required')

    # Check email unique within school
    if User.query.filter_by(school_id=g.school_id, email=data['email']).first():
        return error_response('Email already exists in this school')

    # Validate role exists
    role = Role.query.get(data['role_id'])
    if not role:
        return error_response('Invalid role')

    if len(data['password']) < 6:
        return error_response('Password must be at least 6 characters')

    user = User(
        school_id=g.school_id,
        role_id=data['role_id'],
        email=data['email'],
        first_name=data['first_name'],
        last_name=data.get('last_name', ''),
        phone=data.get('phone')
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()

    return success_response({
        **user.to_dict(),
        'allowed_modules': user.get_allowed_modules()
    }, 'User created successfully', 201)


@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@role_required('school_admin')
def update_user(user_id):
    """Update user details (role, status, etc.)"""
    user = User.query.filter_by(id=user_id, school_id=g.school_id).first()
    if not user:
        return error_response('User not found', 404)

    data = request.get_json()

    if 'role_id' in data:
        role = Role.query.get(data['role_id'])
        if not role:
            return error_response('Invalid role')
        user.role_id = data['role_id']

    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'phone' in data:
        user.phone = data['phone']
    if 'email' in data:
        existing = User.query.filter_by(school_id=g.school_id, email=data['email']).first()
        if existing and existing.id != user_id:
            return error_response('Email already in use')
        user.email = data['email']
    if 'is_active' in data:
        user.is_active = data['is_active']
    if 'password' in data and data['password']:
        if len(data['password']) < 6:
            return error_response('Password must be at least 6 characters')
        user.set_password(data['password'])

    db.session.commit()
    return success_response({
        **user.to_dict(),
        'allowed_modules': user.get_allowed_modules()
    }, 'User updated')


@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@role_required('school_admin')
def deactivate_user(user_id):
    """Deactivate a user (soft delete)"""
    user = User.query.filter_by(id=user_id, school_id=g.school_id).first()
    if not user:
        return error_response('User not found', 404)
    if user.id == g.current_user.id:
        return error_response('Cannot deactivate yourself')
    user.is_active = False
    db.session.commit()
    return success_response(message='User deactivated')


@auth_bp.route('/modules', methods=['GET'])
@school_required
def list_modules():
    """Get all available modules"""
    modules = [
        {'key': 'dashboard', 'label': 'Dashboard', 'icon': 'Dashboard'},
        {'key': 'students', 'label': 'Students', 'icon': 'People'},
        {'key': 'staff', 'label': 'Staff', 'icon': 'School'},
        {'key': 'leads', 'label': 'Leads (CRM)', 'icon': 'Campaign'},
        {'key': 'admissions', 'label': 'Admissions', 'icon': 'PersonAdd'},
        {'key': 'academics', 'label': 'Academics', 'icon': 'EventNote'},
        {'key': 'attendance', 'label': 'Attendance', 'icon': 'CalendarMonth'},
        {'key': 'fees', 'label': 'Fees', 'icon': 'AttachMoney'},
        {'key': 'communication', 'label': 'Communication', 'icon': 'Announcement'},
        {'key': 'reports', 'label': 'Reports', 'icon': 'Assessment'},
        {'key': 'inventory', 'label': 'Inventory', 'icon': 'Inventory'},
        {'key': 'transport', 'label': 'Transport', 'icon': 'DirectionsBus'},
        {'key': 'library', 'label': 'Library', 'icon': 'LocalLibrary'},
        {'key': 'parents', 'label': 'Parents', 'icon': 'FamilyRestroom'},
        {'key': 'health', 'label': 'Health & Safety', 'icon': 'HealthAndSafety'},
        {'key': 'hostel', 'label': 'Hostel', 'icon': 'Hotel'},
        {'key': 'canteen', 'label': 'Canteen', 'icon': 'Restaurant'},
        {'key': 'sports', 'label': 'Sports', 'icon': 'SportsBasketball'},
        {'key': 'settings', 'label': 'Settings', 'icon': 'Settings'},
        {'key': 'data_import', 'label': 'Data Import', 'icon': 'CloudUpload'},
    ]
    return success_response(modules)
