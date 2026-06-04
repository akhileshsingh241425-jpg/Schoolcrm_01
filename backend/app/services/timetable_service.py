"""Timetable Service — conflict detection, workload calculation, and timetable copy."""
from app import db
from app.models.academic import Timetable, TimetableSubstitution


def check_teacher_conflict(school_id, teacher_id, day, start_time, end_time, exclude_id=None):
    """Check if a teacher already has a timetable entry overlapping the given time slot.

    Time overlap logic: new_start < existing_end AND new_end > existing_start (same day).

    Returns:
        bool: True if a conflict exists, False otherwise.
    """
    query = Timetable.query.filter(
        Timetable.school_id == school_id,
        Timetable.teacher_id == teacher_id,
        Timetable.day_of_week == day,
        Timetable.start_time < end_time,
        Timetable.end_time > start_time,
    )
    if exclude_id is not None:
        query = query.filter(Timetable.id != exclude_id)
    return query.first() is not None


def check_room_conflict(school_id, room_no, day, start_time, end_time, exclude_id=None):
    """Check if a room already has a timetable entry overlapping the given time slot.

    Time overlap logic: new_start < existing_end AND new_end > existing_start (same day).

    Returns:
        bool: True if a conflict exists, False otherwise.
    """
    if not room_no:
        return False

    query = Timetable.query.filter(
        Timetable.school_id == school_id,
        Timetable.room_no == room_no,
        Timetable.day_of_week == day,
        Timetable.start_time < end_time,
        Timetable.end_time > start_time,
    )
    if exclude_id is not None:
        query = query.filter(Timetable.id != exclude_id)
    return query.first() is not None


def check_class_section_conflict(school_id, class_id, section_id, day, start_time, end_time, exclude_id=None):
    """Check if a class-section already has a timetable entry overlapping the given time slot.

    Time overlap logic: new_start < existing_end AND new_end > existing_start (same day).

    Returns:
        bool: True if a conflict exists, False otherwise.
    """
    query = Timetable.query.filter(
        Timetable.school_id == school_id,
        Timetable.class_id == class_id,
        Timetable.section_id == section_id,
        Timetable.day_of_week == day,
        Timetable.start_time < end_time,
        Timetable.end_time > start_time,
    )
    if exclude_id is not None:
        query = query.filter(Timetable.id != exclude_id)
    return query.first() is not None


def check_substitution_conflict(school_id, teacher_id, date, period_number, exclude_id=None):
    """Check if a substitute teacher already has an assignment during the same period on the same date.

    Checks both:
    1. The teacher's permanent timetable for that day/period.
    2. Existing substitution assignments for that date/period.

    Returns:
        bool: True if a conflict exists, False otherwise.
    """
    # Determine the day of week from the date
    day_of_week = date.strftime('%A').lower()

    # Check permanent timetable: teacher already has a class during this period
    timetable_conflict = Timetable.query.filter(
        Timetable.school_id == school_id,
        Timetable.teacher_id == teacher_id,
        Timetable.day_of_week == day_of_week,
        Timetable.period_number == period_number,
    ).first()

    if timetable_conflict:
        return True

    # Check existing substitution assignments for the same date and period
    sub_query = db.session.query(TimetableSubstitution).join(
        Timetable, TimetableSubstitution.timetable_id == Timetable.id
    ).filter(
        TimetableSubstitution.school_id == school_id,
        TimetableSubstitution.substitute_teacher_id == teacher_id,
        TimetableSubstitution.date == date,
        TimetableSubstitution.status != 'cancelled',
        Timetable.period_number == period_number,
    )
    if exclude_id is not None:
        sub_query = sub_query.filter(TimetableSubstitution.id != exclude_id)

    return sub_query.first() is not None


def get_teacher_weekly_workload(school_id, teacher_id, academic_year_id):
    """Get the total count of non-break timetable periods assigned to a teacher.

    Returns:
        int: Number of non-break periods for the teacher in the given academic year.
    """
    count = Timetable.query.filter(
        Timetable.school_id == school_id,
        Timetable.teacher_id == teacher_id,
        Timetable.academic_year_id == academic_year_id,
        Timetable.is_break == False,
    ).count()
    return count


def copy_timetable(school_id, source_year_id, target_year_id, class_id, section_id):
    """Copy timetable entries from one academic year to another for a given class-section.

    Duplicates all timetable entries (excluding substitution assignments) with the new
    academic year reference. Rejects the operation if the target year already has
    timetable entries for the same class-section.

    Returns:
        dict: Summary with 'copied_count' on success, or 'error' on failure.
    """
    # Check if target year already has entries for this class-section
    existing = Timetable.query.filter(
        Timetable.school_id == school_id,
        Timetable.academic_year_id == target_year_id,
        Timetable.class_id == class_id,
        Timetable.section_id == section_id,
    ).first()

    if existing:
        return {
            'error': 'Target academic year already has timetable entries for this class-section'
        }

    # Get all source entries for the class-section
    source_entries = Timetable.query.filter(
        Timetable.school_id == school_id,
        Timetable.academic_year_id == source_year_id,
        Timetable.class_id == class_id,
        Timetable.section_id == section_id,
    ).all()

    if not source_entries:
        return {
            'error': 'No timetable entries found in source academic year for this class-section'
        }

    copied_count = 0
    for entry in source_entries:
        new_entry = Timetable(
            school_id=entry.school_id,
            class_id=entry.class_id,
            section_id=entry.section_id,
            subject_id=entry.subject_id,
            teacher_id=entry.teacher_id,
            day_of_week=entry.day_of_week,
            start_time=entry.start_time,
            end_time=entry.end_time,
            room_no=entry.room_no,
            period_number=entry.period_number,
            is_break=entry.is_break,
            academic_year_id=target_year_id,
        )
        db.session.add(new_entry)
        copied_count += 1

    db.session.commit()

    return {
        'copied_count': copied_count,
        'source_year_id': source_year_id,
        'target_year_id': target_year_id,
        'class_id': class_id,
        'section_id': section_id,
    }
