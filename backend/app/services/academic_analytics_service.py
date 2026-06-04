"""Academic Analytics Service — aggregation queries for dashboard, reports, and analytics."""
from app import db
from app.models.academic import (
    Exam, ExamSchedule, ExamResult, LessonPlan, Syllabus, SyllabusProgress,
    Homework, HomeworkSubmission, TeacherSubject, Timetable, TimetableSubstitution,
    AcademicCalendar, Term, Subject, Grade, GradingSystem
)
from app.models.student import Student, AcademicYear, Class, Section
from sqlalchemy import func, and_, or_, case, extract
from datetime import date, timedelta, datetime


def get_dashboard_summary(school_id, academic_year_id, term=None):
    """
    Dashboard summary: pending approvals, at-risk syllabus, upcoming events,
    pending substitutions.

    Returns dict with counts for each dashboard widget.
    """
    # Pending approvals: lesson plans with status='submitted'
    pending_approvals = LessonPlan.query.filter_by(
        school_id=school_id,
        status='submitted'
    )
    if academic_year_id:
        pending_approvals = pending_approvals.filter_by(academic_year_id=academic_year_id)
    pending_approvals_count = pending_approvals.count()

    # At-risk syllabus: completion < 70% with < 30 days to term end
    at_risk_count = 0
    if term:
        term_record = Term.query.filter_by(
            school_id=school_id,
            id=term
        ).first()
        if term_record and term_record.end_date:
            days_remaining = (term_record.end_date - date.today()).days
            if days_remaining < 30:
                # Find syllabus entries with low completion
                at_risk_syllabus = Syllabus.query.filter(
                    Syllabus.school_id == school_id,
                    Syllabus.academic_year_id == academic_year_id,
                    Syllabus.completion_percentage < 70
                ).count()
                at_risk_count = at_risk_syllabus
    else:
        # Check current term if no term specified
        current_term = Term.query.filter_by(
            school_id=school_id,
            is_current=True
        ).first()
        if current_term and current_term.end_date:
            days_remaining = (current_term.end_date - date.today()).days
            if days_remaining < 30:
                at_risk_syllabus = Syllabus.query.filter(
                    Syllabus.school_id == school_id,
                    Syllabus.academic_year_id == academic_year_id,
                    Syllabus.completion_percentage < 70
                ).count()
                at_risk_count = at_risk_syllabus

    # Upcoming events: next 7 days
    today = date.today()
    next_week = today + timedelta(days=7)
    upcoming_events_count = AcademicCalendar.query.filter(
        AcademicCalendar.school_id == school_id,
        AcademicCalendar.start_date >= today,
        AcademicCalendar.start_date <= next_week
    ).count()

    # Pending substitutions: status='assigned'
    pending_substitutions_count = TimetableSubstitution.query.filter_by(
        school_id=school_id,
        status='assigned'
    ).count()

    return {
        'pending_approvals': pending_approvals_count,
        'at_risk_syllabus': at_risk_count,
        'upcoming_events': upcoming_events_count,
        'pending_substitutions': pending_substitutions_count,
    }


def get_class_performance(school_id, class_id, section_id, exam_id):
    """
    Class performance report: subject-wise avg marks, pass/fail counts,
    grade distribution.

    Returns dict with subjects list containing performance metrics.
    """
    # Get exam schedules for this class/section/exam
    query = ExamSchedule.query.filter_by(
        school_id=school_id,
        exam_id=exam_id,
        class_id=class_id
    )
    if section_id:
        query = query.filter_by(section_id=section_id)

    schedules = query.all()

    if not schedules:
        return {'subjects': [], 'message': 'No exam schedules found for the selected filters'}

    # Get the exam's grading system for grade distribution
    exam = Exam.query.filter_by(id=exam_id, school_id=school_id).first()
    grades = []
    if exam and exam.grading_system_id:
        grades = Grade.query.filter_by(
            grading_system_id=exam.grading_system_id,
            school_id=school_id
        ).order_by(Grade.min_marks.desc()).all()

    subjects = []
    for schedule in schedules:
        # Get results for this schedule
        results = ExamResult.query.filter_by(
            exam_schedule_id=schedule.id,
            school_id=school_id
        ).filter(ExamResult.is_absent == False).all()

        if not results:
            continue

        marks_list = [float(r.marks_obtained or 0) for r in results]
        max_marks = float(schedule.max_marks or 0)
        passing_marks = float(schedule.passing_marks or 33)

        pass_count = sum(1 for m in marks_list if m >= passing_marks)
        fail_count = len(marks_list) - pass_count
        avg_marks = round(sum(marks_list) / len(marks_list), 2) if marks_list else 0

        # Grade distribution
        grade_distribution = {}
        if grades and max_marks > 0:
            for result in results:
                obtained = float(result.marks_obtained or 0)
                pct = (obtained / max_marks) * 100
                for g in grades:
                    if float(g.min_marks) <= pct <= float(g.max_marks):
                        grade_distribution[g.name] = grade_distribution.get(g.name, 0) + 1
                        break

        subjects.append({
            'subject_id': schedule.subject_id,
            'subject_name': schedule.subject.name if schedule.subject else None,
            'max_marks': max_marks,
            'avg_marks': avg_marks,
            'highest_marks': max(marks_list) if marks_list else 0,
            'lowest_marks': min(marks_list) if marks_list else 0,
            'total_students': len(results),
            'pass_count': pass_count,
            'fail_count': fail_count,
            'pass_percentage': round(pass_count / len(results) * 100, 1) if results else 0,
            'grade_distribution': grade_distribution,
        })

    return {
        'class_id': class_id,
        'section_id': section_id,
        'exam_id': exam_id,
        'exam_name': exam.name if exam else None,
        'subjects': subjects,
        'overall_avg': round(
            sum(s['avg_marks'] for s in subjects) / len(subjects), 2
        ) if subjects else 0,
    }


def get_teacher_performance(school_id, teacher_id):
    """
    Teacher performance report: syllabus completion rate, lesson plan submission rate,
    homework count per month, avg student percentage.

    Returns dict with performance metrics for the teacher.
    """
    # Get current academic year
    current_year = AcademicYear.query.filter_by(
        school_id=school_id,
        is_current=True
    ).first()

    academic_year_id = current_year.id if current_year else None

    # Syllabus completion rate: percentage of chapters marked completed
    total_syllabus = 0
    completed_syllabus = 0
    if academic_year_id:
        # Get subjects/classes assigned to this teacher
        assignments = TeacherSubject.query.filter_by(
            school_id=school_id,
            teacher_id=teacher_id,
            status='active'
        ).all()

        for assignment in assignments:
            syllabus_entries = Syllabus.query.filter_by(
                school_id=school_id,
                class_id=assignment.class_id,
                subject_id=assignment.subject_id,
                academic_year_id=academic_year_id
            ).all()
            total_syllabus += len(syllabus_entries)
            completed_syllabus += sum(
                1 for s in syllabus_entries if s.status == 'completed'
            )

    syllabus_completion_rate = round(
        (completed_syllabus / total_syllabus * 100), 1
    ) if total_syllabus > 0 else 0

    # Lesson plan submission rate: submitted or approved / total scheduled teaching days
    lesson_plan_query = LessonPlan.query.filter_by(
        school_id=school_id,
        teacher_id=teacher_id
    )
    if academic_year_id:
        lesson_plan_query = lesson_plan_query.filter_by(academic_year_id=academic_year_id)

    total_plans = lesson_plan_query.count()
    submitted_or_approved = lesson_plan_query.filter(
        LessonPlan.status.in_(['submitted', 'approved'])
    ).count()

    lesson_plan_rate = round(
        (submitted_or_approved / total_plans * 100), 1
    ) if total_plans > 0 else 0

    # Homework count per month
    homework_query = Homework.query.filter_by(
        school_id=school_id,
        teacher_id=teacher_id
    )
    if academic_year_id and current_year:
        homework_query = homework_query.filter(
            Homework.assigned_date >= current_year.start_date,
            Homework.assigned_date <= current_year.end_date
        )

    homework_by_month = db.session.query(
        extract('month', Homework.assigned_date).label('month'),
        extract('year', Homework.assigned_date).label('year'),
        func.count(Homework.id).label('count')
    ).filter(
        Homework.school_id == school_id,
        Homework.teacher_id == teacher_id
    )
    if academic_year_id and current_year:
        homework_by_month = homework_by_month.filter(
            Homework.assigned_date >= current_year.start_date,
            Homework.assigned_date <= current_year.end_date
        )
    homework_by_month = homework_by_month.group_by(
        extract('year', Homework.assigned_date),
        extract('month', Homework.assigned_date)
    ).all()

    homework_per_month = [
        {'month': int(row.month), 'year': int(row.year), 'count': row.count}
        for row in homework_by_month
    ]

    # Average student percentage in exams for subjects taught by this teacher
    avg_student_pct = 0
    if assignments:
        subject_ids = [a.subject_id for a in assignments]
        class_ids = [a.class_id for a in assignments]

        # Get exam schedules for teacher's subjects/classes
        schedule_ids = db.session.query(ExamSchedule.id).filter(
            ExamSchedule.school_id == school_id,
            ExamSchedule.subject_id.in_(subject_ids),
            ExamSchedule.class_id.in_(class_ids)
        ).all()
        schedule_ids = [s[0] for s in schedule_ids]

        if schedule_ids:
            avg_result = db.session.query(
                func.avg(ExamResult.percentage)
            ).filter(
                ExamResult.school_id == school_id,
                ExamResult.exam_schedule_id.in_(schedule_ids),
                ExamResult.is_absent == False,
                ExamResult.percentage.isnot(None)
            ).scalar()

            avg_student_pct = round(float(avg_result), 1) if avg_result else 0

    return {
        'teacher_id': teacher_id,
        'syllabus_completion_rate': syllabus_completion_rate,
        'total_syllabus_entries': total_syllabus,
        'completed_syllabus_entries': completed_syllabus,
        'lesson_plan_submission_rate': lesson_plan_rate,
        'total_lesson_plans': total_plans,
        'submitted_or_approved_plans': submitted_or_approved,
        'homework_per_month': homework_per_month,
        'avg_student_percentage': avg_student_pct,
    }


def get_cross_section_comparison(school_id, class_id, exam_id):
    """
    Cross-section comparison: side-by-side comparison of sections within a class.
    Highlights sections where avg differs from class-wide avg by >10%.

    Returns dict with section-wise performance data.
    """
    # Get all sections for this class
    sections = Section.query.filter_by(
        school_id=school_id,
        class_id=class_id
    ).all()

    if not sections:
        return {'sections': [], 'message': 'No sections found for this class'}

    # Get exam schedules for this class
    schedules = ExamSchedule.query.filter_by(
        school_id=school_id,
        exam_id=exam_id,
        class_id=class_id
    ).all()

    if not schedules:
        return {'sections': [], 'message': 'No exam schedules found'}

    # Get unique subjects from schedules
    subject_ids = list(set(s.subject_id for s in schedules))

    section_data = []
    class_wide_totals = {}  # subject_id -> {total_marks, count}

    for section in sections:
        section_subjects = []
        section_total_pct = 0
        section_subject_count = 0

        for subject_id in subject_ids:
            # Find schedule for this section and subject
            schedule = next(
                (s for s in schedules
                 if s.subject_id == subject_id and
                 (s.section_id == section.id or s.section_id is None)),
                None
            )
            if not schedule:
                continue

            # Get results for this section
            results = db.session.query(ExamResult).join(
                Student, ExamResult.student_id == Student.id
            ).filter(
                ExamResult.exam_schedule_id == schedule.id,
                ExamResult.school_id == school_id,
                ExamResult.is_absent == False,
                Student.current_section_id == section.id
            ).all()

            if not results:
                continue

            marks_list = [float(r.marks_obtained or 0) for r in results]
            max_marks = float(schedule.max_marks or 0)
            passing_marks = float(schedule.passing_marks or 33)
            avg_marks = round(sum(marks_list) / len(marks_list), 2) if marks_list else 0
            avg_pct = round((avg_marks / max_marks * 100), 1) if max_marks > 0 else 0
            pass_count = sum(1 for m in marks_list if m >= passing_marks)
            fail_count = len(marks_list) - pass_count

            section_subjects.append({
                'subject_id': subject_id,
                'subject_name': schedule.subject.name if schedule.subject else None,
                'avg_marks': avg_marks,
                'avg_percentage': avg_pct,
                'pass_count': pass_count,
                'fail_count': fail_count,
                'total_students': len(results),
            })

            section_total_pct += avg_pct
            section_subject_count += 1

            # Accumulate class-wide totals
            if subject_id not in class_wide_totals:
                class_wide_totals[subject_id] = {'total_pct': 0, 'count': 0}
            class_wide_totals[subject_id]['total_pct'] += avg_pct
            class_wide_totals[subject_id]['count'] += 1

        section_avg_pct = round(
            section_total_pct / section_subject_count, 1
        ) if section_subject_count > 0 else 0

        section_data.append({
            'section_id': section.id,
            'section_name': section.name,
            'subjects': section_subjects,
            'overall_avg_percentage': section_avg_pct,
        })

    # Calculate class-wide averages and highlight deviations
    class_wide_avg = {}
    for subject_id, totals in class_wide_totals.items():
        class_wide_avg[subject_id] = round(
            totals['total_pct'] / totals['count'], 1
        ) if totals['count'] > 0 else 0

    # Add deviation flags
    for section in section_data:
        for subject in section['subjects']:
            class_avg = class_wide_avg.get(subject['subject_id'], 0)
            deviation = abs(subject['avg_percentage'] - class_avg)
            subject['class_avg_percentage'] = class_avg
            subject['deviation'] = round(deviation, 1)
            subject['is_highlighted'] = deviation > 10

    return {
        'class_id': class_id,
        'exam_id': exam_id,
        'sections': section_data,
        'class_wide_averages': class_wide_avg,
    }


def get_trend_analysis(school_id, class_id, subject_id):
    """
    Trend analysis: term-over-term comparison up to 4 terms.
    Shows average percentage and pass percentage per term.

    Returns dict with term-wise performance trends.
    """
    # Get current academic year
    current_year = AcademicYear.query.filter_by(
        school_id=school_id,
        is_current=True
    ).first()

    if not current_year:
        return {'terms': [], 'message': 'No current academic year found'}

    # Get terms for the current academic year (up to 4)
    terms = Term.query.filter_by(
        school_id=school_id,
        academic_year_id=current_year.id
    ).order_by(Term.start_date).limit(4).all()

    if not terms:
        return {'terms': [], 'message': 'No terms found for current academic year'}

    term_data = []
    for term_record in terms:
        # Find exams within this term's date range
        exams = Exam.query.filter(
            Exam.school_id == school_id,
            Exam.academic_year_id == current_year.id,
            Exam.start_date >= term_record.start_date,
            Exam.start_date <= term_record.end_date,
            Exam.status.in_(['completed', 'results_published'])
        ).all()

        if not exams:
            term_data.append({
                'term_id': term_record.id,
                'term_name': term_record.name,
                'avg_percentage': 0,
                'pass_percentage': 0,
                'total_students': 0,
                'has_data': False,
            })
            continue

        exam_ids = [e.id for e in exams]

        # Get schedules for this class and subject within these exams
        schedule_query = ExamSchedule.query.filter(
            ExamSchedule.school_id == school_id,
            ExamSchedule.exam_id.in_(exam_ids),
            ExamSchedule.class_id == class_id
        )
        if subject_id:
            schedule_query = schedule_query.filter_by(subject_id=subject_id)

        schedules = schedule_query.all()
        if not schedules:
            term_data.append({
                'term_id': term_record.id,
                'term_name': term_record.name,
                'avg_percentage': 0,
                'pass_percentage': 0,
                'total_students': 0,
                'has_data': False,
            })
            continue

        schedule_ids = [s.id for s in schedules]

        # Get results
        results = ExamResult.query.filter(
            ExamResult.school_id == school_id,
            ExamResult.exam_schedule_id.in_(schedule_ids),
            ExamResult.is_absent == False
        ).all()

        if not results:
            term_data.append({
                'term_id': term_record.id,
                'term_name': term_record.name,
                'avg_percentage': 0,
                'pass_percentage': 0,
                'total_students': 0,
                'has_data': False,
            })
            continue

        # Calculate avg percentage
        percentages = []
        pass_count = 0
        for result in results:
            schedule = next(
                (s for s in schedules if s.id == result.exam_schedule_id), None
            )
            if schedule and schedule.max_marks and float(schedule.max_marks) > 0:
                pct = (float(result.marks_obtained or 0) / float(schedule.max_marks)) * 100
                percentages.append(pct)
                if float(result.marks_obtained or 0) >= float(schedule.passing_marks or 33):
                    pass_count += 1

        avg_pct = round(sum(percentages) / len(percentages), 1) if percentages else 0
        pass_pct = round(pass_count / len(results) * 100, 1) if results else 0

        term_data.append({
            'term_id': term_record.id,
            'term_name': term_record.name,
            'avg_percentage': avg_pct,
            'pass_percentage': pass_pct,
            'total_students': len(set(r.student_id for r in results)),
            'has_data': True,
        })

    return {
        'class_id': class_id,
        'subject_id': subject_id,
        'academic_year_id': current_year.id,
        'academic_year': current_year.name,
        'terms': term_data,
    }


def get_homework_analytics(school_id, filters):
    """
    Homework analytics: total count, avg submissions, late submission percentage.

    filters dict may contain: class_id, section_id, subject_id, teacher_id,
    start_date, end_date.

    Returns dict with analytics metrics.
    """
    query = Homework.query.filter_by(school_id=school_id)

    # Apply filters
    if filters.get('class_id'):
        query = query.filter_by(class_id=filters['class_id'])
    if filters.get('section_id'):
        query = query.filter_by(section_id=filters['section_id'])
    if filters.get('subject_id'):
        query = query.filter_by(subject_id=filters['subject_id'])
    if filters.get('teacher_id'):
        query = query.filter_by(teacher_id=filters['teacher_id'])
    if filters.get('start_date'):
        query = query.filter(Homework.assigned_date >= filters['start_date'])
    if filters.get('end_date'):
        query = query.filter(Homework.assigned_date <= filters['end_date'])

    homework_list = query.all()
    total_count = len(homework_list)

    if total_count == 0:
        return {
            'total_count': 0,
            'avg_submissions': 0,
            'late_submission_percentage': 0,
            'message': 'No homework found for the selected filters',
        }

    homework_ids = [h.id for h in homework_list]

    # Total submissions
    total_submissions = HomeworkSubmission.query.filter(
        HomeworkSubmission.school_id == school_id,
        HomeworkSubmission.homework_id.in_(homework_ids)
    ).count()

    # Late submissions
    late_submissions = HomeworkSubmission.query.filter(
        HomeworkSubmission.school_id == school_id,
        HomeworkSubmission.homework_id.in_(homework_ids),
        HomeworkSubmission.is_late == True
    ).count()

    avg_submissions = round(total_submissions / total_count, 1) if total_count > 0 else 0
    late_pct = round(
        (late_submissions / total_submissions * 100), 1
    ) if total_submissions > 0 else 0

    return {
        'total_count': total_count,
        'total_submissions': total_submissions,
        'avg_submissions': avg_submissions,
        'late_submissions': late_submissions,
        'late_submission_percentage': late_pct,
    }


def get_homework_frequency(school_id, class_id, date_range):
    """
    Homework frequency: assignments per week per subject per class.

    date_range dict should contain 'start_date' and 'end_date'.

    Returns dict with frequency data per subject.
    """
    start_date = date_range.get('start_date')
    end_date = date_range.get('end_date')

    if not start_date or not end_date:
        return {'subjects': [], 'message': 'Date range is required'}

    # Calculate number of weeks in the range
    if isinstance(start_date, str):
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    if isinstance(end_date, str):
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()

    total_days = (end_date - start_date).days
    total_weeks = max(total_days / 7, 1)  # Avoid division by zero

    # Get homework count per subject for this class in the date range
    homework_by_subject = db.session.query(
        Homework.subject_id,
        Subject.name.label('subject_name'),
        func.count(Homework.id).label('total_count')
    ).join(
        Subject, Homework.subject_id == Subject.id
    ).filter(
        Homework.school_id == school_id,
        Homework.class_id == class_id,
        Homework.assigned_date >= start_date,
        Homework.assigned_date <= end_date
    ).group_by(
        Homework.subject_id,
        Subject.name
    ).all()

    subjects = []
    for row in homework_by_subject:
        frequency_per_week = round(row.total_count / total_weeks, 1)
        subjects.append({
            'subject_id': row.subject_id,
            'subject_name': row.subject_name,
            'total_assignments': row.total_count,
            'frequency_per_week': frequency_per_week,
            'is_over_assigned': frequency_per_week > 5,
            'is_under_assigned': frequency_per_week < 1,
        })

    return {
        'class_id': class_id,
        'start_date': start_date.isoformat() if hasattr(start_date, 'isoformat') else start_date,
        'end_date': end_date.isoformat() if hasattr(end_date, 'isoformat') else end_date,
        'total_weeks': round(total_weeks, 1),
        'subjects': subjects,
    }
