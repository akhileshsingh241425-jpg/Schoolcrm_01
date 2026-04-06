"""Debug absent teachers for substitution feature"""
from app import create_app, db
from app.models.attendance import StaffAttendance
from app.models.academic import Timetable
from app.models.staff import Staff
from datetime import date

app = create_app()
with app.app_context():
    today = date.today()
    day_name = today.strftime('%A').lower()
    print(f"Today: {today} ({day_name})")
    
    # Check all staff attendance for today
    all_records = StaffAttendance.query.filter(StaffAttendance.date == today).all()
    print(f"\nAll staff attendance today: {len(all_records)}")
    for r in all_records:
        print(f"  staff_id={r.staff_id}, status={r.status}, school_id={r.school_id}")
    
    # Check absent records
    absent = [r for r in all_records if r.status in ('absent', 'leave')]
    print(f"\nAbsent/Leave records: {len(absent)}")
    for r in absent:
        print(f"  staff_id={r.staff_id}, status={r.status}")
    
    # Check timetable for today's day
    timetable = Timetable.query.filter(Timetable.day_of_week == day_name, Timetable.is_break == False).all()
    print(f"\nTimetable entries for {day_name}: {len(timetable)}")
    for t in timetable[:10]:
        print(f"  teacher_id={t.teacher_id}, period={t.period_number}, class_id={t.class_id}")
    
    # Check if absent teachers have timetable
    if absent:
        absent_ids = [r.staff_id for r in absent]
        matching = [t for t in timetable if t.teacher_id in absent_ids]
        print(f"\nTimetable entries for absent teachers: {len(matching)}")
        for t in matching:
            print(f"  teacher_id={t.teacher_id}, period={t.period_number}")
    
    # Check all timetable entries (any day)
    all_tt = Timetable.query.count()
    print(f"\nTotal timetable entries (all days): {all_tt}")
    
    # Check distinct days in timetable
    days = db.session.query(Timetable.day_of_week).distinct().all()
    print(f"Days in timetable: {[d[0] for d in days]}")
