"""Seating Arrangement Service — generates seating plans for exam halls."""
import random
from app import db
from app.models.academic import ExamSchedule, ExamHall, ExamSeating
from app.models.student import Student


def generate_seating(exam_schedule_id, school_id, mode='roll_number', hall_ids=None):
    """Generate seating arrangement.
    mode: 'roll_number' | 'random' | 'mixed'
    """
    schedule = ExamSchedule.query.filter_by(id=exam_schedule_id, school_id=school_id).first()
    if not schedule:
        return {'error': 'Schedule not found'}

    # Get students
    student_query = Student.query.filter_by(
        school_id=school_id, current_class_id=schedule.class_id, status='active'
    )
    if schedule.section_id:
        student_query = student_query.filter_by(current_section_id=schedule.section_id)
    students = student_query.order_by(Student.roll_no, Student.first_name).all()

    if not students:
        return {'error': 'No students found'}

    # Get halls
    if hall_ids:
        halls = ExamHall.query.filter(ExamHall.id.in_(hall_ids), ExamHall.school_id == school_id, ExamHall.is_active == True).all()
    else:
        halls = ExamHall.query.filter_by(school_id=school_id, is_active=True).order_by(ExamHall.name).all()

    if not halls:
        return {'error': 'No active halls found'}

    # Check capacity
    total_capacity = sum(h.capacity for h in halls)
    if total_capacity < len(students):
        return {'error': f'Insufficient capacity: {total_capacity} seats for {len(students)} students'}

    # Clear existing seating
    ExamSeating.query.filter_by(exam_schedule_id=exam_schedule_id, school_id=school_id).delete()

    # Order students based on mode
    if mode == 'random':
        random.shuffle(students)
    elif mode == 'mixed':
        # Interleave by section if multiple sections
        students.sort(key=lambda s: (s.current_section_id or 0, s.roll_no or ''))
        # Alternate sections
        sections = {}
        for s in students:
            sections.setdefault(s.current_section_id, []).append(s)
        mixed = []
        section_lists = list(sections.values())
        max_len = max(len(sl) for sl in section_lists)
        for i in range(max_len):
            for sl in section_lists:
                if i < len(sl):
                    mixed.append(sl[i])
        students = mixed
    # else: roll_number order (already sorted)

    # Assign seats
    seatings = []
    student_idx = 0
    for hall in halls:
        rows = hall.rows or 5
        cols = hall.columns or (hall.capacity // rows if rows else 8)
        for row in range(1, rows + 1):
            for col in range(1, cols + 1):
                if student_idx >= len(students):
                    break
                seat = ExamSeating(
                    school_id=school_id,
                    exam_schedule_id=exam_schedule_id,
                    hall_id=hall.id,
                    student_id=students[student_idx].id,
                    seat_number=f"R{row}C{col}",
                    row_number=row,
                    column_number=col,
                )
                db.session.add(seat)
                seatings.append(seat)
                student_idx += 1
            if student_idx >= len(students):
                break

    db.session.commit()
    return {
        'total_seated': len(seatings),
        'total_students': len(students),
        'halls_used': len(halls),
        'mode': mode,
    }
