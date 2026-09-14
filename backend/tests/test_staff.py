import pytest
import json
from conftest import auth_headers, assert_not_500

class TestStaffModule:
    BASE = '/api/staff'

    def test_list_staff(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(self.BASE, headers=headers)
        assert resp.status_code != 500

    def test_create_staff_invalid(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.post(self.BASE, headers=headers, json={})
        assert resp.status_code != 500

    def test_staff_search(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/search', headers=headers)
        assert resp.status_code != 500

    def test_staff_attendance(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/attendance', headers=headers)
        assert resp.status_code != 500
        resp2 = client.post(f'{self.BASE}/attendance/mark', headers=headers, json={})
        assert resp2.status_code != 500

    def test_staff_leave(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/leaves', headers=headers)
        assert resp.status_code != 500
        resp2 = client.post(f'{self.BASE}/leaves/apply', headers=headers, json={})
        assert resp2.status_code != 500

    def test_staff_payroll(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/payroll', headers=headers)
        assert resp.status_code != 500
        resp2 = client.post(f'{self.BASE}/payroll/generate', headers=headers, json={})
        assert resp2.status_code != 500

    def test_staff_documents(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/documents', headers=headers)
        assert resp.status_code != 500
        resp2 = client.post(f'{self.BASE}/documents', headers=headers, json={})
        assert resp2.status_code != 500

    def test_staff_subjects(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/subjects', headers=headers)
        assert resp.status_code != 500

    def test_staff_timetable(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/timetable', headers=headers)
        assert resp.status_code != 500

    def test_staff_performance(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/performance', headers=headers)
        assert resp.status_code != 500
        resp2 = client.post(f'{self.BASE}/performance/review', headers=headers, json={})
        assert resp2.status_code != 500

    def test_staff_events(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/events', headers=headers)
        assert resp.status_code != 500

    def test_staff_statistics(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/statistics', headers=headers)
        assert resp.status_code != 500
