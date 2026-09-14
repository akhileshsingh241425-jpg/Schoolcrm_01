import pytest
import json
from conftest import auth_headers, assert_not_500

class TestAttendanceModule:
    BASE = '/api/attendance'

    def test_list_attendance(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(self.BASE, headers=headers)
        assert resp.status_code != 500

    def test_mark_attendance_invalid(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.post(self.BASE, headers=headers, json={})
        assert resp.status_code != 500

    def test_attendance_today(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/today', headers=headers)
        assert resp.status_code != 500

    def test_attendance_report(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/report', headers=headers)
        assert resp.status_code != 500

    def test_attendance_summary(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/summary', headers=headers)
        assert resp.status_code != 500

    def test_attendance_bulk_mark(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.post(f'{self.BASE}/bulk-mark', headers=headers, json={})
        assert resp.status_code != 500

    def test_attendance_rules(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/rules', headers=headers)
        assert resp.status_code != 500
        resp2 = client.post(f'{self.BASE}/rules', headers=headers, json={})
        assert resp2.status_code != 500

    def test_attendance_devices(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/devices', headers=headers)
        assert resp.status_code != 500
        resp2 = client.post(f'{self.BASE}/devices', headers=headers, json={})
        assert resp2.status_code != 500

    def test_attendance_statistics(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/statistics', headers=headers)
        assert resp.status_code != 500

    def test_attendance_late_arrivals(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/late-arrivals', headers=headers)
        assert resp.status_code != 500
