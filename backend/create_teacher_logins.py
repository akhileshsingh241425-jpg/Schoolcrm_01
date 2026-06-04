"""Create login credentials for all teachers."""
import sys
sys.path.insert(0, '.')
from app import create_app, db
from app.models.user import User, Role
from app.models.staff import Staff
from app.models.school import School

app = create_app('development')
with app.app_context():
    school = School.query.filter_by(code='DEMO001').first()
    sid = school.id
    
    teacher_role = Role.query.filter_by(name='teacher').first()
    if not teacher_role:
        teacher_role = Role(name='teacher', description='Teacher', is_system_role=True)
        db.session.add(teacher_role)
        db.session.flush()
        print(f"Created teacher role (id={teacher_role.id})")
    
    password = input('Enter password for all teacher accounts: ').strip()
    if not password:
        print('Password is required!')
        sys.exit(1)
    
    staff_list = Staff.query.filter_by(school_id=sid, status='active').all()
    
    print("=" * 60)
    print(f"{'NAME':<20} | {'EMAIL':<30} | STATUS")
    print("-" * 60)
    
    for s in staff_list:
        # Skip if already has a user
        if s.user_id:
            user = User.query.get(s.user_id)
            if user:
                user.set_password(password)
                email = user.email
                db.session.commit()
                print(f"{s.first_name} {s.last_name:<10} | {email:<30} | reset")
                continue
        
        # Create new user for this staff
        email = f"teacher{s.id}@demo.school"
        existing = User.query.filter_by(email=email, school_id=sid).first()
        if existing:
            existing.set_password(password)
            s.user_id = existing.id
            db.session.commit()
            print(f"{s.first_name} {s.last_name:<10} | {email:<30} | existing")
            continue
        
        user = User(
            school_id=sid,
            email=email,
            first_name=s.first_name,
            last_name=s.last_name,
            role_id=teacher_role.id,
            is_active=True,
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()
        s.user_id = user.id
        s.email = email
        db.session.commit()
        print(f"{s.first_name} {s.last_name:<10} | {email:<30} | created")
    
    print("=" * 60)
    print("SCHOOL CODE: DEMO001")
