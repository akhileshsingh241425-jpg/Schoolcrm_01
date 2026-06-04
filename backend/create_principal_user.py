"""Create a principal user account."""
import sys
sys.path.insert(0, '.')
from app import create_app, db
from app.models.user import User, Role
from app.models.school import School

app = create_app('development')
with app.app_context():
    role = Role.query.filter_by(name='principal').first()
    if not role:
        role = Role(name='principal', description='Principal / Vice Principal', is_system_role=True)
        db.session.add(role)
        db.session.flush()

    school = School.query.filter_by(code='DEMO001').first()
    email = input('Enter principal email [principal@demo.school]: ').strip() or 'principal@demo.school'
    password = input('Enter password: ').strip()
    if not password:
        print('Password is required!')
        sys.exit(1)

    existing = User.query.filter_by(school_id=school.id, email=email).first()
    if existing:
        existing.role_id = role.id
        existing.set_password(password)
        db.session.commit()
        print('Updated existing user to principal')
    else:
        user = User(
            school_id=school.id, role_id=role.id,
            email=email, first_name='Dr. Rajesh', last_name='Kumar',
            phone='9876500001', is_active=True,
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        print('Created principal user')

    print()
    print('='*50)
    print('PRINCIPAL LOGIN:')
    print('='*50)
    print(f'  School Code : DEMO001')
    print(f'  Email       : {email}')
    print('='*50)
