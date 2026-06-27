"""Create staff records for existing users who don't have one"""
from app import create_app, db
from app.models.user import User, Role
from app.models.staff import Staff

app = create_app('production')

with app.app_context():
    non_staff_roles = ['parent', 'student', 'super_admin']
    
    users = User.query.filter(User.school_id.isnot(None)).all()
    created = 0
    
    for user in users:
        if not user.role or user.role.name in non_staff_roles:
            continue
        
        existing = Staff.query.filter_by(school_id=user.school_id, user_id=user.id).first()
        if existing:
            continue
        
        staff = Staff(
            school_id=user.school_id,
            user_id=user.id,
            name=f"{user.first_name} {user.last_name or ''}".strip() or user.email,
            email=user.email,
            phone=user.phone,
            designation=user.role.description or user.role.name.replace('_', ' ').title(),
            department=user.role.name,
            status='active',
        )
        db.session.add(staff)
        created += 1
        print(f"  Created staff: {staff.name} ({user.role.name})")
    
    db.session.commit()
    print(f"\n✅ {created} staff records created for existing users")
