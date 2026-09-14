import pytest
import json
from conftest import auth_headers, assert_not_500

class TestLibraryModule:
    BASE = '/api/library'

    def test_list_books(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/books', headers=headers)
        assert resp.status_code != 500

    def test_create_book_invalid(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.post(f'{self.BASE}/books', headers=headers, json={})
        assert resp.status_code != 500

    def test_book_issues(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/issues', headers=headers)
        assert resp.status_code != 500
        resp2 = client.post(f'{self.BASE}/issues', headers=headers, json={})
        assert resp2.status_code != 500

    def test_book_categories(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/categories', headers=headers)
        assert resp.status_code != 500

    def test_book_fines(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/fines', headers=headers)
        assert resp.status_code != 500

    def test_book_reservations(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/reservations', headers=headers)
        assert resp.status_code != 500

    def test_library_statistics(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/statistics', headers=headers)
        assert resp.status_code != 500

    def test_library_search(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/search', headers=headers)
        assert resp.status_code != 500


class TestInventoryModule:
    BASE = '/api/inventory'

    def test_list_items(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/items', headers=headers)
        assert resp.status_code != 500

    def test_create_item_invalid(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.post(f'{self.BASE}/items', headers=headers, json={})
        assert resp.status_code != 500

    def test_inventory_categories(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/categories', headers=headers)
        assert resp.status_code != 500

    def test_inventory_transactions(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/transactions', headers=headers)
        assert resp.status_code != 500

    def test_inventory_statistics(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/statistics', headers=headers)
        assert resp.status_code != 500

    def test_purchase_orders(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/purchase-orders', headers=headers)
        assert resp.status_code != 500

    def test_purchase_requests(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/purchase-requests', headers=headers)
        assert resp.status_code != 500

    def test_asset_management(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/assets', headers=headers)
        assert resp.status_code != 500

    def test_inventory_export(self, client, school_context):
        headers = auth_headers(school_context)
        resp = client.get(f'{self.BASE}/export', headers=headers)
        assert resp.status_code != 500
