"""Patch communication.py to add fee reminder and payment notification functions."""
import os

FILE = os.path.join(os.path.dirname(__file__), 'backend', 'app', 'routes', 'communication.py')

NEW_CODE = '''

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

        details = '\\n'.join(inst_lines)
        student_name = f"{student.first_name} {student.last_name or ''}".strip()

        subject = f"Fee Reminder - {student_name}"
        message = (
            f"Dear Parent,\\n\\n"
            f"This is a reminder about pending fees for {student_name}.\\n\\n"
            f"Total Pending: Rs.{total_pending:,.0f}\\n"
            + (f"{overdue_count} installment(s) are OVERDUE!\\n" if overdue_count > 0 else "")
            + f"\\nDetails:\\n{details}\\n\\n"
            f"Please make the payment at the earliest.\\n"
            f"You can pay online through the Parent Portal.\\n\\n"
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
            f"Dear Parent,\\n\\n"
            f"We have received a fee payment for {student_name}.\\n\\n"
            f"Amount: Rs.{amount:,.0f}\\n"
            f"Payment Mode: {mode}\\n"
            f"Receipt No: {receipt}\\n"
            f"Date: {pay_date}\\n\\n"
            f"Thank you for the timely payment.\\n"
        )

        for contact in contacts:
            _send_to_parent(school_id, 'payment_received', channels, contact, student, subject, message)

        db.session.commit()
    except Exception:
        pass

'''

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# Check if already patched
if 'trigger_fee_reminder' in content:
    print("Already patched - fee reminder exists")
else:
    # Insert before the API Config Status section
    marker = content.rfind('\n# ')
    # Find the last section header comment
    api_config_idx = content.find('API Config Status')
    if api_config_idx > 0:
        # Go back to start of that line
        line_start = content.rfind('\n', 0, api_config_idx)
        # Go back one more line (the blank line before)
        line_start = content.rfind('\n', 0, line_start)
        new_content = content[:line_start] + NEW_CODE + content[line_start:]
    else:
        # Append at end
        new_content = content + NEW_CODE

    with open(FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully patched communication.py with fee reminder + payment notification!")
