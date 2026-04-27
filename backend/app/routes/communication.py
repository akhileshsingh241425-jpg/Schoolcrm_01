from flask import Blueprint, request, g
from datetime import datetime, date, time
from app import db
from app.models.communication import Announcement, Notification, SmsTemplate, AlertSetting, NotificationLog
from app.models.attendance import StudentAttendance, StaffAttendance
from app.models.student import Student, ParentDetail
from app.models.academic import Exam, ExamSchedule
from app.models.fee import FeeInstallment, FeePayment
from app.utils.decorators import school_required, role_required
from app.utils.helpers import success_response, error_response, paginate, send_email, send_whatsapp, make_ivr_call

communication_bp = Blueprint('communication', __name__)


@communication_bp.route('/announcements', methods=['GET'])
@school_required
def list_announcements():
    query = Announcement.query.filter_by(school_id=g.school_id)
    query = query.order_by(Announcement.created_at.desc())
    return success_response(paginate(query))


@communication_bp.route('/announcements', methods=['POST'])
@role_required('school_admin', 'teacher')
def create_announcement():
    data = request.get_json()
    announcement = Announcement(
        school_id=g.school_id,
        title=data['title'],
        message=data['message'],
        target_audience=data.get('target_audience', 'all'),
        target_class_id=data.get('target_class_id'),
        is_published=data.get('is_published', False),
        published_at=datetime.utcnow() if data.get('is_published') else None,
        created_by=g.current_user.id
    )
    db.session.add(announcement)
    db.session.commit()
    return success_response(announcement.to_dict(), 'Announcement created', 201)


@communication_bp.route('/notifications', methods=['GET'])
@school_required
def list_notifications():
    query = Notification.query.filter_by(school_id=g.school_id, user_id=g.current_user.id)
    query = query.order_by(Notification.created_at.desc())
    return success_response(paginate(query))


@communication_bp.route('/notifications/<int:notif_id>/read', methods=['PUT'])
@school_required
def mark_read(notif_id):
    notif = Notification.query.filter_by(
        id=notif_id, school_id=g.school_id, user_id=g.current_user.id
    ).first_or_404()
    notif.read_at = datetime.utcnow()
    db.session.commit()
    return success_response(message='Marked as read')


@communication_bp.route('/send', methods=['POST'])
@role_required('school_admin', 'teacher', 'counselor')
def send_notification():
    data = request.get_json()
    user_ids = data.get('user_ids', [])
    
    notifications = []
    for uid in user_ids:
        notif = Notification(
            school_id=g.school_id,
            user_id=uid,
            title=data['title'],
            message=data.get('message'),
            type=data.get('type', 'in_app'),
            status='pending'
        )
        db.session.add(notif)
        notifications.append(notif)
    
    db.session.commit()
    return success_response(message=f'{len(notifications)} notifications queued')


@communication_bp.route('/sms-templates', methods=['GET'])
@school_required
def list_templates():
    templates = SmsTemplate.query.filter_by(school_id=g.school_id).all()
    return success_response([t.to_dict() for t in templates])


@communication_bp.route('/sms-templates', methods=['POST'])
@role_required('school_admin')
def create_template():
    data = request.get_json()
    template = SmsTemplate(
        school_id=g.school_id,
        name=data['name'],
        template=data['template'],
        variables=data.get('variables')
    )
    db.session.add(template)
    db.session.commit()
    return success_response(template.to_dict(), 'Template created', 201)


# ── Alert Settings ─────────────────────────────────────────
@communication_bp.route('/alert-settings', methods=['GET'])
@school_required
def list_alert_settings():
    settings = AlertSetting.query.filter_by(school_id=g.school_id).all()
    return success_response([s.to_dict() for s in settings])


@communication_bp.route('/alert-settings', methods=['POST'])
@role_required('school_admin')
def save_alert_settings():
    """Create or update alert settings"""
    data = request.get_json()
    alert_type = data.get('alert_type')
    if not alert_type:
        return error_response('alert_type is required')

    setting = AlertSetting.query.filter_by(
        school_id=g.school_id, alert_type=alert_type
    ).first()

    if setting:
        setting.is_enabled = data.get('is_enabled', setting.is_enabled)
        setting.channels = data.get('channels', setting.channels)
        setting.config = data.get('config', setting.config)
    else:
        setting = AlertSetting(
            school_id=g.school_id,
            alert_type=alert_type,
            is_enabled=data.get('is_enabled', True),
            channels=data.get('channels', ['email']),
            config=data.get('config', {})
        )
        db.session.add(setting)

    db.session.commit()
    return success_response(setting.to_dict(), 'Alert setting saved')


@communication_bp.route('/alert-settings/<int:setting_id>', methods=['DELETE'])
@role_required('school_admin')
def delete_alert_setting(setting_id):
    setting = AlertSetting.query.filter_by(id=setting_id, school_id=g.school_id).first_or_404()
    db.session.delete(setting)
    db.session.commit()
    return success_response(None, 'Alert setting deleted')


# ── Notification Logs ──────────────────────────────────────
@communication_bp.route('/notification-logs', methods=['GET'])
@school_required
def list_notification_logs():
    query = NotificationLog.query.filter_by(school_id=g.school_id)
    alert_type = request.args.get('alert_type')
    if alert_type:
        query = query.filter_by(alert_type=alert_type)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(NotificationLog.sent_at.desc())
    return success_response(paginate(query))


# ── Helper: Get parent contacts for a student ─────────────
def _get_parent_contacts(student_id, school_id):
    """Get all parent email/whatsapp contacts for a student"""
    parents = ParentDetail.query.filter_by(student_id=student_id, school_id=school_id).all()
    contacts = []
    for p in parents:
        if p.email:
            contacts.append({'name': p.name, 'email': p.email, 'whatsapp': p.whatsapp or p.phone, 'relation': p.relation})
        elif p.phone:
            contacts.append({'name': p.name, 'email': None, 'whatsapp': p.whatsapp or p.phone, 'relation': p.relation})
    return contacts


def _send_to_parent(school_id, alert_type, channels, contact, student, subject, message):
    """Send notification via configured channels and log it"""
    results = []

    if 'email' in channels and contact.get('email'):
        success, err = send_email(contact['email'], subject, message)
        log = NotificationLog(
            school_id=school_id, alert_type=alert_type, channel='email',
            recipient_name=contact['name'], recipient_contact=contact['email'],
            student_id=student.id if student else None,
            subject=subject, message=message,
            status='sent' if success else 'failed',
            error_message=err
        )
        db.session.add(log)
        results.append({'channel': 'email', 'success': success, 'to': contact['email']})

    if 'whatsapp' in channels and contact.get('whatsapp'):
        success, err = send_whatsapp(contact['whatsapp'], f"*{subject}*\n\n{message}")
        log = NotificationLog(
            school_id=school_id, alert_type=alert_type, channel='whatsapp',
            recipient_name=contact['name'], recipient_contact=contact['whatsapp'],
            student_id=student.id if student else None,
            subject=subject, message=message,
            status='sent' if success else 'failed',
            error_message=err
        )
        db.session.add(log)
        results.append({'channel': 'whatsapp', 'success': success, 'to': contact['whatsapp']})

    return results


# ── Auto Alert: Late Arrival ──────────────────────────────
@communication_bp.route('/alerts/late-arrival', methods=['POST'])
@role_required('school_admin', 'teacher', 'principal')
def trigger_late_arrival_alert():
    """Send alert to parents of students who haven't arrived by cutoff time.
    Can be triggered manually or by a cron job.
    """
    data = request.get_json() or {}
    target_date = data.get('date', date.today().isoformat())
    cutoff_time = data.get('cutoff_time', '10:00')

    setting = AlertSetting.query.filter_by(
        school_id=g.school_id, alert_type='late_arrival'
    ).first()
    channels = setting.channels if setting else ['email']
    if setting and not setting.is_enabled:
        return error_response('Late arrival alerts are disabled')
    if setting and setting.config.get('cutoff_time'):
        cutoff_time = setting.config['cutoff_time']

    try:
        target_date = datetime.strptime(target_date, '%Y-%m-%d').date()
    except ValueError:
        return error_response('Invalid date format')

    # Students who have attendance marked as present/late
    marked_students = db.session.query(StudentAttendance.student_id).filter(
        StudentAttendance.school_id == g.school_id,
        StudentAttendance.date == target_date,
        StudentAttendance.status.in_(['present', 'late', 'half_day'])
    ).all()
    marked_ids = {s[0] for s in marked_students}

    # All active students
    all_students = Student.query.filter_by(school_id=g.school_id, is_active=True).all()

    # Students NOT marked yet = potentially not arrived
    absent_students = [s for s in all_students if s.id not in marked_ids]

    if not absent_students:
        return success_response({'sent': 0, 'total_absent': 0}, 'All students have arrived!')

    sent_count = 0
    failed_count = 0
    details = []

    school_name = g.school_id  # Will be replaced with actual school name
    from app.models.school import School
    school = School.query.get(g.school_id)
    school_name = school.name if school else 'School'

    for student in absent_students:
        contacts = _get_parent_contacts(student.id, g.school_id)
        student_name = f"{student.first_name} {student.last_name or ''}".strip()

        subject = f"Alert: {student_name} has not reached school yet"
        message = (
            f"Dear Parent,\n\n"
            f"This is to inform you that your ward {student_name} "
            f"has not been marked present at {school_name} as of {cutoff_time} on {target_date.strftime('%d-%m-%Y')}.\n\n"
            f"If your child is absent today, please inform the school. "
            f"If they have left for school, please check and contact us immediately.\n\n"
            f"Regards,\n{school_name}"
        )

        for contact in contacts:
            results = _send_to_parent(g.school_id, 'late_arrival', channels, contact, student, subject, message)
            for r in results:
                if r['success']:
                    sent_count += 1
                else:
                    failed_count += 1
            details.append({'student': student_name, 'parent': contact['name'], 'results': results})

    db.session.commit()
    return success_response({
        'total_absent': len(absent_students),
        'sent': sent_count,
        'failed': failed_count,
        'details': details[:50]
    }, f'Late arrival alerts sent to {sent_count} contacts')


# ── Auto Alert: Monthly Attendance Report ─────────────────
@communication_bp.route('/alerts/monthly-attendance', methods=['POST'])
@role_required('school_admin', 'principal')
def trigger_monthly_attendance_report():
    """Send monthly attendance summary to all parents"""
    data = request.get_json() or {}
    month = data.get('month', date.today().month)
    year = data.get('year', date.today().year)

    setting = AlertSetting.query.filter_by(
        school_id=g.school_id, alert_type='monthly_attendance'
    ).first()
    channels = setting.channels if setting else ['email']
    if setting and not setting.is_enabled:
        return error_response('Monthly attendance alerts are disabled')

    from app.models.school import School
    school = School.query.get(g.school_id)
    school_name = school.name if school else 'School'

    # Get all students with attendance for the month
    from sqlalchemy import func, extract
    students = Student.query.filter_by(school_id=g.school_id, is_active=True).all()

    sent_count = 0
    failed_count = 0
    month_name = datetime(year, month, 1).strftime('%B %Y')

    for student in students:
        # Count attendance for the month
        total_days = StudentAttendance.query.filter(
            StudentAttendance.school_id == g.school_id,
            StudentAttendance.student_id == student.id,
            extract('month', StudentAttendance.date) == month,
            extract('year', StudentAttendance.date) == year
        ).count()

        present_days = StudentAttendance.query.filter(
            StudentAttendance.school_id == g.school_id,
            StudentAttendance.student_id == student.id,
            extract('month', StudentAttendance.date) == month,
            extract('year', StudentAttendance.date) == year,
            StudentAttendance.status.in_(['present', 'late'])
        ).count()

        absent_days = StudentAttendance.query.filter(
            StudentAttendance.school_id == g.school_id,
            StudentAttendance.student_id == student.id,
            extract('month', StudentAttendance.date) == month,
            extract('year', StudentAttendance.date) == year,
            StudentAttendance.status == 'absent'
        ).count()

        pct = round((present_days / total_days * 100), 1) if total_days > 0 else 0
        student_name = f"{student.first_name} {student.last_name or ''}".strip()

        # Check low attendance warning threshold
        threshold = 75
        if setting and setting.config.get('min_attendance_pct'):
            threshold = setting.config['min_attendance_pct']
        low_warning = pct < threshold and total_days > 0

        subject = f"Monthly Attendance Report - {student_name} ({month_name})"
        message = (
            f"Dear Parent,\n\n"
            f"Here is the monthly attendance report for {student_name} for {month_name}:\n\n"
            f"Total School Days: {total_days}\n"
            f"Days Present: {present_days}\n"
            f"Days Absent: {absent_days}\n"
            f"Attendance: {pct}%\n"
        )
        if low_warning:
            message += (
                f"\n⚠️ WARNING: Attendance is below {threshold}%. "
                f"Please ensure regular attendance.\n"
            )
        message += f"\nRegards,\n{school_name}"

        contacts = _get_parent_contacts(student.id, g.school_id)
        for contact in contacts:
            results = _send_to_parent(g.school_id, 'monthly_attendance', channels, contact, student, subject, message)
            for r in results:
                if r['success']:
                    sent_count += 1
                else:
                    failed_count += 1

    db.session.commit()
    return success_response({
        'total_students': len(students),
        'sent': sent_count,
        'failed': failed_count,
        'month': month_name
    }, f'Monthly attendance reports sent to {sent_count} contacts')


# ── Auto Alert: Exam Notification ─────────────────────────
@communication_bp.route('/alerts/exam-notification', methods=['POST'])
@role_required('school_admin', 'teacher', 'principal')
def trigger_exam_notification():
    """Send exam schedule / result notification to parents"""
    data = request.get_json() or {}
    exam_id = data.get('exam_id')
    notify_type = data.get('type', 'schedule')  # 'schedule' or 'result'

    if not exam_id:
        return error_response('exam_id is required')

    alert_type = 'exam_schedule' if notify_type == 'schedule' else 'exam_result'
    setting = AlertSetting.query.filter_by(
        school_id=g.school_id, alert_type=alert_type
    ).first()
    channels = setting.channels if setting else ['email']
    if setting and not setting.is_enabled:
        return error_response(f'{alert_type} alerts are disabled')

    from app.models.school import School
    school = School.query.get(g.school_id)
    school_name = school.name if school else 'School'

    exam = Exam.query.filter_by(id=exam_id, school_id=g.school_id).first()
    if not exam:
        return error_response('Exam not found', 404)

    # Get exam schedules
    schedules = ExamSchedule.query.filter_by(exam_id=exam.id).order_by(ExamSchedule.exam_date).all()

    if notify_type == 'schedule':
        # Build schedule text
        schedule_text = ""
        for s in schedules:
            subject_name = s.subject.name if s.subject else 'Unknown'
            sch_date = s.exam_date.strftime('%d-%m-%Y') if s.exam_date else '-'
            start = s.start_time.strftime('%H:%M') if s.start_time else ''
            end = s.end_time.strftime('%H:%M') if s.end_time else ''
            schedule_text += f"  {subject_name}: {sch_date} ({start}-{end})\n"

        # Get students for the exam's class
        class_id = schedules[0].class_id if schedules else None
        students = Student.query.filter_by(school_id=g.school_id, is_active=True)
        if class_id:
            students = students.filter_by(class_id=class_id)
        students = students.all()

        sent_count = 0
        for student in students:
            student_name = f"{student.first_name} {student.last_name or ''}".strip()
            subject = f"Exam Schedule: {exam.name} - {student_name}"
            message = (
                f"Dear Parent,\n\n"
                f"The exam schedule for {exam.name} has been published.\n\n"
                f"Schedule:\n{schedule_text}\n"
                f"Please ensure {student_name} prepares well.\n\n"
                f"Regards,\n{school_name}"
            )
            contacts = _get_parent_contacts(student.id, g.school_id)
            for contact in contacts:
                results = _send_to_parent(g.school_id, 'exam_schedule', channels, contact, student, subject, message)
                sent_count += sum(1 for r in results if r['success'])

        db.session.commit()
        return success_response({
            'total_students': len(students),
            'sent': sent_count,
            'exam': exam.name
        }, f'Exam schedule notifications sent to {sent_count} contacts')

    else:
        # Result notification
        from app.models.academic import ExamResult
        schedule_ids = [s.id for s in schedules]
        results_data = ExamResult.query.filter(ExamResult.exam_schedule_id.in_(schedule_ids)).all() if schedule_ids else []

        # Group results by student
        from collections import defaultdict
        student_results = defaultdict(list)
        for r in results_data:
            student_results[r.student_id].append(r)

        sent_count = 0
        for student_id, res_list in student_results.items():
            student = Student.query.get(student_id)
            if not student:
                continue
            student_name = f"{student.first_name} {student.last_name or ''}".strip()

            result_text = ""
            total_marks = 0
            total_max = 0
            for r in res_list:
                sched = ExamSchedule.query.get(r.exam_schedule_id)
                subj = sched.subject.name if sched and sched.subject else 'Unknown'
                max_m = float(sched.max_marks) if sched and sched.max_marks else 100
                obtained = float(r.marks_obtained) if r.marks_obtained else 0
                result_text += f"  {subj}: {obtained}/{max_m}"
                if r.grade:
                    result_text += f" (Grade: {r.grade})"
                result_text += "\n"
                total_marks += obtained
                total_max += max_m

            pct = round(total_marks / total_max * 100, 1) if total_max > 0 else 0

            subject = f"Exam Results: {exam.name} - {student_name}"
            message = (
                f"Dear Parent,\n\n"
                f"Results for {exam.name} are now available for {student_name}.\n\n"
                f"Results:\n{result_text}\n"
                f"Total: {total_marks}/{total_max} ({pct}%)\n\n"
                f"Regards,\n{school_name}"
            )
            contacts = _get_parent_contacts(student.id, g.school_id)
            for contact in contacts:
                send_results = _send_to_parent(g.school_id, 'exam_result', channels, contact, student, subject, message)
                sent_count += sum(1 for r in send_results if r['success'])

        db.session.commit()
        return success_response({
            'total_students': len(student_results),
            'sent': sent_count,
            'exam': exam.name
        }, f'Exam result notifications sent to {sent_count} contacts')


# ── WhatsApp Send (SensiBOT) ──────────────────────────────
@communication_bp.route('/whatsapp/send', methods=['POST'])
@school_required
def send_whatsapp_message():
    """Send a WhatsApp message via SensiBOT API"""
    data = request.get_json()
    phone = data.get('phone')
    message = data.get('message')
    if not phone or not message:
        return error_response('Phone and message are required')

    success, result = send_whatsapp(phone, message)

    # Log the notification
    log = NotificationLog(
        school_id=g.school_id, alert_type='whatsapp_manual', channel='whatsapp',
        recipient_name=data.get('recipient_name', ''),
        recipient_contact=phone,
        student_id=data.get('student_id'),
        subject=data.get('subject', 'WhatsApp Message'),
        message=message,
        status='sent' if success else 'failed',
        error_message=result if not success else None
    )
    db.session.add(log)
    db.session.commit()

    if success:
        return success_response({'status': 'sent', 'message_id': result}, 'WhatsApp message sent successfully!')
    return error_response(f'Failed to send: {result}', 500)


# ── IVR Click-to-Call ─────────────────────────────────────
@communication_bp.route('/ivr/call', methods=['POST'])
@school_required
def initiate_ivr_call():
    """Initiate a Click-to-Call via IVR Solutions API"""
    data = request.get_json()
    phone = data.get('phone')
    if not phone:
        return error_response('Phone number is required')

    success, err = make_ivr_call(phone)

    # Log the call attempt
    log = NotificationLog(
        school_id=g.school_id, alert_type='ivr_call', channel='ivr',
        recipient_name=data.get('recipient_name', ''),
        recipient_contact=phone,
        student_id=data.get('student_id'),
        subject='IVR Call',
        message=f'Click-to-call initiated to {phone}',
        status='sent' if success else 'failed',
        error_message=err
    )
    db.session.add(log)
    db.session.commit()

    if success:
        return success_response({'status': 'initiated'}, 'Call initiated successfully')
    return error_response(f'Failed to initiate call: {err}', 500)


# -- Auto Alert: Fee Reminder ----------------------------------------
@communication_bp.route('/alerts/fee-reminder', methods=['POST'])
@role_required('school_admin', 'accountant')
def trigger_fee_reminder():
    """Send fee reminder to parents of students with pending/overdue installments."""
    data = request.get_json() or {}
    school_id = g.school_id

    setting = AlertSetting.query.filter_by(
        school_id=school_id, alert_type='fee_reminder'
    ).first()
    channels = setting.channels if setting else ['email']
    if setting and not setting.is_enabled:
        return error_response('Fee reminder alerts are disabled')

    days_before = 7
    if setting and setting.config:
        days_before = setting.config.get('days_before_due', 7)
    days_before = data.get('days_before_due', days_before)
    include_overdue = data.get('include_overdue', True)

    from datetime import timedelta
    today = date.today()
    upcoming_date = today + timedelta(days=int(days_before))

    query = FeeInstallment.query.filter(
        FeeInstallment.school_id == school_id,
        FeeInstallment.status.in_(['pending', 'overdue', 'partial']),
    )
    if include_overdue:
        query = query.filter(FeeInstallment.due_date <= upcoming_date)
    else:
        query = query.filter(
            FeeInstallment.due_date >= today,
            FeeInstallment.due_date <= upcoming_date
        )

    installments = query.all()
    sent_count = 0
    student_count = 0

    student_installments = {}
    for inst in installments:
        sid = inst.student_id
        if sid not in student_installments:
            student_installments[sid] = []
        student_installments[sid].append(inst)

    for student_id, insts in student_installments.items():
        student = Student.query.get(student_id)
        if not student:
            continue

        contacts = _get_parent_contacts(student_id, school_id)
        if not contacts:
            continue

        student_count += 1
        total_pending = sum(float(i.amount or 0) - float(i.paid_amount or 0) for i in insts)
        overdue_count = sum(1 for i in insts if i.due_date and i.due_date < today)

        inst_lines = []
        for i in insts:
            due = i.due_date.strftime('%d-%b-%Y') if i.due_date else 'N/A'
            pending_amt = float(i.amount or 0) - float(i.paid_amount or 0)
            status_txt = 'OVERDUE' if i.due_date and i.due_date < today else 'Due'
            inst_lines.append(f"  - {i.description or 'Installment'}: Rs.{pending_amt:,.0f} ({status_txt} {due})")

        details = '\n'.join(inst_lines)
        student_name = f"{student.first_name} {student.last_name or ''}".strip()

        subject = f"Fee Reminder - {student_name}"
        message = (
            f"Dear Parent,\n\n"
            f"This is a reminder about pending fees for {student_name}.\n\n"
            f"Total Pending: Rs.{total_pending:,.0f}\n"
            + (f"{overdue_count} installment(s) are OVERDUE!\n" if overdue_count > 0 else "")
            + f"\nDetails:\n{details}\n\n"
            f"Please make the payment at the earliest.\n"
            f"You can pay online through the Parent Portal.\n\n"
            f"Thank you."
        )

        for contact in contacts:
            results = _send_to_parent(school_id, 'fee_reminder', channels, contact, student, subject, message)
            sent_count += sum(1 for r in results if r['success'])

    db.session.commit()
    return success_response({
        'students_notified': student_count,
        'installments_found': len(installments),
        'notifications_sent': sent_count,
    }, f'Fee reminders sent to {sent_count} parent contacts for {student_count} students')


def notify_payment_received(school_id, payment):
    """Send payment confirmation notification to parents. Called after successful payment."""
    try:
        setting = AlertSetting.query.filter_by(
            school_id=school_id, alert_type='fee_reminder'
        ).first()
        channels = setting.channels if setting and setting.is_enabled else ['email']

        student = Student.query.get(payment.student_id)
        if not student:
            return

        contacts = _get_parent_contacts(payment.student_id, school_id)
        if not contacts:
            return

        student_name = f"{student.first_name} {student.last_name or ''}".strip()
        amount = float(payment.total_amount or payment.amount_paid or 0)
        receipt = payment.receipt_no or '-'
        mode = (payment.gateway or payment.payment_mode or 'online').upper()
        pay_date = payment.payment_date.strftime('%d-%b-%Y') if payment.payment_date else date.today().strftime('%d-%b-%Y')

        subject = f"Payment Received - {student_name}"
        message = (
            f"Dear Parent,\n\n"
            f"We have received a fee payment for {student_name}.\n\n"
            f"Amount: Rs.{amount:,.0f}\n"
            f"Payment Mode: {mode}\n"
            f"Receipt No: {receipt}\n"
            f"Date: {pay_date}\n\n"
            f"Thank you for the timely payment.\n"
        )

        for contact in contacts:
            _send_to_parent(school_id, 'payment_received', channels, contact, student, subject, message)

        db.session.commit()
    except Exception:
        pass



# ── API Config Status ─────────────────────────────────────
@communication_bp.route('/api-config', methods=['GET'])
@role_required('school_admin', 'super_admin')
def get_api_config():
    """Check which external APIs are configured"""
    from flask import current_app
    return success_response({
        'whatsapp_configured': bool(current_app.config.get('WHATSAPP_AUTH_TOKEN')),
        'ivr_configured': bool(current_app.config.get('IVR_API_TOKEN') and current_app.config.get('IVR_DID_NO')),
        'email_configured': bool(current_app.config.get('MAIL_USERNAME')),
    })


# ── WhatsApp Test Send ───────────────────────────────────
@communication_bp.route('/whatsapp/test', methods=['POST'])
@role_required('school_admin', 'super_admin')
def test_whatsapp():
    """Send a test WhatsApp message to verify API integration"""
    data = request.get_json() or {}
    phone = data.get('phone', '9773983859')

    template_params = {
        'header_text': 'School CRM Test',
        'param1': 'Test Notification',
        'param2': 'System Check',
        'param3': 'All OK',
        'param4': 'This is a test message from School CRM'
    }

    success, result = send_whatsapp(phone, '', template_params=template_params)

    if success:
        return success_response({'result': str(result)}, 'WhatsApp test message sent successfully')
    else:
        return error_response(f'WhatsApp test failed: {result}', 500)
