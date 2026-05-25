"""
Dummy Data Generator for School CRM
Usage: python seed_dummy_data.py --school-code DEMO001
"""

import sys
import os
import random
from datetime import datetime, date, timedelta
from werkzeug.security import generate_password_hash

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app import create_app
from app import db
from app.models.school import School
from app.models.student import Student, Class, Section, AcademicYear, ParentDetail
from app.models.staff import Staff
from app.models.user import User, Role
from app.models.fee import FeeCategory, FeeStructure, FeeInstallment
from app.models.academic import (
    Subject, ClassSubject, Timetable, LessonPlan, Homework,
    StudyMaterial, TeacherSubject, ExamType, GradingSystem, Grade,
    Exam, ExamSchedule, ExamHall, Syllabus, AcademicCalendar
)
from app.models.attendance import (
    StudentAttendance, AttendanceRule, LeaveType
)
from app.models.communication import Announcement

CLASS_NAMES = ['Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
               'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11 Science',
               'Class 11 Commerce', 'Class 11 Arts', 'Class 12 Science', 'Class 12 Commerce',
               'Class 12 Arts']

STUDENT_FIRST_NAMES = [
    'Aarav', 'Aanya', 'Advik', 'Anaya', 'Arjun', 'Avani', 'Dhruv', 'Diya',
    'Ishaan', 'Ishita', 'Kabir', 'Kavya', 'Krishna', 'Lakshmi', 'Manav',
    'Maya', 'Neel', 'Nisha', 'Om', 'Pari', 'Pranav', 'Rhea', 'Rohan', 'Sara',
    'Shaurya', 'Shreya', 'Tanvi', 'Tanish', 'Udita', 'Vihaan', 'Vivaan', 'Yash',
    'Aditi', 'Akash', 'Anvi', 'Arya', 'Ayaan', 'Chhavi', 'Dev', 'Eisha',
    'Gaurav', 'Gita', 'Harsh', 'Ira', 'Jai', 'Jaya', 'Karan', 'Lavanya',
    'Madhav', 'Myra', 'Nakul', 'Navya', 'Parth', 'Pooja', 'Raghav', 'Sakshi',
    'Samar', 'Sanya', 'Shiv', 'Tara', 'Umesh', 'Varsha', 'Ved', 'Yashika',
    'Aarush', 'Amaira', 'Bhavya', 'Chirag', 'Darsh', 'Ekta', 'Falguni', 'Gopal',
    'Harini', 'Hemant', 'Jhanvi', 'Kartik', 'Lalit', 'Manvi', 'Navneet', 'Ojas',
    'Payal', 'Quasar', 'Rajvi', 'Riddhi', 'Sahil', 'Shivani', 'Tushar', 'Urvi',
    'Varun', 'Yashvi', 'Zara', 'Akshay', 'Bhavna', 'Chetan', 'Divya', 'Esha'
]

STUDENT_LAST_NAMES = [
    'Sharma', 'Verma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Joshi', 'Reddy',
    'Nair', 'Menon', 'Das', 'Chatterjee', 'Banerjee', 'Mukherjee', 'Iyer',
    'Rao', 'Pillai', 'Desai', 'Shah', 'Mehta', 'Trivedi', 'Pandey', 'Mishra',
    'Saxena', 'Srivastava', 'Tiwari', 'Dubey', 'Chauhan', 'Solanki', 'Rathore',
    'Thakur', 'Yadav', 'Khan', 'Ansari', 'Sheikh', 'Mirza', 'Naidu', 'Murthy',
    'Acharya', 'Bhat', 'Hegde', 'Shetty', 'Pai', 'Kamath', 'Kulkarni', 'Patil',
    'Jadhav', 'Gaikwad', 'Sawant', 'D\'Souza', 'Fernandes', 'Pereira', 'Lobo'
]

TEACHER_FIRST_NAMES = ['Sunita', 'Rajesh', 'Priya', 'Vikram', 'Anita', 'Suresh', 'Neha', 'Amit',
                       'Deepa', 'Rahul', 'Kavita', 'Sanjay', 'Meena', 'Alok', 'Rekha', 'Manoj',
                       'Swati', 'Nitin', 'Poonam', 'Vivek', 'Shalini', 'Ravi', 'Archana', 'Prakash']

TEACHER_LAST_NAMES = ['Sharma', 'Verma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Joshi', 'Reddy',
                      'Nair', 'Menon', 'Das', 'Chatterjee', 'Banerjee', 'Mukherjee', 'Iyer']

SUBJECTS_DATA = [
    {'name': 'Mathematics', 'code': 'MATH', 'type': 'theory'},
    {'name': 'English', 'code': 'ENG', 'type': 'theory'},
    {'name': 'Hindi', 'code': 'HIN', 'type': 'theory'},
    {'name': 'Science', 'code': 'SCI', 'type': 'theory'},
    {'name': 'Social Studies', 'code': 'SST', 'type': 'theory'},
    {'name': 'Computer Science', 'code': 'CS', 'type': 'both'},
    {'name': 'General Knowledge', 'code': 'GK', 'type': 'theory'},
    {'name': 'Art & Craft', 'code': 'ART', 'type': 'practical'},
    {'name': 'Physical Education', 'code': 'PE', 'type': 'practical'},
    {'name': 'Moral Science', 'code': 'MS', 'type': 'theory'},
    {'name': 'Physics', 'code': 'PHY', 'type': 'theory'},
    {'name': 'Chemistry', 'code': 'CHEM', 'type': 'theory'},
    {'name': 'Biology', 'code': 'BIO', 'type': 'theory'},
    {'name': 'Accountancy', 'code': 'ACC', 'type': 'theory'},
    {'name': 'Business Studies', 'code': 'BST', 'type': 'theory'},
    {'name': 'Economics', 'code': 'ECO', 'type': 'theory'},
    {'name': 'History', 'code': 'HIST', 'type': 'theory'},
    {'name': 'Political Science', 'code': 'POL', 'type': 'theory'},
    {'name': 'Geography', 'code': 'GEO', 'type': 'theory'},
    {'name': 'Sociology', 'code': 'SOC', 'type': 'theory'},
    {'name': 'Psychology', 'code': 'PSY', 'type': 'theory'},
]

DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
PERIODS = [
    ('08:00', '08:45'), ('08:45', '09:30'), ('09:30', '10:15'),
    ('10:15', '10:30'),  # break
    ('10:30', '11:15'), ('11:15', '12:00'), ('12:00', '12:45'),
    ('12:45', '13:30'),  # lunch
    ('13:30', '14:15'), ('14:15', '15:00')
]


def get_class_numeric(name):
    mapping = {
        'Nursery': 0, 'KG': 0,
        'Class 1': 1, 'Class 2': 2, 'Class 3': 3, 'Class 4': 4, 'Class 5': 5,
        'Class 6': 6, 'Class 7': 7, 'Class 8': 8, 'Class 9': 9, 'Class 10': 10,
        'Class 11 Science': 11, 'Class 11 Commerce': 11, 'Class 11 Arts': 11,
        'Class 12 Science': 12, 'Class 12 Commerce': 12, 'Class 12 Arts': 12,
    }
    return mapping.get(name, 0)


def get_subjects_for_class(class_name):
    num = get_class_numeric(class_name)
    base = ['Mathematics', 'English', 'Hindi', 'General Knowledge', 'Art & Craft', 'Physical Education', 'Moral Science']

    if 'Nursery' in class_name or class_name == 'KG':
        return base[:4] + ['Science']

    if num <= 5:
        return base + ['Science', 'Social Studies', 'Computer Science']

    if num <= 8:
        return base + ['Science', 'Social Studies', 'Computer Science']

    if num <= 10:
        return base + ['Science', 'Social Studies', 'Computer Science']

    # Class 11/12
    if 'Science' in class_name:
        return ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
                'Physical Education']
    elif 'Commerce' in class_name:
        return ['Mathematics', 'English', 'Accountancy', 'Business Studies', 'Economics',
                'Computer Science', 'Physical Education']
    else:
        return ['English', 'History', 'Political Science', 'Geography', 'Sociology', 'Psychology',
                'Physical Education']


def random_date(start, end):
    delta = end - start
    return start + timedelta(days=random.randint(0, delta.days))


def seed_data(school_code):
    app = create_app()
    with app.app_context():
        school = School.query.filter_by(code=school_code).first()
        if not school:
            print(f"School with code '{school_code}' not found!")
            return

        school_id = school.id
        print(f"Seeding data for: {school.name} (ID: {school_id})")

        role_teacher = Role.query.filter_by(name='teacher').first()
        role_accountant = Role.query.filter_by(name='accountant').first()
        role_librarian = Role.query.filter_by(name='librarian').first()

        # === 1. ACADEMIC YEAR ===
        ay = AcademicYear.query.filter_by(school_id=school_id, is_current=True).first()
        if not ay:
            ay = AcademicYear(
                school_id=school_id, name='2025-2026',
                start_date=date(2025, 4, 1), end_date=date(2026, 3, 31),
                is_current=True
            )
            db.session.add(ay)
            db.session.flush()
            print("Created Academic Year: 2025-2026")

        # === 2. CLASSES & SECTIONS ===
        sections_data = ['A', 'B', 'C', 'D']
        class_obj_map = {}
        section_obj_map = {}

        existing_classes = Class.query.filter_by(school_id=school_id).all()
        existing_class_names = {c.name for c in existing_classes}

        for cls_name in CLASS_NAMES:
            if cls_name not in existing_class_names:
                cls = Class(
                    school_id=school_id, name=cls_name,
                    numeric_name=get_class_numeric(cls_name),
                    description=f"{cls_name} section"
                )
                db.session.add(cls)
                db.session.flush()
                print(f"  Created Class: {cls_name}")
            else:
                cls = Class.query.filter_by(school_id=school_id, name=cls_name).first()

            class_obj_map[cls_name] = cls

            # Create sections if not exist
            existing_sections = Section.query.filter_by(class_id=cls.id).all()
            existing_sec_names = {s.name for s in existing_sections}
            for sec_name in sections_data:
                if sec_name not in existing_sec_names:
                    sec = Section(
                        school_id=school_id, class_id=cls.id,
                        name=sec_name, capacity=40
                    )
                    db.session.add(sec)
                    db.session.flush()
                    print(f"    Created Section: {cls_name} - {sec_name}")
                else:
                    sec = Section.query.filter_by(class_id=cls.id, name=sec_name).first()
                section_obj_map[f"{cls_name}_{sec_name}"] = sec

        db.session.commit()
        print("Classes & Sections done.")

        # === 3. SUBJECTS ===
        subject_map = {}
        existing_subjects = Subject.query.filter_by(school_id=school_id).all()
        existing_subj_names = {s.name for s in existing_subjects}

        for subj in SUBJECTS_DATA:
            if subj['name'] not in existing_subj_names:
                s = Subject(
                    school_id=school_id, name=subj['name'],
                    code=subj['code'], type=subj['type'], is_active=True
                )
                db.session.add(s)
                db.session.flush()
            else:
                s = Subject.query.filter_by(school_id=school_id, name=subj['name']).first()
            subject_map[subj['name']] = s

        db.session.commit()

        # Map subjects to classes
        for cls_name, cls in class_obj_map.items():
            subjects = get_subjects_for_class(cls_name)
            existing_cs = {cs.subject.name for cs in ClassSubject.query.filter_by(
                school_id=school_id, class_id=cls.id).all()}
            for subj_name in subjects:
                if subj_name in subject_map and subj_name not in existing_cs:
                    cs = ClassSubject(
                        school_id=school_id, class_id=cls.id,
                        subject_id=subject_map[subj_name].id
                    )
                    db.session.add(cs)
        db.session.commit()
        print("Subjects & Class-Subject mapping done.")

        # === 4. TEACHERS (STAFF) ===
        teachers = []
        existing_staff = Staff.query.filter_by(school_id=school_id).all()
        existing_staff_names = {(s.first_name, s.last_name) for s in existing_staff}

        idx = 0
        for i in range(20):
            fn = TEACHER_FIRST_NAMES[i % len(TEACHER_FIRST_NAMES)]
            ln = TEACHER_LAST_NAMES[i % len(TEACHER_LAST_NAMES)]
            if (fn, ln) in existing_staff_names:
                staff = Staff.query.filter_by(school_id=school_id, first_name=fn, last_name=ln).first()
            else:
                staff = Staff(
                    school_id=school_id,
                    employee_id=f"TCH{school_id:03d}{i+1:03d}",
                    first_name=fn, last_name=ln,
                    gender='female' if fn in ['Sunita', 'Priya', 'Anita', 'Neha', 'Deepa', 'Kavita',
                                              'Meena', 'Rekha', 'Swati', 'Poonam', 'Shalini', 'Archana',
                                              'Anjali', 'Sneha', 'Geeta', 'Nandini'] else 'male',
                    phone=f"98765{i+1:05d}",
                    email=f"{fn.lower()}.{ln.lower()}@school.edu",
                    qualification='M.Ed' if i % 3 == 0 else 'B.Ed',
                    experience_years=random.randint(2, 20),
                    designation='Senior Teacher' if i < 8 else 'Teacher',
                    department='Academic',
                    date_of_joining=random_date(date(2018, 4, 1), date(2024, 3, 31)),
                    salary=random.choice([25000, 30000, 35000, 40000, 45000, 50000]),
                    address=f"{random.randint(1, 999)}, Main Street",
                    city='Delhi', state='Delhi',
                    staff_type='teaching', contract_type='permanent',
                    status='active'
                )
                db.session.add(staff)
                db.session.flush()

                if role_teacher:
                    user = User.query.filter_by(school_id=school_id, email=staff.email).first()
                    if not user:
                        user = User(
                            school_id=school_id, role_id=role_teacher.id,
                            email=staff.email, first_name=fn, last_name=ln,
                            password_hash=generate_password_hash('password123'),
                            is_active=True
                        )
                        db.session.add(user)

            teachers.append(staff)
            idx += 1

        db.session.commit()
        print(f"Teachers created: {len(teachers)}")

        # === 5. ASSIGN CLASS TEACHERS ===
        teacher_idx = 0
        for cls_name, cls in class_obj_map.items():
            for sec_name in sections_data:
                sec = section_obj_map.get(f"{cls_name}_{sec_name}")
                if sec and teacher_idx < len(teachers):
                    if not sec.class_teacher_id:
                        sec.class_teacher_id = teachers[teacher_idx % len(teachers)].id
                        teacher_idx += 1
        db.session.commit()
        print("Class teachers assigned.")

        # === 6. TEACHER-SUBJECT ALLOCATION ===
        for cls_name, cls in class_obj_map.items():
            subjects = get_subjects_for_class(cls_name)
            for subj_name in subjects:
                if subj_name in subject_map:
                    for sec_name in sections_data:
                        sec = section_obj_map.get(f"{cls_name}_{sec_name}")
                        if sec:
                            t = random.choice(teachers)
                            existing = TeacherSubject.query.filter_by(
                                school_id=school_id, teacher_id=t.id,
                                subject_id=subject_map[subj_name].id,
                                class_id=cls.id, section_id=sec.id,
                                academic_year_id=ay.id
                            ).first()
                            if not existing:
                                ts = TeacherSubject(
                                    school_id=school_id, teacher_id=t.id,
                                    subject_id=subject_map[subj_name].id,
                                    class_id=cls.id, section_id=sec.id,
                                    academic_year_id=ay.id,
                                    periods_per_week=random.randint(3, 6),
                                    status='active'
                                )
                                db.session.add(ts)

        db.session.commit()
        print("Teacher-subject allocation done.")

        # === 7. STUDENTS (20 per class) ===
        student_count = 0
        total_per_class = 20
        existing_students = Student.query.filter_by(school_id=school_id).count()
        if existing_students >= len(class_obj_map) * total_per_class * len(sections_data):
            print(f"Students already exist ({existing_students}), skipping...")
        else:
            name_idx = 0
            for cls_name, cls in class_obj_map.items():
                for sec_name in sections_data:
                    sec = section_obj_map.get(f"{cls_name}_{sec_name}")
                    existing_in_sec = Student.query.filter_by(
                        school_id=school_id, current_class_id=cls.id,
                        current_section_id=sec.id
                    ).count()
                    needed = total_per_class - existing_in_sec
                    if needed <= 0:
                        continue
                    for i in range(needed):
                        fn = STUDENT_FIRST_NAMES[(name_idx + i) % len(STUDENT_FIRST_NAMES)]
                        ln = STUDENT_LAST_NAMES[(name_idx + i) % len(STUDENT_LAST_NAMES)]
                        gender = 'male' if name_idx % 2 == 0 else 'female'
                        dob = random_date(date(2010, 1, 1), date(2020, 12, 31))
                        student = Student(
                            school_id=school_id,
                            admission_no=f"ADM{school_id:03d}{student_count+1:06d}",
                            roll_no=str((existing_in_sec + i + 1)),
                            first_name=fn, last_name=ln,
                            gender=gender, date_of_birth=dob,
                            blood_group=random.choice(['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-']),
                            religion='Hindu', category='General', nationality='Indian',
                            aadhar_no=f"{random.randint(1000, 9999)} {random.randint(1000, 9999)} {random.randint(1000, 9999)}",
                            address=f"{random.randint(1, 999)}, {random.choice(['MG Road', 'Park Street', 'Lajpat Nagar', 'Model Town', 'Green Avenue'])}",
                            city='Delhi', state='Delhi', pincode='110001',
                            current_class_id=cls.id, current_section_id=sec.id,
                            academic_year_id=ay.id,
                            admission_date=random_date(date(2025, 4, 1), date(2025, 7, 31)),
                            status='active'
                        )
                        db.session.add(student)
                        db.session.flush()
                        student_count += 1

                        # Parent record
                        pd = ParentDetail(
                            student_id=student.id, school_id=school_id,
                            relation='father',
                            name=f"{random.choice(['Raj', 'Suresh', 'Amit', 'Vijay', 'Ravi', 'Mohan', 'Ramesh'])} {ln}",
                            phone=f"9810{random.randint(100000, 999999)}",
                            email=f"parent.{fn.lower()}.{ln.lower()}@email.com",
                            occupation=random.choice(['Business', 'Engineer', 'Doctor', 'Teacher', 'Government', 'Private Job'])
                        )
                        db.session.add(pd)

                        if name_idx % 3 == 0:
                            pd2 = ParentDetail(
                                student_id=student.id, school_id=school_id,
                                relation='mother',
                                name=f"{random.choice(['Sunita', 'Priya', 'Anita', 'Neha', 'Kavita', 'Meena'])} {ln}",
                                phone=f"9811{random.randint(100000, 999999)}",
                                occupation='Housewife'
                            )
                            db.session.add(pd2)

                        name_idx += 1

            db.session.commit()
            print(f"Students created: {student_count}")

        # === 8. TIMETABLE ===
        tt_count = 0
        for cls_name, cls in class_obj_map.items():
            subjects = get_subjects_for_class(cls_name)
            for sec_name in sections_data:
                sec = section_obj_map.get(f"{cls_name}_{sec_name}")
                existing_tt = Timetable.query.filter_by(
                    school_id=school_id, class_id=cls.id,
                    section_id=sec.id, academic_year_id=ay.id
                ).count()
                if existing_tt > 0:
                    continue
                for day in DAYS:
                    period_num = 1
                    for start_t, end_t in PERIODS:
                        st = datetime.strptime(start_t, '%H:%M').time()
                        et = datetime.strptime(end_t, '%H:%M').time()

                        # break/lunch periods
                        is_break = False
                        if period_num == 4:
                            is_break = True
                        elif period_num == 8:
                            is_break = True

                        if is_break:
                            tt = Timetable(
                                school_id=school_id, class_id=cls.id,
                                section_id=sec.id, academic_year_id=ay.id,
                                day_of_week=day,
                                start_time=st, end_time=et,
                                period_number=period_num,
                                is_break=True,
                                room_no=''
                            )
                            db.session.add(tt)
                        else:
                            subj_name = random.choice(subjects)
                            if subj_name in subject_map:
                                t = random.choice(teachers)
                                tt = Timetable(
                                    school_id=school_id, class_id=cls.id,
                                    section_id=sec.id, subject_id=subject_map[subj_name].id,
                                    teacher_id=t.id, academic_year_id=ay.id,
                                    day_of_week=day,
                                    start_time=st, end_time=et,
                                    period_number=period_num,
                                    is_break=False,
                                    room_no=str(random.randint(101, 320))
                                )
                                db.session.add(tt)
                        period_num += 1
                        tt_count += 1
        db.session.commit()
        print(f"Timetable entries created: {tt_count}")

        # === 9. ATTENDANCE RULES ===
        if not AttendanceRule.query.filter_by(school_id=school_id).first():
            ar = AttendanceRule(
                school_id=school_id,
                minimum_percentage=75.00, alert_threshold=80.00,
                late_arrival_minutes=15, half_day_minutes=120,
                school_start_time=datetime.strptime('08:00', '%H:%M').time(),
                school_end_time=datetime.strptime('15:00', '%H:%M').time(),
                periods_per_day=8, period_duration_minutes=40,
                working_days='mon,tue,wed,thu,fri,sat'
            )
            db.session.add(ar)
            db.session.commit()
            print("Attendance rules created.")

        # === 10. LEAVE TYPES ===
        leave_types_data = [
            {'name': 'Sick Leave', 'code': 'SL', 'max_days': 12, 'is_paid': True},
            {'name': 'Casual Leave', 'code': 'CL', 'max_days': 10, 'is_paid': True},
            {'name': 'Earned Leave', 'code': 'EL', 'max_days': 15, 'is_paid': True},
            {'name': 'Maternity Leave', 'code': 'ML', 'max_days': 180, 'is_paid': True},
            {'name': 'Leave Without Pay', 'code': 'LWP', 'max_days': 30, 'is_paid': False},
        ]
        existing_lt = {lt.name for lt in LeaveType.query.filter_by(school_id=school_id).all()}
        for lt in leave_types_data:
            if lt['name'] not in existing_lt:
                lv = LeaveType(
                    school_id=school_id, name=lt['name'], code=lt['code'],
                    applies_to='both', max_days_per_year=lt['max_days'],
                    is_paid=lt['is_paid'], is_active=True
                )
                db.session.add(lv)
        db.session.commit()
        print("Leave types created.")

        # === 11. FEE CATEGORIES & STRUCTURES ===
        fee_categories = ['Tuition Fee', 'Development Fee', 'Sports Fee', 'Library Fee', 'Transport Fee',
                          'Computer Fee', 'Lab Fee', 'Annual Fee']
        existing_fc = {fc.name for fc in FeeCategory.query.filter_by(school_id=school_id).all()}
        fc_objs = {}
        for fname in fee_categories:
            if fname not in existing_fc:
                fc = FeeCategory(school_id=school_id, name=fname, description=f"{fname} category")
                db.session.add(fc)
                db.session.flush()
            else:
                fc = FeeCategory.query.filter_by(school_id=school_id, name=fname).first()
            fc_objs[fname] = fc
        db.session.commit()

        for cls_name, cls in class_obj_map.items():
            num = get_class_numeric(cls_name)
            base_amount = 2000 + num * 500
            for fc_name, fc in fc_objs.items():
                existing_fs = FeeStructure.query.filter_by(
                    school_id=school_id, class_id=cls.id,
                    fee_category_id=fc.id
                ).first()
                if not existing_fs:
                    multiplier = {
                        'Tuition Fee': 1.0, 'Development Fee': 0.3, 'Sports Fee': 0.1,
                        'Library Fee': 0.05, 'Transport Fee': 0.2, 'Computer Fee': 0.15,
                        'Lab Fee': 0.12, 'Annual Fee': 0.5
                    }
                    amount = base_amount * multiplier.get(fc_name, 0.1)
                    fs = FeeStructure(
                        school_id=school_id, academic_year_id=ay.id,
                        class_id=cls.id, fee_category_id=fc.id,
                        amount=amount, frequency='yearly'
                    )
                    db.session.add(fs)
        db.session.commit()
        print("Fee categories & structures created.")

        # === 12. EXAM SETUP ===
        exam_types_data = [
            {'name': 'Periodic Test', 'code': 'PT', 'weightage': 10},
            {'name': 'Half Yearly', 'code': 'HY', 'weightage': 30},
            {'name': 'Annual Exam', 'code': 'AE', 'weightage': 60},
        ]
        existing_et = {et.name for et in ExamType.query.filter_by(school_id=school_id).all()}
        et_objs = {}
        for etd in exam_types_data:
            if etd['name'] not in existing_et:
                et = ExamType(
                    school_id=school_id, name=etd['name'], code=etd['code'],
                    weightage=etd['weightage'], is_active=True
                )
                db.session.add(et)
                db.session.flush()
            else:
                et = ExamType.query.filter_by(school_id=school_id, name=etd['name']).first()
            et_objs[etd['name']] = et
        db.session.commit()

        # Grading System
        if not GradingSystem.query.filter_by(school_id=school_id, is_default=True).first():
            gs = GradingSystem(
                school_id=school_id, name='Standard Grading',
                type='percentage', is_default=True, is_active=True
            )
            db.session.add(gs)
            db.session.flush()
            grades = [
                ('A+', 90, 100, 10.0, True), ('A', 80, 89, 9.0, True),
                ('B+', 70, 79, 8.0, True), ('B', 60, 69, 7.0, True),
                ('C+', 50, 59, 6.0, True), ('C', 40, 49, 5.0, True),
                ('D', 33, 39, 4.0, True), ('F', 0, 32, 0.0, False),
            ]
            for gname, gmin, gmax, gp, passing in grades:
                g = Grade(
                    grading_system_id=gs.id, school_id=school_id,
                    name=gname, min_marks=gmin, max_marks=gmax,
                    grade_point=gp, is_passing=passing
                )
                db.session.add(g)
            db.session.commit()
            print("Grading system created.")

        # Exam halls
        if not ExamHall.query.filter_by(school_id=school_id).first():
            halls_data = [
                ('Hall 1', 'Main Building', 60), ('Hall 2', 'Main Building', 60),
                ('Hall 3', 'Annex', 40), ('Lab 1', 'Science Block', 30),
            ]
            for hname, hbldg, hcap in halls_data:
                hall = ExamHall(
                    school_id=school_id, name=hname, building=hbldg,
                    capacity=hcap, is_active=True
                )
                db.session.add(hall)
            db.session.commit()
            print("Exam halls created.")

        # === 13. SYLLABUS ===
        syllabus_count = 0
        for cls_name, cls in class_obj_map.items():
            subjects = get_subjects_for_class(cls_name)
            for subj_name in subjects:
                if subj_name in subject_map:
                    existing_syl = Syllabus.query.filter_by(
                        school_id=school_id, class_id=cls.id,
                        subject_id=subject_map[subj_name].id
                    ).first()
                    if not existing_syl:
                        for ch in range(1, 6):
                            syl = Syllabus(
                                school_id=school_id, class_id=cls.id,
                                subject_id=subject_map[subj_name].id,
                                academic_year_id=ay.id,
                                chapter_number=ch,
                                chapter_name=f"Chapter {ch}: {random.choice(['Introduction', 'Basics', 'Advanced Concepts', 'Applications', 'Review'])}",
                                topics=f"Topic A, Topic B, Topic C for chapter {ch}",
                                estimated_hours=random.randint(4, 12),
                                term=random.choice(['term1', 'term2', 'annual']),
                                status='not_started'
                            )
                            db.session.add(syl)
                            syllabus_count += 1
        db.session.commit()
        print(f"Syllabus entries: {syllabus_count}")

        # === 14. ACADEMIC CALENDAR ===
        if not AcademicCalendar.query.filter_by(school_id=school_id).first():
            events = [
                ('Independence Day', 'cultural', date(2025, 8, 15)),
                ('Teachers Day', 'event', date(2025, 9, 5)),
                ('Diwali Break', 'holiday', date(2025, 10, 20)),
                ('Annual Sports Day', 'sports', date(2025, 12, 15)),
                ('Winter Break', 'vacation', date(2025, 12, 25)),
                ('Republic Day', 'holiday', date(2026, 1, 26)),
                ('Annual Day', 'cultural', date(2026, 2, 28)),
                ('Holi Break', 'holiday', date(2026, 3, 14)),
            ]
            for ev_title, ev_type, ev_date in events:
                cal = AcademicCalendar(
                    school_id=school_id, academic_year_id=ay.id,
                    title=ev_title, description=f"{ev_title} celebration",
                    event_type=ev_type, start_date=ev_date,
                    is_holiday=(ev_type == 'holiday' or ev_type == 'vacation')
                )
                db.session.add(cal)
            db.session.commit()
            print("Academic calendar created.")

        # === 15. ANNOUNCEMENTS ===
        if not Announcement.query.filter_by(school_id=school_id).first():
            announcements = [
                'School will remain closed on Independence Day.',
                'Parent Teacher Meeting scheduled for next Saturday.',
                'Annual Sports Day registration open.',
                'Winter uniform mandatory from November.',
                'Fee payment deadline extended.',
            ]
            for msg in announcements:
                ann = Announcement(
                    school_id=school_id, title='Notice',
                    message=msg, target_audience='all',
                    is_published=True, published_at=datetime.utcnow()
                )
                db.session.add(ann)
            db.session.commit()
            print("Announcements created.")

        print("\n=== SEEDING COMPLETE ===")
        print(f"  School: {school.name}")
        print(f"  Classes: {len(class_obj_map)}")
        print(f"  Subjects: {len(subject_map)}")
        print(f"  Teachers: {len(teachers)}")
        print(f"  Students: {Student.query.filter_by(school_id=school_id).count()}")
        print(f"  Timetable entries: {Timetable.query.filter_by(school_id=school_id, academic_year_id=ay.id).count()}")


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Seed dummy data for a school')
    parser.add_argument('--school-code', default='DEMO001', help='School code')
    args = parser.parse_args()
    seed_data(args.school_code)
