from flask import Blueprint, request, g
from app import db
from app.models.inventory import (
    AssetCategory, Asset, AssetMaintenance,
    InventoryCategory, InventoryItem, InventoryTransaction,
    PurchaseRequest, PurchaseOrderInv, VendorQuotation, AssetDisposal
)
from app.utils.decorators import school_required, role_required, feature_required
from app.utils.helpers import success_response, error_response, paginate
from datetime import datetime, date
from sqlalchemy import func

inventory_bp = Blueprint('inventory', __name__)


# ═══════════════════════════════════════════════════════════════
#  DASHBOARD
# ═══════════════════════════════════════════════════════════════
@inventory_bp.route('/dashboard', methods=['GET'])
@school_required
@feature_required('inventory')
def dashboard():
    sid = g.school_id
    total_assets = Asset.query.filter_by(school_id=sid).count()
    active_assets = Asset.query.filter_by(school_id=sid, status='active').count()
    in_repair = Asset.query.filter_by(school_id=sid, status='in_repair').count()
    disposed = Asset.query.filter_by(school_id=sid, status='disposed').count()
    total_items = InventoryItem.query.filter_by(school_id=sid).count()
    low_stock = InventoryItem.query.filter(
        InventoryItem.school_id == sid,
        InventoryItem.quantity <= InventoryItem.min_stock_level
    ).count()
    pending_requests = PurchaseRequest.query.filter_by(school_id=sid, status='pending').count()
    pending_orders = PurchaseOrderInv.query.filter(
        PurchaseOrderInv.school_id == sid,
        PurchaseOrderInv.status.in_(['draft', 'sent', 'confirmed'])
    ).count()
    pending_maintenance = AssetMaintenance.query.filter(
        AssetMaintenance.school_id == sid,
        AssetMaintenance.status.in_(['pending', 'in_progress'])
    ).count()
    warranty_expiring = Asset.query.filter(
        Asset.school_id == sid,
        Asset.warranty_expiry.isnot(None),
        Asset.warranty_expiry <= date.today().replace(month=date.today().month % 12 + 1)
    ).count() if date.today().month < 12 else 0
    asset_value = db.session.query(func.sum(Asset.current_value)).filter_by(school_id=sid, status='active').scalar() or 0
    pending_disposals = AssetDisposal.query.filter_by(school_id=sid, status='pending').count()

    return success_response({
        'total_assets': total_assets, 'active_assets': active_assets,
        'in_repair': in_repair, 'disposed_assets': disposed,
        'total_items': total_items, 'low_stock_items': low_stock,
        'pending_requests': pending_requests, 'pending_orders': pending_orders,
        'pending_maintenance': pending_maintenance,
        'warranty_expiring': warranty_expiring,
        'total_asset_value': float(asset_value),
        'pending_disposals': pending_disposals,
    })


# ═══════════════════════════════════════════════════════════════
#  ASSET CATEGORIES
# ═══════════════════════════════════════════════════════════════
@inventory_bp.route('/asset-categories', methods=['GET'])
@school_required
@feature_required('inventory')
def list_asset_categories():
    cats = AssetCategory.query.filter_by(school_id=g.school_id, is_active=True).all()
    return success_response([c.to_dict() for c in cats])


@inventory_bp.route('/asset-categories', methods=['POST'])
@school_required
def create_asset_category():
    data = request.get_json()
    cat = AssetCategory(
        school_id=g.school_id, name=data['name'],
        description=data.get('description'),
        parent_id=data.get('parent_id'),
        depreciation_rate=data.get('depreciation_rate'),
        useful_life_years=data.get('useful_life_years'),
    )
    db.session.add(cat)
    db.session.commit()
    return success_response(cat.to_dict(), 'Category created', 201)


# ═══════════════════════════════════════════════════════════════
#  ASSETS (Master Register)
# ═══════════════════════════════════════════════════════════════
@inventory_bp.route('/assets', methods=['GET'])
@school_required
@feature_required('inventory')
def list_assets():
    query = Asset.query.filter_by(school_id=g.school_id)
    asset_type = request.args.get('asset_type')
    if asset_type:
        query = query.filter_by(asset_type=asset_type)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    condition = request.args.get('condition')
    if condition:
        query = query.filter_by(condition=condition)
    category_id = request.args.get('category_id', type=int)
    if category_id:
        query = query.filter_by(category_id=category_id)
    search = request.args.get('search')
    if search:
        query = query.filter(Asset.name.ilike(f'%{search}%'))
    query = query.order_by(Asset.created_at.desc())
    return success_response(paginate(query))


@inventory_bp.route('/assets', methods=['POST'])
@school_required
def create_asset():
    data = request.get_json()
    asset = Asset(school_id=g.school_id)
    for k in ['category_id', 'asset_code', 'name', 'description', 'asset_type',
              'brand', 'model', 'serial_number', 'purchase_date', 'purchase_price',
              'vendor_id', 'warranty_expiry', 'warranty_details', 'location',
              'room_number', 'assigned_to', 'condition', 'status', 'current_value',
              'depreciation_method', 'salvage_value', 'useful_life_years', 'notes']:
        if k in data:
            val = data[k]
            if k in ('purchase_date', 'warranty_expiry', 'last_audit_date') and val:
                val = datetime.strptime(val, '%Y-%m-%d').date() if isinstance(val, str) else val
            setattr(asset, k, val)
    db.session.add(asset)
    db.session.commit()
    return success_response(asset.to_dict(), 'Asset created', 201)


@inventory_bp.route('/assets/<int:id>', methods=['GET'])
@school_required
def get_asset(id):
    asset = Asset.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    return success_response(asset.to_dict())


@inventory_bp.route('/assets/<int:id>', methods=['PUT'])
@school_required
def update_asset(id):
    asset = Asset.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['category_id', 'asset_code', 'name', 'description', 'asset_type',
              'brand', 'model', 'serial_number', 'purchase_date', 'purchase_price',
              'vendor_id', 'warranty_expiry', 'warranty_details', 'location',
              'room_number', 'assigned_to', 'condition', 'status', 'current_value',
              'depreciation_method', 'salvage_value', 'useful_life_years', 'notes']:
        if k in data:
            val = data[k]
            if k in ('purchase_date', 'warranty_expiry', 'last_audit_date') and val and isinstance(val, str):
                val = datetime.strptime(val, '%Y-%m-%d').date()
            setattr(asset, k, val)
    db.session.commit()
    return success_response(asset.to_dict(), 'Asset updated')


@inventory_bp.route('/assets/<int:id>', methods=['DELETE'])
@school_required
def delete_asset(id):
    asset = Asset.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(asset)
    db.session.commit()
    return success_response(None, 'Asset deleted')


# ═══════════════════════════════════════════════════════════════
#  ASSET MAINTENANCE
# ═══════════════════════════════════════════════════════════════
@inventory_bp.route('/maintenance', methods=['GET'])
@school_required
@feature_required('inventory')
def list_maintenance():
    query = AssetMaintenance.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(AssetMaintenance.created_at.desc())
    return success_response(paginate(query))


@inventory_bp.route('/maintenance', methods=['POST'])
@school_required
def create_maintenance():
    data = request.get_json()
    m = AssetMaintenance(school_id=g.school_id)
    for k in ['asset_id', 'maintenance_type', 'description', 'reported_date',
              'scheduled_date', 'completed_date', 'vendor_name', 'cost',
              'status', 'priority', 'technician', 'notes']:
        if k in data:
            val = data[k]
            if k in ('reported_date', 'scheduled_date', 'completed_date') and val and isinstance(val, str):
                val = datetime.strptime(val, '%Y-%m-%d').date()
            setattr(m, k, val)
    db.session.add(m)
    db.session.commit()
    return success_response(m.to_dict(), 'Maintenance record created', 201)


@inventory_bp.route('/maintenance/<int:id>', methods=['PUT'])
@school_required
def update_maintenance(id):
    m = AssetMaintenance.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['maintenance_type', 'description', 'scheduled_date', 'completed_date',
              'vendor_name', 'cost', 'status', 'priority', 'technician', 'notes']:
        if k in data:
            val = data[k]
            if k in ('scheduled_date', 'completed_date') and val and isinstance(val, str):
                val = datetime.strptime(val, '%Y-%m-%d').date()
            setattr(m, k, val)
    db.session.commit()
    return success_response(m.to_dict(), 'Updated')


# ═══════════════════════════════════════════════════════════════
#  INVENTORY CATEGORIES (consumables)
# ═══════════════════════════════════════════════════════════════
@inventory_bp.route('/categories', methods=['GET'])
@school_required
@feature_required('inventory')
def list_categories():
    cats = InventoryCategory.query.filter_by(school_id=g.school_id).all()
    return success_response([c.to_dict() for c in cats])


@inventory_bp.route('/categories', methods=['POST'])
@school_required
def create_category():
    data = request.get_json()
    cat = InventoryCategory(
        school_id=g.school_id, name=data['name'],
        description=data.get('description'),
    )
    db.session.add(cat)
    db.session.commit()
    return success_response(cat.to_dict(), 'Category created', 201)


# ═══════════════════════════════════════════════════════════════
#  INVENTORY ITEMS (consumable stock)
# ═══════════════════════════════════════════════════════════════
@inventory_bp.route('/items', methods=['GET'])
@school_required
@feature_required('inventory')
def list_items():
    query = InventoryItem.query.filter_by(school_id=g.school_id)
    category_id = request.args.get('category_id', type=int)
    if category_id:
        query = query.filter_by(category_id=category_id)
    low_stock = request.args.get('low_stock')
    if low_stock:
        query = query.filter(InventoryItem.quantity <= InventoryItem.min_stock_level)
    is_lab = request.args.get('is_lab_item')
    if is_lab:
        query = query.filter_by(is_lab_item=True)
    search = request.args.get('search')
    if search:
        query = query.filter(InventoryItem.name.ilike(f'%{search}%'))
    query = query.order_by(InventoryItem.name)
    return success_response(paginate(query))


@inventory_bp.route('/items', methods=['POST'])
@school_required
def create_item():
    data = request.get_json()
    item = InventoryItem(school_id=g.school_id)
    for k in ['category_id', 'name', 'description', 'sku', 'quantity', 'unit',
              'unit_price', 'min_stock_level', 'max_stock_level', 'reorder_quantity',
              'location', 'expiry_date', 'is_lab_item']:
        if k in data:
            val = data[k]
            if k == 'expiry_date' and val and isinstance(val, str):
                val = datetime.strptime(val, '%Y-%m-%d').date()
            setattr(item, k, val)
    db.session.add(item)
    db.session.commit()
    return success_response(item.to_dict(), 'Item created', 201)


@inventory_bp.route('/items/<int:id>', methods=['PUT'])
@school_required
def update_item(id):
    item = InventoryItem.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['category_id', 'name', 'description', 'sku', 'quantity', 'unit',
              'unit_price', 'min_stock_level', 'max_stock_level', 'reorder_quantity',
              'location', 'expiry_date', 'is_lab_item']:
        if k in data:
            val = data[k]
            if k == 'expiry_date' and val and isinstance(val, str):
                val = datetime.strptime(val, '%Y-%m-%d').date()
            setattr(item, k, val)
    db.session.commit()
    return success_response(item.to_dict(), 'Item updated')


# ═══════════════════════════════════════════════════════════════
#  INVENTORY TRANSACTIONS
# ═══════════════════════════════════════════════════════════════
@inventory_bp.route('/transactions', methods=['GET'])
@school_required
@feature_required('inventory')
def list_transactions():
    query = InventoryTransaction.query.filter_by(school_id=g.school_id)
    item_id = request.args.get('item_id', type=int)
    if item_id:
        query = query.filter_by(item_id=item_id)
    query = query.order_by(InventoryTransaction.created_at.desc())
    return success_response(paginate(query))


@inventory_bp.route('/transactions', methods=['POST'])
@school_required
def add_transaction():
    data = request.get_json()
    item = InventoryItem.query.filter_by(id=data['item_id'], school_id=g.school_id).first_or_404()

    txn = InventoryTransaction(
        school_id=g.school_id, item_id=data['item_id'],
        transaction_type=data.get('transaction_type', data.get('type', 'in')),
        quantity=data['quantity'],
        reference_type=data.get('reference_type'),
        reference_id=data.get('reference_id'),
        issued_to=data.get('issued_to'),
        remarks=data.get('remarks', data.get('notes', '')),
        created_by=g.current_user.id,
    )

    t = txn.transaction_type
    if t == 'in' or t == 'return':
        item.quantity += data['quantity']
    elif t == 'out':
        if item.quantity < data['quantity']:
            return error_response('Insufficient stock')
        item.quantity -= data['quantity']
    elif t == 'adjustment':
        item.quantity = data['quantity']

    db.session.add(txn)
    db.session.commit()
    return success_response(txn.to_dict(), 'Transaction recorded', 201)


# ═══════════════════════════════════════════════════════════════
#  PURCHASE REQUESTS
# ═══════════════════════════════════════════════════════════════
@inventory_bp.route('/purchase-requests', methods=['GET'])
@school_required
@feature_required('inventory')
def list_purchase_requests():
    query = PurchaseRequest.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(PurchaseRequest.created_at.desc())
    return success_response(paginate(query))


@inventory_bp.route('/purchase-requests', methods=['POST'])
@school_required
def create_purchase_request():
    data = request.get_json()
    pr = PurchaseRequest(
        school_id=g.school_id,
        request_number=f"PR-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        requested_by=g.current_user.id,
    )
    for k in ['title', 'description', 'request_type', 'priority', 'department',
              'items_json', 'estimated_total', 'notes']:
        if k in data:
            setattr(pr, k, data[k])
    db.session.add(pr)
    db.session.commit()
    return success_response(pr.to_dict(), 'Purchase request created', 201)


@inventory_bp.route('/purchase-requests/<int:id>', methods=['PUT'])
@school_required
def update_purchase_request(id):
    pr = PurchaseRequest.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['title', 'description', 'priority', 'department', 'items_json',
              'estimated_total', 'status', 'rejection_reason', 'notes']:
        if k in data:
            setattr(pr, k, data[k])
    if data.get('status') == 'approved':
        pr.approved_by = g.current_user.id
        pr.approved_at = datetime.utcnow()
    db.session.commit()
    return success_response(pr.to_dict(), 'Updated')


# ═══════════════════════════════════════════════════════════════
#  PURCHASE ORDERS
# ═══════════════════════════════════════════════════════════════
@inventory_bp.route('/purchase-orders', methods=['GET'])
@school_required
@feature_required('inventory')
def list_purchase_orders():
    query = PurchaseOrderInv.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(PurchaseOrderInv.created_at.desc())
    return success_response(paginate(query))


@inventory_bp.route('/purchase-orders', methods=['POST'])
@school_required
def create_purchase_order():
    data = request.get_json()
    po = PurchaseOrderInv(
        school_id=g.school_id,
        po_number=f"PO-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        created_by=g.current_user.id,
    )
    for k in ['purchase_request_id', 'vendor_name', 'vendor_contact', 'vendor_email',
              'vendor_address', 'order_date', 'expected_delivery', 'items_json',
              'subtotal', 'tax_amount', 'discount_amount', 'total_amount',
              'payment_terms', 'delivery_terms', 'status', 'notes']:
        if k in data:
            val = data[k]
            if k in ('order_date', 'expected_delivery') and val and isinstance(val, str):
                val = datetime.strptime(val, '%Y-%m-%d').date()
            setattr(po, k, val)
    db.session.add(po)
    db.session.commit()
    return success_response(po.to_dict(), 'Purchase order created', 201)


@inventory_bp.route('/purchase-orders/<int:id>', methods=['PUT'])
@school_required
def update_purchase_order(id):
    po = PurchaseOrderInv.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['vendor_name', 'vendor_contact', 'vendor_email', 'vendor_address',
              'expected_delivery', 'actual_delivery', 'items_json',
              'subtotal', 'tax_amount', 'discount_amount', 'total_amount',
              'payment_terms', 'delivery_terms', 'quality_check', 'quality_notes',
              'status', 'notes']:
        if k in data:
            val = data[k]
            if k in ('expected_delivery', 'actual_delivery') and val and isinstance(val, str):
                val = datetime.strptime(val, '%Y-%m-%d').date()
            setattr(po, k, val)
    db.session.commit()
    return success_response(po.to_dict(), 'Updated')


# ═══════════════════════════════════════════════════════════════
#  VENDOR QUOTATIONS
# ═══════════════════════════════════════════════════════════════
@inventory_bp.route('/quotations', methods=['GET'])
@school_required
@feature_required('inventory')
def list_quotations():
    query = VendorQuotation.query.filter_by(school_id=g.school_id)
    pr_id = request.args.get('purchase_request_id', type=int)
    if pr_id:
        query = query.filter_by(purchase_request_id=pr_id)
    query = query.order_by(VendorQuotation.created_at.desc())
    return success_response(paginate(query))


@inventory_bp.route('/quotations', methods=['POST'])
@school_required
def create_quotation():
    data = request.get_json()
    q = VendorQuotation(school_id=g.school_id)
    for k in ['purchase_request_id', 'vendor_name', 'vendor_contact', 'vendor_email',
              'quotation_number', 'quotation_date', 'valid_until', 'items_json',
              'total_amount', 'delivery_days', 'payment_terms', 'warranty_terms',
              'rating', 'notes']:
        if k in data:
            val = data[k]
            if k in ('quotation_date', 'valid_until') and val and isinstance(val, str):
                val = datetime.strptime(val, '%Y-%m-%d').date()
            setattr(q, k, val)
    db.session.add(q)
    db.session.commit()
    return success_response(q.to_dict(), 'Quotation added', 201)


@inventory_bp.route('/quotations/<int:id>', methods=['PUT'])
@school_required
def update_quotation(id):
    q = VendorQuotation.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['vendor_name', 'vendor_contact', 'total_amount', 'delivery_days',
              'payment_terms', 'warranty_terms', 'rating', 'is_selected', 'notes']:
        if k in data:
            setattr(q, k, data[k])
    db.session.commit()
    return success_response(q.to_dict(), 'Updated')


# ═══════════════════════════════════════════════════════════════
#  ASSET DISPOSAL
# ═══════════════════════════════════════════════════════════════
@inventory_bp.route('/disposals', methods=['GET'])
@school_required
@feature_required('inventory')
def list_disposals():
    query = AssetDisposal.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(AssetDisposal.created_at.desc())
    return success_response(paginate(query))


@inventory_bp.route('/disposals', methods=['POST'])
@school_required
def create_disposal():
    data = request.get_json()
    d = AssetDisposal(school_id=g.school_id)
    for k in ['asset_id', 'disposal_type', 'disposal_date', 'reason',
              'book_value', 'disposal_value', 'buyer_name', 'buyer_contact',
              'status', 'notes']:
        if k in data:
            val = data[k]
            if k == 'disposal_date' and val and isinstance(val, str):
                val = datetime.strptime(val, '%Y-%m-%d').date()
            setattr(d, k, val)
    db.session.add(d)
    db.session.commit()
    # Update asset status
    asset = Asset.query.get(data.get('asset_id'))
    if asset and data.get('status') == 'completed':
        asset.status = 'disposed'
        db.session.commit()
    return success_response(d.to_dict(), 'Disposal record created', 201)


@inventory_bp.route('/disposals/<int:id>', methods=['PUT'])
@school_required
def update_disposal(id):
    d = AssetDisposal.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['disposal_type', 'disposal_date', 'reason', 'book_value', 'disposal_value',
              'buyer_name', 'buyer_contact', 'status', 'notes']:
        if k in data:
            val = data[k]
            if k == 'disposal_date' and val and isinstance(val, str):
                val = datetime.strptime(val, '%Y-%m-%d').date()
            setattr(d, k, val)
    if data.get('status') == 'approved':
        d.approved_by = g.current_user.id
    if data.get('status') == 'completed':
        asset = Asset.query.get(d.asset_id)
        if asset:
            asset.status = 'disposed'
    db.session.commit()
    return success_response(d.to_dict(), 'Updated')
