from app import db
from datetime import datetime


class CanteenWallet(db.Model):
    __tablename__ = 'canteen_wallet'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    balance = db.Column(db.Numeric(10, 2), default=0)
    daily_limit = db.Column(db.Numeric(10, 2), default=200)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = db.relationship('Student', backref='canteen_wallet')

    def to_dict(self):
        d = {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), datetime) else getattr(self, c.name)) for c in self.__table__.columns}
        d['balance'] = float(self.balance or 0)
        d['daily_limit'] = float(self.daily_limit or 0)
        if self.student:
            d['student_name'] = f"{self.student.first_name} {self.student.last_name}"
        return d


class CanteenMenuItem(db.Model):
    __tablename__ = 'canteen_menu'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))  # snacks, beverages, meals, desserts
    price = db.Column(db.Numeric(10, 2), nullable=False)
    description = db.Column(db.Text)
    calories = db.Column(db.Integer)
    allergens = db.Column(db.Text)  # comma separated
    is_vegetarian = db.Column(db.Boolean, default=True)
    is_available = db.Column(db.Boolean, default=True)
    image_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        d = {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), datetime) else getattr(self, c.name)) for c in self.__table__.columns}
        d['price'] = float(self.price or 0)
        return d


class CanteenTransaction(db.Model):
    __tablename__ = 'canteen_transactions'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    wallet_id = db.Column(db.Integer, db.ForeignKey('canteen_wallet.id'))
    transaction_type = db.Column(db.String(20), nullable=False)  # purchase, topup, refund
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('canteen_menu.id'))
    quantity = db.Column(db.Integer, default=1)
    payment_method = db.Column(db.String(30), default='wallet')  # wallet, cash, card
    reference_no = db.Column(db.String(50))
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('Student', backref='canteen_transactions')
    item = db.relationship('CanteenMenuItem', backref='transactions')

    def to_dict(self):
        d = {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), datetime) else getattr(self, c.name)) for c in self.__table__.columns}
        d['amount'] = float(self.amount or 0)
        if self.student:
            d['student_name'] = f"{self.student.first_name} {self.student.last_name}"
        if self.item:
            d['item_name'] = self.item.name
        return d


class CanteenInventory(db.Model):
    __tablename__ = 'canteen_inventory'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    item_name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    quantity = db.Column(db.Numeric(10, 2), default=0)
    unit = db.Column(db.String(20))  # kg, litre, pieces
    unit_price = db.Column(db.Numeric(10, 2), default=0)
    min_stock = db.Column(db.Numeric(10, 2), default=0)
    supplier = db.Column(db.String(100))
    last_restocked = db.Column(db.Date)
    expiry_date = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        d = {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), datetime) else getattr(self, c.name)) for c in self.__table__.columns}
        d['quantity'] = float(self.quantity or 0)
        d['unit_price'] = float(self.unit_price or 0)
        d['min_stock'] = float(self.min_stock or 0)
        return d


class CanteenVendor(db.Model):
    __tablename__ = 'canteen_vendors'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    contact_person = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    address = db.Column(db.Text)
    supply_items = db.Column(db.Text)
    rating = db.Column(db.Integer)  # 1-5
    fssai_license = db.Column(db.String(50))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), datetime) else getattr(self, c.name)) for c in self.__table__.columns}


class CanteenPreorder(db.Model):
    __tablename__ = 'canteen_preorders'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('canteen_menu.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    order_date = db.Column(db.Date, nullable=False)
    pickup_time = db.Column(db.String(20))
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, ready, picked_up, cancelled
    total_amount = db.Column(db.Numeric(10, 2))
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = db.relationship('Student', backref='canteen_preorders')
    item = db.relationship('CanteenMenuItem', backref='preorders')

    def to_dict(self):
        d = {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), datetime) else getattr(self, c.name)) for c in self.__table__.columns}
        d['total_amount'] = float(self.total_amount or 0)
        if self.student:
            d['student_name'] = f"{self.student.first_name} {self.student.last_name}"
        if self.item:
            d['item_name'] = self.item.name
        return d
