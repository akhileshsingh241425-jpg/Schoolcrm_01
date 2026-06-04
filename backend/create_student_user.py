"""Create a student user account and link it to an existing student record."""
import sys
sys.path.insert(0, '.')

from app import create_app, db
from app.models.user import User, Role
from app.models.student import Student

app = create_app('development')

with app.app_context():
    # Pick first active student without a user_id
    student = Student.query.filter_by(status='active', user_id=None).first()
    if not student:
        print('No unlinked active student found!')
        sys.exit(1)

    school_id = student.school_id
    student_role = Role.query.filter_by(name='student').first()
    if not student_role:
        print('Student role not found! Run setup_rbac.py first.')
        sys.exit(1)

    email = f"student.{student.first_name.lower()}@demo.school"
    password = input('Enter password for student account: ').strip()
    if not password:
        print('Password is required!')
        sys.exit(1)

    # Check if user already exists
    existing = User.query.filter_by(school_id=school_id, email=email).first()
    if existing:
        print(f'User already exists: {email}')
        # Link it
        student.user_id = existing.id
        db.session.commit()
        print(f'Linked student {student.id} ({student.first_name} {student.last_name}) to user {existing.id}')
    else:
        user = User(
            school_id=school_id,
            role_id=student_role.id,
            email=email,
            first_name=student.first_name,
            last_name=student.last_name or '',
            phone='9999900001',
            is_active=True,
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        student.user_id = user.id
        db.session.commit()

        print(f'Created student user and linked!')

    # Get school code
    from app.models.school import School
    school = School.query.get(school_id)

    print('\n' + '='*50)
    print('LOGIN INFO:')
    print('='*50)
    print(f'  School Code : {school.code}')
    print(f'  Email       : {email}')
    print(f'  Student     : {student.first_name} {student.last_name} (ID: {student.id})')
    print(f'  Class/Sec   : class_id={student.current_class_id}, section_id={student.current_section_id}')
    print('='*50)
