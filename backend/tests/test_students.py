import pytest
import json
from conftest import auth_headers, assert_not_500

class TestStudentsModule:
    """Test students endpoints that actually exist"""
    BASE = '/api/students'

    def test_list_students(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(self.BASE + '/', headers=headers)
        assert_not_500(resp, "list students")

    def test_search_comprehensive(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(f'{self.BASE}/search-comprehensive', headers=headers)
        assert_not_500(resp, "search comprehensive")

    def test_get_student_by_id(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(f'{self.BASE}/test-id', headers=headers)
        assert_not_500(resp, "get student by id")

    def test_create_student_invalid(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.post(self.BASE + '/', headers=headers, json={})
        assert_not_500(resp, "create student invalid")

    def test_student_dashboard(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/dashboard', headers=headers)
        assert_not_500(resp, "student dashboard")

    def test_student_classes(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/classes', headers=headers)
        assert_not_500(resp, "student classes")

    def test_student_academic_years(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/academic-years', headers=headers)
        assert_not_500(resp, "academic years")

    def test_student_houses(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/houses', headers=headers)
        assert_not_500(resp, "houses")

    def test_assign_house(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.post(f'{self.BASE}/assign-house', headers=headers, json={})
        assert_not_500(resp, "assign house")

    def test_promote(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.post(f'{self.BASE}/promote', headers=headers, json={})
        assert_not_500(resp, "promote")

    def test_alumni(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/alumni', headers=headers)
        assert_not_500(resp, "alumni")

    def test_bulk_import(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.post(f'{self.BASE}/bulk-import', headers=headers, json={})
        assert_not_500(resp, "bulk import")

    def test_smart_allocate(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.post(f'{self.BASE}/smart-allocate', headers=headers, json={})
        assert_not_500(resp, "smart allocate")

    def test_link_siblings(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.post(f'{self.BASE}/link-siblings', headers=headers, json={})
        assert_not_500(resp, "link siblings")
