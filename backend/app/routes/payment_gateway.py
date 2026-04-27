"""
Payment Gateway Routes - Razorpay & Paytm Integration
Handles online payment creation, verification, and gateway settings per school.
"""
import hashlib
import hmac
import json
import uuid
from datetime import date, datetime

import razorpay
import requests
from flask import Blueprint, current_app, g, jsonify, request

from app import db
from app.models.fee import (AccountingEntry, FeeInstallment, FeePayment,
                             FeeReceipt)
from app.models.school import SchoolSetting
from app.utils.decorators import role_required, school_required
from app.utils.helpers import success_response, error_response

payment_bp = Blueprint('payment', __name__)

# Lazy import to avoid circular
def _notify_parent(school_id, payment):
    try:
        from app.routes.communication import notify_payment_received
        notify_payment_received(school_id, payment)
    except Exception:
        pass


# ──── Helpers ────

def get_school_gateway_settings(school_id):
    """Get payment gateway settings for a school from SchoolSetting."""
    settings = SchoolSetting.query.filter_by(school_id=school_id).all()
    result = {}
    for s in settings:
        if s.setting_key.startswith('pg_'):
            result[s.setting_key] = s.setting_value
    return result


def _get_razorpay_client(school_id):
    """Create Razorpay client using per-school or global credentials."""
    settings = get_school_gateway_settings(school_id)
    key_id = settings.get('pg_razorpay_key_id') or current_app.config.get('RAZORPAY_KEY_ID')
    key_secret = settings.get('pg_razorpay_key_secret') or current_app.config.get('RAZORPAY_KEY_SECRET')
    if not key_id or not key_secret:
        return None
    return razorpay.Client(auth=(key_id, key_secret))


def _get_paytm_config(school_id):
    """Get Paytm config using per-school or global credentials."""
    settings = get_school_gateway_settings(school_id)
    mid = settings.get('pg_paytm_merchant_id') or current_app.config.get('PAYTM_MERCHANT_ID')
    mkey = settings.get('pg_paytm_merchant_key') or current_app.config.get('PAYTM_MERCHANT_KEY')
    website = settings.get('pg_paytm_website') or current_app.config.get('PAYTM_WEBSITE', 'DEFAULT')
    industry = settings.get('pg_paytm_industry_type') or current_app.config.get('PAYTM_INDUSTRY_TYPE', 'Education')
    env = settings.get('pg_paytm_env') or current_app.config.get('PAYTM_ENV', 'staging')
    if not mid or not mkey:
        return None
    return {
        'merchant_id': mid,
        'merchant_key': mkey,
        'website': website,
        'industry_type': industry,
        'env': env,
        'base_url': 'https://securegw.paytm.in' if env == 'production' else 'https://securegw-stage.paytm.in'
    }


def _generate_paytm_checksum(params, merchant_key):
    """Generate Paytm checksum hash using HMAC-SHA256."""
    # Sort params and create string
    sorted_keys = sorted(params.keys())
    param_str = '|'.join([str(params.get(k, '')) for k in sorted_keys])
    # HMAC-SHA256
    h = hmac.new(merchant_key.encode('utf-8'), param_str.encode('utf-8'), hashlib.sha256)
    return h.hexdigest()


def _verify_paytm_checksum(params, checksum, merchant_key):
    """Verify Paytm response checksum."""
    generated = _generate_paytm_checksum(params, merchant_key)
    return hmac.compare_digest(generated, checksum)


# ──── Gateway Status / Config ────

@payment_bp.route('/gateway-config', methods=['GET'])
@school_required
def get_gateway_config():
    """Get available payment gateways for the school (public keys only)."""
    school_id = g.school_id
    settings = get_school_gateway_settings(school_id)

    razorpay_key = settings.get('pg_razorpay_key_id') or current_app.config.get('RAZORPAY_KEY_ID')
    paytm_mid = settings.get('pg_paytm_merchant_id') or current_app.config.get('PAYTM_MERCHANT_ID')

    gateways = []
    if razorpay_key:
        gateways.append({
            'name': 'razorpay',
            'label': 'Razorpay',
            'key_id': razorpay_key,
            'enabled': settings.get('pg_razorpay_enabled', 'true') == 'true'
        })
    if paytm_mid:
        gateways.append({
            'name': 'paytm',
            'label': 'Paytm',
            'merchant_id': paytm_mid,
            'enabled': settings.get('pg_paytm_enabled', 'true') == 'true'
        })

    return success_response({
        'gateways': gateways,
        'default_gateway': settings.get('pg_default_gateway', 'razorpay')
    })


# ──── Razorpay: Create Order ────

@payment_bp.route('/razorpay/create-order', methods=['POST'])
@role_required('school_admin', 'accountant', 'parent')
def razorpay_create_order():
    """Create a Razorpay order for fee payment."""
    data = request.get_json()
    school_id = g.school_id

    client = _get_razorpay_client(school_id)
    if not client:
        return error_response('Razorpay is not configured for this school', 400)

    amount = float(data.get('amount', 0))
    if amount <= 0:
        return error_response('Invalid amount', 400)

    student_id = data.get('student_id')
    fee_structure_id = data.get('fee_structure_id')
    installment_id = data.get('installment_id')

    # Amount in paise (Razorpay expects smallest currency unit)
    amount_paise = int(round(amount * 100))

    try:
        order_data = {
            'amount': amount_paise,
            'currency': 'INR',
            'receipt': f"SCH{school_id}_STU{student_id}_{uuid.uuid4().hex[:8]}",
            'notes': {
                'school_id': str(school_id),
                'student_id': str(student_id),
                'fee_structure_id': str(fee_structure_id),
                'installment_id': str(installment_id or ''),
            }
        }
        order = client.order.create(data=order_data)

        # Create pending payment record
        payment = FeePayment(
            school_id=school_id,
            student_id=student_id,
            fee_structure_id=fee_structure_id,
            installment_id=installment_id,
            amount_paid=amount,
            late_fee_paid=float(data.get('late_fee', 0)),
            discount_amount=float(data.get('discount', 0)),
            total_amount=amount,
            payment_date=date.today(),
            payment_mode='online',
            gateway='razorpay',
            razorpay_order_id=order['id'],
            status='pending',
            remarks=data.get('remarks', 'Online payment via Razorpay'),
            collected_by=g.current_user.id
        )
        db.session.add(payment)
        db.session.commit()

        settings = get_school_gateway_settings(school_id)
        key_id = settings.get('pg_razorpay_key_id') or current_app.config.get('RAZORPAY_KEY_ID')

        return success_response({
            'order_id': order['id'],
            'amount': amount_paise,
            'currency': 'INR',
            'key_id': key_id,
            'payment_id': payment.id,
            'name': 'School Fee Payment',
            'description': f'Fee payment for Student #{student_id}',
        })

    except Exception as e:
        return error_response(f'Failed to create Razorpay order: {str(e)}', 500)


# ──── Razorpay: Verify Payment ────

@payment_bp.route('/razorpay/verify', methods=['POST'])
@school_required
def razorpay_verify():
    """Verify Razorpay payment signature and complete the payment."""
    data = request.get_json()
    school_id = g.school_id

    razorpay_payment_id = data.get('razorpay_payment_id')
    razorpay_order_id = data.get('razorpay_order_id')
    razorpay_signature = data.get('razorpay_signature')

    if not all([razorpay_payment_id, razorpay_order_id, razorpay_signature]):
        return error_response('Missing payment verification data', 400)

    client = _get_razorpay_client(school_id)
    if not client:
        return error_response('Razorpay not configured', 400)

    try:
        # Verify signature
        client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })

        # Update payment record
        payment = FeePayment.query.filter_by(
            school_id=school_id,
            razorpay_order_id=razorpay_order_id
        ).first()

        if not payment:
            return error_response('Payment record not found', 404)

        payment.razorpay_payment_id = razorpay_payment_id
        payment.razorpay_signature = razorpay_signature
        payment.transaction_id = razorpay_payment_id
        payment.status = 'completed'

        # Update installment if linked
        if payment.installment_id:
            inst = FeeInstallment.query.get(payment.installment_id)
            if inst:
                inst.paid_amount = float(inst.paid_amount or 0) + float(payment.amount_paid)
                inst.paid_date = date.today()
                if float(inst.paid_amount) >= float(inst.amount):
                    inst.status = 'paid'
                else:
                    inst.status = 'partial'

        # Auto accounting entry
        entry = AccountingEntry(
            school_id=school_id,
            entry_date=date.today(),
            entry_type='income',
            account_head='Fee Collection - Online (Razorpay)',
            description=f'Online fee payment from student #{payment.student_id}',
            credit=float(payment.total_amount),
            reference_type='fee_payment',
            created_by=g.current_user.id
        )
        db.session.add(entry)

        # Auto generate receipt
        receipt_no = f"RCP-{payment.id:06d}"
        payment.receipt_no = receipt_no
        receipt = FeeReceipt(
            school_id=school_id,
            payment_id=payment.id,
            receipt_no=receipt_no,
            receipt_date=date.today(),
            student_id=payment.student_id,
            amount=payment.total_amount
        )
        db.session.add(receipt)
        db.session.commit()

        # Notify parent
        _notify_parent(school_id, payment)

        return success_response({
            'payment': payment.to_dict(),
            'receipt_no': receipt_no,
            'message': 'Payment verified and completed successfully'
        })

    except razorpay.errors.SignatureVerificationError:
        # Mark payment as failed
        payment = FeePayment.query.filter_by(
            school_id=school_id,
            razorpay_order_id=razorpay_order_id
        ).first()
        if payment:
            payment.status = 'failed'
            db.session.commit()
        return error_response('Payment verification failed - invalid signature', 400)

    except Exception as e:
        return error_response(f'Payment verification error: {str(e)}', 500)


# ──── Paytm: Initiate Transaction ────

@payment_bp.route('/paytm/initiate', methods=['POST'])
@role_required('school_admin', 'accountant', 'parent')
def paytm_initiate():
    """Initiate a Paytm transaction for fee payment."""
    data = request.get_json()
    school_id = g.school_id

    config = _get_paytm_config(school_id)
    if not config:
        return error_response('Paytm is not configured for this school', 400)

    amount = float(data.get('amount', 0))
    if amount <= 0:
        return error_response('Invalid amount', 400)

    student_id = data.get('student_id')
    fee_structure_id = data.get('fee_structure_id')
    installment_id = data.get('installment_id')

    order_id = f"SCH{school_id}_{uuid.uuid4().hex[:12]}"

    # Create pending payment record
    payment = FeePayment(
        school_id=school_id,
        student_id=student_id,
        fee_structure_id=fee_structure_id,
        installment_id=installment_id,
        amount_paid=amount,
        late_fee_paid=float(data.get('late_fee', 0)),
        discount_amount=float(data.get('discount', 0)),
        total_amount=amount,
        payment_date=date.today(),
        payment_mode='online',
        gateway='paytm',
        paytm_order_id=order_id,
        status='pending',
        remarks=data.get('remarks', 'Online payment via Paytm'),
        collected_by=g.current_user.id
    )
    db.session.add(payment)
    db.session.commit()

    # Build Paytm transaction request
    paytm_params = {
        'MID': config['merchant_id'],
        'ORDER_ID': order_id,
        'TXN_AMOUNT': str(amount),
        'CUST_ID': f"STU_{student_id}",
        'INDUSTRY_TYPE_ID': config['industry_type'],
        'WEBSITE': config['website'],
        'CHANNEL_ID': 'WEB',
        'CALLBACK_URL': data.get('callback_url', ''),
    }

    # Generate checksum
    checksum = _generate_paytm_checksum(paytm_params, config['merchant_key'])
    paytm_params['CHECKSUMHASH'] = checksum

    return success_response({
        'payment_id': payment.id,
        'order_id': order_id,
        'paytm_params': paytm_params,
        'txn_url': f"{config['base_url']}/order/process",
        'merchant_id': config['merchant_id'],
        'amount': str(amount),
    })


# ──── Paytm: Verify / Callback ────

@payment_bp.route('/paytm/verify', methods=['POST'])
@school_required
def paytm_verify():
    """Verify Paytm payment callback and complete the payment."""
    data = request.get_json()
    school_id = g.school_id

    order_id = data.get('ORDER_ID') or data.get('order_id')
    txn_id = data.get('TXNID') or data.get('txn_id')
    status = data.get('STATUS') or data.get('status')
    resp_code = data.get('RESPCODE') or data.get('resp_code')

    if not order_id:
        return error_response('Missing order ID', 400)

    payment = FeePayment.query.filter_by(
        school_id=school_id,
        paytm_order_id=order_id
    ).first()

    if not payment:
        return error_response('Payment record not found', 404)

    # Verify with Paytm server
    config = _get_paytm_config(school_id)
    if config:
        try:
            verify_params = {
                'MID': config['merchant_id'],
                'ORDER_ID': order_id,
            }
            checksum = _generate_paytm_checksum(verify_params, config['merchant_key'])
            verify_params['CHECKSUMHASH'] = checksum

            verify_url = f"{config['base_url']}/order/status"
            resp = requests.post(verify_url, json=verify_params, timeout=30)
            txn_status = resp.json()

            if txn_status.get('STATUS') == 'TXN_SUCCESS':
                status = 'TXN_SUCCESS'
                txn_id = txn_status.get('TXNID', txn_id)
        except Exception:
            pass  # Fall back to callback data

    if status == 'TXN_SUCCESS':
        payment.paytm_txn_id = txn_id
        payment.transaction_id = txn_id
        payment.status = 'completed'

        # Update installment if linked
        if payment.installment_id:
            inst = FeeInstallment.query.get(payment.installment_id)
            if inst:
                inst.paid_amount = float(inst.paid_amount or 0) + float(payment.amount_paid)
                inst.paid_date = date.today()
                if float(inst.paid_amount) >= float(inst.amount):
                    inst.status = 'paid'
                else:
                    inst.status = 'partial'

        # Auto accounting entry
        entry = AccountingEntry(
            school_id=school_id,
            entry_date=date.today(),
            entry_type='income',
            account_head='Fee Collection - Online (Paytm)',
            description=f'Online fee payment from student #{payment.student_id}',
            credit=float(payment.total_amount),
            reference_type='fee_payment',
            created_by=g.current_user.id
        )
        db.session.add(entry)

        # Auto generate receipt
        receipt_no = f"RCP-{payment.id:06d}"
        payment.receipt_no = receipt_no
        receipt = FeeReceipt(
            school_id=school_id,
            payment_id=payment.id,
            receipt_no=receipt_no,
            receipt_date=date.today(),
            student_id=payment.student_id,
            amount=payment.total_amount
        )
        db.session.add(receipt)
        db.session.commit()

        # Notify parent
        _notify_parent(school_id, payment)

        return success_response({
            'payment': payment.to_dict(),
            'receipt_no': receipt_no,
            'message': 'Paytm payment verified and completed successfully'
        })
    else:
        payment.status = 'failed'
        payment.remarks = f"Paytm payment failed: {resp_code}"
        db.session.commit()
        return error_response(f'Payment failed with status: {status}', 400)


# ──── Payment Gateway Settings (Admin) ────

@payment_bp.route('/settings', methods=['GET'])
@role_required('school_admin')
def get_payment_settings():
    """Get payment gateway settings for the school."""
    school_id = g.school_id
    settings = get_school_gateway_settings(school_id)

    # Mask secret keys for display
    masked = {}
    for key, val in settings.items():
        if 'secret' in key or 'merchant_key' in key:
            masked[key] = '****' + val[-4:] if val and len(val) > 4 else '****'
        else:
            masked[key] = val

    return success_response(masked)


@payment_bp.route('/settings', methods=['POST'])
@role_required('school_admin')
def save_payment_settings():
    """Save payment gateway settings for the school."""
    data = request.get_json()
    school_id = g.school_id

    # Allowed settings keys
    allowed_keys = [
        'pg_razorpay_key_id', 'pg_razorpay_key_secret', 'pg_razorpay_enabled',
        'pg_paytm_merchant_id', 'pg_paytm_merchant_key', 'pg_paytm_website',
        'pg_paytm_industry_type', 'pg_paytm_env', 'pg_paytm_enabled',
        'pg_default_gateway'
    ]

    for key, value in data.items():
        if key not in allowed_keys:
            continue

        setting = SchoolSetting.query.filter_by(
            school_id=school_id, setting_key=key
        ).first()

        if setting:
            setting.setting_value = str(value)
        else:
            setting = SchoolSetting(
                school_id=school_id,
                setting_key=key,
                setting_value=str(value)
            )
            db.session.add(setting)

    db.session.commit()
    return success_response(None, 'Payment gateway settings saved successfully')


# ──── Payment Status Check ────

@payment_bp.route('/status/<int:payment_id>', methods=['GET'])
@school_required
def check_payment_status(payment_id):
    """Check the status of a payment."""
    payment = FeePayment.query.filter_by(
        id=payment_id, school_id=g.school_id
    ).first()

    if not payment:
        return error_response('Payment not found', 404)

    return success_response(payment.to_dict())
