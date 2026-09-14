import pytest
import json
from conftest import auth_headers, assert_not_500

class TestFeesModule:
    BASE = '/api/fees'

    def test_list_fees(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(self.BASE, headers=headers)
        assert resp.status_code != 500

    def test_create_fee_structure_invalid(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.post(f'{self.BASE}/structures', headers=headers, json={})
        assert resp.status_code != 500

    def test_fee_payments(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/payments', headers=headers)
        assert resp.status_code != 500

    def test_create_payment_invalid(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.post(f'{self.BASE}/payments', headers=headers, json={})
        assert resp.status_code != 500

    def test_fee_receipts(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/receipts', headers=headers)
        assert resp.status_code != 500

    def test_fee_categories(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/categories', headers=headers)
        assert resp.status_code != 500
        resp2 = client.post(f'{self.BASE}/categories', headers=headers, json={})
        assert resp2.status_code != 500

    def test_fee_discounts(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/discounts', headers=headers)
        assert resp.status_code != 500
        resp2 = client.post(f'{self.BASE}/discounts', headers=headers, json={})
        assert resp2.status_code != 500

    def test_fee_installments(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/installments', headers=headers)
        assert resp.status_code != 500

    def test_fee_concessions(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/concessions', headers=headers)
        assert resp.status_code != 500

    def test_fee_collection_report(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/collection-report', headers=headers)
        assert resp.status_code != 500

    def test_fee_defaulters(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/defaulters', headers=headers)
        assert resp.status_code != 500

    def test_fee_statistics(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/statistics', headers=headers)
        assert resp.status_code != 500

    def test_fee_export(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/export', headers=headers)
        assert resp.status_code != 500
