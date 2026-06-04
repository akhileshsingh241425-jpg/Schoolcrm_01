"""
Seed script: Create store_manager role, permissions, and a demo store manager user.
Run: python create_store_manager.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from app.models.user import User, Role, Permission, RolePermission
from app.models.school import School

app = create_app('development')

with app.app_context():
    school = School.query.filter_by(code='DEMO001').first()
    if not school:
        print('DEMO001 school not found. Run seed_dummy_data.py first.')
        sys.exit(1)

    role = Role.query.filter_by(name='store_manager').first()
    if not role:
        role = Role(name='store_manager', description='Store Manager - manages inventory allocation, returns, and stock', is_system_role=True)
        db.session.add(role)
        db.session.flush()
        print('Created store_manager role')
    else:
        print('store_manager role already exists')

    # Add inventory.view and inventory.manage permissions
    view_perm = Permission.query.filter_by(name='inventory.view').first()
    if not view_perm:
        view_perm = Permission(name='inventory.view', module='inventory', description='View inventory')
        db.session.add(view_perm)

    manage_perm = Permission.query.filter_by(name='inventory.manage').first()
    if not manage_perm:
        manage_perm = Permission(name='inventory.manage', module='inventory', description='Manage inventory')
        db.session.add(manage_perm)

    db.session.flush()

    # Assign permissions to role
    for perm in [view_perm, manage_perm]:
        existing = RolePermission.query.filter_by(role_id=role.id, permission_id=perm.id, school_id=None).first()
        if not existing:
            db.session.add(RolePermission(role_id=role.id, permission_id=perm.id, school_id=None))

    # Create demo store manager user
    email = input('Enter store manager email [store@demo.school]: ').strip() or 'store@demo.school'
    password = input('Enter password: ').strip()
    if not password:
        print('Password is required!')
        sys.exit(1)
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(
            school_id=school.id,
            role_id=role.id,
            email=email,
            first_name='Store',
            last_name='Manager',
            phone='9876500006',
        )
        user.set_password(password)
        db.session.add(user)
        print(f'Created store manager user: {email}')
    else:
        print('store manager user already exists')

    db.session.commit()
    print('Done! Store manager is ready.')
