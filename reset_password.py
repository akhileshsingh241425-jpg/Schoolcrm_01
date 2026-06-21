"""
Reset password for Dream International School (ID=5) admin user.
Sets password to '0000'.
Run: cd backend && python ../reset_password.py
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
from app.models.user import User

app = create_app()
with app.app_context():
    # Find admin user for Dream International School (school_id=5)
    admin = User.query.filter_by(school_id=5, email='admin@dreamschool.edu').first()
    if admin:
        admin.set_password('0000')
        db.session.commit()
        print(f"[OK] Password reset successfully for: {admin.email}")
        print(f"      School ID: {admin.school_id}")
        print(f"      New password: 0000")
    else:
        print("[ERR] Admin user not found! Trying with any admin user in school_id=5...")
        admin = User.query.filter_by(school_id=5, is_active=True).first()
        if admin:
            admin.set_password('0000')
            db.session.commit()
            print(f"[OK] Password reset for: {admin.email}")
            print(f"      New password: 0000")
        else:
            print("[ERR] No active user found for school_id=5!")

    print("\nLogin credentials:")
    print("  Email: admin@dreamschool.edu")
    print("  School Code: DEMO001")
    print("  Password: 0000")