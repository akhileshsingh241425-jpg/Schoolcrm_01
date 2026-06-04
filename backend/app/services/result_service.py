"""Result Processing Service — calculates totals, grades, ranks, pass/fail."""
from app import db
from app.models.academic import ExamSchedule, ExamResult, Exam, Grade, GradingSystem
from app.models.student import Student
from sqlalchemy import func


def process_results(exam_id, school_id):
    """Process all results for an exam: calculate percentage, grade, rank."""
    exam = Exam.query.filter_by(id=exam_id, school_id=school_id).first()
    if not exam:
        return {'error': 'Exam not found'}

    schedules = ExamSchedule.query.filter_by(exam_id=exam_id, school_id=school_id).all()
    if not schedules:
        return {'error': 'No schedules found'}

    # Get grading system
    gs = None
    grades = []
    if exam.grading_system_id:
        gs = GradingSystem.query.get(exam.grading_system_id)
        if gs:
            grades = Grade.query.filter_by(grading_system_id=gs.id, school_id=school_id).order_by(Grade.min_marks.desc()).all()

    # Get all students who have results
    student_ids = db.session.query(ExamResult.student_id).filter(
        ExamResult.exam_schedule_id.in_([s.id for s in schedules]),
        ExamResult.school_id == school_id,
    ).distinct().all()
    student_ids = [s[0] for s in student_ids]

    results_summary = []
    for student_id in student_ids:
        student_results = ExamResult.query.filter(
            ExamResult.student_id == student_id,
            ExamResult.exam_schedule_id.in_([s.id for s in schedules]),
            ExamResult.school_id == school_id,
        ).all()

        total_obtained = 0
        total_max = 0
        subjects_failed = 0
        is_absent_all = True

        for r in student_results:
            sched = next((s for s in schedules if s.id == r.exam_schedule_id), None)
            if not sched:
                continue
            max_m = float(sched.max_marks or 0)
            total_max += max_m

            if r.is_absent:
                subjects_failed += 1
            else:
                is_absent_all = False
                obtained = float(r.marks_obtained or 0)
                total_obtained += obtained
                # Check pass/fail per subject
                passing = float(sched.passing_marks or 33)
                if obtained < passing:
                    subjects_failed += 1
                # Calculate grade for this result
                if grades and max_m > 0:
                    pct = (obtained / max_m) * 100
                    for g in grades:
                        if float(g.min_marks) <= pct <= float(g.max_marks):
                            r.grade = g.name
                            r.grade_point = g.grade_point
                            r.percentage = pct
                            break

        # Overall percentage
        percentage = round((total_obtained / total_max * 100), 2) if total_max > 0 else 0

        # Overall grade
        overall_grade = None
        if grades:
            for g in grades:
                if float(g.min_marks) <= percentage <= float(g.max_marks):
                    overall_grade = g.name
                    break

        # Result status
        if is_absent_all:
            result_status = 'absent'
        elif subjects_failed == 0:
            result_status = 'pass'
        elif subjects_failed <= 2:
            result_status = 'compartment'
        else:
            result_status = 'fail'

        results_summary.append({
            'student_id': student_id,
            'total_obtained': total_obtained,
            'total_max': total_max,
            'percentage': percentage,
            'grade': overall_grade,
            'subjects_failed': subjects_failed,
            'result_status': result_status,
        })

    db.session.commit()

    # Calculate ranks (exclude absent)
    ranked = [r for r in results_summary if r['result_status'] != 'absent']
    ranked.sort(key=lambda x: x['percentage'], reverse=True)
    for idx, r in enumerate(ranked):
        r['rank'] = idx + 1

    return {
        'total_students': len(student_ids),
        'processed': len(results_summary),
        'pass_count': sum(1 for r in results_summary if r['result_status'] == 'pass'),
        'fail_count': sum(1 for r in results_summary if r['result_status'] == 'fail'),
        'compartment_count': sum(1 for r in results_summary if r['result_status'] == 'compartment'),
        'absent_count': sum(1 for r in results_summary if r['result_status'] == 'absent'),
        'avg_percentage': round(sum(r['percentage'] for r in results_summary) / len(results_summary), 1) if results_summary else 0,
        'toppers': ranked[:3] if ranked else [],
        'results': results_summary,
    }


def get_subject_analysis(exam_id, school_id, class_id=None):
    """Subject-wise analysis: avg, highest, lowest, pass %."""
    schedules = ExamSchedule.query.filter_by(exam_id=exam_id, school_id=school_id)
    if class_id:
        schedules = schedules.filter_by(class_id=class_id)
    schedules = schedules.all()

    analysis = []
    for sched in schedules:
        results = ExamResult.query.filter_by(
            exam_schedule_id=sched.id, school_id=school_id
        ).filter(ExamResult.is_absent == False).all()

        if not results:
            continue

        marks_list = [float(r.marks_obtained or 0) for r in results]
        passing = float(sched.passing_marks or 33)
        pass_count = sum(1 for m in marks_list if m >= passing)

        analysis.append({
            'schedule_id': sched.id,
            'subject_name': sched.subject.name if sched.subject else None,
            'class_name': sched.class_ref.name if sched.class_ref else None,
            'max_marks': float(sched.max_marks or 0),
            'total_students': len(results),
            'average': round(sum(marks_list) / len(marks_list), 1),
            'highest': max(marks_list),
            'lowest': min(marks_list),
            'pass_count': pass_count,
            'pass_percentage': round(pass_count / len(results) * 100, 1),
        })

    return analysis
