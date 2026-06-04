"""
Seed Exam Data for Exam Controller
Run: python seed_exam_data.py (from backend folder)
Creates: Exam Types, Exams, Schedules, Date Sheet with realistic data
"""
import sys, os
sys.path.insert(0, '.')

from app import create_app, db
from app.models.school import School
from app.models.student import Class, Section, AcademicYear
from app.models.academic import (
    Subject, Exam, ExamType, ExamSchedule, ExamHall, GradingSystem, Grade
)
from app.models.exam_extended import ExamDateSheet
from datetime import datetime, date, time, timedelta

app = create_app('development')

with app.app_context():
    # Find school
    school = School.query.filter_by(code='DEMO001').first()
    if not school:
        school = School.query.first()
    if not school:
        print("ERROR: No school found! Run create_dummy_school.py first.")
        sys.exit(1)

    school_id = school.id
    print(f"School: {school.name} (ID: {school_id})")

    # ─── 1. Create Exam Types ───
    exam_types_data = [
        ('Unit Test 1', 'UT1', 10),
        ('Unit Test 2', 'UT2', 10),
        ('Mid Term', 'MID', 30),
        ('Pre-Board', 'PRE', 20),
        ('Annual Exam', 'ANN', 30),
    ]
    for name, code, weightage in exam_types_data:
        existing = ExamType.query.filter_by(school_id=school_id, code=code).first()
        if not existing:
            et = ExamType(school_id=school_id, name=name, code=code, weightage=weightage, is_active=True)
            db.session.add(et)
    db.session.commit()
    exam_types = ExamType.query.filter_by(school_id=school_id, is_active=True).all()
    print(f"  Exam Types: {[et.name for et in exam_types]}")

    # ─── 2. Create Exam Halls ───
    halls_data = [
        ('Hall A - Ground Floor', 40, 5, 8),
        ('Hall B - First Floor', 50, 5, 10),
        ('Hall C - Second Floor', 35, 5, 7),
        ('Computer Lab', 30, 5, 6),
    ]
    for name, cap, rows, cols in halls_data:
        existing = ExamHall.query.filter_by(school_id=school_id, name=name).first()
        if not existing:
            hall = ExamHall(school_id=school_id, name=name, capacity=cap, rows=rows, columns=cols, is_active=True)
            db.session.add(hall)
    db.session.commit()
    halls = ExamHall.query.filter_by(school_id=school_id, is_active=True).all()
    print(f"  Exam Halls: {[h.name for h in halls]}")

    # ─── 3. Get Classes & Subjects ───
    classes = Class.query.filter_by(school_id=school_id).order_by(Class.numeric_name).all()
    subjects = Subject.query.filter_by(school_id=school_id, is_active=True).all()

    if not classes:
        print("  No classes found! Creating basic classes...")
        for name, num in [('Class 6', 6), ('Class 7', 7), ('Class 8', 8), ('Class 9', 9), ('Class 10', 10)]:
            c = Class(school_id=school_id, name=name, numeric_name=num)
            db.session.add(c)
        db.session.commit()
        classes = Class.query.filter_by(school_id=school_id).order_by(Class.numeric_name).all()

    if not subjects:
        print("  No subjects found! Creating subjects...")
        for name, code in [('Mathematics', 'MATH'), ('Science', 'SCI'), ('English', 'ENG'),
                           ('Hindi', 'HIN'), ('Social Science', 'SST'), ('Computer Science', 'CS')]:
            s = Subject(school_id=school_id, name=name, code=code, type='theory', is_active=True)
            db.session.add(s)
        db.session.commit()
        subjects = Subject.query.filter_by(school_id=school_id, is_active=True).all()

    print(f"  Classes: {[c.name for c in classes[:8]]}")
    print(f"  Subjects: {[s.name for s in subjects[:6]]}")

    # ─── 4. Create Grading System ───
    gs = GradingSystem.query.filter_by(school_id=school_id, is_default=True).first()
    if not gs:
        gs = GradingSystem(school_id=school_id, name='CBSE Grading', type='percentage', is_default=True, is_active=True)
        db.session.add(gs)
        db.session.flush()
        grades_data = [
            ('A+', 91, 100, 10, 'Outstanding', True, 1),
            ('A', 81, 90, 9, 'Excellent', True, 2),
            ('B+', 71, 80, 8, 'Very Good', True, 3),
            ('B', 61, 70, 7, 'Good', True, 4),
            ('C+', 51, 60, 6, 'Above Average', True, 5),
            ('C', 41, 50, 5, 'Average', True, 6),
            ('D', 33, 40, 4, 'Below Average', True, 7),
            ('F', 0, 32, 0, 'Fail', False, 8),
        ]
        for name, mn, mx, gp, desc, passing, order in grades_data:
            g = Grade(grading_system_id=gs.id, school_id=school_id, name=name,
                      min_marks=mn, max_marks=mx, grade_point=gp, description=desc,
                      is_passing=passing, display_order=order)
            db.session.add(g)
        db.session.commit()
        print(f"  Grading System: {gs.name} (8 grades)")

    # ─── 5. Create Exams with Schedules ───
    # Use classes 6-10 for exams
    target_classes = [c for c in classes if c.numeric_name and 6 <= c.numeric_name <= 10]
    if not target_classes:
        target_classes = classes[:5]

    # Use first 5 subjects
    target_subjects = subjects[:5]

    # Get academic year
    ay = AcademicYear.query.filter_by(school_id=school_id, is_current=True).first()

    mid_term_type = ExamType.query.filter_by(school_id=school_id, code='MID').first()
    annual_type = ExamType.query.filter_by(school_id=school_id, code='ANN').first()
    ut_type = ExamType.query.filter_by(school_id=school_id, code='UT1').first()

    exams_to_create = [
        {
            'name': 'Mid Term Examination 2026',
            'type': mid_term_type,
            'start': date(2026, 7, 15),
            'end': date(2026, 7, 25),
            'status': 'upcoming',
            'desc': 'Mid Term Examination for all classes',
        },
        {
            'name': 'Unit Test 1 - June 2026',
            'type': ut_type,
            'start': date(2026, 6, 10),
            'end': date(2026, 6, 14),
            'status': 'ongoing',
            'desc': 'First Unit Test',
        },
        {
            'name': 'Annual Examination 2026',
            'type': annual_type,
            'start': date(2026, 2, 20),
            'end': date(2026, 3, 5),
            'status': 'completed',
            'desc': 'Annual Final Examination',
        },
    ]

    for exam_data in exams_to_create:
        existing = Exam.query.filter_by(school_id=school_id, name=exam_data['name']).first()
        if existing:
            print(f"  Exam already exists: {exam_data['name']}")
            continue

        exam = Exam(
            school_id=school_id,
            name=exam_data['name'],
            exam_type_id=exam_data['type'].id if exam_data['type'] else None,
            grading_system_id=gs.id,
            academic_year_id=ay.id if ay else None,
            description=exam_data['desc'],
            start_date=exam_data['start'],
            end_date=exam_data['end'],
            status=exam_data['status'],
        )
        db.session.add(exam)
        db.session.flush()
        print(f"  Created Exam: {exam.name} (ID: {exam.id}, Status: {exam.status})")

        # Create schedules for each class and subject
        exam_date = exam_data['start']
        for cls in target_classes:
            for i, subj in enumerate(target_subjects):
                sched_date = exam_date + timedelta(days=i)
                if sched_date > exam_data['end']:
                    sched_date = exam_data['end']

                schedule = ExamSchedule(
                    exam_id=exam.id,
                    school_id=school_id,
                    class_id=cls.id,
                    subject_id=subj.id,
                    exam_date=sched_date,
                    start_time=time(9, 0),
                    end_time=time(12, 0),
                    max_marks=100,
                    passing_marks=33,
                    duration_minutes=180,
                )
                db.session.add(schedule)

        # Create date sheet record
        ds = ExamDateSheet.query.filter_by(exam_id=exam.id, school_id=school_id).first()
        if not ds:
            ds_status = 'approved' if exam_data['status'] in ['ongoing', 'completed'] else 'draft'
            ds = ExamDateSheet(
                school_id=school_id,
                exam_id=exam.id,
                status=ds_status,
                created_by=1,
            )
            if ds_status == 'approved':
                ds.approved_by = 1
                ds.approved_at = datetime.utcnow()
            db.session.add(ds)

    db.session.commit()

    # ─── 6. Summary ───
    total_exams = Exam.query.filter_by(school_id=school_id).count()
    total_schedules = ExamSchedule.query.filter_by(school_id=school_id).count()
    total_halls = ExamHall.query.filter_by(school_id=school_id).count()

    print(f"\n{'='*50}")
    print(f"  SEED COMPLETE!")
    print(f"  Exams: {total_exams}")
    print(f"  Schedules: {total_schedules}")
    print(f"  Halls: {total_halls}")
    print(f"  Exam Types: {len(exam_types)}")
    print(f"{'='*50}")
    print(f"\n  Login as Exam Controller and go to /exam-controller")
    print(f"  You'll see exams with schedules ready to manage!")
