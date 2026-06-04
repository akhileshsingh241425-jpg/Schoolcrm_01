"""Reset all passwords for a school's users - no deletions"""
import sys
sys.path.insert(0, '.')
from app import create_app, db
from app.models.user import User, Role
from app.models.school import School

app = create_app('development')
with app.app_context():
    password = input('Enter new password for all users: ')
    school = School.query.filter_by(code='DEMO001').first()
    sid = school.id
    print(f"School: {school.name} (ID: {sid})")
    print("=" * 60)
    print(f"{'ROLE':<20} | {'EMAIL':<35} | PASSWORD")
    print("-" * 60)
    
    # Reset ALL users of this school to the provided password
    users = User.query.filter_by(school_id=sid, is_active=True).all()
    for u in users:
        if u.role:
            u.set_password(password)
    
    db.session.commit()
    
    # Print unique roles
    seen = set()
    for u in users:
        if u.role and u.role.name not in seen:
            seen.add(u.role.name)
            print(f"{u.role.name:<20} | {u.email:<35} | [set via input]")
    
    print("=" * 60)
    print("ALL PASSWORDS: [set via input]")
    print("SCHOOL CODE: DEMO001")
