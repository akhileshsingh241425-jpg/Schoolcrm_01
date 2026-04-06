from app import db
from datetime import datetime


class HostelBlock(db.Model):
    __tablename__ = 'hostel_blocks'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20))
    block_type = db.Column(db.String(20), default='boys')  # boys, girls, mixed
    warden_id = db.Column(db.Integer, db.ForeignKey('staff.id'))
    total_floors = db.Column(db.Integer, default=1)
    description = db.Column(db.Text)
    address = db.Column(db.Text)
    contact_number = db.Column(db.String(20))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    rooms = db.relationship('HostelRoom', backref='block', lazy='dynamic')

    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), datetime) else getattr(self, c.name)) for c in self.__table__.columns}


class HostelRoom(db.Model):
    __tablename__ = 'hostel_rooms'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    block_id = db.Column(db.Integer, db.ForeignKey('hostel_blocks.id'), nullable=False)
    room_number = db.Column(db.String(20), nullable=False)
    floor = db.Column(db.Integer, default=0)
    room_type = db.Column(db.String(30), default='shared')  # single, double, shared, dormitory
    capacity = db.Column(db.Integer, default=2)
    current_occupancy = db.Column(db.Integer, default=0)
    amenities = db.Column(db.Text)  # JSON: AC, fan, attached bathroom etc
    monthly_rent = db.Column(db.Numeric(10, 2), default=0)
    status = db.Column(db.String(20), default='available')  # available, full, maintenance, closed
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    allocations = db.relationship('HostelAllocation', backref='room', lazy='dynamic')

    def to_dict(self):
        d = {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), datetime) else getattr(self, c.name)) for c in self.__table__.columns}
        if self.block:
            d['block_name'] = self.block.name
        d['monthly_rent'] = float(self.monthly_rent) if self.monthly_rent else 0
        return d


class HostelAllocation(db.Model):
    __tablename__ = 'hostel_allocations'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('hostel_rooms.id'), nullable=False)
    bed_number = db.Column(db.String(10))
    allocation_date = db.Column(db.Date, nullable=False)
    vacate_date = db.Column(db.Date)
    status = db.Column(db.String(20), default='active')  # active, vacated, transferred
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = db.relationship('Student', backref='hostel_allocations')

    def to_dict(self):
        d = {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), datetime) else getattr(self, c.name)) for c in self.__table__.columns}
        if self.student:
            d['student_name'] = f"{self.student.first_name} {self.student.last_name}"
        if self.room:
            d['room_number'] = self.room.room_number
            d['block_name'] = self.room.block.name if self.room.block else ''
        return d


class MessMenu(db.Model):
    __tablename__ = 'mess_menu'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    day_of_week = db.Column(db.String(15), nullable=False)  # Monday-Sunday
    meal_type = db.Column(db.String(20), nullable=False)  # breakfast, lunch, snacks, dinner
    menu_items = db.Column(db.Text, nullable=False)
    special_diet = db.Column(db.Text)  # veg/non-veg/jain etc
    calories = db.Column(db.Integer)
    effective_from = db.Column(db.Date)
    effective_to = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), datetime) else getattr(self, c.name)) for c in self.__table__.columns}


class MessAttendance(db.Model):
    __tablename__ = 'mess_attendance'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    meal_type = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default='present')  # present, absent, late
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('Student', backref='mess_attendances')

    def to_dict(self):
        d = {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), datetime) else getattr(self, c.name)) for c in self.__table__.columns}
        if self.student:
            d['student_name'] = f"{self.student.first_name} {self.student.last_name}"
        return d


class OutpassRequest(db.Model):
    __tablename__ = 'outpass_requests'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    outpass_type = db.Column(db.String(20), default='day')  # day, night, weekend, emergency
    reason = db.Column(db.Text, nullable=False)
    from_date = db.Column(db.DateTime, nullable=False)
    to_date = db.Column(db.DateTime, nullable=False)
    destination = db.Column(db.String(200))
    guardian_contact = db.Column(db.String(20))
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected, expired, returned
    approved_by = db.Column(db.Integer, db.ForeignKey('staff.id'))
    approved_at = db.Column(db.DateTime)
    actual_return = db.Column(db.DateTime)
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = db.relationship('Student', backref='outpass_requests')

    def to_dict(self):
        d = {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), datetime) else getattr(self, c.name)) for c in self.__table__.columns}
        if self.student:
            d['student_name'] = f"{self.student.first_name} {self.student.last_name}"
        return d


class HostelVisitor(db.Model):
    __tablename__ = 'hostel_visitors'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    visitor_name = db.Column(db.String(100), nullable=False)
    relation = db.Column(db.String(50))
    contact_number = db.Column(db.String(20))
    id_proof_type = db.Column(db.String(30))
    id_proof_number = db.Column(db.String(50))
    visit_date = db.Column(db.Date, nullable=False)
    check_in = db.Column(db.DateTime)
    check_out = db.Column(db.DateTime)
    purpose = db.Column(db.Text)
    status = db.Column(db.String(20), default='checked_in')  # checked_in, checked_out, cancelled
    remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship('Student', backref='hostel_visitors')

    def to_dict(self):
        d = {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), datetime) else getattr(self, c.name)) for c in self.__table__.columns}
        if self.student:
            d['student_name'] = f"{self.student.first_name} {self.student.last_name}"
        return d


class HostelComplaint(db.Model):
    __tablename__ = 'hostel_complaints'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    complaint_type = db.Column(db.String(30), nullable=False)  # maintenance, food, roommate, hygiene, other
    subject = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default='medium')  # low, medium, high, urgent
    status = db.Column(db.String(20), default='open')  # open, in_progress, resolved, closed
    assigned_to = db.Column(db.Integer, db.ForeignKey('staff.id'))
    resolution = db.Column(db.Text)
    resolved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = db.relationship('Student', backref='hostel_complaints')

    def to_dict(self):
        d = {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), datetime) else getattr(self, c.name)) for c in self.__table__.columns}
        if self.student:
            d['student_name'] = f"{self.student.first_name} {self.student.last_name}"
        return d


class HostelInspection(db.Model):
    __tablename__ = 'hostel_inspections'
    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('hostel_rooms.id'), nullable=False)
    inspection_date = db.Column(db.Date, nullable=False)
    inspection_type = db.Column(db.String(30), default='routine')  # routine, surprise, night_round
    inspector_id = db.Column(db.Integer, db.ForeignKey('staff.id'))
    cleanliness_score = db.Column(db.Integer)  # 1-10
    maintenance_score = db.Column(db.Integer)  # 1-10
    discipline_score = db.Column(db.Integer)  # 1-10
    overall_score = db.Column(db.Integer)  # 1-10
    findings = db.Column(db.Text)
    action_taken = db.Column(db.Text)
    status = db.Column(db.String(20), default='completed')  # completed, pending_action, follow_up
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    room = db.relationship('HostelRoom', backref='inspections')

    def to_dict(self):
        d = {c.name: (getattr(self, c.name).isoformat() if isinstance(getattr(self, c.name), datetime) else getattr(self, c.name)) for c in self.__table__.columns}
        if self.room:
            d['room_number'] = self.room.room_number
            d['block_name'] = self.room.block.name if self.room.block else ''
        return d
