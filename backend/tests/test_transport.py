import pytest
import json
from conftest import auth_headers, assert_not_500

class TestTransportModule:
    BASE = '/api/transport'

    def test_list_routes(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/routes', headers=headers)
        assert resp.status_code != 500

    def test_create_route_invalid(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.post(f'{self.BASE}/routes', headers=headers, json={})
        assert resp.status_code != 500

    def test_list_stops(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/stops', headers=headers)
        assert resp.status_code != 500

    def test_list_vehicles(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/vehicles', headers=headers)
        assert resp.status_code != 500

    def test_create_vehicle_invalid(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.post(f'{self.BASE}/vehicles', headers=headers, json={})
        assert resp.status_code != 500

    def test_list_drivers(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/drivers', headers=headers)
        assert resp.status_code != 500

    def test_trip_management(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/trips', headers=headers)
        assert resp.status_code != 500

    def test_gps_tracking(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/gps', headers=headers)
        assert resp.status_code != 500

    def test_fuel_logs(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/fuel', headers=headers)
        assert resp.status_code != 500

    def test_maintenance(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/maintenance', headers=headers)
        assert resp.status_code != 500

    def test_transport_fees(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/fees', headers=headers)
        assert resp.status_code != 500

    def test_transport_assignment(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/assignments', headers=headers)
        assert resp.status_code != 500

    def test_transport_statistics(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/statistics', headers=headers)
        assert resp.status_code != 500
