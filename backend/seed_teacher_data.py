"""Seed comprehensive dummy data for teacher Sunita Sharma (Staff #821)
so that every section of the teacher dashboard shows real data:
- TeacherSubject assignments
- Timetable entries
- Student attendance
- Exam + ExamSchedule + ExamResults (marks)
- Homework assignments
- Staff attendance, leave, payroll
"""
import sys
sys.path.insert(0, '.')

from app import create_app, db
from app.models.staff import Staff, StaffPayroll, StaffLeave, StaffLeaveBalance, SalaryStructure
from app.models.student import Student, Section, Class, AcademicYear
from app.models.academic import (
    Subject, TeacherSubject, Timetable, Exam, ExamType, ExamSchedule, ExamResult,
    Homework, HomeworkSubmission
)
from app.models.attendance import StudentAttendance, StaffAttendance
from app.models.communication import Announcement
from datetime import datetime, date, time, timedelta
import random

app = create_app('development')

with app.app_context():
    staff = Staff.query.get(821)
    if not staff:
        print('Staff #821 not found!')
        sys.exit(1)

    school_id = staff.school_id
    print(f'Seeding data for: {staff.first_name} {staff.last_name} (Staff #{staff.id})')
    print(f'School ID: {school_id}')

    # ─── 1. Get/Create Academic Year ───
    ay = AcademicYear.query.filter_by(school_id=school_id, is_current=True).first()
    if not ay:
        ay = AcademicYear(school_id=school_id, name='2025-26', start_date=date(2025, 4, 1), end_date=date(2026, 3, 31), is_current=True)
        db.session.add(ay)
        db.session.flush()
        print(f'  Created Academic Year: {ay.name}')

    # ─── 2. Get Classes & Sections ───
    sections = Section.query.filter_by(school_id=school_id).limit(3).all()
    if not sections:
        print('  No sections found! Creating...')
        cls = Class.query.filter_by(school_id=school_id).first()
        if not cls:
            cls = Class(school_id=school_id, name='Class 8', numeric_name=8)
            db.session.add(cls)
            db.session.flush()
        sec = Section(school_id=school_id, class_id=cls.id, name='A', capacity=40, class_teacher_id=staff.id)
        db.session.add(sec)
        db.session.flush()
        sections = [sec]

    # Assign class teacher to first section
    sec1 = sections[0]
    if not sec1.class_teacher_id:
        sec1.class_teacher_id = staff.id
        print(f'  Assigned as class teacher of {sec1.class_ref.name if sec1.class_ref else "?"} - {sec1.name}')

    # ─── 3. Get/Create Subjects ───
    subjects = Subject.query.filter_by(school_id=school_id, is_active=True).limit(3).all()
    if not subjects:
        for sname in ['Mathematics', 'Science', 'English']:
            s = Subject(school_id=school_id, name=sname, code=sname[:3].upper(), type='theory')
            db.session.add(s)
        db.session.flush()
        subjects = Subject.query.filter_by(school_id=school_id, is_active=True).limit(3).all()
    print(f'  Subjects: {[s.name for s in subjects]}')

    # ─── 4. TeacherSubject Assignments ───
    existing_ts = TeacherSubject.query.filter_by(teacher_id=staff.id, school_id=school_id).count()
    if existing_ts == 0:
        for sec in sections[:2]:
            for subj in subjects[:2]:
                ts = TeacherSubject(
                    teacher_id=staff.id, school_id=school_id,
                    subject_id=subj.id, class_id=sec.class_id, section_id=sec.id,
                    academic_year_id=ay.id, periods_per_week=5, status='active'
                )
                db.session.add(ts)
        db.session.flush()
        print(f'  Created TeacherSubject assignments')
    else:
        print(f'  TeacherSubject already exists ({existing_ts})')

    # ─── 5. Timetable ───
    existing_tt = Timetable.query.filter_by(teacher_id=staff.id, school_id=school_id).count()
    if existing_tt == 0:
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        periods = [
            (time(8, 0), time(8, 40)),
            (time(8, 40), time(9, 20)),
            (time(9, 30), time(10, 10)),
            (time(10, 10), time(10, 50)),
            (time(11, 0), time(11, 40)),
            (time(11, 40), time(12, 20)),
        ]
        for day in days[:5]:
            # 3-4 periods per day
            for pi in random.sample(range(6), random.randint(3, 4)):
                sec = random.choice(sections[:2])
                subj = random.choice(subjects[:2])
                tt = Timetable(
                    school_id=school_id, class_id=sec.class_id, section_id=sec.id,
                    subject_id=subj.id, teacher_id=staff.id,
                    day_of_week=day, start_time=periods[pi][0], end_time=periods[pi][1],
                    period_number=pi + 1, room_no=f'R-{random.randint(101, 110)}',
                    academic_year_id=ay.id
                )
                db.session.add(tt)
        db.session.flush()
        print(f'  Created timetable entries')
    else:
        print(f'  Timetable already exists ({existing_tt})')

    # ─── 6. Students in teacher's sections ───
    my_section_ids = [s.id for s in sections[:2]]
    students = Student.query.filter(
        Student.school_id == school_id,
        Student.current_section_id.in_(my_section_ids),
        Student.status == 'active'
    ).limit(30).all()
    print(f'  Students in sections: {len(students)}')

    # ─── 7. Student Attendance (last 30 days) ───
    existing_att = StudentAttendance.query.filter_by(school_id=school_id).filter(
        StudentAttendance.student_id.in_([s.id for s in students[:5]])
    ).count() if students else 0

    if existing_att < 10 and students:
        today = date.today()
        for day_offset in range(30):
            d = today - timedelta(days=day_offset)
            if d.weekday() >= 6:  # Skip Sunday
                continue
            for student in students:
                status = random.choices(['present', 'present', 'present', 'present', 'absent', 'late'], weights=[50, 50, 50, 50, 8, 5])[0]
                att = StudentAttendance(
                    school_id=school_id, student_id=student.id,
                    class_id=student.current_class_id, section_id=student.current_section_id,
                    date=d, status=status
                )
                db.session.add(att)
        db.session.flush()
        print(f'  Created student attendance records')
    else:
        print(f'  Student attendance already exists ({existing_att})')

    # ─── 8. Exam + Schedule + Results ───
    existing_exams = Exam.query.filter_by(school_id=school_id).count()
    if existing_exams == 0:
        # Create exam type
        et = ExamType(school_id=school_id, name='Unit Test', code='UT', weightage=100)
        db.session.add(et)
        db.session.flush()

        # Create exam
        exam = Exam(
            school_id=school_id, name='Unit Test 1 (May 2026)',
            academic_year_id=ay.id, exam_type_id=et.id,
            start_date=date(2026, 5, 15), end_date=date(2026, 5, 20),
            status='completed', created_by=staff.user_id
        )
        db.session.add(exam)
        db.session.flush()

        # Create upcoming exam
        exam2 = Exam(
            school_id=school_id, name='Mid Term Exam (June 2026)',
            academic_year_id=ay.id, exam_type_id=et.id,
            start_date=date(2026, 6, 10), end_date=date(2026, 6, 18),
            status='upcoming', created_by=staff.user_id
        )
        db.session.add(exam2)
        db.session.flush()

        # Schedules for completed exam
        for sec in sections[:2]:
            for subj in subjects[:2]:
                sched = ExamSchedule(
                    exam_id=exam.id, school_id=school_id,
                    class_id=sec.class_id, section_id=sec.id, subject_id=subj.id,
                    exam_date=date(2026, 5, 15) + timedelta(days=random.randint(0, 4)),
                    start_time=time(9, 0), end_time=time(11, 0),
                    max_marks=100, passing_marks=33
                )
                db.session.add(sched)
                db.session.flush()

                # Add results for students
                sec_students = [s for s in students if s.current_section_id == sec.id]
                for student in sec_students[:15]:
                    marks = random.randint(35, 98)
                    result = ExamResult(
                        exam_schedule_id=sched.id, student_id=student.id,
                        school_id=school_id, marks_obtained=marks,
                        percentage=marks, entered_by=staff.user_id,
                        grade='A+' if marks >= 90 else 'A' if marks >= 75 else 'B' if marks >= 60 else 'C' if marks >= 45 else 'D'
                    )
                    db.session.add(result)

        # Schedules for upcoming exam
        for sec in sections[:2]:
            for subj in subjects[:2]:
                sched = ExamSchedule(
                    exam_id=exam2.id, school_id=school_id,
                    class_id=sec.class_id, section_id=sec.id, subject_id=subj.id,
                    exam_date=date(2026, 6, 10) + timedelta(days=random.randint(0, 7)),
                    start_time=time(9, 0), end_time=time(11, 0),
                    max_marks=100, passing_marks=33
                )
                db.session.add(sched)

        db.session.flush()
        print(f'  Created exams, schedules, and results')
    else:
        print(f'  Exams already exist ({existing_exams})')

    # ─── 9. Homework ───
    existing_hw = Homework.query.filter_by(teacher_id=staff.id, school_id=school_id).count()
    if existing_hw == 0:
        for i in range(5):
            sec = random.choice(sections[:2])
            subj = random.choice(subjects[:2])
            hw = Homework(
                school_id=school_id, teacher_id=staff.id,
                class_id=sec.class_id, section_id=sec.id, subject_id=subj.id,
                title=f'Homework {i+1}: {subj.name} Chapter {i+3}',
                description=f'Complete exercises from chapter {i+3}. Show all working.',
                homework_type='assignment',
                assigned_date=date.today() - timedelta(days=random.randint(1, 10)),
                due_date=date.today() + timedelta(days=random.randint(1, 7)),
                max_marks=20, status='published',
                allow_late_submission=True, late_penalty_percent=10
            )
            db.session.add(hw)
        db.session.flush()
        print(f'  Created 5 homework assignments')
    else:
        print(f'  Homework already exists ({existing_hw})')

    # ─── 10. Salary Structure ───
    existing_sal = SalaryStructure.query.filter_by(staff_id=staff.id, school_id=school_id, is_active=True).first()
    if not existing_sal:
        sal = SalaryStructure(
            staff_id=staff.id, school_id=school_id,
            basic_salary=35000, hra=8000, da=5000, ta=3000,
            medical_allowance=2000, special_allowance=4000, other_allowance=1000,
            pf_deduction=4200, esi_deduction=1500, tds=2000,
            professional_tax=200, other_deduction=500,
            effective_from=date(2025, 4, 1), is_active=True
        )
        db.session.add(sal)
        db.session.flush()
        print(f'  Created salary structure (Net: ₹{sal.net_salary:,.0f})')
    else:
        print(f'  Salary structure exists (Net: ₹{existing_sal.net_salary:,.0f})')

    # ─── 11. Payroll (last 3 months) ───
    existing_pr = StaffPayroll.query.filter_by(staff_id=staff.id, school_id=school_id).count()
    if existing_pr == 0:
        sal = SalaryStructure.query.filter_by(staff_id=staff.id, school_id=school_id, is_active=True).first()
        for m_offset in range(3):
            m = date.today().month - m_offset
            y = date.today().year
            if m <= 0:
                m += 12
                y -= 1
            pr = StaffPayroll(
                staff_id=staff.id, school_id=school_id,
                month=m, year=y,
                basic_salary=sal.basic_salary, hra=sal.hra, da=sal.da, ta=sal.ta,
                medical_allowance=sal.medical_allowance, special_allowance=sal.special_allowance,
                other_allowance=sal.other_allowance, gross_salary=sal.gross_salary,
                pf_deduction=sal.pf_deduction, esi_deduction=sal.esi_deduction,
                tds=sal.tds, professional_tax=sal.professional_tax,
                other_deduction=sal.other_deduction, total_deductions=sal.total_deductions,
                net_salary=sal.net_salary,
                allowances=sal.gross_salary - float(sal.basic_salary),
                deductions=sal.total_deductions,
                payment_status='paid' if m_offset > 0 else 'pending',
                payment_date=date(y, m, 28) if m_offset > 0 else None,
                payment_mode='bank_transfer' if m_offset > 0 else None,
            )
            db.session.add(pr)
        db.session.flush()
        print(f'  Created 3 months payroll')
    else:
        print(f'  Payroll already exists ({existing_pr})')

    # ─── 12. Leave Balance ───
    yr = date.today().year
    lb = StaffLeaveBalance.query.filter_by(staff_id=staff.id, school_id=school_id, year=yr).first()
    if not lb:
        lb = StaffLeaveBalance(
            staff_id=staff.id, school_id=school_id, year=yr,
            cl_total=12, cl_used=3, el_total=15, el_used=2, sl_total=10, sl_used=1
        )
        db.session.add(lb)
        print(f'  Created leave balance')
    else:
        print(f'  Leave balance exists')

    # ─── 13. Leave History ───
    existing_leaves = StaffLeave.query.filter_by(staff_id=staff.id, school_id=school_id).count()
    if existing_leaves == 0:
        leaves_data = [
            ('CL', date(2026, 3, 10), date(2026, 3, 11), 2, 'Personal work', 'approved'),
            ('SL', date(2026, 4, 5), date(2026, 4, 5), 1, 'Fever', 'approved'),
            ('CL', date(2026, 5, 20), date(2026, 5, 20), 1, 'Family function', 'approved'),
            ('EL', date(2026, 6, 15), date(2026, 6, 18), 4, 'Vacation', 'pending'),
        ]
        for lt, fd, td, days, reason, status in leaves_data:
            leave = StaffLeave(
                staff_id=staff.id, school_id=school_id,
                leave_type=lt, from_date=fd, to_date=td, days=days,
                reason=reason, status=status
            )
            db.session.add(leave)
        db.session.flush()
        print(f'  Created leave history (4 entries)')
    else:
        print(f'  Leave history exists ({existing_leaves})')

    # ─── 14. Staff Attendance (last 30 days) ───
    existing_staff_att = StaffAttendance.query.filter_by(staff_id=staff.id, school_id=school_id).count()
    if existing_staff_att == 0:
        today = date.today()
        for day_offset in range(30):
            d = today - timedelta(days=day_offset)
            if d.weekday() >= 6:
                continue
            status = random.choices(['present', 'present', 'present', 'absent', 'late'], weights=[70, 70, 70, 5, 3])[0]
            sa = StaffAttendance(
                school_id=school_id, staff_id=staff.id,
                date=d, status=status,
                check_in=time(8, random.randint(0, 15)) if status != 'absent' else None,
            )
            db.session.add(sa)
        db.session.flush()
        print(f'  Created staff attendance (30 days)')
    else:
        print(f'  Staff attendance exists ({existing_staff_att})')

    # ─── 15. Announcements ───
    existing_ann = Announcement.query.filter_by(school_id=school_id, is_published=True).count()
    if existing_ann == 0:
        announcements = [
            ('Summer Vacation Notice', 'School will remain closed from June 1 to June 30 for summer vacation.', 'all'),
            ('PTM Scheduled', 'Parent-Teacher Meeting is scheduled for May 30, 2026. All teachers must be present.', 'teachers'),
            ('Annual Day Rehearsals', 'Annual Day rehearsals will begin from next week. Students selected for events must attend.', 'all'),
            ('Exam Schedule Released', 'Mid-term exam schedule has been uploaded. Please check the academics section.', 'students'),
            ('Staff Meeting', 'All staff members are requested to attend the meeting on Friday at 3 PM in the conference hall.', 'staff'),
        ]
        for title, msg, audience in announcements:
            ann = Announcement(
                school_id=school_id, title=title, message=msg,
                target_audience=audience, is_published=True,
                published_at=datetime.utcnow() - timedelta(days=random.randint(1, 15))
            )
            db.session.add(ann)
        db.session.flush()
        print(f'  Created 5 announcements')
    else:
        print(f'  Announcements exist ({existing_ann})')

    # ─── COMMIT ───
    db.session.commit()
    print('\n✅ All dummy data seeded successfully!')
    print('\nLogin: DEMO001 / sunita.sharma@school.edu / Teacher@123')
