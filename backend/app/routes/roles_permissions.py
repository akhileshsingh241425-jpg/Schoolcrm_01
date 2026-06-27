from flask import Blueprint, request, g
from app import db
from app.models.custom_role import (
    CustomRole, RoleModulePermission, 
    AVAILABLE_MODULES, PERMISSION_LEVELS, DEFAULT_ROLE_TEMPLATES
)
from app.utils.decorators import school_required, role_required
from app.utils.helpers import success_response, error_response

roles_bp = Blueprint('roles', __name__)


@roles_bp.route('/modules', methods=['GET'])
@school_required
def list_modules():
    """Get all available modules and permission levels"""
    return success_response({
        'modules': AVAILABLE_MODULES,
        'permission_levels': PERMISSION_LEVELS,
    })


@roles_bp.route('/roles', methods=['GET'])
@school_required
def list_roles():
    """Get all custom roles for this school"""
    roles = CustomRole.query.filter_by(school_id=g.school_id).order_by(CustomRole.name).all()
    return success_response([r.to_dict() for r in roles])


@roles_bp.route('/roles', methods=['POST'])
@role_required('school_admin')
def create_role():
    """Create a new custom role"""
    data = request.get_json()
    name = (data.get('name') or '').strip().lower().replace(' ', '_')
    if not name:
        return error_response('Role name is required')

    existing = CustomRole.query.filter_by(school_id=g.school_id, name=name).first()
    if existing:
        return error_response(f'Role "{name}" already exists')

    role = CustomRole(
        school_id=g.school_id,
        name=name,
        display_name=data.get('display_name', name.replace('_', ' ').title()),
        description=data.get('description', ''),
        is_system=False,
    )
    db.session.add(role)
    db.session.flush()

    # Set permissions
    permissions = data.get('permissions', {})
    for module_key, level in permissions.items():
        if level in PERMISSION_LEVELS:
            perm = RoleModulePermission(
                custom_role_id=role.id,
                school_id=g.school_id,
                module=module_key,
                level=level,
            )
            db.session.add(perm)

    db.session.commit()
    return success_response(role.to_dict(), 'Role created', 201)


@roles_bp.route('/roles/<int:role_id>', methods=['GET'])
@school_required
def get_role(role_id):
    """Get a specific custom role with permissions"""
    role = CustomRole.query.filter_by(id=role_id, school_id=g.school_id).first_or_404()
    return success_response(role.to_dict())


@roles_bp.route('/roles/<int:role_id>', methods=['PUT'])
@role_required('school_admin')
def update_role(role_id):
    """Update a custom role and its permissions"""
    role = CustomRole.query.filter_by(id=role_id, school_id=g.school_id).first_or_404()
    data = request.get_json()

    if 'display_name' in data:
        role.display_name = data['display_name']
    if 'description' in data:
        role.description = data['description']
    if 'is_active' in data:
        role.is_active = data['is_active']

    # Update permissions
    if 'permissions' in data:
        # Remove old permissions
        RoleModulePermission.query.filter_by(custom_role_id=role.id).delete()
        # Add new
        for module_key, level in data['permissions'].items():
            if level in PERMISSION_LEVELS:
                perm = RoleModulePermission(
                    custom_role_id=role.id,
                    school_id=g.school_id,
                    module=module_key,
                    level=level,
                )
                db.session.add(perm)

    db.session.commit()
    return success_response(role.to_dict(), 'Role updated')


@roles_bp.route('/roles/<int:role_id>', methods=['DELETE'])
@role_required('school_admin')
def delete_role(role_id):
    """Delete a custom role (system roles cannot be deleted)"""
    role = CustomRole.query.filter_by(id=role_id, school_id=g.school_id).first_or_404()
    if role.is_system:
        return error_response('System roles cannot be deleted', 403)
    
    db.session.delete(role)
    db.session.commit()
    return success_response(message=f'Role "{role.display_name}" deleted')


@roles_bp.route('/roles/init-defaults', methods=['POST'])
@role_required('school_admin')
def init_default_roles():
    """Initialize default role templates for this school"""
    created = []
    for role_name, template in DEFAULT_ROLE_TEMPLATES.items():
        existing = CustomRole.query.filter_by(school_id=g.school_id, name=role_name).first()
        if existing:
            continue

        role = CustomRole(
            school_id=g.school_id,
            name=role_name,
            display_name=template['display_name'],
            description=template['description'],
            is_system=True,
        )
        db.session.add(role)
        db.session.flush()

        for module_key, level in template['permissions'].items():
            perm = RoleModulePermission(
                custom_role_id=role.id,
                school_id=g.school_id,
                module=module_key,
                level=level,
            )
            db.session.add(perm)
        created.append(role_name)

    db.session.commit()
    return success_response({'created': created}, f'{len(created)} default roles initialized')


@roles_bp.route('/user-permissions/<int:user_id>', methods=['GET'])
@school_required
def get_user_permissions(user_id):
    """Get effective permissions for a specific user based on their custom role"""
    from app.models.user import User
    user = User.query.filter_by(id=user_id, school_id=g.school_id).first_or_404()
    
    # School admin and super admin have full access
    if user.role and user.role.name in ('school_admin', 'super_admin'):
        perms = {m['key']: 'full' for m in AVAILABLE_MODULES}
        return success_response({'permissions': perms, 'role_name': user.role.name})

    # Check if user has a custom role assigned
    custom_role = CustomRole.query.filter_by(
        school_id=g.school_id, name=user.role.name if user.role else ''
    ).first()

    if custom_role:
        perms = {p.module: p.level for p in custom_role.permissions.all()}
    else:
        # Default: view-only for unassigned roles
        perms = {m['key']: 'view' for m in AVAILABLE_MODULES}

    return success_response({
        'permissions': perms,
        'role_name': custom_role.display_name if custom_role else (user.role.name if user.role else 'unknown'),
    })


@roles_bp.route('/my-permissions', methods=['GET'])
@school_required
def get_my_permissions():
    """Get permissions for the currently logged-in user"""
    from app.models.user import User
    user = User.query.get(g.user_id)
    
    if not user:
        return error_response('User not found', 404)

    # School admin and super admin have full access
    if user.role and user.role.name in ('school_admin', 'super_admin', 'principal'):
        perms = {m['key']: 'full' for m in AVAILABLE_MODULES}
        return success_response({'permissions': perms, 'role_name': user.role.name})

    # Check custom role
    custom_role = CustomRole.query.filter_by(
        school_id=g.school_id, name=user.role.name if user.role else ''
    ).first()

    if custom_role:
        perms = {p.module: p.level for p in custom_role.permissions.all()}
    else:
        perms = {m['key']: 'view' for m in AVAILABLE_MODULES}

    return success_response({
        'permissions': perms,
        'role_name': custom_role.display_name if custom_role else (user.role.name if user.role else 'unknown'),
    })
