"""Link teacher users to their Staff records."""
import sys
sys.path.insert(0, '.')

from app import create_app, db
from app.models.user import User, Role
from app.models.staff import Staff

app = create_app('development')

with app.app_context():
    teacher_role = Role.query.filter_by(name='teacher').first()
    if not teacher_role:
        print('No teacher role found')
        sys.exit(1)

    # Find all teacher users without a linked staff record
    teacher_users = User.query.filter_by(role_id=teacher_role.id, is_active=True).all()
    fixed = 0

    for user in teacher_users:
        # Check if already linked
        existing_staff = Staff.query.filter_by(user_id=user.id).first()
        if existing_staff:
            continue

        # Try to find staff by email match
        staff = Staff.query.filter_by(school_id=user.school_id, email=user.email, status='active').first()
        if not staff:
            # Try by name match
            staff = Staff.query.filter_by(
                school_id=user.school_id,
                first_name=user.first_name,
                status='active'
            ).first()

        if staff and not staff.user_id:
            staff.user_id = user.id
            fixed += 1
            print(f'  Linked: {user.email} -> Staff #{staff.id} ({staff.first_name} {staff.last_name})')
        elif staff and staff.user_id:
            print(f'  Staff already linked to another user: {user.email}')
        else:
            print(f'  No matching staff found for: {user.email}')

    db.session.commit()
    print(f'\nFixed {fixed} teacher-staff links.')
