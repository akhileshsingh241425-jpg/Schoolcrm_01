import requests

login = requests.post('http://localhost:5000/api/auth/login', json={
    'school_code': 'Sikarwar',
    'email': 'akhileshsingh241425@gmail.com',
    'password': 'admin123'
})
token = login.json()['data']['access_token']
h = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

# Create Academic Years
for ay_data in [
    {'name': '2025-26', 'start_date': '2025-04-01', 'end_date': '2026-03-31', 'is_current': True},
    {'name': '2026-27', 'start_date': '2026-04-01', 'end_date': '2027-03-31', 'is_current': False},
]:
    r = requests.post('http://localhost:5000/api/students/academic-years', headers=h, json=ay_data)
    print(f"AY {ay_data['name']}: {r.status_code}")

# Create Classes (Nursery to 12th)
classes = [
    ('Nursery', 0), ('LKG', 0), ('UKG', 0),
    ('Class 1', 1), ('Class 2', 2), ('Class 3', 3), ('Class 4', 4), ('Class 5', 5),
    ('Class 6', 6), ('Class 7', 7), ('Class 8', 8), ('Class 9', 9), ('Class 10', 10),
    ('Class 11', 11), ('Class 12', 12),
]
for name, num in classes:
    r = requests.post('http://localhost:5000/api/students/classes', headers=h, json={
        'name': name, 'numeric_name': num
    })
    print(f"{name}: {r.status_code}")

# Create Sections (A, B, C) for each class
r = requests.get('http://localhost:5000/api/students/classes', headers=h)
cls_list = r.json()['data']
for cls in cls_list:
    for sec_name in ['A', 'B', 'C']:
        requests.post('http://localhost:5000/api/students/sections', headers=h, json={
            'class_id': cls['id'], 'name': sec_name, 'capacity': 40
        })
    print(f"{cls['name']}: sections A, B, C created")

print("\nDONE! All classes, sections, and academic years created.")
