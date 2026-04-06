"""
Setup Role-Based Access Control (RBAC) for School CRM
- Adds department-specific roles (hostel_warden, exam_controller, etc.)
- Seeds module permissions
- Creates default role-permission mappings
"""
import sys
sys.path.insert(0, 'backend')

from app import create_app, db
from app.models.user import Role, Permission, RolePermission
from sqlalchemy import text

app = create_app()

# All modules in the system
ALL_MODULES = [
    'dashboard', 'students', 'staff', 'leads', 'admissions', 'academics',
    'attendance', 'fees', 'communication', 'reports', 'inventory',
    'transport', 'library', 'parents', 'health', 'hostel', 'canteen',
    'sports', 'settings', 'data_import'
]

# New department roles to add
NEW_ROLES = [
    ('principal', 'Principal / Vice Principal'),
    ('exam_controller', 'Exam Controller / Coordinator'),
    ('hostel_warden', 'Hostel Warden'),
    ('sports_incharge', 'Sports In-Charge / PTI'),
    ('lab_assistant', 'Lab Assistant'),
    ('receptionist', 'Front Office / Receptionist'),
    ('hr_manager', 'HR Manager'),
    ('canteen_manager', 'Canteen Manager'),
    ('health_officer', 'Health Officer / Nurse'),
    ('department_head', 'Department Head / HOD'),
]

# Default module access per role
ROLE_MODULE_MAP = {
    'super_admin': ALL_MODULES,
    'school_admin': ALL_MODULES,
    'principal': ALL_MODULES,
    'teacher': [
        'dashboard', 'academics', 'attendance', 'students', 'communication',
        'reports', 'parents', 'library'
    ],
    'accountant': [
        'dashboard', 'fees', 'reports', 'inventory', 'students'
    ],
    'counselor': [
        'dashboard', 'leads', 'admissions', 'communication', 'students', 'parents'
    ],
    'librarian': [
        'dashboard', 'library', 'students', 'reports'
    ],
    'transport_manager': [
        'dashboard', 'transport', 'students', 'reports', 'communication'
    ],
    'exam_controller': [
        'dashboard', 'academics', 'students', 'reports'
    ],
    'hostel_warden': [
        'dashboard', 'hostel', 'students', 'attendance', 'communication', 'health'
    ],
    'sports_incharge': [
        'dashboard', 'sports', 'students', 'health', 'communication'
    ],
    'lab_assistant': [
        'dashboard', 'inventory', 'academics'
    ],
    'receptionist': [
        'dashboard', 'leads', 'admissions', 'communication', 'students', 'parents'
    ],
    'hr_manager': [
        'dashboard', 'staff', 'attendance', 'reports', 'communication'
    ],
    'canteen_manager': [
        'dashboard', 'canteen', 'inventory', 'reports'
    ],
    'health_officer': [
        'dashboard', 'health', 'students', 'communication', 'reports'
    ],
    'department_head': [
        'dashboard', 'academics', 'attendance', 'students', 'communication',
        'reports', 'library'
    ],
    'parent': ['dashboard', 'communication'],
    'student': ['dashboard'],
}

with app.app_context():
    # 1. Add new roles
    print("=== Adding new roles ===")
    for role_name, role_desc in NEW_ROLES:
        existing = Role.query.filter_by(name=role_name).first()
        if not existing:
            role = Role(name=role_name, description=role_desc, is_system_role=True)
            db.session.add(role)
            print(f"  Added role: {role_name}")
        else:
            print(f"  Role already exists: {role_name}")
    db.session.commit()

    # 2. Seed module permissions (view + manage for each module)
    print("\n=== Seeding permissions ===")
    for module in ALL_MODULES:
        for action in ['view', 'manage']:
            perm_name = f"{module}.{action}"
            existing = Permission.query.filter_by(name=perm_name).first()
            if not existing:
                perm = Permission(
                    name=perm_name,
                    module=module,
                    description=f"{'View' if action == 'view' else 'Full access to'} {module.replace('_', ' ').title()}"
                )
                db.session.add(perm)
                print(f"  Added: {perm_name}")
    db.session.commit()

    # 3. Create default role-permission mappings (global, school_id=NULL)
    print("\n=== Setting up role-permission mappings ===")
    all_roles = {r.name: r.id for r in Role.query.all()}
    all_perms = {p.name: p.id for p in Permission.query.all()}

    for role_name, modules in ROLE_MODULE_MAP.items():
        role_id = all_roles.get(role_name)
        if not role_id:
            print(f"  WARNING: Role '{role_name}' not found, skipping")
            continue

        for module in modules:
            for action in ['view', 'manage']:
                perm_name = f"{module}.{action}"
                perm_id = all_perms.get(perm_name)
                if not perm_id:
                    continue

                existing = RolePermission.query.filter_by(
                    role_id=role_id, permission_id=perm_id, school_id=None
                ).first()
                if not existing:
                    rp = RolePermission(role_id=role_id, permission_id=perm_id, school_id=None)
                    db.session.add(rp)

        print(f"  {role_name}: {len(modules)} modules")
    db.session.commit()

    print("\n=== Done! ===")
    print(f"Total Roles: {Role.query.count()}")
    print(f"Total Permissions: {Permission.query.count()}")
    print(f"Total Role-Permissions: {RolePermission.query.count()}")
