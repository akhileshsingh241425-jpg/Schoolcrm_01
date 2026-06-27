from flask import Blueprint, request, current_app
from datetime import datetime, date
from werkzeug.security import generate_password_hash
import os
import uuid
from werkzeug.utils import secure_filename
from app import db
from app.models.school import School, SchoolFeature, Director
from app.models.subscription import SubscriptionPlan, SchoolSubscription, SubscriptionPayment, SubscriptionFeatureAddOn, ADDON_FEATURES_CATALOG
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from flask import send_file
from app.models.user import User, Role
from app.models.audit import AuditLog
from app.utils.decorators import super_admin_required
from app.utils.helpers import success_response, error_response, paginate, validate, clean_val

superadmin_bp = Blueprint('superadmin', __name__)


# ─── Dashboard Stats ───────────────────────────────────────────────
@superadmin_bp.route('/dashboard', methods=['GET'])
@super_admin_required
def dashboard():
    try:
        total_schools = School.query.count()
    except Exception:
        total_schools = 0

    try:
        active_schools = School.query.filter_by(is_active=True).count()
    except Exception:
        active_schools = 0

    try:
        total_students = db.session.execute(
            db.text("SELECT COUNT(*) FROM students")
        ).scalar() or 0
    except Exception:
        total_students = 0

    try:
        total_staff = db.session.execute(
            db.text("SELECT COUNT(*) FROM staff")
        ).scalar() or 0
    except Exception:
        total_staff = 0

    try:
        total_revenue = db.session.query(
            db.func.sum(SchoolSubscription.amount)
        ).filter_by(payment_status='paid').scalar() or 0
    except Exception:
        db.session.rollback()
        total_revenue = 0

    # Recent subscriptions
    try:
        recent_subs = SchoolSubscription.query.order_by(
            SchoolSubscription.created_at.desc()
        ).limit(10).all()
    except Exception:
        db.session.rollback()
        recent_subs = []

    # Plan-wise breakdown
    try:
        plan_breakdown = db.session.query(
            School.plan, db.func.count(School.id)
        ).group_by(School.plan).all()
    except Exception:
        db.session.rollback()
        plan_breakdown = []

    return success_response({
        'total_schools': total_schools,
        'active_schools': active_schools,
        'inactive_schools': total_schools - active_schools,
        'total_students': total_students,
        'total_staff': total_staff,
        'total_revenue': float(total_revenue),
        'plan_breakdown': {p: c for p, c in plan_breakdown} if plan_breakdown else {},
        'recent_subscriptions': [s.to_dict() for s in recent_subs],
    })


# ─── Notifications ──────────────────────────────────────────────────
@superadmin_bp.route('/notifications', methods=['GET'])
@super_admin_required
def get_notifications():
    """Get platform notifications for super admin (recent audit logs)"""
    limit = request.args.get('limit', 10, type=int)

    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    unread_count = AuditLog.query.filter(
        AuditLog.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0)
    ).count()

    notifications = []
    for log in logs:
        user = User.query.get(log.user_id) if log.user_id else None
        notifications.append({
            'id': log.id,
            'title': log.action.replace('_', ' ').title(),
            'message': f"{log.module or 'System'} | {user.first_name + ' ' + (user.last_name or '') if user else 'System'}",
            'type': 'audit',
            'created_at': log.created_at.isoformat() if log.created_at else None,
            'read_at': None,
        })

    return success_response({
        'notifications': notifications,
        'unread_count': unread_count,
    })


# ─── Manage Schools ────────────────────────────────────────────────
@superadmin_bp.route('/schools', methods=['GET'])
@super_admin_required
def list_schools():
    query = School.query.order_by(School.created_at.desc())

    search = request.args.get('search')
    if search:
        query = query.filter(
            db.or_(School.name.ilike(f'%{search}%'), School.code.ilike(f'%{search}%'))
        )

    plan = request.args.get('plan')
    if plan:
        query = query.filter_by(plan=plan)

    status = request.args.get('status')
    if status == 'active':
        query = query.filter_by(is_active=True)
    elif status == 'inactive':
        query = query.filter_by(is_active=False)

    return success_response(paginate(query))


@superadmin_bp.route('/schools/<int:school_id>', methods=['GET'])
@super_admin_required
def get_school(school_id):
    school = School.query.get_or_404(school_id)
    data = school.to_dict()
    data['features'] = [f.to_dict() for f in school.features.all()]
    data['settings'] = [s.to_dict() for s in school.settings.all()]

    # Student/staff counts
    data['student_count'] = db.session.execute(
        db.text("SELECT COUNT(*) FROM students WHERE school_id = :sid"),
        {'sid': school_id}
    ).scalar() or 0
    data['staff_count'] = db.session.execute(
        db.text("SELECT COUNT(*) FROM staff WHERE school_id = :sid"),
        {'sid': school_id}
    ).scalar() or 0

    # Current subscription
    sub = SchoolSubscription.query.filter_by(
        school_id=school_id, payment_status='paid'
    ).order_by(SchoolSubscription.end_date.desc()).first()
    data['current_subscription'] = sub.to_dict() if sub else None

    return success_response(data)


@superadmin_bp.route('/schools/<int:school_id>', methods=['PUT'])
@super_admin_required
def update_school(school_id):
    school = School.query.get_or_404(school_id)
    data = request.get_json()

    updatable = ['name', 'short_name', 'email', 'phone', 'secondary_phone',
                 'alternate_contacts', 'address', 'city', 'state', 'pincode',
                 'logo_url', 'website', 'domain_name', 'theme_color', 'plan',
                 'session', 'is_active', 'max_students', 'max_staff', 'tagline',
                 'notes', 'custom_fields']

    for field in updatable:
        if field in data:
            val = data[field]
            if isinstance(val, str) and val.strip() == '':
                val = None
            if val == 'null':
                val = None
            setattr(school, field, val)

    db.session.commit()
    return success_response(school.to_dict(), 'School updated')


@superadmin_bp.route('/schools/<int:school_id>/toggle', methods=['POST'])
@super_admin_required
def toggle_school(school_id):
    school = School.query.get_or_404(school_id)
    school.is_active = not school.is_active
    db.session.commit()
    status = 'activated' if school.is_active else 'deactivated'
    return success_response(school.to_dict(), f'School {status}')


@superadmin_bp.route('/schools/<int:school_id>', methods=['DELETE'])
@super_admin_required
def delete_school(school_id):
    school = School.query.get_or_404(school_id)
    name = school.name
    try:
        # Disable FK checks to avoid ordering issues
        db.session.execute(db.text("SET FOREIGN_KEY_CHECKS = 0"))
        
        # Get all tables that have school_id column
        result = db.session.execute(db.text("""
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE COLUMN_NAME = 'school_id' 
            AND TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME != 'schools'
        """))
        tables = [row[0] for row in result]
        
        for table in tables:
            try:
                if table == 'users':
                    # Protect super_admin users - don't delete them, just unlink
                    db.session.execute(db.text("""
                        UPDATE `users` SET school_id = NULL 
                        WHERE school_id = :sid AND role_id = (SELECT id FROM roles WHERE name = 'super_admin')
                    """), {'sid': school_id})
                    # Delete non-super_admin users
                    db.session.execute(db.text("""
                        DELETE FROM `users` WHERE school_id = :sid
                    """), {'sid': school_id})
                else:
                    db.session.execute(db.text(f"DELETE FROM `{table}` WHERE school_id = :sid"), {'sid': school_id})
            except Exception:
                pass
        
        # Delete the school itself
        db.session.execute(db.text("DELETE FROM `schools` WHERE id = :sid"), {'sid': school_id})
        
        # Re-enable FK checks
        db.session.execute(db.text("SET FOREIGN_KEY_CHECKS = 1"))
        db.session.commit()
        return success_response(message=f'School "{name}" and all associated data deleted')
    except Exception as e:
        try:
            db.session.execute(db.text("SET FOREIGN_KEY_CHECKS = 1"))
        except Exception:
            pass
        db.session.rollback()
        return error_response(f'Failed to delete school: {str(e)}', 500)


@superadmin_bp.route('/schools/<int:school_id>/features', methods=['PUT'])
@super_admin_required
def update_features(school_id):
    School.query.get_or_404(school_id)
    data = request.get_json()
    features = data.get('features', {})

    for feature_name, enabled in features.items():
        feature = SchoolFeature.query.filter_by(
            school_id=school_id, feature_name=feature_name
        ).first()
        if feature:
            feature.is_enabled = enabled
        else:
            feature = SchoolFeature(
                school_id=school_id, feature_name=feature_name, is_enabled=enabled
            )
            db.session.add(feature)

    db.session.commit()
    return success_response(message='Features updated')


# ─── Subscription Plans ────────────────────────────────────────────
@superadmin_bp.route('/plans', methods=['GET'])
@super_admin_required
def list_plans():
    plans = SubscriptionPlan.query.all()
    return success_response([p.to_dict() for p in plans])


@superadmin_bp.route('/plans', methods=['POST'])
@super_admin_required
def create_plan():
    data = request.get_json()
    plan = SubscriptionPlan(
        name=data['name'],
        description=data.get('description'),
        monthly_price=data.get('monthly_price'),
        yearly_price=data.get('yearly_price'),
        max_students=data.get('max_students'),
        max_staff=data.get('max_staff'),
        features=data.get('features', []),
        is_active=data.get('is_active', True),
    )
    db.session.add(plan)
    db.session.commit()
    return success_response(plan.to_dict(), 'Plan created')


@superadmin_bp.route('/plans/<int:plan_id>', methods=['PUT'])
@super_admin_required
def update_plan(plan_id):
    plan = SubscriptionPlan.query.get_or_404(plan_id)
    data = request.get_json()
    for field in ['name', 'description', 'monthly_price', 'yearly_price',
                  'max_students', 'max_staff', 'features', 'is_active']:
        if field in data:
            setattr(plan, field, data[field])
    db.session.commit()
    return success_response(plan.to_dict(), 'Plan updated')


@superadmin_bp.route('/plans/<int:plan_id>', methods=['DELETE'])
@super_admin_required
def delete_plan(plan_id):
    plan = SubscriptionPlan.query.get_or_404(plan_id)
    plan.is_active = False
    db.session.commit()
    return success_response(message='Plan deactivated')


# ─── School Subscriptions ──────────────────────────────────────────
@superadmin_bp.route('/subscriptions', methods=['GET'])
@super_admin_required
def list_subscriptions():
    query = SchoolSubscription.query.order_by(SchoolSubscription.created_at.desc())

    school_id = request.args.get('school_id')
    if school_id:
        query = query.filter_by(school_id=school_id)

    status = request.args.get('status')
    if status:
        query = query.filter_by(payment_status=status)

    return success_response(paginate(query))


@superadmin_bp.route('/subscriptions', methods=['POST'])
@super_admin_required
def create_subscription():
    """Assign subscription to a school"""
    data = request.get_json()

    school = School.query.get_or_404(data['school_id'])
    plan = SubscriptionPlan.query.get_or_404(data['plan_id'])

    billing = data.get('billing_cycle', 'yearly')
    amount = float(plan.yearly_price) if billing == 'yearly' else float(plan.monthly_price)

    sub = SchoolSubscription(
        school_id=school.id,
        plan_id=plan.id,
        billing_cycle=billing,
        amount=data.get('amount', amount),
        start_date=data.get('start_date', date.today().isoformat()),
        end_date=data['end_date'],
        payment_status=data.get('payment_status', 'paid'),
    )
    db.session.add(sub)

    # Update school plan and limits
    school.plan = plan.name.lower()
    school.max_students = plan.max_students
    school.max_staff = plan.max_staff
    school.subscription_start = sub.start_date
    school.subscription_end = sub.end_date

    # Enable plan features
    for feature_name in (plan.features or []):
        feat = SchoolFeature.query.filter_by(
            school_id=school.id, feature_name=feature_name
        ).first()
        if feat:
            feat.is_enabled = True
        else:
            db.session.add(SchoolFeature(
                school_id=school.id, feature_name=feature_name, is_enabled=True
            ))

    db.session.commit()
    return success_response(sub.to_dict(), 'Subscription created')


@superadmin_bp.route('/subscriptions/<int:sub_id>', methods=['PUT'])
@super_admin_required
def update_subscription(sub_id):
    sub = SchoolSubscription.query.get_or_404(sub_id)
    data = request.get_json()
    for field in ['payment_status', 'end_date', 'amount']:
        if field in data:
            setattr(sub, field, data[field])
    db.session.commit()
    return success_response(sub.to_dict(), 'Subscription updated')


@superadmin_bp.route('/subscriptions/<int:sub_id>/payments', methods=['GET'])
@super_admin_required
def list_subscription_payments(sub_id):
    SchoolSubscription.query.get_or_404(sub_id)
    payments = SubscriptionPayment.query.filter_by(subscription_id=sub_id).order_by(SubscriptionPayment.created_at.desc()).all()
    return success_response([p.to_dict() for p in payments])


@superadmin_bp.route('/subscriptions/<int:sub_id>/payments', methods=['POST'])
@super_admin_required
def record_subscription_payment(sub_id):
    sub = SchoolSubscription.query.get_or_404(sub_id)
    data = request.get_json()
    if not data.get('amount') or not data.get('payment_mode'):
        return error_response('Amount and payment mode are required')
    last = SubscriptionPayment.query.filter_by(school_id=sub.school_id).order_by(SubscriptionPayment.id.desc()).first()
    next_no = 1
    if last and last.receipt_no and last.receipt_no.startswith('INV-'):
        try:
            next_no = int(last.receipt_no.split('-')[1]) + 1
        except (IndexError, ValueError):
            next_no = SubscriptionPayment.query.count() + 1
    receipt_no = f"INV-{next_no:06d}"
    payment = SubscriptionPayment(
        subscription_id=sub_id,
        school_id=sub.school_id,
        amount=data['amount'],
        payment_date=datetime.strptime(data['payment_date'], '%Y-%m-%d').date() if data.get('payment_date') else date.today(),
        payment_mode=data['payment_mode'],
        transaction_id=data.get('transaction_id'),
        receipt_no=receipt_no,
        status=data.get('status', 'completed'),
        notes=data.get('notes')
    )
    db.session.add(payment)
    if payment.status == 'completed':
        sub.payment_status = 'paid'
    db.session.commit()
    return success_response(payment.to_dict(), 'Payment recorded', 201)


@superadmin_bp.route('/subscriptions/payments/<int:payment_id>/invoice', methods=['GET'])
@super_admin_required
def download_subscription_invoice(payment_id):
    payment = SubscriptionPayment.query.get_or_404(payment_id)
    sub = SchoolSubscription.query.get_or_404(payment.subscription_id)
    school = School.query.get_or_404(payment.school_id)
    plan = SubscriptionPlan.query.get_or_404(sub.plan_id)

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=20*mm, bottomMargin=15*mm)
    styles = getSampleStyleSheet()
    elements = []

    # Colors
    primary = HexColor('#1a56db')
    light_gray = HexColor('#f3f4f6')

    # Title
    title_style = ParagraphStyle('Title2', parent=styles['Title'], fontSize=22, textColor=primary, spaceAfter=4*mm)
    elements.append(Paragraph('INVOICE', title_style))
    elements.append(Paragraph(f'Receipt No: {payment.receipt_no}', styles['Normal']))
    elements.append(Paragraph(f'Date: {payment.payment_date}', styles['Normal']))
    elements.append(Spacer(1, 8*mm))

    # Bill To
    bill_style = ParagraphStyle('BillTo', parent=styles['Normal'], fontSize=11, spaceAfter=2*mm)
    elements.append(Paragraph(f'<b>Bill To:</b>', bill_style))
    elements.append(Paragraph(f'{school.name}', bill_style))
    if school.address:
        elements.append(Paragraph(f'{school.address}', bill_style))
    if school.city:
        elements.append(Paragraph(f'{school.city}, {school.state or ""}', bill_style))
    elements.append(Spacer(1, 6*mm))

    # Plan Info
    plan_style = ParagraphStyle('PlanInfo', parent=styles['Normal'], fontSize=10)
    elements.append(Paragraph(f'<b>Plan:</b> {plan.name}', plan_style))
    elements.append(Paragraph(f'<b>Billing Cycle:</b> {sub.billing_cycle.title()}', plan_style))
    elements.append(Paragraph(f'<b>Period:</b> {sub.start_date} to {sub.end_date}', plan_style))
    elements.append(Spacer(1, 6*mm))

    # Amount Table
    t_data = [
        ['Description', 'Amount'],
        [f'{plan.name} Subscription ({sub.billing_cycle})', f'₹ {payment.amount:,.2f}'],
        ['', ''],
        ['Total', f'₹ {payment.amount:,.2f}']
    ]
    t = Table(t_data, colWidths=[120*mm, 50*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('BACKGROUND', (0, 1), (-1, 1), light_gray),
        ('FONTNAME', (0, 3), (-1, 3), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 3), (-1, 3), 12),
        ('LINEABOVE', (0, 3), (-1, 3), 1, primary),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -2), 0.5, HexColor('#d1d5db')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 6*mm))

    # Payment Info
    pay_style = ParagraphStyle('PayInfo', parent=styles['Normal'], fontSize=10)
    elements.append(Paragraph(f'<b>Payment Mode:</b> {payment.payment_mode.replace("_", " ").title()}', pay_style))
    if payment.transaction_id:
        elements.append(Paragraph(f'<b>Transaction ID:</b> {payment.transaction_id}', pay_style))
    elements.append(Paragraph(f'<b>Status:</b> {payment.status.title()}', pay_style))
    elements.append(Spacer(1, 20*mm))

    # Footer
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=HexColor('#6b7280'), alignment=1)
    elements.append(Paragraph('This is a computer-generated invoice.', footer_style))

    doc.build(elements)
    buf.seek(0)
    return send_file(buf, mimetype='application/pdf', as_attachment=True,
                     download_name=f'invoice_{payment.receipt_no}.pdf')


# ─── Public Plans (no auth) ────────────────────────────────────────
@superadmin_bp.route('/public/plans', methods=['GET'])
def public_plans():
    """Public endpoint for schools to see available plans"""
    plans = SubscriptionPlan.query.filter_by(is_active=True).all()
    return success_response([p.to_dict() for p in plans])


# ─── Add-on Features Catalog ────────────────────────────────────────────
@superadmin_bp.route('/addon-features-catalog', methods=['GET'])
@super_admin_required
def addon_features_catalog():
    """Return the catalog of available add-on features with pricing"""
    return success_response(ADDON_FEATURES_CATALOG)


# ─── Subscription Usage / Balance ────────────────────────────────────────
@superadmin_bp.route('/subscriptions/<int:sub_id>/usage', methods=['GET'])
@super_admin_required
def subscription_usage(sub_id):
    """Get subscription usage details — like mobile recharge balance view.
    Shows: plan details, total amount, paid amount, remaining balance,
    days remaining, student/staff usage vs limits, active add-ons."""
    sub = SchoolSubscription.query.get_or_404(sub_id)
    school = School.query.get_or_404(sub.school_id)
    plan = SubscriptionPlan.query.get_or_404(sub.plan_id)

    # Calculate payment totals
    total_paid = db.session.query(db.func.coalesce(db.func.sum(SubscriptionPayment.amount), 0)).filter(
        SubscriptionPayment.subscription_id == sub.id,
        SubscriptionPayment.status == 'completed'
    ).scalar()
    total_paid = float(total_paid or 0)

    base_amount = float(sub.amount or 0)
    addon_amount = float(sub.addon_amount or 0)
    total_amount = float(sub.total_amount or base_amount + addon_amount)
    balance_remaining = total_amount - total_paid

    # Days remaining
    days_remaining = 0
    if sub.end_date:
        days_remaining = max(0, (sub.end_date - date.today()).days)
    total_days = 0
    if sub.start_date and sub.end_date:
        total_days = (sub.end_date - sub.start_date).days
    days_used = total_days - days_remaining if total_days > 0 else 0

    # Student/staff usage vs limits
    from app.models.student import Student
    from app.models.staff import Staff
    current_students = Student.query.filter_by(school_id=school.id, status='active').count()
    current_staff = Staff.query.filter_by(school_id=school.id, status='active').count()
    max_students = plan.max_students or school.max_students or 0
    max_staff = plan.max_staff or school.max_staff or 0

    # Active add-ons
    addons = [a.to_dict() for a in SubscriptionFeatureAddOn.query.filter_by(
        subscription_id=sub.id, is_active=True
    ).all()]

    # Enabled features from plan + add-ons
    plan_features = plan.features or []
    addon_features = [a.feature_name for a in SubscriptionFeatureAddOn.query.filter_by(
        subscription_id=sub.id, is_active=True
    ).all()]
    all_features = list(set(plan_features + addon_features))

    # School enabled features
    enabled_features = school.get_enabled_features()

    return success_response({
        'subscription': sub.to_dict(),
        'school': {
            'id': school.id,
            'name': school.name,
            'code': school.code,
            'plan': school.plan,
            'is_active': school.is_active,
        },
        'plan': plan.to_dict(),
        'balance': {
            'base_amount': base_amount,
            'addon_amount': addon_amount,
            'total_amount': total_amount,
            'total_paid': total_paid,
            'balance_remaining': balance_remaining,
            'payment_status': sub.payment_status,
        },
        'time': {
            'start_date': sub.start_date.isoformat() if sub.start_date else None,
            'end_date': sub.end_date.isoformat() if sub.end_date else None,
            'total_days': total_days,
            'days_used': days_used,
            'days_remaining': days_remaining,
            'is_expired': days_remaining <= 0,
        },
        'usage': {
            'students': {'current': current_students, 'max': max_students,
                         'percentage': round(current_students / max_students * 100, 1) if max_students > 0 else 0},
            'staff': {'current': current_staff, 'max': max_staff,
                      'percentage': round(current_staff / max_staff * 100, 1) if max_staff > 0 else 0},
        },
        'features': {
            'plan_features': plan_features,
            'addon_features': addon_features,
            'all_features': all_features,
            'enabled_features': enabled_features,
        },
        'addons': addons,
    })


# ─── Recharge / Renew Subscription ──────────────────────────────────────
@superadmin_bp.route('/subscriptions/<int:sub_id>/recharge', methods=['POST'])
@super_admin_required
def recharge_subscription(sub_id):
    """Recharge/renew a subscription — like mobile recharge.
    Extends the end_date and records a payment."""
    sub = SchoolSubscription.query.get_or_404(sub_id)
    school = School.query.get_or_404(sub.school_id)
    data = request.get_json()

    # Required: amount, payment_mode
    if not data.get('amount') or not data.get('payment_mode'):
        return error_response('Amount and payment mode are required')

    amount = float(data['amount'])
    billing_cycle = data.get('billing_cycle', sub.billing_cycle)

    # Extend end_date
    new_end_date = None
    if data.get('new_end_date'):
        new_end_date = datetime.strptime(data['new_end_date'], '%Y-%m-%d').date()
    else:
        # Auto-extend: monthly → +30 days, yearly → +365 days from current end_date
        from datetime import timedelta
        base_date = sub.end_date if sub.end_date >= date.today() else date.today()
        if billing_cycle == 'monthly':
            new_end_date = base_date + timedelta(days=30)
        else:
            new_end_date = base_date + timedelta(days=365)

    # Update subscription
    sub.end_date = new_end_date
    sub.billing_cycle = billing_cycle
    sub.payment_status = data.get('payment_status', 'paid')
    if data.get('amount_override'):
        sub.amount = float(data['amount_override'])

    # Recalculate total_amount
    addon_sum = db.session.query(db.func.coalesce(db.func.sum(SubscriptionFeatureAddOn.price), 0)).filter(
        SubscriptionFeatureAddOn.subscription_id == sub.id,
        SubscriptionFeatureAddOn.is_active == True
    ).scalar()
    sub.addon_amount = addon_sum
    sub.total_amount = float(sub.amount or 0) + float(addon_sum or 0)

    # Update school subscription dates
    school.subscription_start = sub.start_date
    school.subscription_end = new_end_date

    # Record payment
    last = SubscriptionPayment.query.filter_by(school_id=sub.school_id).order_by(SubscriptionPayment.id.desc()).first()
    next_no = 1
    if last and last.receipt_no and last.receipt_no.startswith('INV-'):
        try:
            next_no = int(last.receipt_no.split('-')[1]) + 1
        except (IndexError, ValueError):
            next_no = SubscriptionPayment.query.count() + 1
    receipt_no = f"INV-{next_no:06d}"

    payment = SubscriptionPayment(
        subscription_id=sub.id,
        school_id=sub.school_id,
        amount=amount,
        payment_date=datetime.strptime(data['payment_date'], '%Y-%m-%d').date() if data.get('payment_date') else date.today(),
        payment_mode=data['payment_mode'],
        transaction_id=data.get('transaction_id'),
        receipt_no=receipt_no,
        status=data.get('status', 'completed'),
        notes=data.get('notes', 'Subscription recharge/renewal'),
        payment_type='recharge',
    )
    db.session.add(payment)
    db.session.commit()

    return success_response({
        'subscription': sub.to_dict(),
        'payment': payment.to_dict(),
        'message': f'Subscription recharged successfully. New end date: {new_end_date}'
    })


# ─── Add Feature Add-ons ────────────────────────────────────────────────
@superadmin_bp.route('/subscriptions/<int:sub_id>/addons', methods=['GET'])
@super_admin_required
def list_subscription_addons(sub_id):
    """List all add-ons for a subscription"""
    sub = SchoolSubscription.query.get_or_404(sub_id)
    addons = SubscriptionFeatureAddOn.query.filter_by(subscription_id=sub.id).all()
    return success_response([a.to_dict() for a in addons])


@superadmin_bp.route('/subscriptions/<int:sub_id>/addons', methods=['POST'])
@super_admin_required
def add_subscription_addon(sub_id):
    """Add a feature add-on to a subscription — increases price like mobile add-on packs.
    Also enables the feature in the school's feature list."""
    sub = SchoolSubscription.query.get_or_404(sub_id)
    school = School.query.get_or_404(sub.school_id)
    data = request.get_json()

    feature_name = data.get('feature_name')
    if not feature_name:
        return error_response('feature_name is required')

    # Check if add-on already exists and is active
    existing = SubscriptionFeatureAddOn.query.filter_by(
        subscription_id=sub.id, feature_name=feature_name, is_active=True
    ).first()
    if existing:
        return error_response(f'Feature "{feature_name}" is already an active add-on')

    # Find price from catalog
    catalog_item = next((c for c in ADDON_FEATURES_CATALOG if c['feature_name'] == feature_name), None)
    if not catalog_item:
        return error_response(f'Feature "{feature_name}" not found in add-on catalog')

    billing_cycle = data.get('billing_cycle', sub.billing_cycle)
    price = float(catalog_item['yearly_price'] if billing_cycle == 'yearly' else catalog_item['monthly_price'])

    # Allow custom price override
    if data.get('custom_price'):
        price = float(data['custom_price'])

    # Create add-on
    addon = SubscriptionFeatureAddOn(
        subscription_id=sub.id,
        school_id=sub.school_id,
        feature_name=feature_name,
        feature_label=catalog_item.get('label', feature_name),
        price=price,
        billing_cycle=billing_cycle,
        is_active=True,
    )
    db.session.add(addon)

    # Enable feature in school
    feat = SchoolFeature.query.filter_by(
        school_id=school.id, feature_name=feature_name
    ).first()
    if feat:
        feat.is_enabled = True
    else:
        db.session.add(SchoolFeature(
            school_id=school.id, feature_name=feature_name, is_enabled=True
        ))

    # Recalculate subscription totals
    addon_sum = db.session.query(db.func.coalesce(db.func.sum(SubscriptionFeatureAddOn.price), 0)).filter(
        SubscriptionFeatureAddOn.subscription_id == sub.id,
        SubscriptionFeatureAddOn.is_active == True
    ).scalar()
    sub.addon_amount = addon_sum
    sub.total_amount = float(sub.amount or 0) + float(addon_sum or 0)

    # Optionally record a payment for the add-on
    if data.get('record_payment', False):
        amount = price
        payment_mode = data.get('payment_mode', 'online')
        last = SubscriptionPayment.query.filter_by(school_id=sub.school_id).order_by(SubscriptionPayment.id.desc()).first()
        next_no = 1
        if last and last.receipt_no and last.receipt_no.startswith('INV-'):
            try:
                next_no = int(last.receipt_no.split('-')[1]) + 1
            except (IndexError, ValueError):
                next_no = SubscriptionPayment.query.count() + 1
        receipt_no = f"INV-{next_no:06d}"

        payment = SubscriptionPayment(
            subscription_id=sub.id,
            school_id=sub.school_id,
            amount=amount,
            payment_date=date.today(),
            payment_mode=payment_mode,
            transaction_id=data.get('transaction_id'),
            receipt_no=receipt_no,
            status='completed',
            notes=f'Add-on feature: {catalog_item.get("label", feature_name)}',
            payment_type='addon',
        )
        db.session.add(payment)

    db.session.commit()

    return success_response({
        'addon': addon.to_dict(),
        'subscription': sub.to_dict(),
        'message': f'Feature "{catalog_item.get("label", feature_name)}" added. New total: ₹{sub.total_amount:,.2f}'
    }, 'Add-on feature added')


@superadmin_bp.route('/subscriptions/<int:sub_id>/addons/<int:addon_id>', methods=['PUT'])
@super_admin_required
def update_subscription_addon(sub_id, addon_id):
    """Toggle add-on active/inactive or update price"""
    addon = SubscriptionFeatureAddOn.query.get_or_404(addon_id)
    if addon.subscription_id != sub_id:
        return error_response('Add-on does not belong to this subscription')

    sub = SchoolSubscription.query.get_or_404(sub_id)
    school = School.query.get_or_404(sub.school_id)
    data = request.get_json()

    if 'is_active' in data:
        addon.is_active = data['is_active']

        # Enable/disable feature in school accordingly
        feat = SchoolFeature.query.filter_by(
            school_id=school.id, feature_name=addon.feature_name
        ).first()
        if feat:
            feat.is_enabled = addon.is_active
        elif addon.is_active:
            db.session.add(SchoolFeature(
                school_id=school.id, feature_name=addon.feature_name, is_enabled=True
            ))

    if 'price' in data:
        addon.price = float(data['price'])

    # Recalculate subscription totals
    addon_sum = db.session.query(db.func.coalesce(db.func.sum(SubscriptionFeatureAddOn.price), 0)).filter(
        SubscriptionFeatureAddOn.subscription_id == sub.id,
        SubscriptionFeatureAddOn.is_active == True
    ).scalar()
    sub.addon_amount = addon_sum
    sub.total_amount = float(sub.amount or 0) + float(addon_sum or 0)

    db.session.commit()

    return success_response({
        'addon': addon.to_dict(),
        'subscription': sub.to_dict(),
    }, 'Add-on updated')


@superadmin_bp.route('/subscriptions/<int:sub_id>/addons/<int:addon_id>', methods=['DELETE'])
@super_admin_required
def remove_subscription_addon(sub_id, addon_id):
    """Remove an add-on feature — reduces price"""
    addon = SubscriptionFeatureAddOn.query.get_or_404(addon_id)
    if addon.subscription_id != sub_id:
        return error_response('Add-on does not belong to this subscription')

    sub = SchoolSubscription.query.get_or_404(sub_id)
    school = School.query.get_or_404(sub.school_id)

    # Disable feature in school
    feat = SchoolFeature.query.filter_by(
        school_id=school.id, feature_name=addon.feature_name
    ).first()
    if feat:
        feat.is_enabled = False

    db.session.delete(addon)

    # Recalculate subscription totals
    addon_sum = db.session.query(db.func.coalesce(db.func.sum(SubscriptionFeatureAddOn.price), 0)).filter(
        SubscriptionFeatureAddOn.subscription_id == sub.id,
        SubscriptionFeatureAddOn.is_active == True
    ).scalar()
    sub.addon_amount = addon_sum
    sub.total_amount = float(sub.amount or 0) + float(addon_sum or 0)

    db.session.commit()

    return success_response({
        'subscription': sub.to_dict(),
    }, 'Add-on removed and price adjusted')


# ─── School Usage Summary ────────────────────────────────────────────────
@superadmin_bp.route('/schools/<int:school_id>/usage-summary', methods=['GET'])
@super_admin_required
def school_usage_summary(school_id):
    """Get a school's complete usage summary — like checking mobile balance.
    Shows: subscription info, balance, usage, features, add-ons."""
    school = School.query.get_or_404(school_id)

    # Get latest active subscription
    sub = SchoolSubscription.query.filter_by(school_id=school_id).order_by(
        SchoolSubscription.id.desc()
    ).first()

    if not sub:
        return success_response({
            'school': {'id': school.id, 'name': school.name, 'code': school.code, 'plan': school.plan},
            'subscription': None,
            'message': 'No subscription found for this school'
        })

    # Redirect to the usage endpoint
    usage_data = subscription_usage(sub.id)
    return usage_data


# ─── Helper: allowed file types ─────────────────────────────────────────
ALLOWED_DOC_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'doc', 'docx'}

def allowed_doc_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_DOC_EXTENSIONS


# ─── Create School ───────────────────────────────────────────────────────
@superadmin_bp.route('/schools', methods=['POST'])
@super_admin_required
@validate({
    'name': {'required': True, 'message': 'School name is required'},
    'email': {'required': True, 'type': str, 'message': 'School email is required'},
    'phone': {'type': str, 'max_len': 20},
    'pincode': {'type': str, 'max_len': 20},
    'established_year': {'type': int, 'min': 1900, 'max': 2100, 'message': 'Invalid established year'},
})
def create_school():
    try:
        data = g.get('validated_data') or request.get_json()

        if School.query.filter_by(email=data['email']).first():
            return error_response('A school with this email already exists', 409)

        # Generate unique school code
        base_code = data['name'][:3].upper()
        code = base_code
        counter = 1
        while School.query.filter_by(code=code).first():
            code = f"{base_code}{counter}"
            counter += 1

        def _val(key, default=None):
            v = data.get(key, default)
            if v is not None and not isinstance(v, bool):
                if isinstance(v, str) and v.strip() == '':
                    return None
            return v

        def _int_val(key):
            v = data.get(key)
            if v is None or v == '':
                return None
            try:
                return int(v)
            except (ValueError, TypeError):
                return None

        def _json_val(key):
            v = data.get(key)
            if v is None or v == '' or v == 'null':
                return None
            return v

        school = School(
            name=data['name'],
            short_name=_val('short_name'),
            code=code,
            email=data['email'],
            phone=_val('phone'),
            secondary_phone=_val('secondary_phone'),
            alternate_contacts=_json_val('alternate_contacts'),
            address=_val('address'),
            city=_val('city'),
            state=_val('state'),
            pincode=_val('pincode'),
            country=_val('country', 'India'),
            website=_val('website'),
            domain_name=_val('domain_name'),
            principal_name=_val('principal_name'),
            principal_email=_val('principal_email'),
            principal_phone=_val('principal_phone'),
            board=_val('board', 'CBSE'),
            school_type=_val('school_type', 'co-ed'),
            established_year=_int_val('established_year'),
            registration_number=_val('registration_number'),
            session=_val('session'),
            notes=_val('notes'),
            custom_fields=_json_val('custom_fields'),
            is_active=True,
            plan='basic',
        )
        db.session.add(school)
        db.session.flush()

        for feature_name in (data.get('features') or []):
            db.session.add(SchoolFeature(school_id=school.id, feature_name=feature_name, is_enabled=True))

        admin_data = data.get('admin')
        if admin_data and admin_data.get('email') and admin_data.get('password'):
            admin_role = Role.query.filter_by(name='school_admin').first()
            if admin_role:
                admin_user = User(
                    school_id=school.id,
                    role_id=admin_role.id,
                    email=admin_data['email'],
                    first_name=admin_data.get('first_name', ''),
                    last_name=admin_data.get('last_name', ''),
                    is_active=True,
                )
                admin_user.set_password(admin_data['password'])
                db.session.add(admin_user)

        # ── Director Info ─────────────────────────────────────────────
        director_data = data.get('director')
        staff_category = data.get('staff_category')
        def _dval(key, default=None):
            v = director_data.get(key, default)
            if v is not None and isinstance(v, str) and v.strip() == '':
                return None
            return v

        def _dint(key):
            v = director_data.get(key)
            if v is None or v == '':
                return None
            try:
                return int(v)
            except (ValueError, TypeError):
                return None

        if director_data and director_data.get('name'):
            director = Director(
                school_id=school.id,
                name=director_data['name'],
                email=_dval('email'),
                phone=_dval('phone'),
                secondary_phone=_dval('secondary_phone'),
                address=_dval('address'),
                city=_dval('city'),
                state=_dval('state'),
                pincode=_dval('pincode'),
                qualification=_dval('qualification'),
                experience_years=_dint('experience_years'),
                aadhar_no=_dval('aadhar_no'),
                pan_no=_dval('pan_no'),
                other_doc_name=_dval('other_doc_name'),
            )
            db.session.add(director)

            # Also create a user with staff category
            if staff_category and director_data.get('email'):
                role_map = {
                    'director': 'school_admin',
                    'principal': 'school_admin',
                    'teacher': 'teacher',
                    'accountant': 'accountant',
                    'counselor': 'counselor',
                    'librarian': 'librarian',
                    'transport_manager': 'transport_manager',
                }
                role_name = role_map.get(staff_category.get('category', '').lower(), 'school_admin')
                role = Role.query.filter_by(name=role_name).first()
                if role:
                    dir_user = User(
                        school_id=school.id,
                        role_id=role.id,
                        email=director_data.get('email', director_data.get('phone', '')),
                        first_name=director_data['name'],
                        is_active=True,
                    )
                    default_pass = director_data.get('phone', 'password') or 'password'
                    dir_user.set_password(default_pass)
                    db.session.add(dir_user)

        db.session.commit()

        result = school.to_dict()
        if director_data and director_data.get('name'):
            result['director'] = director.to_dict()
        return success_response(result, 'School created successfully', 201)
    except Exception as e:
        db.session.rollback()
        err_msg = str(e)
        # Clean up MySQL errors for frontend
        if '(pymysql.err.DataError)' in err_msg and 'Incorrect' in err_msg:
            field = err_msg.split("'")[1] if "'" in err_msg else 'unknown'
            return error_response(f'Invalid value for {field}. Please check your input and try again.', 400)
        if '(pymysql.err.IntegrityError)' in err_msg:
            return error_response('This school email is already registered.', 409)
        import traceback
        traceback.print_exc()
        return error_response(f'Failed to create school: {err_msg}', 500)


@superadmin_bp.route('/schools/upload-doc', methods=['POST'])
@super_admin_required
def upload_school_doc():
    """Upload a document (aadhar, pan, photo, other) for school/director"""
    if 'file' not in request.files:
        return error_response('No file provided', 400)
    file = request.files['file']
    if file.filename == '':
        return error_response('No file selected', 400)
    if not allowed_doc_file(file.filename):
        return error_response('File type not allowed. Allowed: png, jpg, jpeg, pdf, doc, docx', 400)

    upload_dir = os.path.join(
        current_app.config.get('UPLOAD_FOLDER', 'uploads'),
        'school_docs',
        request.form.get('school_code', 'temp')
    )
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{request.form.get('doc_type', 'doc')}_{uuid.uuid4().hex[:12]}.{ext}"
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    url = f"/api/schools/uploads/school_docs/{request.form.get('school_code', 'temp')}/{filename}"
    return success_response({'url': url, 'filename': filename}, 'Document uploaded')


# ─── Manage Users ────────────────────────────────────────────────────────
@superadmin_bp.route('/users', methods=['GET'])
@super_admin_required
def list_users():
    query = User.query.join(Role).order_by(User.created_at.desc())

    search = request.args.get('search', '').strip()
    if search:
        query = query.filter(
            db.or_(
                User.email.ilike(f'%{search}%'),
                User.first_name.ilike(f'%{search}%'),
                User.last_name.ilike(f'%{search}%'),
            )
        )

    school_id = request.args.get('school_id')
    if school_id:
        query = query.filter(User.school_id == school_id)

    role = request.args.get('role')
    if role:
        query = query.filter(Role.name == role)

    result = paginate(query)
    # Enrich users with role and school info
    users = []
    for u in result.get('items', result if isinstance(result, list) else []):
        d = u.to_dict() if hasattr(u, 'to_dict') else u
        if hasattr(u, 'role') and u.role:
            d['role'] = {'id': u.role.id, 'name': u.role.name}
        school = School.query.get(u.school_id) if hasattr(u, 'school_id') else None
        d['school'] = {'id': school.id, 'name': school.name} if school else None
        users.append(d)

    if isinstance(result, dict):
        result['items'] = users
        result['users'] = users
    return success_response(result)


@superadmin_bp.route('/users', methods=['POST'])
@super_admin_required
def create_user():
    data = request.get_json()
    if not data.get('email') or not data.get('password'):
        return error_response('Email and password are required', 400)

    role = Role.query.filter_by(name=data.get('role', 'school_admin')).first()
    if not role:
        return error_response('Invalid role', 400)

    school_id = data.get('school_id')
    if not school_id:
        # For super_admin role, use school_id=1 (or first school)
        first_school = School.query.first()
        school_id = first_school.id if first_school else 1

    if User.query.filter_by(school_id=school_id, email=data['email']).first():
        return error_response('User with this email already exists in this school', 409)

    user = User(
        school_id=school_id,
        role_id=role.id,
        email=data['email'],
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', ''),
        is_active=True,
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return success_response(user.to_dict(), 'User created'), 201


@superadmin_bp.route('/users/<int:user_id>/toggle', methods=['POST'])
@super_admin_required
def toggle_user(user_id):
    user = User.query.get_or_404(user_id)
    # Protect super admins
    if user.role and user.role.name == 'super_admin':
        return error_response('Cannot disable a super admin account', 403)
    user.is_active = not user.is_active
    db.session.commit()
    status = 'enabled' if user.is_active else 'disabled'
    return success_response(user.to_dict(), f'User {status}')


@superadmin_bp.route('/users/<int:user_id>/reset-password', methods=['PUT'])
@super_admin_required
def reset_user_password(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    password = data.get('password', '')
    if len(password) < 6:
        return error_response('Password must be at least 6 characters', 400)
    user.set_password(password)
    db.session.commit()
    return success_response(message='Password reset successfully')


# ─── System Settings ─────────────────────────────────────────────────────
_system_settings_store = {}  # In-memory fallback; replace with DB table if needed

@superadmin_bp.route('/system-settings', methods=['GET'])
@super_admin_required
def get_system_settings():
    return success_response(_system_settings_store)


@superadmin_bp.route('/system-settings', methods=['PUT'])
@super_admin_required
def save_system_settings():
    data = request.get_json()
    _system_settings_store.update(data or {})
    return success_response(_system_settings_store, 'Settings saved')


# ─── Audit Logs ──────────────────────────────────────────────────────────
@superadmin_bp.route('/audit-logs', methods=['GET'])
@super_admin_required
def get_audit_logs():
    query = AuditLog.query.order_by(AuditLog.created_at.desc())

    search = request.args.get('search', '').strip()
    action = request.args.get('action', '').strip()
    if action:
        query = query.filter(AuditLog.action == action)

    result = paginate(query)

    # Enrich logs with user info
    logs = []
    items = result.get('items', result) if isinstance(result, dict) else result
    for log in items:
        d = {
            'id': log.id,
            'action': log.action,
            'module': log.module,
            'resource_id': log.record_id,
            'ip_address': log.ip_address,
            'created_at': log.created_at.isoformat() if log.created_at else None,
            'details': str(log.new_values or log.old_values or ''),
        }
        user = User.query.get(log.user_id) if log.user_id else None
        d['user_name'] = f"{user.first_name} {user.last_name}".strip() if user else 'System'
        d['user_email'] = user.email if user else ''
        # Apply search filter
        if search:
            searchable = f"{d['user_name']} {d['user_email']} {d['action']} {d['details']}".lower()
            if search.lower() not in searchable:
                continue
        logs.append(d)

    if isinstance(result, dict):
        result['logs'] = logs
        result['items'] = logs
    return success_response(result)