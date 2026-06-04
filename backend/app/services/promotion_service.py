"""Promotion Service — evaluates students against promotion criteria and processes promotions."""
import json
from datetime import datetime

from app import db
from app.models.academic import (
    Exam, ExamSchedule, ExamResult, PromotionCriteria, PromotionRecord
)
from app.models.student import Student, Class, Section, AcademicYear
from app.models.attendance import StudentAttendance
from sqlalchemy import func


def evaluate_student(student, criteria, exam_results, attendance_pct):
    """
    Evaluate a single student against promotion criteria.

    Args:
        student: Student model instance
        criteria: PromotionCriteria model instance
        exam_results: list of ExamResult instances for the student's final/annual exam
        attendance_pct: float, student's attendance percentage for the academic year

    Returns:
        str: 'promote', 'compartment', or 'detain'
    """
    min_attendance = float(criteria.min_attendance_pct or 75)
    min_overall_pct = float(criteria.min_overall_pct or 33)
    min_subject_pass_count = criteria.min_subject_pass_count or 0
    max_failed_for_compartment = criteria.max_failed_for_compartment or 2

    # Parse mandatory subjects (JSON array of subject_ids)
    mandatory_subject_ids = []
    if criteria.mandatory_subjects:
        try:
            mandatory_subject_ids = json.loads(criteria.mandatory_subjects)
        except (json.JSONDecodeError, TypeError):
            mandatory_subject_ids = []

    # Rule 1: If attendance below threshold → detain regardless of marks
    if attendance_pct < min_attendance:
        return 'detain'

    # Calculate academic performance from exam results
    total_obtained = 0
    total_max = 0
    passed_subjects = 0
    failed_subjects = 0
    failed_subject_ids = []
    mandatory_failed = False

    for result in exam_results:
        schedule = result.schedule
        if not schedule:
            continue

        max_marks = float(schedule.max_marks or 0)
        passing_marks = float(schedule.passing_marks or 0)
        marks_obtained = float(result.marks_obtained or 0)

        if result.is_absent:
            # Absent counts as failed
            failed_subjects += 1
            failed_subject_ids.append(schedule.subject_id)
            if schedule.subject_id in mandatory_subject_ids:
                mandatory_failed = True
        elif result.is_exempted:
            # Exempted subjects don't count toward pass/fail
            continue
        else:
            total_obtained += marks_obtained
            total_max += max_marks

            if passing_marks > 0 and marks_obtained >= passing_marks:
                passed_subjects += 1
            elif passing_marks > 0 and marks_obtained < passing_marks:
                failed_subjects += 1
                failed_subject_ids.append(schedule.subject_id)
                if schedule.subject_id in mandatory_subject_ids:
                    mandatory_failed = True
            else:
                # No passing marks defined — count as passed
                passed_subjects += 1

    # Calculate overall percentage
    overall_pct = (total_obtained / total_max * 100) if total_max > 0 else 0

    # Rule 2: If all criteria met → promote
    # Criteria: overall_pct >= min, passed_subjects >= min_subject_pass_count, all mandatory passed
    all_criteria_met = (
        overall_pct >= min_overall_pct
        and passed_subjects >= min_subject_pass_count
        and not mandatory_failed
    )

    if all_criteria_met and failed_subjects == 0:
        return 'promote'

    # Rule 3: If failed_subjects <= max_failed_for_compartment AND all mandatory passed → compartment
    if failed_subjects <= max_failed_for_compartment and not mandatory_failed:
        return 'compartment'

    # Rule 4: Otherwise → detain
    return 'detain'


def _get_student_attendance_pct(student_id, school_id, academic_year):
    """Calculate attendance percentage for a student within an academic year's date range."""
    start_date = academic_year.start_date
    end_date = academic_year.end_date

    total_days = db.session.query(func.count(func.distinct(StudentAttendance.date))).filter(
        StudentAttendance.school_id == school_id,
        StudentAttendance.student_id == student_id,
        StudentAttendance.date >= start_date,
        StudentAttendance.date <= end_date,
        StudentAttendance.period.is_(None),  # Full-day attendance only
    ).scalar() or 0

    if total_days == 0:
        return 0.0

    present_days = db.session.query(func.count(func.distinct(StudentAttendance.date))).filter(
        StudentAttendance.school_id == school_id,
        StudentAttendance.student_id == student_id,
        StudentAttendance.date >= start_date,
        StudentAttendance.date <= end_date,
        StudentAttendance.period.is_(None),
        StudentAttendance.status.in_(['present', 'late']),
    ).scalar() or 0

    return round((present_days / total_days) * 100, 2)


def _get_final_exam_for_class(school_id, class_id, academic_year_id):
    """Find the final/annual exam for a class in the given academic year with published results."""
    # Look for exams with status 'results_published' for this class and academic year
    exam = Exam.query.filter(
        Exam.school_id == school_id,
        Exam.academic_year_id == academic_year_id,
        Exam.status == 'results_published',
    ).join(ExamSchedule, ExamSchedule.exam_id == Exam.id).filter(
        ExamSchedule.class_id == class_id,
    ).order_by(Exam.end_date.desc()).first()

    return exam


def evaluate_class(school_id, class_id, academic_year_id):
    """
    Evaluate all active students in a class against promotion criteria.

    Args:
        school_id: int
        class_id: int
        academic_year_id: int

    Returns:
        list[PromotionRecord] on success, or dict with 'error' key on failure.
    """
    # Check if promotion criteria exist for this class
    criteria = PromotionCriteria.query.filter_by(
        school_id=school_id,
        class_id=class_id,
        academic_year_id=academic_year_id,
    ).first()

    if not criteria:
        # Also check for criteria without academic_year_id (default criteria)
        criteria = PromotionCriteria.query.filter_by(
            school_id=school_id,
            class_id=class_id,
            academic_year_id=None,
        ).first()

    if not criteria:
        return {'error': 'No promotion criteria defined for this class', 'reason': 'no_criteria_defined'}

    # Get academic year
    academic_year = AcademicYear.query.filter_by(
        id=academic_year_id, school_id=school_id
    ).first()

    if not academic_year:
        return {'error': 'Academic year not found', 'reason': 'invalid_academic_year'}

    # Check if final exam results are published
    final_exam = _get_final_exam_for_class(school_id, class_id, academic_year_id)
    if not final_exam:
        return {'error': 'Final exam results not published for this class', 'reason': 'results_not_published'}

    # Get all active students in this class
    students = Student.query.filter_by(
        school_id=school_id,
        current_class_id=class_id,
        status='active',
    ).all()

    if not students:
        return {'error': 'No active students found in this class', 'reason': 'no_students'}

    # Get exam schedules for the final exam for this class
    schedules = ExamSchedule.query.filter_by(
        exam_id=final_exam.id,
        school_id=school_id,
        class_id=class_id,
    ).all()

    schedule_ids = [s.id for s in schedules]

    # Determine the next class for promotion
    current_class = Class.query.get(class_id)
    next_class = None
    if current_class and current_class.numeric_name:
        next_class = Class.query.filter_by(
            school_id=school_id,
        ).filter(
            Class.numeric_name == current_class.numeric_name + 1
        ).first()

    # Delete any existing pending promotion records for this class/year (re-evaluation)
    PromotionRecord.query.filter_by(
        school_id=school_id,
        from_class_id=class_id,
        academic_year_id=academic_year_id,
        status='pending',
    ).delete()

    promotion_records = []

    for student in students:
        # Get exam results for this student
        student_results = ExamResult.query.filter(
            ExamResult.student_id == student.id,
            ExamResult.school_id == school_id,
            ExamResult.exam_schedule_id.in_(schedule_ids),
        ).all()

        # Calculate attendance percentage
        attendance_pct = _get_student_attendance_pct(student.id, school_id, academic_year)

        # Evaluate student
        recommendation = evaluate_student(student, criteria, student_results, attendance_pct)

        # Calculate overall percentage for the record
        total_obtained = 0
        total_max = 0
        failed_count = 0
        for result in student_results:
            sched = result.schedule
            if not sched:
                continue
            if result.is_absent:
                failed_count += 1
            elif not result.is_exempted:
                total_obtained += float(result.marks_obtained or 0)
                total_max += float(sched.max_marks or 0)
                passing = float(sched.passing_marks or 0)
                if passing > 0 and float(result.marks_obtained or 0) < passing:
                    failed_count += 1

        overall_pct = round((total_obtained / total_max * 100), 2) if total_max > 0 else 0

        # Create promotion record
        record = PromotionRecord(
            school_id=school_id,
            student_id=student.id,
            academic_year_id=academic_year_id,
            from_class_id=class_id,
            from_section_id=student.current_section_id,
            to_class_id=next_class.id if next_class and recommendation == 'promote' else None,
            recommendation=recommendation,
            attendance_pct=attendance_pct,
            overall_pct=overall_pct,
            failed_subjects=failed_count,
            status='pending',
        )

        db.session.add(record)
        promotion_records.append(record)

    db.session.commit()
    return promotion_records


def confirm_promotions(school_id, class_id, academic_year_id, confirmed_by):
    """
    Confirm and execute all pending promotions for a class.

    Updates PromotionRecords to 'confirmed' and updates Student.current_class_id
    and current_section_id for promoted students.

    Args:
        school_id: int
        class_id: int
        academic_year_id: int
        confirmed_by: int (user_id)

    Returns:
        dict with summary (promoted, detained, compartment counts, overrides)
    """
    # Get all pending promotion records for this class
    records = PromotionRecord.query.filter_by(
        school_id=school_id,
        from_class_id=class_id,
        academic_year_id=academic_year_id,
        status='pending',
    ).all()

    if not records:
        return {'error': 'No pending promotion records found for this class'}

    # Determine the next class
    current_class = Class.query.get(class_id)
    next_class = None
    if current_class and current_class.numeric_name:
        next_class = Class.query.filter_by(
            school_id=school_id,
        ).filter(
            Class.numeric_name == current_class.numeric_name + 1
        ).first()

    now = datetime.utcnow()
    promoted_count = 0
    detained_count = 0
    compartment_count = 0
    override_count = 0

    for record in records:
        # Use final_decision if overridden, otherwise use recommendation
        decision = record.final_decision if record.final_decision else record.recommendation

        if record.final_decision and record.final_decision != record.recommendation:
            override_count += 1

        record.status = 'confirmed'
        record.confirmed_by = confirmed_by
        record.confirmed_at = now

        if decision == 'promote':
            promoted_count += 1
            # Update student's class to next class
            student = Student.query.get(record.student_id)
            if student and next_class:
                student.current_class_id = next_class.id
                # Assign to the same-named section in next class if available, else first section
                if record.to_section_id:
                    student.current_section_id = record.to_section_id
                else:
                    next_section = Section.query.filter_by(
                        school_id=school_id,
                        class_id=next_class.id,
                    ).first()
                    student.current_section_id = next_section.id if next_section else None
                # Update to_class_id on the record
                record.to_class_id = next_class.id
                record.to_section_id = student.current_section_id
        elif decision == 'compartment':
            compartment_count += 1
            # Compartment students stay in current class for now
        elif decision == 'detain':
            detained_count += 1
            # Detained students remain in current class and section

    db.session.commit()

    return {
        'total_students': len(records),
        'promoted': promoted_count,
        'detained': detained_count,
        'compartment': compartment_count,
        'overrides_applied': override_count,
        'confirmed_by': confirmed_by,
        'confirmed_at': now.isoformat(),
    }
