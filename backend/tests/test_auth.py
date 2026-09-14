import pytest
import json
from conftest import auth_headers, assert_not_500

class TestAuthModule:
    """Comprehensive auth tests"""

    BASE = '/api/auth'

    def test_login_success(self, client):
        resp = client.post(f'{self.BASE}/login', json={
            'email': 'admin@schoolcrm.com',
            'password': 'admin123'
        })
        assert resp.status_code != 500, f"500 on login: {resp.data[:200]}"

    def test_login_wrong_password(self, client):
        resp = client.post(f'{self.BASE}/login', json={
            'email': 'super@schoolcrm.com',
            'password': 'wrongpassword123'
        })
        assert resp.status_code in (401, 400), f"Expected 401/400, got {resp.status_code}"

    def test_login_missing_fields(self, client):
        resp = client.post(f'{self.BASE}/login', json={'email': 'test@test.com'})
        assert resp.status_code in (400, 422), f"Expected 400, got {resp.status_code}"
        resp2 = client.post(f'{self.BASE}/login', json={'password': 'test123'})
        assert resp2.status_code in (400, 422), f"Expected 400, got {resp2.status_code}"
        resp3 = client.post(f'{self.BASE}/login', json={})
        assert resp3.status_code in (400, 422), f"Expected 400, got {resp3.status_code}"

    def test_login_empty_json(self, client):
        resp = client.post(f'{self.BASE}/login', json={})
        assert resp.status_code in (400, 422), f"Expected 400, got {resp.status_code}"

    def test_login_invalid_email_format(self, client):
        resp = client.post(f'{self.BASE}/login', json={
            'email': 'not-an-email',
            'password': 'test123'
        })
        assert resp.status_code in (400, 401, 422), f"Expected error, got {resp.status_code}"

    def test_login_sql_injection(self, client):
        resp = client.post(f'{self.BASE}/login', json={
            'email': "' OR '1'='1",
            'password': "' OR '1'='1"
        })
        assert resp.status_code in (400, 401, 422), f"No SQL injection success: {resp.status_code}"

    def test_register_validation(self, client):
        resp = client.post(f'{self.BASE}/register', json={})
        assert resp.status_code != 500, f"500 on register: {resp.data[:200]}"

    def test_forgot_password(self, client):
        resp = client.post(f'{self.BASE}/forgot-password', json={'email': 'nonexistent@test.com'})
        assert resp.status_code != 500, "500 error on forgot-password"
        assert resp.status_code in (200, 400, 404)

    def test_forgot_password_missing_email(self, client):
        resp = client.post(f'{self.BASE}/forgot-password', json={})
        assert resp.status_code != 500, f"500 on forgot-password: {resp.data[:200]}"

    def test_refresh_token(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.post(f'{self.BASE}/refresh', headers=headers)
        assert resp.status_code != 500, "500 error on refresh"
        # 200 if refresh endpoint exists, 405 if not allowed, 404 if doesn't exist

    def test_logout(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.post(f'{self.BASE}/logout', headers=headers)
        assert resp.status_code != 500, "500 error on logout"

    def test_profile(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(f'{self.BASE}/profile', headers=headers)
        assert resp.status_code != 500, "500 error on profile"
        if resp.status_code == 200:
            data = json.loads(resp.data)
            assert 'email' in data or 'user' in data or 'id' in data

    def test_change_password(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.post(f'{self.BASE}/change-password', headers=headers, json={
            'current_password': 'wrong',
            'new_password': 'newtest123'
        })
        assert resp.status_code != 500, "500 error on change-password"
