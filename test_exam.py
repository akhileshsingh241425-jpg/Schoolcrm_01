import requests

BASE = 'http://localhost:5000/api'

# Login
r = requests.post(f'{BASE}/auth/login', json={
    'school_code': 'Sikarwar',
    'email': 'akhileshsingh241425@gmail.com',
    'password': 'admin123'
}, timeout=10)
token = r.json()['data']['access_token']
h = {'Authorization': f'Bearer {token}'}

def test(method, url, data=None):
    fn = getattr(requests, method)
    kwargs = {'headers': h, 'timeout': 10}
    if data:
        kwargs['json'] = data
    r = fn(f'{BASE}{url}', **kwargs)
    status = r.status_code
    try:
        body = r.json()
        ok = body.get('success', False)
    except:
        ok = False
        body = r.text[:200]
    print(f"{'PASS' if ok else 'FAIL'} [{status}] {method.upper()} {url}")
    if not ok:
        print(f"  -> {body}")
    return body if ok else None

# Test Subjects
print("=== SUBJECTS ===")
test('get', '/academics/subjects')
r = test('post', '/academics/subjects', {'name': 'Mathematics', 'code': 'MATH', 'type': 'theory'})
math_id = r['data']['id'] if r else None

r = test('post', '/academics/subjects', {'name': 'Science', 'code': 'SCI', 'type': 'both'})
sci_id = r['data']['id'] if r else None

r = test('post', '/academics/subjects', {'name': 'English', 'code': 'ENG', 'type': 'theory'})
eng_id = r['data']['id'] if r else None

# Test Exam Types
print("\n=== EXAM TYPES ===")
r = test('post', '/academics/exam-types', {'name': 'Unit Test 1', 'code': 'UT1', 'weightage': 20})
ut_id = r['data']['id'] if r else None

r = test('post', '/academics/exam-types', {'name': 'Half Yearly', 'code': 'HY', 'weightage': 40})

# Test Grading System
print("\n=== GRADING SYSTEM ===")
r = test('post', '/academics/grading-systems', {
    'name': 'CBSE Grading',
    'type': 'percentage',
    'is_default': True,
    'grades': [
        {'name': 'A1', 'min_marks': 91, 'max_marks': 100, 'grade_point': 10, 'description': 'Outstanding', 'is_passing': True},
        {'name': 'A2', 'min_marks': 81, 'max_marks': 90, 'grade_point': 9, 'description': 'Excellent', 'is_passing': True},
        {'name': 'B1', 'min_marks': 71, 'max_marks': 80, 'grade_point': 8, 'description': 'Very Good', 'is_passing': True},
        {'name': 'B2', 'min_marks': 61, 'max_marks': 70, 'grade_point': 7, 'description': 'Good', 'is_passing': True},
        {'name': 'C1', 'min_marks': 51, 'max_marks': 60, 'grade_point': 6, 'description': 'Above Average', 'is_passing': True},
        {'name': 'C2', 'min_marks': 41, 'max_marks': 50, 'grade_point': 5, 'description': 'Average', 'is_passing': True},
        {'name': 'D', 'min_marks': 33, 'max_marks': 40, 'grade_point': 4, 'description': 'Below Average', 'is_passing': True},
        {'name': 'E', 'min_marks': 0, 'max_marks': 32, 'grade_point': 0, 'description': 'Fail', 'is_passing': False},
    ]
})
gs_id = r['data']['id'] if r else None

# Test Exam Halls
print("\n=== EXAM HALLS ===")
test('post', '/academics/exam-halls', {'name': 'Hall A', 'building': 'Main Block', 'capacity': 40, 'rows': 8, 'columns': 5, 'has_cctv': True})
test('post', '/academics/exam-halls', {'name': 'Hall B', 'building': 'Main Block', 'capacity': 30, 'rows': 6, 'columns': 5})

# Test Create Exam
print("\n=== EXAMS ===")
r = test('post', '/academics/exams', {
    'name': 'Unit Test 1 - 2025',
    'exam_type_id': ut_id,
    'grading_system_id': gs_id,
    'academic_year_id': 1,
    'start_date': '2025-07-15',
    'end_date': '2025-07-20',
    'description': 'First unit test of the session',
    'instructions': 'Use blue/black pen only. No calculator allowed.'
})
exam_id = r['data']['id'] if r else None

# Add schedules
print("\n=== EXAM SCHEDULES ===")
if exam_id and math_id:
    test('post', f'/academics/exams/{exam_id}/schedules', {
        'class_id': 1, 'subject_id': math_id, 'exam_date': '2025-07-15',
        'start_time': '09:00', 'end_time': '11:00', 'max_marks': 100, 'passing_marks': 33
    })
if exam_id and sci_id:
    test('post', f'/academics/exams/{exam_id}/schedules', {
        'class_id': 1, 'subject_id': sci_id, 'exam_date': '2025-07-17',
        'start_time': '09:00', 'end_time': '11:00', 'max_marks': 100, 'passing_marks': 33
    })
if exam_id and eng_id:
    test('post', f'/academics/exams/{exam_id}/schedules', {
        'class_id': 1, 'subject_id': eng_id, 'exam_date': '2025-07-19',
        'start_time': '09:00', 'end_time': '11:00', 'max_marks': 100, 'passing_marks': 33
    })

# Get exam detail
print("\n=== EXAM DETAIL ===")
if exam_id:
    test('get', f'/academics/exams/{exam_id}')

# Test timetable
print("\n=== TIMETABLE ===")
test('get', '/academics/timetable')

# Test exam groups
print("\n=== EXAM GROUPS ===")
test('get', '/academics/exam-groups')

# Dashboard again - should have data now
print("\n=== DASHBOARD (with data) ===")
r = test('get', '/academics/exam-dashboard')
if r:
    stats = r['data']['stats']
    print(f"  Exams: {stats['total_exams']}, Subjects: {stats['total_subjects']}, Halls: {stats['total_halls']}")

print("\n=== ALL TESTS COMPLETE ===")
