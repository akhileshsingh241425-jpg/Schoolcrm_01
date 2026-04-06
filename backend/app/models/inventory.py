from app import db
from datetime import datetime


# ── Asset Category ─────────────────────────────────────────────
class AssetCategory(db.Model):
    __tablename__ = 'asset_categories'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    parent_id = db.Column(db.Integer, db.ForeignKey('asset_categories.id'), nullable=True)
    depreciation_rate = db.Column(db.Numeric(5, 2))  # annual %
    useful_life_years = db.Column(db.Integer)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'name': self.name, 'description': self.description,
            'parent_id': self.parent_id,
            'depreciation_rate': float(self.depreciation_rate) if self.depreciation_rate else None,
            'useful_life_years': self.useful_life_years,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Asset (Master Register) ───────────────────────────────────
class Asset(db.Model):
    __tablename__ = 'assets'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('asset_categories.id'), nullable=True)
    asset_code = db.Column(db.String(50))  # QR/barcode
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    asset_type = db.Column(db.String(50), default='fixed')  # fixed, it, furniture, lab, sports, vehicle
    brand = db.Column(db.String(100))
    model = db.Column(db.String(100))
    serial_number = db.Column(db.String(100))
    purchase_date = db.Column(db.Date)
    purchase_price = db.Column(db.Numeric(12, 2))
    vendor_id = db.Column(db.Integer)
    warranty_expiry = db.Column(db.Date)
    warranty_details = db.Column(db.Text)
    location = db.Column(db.String(200))
    room_number = db.Column(db.String(50))
    assigned_to = db.Column(db.String(100))  # person or dept
    condition = db.Column(db.String(30), default='good')  # new, good, fair, poor, damaged, condemned
    status = db.Column(db.String(30), default='active')  # active, in_repair, disposed, lost, transferred
    current_value = db.Column(db.Numeric(12, 2))
    depreciation_method = db.Column(db.String(30), default='straight_line')
    salvage_value = db.Column(db.Numeric(12, 2))
    useful_life_years = db.Column(db.Integer)
    last_audit_date = db.Column(db.Date)
    photo_url = db.Column(db.String(255))
    qr_code_url = db.Column(db.String(255))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'category_id': self.category_id, 'asset_code': self.asset_code,
            'name': self.name, 'description': self.description,
            'asset_type': self.asset_type, 'brand': self.brand, 'model': self.model,
            'serial_number': self.serial_number,
            'purchase_date': self.purchase_date.isoformat() if self.purchase_date else None,
            'purchase_price': float(self.purchase_price) if self.purchase_price else None,
            'vendor_id': self.vendor_id,
            'warranty_expiry': self.warranty_expiry.isoformat() if self.warranty_expiry else None,
            'warranty_details': self.warranty_details,
            'location': self.location, 'room_number': self.room_number,
            'assigned_to': self.assigned_to,
            'condition': self.condition, 'status': self.status,
            'current_value': float(self.current_value) if self.current_value else None,
            'depreciation_method': self.depreciation_method,
            'salvage_value': float(self.salvage_value) if self.salvage_value else None,
            'useful_life_years': self.useful_life_years,
            'last_audit_date': self.last_audit_date.isoformat() if self.last_audit_date else None,
            'photo_url': self.photo_url, 'qr_code_url': self.qr_code_url,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


# ── Asset Maintenance ──────────────────────────────────────────
class AssetMaintenance(db.Model):
    __tablename__ = 'asset_maintenance'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id', ondelete='CASCADE'), nullable=False)
    maintenance_type = db.Column(db.String(50), default='repair')  # repair, service, upgrade, inspection
    description = db.Column(db.Text, nullable=False)
    reported_date = db.Column(db.Date, nullable=False)
    scheduled_date = db.Column(db.Date)
    completed_date = db.Column(db.Date)
    vendor_name = db.Column(db.String(200))
    cost = db.Column(db.Numeric(12, 2))
    status = db.Column(db.String(30), default='pending')  # pending, in_progress, completed, cancelled
    priority = db.Column(db.String(20), default='medium')  # low, medium, high, urgent
    technician = db.Column(db.String(100))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'asset_id': self.asset_id,
            'maintenance_type': self.maintenance_type,
            'description': self.description,
            'reported_date': self.reported_date.isoformat() if self.reported_date else None,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'completed_date': self.completed_date.isoformat() if self.completed_date else None,
            'vendor_name': self.vendor_name,
            'cost': float(self.cost) if self.cost else None,
            'status': self.status, 'priority': self.priority,
            'technician': self.technician, 'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Inventory Category (kept for backward compat) ─────────────
class InventoryCategory(db.Model):
    __tablename__ = 'inventory_categories'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'name': self.name, 'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Inventory Item (Consumable Stock) ─────────────────────────
class InventoryItem(db.Model):
    __tablename__ = 'inventory_items'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('inventory_categories.id', ondelete='CASCADE'), nullable=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    sku = db.Column(db.String(50))
    quantity = db.Column(db.Integer, default=0)
    unit = db.Column(db.String(50))
    unit_price = db.Column(db.Numeric(12, 2))
    min_stock_level = db.Column(db.Integer, default=0)
    max_stock_level = db.Column(db.Integer)
    reorder_quantity = db.Column(db.Integer)
    location = db.Column(db.String(100))
    expiry_date = db.Column(db.Date)
    is_lab_item = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = db.relationship('InventoryCategory', backref='items')

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'category_id': self.category_id,
            'name': self.name, 'description': self.description,
            'sku': self.sku, 'quantity': self.quantity,
            'unit': self.unit,
            'unit_price': float(self.unit_price) if self.unit_price else None,
            'min_stock_level': self.min_stock_level,
            'max_stock_level': self.max_stock_level,
            'reorder_quantity': self.reorder_quantity,
            'location': self.location,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'is_lab_item': self.is_lab_item,
            'is_active': self.is_active,
            'category_name': self.category.name if self.category else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Inventory Transaction ─────────────────────────────────────
class InventoryTransaction(db.Model):
    __tablename__ = 'inventory_transactions'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('inventory_items.id', ondelete='CASCADE'), nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)  # in, out, adjustment, return
    quantity = db.Column(db.Integer, nullable=False)
    reference_type = db.Column(db.String(50))  # purchase_order, manual, issue, return
    reference_id = db.Column(db.Integer)
    issued_to = db.Column(db.String(200))
    remarks = db.Column(db.String(255))
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    item = db.relationship('InventoryItem', backref='transactions')

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'item_id': self.item_id,
            'item_name': self.item.name if self.item else None,
            'transaction_type': self.transaction_type,
            'quantity': self.quantity,
            'reference_type': self.reference_type,
            'reference_id': self.reference_id,
            'issued_to': self.issued_to,
            'remarks': self.remarks,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Purchase Request ───────────────────────────────────────────
class PurchaseRequest(db.Model):
    __tablename__ = 'purchase_requests'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    request_number = db.Column(db.String(50))
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    request_type = db.Column(db.String(30), default='manual')  # manual, auto_reorder
    priority = db.Column(db.String(20), default='medium')  # low, medium, high, urgent
    requested_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    department = db.Column(db.String(100))
    items_json = db.Column(db.Text)  # JSON: [{item_name, qty, est_price}]
    estimated_total = db.Column(db.Numeric(12, 2))
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_at = db.Column(db.DateTime)
    status = db.Column(db.String(30), default='pending')  # pending, approved, rejected, converted, cancelled
    rejection_reason = db.Column(db.Text)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'request_number': self.request_number, 'title': self.title,
            'description': self.description, 'request_type': self.request_type,
            'priority': self.priority, 'requested_by': self.requested_by,
            'department': self.department, 'items_json': self.items_json,
            'estimated_total': float(self.estimated_total) if self.estimated_total else None,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'status': self.status, 'rejection_reason': self.rejection_reason,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Purchase Order ─────────────────────────────────────────────
class PurchaseOrderInv(db.Model):
    __tablename__ = 'purchase_orders_inv'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    po_number = db.Column(db.String(50))
    purchase_request_id = db.Column(db.Integer, db.ForeignKey('purchase_requests.id'), nullable=True)
    vendor_name = db.Column(db.String(200), nullable=False)
    vendor_contact = db.Column(db.String(100))
    vendor_email = db.Column(db.String(120))
    vendor_address = db.Column(db.Text)
    order_date = db.Column(db.Date, nullable=False)
    expected_delivery = db.Column(db.Date)
    actual_delivery = db.Column(db.Date)
    items_json = db.Column(db.Text)  # JSON: [{item_name, qty, unit_price, total}]
    subtotal = db.Column(db.Numeric(12, 2))
    tax_amount = db.Column(db.Numeric(12, 2))
    discount_amount = db.Column(db.Numeric(12, 2))
    total_amount = db.Column(db.Numeric(12, 2))
    payment_terms = db.Column(db.String(200))
    delivery_terms = db.Column(db.String(200))
    quality_check = db.Column(db.Boolean, default=False)
    quality_notes = db.Column(db.Text)
    status = db.Column(db.String(30), default='draft')  # draft, sent, confirmed, delivered, inspected, completed, cancelled
    notes = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'po_number': self.po_number,
            'purchase_request_id': self.purchase_request_id,
            'vendor_name': self.vendor_name, 'vendor_contact': self.vendor_contact,
            'vendor_email': self.vendor_email, 'vendor_address': self.vendor_address,
            'order_date': self.order_date.isoformat() if self.order_date else None,
            'expected_delivery': self.expected_delivery.isoformat() if self.expected_delivery else None,
            'actual_delivery': self.actual_delivery.isoformat() if self.actual_delivery else None,
            'items_json': self.items_json,
            'subtotal': float(self.subtotal) if self.subtotal else None,
            'tax_amount': float(self.tax_amount) if self.tax_amount else None,
            'discount_amount': float(self.discount_amount) if self.discount_amount else None,
            'total_amount': float(self.total_amount) if self.total_amount else None,
            'payment_terms': self.payment_terms,
            'delivery_terms': self.delivery_terms,
            'quality_check': self.quality_check,
            'quality_notes': self.quality_notes,
            'status': self.status, 'notes': self.notes,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Vendor Quotation ──────────────────────────────────────────
class VendorQuotation(db.Model):
    __tablename__ = 'vendor_quotations'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    purchase_request_id = db.Column(db.Integer, db.ForeignKey('purchase_requests.id'), nullable=True)
    vendor_name = db.Column(db.String(200), nullable=False)
    vendor_contact = db.Column(db.String(100))
    vendor_email = db.Column(db.String(120))
    quotation_number = db.Column(db.String(50))
    quotation_date = db.Column(db.Date)
    valid_until = db.Column(db.Date)
    items_json = db.Column(db.Text)  # JSON: [{item_name, qty, unit_price, total}]
    total_amount = db.Column(db.Numeric(12, 2))
    delivery_days = db.Column(db.Integer)
    payment_terms = db.Column(db.String(200))
    warranty_terms = db.Column(db.String(200))
    rating = db.Column(db.Integer)  # 1-5
    is_selected = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'purchase_request_id': self.purchase_request_id,
            'vendor_name': self.vendor_name, 'vendor_contact': self.vendor_contact,
            'vendor_email': self.vendor_email,
            'quotation_number': self.quotation_number,
            'quotation_date': self.quotation_date.isoformat() if self.quotation_date else None,
            'valid_until': self.valid_until.isoformat() if self.valid_until else None,
            'items_json': self.items_json,
            'total_amount': float(self.total_amount) if self.total_amount else None,
            'delivery_days': self.delivery_days,
            'payment_terms': self.payment_terms,
            'warranty_terms': self.warranty_terms,
            'rating': self.rating, 'is_selected': self.is_selected,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Asset Disposal ─────────────────────────────────────────────
class AssetDisposal(db.Model):
    __tablename__ = 'asset_disposals'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id', ondelete='CASCADE'), nullable=False)
    disposal_type = db.Column(db.String(30), nullable=False)  # condemn, auction, donate, recycle, sell
    disposal_date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    book_value = db.Column(db.Numeric(12, 2))
    disposal_value = db.Column(db.Numeric(12, 2))
    buyer_name = db.Column(db.String(200))
    buyer_contact = db.Column(db.String(100))
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    certificate_url = db.Column(db.String(255))
    status = db.Column(db.String(30), default='pending')  # pending, approved, completed, cancelled
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'asset_id': self.asset_id,
            'disposal_type': self.disposal_type,
            'disposal_date': self.disposal_date.isoformat() if self.disposal_date else None,
            'reason': self.reason,
            'book_value': float(self.book_value) if self.book_value else None,
            'disposal_value': float(self.disposal_value) if self.disposal_value else None,
            'buyer_name': self.buyer_name, 'buyer_contact': self.buyer_contact,
            'approved_by': self.approved_by,
            'certificate_url': self.certificate_url,
            'status': self.status, 'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
