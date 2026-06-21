import json
from flask import Blueprint, request, g
from app import db
from app.models.inventory import (
    InventoryCategory, InventoryItem, InventoryTransaction
)
from app.models.student import Student
from app.models.staff import Staff
from app.utils.decorators import school_required
from app.utils.helpers import success_response, error_response, paginate, validate
from datetime import datetime
from sqlalchemy import func, desc

store_bp = Blueprint('store', __name__)


def _build_remarks(user_remarks, extra):
    parts = {}
    if user_remarks:
        parts['note'] = user_remarks
    parts.update(extra)
    return json.dumps(parts)


def _parse_remarks(remarks):
    if not remarks:
        return {}
    try:
        return json.loads(remarks)
    except (json.JSONDecodeError, TypeError):
        return {'note': str(remarks)}


def _enrich_txn(txn):
    d = txn.to_dict()
    meta = _parse_remarks(txn.remarks)
    d['note'] = meta.get('note', '')
    d['issue_date'] = meta.get('issue_date', '')
    d['expected_return_date'] = meta.get('expected_return_date', '')
    d['return_date'] = meta.get('return_date', '')
    return d


@store_bp.route('/dashboard')
@school_required
def dashboard():
    sid = g.school_id
    total_items = InventoryItem.query.filter_by(school_id=sid, is_active=True).count()
    low_stock = InventoryItem.query.filter(
        InventoryItem.school_id == sid,
        InventoryItem.is_active == True,
        InventoryItem.quantity <= InventoryItem.min_stock_level
    ).count()
    total_categories = InventoryCategory.query.filter_by(school_id=sid, is_active=True).count()
    total_quantity = db.session.query(func.coalesce(func.sum(InventoryItem.quantity), 0)).filter(
        InventoryItem.school_id == sid, InventoryItem.is_active == True
    ).scalar()
    recent = InventoryTransaction.query.filter_by(school_id=sid).order_by(
        desc(InventoryTransaction.created_at)
    ).limit(10).all()
    return success_response({
        'total_items': total_items,
        'low_stock_items': low_stock,
        'total_categories': total_categories,
        'total_quantity': int(total_quantity),
        'recent_transactions': [_enrich_txn(t) for t in recent],
    })


@store_bp.route('/items')
@school_required
def list_items():
    query = InventoryItem.query.filter_by(school_id=g.school_id, is_active=True)
    category_id = request.args.get('category_id', type=int)
    if category_id:
        query = query.filter_by(category_id=category_id)
    low_stock = request.args.get('low_stock')
    if low_stock:
        query = query.filter(InventoryItem.quantity <= InventoryItem.min_stock_level)
    search = request.args.get('search')
    if search:
        query = query.filter(InventoryItem.name.ilike(f'%{search}%'))
    query = query.order_by(InventoryItem.name)
    return success_response(paginate(query))


@store_bp.route('/items/<int:id>')
@school_required
def get_item(id):
    item = InventoryItem.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    return success_response(item.to_dict())


@store_bp.route('/items/<int:id>', methods=['PUT'])
@school_required
@validate({
    'unit_price': {'type': float, 'min': 0},
    'quantity': {'type': int, 'min': 0},
    'min_stock_level': {'type': int, 'min': 0},
    'max_stock_level': {'type': int, 'min': 0},
    'reorder_quantity': {'type': int, 'min': 0},
})
def update_item(id):
    item = InventoryItem.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = g.get('validated_data') or request.get_json()
    for k in ['name', 'description', 'sku', 'unit', 'location']:
        if k in data:
            setattr(item, k, data[k])
    # Validate numeric ranges to prevent DB overflow errors
    MAX_PRICE = 9999999999.99   # DECIMAL(12,2) limit
    MAX_INT = 2147483647        # MySQL INT limit
    for k in ['unit_price', 'quantity', 'min_stock_level', 'max_stock_level', 'reorder_quantity']:
        if k in data:
            val = data[k]
            if val is None or val == '':
                setattr(item, k, None)
            else:
                parsed = float(val) if k == 'unit_price' else int(val)
                if k == 'unit_price' and parsed > MAX_PRICE:
                    return error_response(f'Unit price cannot exceed {MAX_PRICE:,.2f}')
                if k != 'unit_price' and (parsed < 0 or parsed > MAX_INT):
                    return error_response(f'{k.replace("_", " ").title()} must be between 0 and {MAX_INT}')
                setattr(item, k, parsed)
    if 'expiry_date' in data:
        val = data['expiry_date']
        if val and isinstance(val, str):
            val = datetime.strptime(val, '%Y-%m-%d').date()
        setattr(item, 'expiry_date', val)
    db.session.commit()
    return success_response(item.to_dict(), 'Item updated')


@store_bp.route('/items', methods=['POST'])
@school_required
@validate({
    'name': {'required': True},
    'category_id': {'type': int},
    'unit_price': {'type': float, 'min': 0},
    'quantity': {'type': int, 'min': 0},
    'min_stock_level': {'type': int, 'min': 0},
    'max_stock_level': {'type': int, 'min': 0},
    'reorder_quantity': {'type': int, 'min': 0},
})
def create_item():
    data = g.get('validated_data') or request.get_json()
    name = data.get('name')
    if not name:
        return error_response('Item name is required')
    category_id = data.get('category_id')
    if category_id:
        cat = InventoryCategory.query.filter_by(id=category_id, school_id=g.school_id).first()
        if not cat:
            return error_response('Invalid category')

    # Validate numeric ranges to prevent DB overflow errors
    MAX_PRICE = 9999999999.99   # DECIMAL(12,2) limit
    MAX_INT = 2147483647        # MySQL INT limit

    def _num(v, t=float):
        if v is None or v == '':
            return None
        try: return t(v)
        except: return None

    quantity = int(data.get('quantity', 0) or 0)
    unit_price = _num(data.get('unit_price'))
    min_stock_level = int(data.get('min_stock_level', 0) or 0)
    max_stock_level = _num(data.get('max_stock_level'), int)
    reorder_quantity = _num(data.get('reorder_quantity'), int)

    # Range checks
    if quantity < 0 or quantity > MAX_INT:
        return error_response(f'Quantity must be between 0 and {MAX_INT}')
    if unit_price is not None and unit_price > MAX_PRICE:
        return error_response(f'Unit price cannot exceed {MAX_PRICE:,.2f}')
    if min_stock_level < 0 or min_stock_level > MAX_INT:
        return error_response(f'Min stock level must be between 0 and {MAX_INT}')
    if max_stock_level is not None and (max_stock_level < 0 or max_stock_level > MAX_INT):
        return error_response(f'Max stock level must be between 0 and {MAX_INT}')
    if reorder_quantity is not None and (reorder_quantity < 0 or reorder_quantity > MAX_INT):
        return error_response(f'Reorder quantity must be between 0 and {MAX_INT}')

    item = InventoryItem(
        school_id=g.school_id,
        category_id=category_id or None,
        name=name,
        description=data.get('description', ''),
        sku=data.get('sku', ''),
        quantity=quantity,
        unit=data.get('unit', ''),
        unit_price=unit_price,
        min_stock_level=min_stock_level,
        max_stock_level=max_stock_level,
        reorder_quantity=reorder_quantity,
        location=data.get('location', ''),
    )
    db.session.add(item)
    db.session.commit()
    if item.quantity > 0:
        txn = InventoryTransaction(
            school_id=g.school_id, item_id=item.id,
            transaction_type='in', quantity=item.quantity,
            reference_type='new_stock',
            remarks=json.dumps({'note': 'New item added'}),
            created_by=g.current_user.id,
        )
        db.session.add(txn)
        db.session.commit()
    return success_response(item.to_dict(), 'Item created', 201)


@store_bp.route('/categories')
@school_required
def list_categories():
    cats = InventoryCategory.query.filter_by(school_id=g.school_id, is_active=True).all()
    return success_response([c.to_dict() for c in cats])


@store_bp.route('/categories', methods=['POST'])
@school_required
@validate({
    'name': {'required': True},
})
def create_category():
    data = g.get('validated_data') or request.get_json()
    name = data.get('name')
    if not name:
        return error_response('Category name is required')
    cat = InventoryCategory(school_id=g.school_id, name=name, description=data.get('description', ''))
    db.session.add(cat)
    db.session.commit()
    return success_response(cat.to_dict(), 'Category created', 201)


@store_bp.route('/allocate', methods=['POST'])
@school_required
@validate({
    'item_id': {'required': True, 'type': int},
    'quantity': {'required': True, 'type': int, 'min': 1},
    'recipient_id': {'type': int},
})
def allocate_item():
    data = g.get('validated_data') or request.get_json()
    item_id = data.get('item_id')
    quantity = data.get('quantity', 1)
    issued_to = data.get('issued_to', '')
    recipient_type = data.get('recipient_type', '')
    recipient_id = data.get('recipient_id')
    user_remarks = data.get('remarks', '')
    issue_date = data.get('issue_date', '')
    expected_return_date = data.get('expected_return_date', '')

    if not item_id or not quantity:
        return error_response('Item ID and quantity are required')

    item = InventoryItem.query.filter_by(id=item_id, school_id=g.school_id).first_or_404()
    if item.quantity < quantity:
        return error_response(f'Insufficient stock. Available: {item.quantity}')

    recipient_name = issued_to
    if recipient_type == 'staff' and recipient_id:
        staff_mem = Staff.query.filter_by(id=recipient_id, school_id=g.school_id).first()
        if staff_mem:
            recipient_name = f'{staff_mem.first_name} {staff_mem.last_name or ""}'.strip()
    elif recipient_type == 'student' and recipient_id:
        stud = Student.query.filter_by(id=recipient_id, school_id=g.school_id).first()
        if stud:
            recipient_name = f'{stud.first_name} {stud.last_name or ""}'.strip()

    remarks = _build_remarks(user_remarks, {
        'issue_date': issue_date,
        'expected_return_date': expected_return_date,
    })

    txn = InventoryTransaction(
        school_id=g.school_id,
        item_id=item_id,
        transaction_type='out',
        quantity=quantity,
        reference_type='store_issue',
        issued_to=recipient_name,
        remarks=remarks,
        created_by=g.current_user.id,
    )
    item.quantity -= quantity
    db.session.add(txn)
    db.session.commit()
    return success_response(_enrich_txn(txn), f'Allocated {quantity} item(s) to {recipient_name}', 201)


@store_bp.route('/return', methods=['POST'])
@school_required
@validate({
    'item_id': {'required': True, 'type': int},
    'quantity': {'required': True, 'type': int, 'min': 1},
})
def return_item():
    data = g.get('validated_data') or request.get_json()
    item_id = data.get('item_id')
    quantity = data.get('quantity', 1)

    if not item_id or not quantity:
        return error_response('Item ID and quantity are required')

    item = InventoryItem.query.filter_by(id=item_id, school_id=g.school_id).first_or_404()

    remarks = _build_remarks(user_remarks, {
        'return_date': return_date,
    })

    txn = InventoryTransaction(
        school_id=g.school_id,
        item_id=item_id,
        transaction_type='return',
        quantity=quantity,
        reference_type='store_return',
        issued_to=returned_by,
        remarks=remarks,
        created_by=g.current_user.id,
    )
    item.quantity += quantity
    db.session.add(txn)
    db.session.commit()
    return success_response(_enrich_txn(txn), f'Returned {quantity} item(s)', 201)


@store_bp.route('/stock-in', methods=['POST'])
@school_required
@validate({
    'item_id': {'required': True, 'type': int},
    'quantity': {'required': True, 'type': int, 'min': 1},
})
def stock_in():
    data = g.get('validated_data') or request.get_json()
    item_id = data.get('item_id')
    quantity = data.get('quantity', 1)

    if not item_id or quantity < 1:
        return error_response('Item ID and quantity are required')

    item = InventoryItem.query.filter_by(id=item_id, school_id=g.school_id).first_or_404()

    remarks = _build_remarks(user_remarks, {'reference': reference})

    txn = InventoryTransaction(
        school_id=g.school_id,
        item_id=item_id,
        transaction_type='in',
        quantity=quantity,
        reference_type='stock_in',
        remarks=remarks,
        created_by=g.current_user.id,
    )
    item.quantity += quantity
    db.session.add(txn)
    db.session.commit()
    return success_response(_enrich_txn(txn), f'Stocked in {quantity} item(s)', 201)


@store_bp.route('/adjust-stock', methods=['POST'])
@school_required
@validate({
    'item_id': {'required': True, 'type': int},
    'quantity': {'required': True, 'type': int, 'min': 0},
})
def adjust_stock():
    data = g.get('validated_data') or request.get_json()
    item_id = data.get('item_id')
    new_quantity = data.get('quantity')

    if not item_id or new_quantity is None:
        return error_response('Item ID and quantity are required')

    item = InventoryItem.query.filter_by(id=item_id, school_id=g.school_id).first_or_404()
    old_qty = item.quantity
    diff = new_quantity - old_qty

    remarks = _build_remarks(user_remarks, {})
    if not user_remarks:
        remarks = json.dumps({'note': f'Adjusted from {old_qty} to {new_quantity}'})

    txn = InventoryTransaction(
        school_id=g.school_id,
        item_id=item_id,
        transaction_type='adjustment',
        quantity=diff,
        reference_type='stock_adjustment',
        remarks=remarks,
        created_by=g.current_user.id,
    )
    item.quantity = new_quantity
    db.session.add(txn)
    db.session.commit()
    return success_response(_enrich_txn(txn), f'Stock adjusted to {new_quantity}', 200)


@store_bp.route('/transactions')
@school_required
def list_transactions():
    query = InventoryTransaction.query.filter_by(school_id=g.school_id)
    item_id = request.args.get('item_id', type=int)
    if item_id:
        query = query.filter_by(item_id=item_id)
    txn_type = request.args.get('type')
    if txn_type:
        query = query.filter_by(transaction_type=txn_type)
    query = query.order_by(desc(InventoryTransaction.created_at))
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    items = [_enrich_txn(t) for t in pagination.items]

    # For 'out' transactions, compute returned quantity per item
    if txn_type == 'out' or not txn_type:
        out_item_ids = list(set(t.item_id for t in pagination.items if t.transaction_type == 'out'))
        if out_item_ids:
            return_totals = dict(
                db.session.query(
                    InventoryTransaction.item_id,
                    func.coalesce(func.sum(InventoryTransaction.quantity), 0)
                ).filter(
                    InventoryTransaction.school_id == g.school_id,
                    InventoryTransaction.item_id.in_(out_item_ids),
                    InventoryTransaction.transaction_type == 'return'
                ).group_by(InventoryTransaction.item_id).all()
            )
            for txn_item in items:
                txn_item['returned_qty'] = int(return_totals.get(txn_item['item_id'], 0))
                txn_item['is_returned'] = txn_item['returned_qty'] >= txn_item['quantity']

    return success_response({
        'items': items,
        'total': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'pages': pagination.pages,
        'has_next': pagination.has_next,
        'has_prev': pagination.has_prev,
    })


@store_bp.route('/staff-list')
@school_required
def staff_list():
    staff_members = Staff.query.filter_by(school_id=g.school_id).limit(200).all()
    result = []
    for s in staff_members:
        try:
            result.append({
                'id': s.id,
                'name': f'{s.first_name} {s.last_name or ""}'.strip(),
                'employee_id': s.employee_id,
                'department': s.department,
            })
        except Exception:
            continue
    return success_response(result)


@store_bp.route('/student-list')
@school_required
def student_list():
    students = Student.query.filter_by(school_id=g.school_id).limit(200).all()
    result = []
    for s in students:
        try:
            result.append({
                'id': s.id,
                'name': f'{s.first_name or ""} {s.last_name or ""}'.strip(),
                'admission_no': s.admission_no,
                'class_name': s.current_class.name if s.current_class else '',
                'section_name': s.current_section.name if s.current_section else '',
            })
        except Exception:
            continue
    return success_response(result)
