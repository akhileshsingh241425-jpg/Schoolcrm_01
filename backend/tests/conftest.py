import pytest
import json
import os
import sys

# Ensure backend is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

os.environ['FLASK_ENV'] = 'testing'
os.environ['SECRET_KEY'] = 'test-secret-key-12345'
os.environ['JWT_SECRET_KEY'] = 'test-jwt-secret-key-12345'
os.environ['DB_HOST'] = 'localhost'
os.environ['DB_PORT'] = '3306'
os.environ['DB_NAME'] = 'rohit0101'
os.environ['DB_USER'] = 'rohit'
os.environ['DB_PASSWORD'] = 'rohit0101'

from app import create_app, db
from app.models.user import User, Role
from app.models.school import School
from cli import init_app as init_cli

@pytest.fixture(scope='session')
def app():
    application = create_app('production')
    init_cli(application)
    ctx = application.app_context()
    ctx.push()
    yield application
    ctx.pop()

@pytest.fixture(scope='function')
def client(app):
    return app.test_client()

@pytest.fixture(scope='function')
def db_session(app):
    yield db.session

@pytest.fixture(scope='session')
def super_admin_token(app):
    with app.app_context():
        from flask_jwt_extended import create_access_token
        user = User.query.join(Role).filter(Role.name == 'super_admin').first()
        if not user:
            pytest.skip("No super_admin user found in DB. Run seed-db first.")
        token = create_access_token(identity=str(user.id))
        return token

@pytest.fixture(scope='session')
def school_admin_token(app):
    with app.app_context():
        from flask_jwt_extended import create_access_token
        user = User.query.join(Role).filter(Role.name == 'school_admin').first()
        if not user:
            pytest.skip("No school_admin user found in DB.")
        token = create_access_token(identity=str(user.id))
        return token

@pytest.fixture(scope='session')
def principal_token(app):
    with app.app_context():
        from flask_jwt_extended import create_access_token
        user = User.query.join(Role).filter(Role.name == 'principal').first()
        if not user:
            pytest.skip("No principal user found in DB.")
        token = create_access_token(identity=str(user.id))
        return token

@pytest.fixture(scope='session')
def teacher_token(app):
    with app.app_context():
        from flask_jwt_extended import create_access_token
        user = User.query.join(Role).filter(Role.name == 'teacher').first()
        if not user:
            pytest.skip("No teacher user found in DB.")
        token = create_access_token(identity=str(user.id))
        return token

@pytest.fixture(scope='session')
def student_token(app):
    with app.app_context():
        from flask_jwt_extended import create_access_token
        user = User.query.join(Role).filter(Role.name == 'student').first()
        if not user:
            pytest.skip("No student user found in DB.")
        token = create_access_token(identity=str(user.id))
        return token

def auth_headers(token):
    return {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

def check_response(response, expected_status=None):
    """Universal response checker - ensures no 500 errors, valid JSON"""
    assert response.status_code != 500, f"500 Server Error: {response.data[:500]}"
    if expected_status:
        assert response.status_code == expected_status, \
            f"Expected {expected_status}, got {response.status_code}: {response.data[:300]}"
    try:
        data = json.loads(response.data)
        return data
    except json.JSONDecodeError:
        pytest.fail(f"Invalid JSON response: {response.data[:300]}")

def get_routes(app):
    """Extract all registered routes with methods"""
    rules = []
    for rule in app.url_map.iter_rules():
        methods = rule.methods - {'HEAD', 'OPTIONS'}
        if methods:
            rules.append({
                'endpoint': rule.endpoint,
                'path': rule.rule,
                'methods': list(methods)
            })
    return rules


@pytest.fixture
def school_context(school_admin_token):
    """Use school_admin token for routes needing school context"""
    return school_admin_token

def assert_not_500(resp, msg=""):
    """Assert response is NOT a 500 Internal Server Error"""
    if resp.status_code == 500:
        pytest.fail(f"500 error: {resp.data[:500]} {msg}")
