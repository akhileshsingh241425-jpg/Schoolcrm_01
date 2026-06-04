"""Find a teacher user with login credentials, or create one if none exists."""
import sys
sys.path.insert(0, '.')

from app import create_app, db
from app.models.user import User, Role
from app.models.staff import Staff
from app.models.school import School

app = create_app('development')

with app.app_context():
    password = input('Enter password for teacher account: ')
    # Find teacher role
    teacher_role = Role.query.filter_by(name='teacher').first()
    if not teacher_role:
        print('Teacher role not found!')
        sys.exit(1)

    # Find existing teacher users
    teacher_users = User.query.filter_by(role_id=teacher_role.id, is_active=True).limit(5).all()
    
    if teacher_users:
        print('Existing teacher accounts found:')
        print('='*60)
        for u in teacher_users:
            school = School.query.get(u.school_id)
            staff = Staff.query.filter_by(user_id=u.id).first()
            print(f'  Email: {u.email}')
            print(f'  Name: {u.first_name} {u.last_name}')
            print(f'  School: {school.name if school else "?"} (Code: {school.code if school else "?"})')
            if staff:
                print(f'  Staff: {staff.designation or "Teacher"} | Dept: {staff.department or "-"}')
            print()
        
        # Reset password for first teacher
        first = teacher_users[0]
        first.set_password(password)
        db.session.commit()
        school = School.query.get(first.school_id)
        
        print('='*60)
        print('TEACHER ACCOUNT DETAILS:')
        print('='*60)
        print(f'  School Code : {school.code}')
        print(f'  Email       : {first.email}')
        print(f'  Password    : [set via input]')
        print('='*60)
    else:
        # No teacher user exists - create one from existing staff
        print('No teacher user found. Creating one...')
        staff = Staff.query.filter_by(status='active', staff_type='teaching').first()
        if not staff:
            staff = Staff.query.filter_by(status='active').first()
        if not staff:
            print('No active staff found in DB!')
            sys.exit(1)

        school = School.query.get(staff.school_id)
        email = f"teacher.{staff.first_name.lower()}@demo.school"
        
        # Check if email exists
        existing = User.query.filter_by(school_id=staff.school_id, email=email).first()
        if existing:
            existing.role_id = teacher_role.id
            existing.set_password(password)
            staff.user_id = existing.id
            db.session.commit()
            print(f'Updated existing user to teacher role')
        else:
            user = User(
                school_id=staff.school_id,
                role_id=teacher_role.id,
                email=email,
                first_name=staff.first_name,
                last_name=staff.last_name or '',
                phone=staff.phone,
                is_active=True,
            )
            user.set_password(password)
            db.session.add(user)
            db.session.flush()
            staff.user_id = user.id
            db.session.commit()
            print(f'Created new teacher user')

        print()
        print('='*60)
        print('TEACHER ACCOUNT DETAILS:')
        print('='*60)
        print(f'  School Code : {school.code}')
        print(f'  Email       : {email}')
        print(f'  Password    : [set via input]')
        print(f'  Staff       : {staff.first_name} {staff.last_name} ({staff.designation or "Teacher"})')
        print('='*60)
