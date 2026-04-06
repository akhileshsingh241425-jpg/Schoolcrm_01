from flask import Blueprint, request, g
from app import db
from app.models.canteen import (
    CanteenWallet, CanteenMenuItem, CanteenTransaction,
    CanteenInventory, CanteenVendor, CanteenPreorder
)
from app.utils.decorators import school_required, role_required, feature_required
from app.utils.helpers import success_response, error_response, paginate
from sqlalchemy.orm import joinedload

canteen_bp = Blueprint('canteen', __name__)


# ==================== DASHBOARD ====================
@canteen_bp.route('/dashboard', methods=['GET'])
@school_required
@feature_required('canteen')
def dashboard():
    sid = g.school_id
    total_items = CanteenMenuItem.query.filter_by(school_id=sid, is_available=True).count()
    total_wallets = CanteenWallet.query.filter_by(school_id=sid, is_active=True).count()
    total_balance = db.session.query(db.func.sum(CanteenWallet.balance)).filter_by(school_id=sid, is_active=True).scalar() or 0
    today_transactions = CanteenTransaction.query.filter_by(school_id=sid).filter(
        db.func.date(CanteenTransaction.created_at) == db.func.curdate()).count()
    today_revenue = db.session.query(db.func.sum(CanteenTransaction.amount)).filter_by(
        school_id=sid, transaction_type='purchase').filter(
        db.func.date(CanteenTransaction.created_at) == db.func.curdate()).scalar() or 0
    pending_preorders = CanteenPreorder.query.filter_by(school_id=sid, status='pending').count()
    low_stock = CanteenInventory.query.filter_by(school_id=sid, is_active=True).filter(
        CanteenInventory.quantity <= CanteenInventory.min_stock).count()
    total_vendors = CanteenVendor.query.filter_by(school_id=sid, is_active=True).count()
    return success_response(data={
        'total_items': total_items, 'total_wallets': total_wallets,
        'total_balance': float(total_balance), 'today_transactions': today_transactions,
        'today_revenue': float(today_revenue), 'pending_preorders': pending_preorders,
        'low_stock': low_stock, 'total_vendors': total_vendors,
    })


# ==================== MENU ====================
@canteen_bp.route('/menu', methods=['GET'])
@school_required
@feature_required('canteen')
def list_menu():
    q = CanteenMenuItem.query.filter_by(school_id=g.school_id)
    cat = request.args.get('category')
    if cat: q = q.filter_by(category=cat)
    q = q.order_by(CanteenMenuItem.name)
    return success_response(data=paginate(q))

@canteen_bp.route('/menu', methods=['POST'])
@school_required
@feature_required('canteen')
def create_menu_item():
    data = request.get_json()
    item = CanteenMenuItem(school_id=g.school_id, name=data['name'],
        category=data.get('category'), price=data['price'],
        description=data.get('description'), calories=data.get('calories'),
        allergens=data.get('allergens'), is_vegetarian=data.get('is_vegetarian', True),
        image_url=data.get('image_url'))
    db.session.add(item)
    db.session.commit()
    return success_response(data=item.to_dict(), message='Menu item created')

@canteen_bp.route('/menu/<int:id>', methods=['PUT'])
@school_required
@feature_required('canteen')
def update_menu_item(id):
    item = CanteenMenuItem.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['name', 'category', 'price', 'description', 'calories', 'allergens', 'is_vegetarian', 'is_available', 'image_url']:
        if k in data: setattr(item, k, data[k])
    db.session.commit()
    return success_response(data=item.to_dict(), message='Menu item updated')

@canteen_bp.route('/menu/<int:id>', methods=['DELETE'])
@school_required
@feature_required('canteen')
def delete_menu_item(id):
    item = CanteenMenuItem.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(item)
    db.session.commit()
    return success_response(message='Menu item deleted')


# ==================== WALLETS ====================
@canteen_bp.route('/wallets', methods=['GET'])
@school_required
@feature_required('canteen')
def list_wallets():
    q = CanteenWallet.query.options(
        joinedload(CanteenWallet.student)
    ).filter_by(school_id=g.school_id)
    q = q.order_by(CanteenWallet.created_at.desc())
    return success_response(data=paginate(q))

@canteen_bp.route('/wallets', methods=['POST'])
@school_required
@feature_required('canteen')
def create_wallet():
    data = request.get_json()
    w = CanteenWallet(school_id=g.school_id, student_id=data['student_id'],
        balance=data.get('balance', 0), daily_limit=data.get('daily_limit', 200))
    db.session.add(w)
    db.session.commit()
    return success_response(data=w.to_dict(), message='Wallet created')

@canteen_bp.route('/wallets/<int:id>', methods=['PUT'])
@school_required
@feature_required('canteen')
def update_wallet(id):
    w = CanteenWallet.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['balance', 'daily_limit', 'is_active']:
        if k in data: setattr(w, k, data[k])
    db.session.commit()
    return success_response(data=w.to_dict(), message='Wallet updated')

@canteen_bp.route('/wallets/<int:id>/topup', methods=['POST'])
@school_required
@feature_required('canteen')
def topup_wallet(id):
    w = CanteenWallet.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    amount = float(data['amount'])
    w.balance = float(w.balance or 0) + amount
    txn = CanteenTransaction(school_id=g.school_id, student_id=w.student_id,
        wallet_id=w.id, transaction_type='topup', amount=amount,
        payment_method=data.get('payment_method', 'cash'),
        reference_no=data.get('reference_no'), remarks=data.get('remarks'))
    db.session.add(txn)
    db.session.commit()
    return success_response(data=w.to_dict(), message=f'Wallet topped up by ₹{amount}')


# ==================== TRANSACTIONS ====================
@canteen_bp.route('/transactions', methods=['GET'])
@school_required
@feature_required('canteen')
def list_transactions():
    q = CanteenTransaction.query.options(
        joinedload(CanteenTransaction.student),
        joinedload(CanteenTransaction.item)
    ).filter_by(school_id=g.school_id)
    txn_type = request.args.get('transaction_type')
    if txn_type: q = q.filter_by(transaction_type=txn_type)
    q = q.order_by(CanteenTransaction.created_at.desc())
    return success_response(data=paginate(q))

@canteen_bp.route('/transactions', methods=['POST'])
@school_required
@feature_required('canteen')
def create_transaction():
    data = request.get_json()
    txn = CanteenTransaction(school_id=g.school_id, student_id=data['student_id'],
        wallet_id=data.get('wallet_id'), transaction_type=data['transaction_type'],
        amount=data['amount'], item_id=data.get('item_id'),
        quantity=data.get('quantity', 1), payment_method=data.get('payment_method', 'wallet'),
        reference_no=data.get('reference_no'), remarks=data.get('remarks'))
    if data['transaction_type'] == 'purchase' and data.get('wallet_id'):
        w = CanteenWallet.query.get(data['wallet_id'])
        if w:
            w.balance = float(w.balance or 0) - float(data['amount'])
    db.session.add(txn)
    db.session.commit()
    return success_response(data=txn.to_dict(), message='Transaction recorded')


# ==================== INVENTORY ====================
@canteen_bp.route('/inventory', methods=['GET'])
@school_required
@feature_required('canteen')
def list_inventory():
    q = CanteenInventory.query.filter_by(school_id=g.school_id)
    q = q.order_by(CanteenInventory.item_name)
    return success_response(data=paginate(q))

@canteen_bp.route('/inventory', methods=['POST'])
@school_required
@feature_required('canteen')
def create_inventory():
    data = request.get_json()
    inv = CanteenInventory(school_id=g.school_id, item_name=data['item_name'],
        category=data.get('category'), quantity=data.get('quantity', 0),
        unit=data.get('unit'), unit_price=data.get('unit_price', 0),
        min_stock=data.get('min_stock', 0), supplier=data.get('supplier'),
        last_restocked=data.get('last_restocked'), expiry_date=data.get('expiry_date'))
    db.session.add(inv)
    db.session.commit()
    return success_response(data=inv.to_dict(), message='Inventory item created')

@canteen_bp.route('/inventory/<int:id>', methods=['PUT'])
@school_required
@feature_required('canteen')
def update_inventory(id):
    inv = CanteenInventory.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['item_name', 'category', 'quantity', 'unit', 'unit_price', 'min_stock', 'supplier', 'last_restocked', 'expiry_date', 'is_active']:
        if k in data: setattr(inv, k, data[k])
    db.session.commit()
    return success_response(data=inv.to_dict(), message='Inventory updated')

@canteen_bp.route('/inventory/<int:id>', methods=['DELETE'])
@school_required
@feature_required('canteen')
def delete_inventory(id):
    inv = CanteenInventory.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(inv)
    db.session.commit()
    return success_response(message='Inventory item deleted')


# ==================== VENDORS ====================
@canteen_bp.route('/vendors', methods=['GET'])
@school_required
@feature_required('canteen')
def list_vendors():
    q = CanteenVendor.query.filter_by(school_id=g.school_id)
    q = q.order_by(CanteenVendor.name)
    return success_response(data=paginate(q))

@canteen_bp.route('/vendors', methods=['POST'])
@school_required
@feature_required('canteen')
def create_vendor():
    data = request.get_json()
    v = CanteenVendor(school_id=g.school_id, name=data['name'],
        contact_person=data.get('contact_person'), phone=data.get('phone'),
        email=data.get('email'), address=data.get('address'),
        supply_items=data.get('supply_items'), rating=data.get('rating'),
        fssai_license=data.get('fssai_license'))
    db.session.add(v)
    db.session.commit()
    return success_response(data=v.to_dict(), message='Vendor created')

@canteen_bp.route('/vendors/<int:id>', methods=['PUT'])
@school_required
@feature_required('canteen')
def update_vendor(id):
    v = CanteenVendor.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['name', 'contact_person', 'phone', 'email', 'address', 'supply_items', 'rating', 'fssai_license', 'is_active']:
        if k in data: setattr(v, k, data[k])
    db.session.commit()
    return success_response(data=v.to_dict(), message='Vendor updated')

@canteen_bp.route('/vendors/<int:id>', methods=['DELETE'])
@school_required
@feature_required('canteen')
def delete_vendor(id):
    v = CanteenVendor.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(v)
    db.session.commit()
    return success_response(message='Vendor deleted')


# ==================== PREORDERS ====================
@canteen_bp.route('/preorders', methods=['GET'])
@school_required
@feature_required('canteen')
def list_preorders():
    q = CanteenPreorder.query.options(
        joinedload(CanteenPreorder.student),
        joinedload(CanteenPreorder.item)
    ).filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status: q = q.filter_by(status=status)
    q = q.order_by(CanteenPreorder.created_at.desc())
    return success_response(data=paginate(q))

@canteen_bp.route('/preorders', methods=['POST'])
@school_required
@feature_required('canteen')
def create_preorder():
    data = request.get_json()
    item = CanteenMenuItem.query.get(data['item_id'])
    total = float(item.price) * int(data.get('quantity', 1)) if item else 0
    po = CanteenPreorder(school_id=g.school_id, student_id=data['student_id'],
        item_id=data['item_id'], quantity=data.get('quantity', 1),
        order_date=data['order_date'], pickup_time=data.get('pickup_time'),
        total_amount=total, remarks=data.get('remarks'))
    db.session.add(po)
    db.session.commit()
    return success_response(data=po.to_dict(), message='Pre-order created')

@canteen_bp.route('/preorders/<int:id>', methods=['PUT'])
@school_required
@feature_required('canteen')
def update_preorder(id):
    po = CanteenPreorder.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['quantity', 'pickup_time', 'status', 'remarks']:
        if k in data: setattr(po, k, data[k])
    db.session.commit()
    return success_response(data=po.to_dict(), message='Pre-order updated')

@canteen_bp.route('/preorders/<int:id>', methods=['DELETE'])
@school_required
@feature_required('canteen')
def delete_preorder(id):
    po = CanteenPreorder.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(po)
    db.session.commit()
    return success_response(message='Pre-order deleted')
