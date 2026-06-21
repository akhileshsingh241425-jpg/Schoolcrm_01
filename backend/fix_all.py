"""
Comprehensive fix script to restore all working functionality:
1. Create super_admin user (admin@schoolcrm.com)
2. Reset passwords for all known users
3. Ensure DEMO001 school subscription is active
"""
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app import create_app, db
from app.models.user import User, Role
from app.models.school import School
from werkzeug.security import generate_password_hash, check_password_hash

app = create_app()

with app.app_context():
    print("=" * 60)
    print("COMPREHENSIVE FIX SCRIPT")
    print("=" * 60)
    
    # 1. Check super_admin role exists
    super_admin_role = Role.query.filter_by(name='super_admin').first()
    print(f"\n[1] Super admin role: {super_admin_role}")
    if not super_admin_role:
        print("ERROR: super_admin role not found! Creating it...")
        super_admin_role = Role(name='super_admin', description='Super Administrator', is_system_role=True)
        db.session.add(super_admin_role)
        db.session.commit()
        print(f"Created super_admin role with id={super_admin_role.id}")
    
    # 2. Check/create super_admin user
    existing_sa = User.query.filter_by(role_id=super_admin_role.id, is_active=True).first()
    if existing_sa:
        print(f"\n[2] Super admin user already exists: id={existing_sa.id}, email={existing_sa.email}")
        # Reset password
        existing_sa.set_password('admin123')
        db.session.commit()
        print(f"    Password reset to 'admin123'")
        verify = existing_sa.check_password('admin123')
        print(f"    Password verification: {verify}")
    else:
        print("\n[2] No super_admin user found. Creating one...")
        # Need a school_id - use DEMO001 school (id=8)
        demo_school = School.query.filter_by(code='DEMO001').first()
        if not demo_school:
            # Try any school
            demo_school = School.query.first()
        
        school_id = demo_school.id if demo_school else 1
        print(f"    Using school_id={school_id} ({demo_school.name if demo_school else 'N/A'})")
        
        sa_user = User(
            school_id=school_id,
            role_id=super_admin_role.id,
            email='admin@schoolcrm.com',
            first_name='Super',
            last_name='Admin',
            is_active=True
        )
        sa_user.set_password('admin123')
        db.session.add(sa_user)
        db.session.commit()
        print(f"    Created super_admin: id={sa_user.id}, email=admin@schoolcrm.com")
        verify = sa_user.check_password('admin123')
        print(f"    Password verification: {verify}")
    
    # 3. Reset passwords for all users in DEMO001 school
    demo_school = School.query.filter_by(code='DEMO001').first()
    if demo_school:
        print(f"\n[3] DEMO001 school: id={demo_school.id}, name={demo_school.name}")
        print(f"    subscription_end={demo_school.subscription_end}")
        print(f"    has_active_subscription={demo_school.has_active_subscription()}")
        
        # Ensure subscription is active
        if not demo_school.has_active_subscription():
            from datetime import datetime
            demo_school.subscription_end = datetime(2027, 12, 31)
            db.session.commit()
            print(f"    Updated subscription_end to 2027-12-31")
        
        # Reset passwords for all users in this school
        users = User.query.filter_by(school_id=demo_school.id, is_active=True).all()
        print(f"    Active users in DEMO001: {len(users)}")
        for u in users:
            old_email = u.email
            u.set_password('admin123')
            print(f"    - Reset password for {old_email} (role={u.role.name if u.role else 'N/A'})")
        db.session.commit()
        
        # Verify passwords work
        print("\n    Verifying passwords...")
        for u in users:
            result = u.check_password('admin123')
            print(f"    - {u.email}: password check = {result}")
    
    # 4. Also fix TEST001 school users
    test_school = School.query.filter_by(code='TEST001').first()
    if test_school:
        print(f"\n[4] TEST001 school: id={test_school.id}, name={test_school.name}")
        print(f"    subscription_end={test_school.subscription_end}")
        print(f"    has_active_subscription={test_school.has_active_subscription()}")
        
        if not test_school.has_active_subscription():
            from datetime import datetime
            test_school.subscription_end = datetime(2027, 12, 31)
            db.session.commit()
            print(f"    Updated subscription_end to 2027-12-31")
        
        users = User.query.filter_by(school_id=test_school.id, is_active=True).all()
        print(f"    Active users in TEST001: {len(users)}")
        for u in users:
            u.set_password('admin123')
            print(f"    - Reset password for {u.email} (role={u.role.name if u.role else 'N/A'})")
        db.session.commit()
    
    # 5. Also fix KVS school users
    kvs_school = School.query.filter_by(code='KVS').first()
    if kvs_school:
        print(f"\n[5] KVS school: id={kvs_school.id}, name={kvs_school.name}")
        print(f"    subscription_end={kvs_school.subscription_end}")
        print(f"    has_active_subscription={kvs_school.has_active_subscription()}")
        
        if not kvs_school.has_active_subscription():
            from datetime import datetime
            kvs_school.subscription_end = datetime(2027, 12, 31)
            db.session.commit()
            print(f"    Updated subscription_end to 2027-12-31")
        
        users = User.query.filter_by(school_id=kvs_school.id, is_active=True).all()
        print(f"    Active users in KVS: {len(users)}")
        for u in users:
            u.set_password('admin123')
            print(f"    - Reset password for {u.email} (role={u.role.name if u.role else 'N/A'})")
        db.session.commit()
    
    # 6. Summary
    print("\n" + "=" * 60)
    print("SUMMARY - Available Login Credentials:")
    print("=" * 60)
    
    # Super admin
    sa = User.query.filter_by(role_id=super_admin_role.id, is_active=True).first()
    if sa:
        print(f"\n  SUPER ADMIN:")
        print(f"    Email: {sa.email}")
        print(f"    Password: admin123")
        print(f"    (No school_code needed for login)")
    
    # All schools with active subscriptions
    schools = School.query.filter_by(is_active=True).all()
    for school in schools:
        if school.has_active_subscription():
            users = User.query.filter_by(school_id=school.id, is_active=True).all()
            if users:
                print(f"\n  SCHOOL: {school.name} (code: {school.code})")
                for u in users:
                    print(f"    Email: {u.email} | Role: {u.role.name if u.role else 'N/A'} | Password: admin123")
    
    print("\n" + "=" * 60)
    print("FIX COMPLETE!")
    print("=" * 60)