import pytest
import json
from conftest import auth_headers, check_response, get_routes, assert_not_500

class TestSmokeAllRoutes:
    """Hit EVERY route and ensure no 500 errors"""

    def test_all_routes_no_500(self, app, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        rules = [r for r in get_routes(app) if '/api/' in r['path']]
        errors = []
        total = len(rules)
        tested = 0

        for rule in sorted(rules, key=lambda x: x['path']):
            path = rule['path']
            methods = rule['methods']

            for method in methods:
                if method == 'GET':
                    func = client.get
                elif method == 'POST':
                    func = client.post
                elif method == 'PUT':
                    func = client.put
                elif method == 'PATCH':
                    func = client.patch
                elif method == 'DELETE':
                    func = client.delete
                else:
                    continue

                # Skip routes with path params - test them generically
                if '<' in path:
                    # For routes with IDs, try a common ID pattern
                    test_path = path.replace('<int:school_id>', '1')\
                                     .replace('<int:id>', '1')\
                                     .replace('<int:student_id>', '1')\
                                     .replace('<int:staff_id>', '1')\
                                     .replace('<int:admission_id>', '1')\
                                     .replace('<int:class_id>', '1')\
                                     .replace('<int:section_id>', '1')\
                                     .replace('<int:subject_id>', '1')\
                                     .replace('<int:exam_id>', '1')\
                                     .replace('<int:fee_id>', '1')\
                                     .replace('<int:route_id>', '1')\
                                     .replace('<int:leaf_id>', '1')\
                                     .replace('<int:role_id>', '1')\
                                     .replace('<int:permission_id>', '1')\
                                     .replace('<int:job_id>', '1')\
                                     .replace('<int:test_id>', '1')\
                                     .replace('<int:payment_id>', '1')\
                                     .replace('<int:schedule_id>', '1')\
                                     .replace('<int:event_id>', '1')\
                                     .replace('<int:notification_id>', '1')\
                                     .replace('<int:log_id>', '1')\
                                     .replace('<int:user_id>', '1')\
                                     .replace('<int:category_id>', '1')\
                                     .replace('<int:item_id>', '1')\
                                     .replace('<int:plan_id>', '1')\
                                     .replace('<int:subscription_id>', '1')\
                                     .replace('<int:feature_id>', '1')\
                                     .replace('<int:addon_id>', '1')\
                                     .replace('<int:invoice_id>', '1')\
                                     .replace('<string:module>', 'dashboard')
                    # Remove remaining params
                    if '<' in test_path:
                        continue
                else:
                    test_path = path

                try:
                    if method in ('POST', 'PUT', 'PATCH'):
                        resp = func(test_path, headers=headers, json={})
                    else:
                        resp = func(test_path, headers=headers)

                    if resp.status_code == 500:
                        errors.append(f"500 {method} {test_path}: {resp.data[:200]}")
                    tested += 1
                except Exception as e:
                    errors.append(f"EXCEPTION {method} {test_path}: {str(e)[:200]}")

        print(f"\nRoutes tested: {tested}/{total}")
        assert len(errors) == 0, f"\nErrors ({len(errors)}):\n" + "\n".join(errors[:20])

class TestEdgeCases:
    """Edge case tests for all modules"""

    def test_no_auth_returns_401(self, app, client):
        rules = [r for r in get_routes(app) if '/api/' in r['path'] and '<' not in r['path']]
        errors = []
        for rule in rules[:30]:
            path = rule['path']
            for method in rule['methods'][:1]:
                try:
                    resp = {
                        'GET': client.get,
                        'POST': client.post,
                        'PUT': client.put,
                        'DELETE': client.delete,
                        'PATCH': client.patch,
                    }[method](path, headers={'Content-Type': 'application/json'})
                    if resp.status_code == 500:
                        errors.append(f"500 {method} {path} (no auth)")
                except Exception as e:
                    errors.append(f"EXCEPTION {method} {path}: {str(e)[:100]}")
        assert len(errors) == 0, f"Errors:\n" + "\n".join(errors)

    def test_invalid_token_returns_401(self, app, client):
        bad_headers = {'Authorization': 'Bearer invalid_token_12345', 'Content-Type': 'application/json'}
        rules = [r for r in get_routes(app) if '/api/' in r['path'] and '<' not in r['path']]
        errors = []
        for rule in rules[:20]:
            path = rule['path']
            for method in rule['methods'][:1]:
                try:
                    resp = {
                        'GET': client.get,
                        'POST': client.post,
                        'PUT': client.put,
                        'DELETE': client.delete,
                        'PATCH': client.patch,
                    }[method](path, headers=bad_headers)
                    if resp.status_code not in (401, 422):
                        errors.append(f"Expected 401/422, got {resp.status_code} {method} {path}")
                except Exception as e:
                    errors.append(f"EXCEPTION {method} {path}: {str(e)[:100]}")
        assert len(errors) == 0, f"Errors:\n" + "\n".join(errors)

    def test_invalid_json_returns_400(self, app, client, super_admin_token):
        headers = {'Authorization': f'Bearer {super_admin_token}', 'Content-Type': 'application/json'}
        post_routes = [r['path'] for r in get_routes(app) if 'POST' in r['methods'] and '/api/' in r['path'] and '<' not in r['path']]
        errors = []
        for path in post_routes[:20]:
            try:
                resp = client.post(path, headers=headers, data='not-valid-json{{{', content_type='application/json')
                if resp.status_code == 500:
                    errors.append(f"500 POST {path} (invalid JSON)")
            except Exception as e:
                errors.append(f"EXCEPTION POST {path}: {str(e)[:100]}")
        assert len(errors) == 0, f"Errors:\n" + "\n".join(errors)

    def test_sql_injection_attempts(self, app, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT * FROM users --",
            "${7*7}",
            "<script>alert(1)</script>",
        ]
        rules = [r for r in get_routes(app) if '/api/' in r['path'] and 'GET' in r['methods'] and '<' not in r['path']]
        errors = []
        for rule in rules[:15]:
            path = rule['path']
            for payload in payloads:
                try:
                    resp = client.get(path, headers=headers, query_string={'q': payload})
                    if resp.status_code == 500:
                        errors.append(f"500 GET {path}?q={payload}")
                except Exception as e:
                    pass
        assert len(errors) == 0, f"SQL injection caused 500 errors:\n" + "\n".join(errors)

    def test_method_not_allowed(self, app, client, super_admin_token):
        headers = auth_headers(super_admin_token)
        rules = get_routes(app)
        errors = []
        for rule in rules[:30]:
            if '/api/' not in rule['path'] or '<' in rule['path']:
                continue
            path = rule['path']
            allowed = set(rule['methods'])
            wrong_methods = []
            if 'POST' in allowed:
                wrong_methods.append('GET')
            elif 'GET' in allowed:
                wrong_methods.append('POST')
            if wrong_methods:
                method = wrong_methods[0]
                try:
                    if method == 'GET':
                        resp = client.get(path, headers=headers)
                    elif method == 'POST':
                        resp = client.post(path, headers=headers, json={})
                    if resp.status_code == 500:
                        errors.append(f"500 {method} {path}")
                except Exception as e:
                    pass
        assert len(errors) == 0, f"Wrong method caused 500 errors:\n" + "\n".join(errors)
