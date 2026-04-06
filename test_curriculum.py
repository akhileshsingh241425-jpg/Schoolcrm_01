import requests
import json

BASE = 'http://localhost:5000/api'

# Login
r = requests.post(f'{BASE}/auth/login', json={'school_code': 'Sikarwar', 'email': 'akhileshsingh241425@gmail.com', 'password': 'admin123'})
token = r.json()['data']['access_token']
h = {'Authorization': f'Bearer {token}'}
print(f"Login: {r.status_code}")

# Get class and subject IDs
classes = requests.get(f'{BASE}/students/classes', headers=h).json().get('data', [])
class_id = classes[0]['id'] if classes else None
subjects = requests.get(f'{BASE}/academics/subjects', headers=h).json().get('data', [])
subject_id = subjects[0]['id'] if subjects else None
print(f"Class ID: {class_id}, Subject ID: {subject_id}")

results = []

def test(name, method, url, data=None):
    try:
        if method == 'GET':
            r = requests.get(url, headers=h)
        elif method == 'POST':
            r = requests.post(url, json=data, headers=h)
        elif method == 'PUT':
            r = requests.put(url, json=data, headers=h)
        elif method == 'DELETE':
            r = requests.delete(url, headers=h)
        status = '✓' if r.status_code in [200, 201] else '✗'
        results.append((status, name, r.status_code))
        print(f"  {status} {name}: {r.status_code}")
        return r
    except Exception as e:
        results.append(('✗', name, str(e)))
        print(f"  ✗ {name}: {e}")
        return None

print("\n=== SYLLABUS ===")
r = test("List Syllabus", "GET", f"{BASE}/academics/syllabus")
r = test("Create Syllabus", "POST", f"{BASE}/academics/syllabus", {
    "class_id": class_id, "subject_id": subject_id, "chapter_number": 1,
    "chapter_name": "Introduction to Python", "topics": "Variables, Data Types, Operators",
    "learning_objectives": "Understand basics", "estimated_hours": 10, "term": "term1"
})
syl_id = r.json().get('data', {}).get('id') if r and r.status_code in [200, 201] else None
if syl_id:
    test("Get Syllabus", "GET", f"{BASE}/academics/syllabus/{syl_id}")
    test("Update Syllabus", "PUT", f"{BASE}/academics/syllabus/{syl_id}", {"chapter_name": "Intro to Python Basics"})
    test("Add Progress", "POST", f"{BASE}/academics/syllabus/{syl_id}/progress", {
        "date": "2025-01-15", "topics_covered": "Variables", "hours_spent": 2,
        "percentage_covered": 30, "teaching_method": "lecture"
    })
test("Syllabus Overview", "GET", f"{BASE}/academics/syllabus-overview")

print("\n=== LESSON PLANS ===")
r = test("List Lesson Plans", "GET", f"{BASE}/academics/lesson-plans")
r = test("Create Lesson Plan", "POST", f"{BASE}/academics/lesson-plans", {
    "class_id": class_id, "subject_id": subject_id, "title": "Variables & Data Types",
    "date": "2025-01-20", "period_number": 1, "duration_minutes": 40,
    "topic": "Python Variables", "objectives": "Learn variable declaration",
    "teaching_methodology": "Interactive coding", "status": "submitted"
})
lp_id = r.json().get('data', {}).get('id') if r and r.status_code in [200, 201] else None
if lp_id:
    test("Get Lesson Plan", "GET", f"{BASE}/academics/lesson-plans/{lp_id}")
    test("Update Lesson Plan", "PUT", f"{BASE}/academics/lesson-plans/{lp_id}", {"title": "Variables Introduction"})
    test("Approve Lesson Plan", "POST", f"{BASE}/academics/lesson-plans/{lp_id}/approve", {"action": "approve"})

print("\n=== HOMEWORK ===")
r = test("List Homework", "GET", f"{BASE}/academics/homework")
r = test("Create Homework", "POST", f"{BASE}/academics/homework", {
    "class_id": class_id, "subject_id": subject_id, "title": "Practice Variables",
    "description": "Complete exercises on variables", "homework_type": "assignment",
    "due_date": "2025-01-25", "max_marks": 20
})
hw_id = r.json().get('data', {}).get('id') if r and r.status_code in [200, 201] else None
if hw_id:
    test("Get Homework", "GET", f"{BASE}/academics/homework/{hw_id}")
    test("Update Homework", "PUT", f"{BASE}/academics/homework/{hw_id}", {"title": "Variable Exercises"})

print("\n=== STUDY MATERIALS ===")
r = test("List Materials", "GET", f"{BASE}/academics/study-materials")
r = test("Create Material", "POST", f"{BASE}/academics/study-materials", {
    "class_id": class_id, "subject_id": subject_id, "title": "Python Cheat Sheet",
    "description": "Quick reference guide", "material_type": "pdf",
    "file_url": "https://example.com/python.pdf", "tags": "python,beginner"
})
mat_id = r.json().get('data', {}).get('id') if r and r.status_code in [200, 201] else None
if mat_id:
    test("Get Material", "GET", f"{BASE}/academics/study-materials/{mat_id}")
    test("Update Material", "PUT", f"{BASE}/academics/study-materials/{mat_id}", {"title": "Python Quick Reference"})

print("\n=== CALENDAR ===")
r = test("Get Calendar", "GET", f"{BASE}/academics/calendar")
r = test("Create Event", "POST", f"{BASE}/academics/calendar", {
    "title": "Republic Day", "event_type": "holiday", "start_date": "2025-01-26",
    "is_holiday": True, "applies_to": "all", "description": "National holiday"
})
evt_id = r.json().get('data', {}).get('id') if r and r.status_code in [200, 201] else None
if evt_id:
    test("Update Event", "PUT", f"{BASE}/academics/calendar/{evt_id}", {"title": "Republic Day Holiday"})

print("\n=== TEACHER SUBJECTS ===")
r = test("List Teacher Subjects", "GET", f"{BASE}/academics/teacher-subjects")
r = test("Create Teacher Subject", "POST", f"{BASE}/academics/teacher-subjects", {
    "class_id": class_id, "subject_id": subject_id
})
ts_id = r.json().get('data', {}).get('id') if r and r.status_code in [200, 201] else None
if ts_id:
    test("Update Teacher Subject", "PUT", f"{BASE}/academics/teacher-subjects/{ts_id}", {"is_class_teacher": True})

print("\n=== ELECTIVES ===")
r = test("List Elective Groups", "GET", f"{BASE}/academics/elective-groups")
r = test("Create Elective Group", "POST", f"{BASE}/academics/elective-groups", {
    "name": "Science Electives", "class_id": class_id, "max_selections": 2,
    "selection_deadline": "2025-02-15"
})
eg_id = r.json().get('data', {}).get('id') if r and r.status_code in [200, 201] else None

print("\n=== CURRICULUM DASHBOARD ===")
test("Dashboard", "GET", f"{BASE}/academics/curriculum-dashboard")

print("\n" + "="*50)
passed = sum(1 for s, _, _ in results if s == '✓')
failed = sum(1 for s, _, _ in results if s == '✗')
print(f"RESULTS: {passed} passed, {failed} failed out of {len(results)}")
if failed:
    print("\nFailed endpoints:")
    for s, name, code in results:
        if s == '✗':
            print(f"  - {name}: {code}")
