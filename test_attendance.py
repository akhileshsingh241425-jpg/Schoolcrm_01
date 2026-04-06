import requests
import json

BASE = 'http://localhost:5000/api'

# Login first
login = requests.post(f'{BASE}/auth/login', json={
    'school_code': 'Sikarwar',
    'email': 'akhileshsingh241425@gmail.com',
    'password': 'admin123'
})
token = login.json()['data']['access_token']
h = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

endpoints = [
    ('GET', '/attendance/dashboard', None),
    ('GET', '/attendance/students?date=2025-07-16', None),
    ('POST', '/attendance/students', {'date': '2025-07-16', 'attendance': []}),
    ('GET', '/attendance/students/report?from_date=2025-07-01&to_date=2025-07-16', None),
    ('GET', '/attendance/period?class_id=1&period=1&date=2025-07-16', None),
    ('POST', '/attendance/period', {'date': '2025-07-16', 'period': 1, 'attendance': []}),
    ('GET', '/attendance/staff?date=2025-07-16', None),
    ('POST', '/attendance/staff', {'date': '2025-07-16', 'attendance': []}),
    ('GET', '/attendance/staff/report', None),
    ('GET', '/attendance/leave-types', None),
    ('POST', '/attendance/leave-types', {'name': 'Casual Leave', 'code': 'CL', 'applies_to': 'both', 'max_days_per_year': 12}),
    ('GET', '/attendance/leaves', None),
    ('POST', '/attendance/leaves', {'applicant_type': 'student', 'applicant_id': 1, 'from_date': '2025-07-20', 'to_date': '2025-07-22', 'reason': 'Family function'}),
    ('GET', '/attendance/late-arrivals?date=2025-07-16', None),
    ('POST', '/attendance/late-arrivals', {'person_type': 'student', 'person_id': 1, 'arrival_time': '09:15', 'late_by_minutes': 15, 'reason': 'Traffic'}),
    ('GET', '/attendance/rules', None),
    ('POST', '/attendance/rules', {'minimum_percentage': 75, 'alert_threshold': 80, 'late_arrival_minutes': 15, 'school_start_time': '08:00', 'school_end_time': '14:00'}),
    ('GET', '/attendance/devices', None),
    ('POST', '/attendance/devices', {'device_name': 'Main Gate Biometric', 'device_type': 'biometric', 'location': 'Main Gate'}),
    ('GET', '/attendance/events', None),
    ('POST', '/attendance/events', {'event_name': 'Sports Day', 'event_type': 'sports', 'event_date': '2025-07-16', 'attendance': []}),
    ('GET', '/attendance/analytics?from_date=2025-07-01&to_date=2025-07-16', None),
    ('GET', '/attendance/alerts', None),
]

passed = 0
failed = 0
for method, endpoint, body in endpoints:
    try:
        if method == 'GET':
            r = requests.get(f'{BASE}{endpoint}', headers=h)
        else:
            r = requests.post(f'{BASE}{endpoint}', headers=h, json=body)
        
        status = r.status_code
        ok = status in (200, 201)
        if ok:
            passed += 1
            print(f'  PASS  {method} {endpoint.split("?")[0]} -> {status}')
        else:
            failed += 1
            print(f'  FAIL  {method} {endpoint.split("?")[0]} -> {status} | {r.text[:150]}')
    except Exception as e:
        failed += 1
        print(f'  ERR   {method} {endpoint.split("?")[0]} -> {e}')

# Test approve leave (need the leave ID from POST above)
try:
    leaves = requests.get(f'{BASE}/attendance/leaves', headers=h).json()
    if leaves.get('data') and len(leaves['data']) > 0:
        lid = leaves['data'][0]['id']
        r = requests.put(f'{BASE}/attendance/leaves/{lid}/approve', headers=h, json={'action': 'approve'})
        if r.status_code == 200:
            passed += 1
            print(f'  PASS  PUT /attendance/leaves/{lid}/approve -> 200')
        else:
            failed += 1
            print(f'  FAIL  PUT /attendance/leaves/{lid}/approve -> {r.status_code} | {r.text[:150]}')
except Exception as e:
    failed += 1
    print(f'  ERR   PUT /attendance/leaves/approve -> {e}')

# Test student detail
try:
    r = requests.get(f'{BASE}/attendance/students/1', headers=h)
    if r.status_code == 200:
        passed += 1
        print(f'  PASS  GET /attendance/students/1 -> 200')
    else:
        failed += 1
        print(f'  FAIL  GET /attendance/students/1 -> {r.status_code} | {r.text[:150]}')
except Exception as e:
    failed += 1
    print(f'  ERR   GET /attendance/students/1 -> {e}')

# Test device update and delete
try:
    devices = requests.get(f'{BASE}/attendance/devices', headers=h).json()
    if devices.get('data') and len(devices['data']) > 0:
        did = devices['data'][0]['id']
        r = requests.put(f'{BASE}/attendance/devices/{did}', headers=h, json={'status': 'maintenance'})
        if r.status_code == 200:
            passed += 1
            print(f'  PASS  PUT /attendance/devices/{did} -> 200')
        else:
            failed += 1
            print(f'  FAIL  PUT /attendance/devices/{did} -> {r.status_code}')
        
        r2 = requests.delete(f'{BASE}/attendance/devices/{did}', headers=h)
        if r2.status_code == 200:
            passed += 1
            print(f'  PASS  DELETE /attendance/devices/{did} -> 200')
        else:
            failed += 1
            print(f'  FAIL  DELETE /attendance/devices/{did} -> {r2.status_code}')
except Exception as e:
    failed += 1
    print(f'  ERR   Devices CRUD -> {e}')

# Test leave type update+delete
try:
    lts = requests.get(f'{BASE}/attendance/leave-types', headers=h).json()
    if lts.get('data') and len(lts['data']) > 0:
        ltid = lts['data'][0]['id']
        r = requests.put(f'{BASE}/attendance/leave-types/{ltid}', headers=h, json={'max_days_per_year': 15})
        if r.status_code == 200:
            passed += 1
            print(f'  PASS  PUT /attendance/leave-types/{ltid} -> 200')
        else:
            failed += 1
            print(f'  FAIL  PUT /attendance/leave-types/{ltid} -> {r.status_code}')
        
        r2 = requests.delete(f'{BASE}/attendance/leave-types/{ltid}', headers=h)
        if r2.status_code == 200:
            passed += 1
            print(f'  PASS  DELETE /attendance/leave-types/{ltid} -> 200')
        else:
            failed += 1
            print(f'  FAIL  DELETE /attendance/leave-types/{ltid} -> {r2.status_code}')
except Exception as e:
    failed += 1
    print(f'  ERR   Leave types CRUD -> {e}')

print(f'\n===== RESULTS: {passed} PASSED, {failed} FAILED out of {passed + failed} =====')
