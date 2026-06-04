"""
Dummy School Creation Script
Run: /var/www/school-crm/backend/venv/bin/python3 create_dummy_school.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
except ImportError:
    pass

from app import create_app
from app import db
from app.models.school import School, SchoolFeature
from app.models.subscription import SubscriptionPlan, SchoolSubscription, SubscriptionPayment
from app.models.user import User, Role
from datetime import datetime, date, timedelta

app = create_app()
with app.app_context():

    # 1. Create or get School
    school = School.query.filter_by(code='DEMO001').first()
    if school:
        print(f"School already exists: {school.name} (ID: {school.id})")
    else:
        school = School(
            name='Dream International School',
            short_name='DIS',
            code='DEMO001',
            email='admin@dreamschool.edu',
            phone='+91-9876543210',
            secondary_phone='+91-9876543211',
            address='123, Education Lane, Knowledge Park',
            city='New Delhi',
            state='Delhi',
            pincode='110001',
            country='India',
            website='https://dreamschool.edu',
            tagline='Empowering Young Minds',
            plan='premium',
            session='2026-2027',
            subscription_start=date.today(),
            subscription_end=date.today() + timedelta(days=365),
            is_active=True,
            max_students=2000,
            max_staff=200,
            principal_name='Dr. Rajesh Kumar',
            principal_email='principal@dreamschool.edu',
            principal_phone='+91-9876543212',
            board='CBSE',
            school_type='co_educational',
            established_year=2010,
            registration_number='CBSE-123456',
        )
        db.session.add(school)
        db.session.flush()
        print(f"[OK] School created: {school.name} (Code: {school.code}, ID: {school.id})")

    # 2. Enable all features
    all_features = [
        'student_management', 'staff_management', 'fee_management',
        'attendance', 'communication', 'marketing_crm', 'admission',
        'academic', 'reports', 'inventory', 'transport', 'library',
        'parent_engagement', 'health_safety', 'hostel', 'canteen', 'sports'
    ]
    for feat_name in all_features:
        existing = SchoolFeature.query.filter_by(school_id=school.id, feature_name=feat_name).first()
        if not existing:
            db.session.add(SchoolFeature(school_id=school.id, feature_name=feat_name, is_enabled=True))
    print("[OK] All features enabled")

    # 3. Create or get Subscription Plan
    plan = SubscriptionPlan.query.filter_by(name='Premium').first()
    if plan:
        print(f"Plan already exists: {plan.name}")
    else:
        plan = SubscriptionPlan(
            name='Premium',
            description='Full access with all modules and priority support',
            monthly_price=4999.00,
            yearly_price=49999.00,
            max_students=2000,
            max_staff=200,
            features=all_features,
            is_active=True
        )
        db.session.add(plan)
        db.session.flush()
        print(f"[OK] Plan created: {plan.name}")

    # 4. Assign subscription
    sub = SchoolSubscription.query.filter_by(school_id=school.id).first()
    if sub:
        print(f"Subscription already exists (ID: {sub.id})")
    else:
        sub = SchoolSubscription(
            school_id=school.id,
            plan_id=plan.id,
            billing_cycle='yearly',
            amount=49999.00,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            payment_status='paid'
        )
        db.session.add(sub)
        db.session.flush()
        print(f"[OK] Subscription assigned")

    # 5. Record a payment
    pay = SubscriptionPayment.query.filter_by(subscription_id=sub.id).first()
    if not pay:
        pay = SubscriptionPayment(
            subscription_id=sub.id,
            school_id=school.id,
            amount=49999.00,
            payment_date=date.today(),
            payment_mode='online',
            transaction_id='TXN_DEMO_' + str(int(datetime.utcnow().timestamp())),
            receipt_no='INV-000001',
            status='completed',
            notes='Demo school initial payment'
        )
        db.session.add(pay)
        print("[OK] Payment recorded (INV-000001)")

    # 6. Create admin user
    admin_role = Role.query.filter_by(name='school_admin').first()
    if not admin_role:
        print("[ERR] school_admin role not found!")
        sys.exit(1)

    admin = User.query.filter_by(school_id=school.id, email='admin@dreamschool.edu').first()
    if admin:
        print(f"Admin user already exists: {admin.email}")
    else:
        admin = User(
            school_id=school.id,
            role_id=admin_role.id,
            email='admin@dreamschool.edu',
            first_name='Admin',
            last_name='User',
            phone='+91-9876543210',
            is_active=True
        )
        admin_password = input('Enter password for admin user: ')
        admin.set_password(admin_password)
        db.session.add(admin)
        print("[OK] Admin user created: admin@dreamschool.edu")

    db.session.commit()

    print("\n" + "="*50)
    print("DUMMY SCHOOL CREATED SUCCESSFULLY!")
    print("="*50)
    print(f"School:   {school.name}")
    print(f"Code:     {school.code}")
    print(f"Plan:     {plan.name} (₹{plan.yearly_price}/year)")
    print(f"Email:    admin@dreamschool.edu")
    print(f"Password: [set via input]")
    print(f"Login at: http://93.127.194.235")
    print("="*50)

