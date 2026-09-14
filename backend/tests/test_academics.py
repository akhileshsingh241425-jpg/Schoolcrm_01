import pytest
import json
from conftest import auth_headers, check_response, assert_not_500

class TestAcademicsModule:
    """Comprehensive academics module tests"""

    BASE = '/api/academics'

    def test_list_classes(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(f'{self.BASE}/classes', headers=headers)
        data = check_response(resp)
        assert resp.status_code in (200, 403, 404)

    def test_create_class_invalid_data(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.post(f'{self.BASE}/classes', headers=headers, json={})
        assert resp.status_code != 500, "500 on create class with empty data"
        resp2 = client.post(f'{self.BASE}/classes', headers=headers, json={'name': ''})
        assert resp2.status_code != 500, "500 on create class with empty name"

    def test_create_class_duplicate(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.post(f'{self.BASE}/classes', headers=headers, json={
            'name': '__test_duplicate_class__'
        })
        if resp.status_code == 201:
            resp2 = client.post(f'{self.BASE}/classes', headers=headers, json={
                'name': '__test_duplicate_class__'
            })
            assert resp2.status_code in (400, 409), f"Expected 400/409 for duplicate, got {resp2.status_code}"
            client.delete(f'{self.BASE}/classes/__test_duplicate_class__', headers=headers)

    def test_list_sections(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(f'{self.BASE}/sections', headers=headers)
        assert resp.status_code != 500

    def test_create_section_invalid(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.post(f'{self.BASE}/sections', headers=headers, json={})
        assert resp.status_code != 500

    def test_list_subjects(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(f'{self.BASE}/subjects', headers=headers)
        assert resp.status_code != 500

    def test_create_subject_invalid(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.post(f'{self.BASE}/subjects', headers=headers, json={})
        assert resp.status_code != 500

    def test_list_timetable(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(f'{self.BASE}/timetable', headers=headers)
        assert resp.status_code != 500

    def test_create_timetable_invalid(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.post(f'{self.BASE}/timetable', headers=headers, json={})
        assert resp.status_code != 500

    def test_list_syllabus(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(f'{self.BASE}/syllabus', headers=headers)
        assert resp.status_code != 500

    def test_list_exam_types(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(f'{self.BASE}/exam-types', headers=headers)
        assert resp.status_code != 500

    def test_list_grade_systems(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(f'{self.BASE}/grade-systems', headers=headers)
        assert resp.status_code != 500

    def test_list_promotion_criteria(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(f'{self.BASE}/promotion-criteria', headers=headers)
        assert resp.status_code != 500

    def test_list_academic_years(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(f'{self.BASE}/academic-years', headers=headers)
        assert resp.status_code != 500

    def test_list_events(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(f'{self.BASE}/events', headers=headers)
        assert resp.status_code != 500

    def test_list_homework(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(f'{self.BASE}/homework', headers=headers)
        assert resp.status_code != 500

    def test_list_study_materials(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get(f'{self.BASE}/study-materials', headers=headers)
        assert resp.status_code != 500

    def test_roles_permissions(self, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        resp = client.get('/api/roles', headers=headers)
        assert resp.status_code != 500
        resp2 = client.get('/api/roles/permissions', headers=headers)
        assert resp2.status_code != 500
