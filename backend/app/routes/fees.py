from flask import Blueprint, request, g
from app import db
from app.models.fee import (
    FeeCategory, FeeStructure, FeePayment, FeeDiscount,
    FeeInstallment, FeeReceipt, Scholarship, ScholarshipAward,
    Concession, Expense, Vendor, PurchaseOrder, Budget,
    AccountingEntry, BankReconciliation, FeeRefund
)
from app.models.student import Student, Class
from app.utils.decorators import school_required, role_required
from app.utils.helpers import success_response, error_response, paginate
from sqlalchemy import func, extract
from sqlalchemy.orm import joinedload
from datetime import datetime, date

fees_bp = Blueprint('fees', __name__)


# ──── Financial Dashboard ────
@fees_bp.route('/dashboard', methods=['GET'])
@school_required
def finance_dashboard():
    sid = g.school_id
    today = date.today()

    total_collected = db.session.query(func.coalesce(func.sum(FeePayment.amount_paid), 0)).filter_by(
        school_id=sid, status='completed').scalar()

    # Calculate total pending efficiently - single query instead of loop
    struct_totals = db.session.query(
        FeeStructure.id,
        FeeStructure.amount,
        FeeStructure.class_id
    ).filter_by(school_id=sid, is_active=True).all()

    # Batch: get student counts per class
    class_ids = list(set(s.class_id for s in struct_totals))
    class_student_counts = {}
    if class_ids:
        counts = db.session.query(
            Student.current_class_id,
            func.count(Student.id)
        ).filter(
            Student.school_id == sid,
            Student.status == 'active',
            Student.current_class_id.in_(class_ids)
        ).group_by(Student.current_class_id).all()
        class_student_counts = dict(counts)

    # Batch: get paid amounts per structure
    struct_ids = [s.id for s in struct_totals]
    struct_paid = {}
    if struct_ids:
        paid_data = db.session.query(
            FeePayment.fee_structure_id,
            func.coalesce(func.sum(FeePayment.amount_paid), 0)
        ).filter(
            FeePayment.fee_structure_id.in_(struct_ids),
            FeePayment.status == 'completed'
        ).group_by(FeePayment.fee_structure_id).all()
        struct_paid = dict(paid_data)

    total_pending = 0
    for s in struct_totals:
        student_count = class_student_counts.get(s.class_id, 0)
        paid = float(struct_paid.get(s.id, 0))
        total_pending += max(0, float(s.amount) * student_count - paid)

    total_expenses = db.session.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.school_id == sid, Expense.status.in_(['approved', 'paid'])).scalar()

    monthly_collection = db.session.query(func.coalesce(func.sum(FeePayment.amount_paid), 0)).filter(
        FeePayment.school_id == sid, FeePayment.status == 'completed',
        extract('month', FeePayment.payment_date) == today.month,
        extract('year', FeePayment.payment_date) == today.year).scalar()

    defaulter_count = 0
    overdue_inst = FeeInstallment.query.filter(
        FeeInstallment.school_id == sid,
        FeeInstallment.status.in_(['pending', 'overdue']),
        FeeInstallment.due_date < today).count()
    defaulter_count = overdue_inst

    pending_concessions = Concession.query.filter_by(school_id=sid, status='pending').count()
    pending_refunds = FeeRefund.query.filter_by(school_id=sid, status='requested').count()
    active_scholarships = ScholarshipAward.query.filter_by(school_id=sid, status='active').count()

    # Category-wise collection
    cat_data = db.session.query(
        FeeCategory.name,
        func.coalesce(func.sum(FeePayment.amount_paid), 0)
    ).join(FeeStructure, FeeStructure.fee_category_id == FeeCategory.id
    ).join(FeePayment, FeePayment.fee_structure_id == FeeStructure.id
    ).filter(FeePayment.school_id == sid, FeePayment.status == 'completed'
    ).group_by(FeeCategory.name).all()

    return success_response({
        'total_collected': float(total_collected),
        'total_pending': round(total_pending, 2),
        'total_expenses': float(total_expenses),
        'net_income': round(float(total_collected) - float(total_expenses), 2),
        'monthly_collection': float(monthly_collection),
        'defaulter_count': defaulter_count,
        'pending_concessions': pending_concessions,
        'pending_refunds': pending_refunds,
        'active_scholarships': active_scholarships,
        'category_wise': [{'category': c, 'amount': float(a)} for c, a in cat_data]
    })


# ──── Fee Categories ────
@fees_bp.route('/categories', methods=['GET'])
@school_required
def list_categories():
    cats = FeeCategory.query.filter_by(school_id=g.school_id).all()
    return success_response([c.to_dict() for c in cats])


@fees_bp.route('/categories', methods=['POST'])
@role_required('school_admin', 'accountant')
def create_category():
    data = request.get_json()
    cat = FeeCategory(school_id=g.school_id, name=data['name'], description=data.get('description'))
    db.session.add(cat)
    db.session.commit()
    return success_response(cat.to_dict(), 'Category created', 201)


# ──── Fee Structure ────
@fees_bp.route('/structures', methods=['GET'])
@school_required
def list_structures():
    query = FeeStructure.query.options(
        joinedload(FeeStructure.category),
        joinedload(FeeStructure.class_ref)
    ).filter_by(school_id=g.school_id)
    class_id = request.args.get('class_id', type=int)
    if class_id:
        query = query.filter_by(class_id=class_id)
    active = request.args.get('active')
    if active:
        query = query.filter_by(is_active=active == 'true')
    return success_response(paginate(query))


@fees_bp.route('/structures', methods=['POST'])
@role_required('school_admin', 'accountant')
def create_structure():
    data = request.get_json()
    structure = FeeStructure(
        school_id=g.school_id,
        academic_year_id=data.get('academic_year_id'),
        class_id=data['class_id'],
        fee_category_id=data['fee_category_id'],
        amount=data['amount'],
        due_date=data.get('due_date'),
        frequency=data.get('frequency', 'yearly'),
        late_fee_amount=data.get('late_fee_amount', 0),
        late_fee_type=data.get('late_fee_type', 'fixed'),
        grace_period_days=data.get('grace_period_days', 0)
    )
    db.session.add(structure)
    db.session.commit()
    return success_response(structure.to_dict(), 'Fee structure created', 201)


@fees_bp.route('/structures/<int:sid>', methods=['PUT'])
@role_required('school_admin', 'accountant')
def update_structure(sid):
    s = FeeStructure.query.filter_by(id=sid, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for f in ['amount', 'due_date', 'frequency', 'late_fee_amount', 'late_fee_type', 'grace_period_days', 'is_active']:
        if f in data:
            setattr(s, f, data[f])
    db.session.commit()
    return success_response(s.to_dict(), 'Updated')


# ──── Fee Installments ────
@fees_bp.route('/installments', methods=['GET'])
@school_required
def list_installments():
    query = FeeInstallment.query.options(
        joinedload(FeeInstallment.student)
    ).filter_by(school_id=g.school_id)
    student_id = request.args.get('student_id', type=int)
    if student_id:
        query = query.filter_by(student_id=student_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(FeeInstallment.due_date)
    return success_response(paginate(query))


@fees_bp.route('/installments/generate', methods=['POST'])
@role_required('school_admin', 'accountant')
def generate_installments():
    data = request.get_json()
    struct_id = data['fee_structure_id']
    class_id = data.get('class_id')
    num_installments = data.get('installments', 1)
    dates = data.get('due_dates', [])

    struct = FeeStructure.query.filter_by(id=struct_id, school_id=g.school_id).first_or_404()
    students = Student.query.filter_by(school_id=g.school_id, current_class_id=class_id or struct.class_id, status='active').all()

    per_inst = round(float(struct.amount) / num_installments, 2)
    count = 0
    for st in students:
        for i in range(num_installments):
            due = dates[i] if i < len(dates) else None
            inst = FeeInstallment(
                school_id=g.school_id, student_id=st.id,
                fee_structure_id=struct_id, installment_no=i + 1,
                amount=per_inst, due_date=due or date.today().isoformat()
            )
            db.session.add(inst)
            count += 1
    db.session.commit()
    return success_response({'generated': count}, f'{count} installments created')


# ──── Payments ────
@fees_bp.route('/payments', methods=['GET'])
@school_required
def list_payments():
    query = FeePayment.query.options(
        joinedload(FeePayment.student)
    ).filter_by(school_id=g.school_id)
    student_id = request.args.get('student_id', type=int)
    if student_id:
        query = query.filter_by(student_id=student_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    mode = request.args.get('payment_mode')
    if mode:
        query = query.filter_by(payment_mode=mode)
    query = query.order_by(FeePayment.created_at.desc())
    return success_response(paginate(query))


@fees_bp.route('/payments', methods=['POST'])
@role_required('school_admin', 'accountant')
def record_payment():
    data = request.get_json()
    amount = float(data['amount_paid'])
    late = float(data.get('late_fee_paid', 0))
    disc = float(data.get('discount_amount', 0))

    payment = FeePayment(
        school_id=g.school_id,
        student_id=data['student_id'],
        fee_structure_id=data['fee_structure_id'],
        installment_id=data.get('installment_id'),
        amount_paid=amount,
        late_fee_paid=late,
        discount_amount=disc,
        total_amount=amount + late - disc,
        payment_date=data.get('payment_date', date.today().isoformat()),
        payment_mode=data['payment_mode'],
        transaction_id=data.get('transaction_id'),
        cheque_no=data.get('cheque_no'),
        cheque_date=data.get('cheque_date'),
        bank_name=data.get('bank_name'),
        cheque_status='pending' if data.get('payment_mode') == 'cheque' else None,
        receipt_no=data.get('receipt_no'),
        status=data.get('status', 'completed'),
        remarks=data.get('remarks'),
        collected_by=g.current_user.id
    )
    db.session.add(payment)

    # Update installment if linked
    if data.get('installment_id'):
        inst = FeeInstallment.query.get(data['installment_id'])
        if inst:
            inst.paid_amount = float(inst.paid_amount or 0) + amount
            inst.late_fee = late
            inst.paid_date = date.today()
            if float(inst.paid_amount) >= float(inst.amount):
                inst.status = 'paid'
            else:
                inst.status = 'partial'

    # Auto accounting entry
    entry = AccountingEntry(
        school_id=g.school_id, entry_date=date.today(),
        entry_type='income', account_head='Fee Collection',
        description=f'Fee payment from student #{data["student_id"]}',
        credit=amount + late - disc,
        reference_type='fee_payment', created_by=g.current_user.id
    )
    db.session.add(entry)
    db.session.commit()

    # Auto generate receipt
    receipt_no = f"RCP-{payment.id:06d}"
    payment.receipt_no = receipt_no
    receipt = FeeReceipt(
        school_id=g.school_id, payment_id=payment.id,
        receipt_no=receipt_no, receipt_date=date.today(),
        student_id=data['student_id'], amount=payment.total_amount
    )
    db.session.add(receipt)
    db.session.commit()

    # Notify parent about payment
    try:
        from app.routes.communication import notify_payment_received
        notify_payment_received(g.school_id, payment)
    except Exception:
        pass

    return success_response(payment.to_dict(), 'Payment recorded', 201)


# ──── Fee Defaulters ────
@fees_bp.route('/defaulters', methods=['GET'])
@school_required
def list_defaulters():
    sid = g.school_id
    class_id = request.args.get('class_id', type=int)
    today = date.today()

    query = FeeInstallment.query.filter(
        FeeInstallment.school_id == sid,
        FeeInstallment.status.in_(['pending', 'overdue', 'partial']),
        FeeInstallment.due_date < today
    )
    if class_id:
        query = query.join(Student).filter(Student.class_id == class_id)

    overdue = query.all()
    # Mark as overdue
    for o in overdue:
        if o.status == 'pending':
            o.status = 'overdue'
    db.session.commit()

    defaulters = {}
    for inst in overdue:
        sid_key = inst.student_id
        if sid_key not in defaulters:
            s = inst.student
            defaulters[sid_key] = {
                'student_id': s.id,
                'student_name': f"{s.first_name} {s.last_name or ''}".strip(),
                'class_name': s.class_ref.name if s.class_ref else '',
                'total_due': 0, 'installments': []
            }
        bal = float(inst.amount) - float(inst.paid_amount or 0)
        defaulters[sid_key]['total_due'] += bal
        defaulters[sid_key]['installments'].append(inst.to_dict())

    result = sorted(defaulters.values(), key=lambda x: x['total_due'], reverse=True)
    return success_response(result)


# ──── Pending Dues (legacy) ────
@fees_bp.route('/pending', methods=['GET'])
@school_required
def get_pending_dues():
    class_id = request.args.get('class_id', type=int)
    structure_query = FeeStructure.query.filter_by(school_id=g.school_id)
    if class_id:
        structure_query = structure_query.filter_by(class_id=class_id)

    structures = structure_query.all()
    pending = []
    for s in structures:
        total = float(s.amount)
        paid = db.session.query(func.coalesce(func.sum(FeePayment.amount_paid), 0)).filter_by(
            fee_structure_id=s.id, status='completed').scalar()
        if float(paid) < total:
            pending.append({
                'fee_structure': s.to_dict(),
                'total_amount': total,
                'paid_amount': float(paid),
                'pending_amount': total - float(paid)
            })
    return success_response(pending)


# ──── Receipts ────
@fees_bp.route('/receipts', methods=['GET'])
@school_required
def list_receipts():
    query = FeeReceipt.query.filter_by(school_id=g.school_id)
    student_id = request.args.get('student_id', type=int)
    if student_id:
        query = query.filter_by(student_id=student_id)
    query = query.order_by(FeeReceipt.created_at.desc())
    return success_response(paginate(query))


@fees_bp.route('/receipts/<int:rid>', methods=['GET'])
@school_required
def get_receipt(rid):
    r = FeeReceipt.query.filter_by(id=rid, school_id=g.school_id).first_or_404()
    data = r.to_dict()
    if r.payment:
        data['payment'] = r.payment.to_dict()
    return success_response(data)


# ──── Scholarships ────
@fees_bp.route('/scholarships', methods=['GET'])
@school_required
def list_scholarships():
    query = Scholarship.query.filter_by(school_id=g.school_id)
    return success_response([s.to_dict() for s in query.all()])


@fees_bp.route('/scholarships', methods=['POST'])
@role_required('school_admin')
def create_scholarship():
    data = request.get_json()
    s = Scholarship(
        school_id=g.school_id, name=data['name'],
        scholarship_type=data.get('scholarship_type', 'merit'),
        discount_type=data.get('discount_type', 'percentage'),
        discount_value=data['discount_value'],
        eligibility_criteria=data.get('eligibility_criteria'),
        max_recipients=data.get('max_recipients'),
        academic_year_id=data.get('academic_year_id')
    )
    db.session.add(s)
    db.session.commit()
    return success_response(s.to_dict(), 'Scholarship created', 201)


@fees_bp.route('/scholarships/<int:sid>/award', methods=['POST'])
@role_required('school_admin')
def award_scholarship(sid):
    schol = Scholarship.query.filter_by(id=sid, school_id=g.school_id).first_or_404()
    data = request.get_json()

    if schol.discount_type == 'percentage':
        # Calculate from a base - caller provides amount or we use percentage
        amount = float(data.get('amount', schol.discount_value))
    else:
        amount = float(schol.discount_value)

    award = ScholarshipAward(
        school_id=g.school_id, scholarship_id=sid,
        student_id=data['student_id'], amount=amount,
        status='pending', remarks=data.get('remarks')
    )
    db.session.add(award)
    db.session.commit()
    return success_response(award.to_dict(), 'Scholarship awarded', 201)


@fees_bp.route('/scholarship-awards', methods=['GET'])
@school_required
def list_awards():
    query = ScholarshipAward.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    return success_response([a.to_dict() for a in query.all()])


@fees_bp.route('/scholarship-awards/<int:aid>', methods=['PUT'])
@role_required('school_admin')
def update_award(aid):
    a = ScholarshipAward.query.filter_by(id=aid, school_id=g.school_id).first_or_404()
    data = request.get_json()
    if 'status' in data:
        a.status = data['status']
        if data['status'] == 'approved':
            a.approved_by = g.current_user.id
            a.approved_at = datetime.utcnow()
    if 'remarks' in data:
        a.remarks = data['remarks']
    db.session.commit()
    return success_response(a.to_dict(), 'Updated')


# ──── Concessions ────
@fees_bp.route('/concessions', methods=['GET'])
@school_required
def list_concessions():
    query = Concession.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(Concession.created_at.desc())
    return success_response([c.to_dict() for c in query.all()])


@fees_bp.route('/concessions', methods=['POST'])
@school_required
def request_concession():
    data = request.get_json()
    c = Concession(
        school_id=g.school_id, student_id=data['student_id'],
        fee_category_id=data.get('fee_category_id'),
        concession_type=data.get('concession_type', 'fixed'),
        amount=data['amount'], reason=data.get('reason'),
        requested_by=g.current_user.id
    )
    db.session.add(c)
    db.session.commit()
    return success_response(c.to_dict(), 'Concession requested', 201)


@fees_bp.route('/concessions/<int:cid>/approve', methods=['PUT'])
@role_required('school_admin')
def approve_concession(cid):
    c = Concession.query.filter_by(id=cid, school_id=g.school_id).first_or_404()
    data = request.get_json()
    action = data.get('action', 'approved')
    if action == 'reviewed':
        c.status = 'reviewed'
        c.reviewed_by = g.current_user.id
    elif action == 'approved':
        c.status = 'approved'
        c.approved_by = g.current_user.id
    else:
        c.status = 'rejected'
    c.updated_at = datetime.utcnow()
    db.session.commit()
    return success_response(c.to_dict(), f'Concession {c.status}')


# ──── Refunds ────
@fees_bp.route('/refunds', methods=['GET'])
@school_required
def list_refunds():
    query = FeeRefund.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    return success_response([r.to_dict() for r in query.order_by(FeeRefund.created_at.desc()).all()])


@fees_bp.route('/refunds', methods=['POST'])
@role_required('school_admin', 'accountant')
def request_refund():
    data = request.get_json()
    r = FeeRefund(
        school_id=g.school_id, student_id=data['student_id'],
        payment_id=data.get('payment_id'),
        refund_amount=data['refund_amount'],
        reason=data.get('reason'),
        refund_mode=data.get('refund_mode', 'bank_transfer'),
        requested_by=g.current_user.id
    )
    db.session.add(r)
    db.session.commit()
    return success_response(r.to_dict(), 'Refund requested', 201)


@fees_bp.route('/refunds/<int:rid>', methods=['PUT'])
@role_required('school_admin')
def update_refund(rid):
    r = FeeRefund.query.filter_by(id=rid, school_id=g.school_id).first_or_404()
    data = request.get_json()
    if 'status' in data:
        r.status = data['status']
        if data['status'] == 'approved':
            r.approved_by = g.current_user.id
        elif data['status'] == 'processed':
            r.processed_date = date.today()
            r.reference_no = data.get('reference_no')
            # Accounting entry for refund
            entry = AccountingEntry(
                school_id=g.school_id, entry_date=date.today(),
                entry_type='expense', account_head='Fee Refund',
                description=f'Refund to student #{r.student_id}',
                debit=r.refund_amount, reference_type='fee_refund',
                reference_id=r.id, created_by=g.current_user.id
            )
            db.session.add(entry)
    db.session.commit()
    return success_response(r.to_dict(), 'Refund updated')


# ──── Discounts ────
@fees_bp.route('/discounts', methods=['GET'])
@school_required
def list_discounts():
    query = FeeDiscount.query.filter_by(school_id=g.school_id)
    student_id = request.args.get('student_id', type=int)
    if student_id:
        query = query.filter_by(student_id=student_id)
    return success_response([d.to_dict() for d in query.all()])


@fees_bp.route('/discounts', methods=['POST'])
@role_required('school_admin')
def add_discount():
    data = request.get_json()
    discount = FeeDiscount(
        school_id=g.school_id,
        student_id=data['student_id'],
        fee_category_id=data['fee_category_id'],
        discount_type=data['discount_type'],
        discount_value=data['discount_value'],
        reason=data.get('reason'),
        approved_by=g.current_user.id
    )
    db.session.add(discount)
    db.session.commit()
    return success_response(discount.to_dict(), 'Discount added', 201)


# ──── Expenses ────
@fees_bp.route('/expenses', methods=['GET'])
@school_required
def list_expenses():
    query = Expense.query.filter_by(school_id=g.school_id)
    category = request.args.get('category')
    if category:
        query = query.filter_by(expense_category=category)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    dept = request.args.get('department')
    if dept:
        query = query.filter_by(department=dept)
    query = query.order_by(Expense.expense_date.desc())
    return success_response(paginate(query))


@fees_bp.route('/expenses', methods=['POST'])
@role_required('school_admin', 'accountant')
def create_expense():
    data = request.get_json()
    e = Expense(
        school_id=g.school_id,
        expense_category=data['expense_category'],
        description=data.get('description'),
        amount=data['amount'],
        expense_date=data.get('expense_date', date.today().isoformat()),
        vendor_id=data.get('vendor_id'),
        payment_mode=data.get('payment_mode', 'cash'),
        reference_no=data.get('reference_no'),
        invoice_no=data.get('invoice_no'),
        department=data.get('department'),
        budget_head_id=data.get('budget_head_id'),
        receipt_url=data.get('receipt_url'),
        status=data.get('status', 'pending'),
        created_by=g.current_user.id
    )
    db.session.add(e)
    db.session.commit()
    return success_response(e.to_dict(), 'Expense recorded', 201)


@fees_bp.route('/expenses/<int:eid>', methods=['PUT'])
@role_required('school_admin', 'accountant')
def update_expense(eid):
    e = Expense.query.filter_by(id=eid, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for f in ['expense_category', 'description', 'amount', 'expense_date', 'vendor_id',
              'payment_mode', 'reference_no', 'invoice_no', 'department', 'receipt_url', 'status']:
        if f in data:
            setattr(e, f, data[f])
    if data.get('status') == 'approved':
        e.approved_by = g.current_user.id
        # Auto accounting entry
        entry = AccountingEntry(
            school_id=g.school_id, entry_date=date.today(),
            entry_type='expense', account_head=e.expense_category,
            description=e.description, debit=e.amount,
            reference_type='expense', reference_id=e.id,
            created_by=g.current_user.id
        )
        db.session.add(entry)
        # Update budget spent if linked
        if e.budget_head_id:
            budget = Budget.query.get(e.budget_head_id)
            if budget:
                budget.spent_amount = float(budget.spent_amount or 0) + float(e.amount)
    db.session.commit()
    return success_response(e.to_dict(), 'Expense updated')


# ──── Vendors ────
@fees_bp.route('/vendors', methods=['GET'])
@school_required
def list_vendors():
    query = Vendor.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    return success_response([v.to_dict() for v in query.all()])


@fees_bp.route('/vendors', methods=['POST'])
@role_required('school_admin', 'accountant')
def create_vendor():
    data = request.get_json()
    v = Vendor(school_id=g.school_id, **{k: data.get(k) for k in [
        'name', 'contact_person', 'phone', 'email', 'address',
        'gst_no', 'pan_no', 'bank_name', 'account_no', 'ifsc_code', 'category'
    ] if data.get(k)})
    db.session.add(v)
    db.session.commit()
    return success_response(v.to_dict(), 'Vendor created', 201)


@fees_bp.route('/vendors/<int:vid>', methods=['PUT'])
@role_required('school_admin', 'accountant')
def update_vendor(vid):
    v = Vendor.query.filter_by(id=vid, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for f in ['name', 'contact_person', 'phone', 'email', 'address',
              'gst_no', 'pan_no', 'bank_name', 'account_no', 'ifsc_code', 'category', 'status']:
        if f in data:
            setattr(v, f, data[f])
    db.session.commit()
    return success_response(v.to_dict(), 'Vendor updated')


# ──── Purchase Orders ────
@fees_bp.route('/purchase-orders', methods=['GET'])
@school_required
def list_pos():
    query = PurchaseOrder.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(PurchaseOrder.created_at.desc())
    return success_response(paginate(query))


@fees_bp.route('/purchase-orders', methods=['POST'])
@role_required('school_admin', 'accountant')
def create_po():
    data = request.get_json()
    total = float(data['total_amount'])
    gst = float(data.get('gst_amount', 0))
    po = PurchaseOrder(
        school_id=g.school_id,
        po_number=data.get('po_number', f"PO-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"),
        vendor_id=data['vendor_id'],
        order_date=data.get('order_date', date.today().isoformat()),
        delivery_date=data.get('delivery_date'),
        items_description=data.get('items_description'),
        total_amount=total, gst_amount=gst,
        grand_total=total + gst,
        remarks=data.get('remarks'),
        created_by=g.current_user.id
    )
    db.session.add(po)
    db.session.commit()
    return success_response(po.to_dict(), 'PO created', 201)


@fees_bp.route('/purchase-orders/<int:pid>', methods=['PUT'])
@role_required('school_admin', 'accountant')
def update_po(pid):
    po = PurchaseOrder.query.filter_by(id=pid, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for f in ['status', 'delivery_date', 'remarks', 'items_description']:
        if f in data:
            setattr(po, f, data[f])
    db.session.commit()
    return success_response(po.to_dict(), 'PO updated')


# ──── Budgets ────
@fees_bp.route('/budgets', methods=['GET'])
@school_required
def list_budgets():
    query = Budget.query.filter_by(school_id=g.school_id)
    dept = request.args.get('department')
    if dept:
        query = query.filter_by(department=dept)
    return success_response([b.to_dict() for b in query.all()])


@fees_bp.route('/budgets', methods=['POST'])
@role_required('school_admin')
def create_budget():
    data = request.get_json()
    b = Budget(
        school_id=g.school_id,
        academic_year_id=data.get('academic_year_id'),
        department=data['department'],
        budget_head=data['budget_head'],
        allocated_amount=data['allocated_amount'],
        remarks=data.get('remarks')
    )
    db.session.add(b)
    db.session.commit()
    return success_response(b.to_dict(), 'Budget created', 201)


@fees_bp.route('/budgets/<int:bid>', methods=['PUT'])
@role_required('school_admin')
def update_budget(bid):
    b = Budget.query.filter_by(id=bid, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for f in ['allocated_amount', 'status', 'remarks']:
        if f in data:
            setattr(b, f, data[f])
    if data.get('status') == 'approved':
        b.approved_by = g.current_user.id
    db.session.commit()
    return success_response(b.to_dict(), 'Budget updated')


# ──── Accounting / Ledger ────
@fees_bp.route('/accounting', methods=['GET'])
@school_required
def list_entries():
    query = AccountingEntry.query.filter_by(school_id=g.school_id)
    entry_type = request.args.get('entry_type')
    if entry_type:
        query = query.filter_by(entry_type=entry_type)
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')
    if from_date:
        query = query.filter(AccountingEntry.entry_date >= from_date)
    if to_date:
        query = query.filter(AccountingEntry.entry_date <= to_date)
    account = request.args.get('account_head')
    if account:
        query = query.filter_by(account_head=account)
    query = query.order_by(AccountingEntry.entry_date.desc())
    return success_response(paginate(query))


@fees_bp.route('/accounting', methods=['POST'])
@role_required('school_admin', 'accountant')
def create_entry():
    data = request.get_json()
    e = AccountingEntry(
        school_id=g.school_id,
        entry_date=data.get('entry_date', date.today().isoformat()),
        entry_type=data['entry_type'],
        account_head=data['account_head'],
        description=data.get('description'),
        debit=data.get('debit', 0),
        credit=data.get('credit', 0),
        voucher_no=data.get('voucher_no'),
        narration=data.get('narration'),
        reference_type=data.get('reference_type'),
        reference_id=data.get('reference_id'),
        created_by=g.current_user.id
    )
    db.session.add(e)
    db.session.commit()
    return success_response(e.to_dict(), 'Entry created', 201)


# ──── Reports: P&L ────
@fees_bp.route('/reports/pnl', methods=['GET'])
@school_required
def pnl_report():
    sid = g.school_id
    from_date = request.args.get('from_date', f'{date.today().year}-04-01')
    to_date = request.args.get('to_date', date.today().isoformat())

    income = db.session.query(
        AccountingEntry.account_head,
        func.sum(AccountingEntry.credit)
    ).filter(
        AccountingEntry.school_id == sid,
        AccountingEntry.entry_type == 'income',
        AccountingEntry.entry_date.between(from_date, to_date)
    ).group_by(AccountingEntry.account_head).all()

    expenses = db.session.query(
        AccountingEntry.account_head,
        func.sum(AccountingEntry.debit)
    ).filter(
        AccountingEntry.school_id == sid,
        AccountingEntry.entry_type == 'expense',
        AccountingEntry.entry_date.between(from_date, to_date)
    ).group_by(AccountingEntry.account_head).all()

    total_income = sum(float(a or 0) for _, a in income)
    total_expenses = sum(float(a or 0) for _, a in expenses)

    return success_response({
        'period': {'from': from_date, 'to': to_date},
        'income': [{'head': h, 'amount': float(a)} for h, a in income],
        'expenses': [{'head': h, 'amount': float(a)} for h, a in expenses],
        'total_income': total_income,
        'total_expenses': total_expenses,
        'net_profit': total_income - total_expenses
    })


# ──── Reports: Balance Sheet ────
@fees_bp.route('/reports/balance-sheet', methods=['GET'])
@school_required
def balance_sheet():
    sid = g.school_id
    as_of = request.args.get('as_of', date.today().isoformat())

    total_debit = db.session.query(func.coalesce(func.sum(AccountingEntry.debit), 0)).filter(
        AccountingEntry.school_id == sid, AccountingEntry.entry_date <= as_of).scalar()
    total_credit = db.session.query(func.coalesce(func.sum(AccountingEntry.credit), 0)).filter(
        AccountingEntry.school_id == sid, AccountingEntry.entry_date <= as_of).scalar()

    # Group by account head
    heads = db.session.query(
        AccountingEntry.account_head,
        func.sum(AccountingEntry.debit),
        func.sum(AccountingEntry.credit)
    ).filter(
        AccountingEntry.school_id == sid,
        AccountingEntry.entry_date <= as_of
    ).group_by(AccountingEntry.account_head).all()

    return success_response({
        'as_of': as_of,
        'total_debit': float(total_debit),
        'total_credit': float(total_credit),
        'balance': float(total_credit) - float(total_debit),
        'accounts': [{'head': h, 'debit': float(d or 0), 'credit': float(c or 0),
                       'balance': float(c or 0) - float(d or 0)} for h, d, c in heads]
    })


# ──── Cheque Tracking ────
@fees_bp.route('/cheque-tracking', methods=['GET'])
@school_required
def cheque_tracking():
    query = FeePayment.query.filter(
        FeePayment.school_id == g.school_id,
        FeePayment.payment_mode.in_(['cheque', 'dd'])
    )
    status = request.args.get('cheque_status')
    if status:
        query = query.filter_by(cheque_status=status)
    query = query.order_by(FeePayment.created_at.desc())
    return success_response(paginate(query))


@fees_bp.route('/cheque-tracking/<int:pid>', methods=['PUT'])
@role_required('school_admin', 'accountant')
def update_cheque(pid):
    p = FeePayment.query.filter_by(id=pid, school_id=g.school_id).first_or_404()
    data = request.get_json()
    if 'cheque_status' in data:
        p.cheque_status = data['cheque_status']
        if data['cheque_status'] == 'bounced':
            p.status = 'failed'
        elif data['cheque_status'] == 'cleared':
            p.status = 'completed'
    db.session.commit()
    return success_response(p.to_dict(), 'Cheque status updated')


# ──── Bank Reconciliation ────
@fees_bp.route('/bank-reconciliation', methods=['GET'])
@school_required
def list_reconciliation():
    query = BankReconciliation.query.filter_by(school_id=g.school_id)
    reconciled = request.args.get('reconciled')
    if reconciled is not None:
        query = query.filter_by(is_reconciled=reconciled == 'true')
    query = query.order_by(BankReconciliation.statement_date.desc())
    return success_response(paginate(query))


@fees_bp.route('/bank-reconciliation', methods=['POST'])
@role_required('school_admin', 'accountant')
def add_reconciliation():
    data = request.get_json()
    r = BankReconciliation(
        school_id=g.school_id,
        bank_name=data['bank_name'],
        account_no=data.get('account_no'),
        statement_date=data['statement_date'],
        description=data.get('description'),
        debit=data.get('debit', 0),
        credit=data.get('credit', 0),
        balance=data.get('balance')
    )
    db.session.add(r)
    db.session.commit()
    return success_response(r.to_dict(), 'Record added', 201)


@fees_bp.route('/bank-reconciliation/<int:rid>/match', methods=['PUT'])
@role_required('school_admin', 'accountant')
def match_reconciliation(rid):
    r = BankReconciliation.query.filter_by(id=rid, school_id=g.school_id).first_or_404()
    data = request.get_json()
    r.is_reconciled = True
    r.matched_entry_id = data.get('entry_id')
    r.reconciled_at = datetime.utcnow()
    db.session.commit()
    return success_response(r.to_dict(), 'Matched')
