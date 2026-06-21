"""
Usage:
  Set env vars first:
    $env:SUPER_ADMIN_EMAIL = "your@email.com"
    $env:SUPER_ADMIN_PASSWORD = "your-password"

  Then run:
    .\venv\Scripts\python reset_db.py

  OR create a .env file with:
    SUPER_ADMIN_EMAIL=your@email.com
    SUPER_ADMIN_PASSWORD=your-password
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()

from app import create_app, db
from app.models import *
from sqlalchemy import text

app = create_app('development')
with app.app_context():
    email = os.getenv('SUPER_ADMIN_EMAIL')
    password = os.getenv('SUPER_ADMIN_PASSWORD')

    if not email or not password:
        print('ERROR: Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env or environment variables.')
        sys.exit(1)

    # ─── 1. Create super admin if not exists ───────────────────────────
    existing = User.query.filter_by(email=email).first()
    if existing:
        print(f'Super admin exists: id={existing.id}')
    else:
        school = School.query.filter_by(code='SUPER').first()
        if not school:
            school = School(
                name='Super Admin School', code='SUPER', email='admin@super.local',
                is_active=True, plan='premium',
            )
            db.session.add(school)
            db.session.flush()
            print(f'Created school id={school.id}')

        super_role = Role.query.filter_by(name='super_admin').first()
        user = User(
            school_id=school.id, role_id=super_role.id,
            email=email, first_name='Super', last_name='Admin', is_active=True,
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()
        print(f'Created super admin: {email}')

    KEEP_TABLES = {'roles', 'permissions', 'role_permissions',
                   'school_features', 'school_settings'}

    # ─── 2. Disable FK checks ──────────────────────────────────────────
    db.session.execute(text('SET FOREIGN_KEY_CHECKS = 0'))

    # ─── 3. Delete everything except kept tables ───────────────────────
    db.session.execute(text(f"DELETE FROM users WHERE email != '{email}'"))
    db.session.execute(text(f"DELETE FROM schools WHERE id NOT IN (SELECT school_id FROM users WHERE email = '{email}')"))

    inspector = db.inspect(db.engine)
    count = 0
    for t in inspector.get_table_names():
        if t in KEEP_TABLES or t in ('schools', 'users'):
            continue
        try:
            db.session.execute(text(f'DELETE FROM {t}'))
            count += 1
        except Exception as e:
            print(f'  SKIP {t}: {e}')

    # ─── 4. Re-enable FK checks ────────────────────────────────────────
    db.session.execute(text('SET FOREIGN_KEY_CHECKS = 1'))
    db.session.commit()
    print(f'\nDone! Cleared {count} tables. Only super admin ({email}) + seed data remain.')
