"""Create an Academic Controller user for testing."""
import sys
sys.path.insert(0, '.')
from app import create_app, db
from app.models.user import User

app = create_app('development')

with app.app_context():
    email = input('Enter academic controller email [academic.controller@school.com]: ').strip() or 'academic.controller@school.com'
    password = input('Enter password: ').strip()
    if not password:
        print('Password is required!')
        sys.exit(1)

    # Check if user already exists
    existing = User.query.filter_by(email=email).first()
    if existing:
        print(f'User already exists! ID: {existing.id}')
    else:
        user = User(
            email=email,
            school_id=1,
            role_id=20,
            is_active=True,
            first_name='Academic',
            last_name='Controller'
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        print(f'User created! ID: {user.id}')

    print('\n=== Academic Controller Login ===')
    print(f'Email:    {email}')
    print('=============================================')
