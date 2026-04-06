import requests, time
time.sleep(2)

BASE = 'http://localhost:5000/api'
r = requests.post(f'{BASE}/auth/login', json={
    'school_code': 'Sikarwar',
    'email': 'akhileshsingh241425@gmail.com',
    'password': 'admin123'
}, timeout=10)
token = r.json()['data']['access_token']
h = {'Authorization': f'Bearer {token}'}

endpoints = [
    '/academics/exam-dashboard',
    '/academics/subjects',
    '/academics/exam-types',
    '/academics/grading-systems',
    '/academics/exams',
    '/academics/exam-halls',
    '/academics/timetable',
    '/academics/exam-groups',
    '/academics/exam-incidents',
]

for url in endpoints:
    try:
        r2 = requests.get(f'{BASE}{url}', headers=h, timeout=5)
        status = 'PASS' if r2.status_code == 200 else 'FAIL'
        print(f'{status} [{r2.status_code}] {url}')
        if r2.status_code != 200:
            print(f'  {r2.text[:200]}')
    except Exception as e:
        print(f'ERR {url}: {e}')

# Test create exam with existing data
r3 = requests.get(f'{BASE}/academics/exams', headers=h, timeout=5)
exams = r3.json()['data']
if isinstance(exams, dict):
    items = exams.get('items', [])
else:
    items = exams
print(f'\nTotal exams: {len(items)}')
if items:
    eid = items[0]['id']
    r4 = requests.get(f'{BASE}/academics/exams/{eid}', headers=h, timeout=5)
    detail = r4.json()['data']
    print(f'Exam detail: {detail["name"]} - {len(detail.get("schedules", []))} schedules')

# Dashboard stats
r5 = requests.get(f'{BASE}/academics/exam-dashboard', headers=h, timeout=5)
stats = r5.json()['data']['stats']
print(f'\nDashboard: {stats["total_exams"]} exams, {stats["total_subjects"]} subjects, {stats["total_halls"]} halls')

print('\nAll tests complete!')
