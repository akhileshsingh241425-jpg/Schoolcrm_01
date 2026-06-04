"""Create Exam Controller user + seed full academic year exam data."""
import sys
sys.path.insert(0, '.')
from app import create_app, db
from app.models.user import User, Role
from app.models.staff import Staff
from app.models.school import School
from app.models.student import Student, Class, Section, AcademicYear
from app.models.academic import (
    Subject, ExamType, Exam, ExamSchedule, ExamResult, GradingSystem, Grade
)
from datetime import date, time, timedelta, datetime
import random

app = create_app('development')

with app.app_context():
    school = School.query.filter_by(code='DEMO001').first()
    sid = school.id

    # ─── 1. Create Exam Controller User ───
    role = Role.query.filter_by(name='exam_controller').first()
    if not role:
        role = Role(name='exam_controller', description='Exam Controller / Coordinator', is_system_role=True)
        db.session.add(role)
        db.session.flush()

    email = input('Enter exam controller email [exam.controller@demo.school]: ').strip() or 'exam.controller@demo.school'
    password = input('Enter password: ').strip()
    if not password:
        print('Password is required!')
        sys.exit(1)

    existing = User.query.filter_by(school_id=sid, email=email).first()
    if existing:
        existing.role_id = role.id
        existing.set_password(password)
        db.session.commit()
        print(f'Updated existing user: {email}')
    else:
        # Find a staff member to link
        staff = Staff.query.filter_by(school_id=sid, status='active').filter(
            Staff.user_id.is_(None)
        ).first()
        if not staff:
            staff = Staff(
                school_id=sid, first_name='Rakesh', last_name='Mishra',
                designation='Exam Controller', department='Examination',
                email=email, phone='9876500010', status='active',
                staff_type='teaching',
            )
            db.session.add(staff)
            db.session.flush()

        user = User(
            school_id=sid, role_id=role.id,
            email=email, first_name='Rakesh', last_name='Mishra',
            phone='9876500010', is_active=True,
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()
        staff.user_id = user.id
        staff.designation = 'Exam Controller'
        db.session.commit()
        print(f'Created exam controller user: {email}')

    print()
    print('='*50)
    print('EXAM CONTROLLER LOGIN:')
    print('='*50)
    print(f'  School Code : DEMO001')
    print(f'  Email       : {email}')
    print('='*50)

    # ─── 2. Ensure Academic Year ───
    ay = AcademicYear.query.filter_by(school_id=sid, is_current=True).first()
    if not ay:
        ay = AcademicYear(school_id=sid, name='2025-26', start_date=date(2025, 4, 1), end_date=date(2026, 3, 31), is_current=True)
        db.session.add(ay)
        db.session.flush()

    # ─── 3. Ensure Exam Types ───
    exam_types_data = ['Unit Test 1', 'Unit Test 2', 'Half Yearly', 'Unit Test 3', 'Unit Test 4', 'Annual Exam']
    exam_type_map = {}
    for et_name in exam_types_data:
        et = ExamType.query.filter_by(school_id=sid, name=et_name).first()
        if not et:
            et = ExamType(school_id=sid, name=et_name, code=et_name[:2].upper(), weightage=100)
            db.session.add(et)
            db.session.flush()
        exam_type_map[et_name] = et.id

    # ─── 4. Ensure Grading System ───
    gs = GradingSystem.query.filter_by(school_id=sid, is_default=True).first()
    if not gs:
        gs = GradingSystem(school_id=sid, name='CBSE Grading', type='percentage', is_default=True)
        db.session.add(gs)
        db.session.flush()
        grades_data = [
            ('A+', 91, 100, 10), ('A', 81, 90, 9), ('B+', 71, 80, 8),
            ('B', 61, 70, 7), ('C+', 51, 60, 6), ('C', 41, 50, 5),
            ('D', 33, 40, 4), ('F', 0, 32, 0),
        ]
        for name, mn, mx, gp in grades_data:
            g = Grade(grading_system_id=gs.id, school_id=sid, name=name, min_marks=mn, max_marks=mx, grade_point=gp, is_passing=mn >= 33)
            db.session.add(g)
        db.session.flush()

    # ─── 5. Get Classes & Subjects ───
    classes = Class.query.filter_by(school_id=sid).all()
    subjects = Subject.query.filter_by(school_id=sid, is_active=True).all()
    if not classes or not subjects:
        print('No classes or subjects found! Skipping exam data.')
        db.session.commit()
        sys.exit(0)

    # Pick 3-4 classes for exam data
    target_classes = classes[:4]
    target_subjects = subjects[:5]
    print(f'\nSeeding exams for {len(target_classes)} classes, {len(target_subjects)} subjects')

    # ─── 6. Create Full Year Exams ───
    exam_schedule_plan = [
        ('Unit Test 1 (July 2025)', 'Unit Test 1', date(2025, 7, 10), date(2025, 7, 15), 'completed'),
        ('Unit Test 2 (Sept 2025)', 'Unit Test 2', date(2025, 9, 15), date(2025, 9, 20), 'completed'),
        ('Half Yearly (Nov 2025)', 'Half Yearly', date(2025, 11, 10), date(2025, 11, 22), 'completed'),
        ('Unit Test 3 (Jan 2026)', 'Unit Test 3', date(2026, 1, 12), date(2026, 1, 17), 'completed'),
        ('Unit Test 4 (March 2026)', 'Unit Test 4', date(2026, 3, 5), date(2026, 3, 10), 'completed'),
        ('Annual Exam (March 2026)', 'Annual Exam', date(2026, 3, 15), date(2026, 3, 28), 'results_published'),
    ]

    for exam_name, et_name, start, end, status in exam_schedule_plan:
        existing_exam = Exam.query.filter_by(school_id=sid, name=exam_name).first()
        if existing_exam:
            print(f'  Exam exists: {exam_name}')
            continue

        exam = Exam(
            school_id=sid, name=exam_name,
            academic_year_id=ay.id, exam_type_id=exam_type_map.get(et_name),
            grading_system_id=gs.id,
            start_date=start, end_date=end, status=status,
        )
        db.session.add(exam)
        db.session.flush()

        # Add schedules for each class × subject
        day_offset = 0
        for cls in target_classes:
            sections = Section.query.filter_by(school_id=sid, class_id=cls.id).limit(2).all()
            if not sections:
                continue
            for subj in target_subjects[:4]:
                for sec in sections[:1]:  # Just first section
                    sched = ExamSchedule(
                        exam_id=exam.id, school_id=sid,
                        class_id=cls.id, section_id=sec.id, subject_id=subj.id,
                        exam_date=start + timedelta(days=day_offset % 10),
                        start_time=time(9, 0), end_time=time(11, 0),
                        max_marks=100, passing_marks=33,
                        is_marks_locked=(status in ('completed', 'results_published')),
                    )
                    db.session.add(sched)
                    db.session.flush()

                    # Add results for completed exams
                    if status in ('completed', 'results_published'):
                        students = Student.query.filter_by(
                            school_id=sid, current_class_id=cls.id,
                            current_section_id=sec.id, status='active'
                        ).limit(20).all()
                        for student in students:
                            marks = random.randint(28, 98)
                            pct = marks
                            grade_name = 'A+' if pct >= 91 else 'A' if pct >= 81 else 'B+' if pct >= 71 else 'B' if pct >= 61 else 'C+' if pct >= 51 else 'C' if pct >= 41 else 'D' if pct >= 33 else 'F'
                            result = ExamResult(
                                exam_schedule_id=sched.id, student_id=student.id,
                                school_id=sid, marks_obtained=marks,
                                percentage=pct, grade=grade_name,
                                is_absent=(random.random() < 0.05),
                            )
                            db.session.add(result)
                    day_offset += 1

        db.session.flush()
        print(f'  Created: {exam_name} ({status})')

    db.session.commit()
    print('\n✅ Full academic year exam data seeded!')
    print(f'\nAll Logins:')
    print(f'  Exam Controller : exam.controller@demo.school / Exam@123')
    print(f'  Principal       : principal@demo.school / Principal@123')
    print(f'  Teacher         : sunita.sharma@school.edu / Teacher@123')
    print(f'  Student         : student.aarav@demo.school / Student@123')
