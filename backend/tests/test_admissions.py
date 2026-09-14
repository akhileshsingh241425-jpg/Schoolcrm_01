import pytest
import json
from conftest import auth_headers, assert_not_500

class TestAdmissionsModule:
    BASE = '/api/admissions'

    def test_list_admissions(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(self.BASE, headers=headers)
        assert resp.status_code != 500

    def test_create_admission_invalid(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.post(self.BASE, headers=headers, json={})
        assert resp.status_code != 500

    def test_admission_search(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/search', headers=headers)
        assert resp.status_code != 500

    def test_admission_convert_to_student(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.post(f'{self.BASE}/convert', headers=headers, json={})
        assert resp.status_code != 500

    def test_admission_reject(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.post(f'{self.BASE}/reject', headers=headers, json={})
        assert resp.status_code != 500

    def test_admission_documents(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/documents', headers=headers)
        assert resp.status_code != 500
        resp2 = client.post(f'{self.BASE}/documents', headers=headers, json={})
        assert resp2.status_code != 500

    def test_admission_tests(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/tests', headers=headers)
        assert resp.status_code != 500

    def test_admission_settings(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/settings', headers=headers)
        assert resp.status_code != 500

    def test_admission_statistics(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/statistics', headers=headers)
        assert resp.status_code != 500

    def test_admission_export(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/export', headers=headers)
        assert resp.status_code != 500

    def test_admission_waitlist(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/waitlist', headers=headers)
        assert resp.status_code != 500
        resp2 = client.post(f'{self.BASE}/waitlist', headers=headers, json={})
        assert resp2.status_code != 500

    def test_admission_bulk_import(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.post(f'{self.BASE}/bulk-import', headers=headers, json={})
        assert resp.status_code != 500
