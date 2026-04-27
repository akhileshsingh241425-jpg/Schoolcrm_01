"""
Patch communication.py to add notification functions for:
1. Admission confirmation (when student enrolled)
2. Attendance absent alert (when marked absent)
3. Exam result notification (when marks entered)
4. General WhatsApp send endpoint
"""

filepath = r'd:\software\school CRM\backend\app\routes\communication.py'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add new notification functions before the API Config section
new_functions = '''

# ── Admission Confirmation Notification ───────────────────
def notify_admission_confirmed(school_id, admission, student):
    """Send WhatsApp notification when admission is confirmed / student enrolled"""
    try:
        phone = admission.father_phone or admission.mother_phone or admission.guardian_phone or admission.phone
        if not phone:
            return

        student_name = admission.student_name
        app_no = admission.application_no or '-'
        adm_no = student.admission_no or '-'

        template_params = {
            'header_text': 'Admission Confirmed',
            'param1': student_name,
            'param2': f'App No: {app_no}',
            'param3': f'Admission No: {adm_no}',
            'param4': 'Welcome to our school! Thank you for choosing us.'
        }

        send_whatsapp(phone, '', template_params=template_params)

        # Also send email if available
        email = admission.father_email or admission.mother_email or admission.email
        if email:
            subject = f'Admission Confirmed - {student_name}'
            body = (
                f'Dear Parent,\\n\\n'
                f'We are happy to inform you that {student_name} has been successfully enrolled.\\n\\n'
                f'Application No: {app_no}\\n'
                f'Admission No: {adm_no}\\n\\n'
                f'Welcome to our school family!\\n'
            )
            send_email(email, subject, body)

        # Log notification
        log = NotificationLog(
            school_id=school_id,
            alert_type='admission_confirmed',
            channel='whatsapp',
            recipient_phone=phone,
            message=f'Admission confirmed for {student_name}',
            status='sent',
            sent_at=datetime.utcnow()
        )
        db.session.add(log)
    except Exception:
        pass


# ── Attendance Absent Alert ──────────────────────────────
def notify_absent_students(school_id, absent_records, att_date):
    """Send WhatsApp alert to parents when their child is marked absent.
    absent_records: list of dicts with student_id that have status='absent'
    """
    try:
        if not absent_records:
            return

        student_ids = [r['student_id'] for r in absent_records if r.get('status') == 'absent']
        if not student_ids:
            return

        students = Student.query.filter(
            Student.id.in_(student_ids),
            Student.school_id == school_id
        ).all()

        for student in students:
            contacts = _get_parent_contacts(student)
            if not contacts:
                continue

            student_name = f"{student.first_name} {student.last_name or ''}".strip()
            template_params = {
                'header_text': 'Absence Alert',
                'param1': student_name,
                'param2': f'Date: {att_date}',
                'param3': 'Status: Absent',
                'param4': 'Please contact school if this is incorrect.'
            }

            for contact in contacts:
                if contact.get('phone'):
                    send_whatsapp(contact['phone'], '', template_params=template_params)

                    log = NotificationLog(
                        school_id=school_id,
                        alert_type='daily_absent',
                        channel='whatsapp',
                        recipient_phone=contact['phone'],
                        student_id=student.id,
                        message=f'{student_name} marked absent on {att_date}',
                        status='sent',
                        sent_at=datetime.utcnow()
                    )
                    db.session.add(log)

        db.session.commit()
    except Exception:
        pass


# ── Exam Result Notification ─────────────────────────────
def notify_exam_results(school_id, exam_schedule_id, results):
    """Send WhatsApp to parents when marks are entered for their child"""
    try:
        schedule = ExamSchedule.query.get(exam_schedule_id)
        if not schedule:
            return

        exam = schedule.exam if hasattr(schedule, 'exam') else Exam.query.get(schedule.exam_id)
        exam_name = exam.name if exam else 'Exam'
        subject_name = schedule.subject.name if hasattr(schedule, 'subject') and schedule.subject else 'Subject'

        for result in results:
            student = Student.query.get(result.student_id) if hasattr(result, 'student_id') else None
            if not student:
                continue

            contacts = _get_parent_contacts(student)
            if not contacts:
                continue

            student_name = f"{student.first_name} {student.last_name or ''}".strip()
            marks_info = f'{result.marks_obtained}/{schedule.max_marks}' if result.marks_obtained is not None else 'Absent'
            grade_info = result.grade or '-'

            template_params = {
                'header_text': 'Exam Result',
                'param1': student_name,
                'param2': f'{exam_name} - {subject_name}',
                'param3': f'Marks: {marks_info}',
                'param4': f'Grade: {grade_info}'
            }

            for contact in contacts:
                if contact.get('phone'):
                    send_whatsapp(contact['phone'], '', template_params=template_params)

                    log = NotificationLog(
                        school_id=school_id,
                        alert_type='exam_result',
                        channel='whatsapp',
                        recipient_phone=contact['phone'],
                        student_id=student.id,
                        message=f'{exam_name} result: {student_name} scored {marks_info}',
                        status='sent',
                        sent_at=datetime.utcnow()
                    )
                    db.session.add(log)

        db.session.commit()
    except Exception:
        pass


# ── General WhatsApp Send ────────────────────────────────
@communication_bp.route('/whatsapp/send', methods=['POST'])
@role_required('school_admin', 'super_admin', 'teacher')
def send_whatsapp_message():
    """Send WhatsApp message to a phone number with custom content"""
    data = request.get_json() or {}
    phone = data.get('phone')
    if not phone:
        return error_response('Phone number is required')

    template_params = {
        'header_text': data.get('header', 'School Notification'),
        'param1': data.get('param1', data.get('message', '-')),
        'param2': data.get('param2', '-'),
        'param3': data.get('param3', '-'),
        'param4': data.get('param4', '-'),
    }

    success, result = send_whatsapp(phone, data.get('message', ''), template_params=template_params)

    if success:
        log = NotificationLog(
            school_id=g.school_id,
            alert_type='manual_whatsapp',
            channel='whatsapp',
            recipient_phone=phone,
            message=data.get('message', template_params['param1']),
            status='sent',
            sent_at=datetime.utcnow()
        )
        db.session.add(log)
        db.session.commit()
        return success_response({'result': str(result)}, 'WhatsApp message sent')
    else:
        return error_response(f'WhatsApp send failed: {result}', 500)

'''

# Insert before the API Config section
marker = '# \u2500\u2500 API Config Status'
if marker in content:
    content = content.replace(marker, new_functions + '\n' + marker)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: Added notification functions to communication.py")
else:
    print(f"ERROR: Could not find marker. Looking for alternative...")
    # Try alternative
    marker2 = "@communication_bp.route('/api-config'"
    if marker2 in content:
        content = content.replace(marker2, new_functions + '\n' + marker2)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print("SUCCESS (alt): Added notification functions to communication.py")
    else:
        print("ERROR: Could not find insertion point")
