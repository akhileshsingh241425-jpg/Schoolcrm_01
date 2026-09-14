import pytest
import json
from conftest import auth_headers, assert_not_500

class TestCommunicationModule:
    BASE = '/api/communication'

    def test_list_announcements(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(f'{self.BASE}/announcements', headers=headers)
        assert resp.status_code != 500

    def test_create_announcement_invalid(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.post(f'{self.BASE}/announcements', headers=headers, json={})
        assert resp.status_code != 500

    def test_notifications(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(f'{self.BASE}/notifications', headers=headers)
        assert resp.status_code != 500
        resp2 = client.post(f'{self.BASE}/notifications/send', headers=headers, json={})
        assert resp2.status_code != 500

    def test_sms_templates(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(f'{self.BASE}/sms-templates', headers=headers)
        assert resp.status_code != 500

    def test_email_templates(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(f'{self.BASE}/email-templates', headers=headers)
        assert resp.status_code != 500

    def test_bulk_communication(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.post(f'{self.BASE}/bulk-send', headers=headers, json={})
        assert resp.status_code != 500

    def test_communication_logs(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(f'{self.BASE}/logs', headers=headers)
        assert resp.status_code != 500
