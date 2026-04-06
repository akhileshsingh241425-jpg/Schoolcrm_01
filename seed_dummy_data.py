#!/usr/bin/env python3
"""
Comprehensive School CRM Seed Data Generator
- 10,000+ Students (Nursery to Class 12, all streams)
- 120 Staff (teaching + non-teaching + admin)
- Full 1-year data (April 2025 - March 2026)
- ALL modules: Attendance, Fees, Exams, Library, Hostel, Canteen, Sports,
  Health, Transport, Inventory, Communication, Leads, Admissions, Payroll, etc.
"""

import pymysql
import random
import json
from datetime import date, datetime, time, timedelta
from collections import defaultdict
import time as tm
import sys

random.seed(42)
t0 = tm.time()

# ═══════════════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════════════
S = 2       # school_id
AY = 1      # academic_year_id
U = 1       # admin user_id
BATCH = 5000

conn = pymysql.connect(
    host='localhost', user='root', password='root', database='school_crm',
    charset='utf8mb4', autocommit=False,
    connect_timeout=600, read_timeout=600, write_timeout=600
)
cur = conn.cursor()

# ═══════════════════════════════════════════════════════════════════════
# DATA CONSTANTS
# ═══════════════════════════════════════════════════════════════════════
MN = ['Aarav','Vivaan','Aditya','Vihaan','Arjun','Reyansh','Sai','Arnav','Dhruv','Krishna',
      'Kabir','Shaurya','Atharva','Ayaan','Rudra','Harsh','Manav','Yash','Dev','Ishaan',
      'Rohan','Ansh','Rishi','Pranav','Sahil','Kunal','Rahul','Amit','Vikram','Raj',
      'Suresh','Mahesh','Ganesh','Deepak','Sanjay','Nikhil','Pradeep','Rakesh','Pankaj','Vishal',
      'Akash','Ankur','Varun','Gaurav','Mohit','Sumit','Ashish','Aman','Sachin','Tushar',
      'Himanshu','Lokesh','Mayank','Shivam','Rishabh','Yuvraj','Laksh','Tanmay','Parth','Vedant']
FN = ['Saanvi','Aanya','Aadhya','Ananya','Pari','Anika','Navya','Diya','Kiara','Myra',
      'Sara','Ira','Ahana','Anvi','Prisha','Riya','Aisha','Divya','Sneha','Pooja',
      'Priya','Neha','Shreya','Kavya','Tanvi','Sakshi','Isha','Nisha','Meera','Sanya',
      'Tanya','Jiya','Mahi','Nitya','Avni','Pihu','Tara','Rashmi','Sunita','Rekha',
      'Shweta','Pallavi','Deepika','Komal','Suman','Archana','Garima','Jyoti','Kiran','Nandini',
      'Padma','Rachna','Roshni','Swati','Trisha','Urmi','Vandana','Yamini','Zoya','Simran']
LN = ['Sharma','Verma','Singh','Kumar','Gupta','Patel','Joshi','Agarwal','Mishra','Pandey',
      'Tiwari','Dubey','Chauhan','Yadav','Rajput','Thakur','Saxena','Srivastava','Trivedi','Shukla',
      'Mehta','Shah','Jain','Chopra','Malhotra','Kapoor','Khanna','Das','Sen','Ghosh',
      'Roy','Patil','Deshmukh','Kulkarni','Kaur','Gill','Sethi','Bhatia','Arora','Bajaj']
FP = ['Rajesh','Sunil','Anil','Sanjay','Mukesh','Ramesh','Dinesh','Mahesh','Naresh','Vijay',
      'Ajay','Pramod','Ashok','Vinod','Rakesh','Harish','Satish','Girish','Manoj','Pawan']
MP = ['Sunita','Anita','Kavita','Savita','Geeta','Seema','Meena','Neena','Reena','Poonam',
      'Suman','Renu','Madhu','Pushpa','Kamla','Shanti','Sarla','Usha','Asha','Nirmala']
BG = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
CITIES = ['Delhi','Mumbai','Lucknow','Pune','Jaipur','Bhopal','Indore','Kanpur','Noida','Gurgaon',
          'Varanasi','Agra','Allahabad','Meerut','Gwalior','Mathura','Bareilly','Faridabad','Ghaziabad','Dehradun']
STATES = ['Delhi','Maharashtra','Uttar Pradesh','Rajasthan','Madhya Pradesh','Haryana','Punjab','Bihar','Karnataka','Uttarakhand']
OCCUPATIONS = ['Business','Government Service','Private Job','Doctor','Engineer','Teacher','Lawyer',
               'Farmer','Shopkeeper','Army','Police','Bank Employee','Self Employed','Accountant','Contractor']

# Students per section for each class_id
PER_SEC = {1:80, 2:100, 3:100, 4:180, 5:180, 6:180, 7:180, 8:180,
           9:250, 10:250, 11:250, 12:300, 13:300, 14:450, 15:450}
# Total: (80+100+100)*3 + 180*5*3 + 250*3*3 + 300*2*3 + 450*2*3 = 840+2700+2250+1800+2700 = 10290

# Subjects per class
CLASS_SUBS = {
    1: ['English','Hindi','Mathematics','EVS'],
    2: ['English','Hindi','Mathematics','EVS'],
    3: ['English','Hindi','Mathematics','EVS'],
    4: ['English','Hindi','Mathematics','EVS','General Knowledge','Art & Craft','Physical Education','Computer Science'],
    5: ['English','Hindi','Mathematics','EVS','General Knowledge','Art & Craft','Physical Education','Computer Science'],
    6: ['English','Hindi','Mathematics','EVS','General Knowledge','Art & Craft','Physical Education','Computer Science'],
    7: ['English','Hindi','Mathematics','EVS','General Knowledge','Art & Craft','Physical Education','Computer Science'],
    8: ['English','Hindi','Mathematics','EVS','General Knowledge','Art & Craft','Physical Education','Computer Science'],
    9: ['English','Hindi','Mathematics','Science','Social Studies','Sanskrit','Computer Science','Physical Education','Art & Craft'],
    10: ['English','Hindi','Mathematics','Science','Social Studies','Sanskrit','Computer Science','Physical Education','Art & Craft'],
    11: ['English','Hindi','Mathematics','Science','Social Studies','Sanskrit','Computer Science','Physical Education','Art & Craft'],
    12: ['English','Hindi','Mathematics','Science','Social Studies','Computer Science','Physical Education'],
    13: ['English','Hindi','Mathematics','Science','Social Studies','Computer Science','Physical Education'],
}
# Streams for class 14,15 per section offset (0=A=Science, 1=B=Commerce, 2=C=Arts)
STREAM_SUBS = {
    0: ['Physics','Chemistry','Mathematics','English','Hindi','Physical Education','Computer Science'],
    1: ['Accountancy','Business Studies','Economics','English','Hindi','Physical Education','Mathematics'],
    2: ['History','Political Science','Geography','English','Hindi','Physical Education','Sociology'],
}

ALL_SUBJECTS = ['English','Hindi','Mathematics','EVS','General Knowledge','Art & Craft','Physical Education',
                'Computer Science','Science','Social Studies','Sanskrit','Physics','Chemistry','Biology',
                'Accountancy','Business Studies','Economics','History','Political Science','Geography',
                'Sociology','Music','Moral Science','Environmental Education']

# ═══════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════
def bi(table, cols, rows):
    """Batch insert helper"""
    if not rows: return 0
    col_str = ','.join(f'`{c}`' for c in cols)
    ph = ','.join(['%s'] * len(cols))
    sql = f"INSERT INTO `{table}` ({col_str}) VALUES ({ph})"
    total = 0
    for i in range(0, len(rows), BATCH):
        cur.executemany(sql, rows[i:i+BATCH])
        total += len(rows[i:i+BATCH])
    conn.commit()
    return total

def rdate(start, end):
    d = (end - start).days
    return start + timedelta(days=random.randint(0, max(0, d)))

def student_dob(class_id):
    age = class_id + 2
    by = 2025 - age - random.randint(0, 1)
    return date(by, random.randint(1, 12), random.randint(1, 28))

def get_working_days():
    holidays = {date(2025,4,14), date(2025,5,1), date(2025,8,15), date(2025,8,16),
                date(2025,10,2), date(2025,10,12), date(2025,10,20), date(2025,10,21),
                date(2025,10,22), date(2025,11,5), date(2025,12,25),
                date(2026,1,26), date(2026,3,14), date(2026,3,31)}
    vac = [(date(2025,5,16), date(2025,6,30)), (date(2025,12,26), date(2026,1,5))]
    days = []
    d = date(2025, 4, 1)
    while d <= date(2026, 3, 31):
        if d.weekday() < 6 and d not in holidays:
            if not any(vs <= d <= ve for vs, ve in vac):
                days.append(d)
        d += timedelta(days=1)
    return days

def grade_for(pct):
    if pct >= 90: return 'A+', 10.0
    if pct >= 80: return 'A', 9.0
    if pct >= 70: return 'B+', 8.0
    if pct >= 60: return 'B', 7.0
    if pct >= 50: return 'C+', 6.0
    if pct >= 40: return 'C', 5.0
    if pct >= 33: return 'D', 4.0
    return 'F', 0.0

def elapsed():
    return f"[{tm.time()-t0:.0f}s]"

# ═══════════════════════════════════════════════════════════════════════
# VERIFY PREREQUISITES
# ═══════════════════════════════════════════════════════════════════════
print("Verifying prerequisites...")
cur.execute("SELECT id, name FROM classes WHERE school_id=%s ORDER BY id", (S,))
classes = cur.fetchall()
cur.execute("SELECT id, class_id, name FROM sections WHERE school_id=%s ORDER BY class_id, id", (S,))
sections = cur.fetchall()
print(f"  Found {len(classes)} classes, {len(sections)} sections")
if len(classes) < 15 or len(sections) < 45:
    print("ERROR: Need at least 15 classes and 45 sections. Run seed_classes.py first.")
    sys.exit(1)

# Build section lookup: class_id -> [(section_id, section_name), ...]
sec_map = defaultdict(list)
for sid, cid, sname in sections:
    sec_map[cid].append((sid, sname))

# ═══════════════════════════════════════════════════════════════════════
# PHASE 1: CLEAN ALL EXISTING DATA
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 1: Cleaning ALL existing data for school_id=2")
print(f"{'='*60}")
cur.execute("SET FOREIGN_KEY_CHECKS=0")
conn.commit()

# Truncate large tables first (much faster than DELETE)
large_tables = ['student_attendance','exam_results','fee_installments','fee_payments',
                'staff_attendance','staff_payroll','parent_details']
for big_table in large_tables:
    try:
        cur.execute(f"TRUNCATE TABLE `{big_table}`")
        conn.commit()
        print(f"    Truncated {big_table}")
    except:
        conn.rollback()

tables_to_clean = [
    'homework_submissions','homework','study_materials',
    'mark_entries','exam_results','exam_seatings','exam_invigilators',
    'exam_admit_cards','exam_incidents','exam_schedules',
    'exam_group_mappings','exam_groups','exams','exam_types','exam_halls',
    'report_cards','grades','grading_systems',
    'syllabus_progress','syllabus','lesson_plans',
    'subject_components','class_subjects','timetable','subjects',
    'student_attendance','staff_attendance','leave_applications','leave_types',
    'late_arrivals','attendance_rules','attendance_devices','event_attendance',
    'fee_receipts','fee_payments','fee_installments','fee_discounts',
    'scholarship_awards','scholarships','fee_structures','fee_categories',
    'reading_history','book_fines','book_reservations','library_issues',
    'book_copies','library_books','library_categories',
    'ebook_resources','periodicals','library_budgets',
    'hostel_inspections','hostel_complaints','hostel_visitors',
    'outpass_requests','mess_attendance','mess_menu',
    'hostel_allocations','hostel_rooms','hostel_blocks',
    'canteen_preorders','canteen_transactions','canteen_wallet',
    'canteen_menu','canteen_inventory','canteen_vendors',
    'temperature_screens','sanitization_logs','wellbeing_records',
    'emergency_contacts','medication_tracking','health_checkups',
    'infirmary_visits','incident_reports','health_records',
    'visitor_logs','safety_drills',
    'speed_alerts','route_change_requests','trip_management',
    'sos_alerts','transport_fees','fuel_logs','vehicle_maintenance',
    'gps_tracking','student_transport','transport_stops',
    'transport_routes','drivers','vehicles',
    'certificates','fitness_records','facility_bookings',
    'club_members','clubs','tournament_matches','tournaments',
    'sports_teams','events','sports',
    'asset_disposals','vendor_quotations','purchase_orders_inv',
    'purchase_requests','inventory_transactions','inventory_items',
    'inventory_categories','asset_maintenance','assets','asset_categories',
    'notifications','announcements','sms_templates',
    'pickup_authorizations','volunteer_registrations','daily_activities',
    'parent_messages','parent_notifications','consent_responses',
    'consent_forms','grievances','feedback_responses','feedback_surveys',
    'ptm_bookings','ptm_slots','parent_profiles',
    'duty_rosters','training_records','job_applications','recruitments',
    'performance_reviews','staff_leave_balances','staff_leaves',
    'staff_payroll','salary_structures','staff_documents',
    'lead_activities','lead_followups','leads','campaigns','lead_sources',
    'admission_test_results','admission_tests','admission_waitlists',
    'seat_matrix','admission_status_history','admission_documents',
    'admissions','admission_settings',
    'student_timeline','student_counseling','student_medical',
    'student_achievements','student_behaviors','student_documents',
    'student_promotions','alumni','parent_details',
    'student_houses','students','staff',
]
cleaned = 0
for t in tables_to_clean:
    try:
        cur.execute(f"DELETE FROM `{t}` WHERE school_id=%s", (S,))
        if cur.rowcount > 0:
            cleaned += cur.rowcount
            conn.commit()
    except:
        try:
            conn.rollback()
            cur.execute(f"DELETE FROM `{t}`")
            cleaned += cur.rowcount
            conn.commit()
        except:
            conn.rollback()
cur.execute("SET FOREIGN_KEY_CHECKS=1")
conn.commit()
print(f"  Cleaned {cleaned} records from {len(tables_to_clean)} tables {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 2: REFERENCE DATA
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 2: Reference Data (Subjects, Houses, Leave Types, etc.)")
print(f"{'='*60}")

# --- Student Houses ---
houses_data = [
    (S, 'Red Lions', '#FF0000', 'Courage and Strength'),
    (S, 'Blue Eagles', '#0000FF', 'Wisdom and Vision'),
    (S, 'Green Tigers', '#00FF00', 'Growth and Energy'),
    (S, 'Yellow Hawks', '#FFFF00', 'Brilliance and Speed'),
]
bi('student_houses', ['school_id','name','color','motto'], houses_data)
cur.execute("SELECT id FROM student_houses WHERE school_id=%s ORDER BY id", (S,))
house_ids = [r[0] for r in cur.fetchall()]
print(f"  Student Houses: {len(house_ids)}")

# --- Subjects ---
sub_types = {'Art & Craft':'practical','Physical Education':'practical','Music':'practical',
             'Physics':'both','Chemistry':'both','Biology':'both','Computer Science':'both','Science':'both'}
sub_rows = []
for i, name in enumerate(ALL_SUBJECTS):
    code = name[:3].upper() + str(i+1).zfill(2)
    stype = sub_types.get(name, 'theory')
    sub_rows.append((S, name, code, stype, 1))
bi('subjects', ['school_id','name','code','type','is_active'], sub_rows)
cur.execute("SELECT id, name FROM subjects WHERE school_id=%s", (S,))
sub_map = {n: i for i, n in cur.fetchall()}
print(f"  Subjects: {len(sub_map)}")

# --- Leave Types ---
leave_types = [
    (S, 'Casual Leave', 'CL', 'both', 12, 0, 1, 0),
    (S, 'Sick Leave', 'SL', 'both', 10, 1, 1, 0),
    (S, 'Earned Leave', 'EL', 'staff', 15, 0, 1, 1),
    (S, 'Maternity Leave', 'ML', 'staff', 180, 1, 1, 0),
    (S, 'Paternity Leave', 'PL', 'staff', 15, 0, 1, 0),
    (S, 'Study Leave', 'STL', 'students', 30, 0, 0, 0),
    (S, 'Medical Leave', 'MDL', 'both', 20, 1, 1, 0),
]
bi('leave_types', ['school_id','name','code','applies_to','max_days_per_year','requires_document','is_paid','carry_forward'], leave_types)
cur.execute("SELECT id, code FROM leave_types WHERE school_id=%s", (S,))
lt_map = {c: i for i, c in cur.fetchall()}
print(f"  Leave Types: {len(lt_map)}")

# --- Exam Types ---
exam_types = [
    (S, 'Unit Test 1', 'UT1', 15, 1, 1),
    (S, 'Half Yearly', 'HY', 30, 1, 2),
    (S, 'Unit Test 2', 'UT2', 15, 1, 3),
    (S, 'Annual Exam', 'AN', 40, 1, 4),
]
bi('exam_types', ['school_id','name','code','weightage','is_active','display_order'], exam_types)
cur.execute("SELECT id, code FROM exam_types WHERE school_id=%s", (S,))
et_map = {c: i for i, c in cur.fetchall()}
print(f"  Exam Types: {len(et_map)}")

# --- Grading System ---
cur.execute("INSERT INTO grading_systems (school_id,name,type,is_default,is_active) VALUES (%s,'CBSE Percentage','percentage',1,1)", (S,))
conn.commit()
cur.execute("SELECT id FROM grading_systems WHERE school_id=%s LIMIT 1", (S,))
gs_id = cur.fetchone()[0]
grades_data = [
    (gs_id, S, 'A+', 90, 100, 10.0, 'Outstanding', 1, 1),
    (gs_id, S, 'A', 80, 89.99, 9.0, 'Excellent', 1, 2),
    (gs_id, S, 'B+', 70, 79.99, 8.0, 'Very Good', 1, 3),
    (gs_id, S, 'B', 60, 69.99, 7.0, 'Good', 1, 4),
    (gs_id, S, 'C+', 50, 59.99, 6.0, 'Above Average', 1, 5),
    (gs_id, S, 'C', 40, 49.99, 5.0, 'Average', 1, 6),
    (gs_id, S, 'D', 33, 39.99, 4.0, 'Below Average', 1, 7),
    (gs_id, S, 'F', 0, 32.99, 0.0, 'Fail', 0, 8),
]
bi('grades', ['grading_system_id','school_id','name','min_marks','max_marks','grade_point','description','is_passing','display_order'], grades_data)
print(f"  Grading System + 8 Grades")

# --- Fee Categories ---
fee_cats = [
    (S, 'Tuition Fee', 'Monthly tuition fee'),
    (S, 'Annual Charges', 'Annual admission and maintenance'),
    (S, 'Transport Fee', 'School bus/van transport'),
    (S, 'Lab Fee', 'Science and computer lab'),
    (S, 'Computer Fee', 'Computer education'),
    (S, 'Sports Fee', 'Sports and games'),
    (S, 'Library Fee', 'Library membership'),
    (S, 'Exam Fee', 'Examination charges'),
]
bi('fee_categories', ['school_id','name','description'], fee_cats)
cur.execute("SELECT id, name FROM fee_categories WHERE school_id=%s", (S,))
fc_map = {n: i for i, n in cur.fetchall()}
print(f"  Fee Categories: {len(fc_map)}")

# --- Attendance Rules ---
cur.execute("INSERT INTO attendance_rules (school_id, minimum_percentage, alert_threshold, school_start_time, school_end_time, periods_per_day, period_duration_minutes, working_days) VALUES (%s, 75.00, 80.00, '08:00:00', '14:00:00', 8, 40, 'mon,tue,wed,thu,fri,sat')", (S,))
conn.commit()
print(f"  Attendance Rules: 1")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 3: STAFF (120)
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 3: Staff (120 members)")
print(f"{'='*60}")

DEPTS_TEACH = ['English','Hindi','Mathematics','Science','Social Studies','Computer Science',
               'Physical Education','Art & Craft','Sanskrit','Physics','Chemistry','Biology',
               'Commerce','Economics','Music']
DESIG_TEACH = ['PRT','TGT','PGT','Senior Teacher','Head of Department']
DESIG_NON = ['Clerk','Peon','Lab Assistant','Librarian','Nurse','IT Support','Security',
             'Driver','Helper','Cook','Gardener','Store Keeper']
DESIG_ADMIN = ['Principal','Vice Principal','Admin Officer','Accountant','HR Manager',
               'Front Office','Coordinator','Registrar']
QUALIFICATIONS = ['B.Ed','M.Ed','M.A.','M.Sc.','B.A.','B.Sc.','B.Com','M.Com','MBA','MCA','Ph.D.','D.El.Ed','B.Tech']

staff_rows = []
for i in range(120):
    gender = random.choice(['male','female'])
    fn = random.choice(MN if gender == 'male' else FN)
    ln = random.choice(LN)
    dob = date(random.randint(1970, 1998), random.randint(1,12), random.randint(1,28))
    doj = rdate(date(2015,1,1), date(2025,3,31))
    exp = (date(2025,4,1) - doj).days // 365 + random.randint(0,5)
    
    if i < 80:  # Teaching
        stype, dept = 'teaching', random.choice(DEPTS_TEACH)
        desig = random.choice(DESIG_TEACH)
        sal = random.randint(25000, 75000)
    elif i < 100:  # Non-teaching
        stype, dept = 'non_teaching', 'Maintenance'
        desig = DESIG_NON[i % len(DESIG_NON)]
        sal = random.randint(15000, 35000)
    else:  # Admin
        stype, dept = 'admin', 'Administration'
        desig = DESIG_ADMIN[i % len(DESIG_ADMIN)]
        sal = random.randint(30000, 80000)
    
    staff_rows.append((
        S, f'EMP{i+1:04d}', fn, ln, gender, dob,
        f'98{random.randint(10000000,99999999)}',
        f'{fn.lower()}.{ln.lower()}{i}@school.com',
        random.choice(QUALIFICATIONS), exp, desig, dept, doj, sal,
        f'{random.choice(CITIES)}, {random.choice(STATES)}',
        random.choice(CITIES), random.choice(STATES),
        f'{random.randint(1000,9999)}{random.randint(10000000,99999999)}',
        f'ABCDE{random.randint(1000,9999)}F',
        random.choice(['SBI','PNB','HDFC','ICICI','BOB','Axis','Canara']),
        f'{random.randint(10000000000,99999999999)}',
        f'SBIN0{random.randint(10000,99999)}',
        stype, random.choice(['permanent','contract','probation']),
        random.choice(BG),
        random.choice(['single','married','divorced']),
        'active'
    ))

bi('staff', [
    'school_id','employee_id','first_name','last_name','gender','date_of_birth',
    'phone','email','qualification','experience_years','designation','department',
    'date_of_joining','salary','address','city','state','aadhar_no','pan_no',
    'bank_name','bank_account_no','ifsc_code','staff_type','contract_type',
    'blood_group','marital_status','status'
], staff_rows)

cur.execute("SELECT id, staff_type, department, first_name FROM staff WHERE school_id=%s ORDER BY id", (S,))
staff_all = cur.fetchall()
staff_ids = [r[0] for r in staff_all]
teaching_ids = [r[0] for r in staff_all if r[1] == 'teaching']
print(f"  Staff created: {len(staff_ids)} (Teaching: {len(teaching_ids)}) {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 4: STUDENTS (10,290)
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 4: Students (10,290)")
print(f"{'='*60}")

student_rows = []
seq = 0
for class_id in range(1, 16):
    per_sec = PER_SEC[class_id]
    for sec_offset, (section_id, sec_name) in enumerate(sec_map[class_id]):
        for i in range(per_sec):
            seq += 1
            gender = random.choice(['male','female'])
            fn = random.choice(MN if gender == 'male' else FN)
            ln = random.choice(LN)
            dob = student_dob(class_id)
            tm_mode = random.choice([None, 'bus', 'van', 'self', 'walk'])
            student_rows.append((
                S, f'ADM2025{seq:05d}', str(i+1), fn, ln, gender, dob,
                random.choice(BG), random.choice(['Hindu','Muslim','Sikh','Christian','Jain','Buddhist']),
                random.choice(['General','OBC','SC','ST']),
                'Indian', f'{random.randint(1000,9999)}{random.randint(10000000,99999999)}',
                f'{random.randint(1,999)}, {random.choice(["MG Road","Station Road","Civil Lines","Gandhi Nagar","Nehru Colony","Rajendra Nagar","Shastri Nagar","Patel Nagar"])}, {random.choice(CITIES)}',
                random.choice(CITIES), random.choice(STATES), f'{random.randint(110000,499999)}',
                class_id, section_id, AY, date(2025,4,1), 'active',
                random.choice(['Hindi','English','Urdu','Punjabi','Bengali']),
                f'98{random.randint(10000000,99999999)}', f'{random.choice(FP)} {ln}',
                tm_mode, random.choice(house_ids), 100
            ))

bi('students', [
    'school_id','admission_no','roll_no','first_name','last_name','gender','date_of_birth',
    'blood_group','religion','category','nationality','aadhar_no','address','city','state','pincode',
    'current_class_id','current_section_id','academic_year_id','admission_date','status',
    'mother_tongue','emergency_contact','emergency_person','transport_mode','house_id','behavior_points'
], student_rows)
print(f"  Students inserted: {len(student_rows)} {elapsed()}")

# Get student data for FK references
cur.execute("SELECT id, current_class_id, current_section_id FROM students WHERE school_id=%s", (S,))
student_data = cur.fetchall()
students_by_class = defaultdict(list)
students_by_section = defaultdict(list)
for sid, cid, secid in student_data:
    students_by_class[cid].append(sid)
    students_by_section[(cid, secid)].append(sid)
print(f"  Indexed {len(student_data)} students by class/section")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 5: PARENT DETAILS (2 per student = ~20,580)
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 5: Parent Details")
print(f"{'='*60}")

parent_rows = []
for sid, cid, secid in student_data:
    ln = random.choice(LN)
    # Father
    parent_rows.append((
        sid, S, 'father', f'{random.choice(FP)} {ln}',
        f'98{random.randint(10000000,99999999)}',
        f'{random.choice(FP).lower()}.{ln.lower()}{sid}@gmail.com',
        random.choice(OCCUPATIONS),
        random.choice(['2-5 Lakh','5-10 Lakh','10-20 Lakh','Above 20 Lakh']),
    ))
    # Mother
    parent_rows.append((
        sid, S, 'mother', f'{random.choice(MP)} {ln}',
        f'98{random.randint(10000000,99999999)}',
        f'{random.choice(MP).lower()}.{ln.lower()}{sid}@gmail.com',
        random.choice(['Homemaker'] + OCCUPATIONS[:8]),
        random.choice(['2-5 Lakh','5-10 Lakh','Below 2 Lakh']),
    ))

n = bi('parent_details', ['student_id','school_id','relation','name','phone','email','occupation','income'], parent_rows)
print(f"  Parent Details: {n} {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 6: CLASS SUBJECTS & TIMETABLE
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 6: Class Subjects & Timetable")
print(f"{'='*60}")

cs_rows = []
for class_id in range(1, 14):
    for sub_name in CLASS_SUBS[class_id]:
        if sub_name in sub_map:
            cs_rows.append((S, class_id, sub_map[sub_name], random.choice(teaching_ids)))
for class_id in [14, 15]:
    all_subs_for_class = set()
    for stream_subs in STREAM_SUBS.values():
        all_subs_for_class.update(stream_subs)
    for sub_name in all_subs_for_class:
        if sub_name in sub_map:
            cs_rows.append((S, class_id, sub_map[sub_name], random.choice(teaching_ids)))
bi('class_subjects', ['school_id','class_id','subject_id','teacher_id'], cs_rows)
print(f"  Class Subjects: {len(cs_rows)}")

# Timetable
DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday']
PERIODS = [(time(8,0), time(8,40)), (time(8,40), time(9,20)), (time(9,20), time(10,0)),
           (time(10,0), time(10,40)), (time(11,0), time(11,40)), (time(11,40), time(12,20)),
           (time(12,20), time(13,0)), (time(13,0), time(13,40))]

tt_rows = []
for class_id in range(1, 16):
    if class_id <= 13:
        subs_for_class = [sub_map[s] for s in CLASS_SUBS[class_id] if s in sub_map]
    else:
        subs_for_class = list(set(sub_map[s] for ss in STREAM_SUBS.values() for s in ss if s in sub_map))
    
    for section_id, sec_name in sec_map[class_id]:
        period_idx = 0
        for day in DAYS:
            for pnum, (st, et) in enumerate(PERIODS):
                sub_id = subs_for_class[period_idx % len(subs_for_class)]
                period_idx += 1
                tt_rows.append((S, class_id, section_id, sub_id, random.choice(teaching_ids),
                               day, st, et, f'{class_id}{sec_name[0] if isinstance(sec_name, str) else "A"}',
                               pnum+1, 0, AY))

bi('timetable', ['school_id','class_id','section_id','subject_id','teacher_id',
                 'day_of_week','start_time','end_time','room_no','period_number','is_break','academic_year_id'], tt_rows)
print(f"  Timetable: {len(tt_rows)} {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 7: STUDENT ATTENDANCE (Full Year - ~2.6M records)
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 7: Student Attendance (Full Year via INSERT...SELECT)")
print(f"{'='*60}")

working_days = get_working_days()
print(f"  Working days: {len(working_days)}")
print(f"  Expected records: ~{len(working_days) * len(student_data):,}")

att_sql = """
INSERT INTO student_attendance (student_id, school_id, class_id, section_id, date, status, capture_mode, marked_by)
SELECT t.id, t.school_id, t.cid, t.secid, %s,
       CASE
           WHEN t.r < 0.85 THEN 'present'
           WHEN t.r < 0.93 THEN 'absent'
           WHEN t.r < 0.97 THEN 'late'
           WHEN t.r < 0.99 THEN 'half_day'
           ELSE 'leave'
       END,
       'manual', %s
FROM (
    SELECT id, school_id, current_class_id AS cid, current_section_id AS secid, RAND() AS r
    FROM students WHERE school_id = %s
) t
"""

for i, d in enumerate(working_days):
    cur.execute(att_sql, (d, U, S))
    if (i+1) % 20 == 0:
        conn.commit()
        print(f"    {i+1}/{len(working_days)} days done... {elapsed()}")
conn.commit()
print(f"  Student attendance complete! ~{len(working_days) * len(student_data):,} records {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 8: STAFF ATTENDANCE (~31K records)
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 8: Staff Attendance")
print(f"{'='*60}")

sa_rows = []
for staff_id in staff_ids:
    for d in working_days:
        r = random.random()
        status = 'present' if r < 0.90 else 'absent' if r < 0.95 else 'late' if r < 0.98 else 'half_day'
        ci = time(random.randint(7,8), random.choice([0,15,30,45])) if status != 'absent' else None
        co = time(random.randint(14,16), random.choice([0,15,30,45])) if status != 'absent' else None
        sa_rows.append((staff_id, S, d, status, ci, co, 'manual'))

bi('staff_attendance', ['staff_id','school_id','date','status','check_in','check_out','capture_mode'], sa_rows)
print(f"  Staff Attendance: {len(sa_rows)} {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 9: FEE STRUCTURES, INSTALLMENTS & PAYMENTS
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 9: Fees (Structures, Installments, Payments)")
print(f"{'='*60}")

# Fee amounts by class
fee_amounts = {
    'Tuition Fee':     {1:1500, 2:1800, 3:1800, 4:2000, 5:2000, 6:2000, 7:2000, 8:2000, 9:2500, 10:2500, 11:2500, 12:3000, 13:3000, 14:3500, 15:3500},
    'Annual Charges':  {c: 5000 for c in range(1,16)},
    'Transport Fee':   {c: 1500 for c in range(1,16)},
    'Lab Fee':         {c: 3000 if c >= 9 else 2000 if c >= 4 else 0 for c in range(1,16)},
    'Computer Fee':    {c: 2000 if c >= 4 else 0 for c in range(1,16)},
    'Sports Fee':      {c: 1500 for c in range(1,16)},
    'Library Fee':     {c: 1000 for c in range(1,16)},
    'Exam Fee':        {c: 2000 if c >= 9 else 1500 for c in range(1,16)},
}

fs_rows = []
for cat_name, amounts in fee_amounts.items():
    cat_id = fc_map.get(cat_name)
    if not cat_id: continue
    freq = 'monthly' if cat_name == 'Tuition Fee' else 'yearly'
    for class_id in range(1, 16):
        amt = amounts.get(class_id, 0)
        if amt <= 0: continue
        due = date(2025, 4, 15) if freq == 'yearly' else date(2025, 4, 10)
        fs_rows.append((S, AY, class_id, cat_id, amt, due, freq, 0, 1))

bi('fee_structures', ['school_id','academic_year_id','class_id','fee_category_id','amount','due_date','frequency','late_fee_amount','is_active'], fs_rows)
cur.execute("SELECT id, class_id, fee_category_id, amount, frequency FROM fee_structures WHERE school_id=%s", (S,))
fee_structs = cur.fetchall()
print(f"  Fee Structures: {len(fee_structs)}")

# Fee installments & payments
fi_rows = []
fp_rows = []
receipt_no = 1000

for fs_id, class_id, fc_id, amount, freq in fee_structs:
    sids = students_by_class.get(class_id, [])
    if freq == 'monthly':
        # 12 monthly installments
        for sid in sids:
            for month in range(12):
                due = date(2025, 4 + month if month < 9 else month - 8, 10)
                if month >= 9:
                    due = date(2026, month - 8, 10)
                paid = random.random() < (0.95 if month < 8 else 0.70)
                status = 'paid' if paid else ('overdue' if month < 8 else 'pending')
                paid_date = rdate(due, due + timedelta(days=15)) if paid else None
                paid_amt = float(amount) if paid else 0
                fi_rows.append((S, sid, fs_id, month+1, float(amount), due, paid_amt, 0, status, paid_date))
                if paid:
                    fp_rows.append((S, sid, fs_id, None, float(amount), 0, 0, float(amount),
                                   paid_date, random.choice(['cash','online','upi','bank_transfer']),
                                   f'TXN{receipt_no}', f'RCP{receipt_no}', 'completed'))
                    receipt_no += 1
    else:
        # Yearly: 1 installment
        for sid in sids:
            paid = random.random() < 0.85
            due = date(2025, 4, 15)
            status = 'paid' if paid else 'pending'
            paid_date = rdate(date(2025,4,1), date(2025,5,15)) if paid else None
            fi_rows.append((S, sid, fs_id, 1, float(amount), due, float(amount) if paid else 0, 0, status, paid_date))
            if paid:
                fp_rows.append((S, sid, fs_id, None, float(amount), 0, 0, float(amount),
                               paid_date, random.choice(['cash','online','upi','bank_transfer']),
                               f'TXN{receipt_no}', f'RCP{receipt_no}', 'completed'))
                receipt_no += 1

    # Insert in batches to manage memory
    if len(fi_rows) > 50000:
        bi('fee_installments', ['school_id','student_id','fee_structure_id','installment_no','amount','due_date','paid_amount','late_fee','status','paid_date'], fi_rows)
        fi_rows = []
    if len(fp_rows) > 50000:
        bi('fee_payments', ['school_id','student_id','fee_structure_id','installment_id','amount_paid','late_fee_paid','discount_amount','total_amount','payment_date','payment_mode','transaction_id','receipt_no','status'], fp_rows)
        fp_rows = []

if fi_rows:
    bi('fee_installments', ['school_id','student_id','fee_structure_id','installment_no','amount','due_date','paid_amount','late_fee','status','paid_date'], fi_rows)
if fp_rows:
    bi('fee_payments', ['school_id','student_id','fee_structure_id','installment_id','amount_paid','late_fee_paid','discount_amount','total_amount','payment_date','payment_mode','transaction_id','receipt_no','status'], fp_rows)

cur.execute("SELECT COUNT(*) FROM fee_installments WHERE school_id=%s", (S,))
fi_count = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM fee_payments WHERE school_id=%s", (S,))
fp_count = cur.fetchone()[0]
print(f"  Fee Installments: {fi_count:,}, Payments: {fp_count:,} {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 10: EXAMS & RESULTS
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 10: Exams, Schedules & Results")
print(f"{'='*60}")

exam_dates = {
    'UT1': (date(2025,7,14), date(2025,7,25)),
    'HY':  (date(2025,10,6), date(2025,10,17)),
    'UT2': (date(2026,1,12), date(2026,1,23)),
    'AN':  (date(2026,3,2), date(2026,3,13)),
}
exam_max = {'UT1': 25, 'HY': 80, 'UT2': 25, 'AN': 100}

# Create exams
exam_rows = []
for code, (sd, ed) in exam_dates.items():
    et_id = et_map[code]
    name = {'UT1':'Unit Test 1 (2025-26)','HY':'Half Yearly Exam (2025-26)',
            'UT2':'Unit Test 2 (2025-26)','AN':'Annual Exam (2025-26)'}[code]
    exam_rows.append((S, name, AY, et_id, gs_id, sd, ed, 'completed', U))
bi('exams', ['school_id','name','academic_year_id','exam_type_id','grading_system_id','start_date','end_date','status','created_by'], exam_rows)
cur.execute("SELECT id, exam_type_id FROM exams WHERE school_id=%s ORDER BY id", (S,))
exams = cur.fetchall()
exam_id_map = {}  # exam_type_id -> exam_id
for eid, etid in exams:
    exam_id_map[etid] = eid
print(f"  Exams: {len(exams)}")

# Create exam schedules
es_rows = []
for code, (sd, ed) in exam_dates.items():
    et_id = et_map[code]
    exam_id = exam_id_map[et_id]
    mm = exam_max[code]
    pm = round(mm * 0.33)
    day_offset = 0
    
    for class_id in range(1, 14):
        subs = CLASS_SUBS.get(class_id, [])
        for j, sub_name in enumerate(subs):
            if sub_name not in sub_map: continue
            exam_dt = sd + timedelta(days=day_offset + j)
            if exam_dt.weekday() == 6: exam_dt += timedelta(days=1)
            es_rows.append((exam_id, S, class_id, sub_map[sub_name], None,
                           exam_dt, time(9,0), time(12,0), mm, pm, 180))
    
    for class_id in [14, 15]:
        for sec_offset, (section_id, sec_name) in enumerate(sec_map[class_id]):
            subs = STREAM_SUBS.get(sec_offset, STREAM_SUBS[0])
            for j, sub_name in enumerate(subs):
                if sub_name not in sub_map: continue
                exam_dt = sd + timedelta(days=day_offset + j)
                if exam_dt.weekday() == 6: exam_dt += timedelta(days=1)
                es_rows.append((exam_id, S, class_id, sub_map[sub_name], section_id,
                               exam_dt, time(9,0), time(12,0), mm, pm, 180))

bi('exam_schedules', ['exam_id','school_id','class_id','subject_id','section_id',
                      'exam_date','start_time','end_time','max_marks','passing_marks','duration_minutes'], es_rows)
cur.execute("SELECT id, exam_id, class_id, subject_id, section_id, max_marks FROM exam_schedules WHERE school_id=%s", (S,))
schedules = cur.fetchall()
print(f"  Exam Schedules: {len(schedules)}")

# Generate exam results via INSERT...SELECT
print("  Generating exam results (INSERT...SELECT per schedule)...")
er_sql_class = """
INSERT INTO exam_results (exam_schedule_id, student_id, school_id, marks_obtained, grade, percentage, is_absent, entered_by)
SELECT {sched_id}, t.sid, {school}, t.mo,
       CASE
           WHEN t.pct >= 90 THEN 'A+' WHEN t.pct >= 80 THEN 'A' WHEN t.pct >= 70 THEN 'B+'
           WHEN t.pct >= 60 THEN 'B' WHEN t.pct >= 50 THEN 'C+' WHEN t.pct >= 40 THEN 'C'
           WHEN t.pct >= 33 THEN 'D' ELSE 'F'
       END,
       t.pct, IF(RAND() < 0.02, 1, 0), {user}
FROM (
    SELECT id AS sid,
           ROUND({mm} * LEAST(1.0, GREATEST(0.15, 0.3 + 0.35 * (RAND() + RAND()))), 2) AS mo,
           ROUND(LEAST(1.0, GREATEST(0.15, 0.3 + 0.35 * (RAND() + RAND()))) * 100, 2) AS pct
    FROM students
    WHERE school_id = {school} AND current_class_id = {cid} {sec_filter}
) t
"""

total_results = 0
for i, (sched_id, exam_id, class_id, sub_id, section_id, max_marks) in enumerate(schedules):
    sec_filter = f"AND current_section_id = {section_id}" if section_id else ""
    sql = er_sql_class.format(sched_id=sched_id, school=S, user=U, mm=int(max_marks), cid=class_id, sec_filter=sec_filter)
    cur.execute(sql)
    total_results += cur.rowcount
    if (i+1) % 50 == 0:
        conn.commit()
        print(f"    {i+1}/{len(schedules)} schedules done ({total_results:,} results)... {elapsed()}")
conn.commit()
print(f"  Exam Results: {total_results:,} {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 11: LIBRARY
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 11: Library")
print(f"{'='*60}")

lib_cats = ['Fiction','Non-Fiction','Science','Mathematics','History','Geography','Computer Science',
            'Reference','Biography','Hindi Literature','English Literature','Comics','Encyclopedia','Textbooks','Magazines']
bi('library_categories', ['school_id','name','is_active'], [(S, c, 1) for c in lib_cats])
cur.execute("SELECT id, name FROM library_categories WHERE school_id=%s", (S,))
lc_map = {n: i for i, n in cur.fetchall()}

# 200 books
book_titles = ['The Adventures of Tom Sawyer','Harry Potter and the Philosophers Stone','Pride and Prejudice',
               'To Kill a Mockingbird','The Great Gatsby','1984','Animal Farm','The Alchemist',
               'Wings of Fire','My Experiments with Truth','Discovery of India','Gitanjali',
               'NCERT Physics Part 1','NCERT Chemistry Part 1','NCERT Mathematics Class 12',
               'RD Sharma Mathematics','HC Verma Physics','RS Aggarwal Quantitative Aptitude',
               'Concise Physics','Concise Chemistry','Goyal Brothers Mathematics',
               'Oxford English Grammar','Wren and Martin English Grammar',
               'Lakhmir Singh Science','Together with Mathematics','Together with Science']
authors = ['Mark Twain','JK Rowling','Jane Austen','Harper Lee','F Scott Fitzgerald','George Orwell',
           'Paulo Coelho','APJ Abdul Kalam','MK Gandhi','Jawaharlal Nehru','Rabindranath Tagore',
           'NCERT','RD Sharma','HC Verma','RS Aggarwal','Selina Publishers','Oxford Press','S Chand']
publishers = ['Penguin','HarperCollins','Oxford University Press','S Chand','NCERT','Arihant','Dhanpat Rai',
              'Macmillan','Pearson','McGraw Hill','Tata McGraw Hill','Laxmi Publications']

book_rows = []
for i in range(200):
    cat_id = random.choice(list(lc_map.values()))
    title = random.choice(book_titles) + (f' Vol {i//25+1}' if i >= 25 else '')
    book_rows.append((
        S, cat_id, title, random.choice(authors), f'978-{random.randint(1000000000,9999999999)}',
        random.choice(publishers), random.choice(['1st','2nd','3rd','4th','5th']),
        'English' if random.random() < 0.7 else 'Hindi',
        random.choice(['Science','Mathematics','English','Hindi','History','Geography','General']),
        random.randint(2000, 2024), random.randint(100, 800),
        random.randint(3, 15), random.randint(1, 10),
        f'R{random.randint(1,20):02d}', round(random.uniform(100, 1500), 2),
        random.choice(['new','good','fair']), 1
    ))
bi('library_books', ['school_id','category_id','title','author','isbn','publisher','edition',
                     'language','subject','publication_year','pages','total_copies','available_copies',
                     'rack_no','price','condition','is_active'], book_rows)
cur.execute("SELECT id FROM library_books WHERE school_id=%s", (S,))
book_ids = [r[0] for r in cur.fetchall()]

# Library issues (500)
li_rows = []
for i in range(500):
    bid = random.choice(book_ids)
    issued_to = random.choice([s[0] for s in student_data])
    issue_dt = rdate(date(2025,4,1), date(2026,3,15))
    due_dt = issue_dt + timedelta(days=14)
    returned = random.random() < 0.7
    ret_dt = rdate(issue_dt + timedelta(days=1), issue_dt + timedelta(days=21)) if returned else None
    fine = round(max(0, (ret_dt - due_dt).days * 2), 2) if returned and ret_dt > due_dt else 0
    status = 'returned' if returned else ('overdue' if due_dt < date(2026,3,31) else 'issued')
    li_rows.append((S, bid, None, issued_to, 'student', issue_dt, due_dt, ret_dt, fine, returned if fine > 0 else 0, status, U))
bi('library_issues', ['school_id','book_id','copy_id','issued_to','issued_to_type','issue_date','due_date',
                      'return_date','fine_amount','fine_paid','status','issued_by'], li_rows)
print(f"  Library: {len(book_rows)} books, {len(li_rows)} issues {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 12: HOSTEL
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 12: Hostel")
print(f"{'='*60}")

blocks = [
    (S, 'Ashoka Block', 'ASH', 'boys', random.choice(teaching_ids), 3, 'Boys hostel block'),
    (S, 'Vikram Block', 'VIK', 'boys', random.choice(teaching_ids), 3, 'Boys hostel block 2'),
    (S, 'Laxmi Block', 'LAX', 'girls', random.choice(teaching_ids), 3, 'Girls hostel block'),
    (S, 'Saraswati Block', 'SAR', 'girls', random.choice(teaching_ids), 3, 'Girls hostel block 2'),
    (S, 'Tagore Block', 'TAG', 'boys', random.choice(teaching_ids), 2, 'Senior boys block'),
    (S, 'Kalpana Block', 'KAL', 'girls', random.choice(teaching_ids), 2, 'Senior girls block'),
]
bi('hostel_blocks', ['school_id','name','code','block_type','warden_id','total_floors','description'], blocks)
cur.execute("SELECT id FROM hostel_blocks WHERE school_id=%s", (S,))
block_ids = [r[0] for r in cur.fetchall()]

# Rooms (20 per block = 120 rooms)  
room_rows = []
for bid in block_ids:
    for floor in range(1, 4):
        for rnum in range(1, 8):
            cap = random.choice([2, 3, 4])
            room_rows.append((S, bid, f'{floor}{rnum:02d}', floor, random.choice(['double','shared','dormitory']),
                            cap, random.randint(0, cap), None, random.randint(500, 2000), 'available', 1))
bi('hostel_rooms', ['school_id','block_id','room_number','floor','room_type','capacity',
                    'current_occupancy','amenities','monthly_rent','status','is_active'], room_rows)
cur.execute("SELECT id FROM hostel_rooms WHERE school_id=%s", (S,))
room_ids = [r[0] for r in cur.fetchall()]

# Allocations (200 students)
alloc_students = random.sample([s[0] for s in student_data if s[1] >= 9], min(200, len([s for s in student_data if s[1] >= 9])))
alloc_rows = []
for sid in alloc_students:
    alloc_rows.append((S, sid, random.choice(room_ids), random.choice(['A','B','C','D']),
                      date(2025, 4, 1), None, 'active'))
bi('hostel_allocations', ['school_id','student_id','room_id','bed_number','allocation_date','vacate_date','status'], alloc_rows)

# Mess Menu (7 days × 4 meals = 28)
MEALS = ['breakfast','lunch','snacks','dinner']
MENU_ITEMS = {
    'breakfast': ['Poha, Tea, Bread Butter','Upma, Milk, Banana','Paratha, Curd, Juice','Idli Sambar, Coffee','Dosa, Chutney, Milk','Cornflakes, Toast, Juice','Sandwich, Milk, Fruits'],
    'lunch': ['Rice, Dal, Sabzi, Roti, Salad','Rice, Rajma, Roti, Raita','Rice, Chole, Puri, Papad','Rice, Paneer, Roti, Salad','Rice, Sambar, Roti, Pickle','Biryani, Raita, Salad','Rice, Kadhi, Roti, Sweet'],
    'snacks': ['Samosa, Tea','Pakora, Juice','Bread Pakora, Milk','Poha, Tea','Maggi, Juice','Biscuits, Tea','Cake, Milk'],
    'dinner': ['Roti, Dal, Sabzi, Rice','Roti, Paneer, Rice, Kheer','Roti, Egg Curry, Rice','Roti, Mix Veg, Rice, Fruit','Roti, Dal Makhani, Rice','Roti, Aloo Gobi, Rice, Sweet','Roti, Chana, Rice, Salad'],
}
DAY_NAMES = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
mm_rows = []
for day in DAY_NAMES:
    for meal in MEALS:
        items = MENU_ITEMS[meal][DAY_NAMES.index(day)]
        mm_rows.append((S, day, meal, items, None, random.randint(300,800), date(2025,4,1), None, 1))
bi('mess_menu', ['school_id','day_of_week','meal_type','menu_items','special_diet','calories','effective_from','effective_to','is_active'], mm_rows)

print(f"  Hostel: {len(blocks)} blocks, {len(room_rows)} rooms, {len(alloc_rows)} allocations, {len(mm_rows)} mess menu {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 13: CANTEEN
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 13: Canteen")
print(f"{'='*60}")

# Menu items
canteen_items = [
    ('Samosa', 'snacks', 15, 200, 1), ('Bread Pakora', 'snacks', 20, 250, 1),
    ('Vada Pav', 'snacks', 20, 300, 1), ('Sandwich', 'snacks', 30, 200, 1),
    ('Maggi', 'snacks', 25, 350, 1), ('French Fries', 'snacks', 35, 300, 1),
    ('Spring Roll', 'snacks', 25, 200, 1), ('Burger', 'snacks', 45, 400, 1),
    ('Pasta', 'meals', 50, 400, 1), ('Chole Bhature', 'meals', 50, 500, 1),
    ('Rajma Chawal', 'meals', 45, 450, 1), ('Thali', 'meals', 60, 600, 1),
    ('Biryani', 'meals', 55, 500, 1), ('Paratha Plate', 'meals', 40, 400, 1),
    ('Dosa', 'meals', 35, 350, 1), ('Idli Sambar', 'meals', 30, 250, 1),
    ('Tea', 'beverages', 10, 50, 1), ('Coffee', 'beverages', 15, 80, 1),
    ('Lassi', 'beverages', 25, 150, 1), ('Cold Coffee', 'beverages', 30, 200, 1),
    ('Fresh Juice', 'beverages', 25, 100, 1), ('Milkshake', 'beverages', 35, 200, 1),
    ('Gulab Jamun', 'desserts', 20, 150, 1), ('Ice Cream', 'desserts', 25, 200, 1),
    ('Jalebi', 'desserts', 15, 200, 1), ('Rasgulla', 'desserts', 20, 150, 1),
    ('Kulfi', 'desserts', 20, 150, 1), ('Brownie', 'desserts', 30, 250, 0),
    ('Pizza Slice', 'snacks', 40, 350, 1), ('Momos', 'snacks', 30, 250, 1),
]
cm_rows = [(S, n, c, p, None, cal, None, veg, 1) for n, c, p, cal, veg in canteen_items]
bi('canteen_menu', ['school_id','name','category','price','description','calories','allergens','is_vegetarian','is_available'], cm_rows)
cur.execute("SELECT id, price FROM canteen_menu WHERE school_id=%s", (S,))
menu_items = cur.fetchall()

# Wallets (for 5000 random students)
wallet_students = random.sample([s[0] for s in student_data], min(5000, len(student_data)))
cw_rows = [(S, sid, round(random.uniform(50, 500), 2), 200, 1) for sid in wallet_students]
bi('canteen_wallet', ['school_id','student_id','balance','daily_limit','is_active'], cw_rows)
cur.execute("SELECT id, student_id FROM canteen_wallet WHERE school_id=%s", (S,))
wallets = {sid: wid for wid, sid in cur.fetchall()}

# Transactions (3000)
ct_rows = []
for i in range(3000):
    sid = random.choice(wallet_students)
    wid = wallets.get(sid)
    mid, price = random.choice(menu_items)
    ct_rows.append((S, sid, wid, 'purchase', float(price), mid, random.randint(1,3), 'wallet', None, rdate(date(2025,4,1), date(2026,3,31))))
bi('canteen_transactions', ['school_id','student_id','wallet_id','transaction_type','amount','item_id','quantity','payment_method','remarks','created_at'], ct_rows)

# Canteen inventory
ci_items = ['Rice','Flour','Oil','Sugar','Salt','Tea Leaves','Coffee Powder','Milk','Bread','Butter',
            'Vegetables','Spices','Dal','Potato','Onion','Tomato','Paneer','Cheese','Eggs','Fruits']
ci_rows = [(S, item, 'grocery', round(random.uniform(5,100),2), random.choice(['kg','litre','pieces','packet']),
            round(random.uniform(20,200),2), round(random.uniform(2,10),2), random.choice(['Fresh Mart','Wholesale Depot','Organic Store']),
            rdate(date(2025,1,1), date(2026,3,1)), rdate(date(2026,4,1), date(2026,12,31)), 1)
           for item in ci_items]
bi('canteen_inventory', ['school_id','item_name','category','quantity','unit','unit_price','min_stock','supplier','last_restocked','expiry_date','is_active'], ci_rows)

# Vendors
cv_rows = [
    (S, 'Fresh Mart Suppliers', 'Ramesh Kumar', '9811111111', 'freshmart@email.com', 'Delhi', 'Vegetables, Fruits', 4, 'FSSAI001', 1),
    (S, 'Wholesale Grocery Depot', 'Sunil Agarwal', '9822222222', 'wholesale@email.com', 'Noida', 'Rice, Dal, Oil', 5, 'FSSAI002', 1),
    (S, 'Dairy Fresh', 'Vijay Sharma', '9833333333', 'dairy@email.com', 'Gurgaon', 'Milk, Butter, Paneer', 4, 'FSSAI003', 1),
    (S, 'Bakery World', 'Anita Jain', '9844444444', 'bakery@email.com', 'Delhi', 'Bread, Cakes, Biscuits', 3, 'FSSAI004', 1),
    (S, 'Organic Store', 'Priya Mehta', '9855555555', 'organic@email.com', 'Pune', 'Organic Vegetables, Fruits', 5, 'FSSAI005', 1),
]
bi('canteen_vendors', ['school_id','name','contact_person','phone','email','address','supply_items','rating','fssai_license','is_active'], cv_rows)

print(f"  Canteen: {len(cm_rows)} menu, {len(cw_rows)} wallets, {len(ct_rows)} transactions {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 14: SPORTS & EXTRA-CURRICULAR
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 14: Sports & Extra-Curricular")
print(f"{'='*60}")

sports_list = [
    ('Cricket','outdoor',15), ('Football','outdoor',18), ('Basketball','outdoor',12),
    ('Volleyball','outdoor',12), ('Badminton','indoor',4), ('Table Tennis','indoor',4),
    ('Chess','indoor',2), ('Kabaddi','outdoor',12), ('Kho Kho','outdoor',12),
    ('Athletics - Sprint','athletics',1), ('Athletics - Long Jump','athletics',1),
    ('Shot Put','athletics',1), ('Swimming','water',1), ('Yoga','indoor',30),
    ('Martial Arts','indoor',20), ('Handball','outdoor',14), ('Hockey','outdoor',16),
    ('Tennis','outdoor',4), ('Skating','outdoor',1), ('Archery','outdoor',1),
]
sp_rows = [(S, name, cat, ms, random.choice(teaching_ids), f'{name} training and competitions',
            random.choice(['summer','winter','year-round']), None, 1)
           for name, cat, ms in sports_list]
bi('sports', ['school_id','name','category','max_team_size','coach_id','description','season','practice_schedule','is_active'], sp_rows)
cur.execute("SELECT id, name FROM sports WHERE school_id=%s", (S,))
sport_map = {n: i for i, n in cur.fetchall()}
sport_ids = list(sport_map.values())

# Teams (25)
team_names = ['Junior Cricket XI','Senior Cricket XI','Football Team','Basketball A','Basketball B',
              'Volleyball Team','Badminton Squad','TT Squad','Chess Club Team','Junior Kabaddi',
              'Senior Kabaddi','Athletics Team','Swimming Team','Hockey Team','Junior Football',
              'Handball Team','Tennis Squad','Martial Arts Team','U-14 Cricket','U-17 Cricket',
              'Girls Basketball','Girls Volleyball','Girls Badminton','Mixed Athletics','Yoga Team']
st_rows = []
for i, tn in enumerate(team_names):
    sport_id = sport_ids[i % len(sport_ids)]
    senior_students = [s[0] for s in student_data if s[1] >= 9]
    captain = random.choice(senior_students) if senior_students else None
    members = json.dumps(random.sample(senior_students, min(15, len(senior_students))))
    st_rows.append((S, sport_id, tn, '2025-26', captain, random.choice(teaching_ids), members,
                   random.choice(['U-14','U-17','Senior','Open']), None, 1))
bi('sports_teams', ['school_id','sport_id','name','academic_year','captain_id','coach_id','members','age_group','achievements','is_active'], st_rows)
cur.execute("SELECT id FROM sports_teams WHERE school_id=%s", (S,))
team_ids = [r[0] for r in cur.fetchall()]

# Tournaments (15)
tourney_names = ['Inter-School Cricket Tournament','District Football Championship','State Basketball Championship',
                 'Annual Sports Meet','Inter-House Cricket','Chess Championship','Badminton Open',
                 'Athletics Championship','Swimming Gala','Table Tennis Tournament','Volleyball League',
                 'Kabaddi Tournament','Hockey Cup','Yoga Competition','Martial Arts Championship']
tr_rows = []
for i, tn in enumerate(tourney_names):
    sid = sport_ids[i % len(sport_ids)]
    sd = rdate(date(2025,7,1), date(2026,2,28))
    tr_rows.append((S, sid, tn, random.choice(['inter-school','intra-school','district','state']),
                   sd, sd + timedelta(days=random.randint(1,5)),
                   random.choice(['School Ground','District Stadium','State Sports Complex','School Auditorium']),
                   random.choice(['District Sports Authority','School','State Board']),
                   random.choice(['completed','upcoming']),
                   json.dumps({'gold': random.randint(0,3), 'silver': random.randint(0,3), 'bronze': random.randint(0,3)}),
                   None, 1))
bi('tournaments', ['school_id','sport_id','name','tournament_type','start_date','end_date','venue','organizer','status','medals','remarks','is_active'], tr_rows)

# Clubs (10)
club_list = [
    ('Science Club','science','Explore scientific wonders'),
    ('Literary Club','literary','Reading, writing and debates'),
    ('Art & Craft Club','arts','Creative expression through art'),
    ('Music Club','cultural','Musical training and performances'),
    ('Dance Club','cultural','Classical and modern dance'),
    ('Drama Club','cultural','Theater and acting'),
    ('Eco Club','social','Environmental awareness'),
    ('Photography Club','arts','Photography skills'),
    ('Robotics Club','science','Robotics and AI'),
    ('Debate Club','literary','Public speaking and debates'),
]
cl_rows = [(S, n, c, d, random.choice(teaching_ids), random.choice([s[0] for s in student_data if s[1] >= 12]),
            random.choice(['Every Monday 3-4 PM','Every Wednesday 3-4 PM','Every Friday 3-4 PM']), 50, None, 1)
           for n, c, d in club_list]
bi('clubs', ['school_id','name','category','description','advisor_id','president_id','meeting_schedule','max_members','achievements','is_active'], cl_rows)
cur.execute("SELECT id FROM clubs WHERE school_id=%s", (S,))
club_ids = [r[0] for r in cur.fetchall()]

# Club members (300)
clm_rows = []
member_pool = random.sample([s[0] for s in student_data if s[1] >= 4], min(600, len([s for s in student_data if s[1] >= 4])))
for i, sid in enumerate(member_pool[:300]):
    clm_rows.append((S, random.choice(club_ids), sid, random.choice(['member','member','member','secretary','treasurer']),
                    rdate(date(2025,4,1), date(2025,8,1)), 'active', 1))
bi('club_members', ['school_id','club_id','student_id','role','joined_date','status','is_active'], clm_rows)

# Events (20)
event_list = [
    ('Annual Day 2025','annual'), ('Sports Day 2025','sports'), ('Science Exhibition','academic'),
    ('Republic Day Celebration','cultural'), ('Independence Day Celebration','cultural'),
    ('Teacher\'s Day','cultural'), ('Children\'s Day','cultural'), ('Diwali Celebration','cultural'),
    ('Christmas Carnival','cultural'), ('Holi Celebration','cultural'), ('Inter-House Quiz','academic'),
    ('Art Competition','cultural'), ('Debate Competition','academic'), ('Music Festival','cultural'),
    ('Dance Competition','cultural'), ('Math Olympiad','academic'), ('Science Olympiad','academic'),
    ('Book Fair','academic'), ('Career Counseling Day','academic'), ('Parent-Teacher Meet','social'),
]
ev_rows = [(S, n, et, f'Organized for all students', rdate(date(2025,4,1), date(2026,3,31)),
            None, random.choice(['School Auditorium','School Ground','Classrooms','Hall']),
            random.choice(teaching_ids), random.randint(5000, 50000), 'completed', None, None, 1)
           for n, et in event_list]
bi('events', ['school_id','name','event_type','description','start_date','end_date','venue','organizer_id','budget','status','participants','remarks','is_active'], ev_rows)

# Fitness Records (500)
fr_students = random.sample([s[0] for s in student_data if s[1] >= 4], min(500, len([s for s in student_data if s[1] >= 4])))
fr_rows = [(S, sid, '2025-26', rdate(date(2025,7,1), date(2025,9,30)),
            round(random.uniform(100,180),2), round(random.uniform(25,80),2),
            round(random.uniform(15,30),2),
            f'{random.randint(7,12)}.{random.randint(0,9)}s',
            f'{random.uniform(1.5,4.5):.2f}m',
            random.choice(['Good','Average','Excellent','Below Average']),
            random.choice(['Good','Average','Excellent']),
            random.choice(['A','B','C','D']), None, random.choice(teaching_ids), 1)
           for sid in fr_students]
bi('fitness_records', ['school_id','student_id','academic_year','test_date','height','weight','bmi',
                       'sprint_50m','long_jump','flexibility','endurance','overall_grade','remarks','tested_by','is_active'], fr_rows)

print(f"  Sports: {len(sp_rows)} sports, {len(st_rows)} teams, {len(tr_rows)} tournaments, {len(cl_rows)} clubs, {len(ev_rows)} events {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 15: HEALTH & SAFETY
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 15: Health & Safety")
print(f"{'='*60}")

# Health Records (500 students)
hr_students = random.sample([s[0] for s in student_data], 500)
hr_rows = [(S, 'student', sid, random.choice(BG),
            round(random.uniform(90,180),1), round(random.uniform(20,80),1),
            round(random.uniform(14,30),2),
            random.choice([None,'Asthma','Diabetes','None','Allergies']),
            random.choice([None,'None','Mild allergies','Dust allergy','Food allergy']),
            'DPT, Polio, MMR, Hepatitis B', None,
            random.choice(['6/6','6/9','6/12','6/6']), random.choice(['6/6','6/9','6/12','6/6']),
            random.choice(['Normal','Needs attention','Good']),
            f'Dr. {random.choice(FP)} {random.choice(LN)}', f'98{random.randint(10000000,99999999)}',
            random.choice([None,'Star Health','ICICI Lombard','New India Assurance']),
            None, None, None)
           for sid in hr_students]
bi('health_records', ['school_id','person_type','person_id','blood_group','height_cm','weight_kg','bmi',
                      'chronic_conditions','allergies','vaccinations','disabilities',
                      'vision_left','vision_right','dental_status','doctor_name','doctor_phone',
                      'insurance_provider','insurance_policy_no','insurance_expiry','notes'], hr_rows)

# Health Checkups (1000)
hc_rows = []
checkup_types = ['annual','dental','eye','bmi','general']
for i in range(1000):
    sid = random.choice([s[0] for s in student_data])
    ct = random.choice(checkup_types)
    hc_rows.append((S, f'Annual Health Checkup {ct.title()}', ct,
                   rdate(date(2025,7,1), date(2026,2,28)), 'student', sid,
                   round(random.uniform(90,180),1), round(random.uniform(20,80),1),
                   round(random.uniform(14,30),2),
                   random.choice(['6/6','6/9','6/12']), random.choice(['6/6','6/9','6/12']),
                   random.choice(['Normal','Cavity found','Good']),
                   random.choice(['Normal','Good','Excellent']),
                   None, round(random.uniform(10,14),1),
                   f'Dr. {random.choice(FP)} {random.choice(LN)}',
                   random.choice([None,'Normal growth','Needs vitamin D','Mild issue noted']),
                   random.choice([None,'Regular exercise','Balanced diet','Eye checkup needed']),
                   random.random() < 0.1, 'completed'))
bi('health_checkups', ['school_id','checkup_name','checkup_type','checkup_date','person_type','person_id',
                       'height_cm','weight_kg','bmi','vision_left','vision_right','dental_status',
                       'hearing_status','blood_pressure','hemoglobin','doctor_name','findings',
                       'recommendations','follow_up_required','status'], hc_rows)

# Infirmary Visits (300)
complaints = ['Headache','Stomach ache','Fever','Nausea','Injury during sports','Dizziness',
              'Toothache','Eye pain','Allergic reaction','Cold and cough','Vomiting','Weakness']
iv_rows = []
for i in range(300):
    sid = random.choice([s[0] for s in student_data])
    vd = rdate(date(2025,4,1), date(2026,3,31))
    iv_rows.append((S, 'student', sid, vd, time(random.randint(8,14), random.choice([0,15,30,45])),
                   random.choice(complaints), random.choice([None,'Mild infection','Viral','Gastric','Sprain','Fatigue']),
                   random.choice(['Rest and observation','Paracetamol given','Ice pack applied','ORS given','Sent home']),
                   random.choice([None,'Paracetamol','Crocin','ORS','Band-aid','Ice pack']),
                   round(random.uniform(97,101),1) if random.random() < 0.3 else None,
                   None, random.random() < 0.05, None, random.random() < 0.3, None,
                   'School Nurse', random.choice(['treated','referred','under_observation']),
                   time(random.randint(10,15), random.choice([0,30])) if random.random() < 0.8 else None,
                   None, None))
bi('infirmary_visits', ['school_id','person_type','person_id','visit_date','visit_time',
                        'complaint','diagnosis','treatment','medicines_given','temperature',
                        'blood_pressure','referred_to_hospital','hospital_name','parent_notified','notified_at',
                        'attended_by','status','discharge_time','follow_up_date','notes'], iv_rows)

# Incident Reports (30)
inc_types = ['injury','fight','bullying','property_damage','medical','other']
ir_rows = []
for i in range(30):
    ir_rows.append((S, random.choice(inc_types), random.choice(['minor','moderate','severe']),
                   f'Incident Report #{i+1}', 'Incident details and description here',
                   rdate(date(2025,4,1), date(2026,3,31)), time(random.randint(8,14), 0),
                   random.choice(['Classroom','Playground','Corridor','Lab','Canteen']),
                   None, None, random.random() < 0.3, None, random.random() < 0.2, 0, 0,
                   random.choice([None,'Warning issued','Parents called','Counseling arranged']),
                   U, random.choice(['reported','resolved','closed'])))
bi('incident_reports', ['school_id','incident_type','severity','title','description',
                        'incident_date','incident_time','location','persons_involved','witnesses',
                        'first_aid_given','first_aid_details','parent_notified','police_notified','insurance_claimed',
                        'action_taken','reported_by','status'], ir_rows)

# Safety Drills (8)
sd_rows = []
drill_types = ['fire','earthquake','lockdown','evacuation']
for i, dt in enumerate(drill_types * 2):
    dd = rdate(date(2025,4,1), date(2026,3,31))
    sd_rows.append((S, dt, f'{dt.title()} Drill {i+1}', dd, time(10,0), dd,
                   random.randint(15,45), random.randint(120,600), random.randint(500,2000),
                   'Main Ground', 'Safety Officer', 'Drill conducted successfully',
                   random.choice([None,'Some students slow to respond','All clear']),
                   None, random.randint(3,5), 'completed', dd + timedelta(days=90)))
bi('safety_drills', ['school_id','drill_type','drill_name','scheduled_date','scheduled_time','actual_date',
                     'duration_minutes','evacuation_time_seconds','participants_count','assembly_point',
                     'conducted_by','observations','issues_found','corrective_actions','rating','status','next_drill_date'], sd_rows)

# Emergency Contacts (500 for hostel students)
ec_rows = []
for sid in alloc_students[:200]:
    ec_rows.append((S, 'student', sid, f'{random.choice(FP)} {random.choice(LN)}',
                   random.choice(['Father','Mother','Uncle','Guardian']),
                   f'98{random.randint(10000000,99999999)}', None, None, None, 1, 1))
bi('emergency_contacts', ['school_id','person_type','person_id','contact_name','relationship',
                          'phone_primary','phone_secondary','email','address','priority','is_active'], ec_rows)

print(f"  Health: {len(hr_rows)} records, {len(hc_rows)} checkups, {len(iv_rows)} infirmary, {len(ir_rows)} incidents {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 16: TRANSPORT
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 16: Transport")
print(f"{'='*60}")

# Vehicles (15)
veh_rows = []
for i in range(15):
    vtype = random.choice(['bus','van','mini_bus'])
    cap = {'bus':50,'van':15,'mini_bus':30}[vtype]
    veh_rows.append((S, f'UP{random.randint(10,99)} T {random.randint(1000,9999)}',
                    vtype, random.choice(['Tata','Ashok Leyland','Eicher','Force','Mahindra']),
                    random.choice(['Starbus','Lynx','Skyline','Traveller','Bolero']),
                    random.randint(2018,2024), cap, 'diesel',
                    rdate(date(2018,1,1), date(2023,12,31)),
                    rdate(date(2026,1,1), date(2027,12,31)),
                    rdate(date(2026,1,1), date(2027,6,30)),
                    rdate(date(2026,1,1), date(2026,12,31)),
                    rdate(date(2026,1,1), date(2026,12,31)),
                    None, None, f'GPS{i+1:03d}', 'active', random.randint(10000,80000)))
bi('vehicles', ['school_id','vehicle_number','vehicle_type','make','model','year','capacity','fuel_type',
                'registration_date','insurance_expiry','fitness_expiry','permit_expiry','pollution_expiry',
                'chassis_number','engine_number','gps_device_id','status','current_odometer'], veh_rows)
cur.execute("SELECT id FROM vehicles WHERE school_id=%s", (S,))
vehicle_ids = [r[0] for r in cur.fetchall()]

# Drivers (15)
dr_rows = []
for i in range(15):
    dr_rows.append((S, f'{random.choice(FP)} {random.choice(LN)}',
                   f'98{random.randint(10000000,99999999)}', None,
                   f'DL{random.randint(100000000000,999999999999)}',
                   'HMV', rdate(date(2027,1,1), date(2030,12,31)),
                   rdate(date(2026,1,1), date(2027,12,31)),
                   f'{random.randint(1000,9999)}{random.randint(10000000,99999999)}',
                   f'{random.choice(CITIES)}', random.choice(BG),
                   f'98{random.randint(10000000,99999999)}',
                   random.randint(3,20), 100, None, 'active', rdate(date(2018,1,1), date(2024,12,31))))
bi('drivers', ['school_id','name','phone','email','license_number','license_type','license_expiry',
               'medical_fitness_expiry','aadhar_number','address','blood_group','emergency_contact',
               'experience_years','driving_score','photo_url','status','joined_date'], dr_rows)
cur.execute("SELECT id FROM drivers WHERE school_id=%s", (S,))
driver_ids = [r[0] for r in cur.fetchall()]

# Routes (12)
route_names = ['Sector 1 - School','Sector 2 - School','Civil Lines Route','Railway Station Route',
               'Cantonment Route','University Route','Industrial Area Route','Old City Route',
               'Highway Route','Green Park Route','Model Town Route','Defence Colony Route']
rt_rows = []
for i, rn in enumerate(route_names):
    rt_rows.append((S, rn, f'R{i+1:02d}', f'Route covering {rn.split(" -")[0]} area',
                   vehicle_ids[i % len(vehicle_ids)], driver_ids[i % len(driver_ids)],
                   f'{random.choice(FP)} {random.choice(LN)}', f'98{random.randint(10000000,99999999)}',
                   rn.split(' -')[0] if ' -' in rn else rn.split(' Route')[0], 'School Campus',
                   round(random.uniform(5,25),2), random.randint(30,60), 'both', 'active'))
bi('transport_routes', ['school_id','route_name','route_code','description','vehicle_id','driver_id',
                        'helper_name','helper_phone','start_location','end_location',
                        'total_distance_km','estimated_time_min','shift','status'], rt_rows)
cur.execute("SELECT id FROM transport_routes WHERE school_id=%s", (S,))
route_ids = [r[0] for r in cur.fetchall()]

# Stops (10 per route = 120)
stop_names = ['Main Chowk','Bus Stand','Railway Crossing','Hospital Gate','Market Road','Temple Road',
              'College Gate','Police Station','Park Corner','Petrol Pump','Bank Road','Post Office',
              'Cinema Hall','Mall Gate','Stadium Road']
ts_rows = []
for rid in route_ids:
    for j in range(10):
        pickup_min = 30 + j * 5
        drop_min = 30 + (9 - j) * 5
        ts_rows.append((rid, S, f'{random.choice(stop_names)} Stop {j+1}',
                       round(random.uniform(26,29), 7), round(random.uniform(77,82), 7),
                       time(6 + pickup_min // 60, pickup_min % 60),
                       time(14 + drop_min // 60, drop_min % 60),
                       round(random.uniform(500,2000),2), j+1, 100))
bi('transport_stops', ['route_id','school_id','stop_name','latitude','longitude',
                       'pickup_time','drop_time','fare','stop_order','radius_meters'], ts_rows)
cur.execute("SELECT id, route_id FROM transport_stops WHERE school_id=%s", (S,))
stop_data = cur.fetchall()
stops_by_route = defaultdict(list)
for stop_id, rid in stop_data:
    stops_by_route[rid].append(stop_id)

# Student Transport (300 students using bus)
bus_students = [s[0] for s in student_data if random.random() < 0.03][:300]
str_rows = []
for sid in bus_students:
    rid = random.choice(route_ids)
    stop_id = random.choice(stops_by_route.get(rid, [stop_data[0][0]]))
    str_rows.append((sid, S, rid, stop_id, 'both', None, date(2025,4,1), None, 'active'))
bi('student_transport', ['student_id','school_id','route_id','stop_id','pickup_type','rfid_card_no',
                         'effective_from','effective_to','status'], str_rows)

# Fuel Logs (100)
fl_rows = []
for i in range(100):
    vid = random.choice(vehicle_ids)
    fd = rdate(date(2025,4,1), date(2026,3,31))
    qty = round(random.uniform(30,80),2)
    rate = round(random.uniform(85,95),2)
    fl_rows.append((S, vid, fd, 'diesel', qty, rate, round(qty*rate,2),
                   random.randint(10000,80000), round(random.uniform(4,8),2),
                   random.choice(['HP Petrol Pump','Indian Oil','Bharat Petroleum']),
                   f'FL{i+1:04d}', f'{random.choice(FP)} {random.choice(LN)}'))
bi('fuel_logs', ['school_id','vehicle_id','fill_date','fuel_type','quantity_liters','rate_per_liter',
                 'total_cost','odometer_reading','mileage_kmpl','pump_name','receipt_no','filled_by'], fl_rows)

print(f"  Transport: {len(veh_rows)} vehicles, {len(dr_rows)} drivers, {len(rt_rows)} routes, {len(ts_rows)} stops, {len(str_rows)} allocations {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 17: INVENTORY & ASSETS
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 17: Inventory & Assets")
print(f"{'='*60}")

# Asset Categories
ac_list = ['Furniture','IT Equipment','Lab Equipment','Sports Equipment','Vehicles',
           'Building','Electrical','Books & Library','Kitchen Equipment','Musical Instruments']
bi('asset_categories', ['school_id','name','depreciation_rate','useful_life_years','is_active'],
   [(S, n, round(random.uniform(5,20),2), random.randint(5,15), 1) for n in ac_list])
cur.execute("SELECT id, name FROM asset_categories WHERE school_id=%s", (S,))
ac_map = {n: i for i, n in cur.fetchall()}

# Assets (200)
asset_items = [
    ('Classroom Desk','furniture','Furniture'),('Classroom Chair','furniture','Furniture'),
    ('Teacher Table','furniture','Furniture'),('Whiteboard','furniture','Furniture'),
    ('Computer Desktop','it','IT Equipment'),('Laptop','it','IT Equipment'),
    ('Projector','it','IT Equipment'),('Printer','it','IT Equipment'),
    ('Microscope','lab','Lab Equipment'),('Chemistry Kit','lab','Lab Equipment'),
    ('Physics Lab Equipment','lab','Lab Equipment'),('Biology Model','lab','Lab Equipment'),
    ('Cricket Kit','sports','Sports Equipment'),('Football','sports','Sports Equipment'),
    ('Basketball','sports','Sports Equipment'),('Volleyball Net','sports','Sports Equipment'),
    ('CCTV Camera','it','IT Equipment'),('AC Unit','furniture','Electrical'),
    ('Water Cooler','furniture','Electrical'),('Generator','furniture','Electrical'),
]
as_rows = []
for i in range(200):
    item = asset_items[i % len(asset_items)]
    cat_id = ac_map.get(item[2], list(ac_map.values())[0])
    purchase_date = rdate(date(2018,1,1), date(2025,3,31))
    price = round(random.uniform(500, 50000), 2)
    as_rows.append((S, cat_id, f'AST{i+1:04d}', f'{item[0]} #{i+1}', None, item[1],
                   random.choice(['Samsung','HP','Dell','Tata','Local','Godrej','Nilkamal']),
                   None, None, purchase_date, price, None,
                   rdate(date(2026,1,1), date(2028,12,31)) if random.random() < 0.5 else None,
                   None, random.choice(['Room 101','Room 202','Lab 1','Office','Library','Staff Room','Sports Room']),
                   None, random.choice(['Admin','Science Dept','Sports','IT','Library']),
                   random.choice(['new','good','fair']),
                   'active', round(price * random.uniform(0.5,0.9),2)))
bi('assets', ['school_id','category_id','asset_code','name','description','asset_type',
              'brand','model','serial_number','purchase_date','purchase_price','vendor_id',
              'warranty_expiry','warranty_details','location','room_number','assigned_to',
              'condition','status','current_value'], as_rows)

# Inventory Categories
inv_cats = ['Stationery','Cleaning Supplies','Electrical','Plumbing','Lab Consumables',
            'Sports Consumables','Office Supplies','First Aid']
bi('inventory_categories', ['school_id','name','is_active'], [(S, c, 1) for c in inv_cats])
cur.execute("SELECT id FROM inventory_categories WHERE school_id=%s", (S,))
inv_cat_ids = [r[0] for r in cur.fetchall()]

# Inventory Items (100)
inv_items = ['Whiteboard Marker','Chalk Box','Duster','Register','Pen Box','Pencil Box',
             'Paper Ream','Notebook','Eraser Pack','Sharpener Pack','Glue Stick','Scissors',
             'Tape Roll','File Folder','Envelope Pack','Broom','Mop','Cleaning Liquid',
             'Hand Wash','Tissue Box','Light Bulb','Switch','Wire Roll','Fuse',
             'Test Tube','Beaker','Chemical Reagent','Filter Paper','Litmus Paper','Glass Slide',
             'Cricket Ball','Shuttle Cock','Football Pump','Net','Cone Marker','Whistle',
             'Stapler','Paper Clip Box','Rubber Band','Ink Cartridge','Toner','USB Drive',
             'Band-aid Box','Cotton Roll','Antiseptic','Thermometer','ORS Packet','Paracetamol']
ii_rows = []
for i, item in enumerate(inv_items[:100] if len(inv_items) >= 100 else inv_items * 3):
    ii_rows.append((S, inv_cat_ids[i % len(inv_cat_ids)], item, None, f'SKU{i+1:04d}',
                   random.randint(10,500), random.choice(['pieces','boxes','packets','rolls','bottles']),
                   round(random.uniform(10,500),2), random.randint(5,20), random.randint(100,1000),
                   random.randint(20,100), random.choice(['Store Room A','Store Room B','Lab Store']),
                   None, 0, 1))
bi('inventory_items', ['school_id','category_id','name','description','sku','quantity','unit',
                       'unit_price','min_stock_level','max_stock_level','reorder_quantity',
                       'location','expiry_date','is_lab_item','is_active'], ii_rows)

print(f"  Assets: {len(as_rows)}, Inventory Items: {len(ii_rows)} {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 18: COMMUNICATION
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 18: Communication (Announcements)")
print(f"{'='*60}")

ann_titles = [
    'Welcome to New Academic Year 2025-26','Summer Vacation Notice','Unit Test 1 Schedule',
    'Independence Day Celebration','Half Yearly Exam Schedule','Diwali Vacation Notice',
    'Winter Break Notice','Republic Day Celebration','Unit Test 2 Schedule','Annual Day Preparation',
    'Annual Exam Schedule','Sports Day Notice','Science Exhibition','Parent Teacher Meeting',
    'Fee Payment Reminder','Library Book Return Notice','Bus Route Changes','New Computer Lab Inauguration',
    'Yoga Day Celebration','Children\'s Day Celebration','Teacher\'s Day Notice','Holi Vacation Notice',
    'Result Declaration Notice','Admission Open 2026-27',
]
ann_rows = []
for i, title in enumerate(ann_titles):
    pub_date = date(2025, 4, 1) + timedelta(days=i * 15)
    ann_rows.append((S, title, f'Dear Students and Parents, {title}. Please note the details and plan accordingly. Thank you.',
                    random.choice(['all','students','parents','teachers']), None, 1, pub_date, U))
bi('announcements', ['school_id','title','message','target_audience','target_class_id','is_published','published_at','created_by'], ann_rows)
print(f"  Announcements: {len(ann_rows)} {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 19: HOMEWORK
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 19: Homework & Assignments")
print(f"{'='*60}")

hw_topics = {
    'English': ['Essay Writing','Letter Writing','Comprehension','Grammar Exercise','Creative Writing','Poetry Analysis'],
    'Hindi': ['Nibandh Lekhan','Patra Lekhan','Vyakaran Abhyas','Kavita','Anuchhed Lekhan','Gadya Paath'],
    'Mathematics': ['Algebra Problems','Geometry Construction','Arithmetic Practice','Mensuration','Statistics','Number System'],
    'Science': ['Lab Report','Chapter Questions','Science Project','Experiment Analysis','Diagram Practice','MCQ Practice'],
    'Social Studies': ['Map Work','Chapter Summary','Timeline Activity','Project Work','Essay Assignment','Quiz Preparation'],
}

hw_rows = []
for class_id in range(1, 16):
    subs = CLASS_SUBS.get(class_id, list(STREAM_SUBS.values())[0])
    for section_id, sec_name in sec_map[class_id]:
        for sub_name in subs[:5]:
            if sub_name not in sub_map: continue
            topics = hw_topics.get(sub_name, ['Practice Exercise','Chapter Questions','Project Work','Revision'])
            for month_offset in range(12):
                topic = random.choice(topics)
                assigned = date(2025, 4, 1) + timedelta(days=month_offset * 30 + random.randint(1,25))
                if assigned > date(2026, 3, 31): continue
                due = assigned + timedelta(days=random.randint(3, 10))
                hw_rows.append((S, random.choice(teaching_ids), class_id, section_id, sub_map[sub_name],
                               f'{sub_name} - {topic}', f'Complete the {topic.lower()} as discussed in class.',
                               None, random.choice(['assignment','worksheet','project','practice']),
                               assigned, due, random.randint(10,50), None, 0, 0, 1, 1, 0))

bi('homework', ['school_id','teacher_id','class_id','section_id','subject_id',
                'title','description','instructions','homework_type','assigned_date','due_date',
                'max_marks','attachment_url','allow_late_submission','late_penalty_percent',
                'is_graded','status','total_submissions'], hw_rows)
print(f"  Homework: {len(hw_rows)} {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 20: LEAVE APPLICATIONS
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 20: Leave Applications")
print(f"{'='*60}")

la_rows = []
# Student leaves (150)
for i in range(150):
    sid = random.choice([s[0] for s in student_data])
    lt_id = random.choice(list(lt_map.values()))
    fd = rdate(date(2025,4,1), date(2026,3,1))
    days = random.randint(1, 5)
    td = fd + timedelta(days=days-1)
    status = random.choice(['approved','approved','approved','pending','rejected'])
    la_rows.append((S, 'student', sid, lt_id, fd, td, days,
                   random.choice(['Not feeling well','Family function','Medical appointment','Family emergency','Religious festival']),
                   None, status, U if status != 'pending' else None,
                   datetime.combine(fd, time(10,0)) if status != 'pending' else None,
                   None if status != 'rejected' else 'Insufficient leave balance'))

# Staff leaves (100)
for i in range(100):
    stf_id = random.choice(staff_ids)
    lt_id = random.choice(list(lt_map.values()))
    fd = rdate(date(2025,4,1), date(2026,3,1))
    days = random.randint(1, 5)
    td = fd + timedelta(days=days-1)
    status = random.choice(['approved','approved','pending','rejected'])
    la_rows.append((S, 'staff', stf_id, lt_id, fd, td, days,
                   random.choice(['Personal work','Medical leave','Family emergency','Marriage in family','Official work']),
                   None, status, U if status != 'pending' else None,
                   datetime.combine(fd, time(10,0)) if status != 'pending' else None, None))

bi('leave_applications', ['school_id','applicant_type','applicant_id','leave_type_id','from_date','to_date','days',
                          'reason','document_url','status','approved_by','approved_at','rejection_reason'], la_rows)
print(f"  Leave Applications: {len(la_rows)} {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 21: PAYROLL (Salary Structures + 12 months)
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 21: Staff Payroll")
print(f"{'='*60}")

# Salary Structures
ss_rows = []
for staff_id in staff_ids:
    basic = round(random.uniform(15000, 50000), 2)
    hra = round(basic * 0.4, 2)
    da = round(basic * 0.1, 2)
    ta = round(random.uniform(1000, 3000), 2)
    med = round(random.uniform(500, 2000), 2)
    special = round(random.uniform(1000, 5000), 2)
    pf = round(basic * 0.12, 2)
    esi = round(basic * 0.0075, 2) if basic <= 21000 else 0
    tds = round(basic * 0.1, 2) if basic > 30000 else 0
    pt = 200 if basic > 15000 else 0
    ss_rows.append((staff_id, S, basic, hra, da, ta, med, special, 0, pf, esi, tds, pt, 0, date(2025,4,1), 1))

bi('salary_structures', ['staff_id','school_id','basic_salary','hra','da','ta','medical_allowance',
                         'special_allowance','other_allowance','pf_deduction','esi_deduction','tds',
                         'professional_tax','other_deduction','effective_from','is_active'], ss_rows)

# Monthly Payroll (12 months × 120 staff = 1440)
sp_rows = []
months = [(4,2025),(5,2025),(6,2025),(7,2025),(8,2025),(9,2025),(10,2025),(11,2025),(12,2025),(1,2026),(2,2026),(3,2026)]
for staff_id in staff_ids:
    # Get this staff's salary structure
    idx = staff_ids.index(staff_id)
    basic = ss_rows[idx][2]
    hra = ss_rows[idx][3]
    da = ss_rows[idx][4]
    ta = ss_rows[idx][5]
    med = ss_rows[idx][6]
    special = ss_rows[idx][7]
    pf = ss_rows[idx][9]
    esi = ss_rows[idx][10]
    tds = ss_rows[idx][11]
    pt = ss_rows[idx][12]
    gross = basic + hra + da + ta + med + special
    total_ded = pf + esi + tds + pt
    net = gross - total_ded
    
    for month, year in months:
        pay_date = date(year, month, 28) if month != 2 else date(year, 2, 28)
        paid = pay_date <= date(2026, 3, 31)
        sp_rows.append((staff_id, S, month, year, basic, hra, da, ta, med, special, 0,
                       round(gross,2), pf, esi, tds, pt, 0, round(total_ded,2),
                       0, 0, 0, round(net,2), round(gross-basic,2), round(total_ded,2),
                       'paid' if paid else 'pending',
                       pay_date if paid else None,
                       random.choice(['bank_transfer','cheque']) if paid else None,
                       f'PAY{year}{month:02d}{staff_id}' if paid else None, None))

bi('staff_payroll', ['staff_id','school_id','month','year','basic_salary','hra','da','ta',
                     'medical_allowance','special_allowance','other_allowance','gross_salary',
                     'pf_deduction','esi_deduction','tds','professional_tax','other_deduction',
                     'total_deductions','overtime_hours','overtime_amount','leave_deduction',
                     'net_salary','allowances','deductions','payment_status','payment_date',
                     'payment_mode','transaction_ref','remarks'], sp_rows)

# Staff Leave Balances
slb_rows = []
for staff_id in staff_ids:
    cl_used = random.randint(0, 8)
    el_used = random.randint(0, 10)
    sl_used = random.randint(0, 5)
    slb_rows.append((staff_id, S, 2025, 12, cl_used, 15, el_used, 10, sl_used, 0, 0))
bi('staff_leave_balances', ['staff_id','school_id','year','cl_total','cl_used','el_total','el_used','sl_total','sl_used','ml_total','ml_used'], slb_rows)

print(f"  Salary Structures: {len(ss_rows)}, Payroll: {len(sp_rows)}, Leave Balances: {len(slb_rows)} {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 22: SYLLABUS & LESSON PLANS
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 22: Syllabus & Lesson Plans")
print(f"{'='*60}")

chapter_data = {
    'English': ['The Letter','Prose and Poetry','Grammar Basics','Comprehension','Creative Writing','Literature','Essay Writing','Vocabulary','Tenses','Active Passive'],
    'Hindi': ['Gadya Paath','Padya Paath','Vyakaran','Lekhan','Kavita','Kahani','Nibandh','Muhavare','Sandhi','Samas'],
    'Mathematics': ['Number System','Algebra','Geometry','Mensuration','Statistics','Probability','Trigonometry','Calculus','Sets','Matrices'],
    'Science': ['Living World','Matter and Materials','Force and Motion','Energy','Environment','Human Body','Chemical Reactions','Light','Sound','Electricity'],
}

syl_rows = []
for class_id in range(1, 16):
    subs = CLASS_SUBS.get(class_id, list(STREAM_SUBS.values())[0])
    for sub_name in subs:
        if sub_name not in sub_map: continue
        chapters = chapter_data.get(sub_name, ['Chapter 1','Chapter 2','Chapter 3','Chapter 4','Chapter 5'])
        for ch_num, ch_name in enumerate(chapters[:8], 1):
            term = 'term1' if ch_num <= 4 else 'term2'
            status = random.choice(['completed','in_progress','not_started'])
            comp_pct = 100 if status == 'completed' else random.randint(20,80) if status == 'in_progress' else 0
            syl_rows.append((S, class_id, sub_map[sub_name], AY, ch_num,
                           f'{ch_name} - {sub_name}', f'Topics: {ch_name}', f'Learning objectives for {ch_name}',
                           round(random.uniform(5,15),1), term, ch_num, None, status, comp_pct, U))

bi('syllabus', ['school_id','class_id','subject_id','academic_year_id','chapter_number',
                'chapter_name','topics','learning_objectives','estimated_hours','term',
                'display_order','resources','status','completion_percentage','created_by'], syl_rows)

# Lesson Plans (500)
lp_rows = []
for class_id in range(4, 16):
    subs = CLASS_SUBS.get(class_id, list(STREAM_SUBS.values())[0])
    for sub_name in subs[:4]:
        if sub_name not in sub_map: continue
        for month_off in range(10):
            lp_date = date(2025, 4, 1) + timedelta(days=month_off * 30 + random.randint(1, 25))
            if lp_date > date(2026, 3, 31): continue
            lp_rows.append((S, random.choice(teaching_ids), class_id, None, sub_map[sub_name], AY,
                           f'{sub_name} Lesson - Day {month_off+1}', lp_date, random.randint(1,8), 40,
                           f'Topic for {sub_name}', 'Sub-topics covered',
                           'Students will understand the concepts', 'Lecture, Discussion, Practice',
                           'Textbook, Whiteboard, Projector', None, 'Class activities and exercises',
                           'Formative assessment', 'Practice problems for homework', None, None, None, None,
                           random.choice(['draft','submitted','approved']), None, None, None))

bi('lesson_plans', ['school_id','teacher_id','class_id','section_id','subject_id','academic_year_id',
                    'title','date','period_number','duration_minutes','topic','subtopics',
                    'objectives','teaching_methodology','teaching_aids','board_work','student_activities',
                    'assessment_plan','homework_given','previous_knowledge','learning_outcomes',
                    'differentiation','reflection','status','approved_by','approved_at','rejection_reason'], lp_rows)

print(f"  Syllabus: {len(syl_rows)}, Lesson Plans: {len(lp_rows)} {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 23: STUDENT BEHAVIORS & ACHIEVEMENTS
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 23: Student Behaviors & Achievements")
print(f"{'='*60}")

# Behaviors (300)
beh_categories = ['Discipline','Academic','Social','Leadership','Attendance','Respect','Cleanliness']
beh_pos = ['Excellent performance in class','Helped fellow students','Good leadership skills',
           'Active participation in events','Perfect attendance this month','Clean and organized',
           'Won quiz competition','Represented school','Outstanding homework','Good sportsmanship']
beh_neg = ['Late to class','Incomplete homework','Disruptive behavior','Absent without notice',
           'Not following rules','Improper uniform','Mobile phone usage','Misbehavior']

beh_rows = []
for i in range(300):
    sid = random.choice([s[0] for s in student_data])
    btype = 'positive' if random.random() < 0.7 else 'negative'
    title = random.choice(beh_pos if btype == 'positive' else beh_neg)
    points = random.randint(5, 20) if btype == 'positive' else -random.randint(5, 15)
    beh_rows.append((S, sid, btype, random.choice(beh_categories), title,
                    f'Details: {title}', points,
                    None if btype == 'positive' else random.choice(['Warning','Parent informed','Counseling']),
                    U, rdate(date(2025,4,1), date(2026,3,31))))
bi('student_behaviors', ['school_id','student_id','behavior_type','category','title',
                         'description','points','action_taken','reported_by','incident_date'], beh_rows)

# Achievements (150)
ach_cats = ['academic','sports','cultural','science','leadership','community']
ach_levels = ['school','district','state','national']
ach_rows = []
for i in range(150):
    sid = random.choice([s[0] for s in student_data if s[1] >= 4])
    ach_rows.append((S, sid, f'Achievement in {random.choice(["Science","Math","Sports","Art","Music","Dance","Debate","Quiz"])}',
                    random.choice(ach_cats), random.choice(ach_levels),
                    random.choice(['1st','2nd','3rd','Participant','Winner','Runner-up']),
                    'Outstanding performance', rdate(date(2025,4,1), date(2026,3,31)),
                    None, random.randint(5, 25), U))
bi('student_achievements', ['school_id','student_id','title','category','level',
                           'position','description','event_date','certificate_url','points_earned','added_by'], ach_rows)

print(f"  Behaviors: {len(beh_rows)}, Achievements: {len(ach_rows)} {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 24: PARENT ENGAGEMENT
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 24: Parent Engagement")
print(f"{'='*60}")

# Parent Profiles (300)
pp_rows = []
parent_pool = random.sample([s[0] for s in student_data], min(300, len(student_data)))
for sid in parent_pool:
    pp_rows.append((S, None, None, f'{random.choice(FP)} {random.choice(LN)}',
                   f'98{random.randint(10000000,99999999)}',
                   f'parent{sid}@gmail.com', None, None,
                   random.choice(OCCUPATIONS), 'English', None, None, 1))
bi('parent_profiles', ['school_id','user_id','parent_detail_id','name','phone','email',
                       'photo_url','address','occupation','preferred_language',
                       'notification_preferences','last_login','is_active'], pp_rows)
cur.execute("SELECT id FROM parent_profiles WHERE school_id=%s", (S,))
pp_ids = [r[0] for r in cur.fetchall()]

# PTM Slots (20)
ptm_rows = []
for i in range(20):
    ptm_date = rdate(date(2025,7,1), date(2026,2,28))
    ptm_rows.append((S, f'PTM Meeting {i+1}', ptm_date, time(9,0), time(13,0), 15,
                    random.choice(teaching_ids), random.choice([c[0] for c in classes]), 30, 'active', U))
bi('ptm_slots', ['school_id','title','ptm_date','start_time','end_time','slot_duration',
                 'teacher_id','class_id','max_bookings','status','created_by'], ptm_rows)
cur.execute("SELECT id FROM ptm_slots WHERE school_id=%s", (S,))
ptm_ids = [r[0] for r in cur.fetchall()]

# PTM Bookings (50)
pb_rows = []
for i in range(min(50, len(ptm_ids) * 3)):
    pb_rows.append((S, random.choice(ptm_ids), random.choice(pp_ids) if pp_ids else None,
                   random.choice([s[0] for s in student_data]), time(9, random.choice([0,15,30,45])),
                   random.choice(['booked','completed','cancelled']), None, None, None))
bi('ptm_bookings', ['school_id','slot_id','parent_id','student_id','booking_time','status','notes','feedback','rating'], pb_rows)

# Feedback Surveys (5)
fs_rows = []
for i in range(5):
    fs_rows.append((S, f'Feedback Survey {i+1}: {random.choice(["Teaching Quality","School Facilities","Transport","Canteen","Overall Satisfaction"])}',
                   'Please share your feedback', 'general', 'parents',
                   json.dumps([{'q':'Rate overall satisfaction','type':'rating'},
                              {'q':'Any suggestions?','type':'text'}]),
                   random.random() < 0.5, 1, rdate(date(2025,4,1), date(2025,12,31)),
                   rdate(date(2025,5,1), date(2026,1,31)), U))
bi('feedback_surveys', ['school_id','title','description','survey_type','target_audience',
                        'questions','is_anonymous','is_active','start_date','end_date','created_by'], fs_rows)

# Grievances (30)
gr_rows = []
gr_cats = ['academic','transport','canteen','infrastructure','teacher','general','fees','hostel']
for i in range(30):
    gr_rows.append((S, f'GRV{i+1:04d}', random.choice(pp_ids) if pp_ids else None,
                   random.choice([s[0] for s in student_data]), random.choice(gr_cats),
                   f'Grievance about {random.choice(gr_cats)}',
                   'Details of the grievance and concern raised by parent',
                   random.choice(['low','medium','high']),
                   random.choice(['open','in_progress','resolved','closed']),
                   U, None, None, None, None, None, U))
bi('grievances', ['school_id','ticket_no','parent_id','student_id','category','subject',
                  'description','priority','status','assigned_to','resolution','resolved_at',
                  'resolved_by','parent_feedback','parent_rating','created_by'], gr_rows)

print(f"  Parent Profiles: {len(pp_rows)}, PTM: {len(ptm_rows)} slots, {len(pb_rows)} bookings, Grievances: {len(gr_rows)} {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 25: LEADS & ADMISSIONS
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 25: Leads & Admissions")
print(f"{'='*60}")

# Lead Sources
ls_names = ['Website','Walk-in','Referral','Social Media','Newspaper Ad','School Fair','Google Ads','WhatsApp']
bi('lead_sources', ['school_id','name'], [(S, n) for n in ls_names])
cur.execute("SELECT id FROM lead_sources WHERE school_id=%s", (S,))
ls_ids = [r[0] for r in cur.fetchall()]

# Campaigns
camp_rows = [
    (S, 'Admission Drive 2025-26', 'Annual admission campaign', date(2025,1,1), date(2025,6,30), 50000, 'completed', U),
    (S, 'Summer Camp Outreach', 'Summer camp for awareness', date(2025,5,1), date(2025,5,31), 20000, 'completed', U),
    (S, 'Social Media Campaign', 'Facebook and Instagram ads', date(2025,2,1), date(2025,4,30), 30000, 'completed', U),
    (S, 'Open House Event', 'School open house for parents', date(2025,3,15), date(2025,3,15), 15000, 'completed', U),
    (S, 'Admission 2026-27', 'Early bird admissions', date(2026,1,1), date(2026,3,31), 40000, 'active', U),
]
bi('campaigns', ['school_id','name','description','start_date','end_date','budget','status','created_by'], camp_rows)
cur.execute("SELECT id FROM campaigns WHERE school_id=%s", (S,))
camp_ids = [r[0] for r in cur.fetchall()]

# Leads (150)
lead_statuses = ['new','contacted','interested','visit_scheduled','visited','application','admitted','lost']
lead_rows = []
for i in range(150):
    lead_rows.append((S, f'{random.choice(MN+FN)} {random.choice(LN)}',
                     f'{random.choice(FP)} {random.choice(LN)}',
                     f'lead{i}@email.com', f'98{random.randint(10000000,99999999)}', None,
                     random.choice(ls_ids), random.choice(camp_ids) if random.random() < 0.5 else None,
                     random.choice(['Nursery','LKG','UKG','Class 1','Class 2','Class 6','Class 9','Class 11']),
                     random.choice(lead_statuses), random.choice(['low','medium','high']),
                     random.choice([None,'Interested in science stream','Wants transport','Sibling already studying']),
                     U))
bi('leads', ['school_id','student_name','parent_name','email','phone','alternate_phone',
             'source_id','campaign_id','class_interested','status','priority','notes','assigned_to'], lead_rows)
cur.execute("SELECT id FROM leads WHERE school_id=%s", (S,))
lead_ids = [r[0] for r in cur.fetchall()]

# Lead Followups (300)
lf_rows = []
for i in range(300):
    lid = random.choice(lead_ids)
    lf_rows.append((lid, S, random.choice(['call','whatsapp','email','visit','sms']),
                   random.choice(['Discussed admission process','Parent showed interest','Scheduled visit','Sent brochure','Follow up call done']),
                   rdate(date(2025,1,1), date(2026,3,31)),
                   random.choice(['completed','completed','pending','missed']), U))
bi('lead_followups', ['lead_id','school_id','followup_type','notes','followup_date','status','created_by'], lf_rows)

# Admissions (100)
adm_statuses = ['applied','document_verified','approved','enrolled','fee_pending','rejected']
adm_rows = []
for i in range(100):
    gender = random.choice(['male','female'])
    class_applied = random.choice([c[0] for c in classes])
    adm_rows.append((S, f'APP2025{i+1:04d}', random.choice(lead_ids) if random.random() < 0.3 else None,
                    f'{random.choice(MN if gender=="male" else FN)} {random.choice(LN)}',
                    student_dob(class_applied), gender, random.choice(BG),
                    random.choice(['Hindu','Muslim','Sikh','Christian']),
                    random.choice(['General','OBC','SC','ST']),
                    'Indian', None, None, f'{random.choice(CITIES)}, {random.choice(STATES)}',
                    random.choice(CITIES), random.choice(STATES), f'{random.randint(110000,499999)}',
                    f'{random.choice(FP)} {random.choice(LN)}', f'98{random.randint(10000000,99999999)}',
                    f'father{i}@email.com', random.choice(OCCUPATIONS),
                    random.choice(['2-5 Lakh','5-10 Lakh','10-20 Lakh']), None,
                    f'{random.choice(MP)} {random.choice(LN)}', f'98{random.randint(10000000,99999999)}',
                    f'mother{i}@email.com', random.choice(['Homemaker','Teacher','Doctor','Engineer']),
                    None, None, None, f'98{random.randint(10000000,99999999)}',
                    f'parent{i}@email.com', f'98{random.randint(10000000,99999999)}',
                    class_applied, AY,
                    random.choice([None,'Previous School Name']), None, None, None, 0, None, None,
                    0, None, None, None, None, date(2025, random.randint(1,6), random.randint(1,28)),
                    random.choice(['online','walk_in','referral','lead']),
                    random.choice(adm_statuses), 'normal', None, None, None, None, None, None,
                    0, None, None, None, None, U, None, None, None))

bi('admissions', ['school_id','application_no','lead_id','student_name','date_of_birth','gender','blood_group',
                  'religion','category','nationality','aadhar_no','photo_url','address','city','state','pincode',
                  'father_name','father_phone','father_email','father_occupation','father_income','father_aadhar',
                  'mother_name','mother_phone','mother_email','mother_occupation',
                  'guardian_name','guardian_phone','guardian_relation','phone','email','emergency_contact',
                  'class_applied','academic_year_id',
                  'previous_school','previous_class','previous_percentage','tc_number',
                  'has_sibling','sibling_admission_no','sibling_name',
                  'transport_required','pickup_address','medical_conditions','allergies','disability',
                  'application_date','application_source','status','priority','remarks','rejection_reason',
                  'entrance_test_id','test_score','test_result','merit_rank',
                  'admission_fee_paid','admission_fee_amount','fee_receipt_no','fee_payment_date','fee_payment_mode',
                  'processed_by','approved_by','approved_date','student_id'], adm_rows)

print(f"  Leads: {len(lead_rows)}, Followups: {len(lf_rows)}, Admissions: {len(adm_rows)} {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# PHASE 26: STAFF EXTRAS (Performance, Training, Duty Rosters)
# ═══════════════════════════════════════════════════════════════════════
print(f"\n{'='*60}")
print("PHASE 26: Staff Extras")
print(f"{'='*60}")

# Performance Reviews (120)
pr_rows = []
for staff_id in staff_ids:
    pr_rows.append((staff_id, S, '2025-26', U, 'annual',
                   random.randint(3,5), random.randint(3,5), random.randint(3,5),
                   random.randint(3,5), random.randint(3,5),
                   round(random.uniform(3.0,5.0),1),
                   'Good performance overall', 'Areas for improvement noted',
                   'Professional development goals', 'Keep up the good work',
                   random.choice(['submitted','acknowledged'])))
bi('performance_reviews', ['staff_id','school_id','review_period','reviewer_id','review_type',
                          'teaching_rating','punctuality_rating','communication_rating',
                          'knowledge_rating','teamwork_rating','overall_rating',
                          'strengths','improvements','goals','comments','status'], pr_rows)

# Training Records (60)
tr_rows = []
training_names = ['CBSE Workshop','Digital Teaching Methods','First Aid Training','Fire Safety Training',
                  'NEP 2020 Orientation','Assessment Techniques','Inclusive Education','Child Psychology',
                  'Smart Class Training','Sports Coaching Workshop']
for i in range(60):
    sd = rdate(date(2025,4,1), date(2026,3,31))
    tr_rows.append((random.choice(staff_ids), S, random.choice(training_names),
                   random.choice(['workshop','online','seminar','certification']),
                   random.choice(['CBSE','NCERT','State Board','Private Agency']),
                   sd, sd + timedelta(days=random.randint(1,5)),
                   round(random.uniform(4,40),1), random.randint(2,10), None,
                   random.choice(['completed','upcoming']), None))
bi('training_records', ['staff_id','school_id','training_name','training_type','provider',
                        'start_date','end_date','hours','cpd_points','certificate_url','status','remarks'], tr_rows)

print(f"  Performance Reviews: {len(pr_rows)}, Training: {len(tr_rows)} {elapsed()}")

# ═══════════════════════════════════════════════════════════════════════
# FINAL SUMMARY
# ═══════════════════════════════════════════════════════════════════════
total_time = tm.time() - t0
print(f"\n{'='*60}")
print("SEED DATA COMPLETE!")
print(f"{'='*60}")

# Count key tables
counts = {}
key_tables = ['staff','students','parent_details','student_attendance','staff_attendance',
              'fee_installments','fee_payments','exam_results','exam_schedules',
              'library_books','library_issues','hostel_allocations','canteen_transactions',
              'sports','sports_teams','health_records','health_checkups','infirmary_visits',
              'vehicles','transport_routes','student_transport','assets','inventory_items',
              'announcements','homework','leave_applications','staff_payroll','salary_structures',
              'syllabus','lesson_plans','student_behaviors','student_achievements',
              'parent_profiles','leads','admissions','clubs','tournaments','events']

for t in key_tables:
    try:
        cur.execute(f"SELECT COUNT(*) FROM `{t}` WHERE school_id=%s", (S,))
        counts[t] = cur.fetchone()[0]
    except:
        counts[t] = '?'

print(f"\n{'─'*40}")
print(f"  Staff:              {counts.get('staff',0):>10,}")
print(f"  Students:           {counts.get('students',0):>10,}")
print(f"  Parent Details:     {counts.get('parent_details',0):>10,}")
print(f"  Student Attendance: {counts.get('student_attendance',0):>10,}")
print(f"  Staff Attendance:   {counts.get('staff_attendance',0):>10,}")
print(f"  Fee Installments:   {counts.get('fee_installments',0):>10,}")
print(f"  Fee Payments:       {counts.get('fee_payments',0):>10,}")
print(f"  Exam Schedules:     {counts.get('exam_schedules',0):>10,}")
print(f"  Exam Results:       {counts.get('exam_results',0):>10,}")
print(f"  Library Books:      {counts.get('library_books',0):>10,}")
print(f"  Library Issues:     {counts.get('library_issues',0):>10,}")
print(f"  Hostel Allocations: {counts.get('hostel_allocations',0):>10,}")
print(f"  Canteen Txns:       {counts.get('canteen_transactions',0):>10,}")
print(f"  Sports:             {counts.get('sports',0):>10,}")
print(f"  Sports Teams:       {counts.get('sports_teams',0):>10,}")
print(f"  Tournaments:        {counts.get('tournaments',0):>10,}")
print(f"  Clubs:              {counts.get('clubs','?'):>10}")
print(f"  Events:             {counts.get('events',0):>10,}")
print(f"  Health Records:     {counts.get('health_records',0):>10,}")
print(f"  Health Checkups:    {counts.get('health_checkups',0):>10,}")
print(f"  Infirmary Visits:   {counts.get('infirmary_visits',0):>10,}")
print(f"  Vehicles:           {counts.get('vehicles',0):>10,}")
print(f"  Transport Routes:   {counts.get('transport_routes',0):>10,}")
print(f"  Student Transport:  {counts.get('student_transport',0):>10,}")
print(f"  Assets:             {counts.get('assets',0):>10,}")
print(f"  Inventory Items:    {counts.get('inventory_items',0):>10,}")
print(f"  Announcements:      {counts.get('announcements',0):>10,}")
print(f"  Homework:           {counts.get('homework',0):>10,}")
print(f"  Leave Applications: {counts.get('leave_applications',0):>10,}")
print(f"  Salary Structures:  {counts.get('salary_structures',0):>10,}")
print(f"  Staff Payroll:      {counts.get('staff_payroll',0):>10,}")
print(f"  Syllabus:           {counts.get('syllabus',0):>10,}")
print(f"  Lesson Plans:       {counts.get('lesson_plans',0):>10,}")
print(f"  Behaviors:          {counts.get('student_behaviors',0):>10,}")
print(f"  Achievements:       {counts.get('student_achievements',0):>10,}")
print(f"  Parent Profiles:    {counts.get('parent_profiles',0):>10,}")
print(f"  Leads:              {counts.get('leads',0):>10,}")
print(f"  Admissions:         {counts.get('admissions',0):>10,}")
print(f"{'─'*40}")

total_records = sum(v for v in counts.values() if isinstance(v, int))
print(f"  TOTAL RECORDS:      {total_records:>10,}")
print(f"  Time taken:         {total_time:>10.0f} seconds ({total_time/60:.1f} minutes)")
print(f"{'='*60}")

conn.close()
