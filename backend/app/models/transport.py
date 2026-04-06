from app import db
from datetime import datetime


# ── Vehicle Master ──────────────────────────────────────────────
class Vehicle(db.Model):
    __tablename__ = 'vehicles'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    vehicle_number = db.Column(db.String(50), nullable=False)
    vehicle_type = db.Column(db.String(50), default='bus')  # bus, van, mini_bus, car
    make = db.Column(db.String(100))
    model = db.Column(db.String(100))
    year = db.Column(db.Integer)
    capacity = db.Column(db.Integer, default=40)
    fuel_type = db.Column(db.String(20), default='diesel')  # diesel, petrol, cng, electric
    registration_date = db.Column(db.Date)
    insurance_expiry = db.Column(db.Date)
    fitness_expiry = db.Column(db.Date)
    permit_expiry = db.Column(db.Date)
    pollution_expiry = db.Column(db.Date)
    chassis_number = db.Column(db.String(100))
    engine_number = db.Column(db.String(100))
    gps_device_id = db.Column(db.String(100))
    status = db.Column(db.String(20), default='active')  # active, under_repair, spare, retired
    current_odometer = db.Column(db.Integer, default=0)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'vehicle_number': self.vehicle_number, 'vehicle_type': self.vehicle_type,
            'make': self.make, 'model': self.model, 'year': self.year,
            'capacity': self.capacity, 'fuel_type': self.fuel_type,
            'registration_date': self.registration_date.isoformat() if self.registration_date else None,
            'insurance_expiry': self.insurance_expiry.isoformat() if self.insurance_expiry else None,
            'fitness_expiry': self.fitness_expiry.isoformat() if self.fitness_expiry else None,
            'permit_expiry': self.permit_expiry.isoformat() if self.permit_expiry else None,
            'pollution_expiry': self.pollution_expiry.isoformat() if self.pollution_expiry else None,
            'chassis_number': self.chassis_number, 'engine_number': self.engine_number,
            'gps_device_id': self.gps_device_id, 'status': self.status,
            'current_odometer': self.current_odometer, 'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Driver ──────────────────────────────────────────────────────
class Driver(db.Model):
    __tablename__ = 'drivers'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    license_number = db.Column(db.String(50))
    license_type = db.Column(db.String(20))  # LMV, HMV
    license_expiry = db.Column(db.Date)
    medical_fitness_expiry = db.Column(db.Date)
    aadhar_number = db.Column(db.String(20))
    address = db.Column(db.Text)
    blood_group = db.Column(db.String(10))
    emergency_contact = db.Column(db.String(20))
    experience_years = db.Column(db.Integer, default=0)
    driving_score = db.Column(db.Numeric(5, 2), default=100)
    photo_url = db.Column(db.String(500))
    status = db.Column(db.String(20), default='active')  # active, on_leave, terminated
    joined_date = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'school_id': self.school_id,
            'name': self.name, 'phone': self.phone, 'email': self.email,
            'license_number': self.license_number, 'license_type': self.license_type,
            'license_expiry': self.license_expiry.isoformat() if self.license_expiry else None,
            'medical_fitness_expiry': self.medical_fitness_expiry.isoformat() if self.medical_fitness_expiry else None,
            'aadhar_number': self.aadhar_number, 'address': self.address,
            'blood_group': self.blood_group, 'emergency_contact': self.emergency_contact,
            'experience_years': self.experience_years,
            'driving_score': float(self.driving_score) if self.driving_score else 100,
            'photo_url': self.photo_url, 'status': self.status,
            'joined_date': self.joined_date.isoformat() if self.joined_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Route (enhanced) ───────────────────────────────────────────
class TransportRoute(db.Model):
    __tablename__ = 'transport_routes'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    route_name = db.Column(db.String(255), nullable=False)
    route_code = db.Column(db.String(20))
    description = db.Column(db.Text)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=True)
    driver_id = db.Column(db.Integer, db.ForeignKey('drivers.id'), nullable=True)
    helper_name = db.Column(db.String(100))
    helper_phone = db.Column(db.String(20))
    start_location = db.Column(db.String(255))
    end_location = db.Column(db.String(255))
    total_distance_km = db.Column(db.Numeric(8, 2))
    estimated_time_min = db.Column(db.Integer)
    shift = db.Column(db.String(20), default='morning')  # morning, afternoon, both
    status = db.Column(db.Enum('active', 'inactive'), default='active')
    # Keep legacy columns for backward compat
    vehicle_no = db.Column(db.String(50))
    driver_name = db.Column(db.String(100))
    driver_phone = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    vehicle = db.relationship('Vehicle', backref='routes', foreign_keys=[vehicle_id])
    driver = db.relationship('Driver', backref='routes', foreign_keys=[driver_id])
    stops = db.relationship('TransportStop', backref='route', lazy='dynamic', order_by='TransportStop.stop_order')

    def to_dict(self):
        return {
            'id': self.id, 'route_name': self.route_name, 'route_code': self.route_code,
            'description': self.description,
            'vehicle_id': self.vehicle_id,
            'vehicle': self.vehicle.to_dict() if self.vehicle else None,
            'driver_id': self.driver_id,
            'driver': self.driver.to_dict() if self.driver else None,
            'vehicle_no': self.vehicle_no, 'driver_name': self.driver_name, 'driver_phone': self.driver_phone,
            'helper_name': self.helper_name, 'helper_phone': self.helper_phone,
            'start_location': self.start_location, 'end_location': self.end_location,
            'total_distance_km': float(self.total_distance_km) if self.total_distance_km else None,
            'estimated_time_min': self.estimated_time_min, 'shift': self.shift,
            'status': self.status,
            'stops': [s.to_dict() for s in self.stops.all()],
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Route Stop (enhanced) ─────────────────────────────────────
class TransportStop(db.Model):
    __tablename__ = 'transport_stops'

    id = db.Column(db.Integer, primary_key=True)
    route_id = db.Column(db.Integer, db.ForeignKey('transport_routes.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    stop_name = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Numeric(10, 7))
    longitude = db.Column(db.Numeric(10, 7))
    pickup_time = db.Column(db.Time)
    drop_time = db.Column(db.Time)
    fare = db.Column(db.Numeric(12, 2))
    stop_order = db.Column(db.Integer)
    radius_meters = db.Column(db.Integer, default=100)  # pickup/drop zone radius

    def to_dict(self):
        return {
            'id': self.id, 'route_id': self.route_id,
            'stop_name': self.stop_name,
            'latitude': float(self.latitude) if self.latitude else None,
            'longitude': float(self.longitude) if self.longitude else None,
            'pickup_time': self.pickup_time.isoformat() if self.pickup_time else None,
            'drop_time': self.drop_time.isoformat() if self.drop_time else None,
            'fare': float(self.fare) if self.fare else None,
            'stop_order': self.stop_order,
            'radius_meters': self.radius_meters,
        }


# ── Student-Route-Stop Mapping (enhanced) ─────────────────────
class StudentTransport(db.Model):
    __tablename__ = 'student_transport'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    route_id = db.Column(db.Integer, db.ForeignKey('transport_routes.id', ondelete='CASCADE'), nullable=False)
    stop_id = db.Column(db.Integer, db.ForeignKey('transport_stops.id', ondelete='CASCADE'), nullable=False)
    pickup_type = db.Column(db.Enum('both', 'pickup_only', 'drop_only'), default='both')
    rfid_card_no = db.Column(db.String(50))
    effective_from = db.Column(db.Date)
    effective_to = db.Column(db.Date)
    status = db.Column(db.String(20), default='active')

    student = db.relationship('Student', backref='transport')
    route = db.relationship('TransportRoute')
    stop = db.relationship('TransportStop')

    def to_dict(self):
        return {
            'id': self.id, 'student_id': self.student_id,
            'route': self.route.to_dict() if self.route else None,
            'stop': self.stop.to_dict() if self.stop else None,
            'pickup_type': self.pickup_type, 'rfid_card_no': self.rfid_card_no,
            'effective_from': self.effective_from.isoformat() if self.effective_from else None,
            'effective_to': self.effective_to.isoformat() if self.effective_to else None,
            'status': self.status,
        }


# ── GPS Tracking ───────────────────────────────────────────────
class GPSTracking(db.Model):
    __tablename__ = 'gps_tracking'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id', ondelete='CASCADE'), nullable=False)
    latitude = db.Column(db.Numeric(10, 7), nullable=False)
    longitude = db.Column(db.Numeric(10, 7), nullable=False)
    speed_kmh = db.Column(db.Numeric(6, 2), default=0)
    heading = db.Column(db.Integer)  # 0-360 degrees
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_overspeeding = db.Column(db.Boolean, default=False)

    vehicle = db.relationship('Vehicle', backref='gps_points')

    def to_dict(self):
        return {
            'id': self.id, 'vehicle_id': self.vehicle_id,
            'latitude': float(self.latitude), 'longitude': float(self.longitude),
            'speed_kmh': float(self.speed_kmh) if self.speed_kmh else 0,
            'heading': self.heading,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'is_overspeeding': self.is_overspeeding,
        }


# ── Vehicle Maintenance ───────────────────────────────────────
class VehicleMaintenance(db.Model):
    __tablename__ = 'vehicle_maintenance'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id', ondelete='CASCADE'), nullable=False)
    maintenance_type = db.Column(db.String(50), nullable=False)  # scheduled, repair, emergency, inspection
    description = db.Column(db.Text)
    vendor_name = db.Column(db.String(200))
    cost = db.Column(db.Numeric(12, 2), default=0)
    odometer_reading = db.Column(db.Integer)
    scheduled_date = db.Column(db.Date)
    completed_date = db.Column(db.Date)
    next_due_date = db.Column(db.Date)
    next_due_km = db.Column(db.Integer)
    status = db.Column(db.String(20), default='scheduled')  # scheduled, in_progress, completed, cancelled
    invoice_no = db.Column(db.String(50))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    vehicle = db.relationship('Vehicle', backref='maintenance_records')

    def to_dict(self):
        return {
            'id': self.id, 'vehicle_id': self.vehicle_id,
            'maintenance_type': self.maintenance_type, 'description': self.description,
            'vendor_name': self.vendor_name,
            'cost': float(self.cost) if self.cost else 0,
            'odometer_reading': self.odometer_reading,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'completed_date': self.completed_date.isoformat() if self.completed_date else None,
            'next_due_date': self.next_due_date.isoformat() if self.next_due_date else None,
            'next_due_km': self.next_due_km, 'status': self.status,
            'invoice_no': self.invoice_no, 'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Fuel Logs ──────────────────────────────────────────────────
class FuelLog(db.Model):
    __tablename__ = 'fuel_logs'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id', ondelete='CASCADE'), nullable=False)
    fill_date = db.Column(db.Date, nullable=False)
    fuel_type = db.Column(db.String(20), default='diesel')
    quantity_liters = db.Column(db.Numeric(8, 2), nullable=False)
    rate_per_liter = db.Column(db.Numeric(8, 2))
    total_cost = db.Column(db.Numeric(12, 2))
    odometer_reading = db.Column(db.Integer)
    mileage_kmpl = db.Column(db.Numeric(6, 2))
    pump_name = db.Column(db.String(200))
    receipt_no = db.Column(db.String(50))
    filled_by = db.Column(db.String(100))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    vehicle = db.relationship('Vehicle', backref='fuel_logs')

    def to_dict(self):
        return {
            'id': self.id, 'vehicle_id': self.vehicle_id,
            'fill_date': self.fill_date.isoformat() if self.fill_date else None,
            'fuel_type': self.fuel_type,
            'quantity_liters': float(self.quantity_liters) if self.quantity_liters else 0,
            'rate_per_liter': float(self.rate_per_liter) if self.rate_per_liter else 0,
            'total_cost': float(self.total_cost) if self.total_cost else 0,
            'odometer_reading': self.odometer_reading,
            'mileage_kmpl': float(self.mileage_kmpl) if self.mileage_kmpl else None,
            'pump_name': self.pump_name, 'receipt_no': self.receipt_no,
            'filled_by': self.filled_by, 'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Transport Fees ────────────────────────────────────────────
class TransportFee(db.Model):
    __tablename__ = 'transport_fees'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    route_id = db.Column(db.Integer, db.ForeignKey('transport_routes.id'), nullable=True)
    stop_id = db.Column(db.Integer, db.ForeignKey('transport_stops.id'), nullable=True)
    academic_year = db.Column(db.String(20))
    fee_type = db.Column(db.String(20), default='monthly')  # monthly, quarterly, yearly
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    distance_based = db.Column(db.Boolean, default=False)
    distance_km = db.Column(db.Numeric(8, 2))
    rate_per_km = db.Column(db.Numeric(8, 2))
    effective_from = db.Column(db.Date)
    effective_to = db.Column(db.Date)
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    route = db.relationship('TransportRoute', backref='fee_structures')
    stop = db.relationship('TransportStop', backref='fee_structures')

    def to_dict(self):
        return {
            'id': self.id, 'route_id': self.route_id, 'stop_id': self.stop_id,
            'academic_year': self.academic_year, 'fee_type': self.fee_type,
            'amount': float(self.amount) if self.amount else 0,
            'distance_based': self.distance_based,
            'distance_km': float(self.distance_km) if self.distance_km else None,
            'rate_per_km': float(self.rate_per_km) if self.rate_per_km else None,
            'effective_from': self.effective_from.isoformat() if self.effective_from else None,
            'effective_to': self.effective_to.isoformat() if self.effective_to else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── SOS Alerts ────────────────────────────────────────────────
class SOSAlert(db.Model):
    __tablename__ = 'sos_alerts'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=True)
    route_id = db.Column(db.Integer, db.ForeignKey('transport_routes.id'), nullable=True)
    driver_id = db.Column(db.Integer, db.ForeignKey('drivers.id'), nullable=True)
    alert_type = db.Column(db.String(30), nullable=False)  # panic, accident, breakdown, medical, overspeed
    description = db.Column(db.Text)
    latitude = db.Column(db.Numeric(10, 7))
    longitude = db.Column(db.Numeric(10, 7))
    triggered_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    resolved_at = db.Column(db.DateTime)
    resolution_notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='active')  # active, acknowledged, resolved
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    vehicle = db.relationship('Vehicle', backref='sos_alerts')
    route = db.relationship('TransportRoute', backref='sos_alerts')
    driver = db.relationship('Driver', backref='sos_alerts')

    def to_dict(self):
        return {
            'id': self.id, 'vehicle_id': self.vehicle_id,
            'route_id': self.route_id, 'driver_id': self.driver_id,
            'alert_type': self.alert_type, 'description': self.description,
            'latitude': float(self.latitude) if self.latitude else None,
            'longitude': float(self.longitude) if self.longitude else None,
            'triggered_by': self.triggered_by, 'resolved_by': self.resolved_by,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'resolution_notes': self.resolution_notes, 'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Trip Management (field trips etc.) ────────────────────────
class TripManagement(db.Model):
    __tablename__ = 'trip_management'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    trip_name = db.Column(db.String(255), nullable=False)
    trip_type = db.Column(db.String(30), default='field_trip')  # field_trip, sports, exam_center, special_event
    destination = db.Column(db.String(255))
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=True)
    driver_id = db.Column(db.Integer, db.ForeignKey('drivers.id'), nullable=True)
    departure_datetime = db.Column(db.DateTime)
    return_datetime = db.Column(db.DateTime)
    total_students = db.Column(db.Integer, default=0)
    total_staff = db.Column(db.Integer, default=0)
    estimated_cost = db.Column(db.Numeric(12, 2))
    actual_cost = db.Column(db.Numeric(12, 2))
    organizer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='planned')  # planned, approved, in_progress, completed, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    vehicle = db.relationship('Vehicle', backref='trips')
    driver = db.relationship('Driver', backref='trips')

    def to_dict(self):
        return {
            'id': self.id, 'trip_name': self.trip_name, 'trip_type': self.trip_type,
            'destination': self.destination,
            'vehicle_id': self.vehicle_id, 'driver_id': self.driver_id,
            'departure_datetime': self.departure_datetime.isoformat() if self.departure_datetime else None,
            'return_datetime': self.return_datetime.isoformat() if self.return_datetime else None,
            'total_students': self.total_students, 'total_staff': self.total_staff,
            'estimated_cost': float(self.estimated_cost) if self.estimated_cost else 0,
            'actual_cost': float(self.actual_cost) if self.actual_cost else 0,
            'organizer_id': self.organizer_id, 'notes': self.notes, 'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Route Change Request ─────────────────────────────────────
class RouteChangeRequest(db.Model):
    __tablename__ = 'route_change_requests'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=True)
    current_route_id = db.Column(db.Integer, db.ForeignKey('transport_routes.id'), nullable=True)
    requested_route_id = db.Column(db.Integer, db.ForeignKey('transport_routes.id'), nullable=True)
    current_stop_id = db.Column(db.Integer, db.ForeignKey('transport_stops.id'), nullable=True)
    requested_stop_id = db.Column(db.Integer, db.ForeignKey('transport_stops.id'), nullable=True)
    reason = db.Column(db.Text)
    requested_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    effective_date = db.Column(db.Date)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    admin_remarks = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id, 'student_id': self.student_id,
            'current_route_id': self.current_route_id, 'requested_route_id': self.requested_route_id,
            'current_stop_id': self.current_stop_id, 'requested_stop_id': self.requested_stop_id,
            'reason': self.reason, 'requested_by': self.requested_by,
            'approved_by': self.approved_by,
            'effective_date': self.effective_date.isoformat() if self.effective_date else None,
            'status': self.status, 'admin_remarks': self.admin_remarks,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ── Speed Alert ───────────────────────────────────────────────
class SpeedAlert(db.Model):
    __tablename__ = 'speed_alerts'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id', ondelete='CASCADE'), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey('drivers.id'), nullable=True)
    speed_kmh = db.Column(db.Numeric(6, 2), nullable=False)
    speed_limit_kmh = db.Column(db.Numeric(6, 2), default=60)
    latitude = db.Column(db.Numeric(10, 7))
    longitude = db.Column(db.Numeric(10, 7))
    location_name = db.Column(db.String(255))
    acknowledged = db.Column(db.Boolean, default=False)
    acknowledged_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    vehicle = db.relationship('Vehicle', backref='speed_alerts')

    def to_dict(self):
        return {
            'id': self.id, 'vehicle_id': self.vehicle_id, 'driver_id': self.driver_id,
            'speed_kmh': float(self.speed_kmh) if self.speed_kmh else 0,
            'speed_limit_kmh': float(self.speed_limit_kmh) if self.speed_limit_kmh else 60,
            'latitude': float(self.latitude) if self.latitude else None,
            'longitude': float(self.longitude) if self.longitude else None,
            'location_name': self.location_name,
            'acknowledged': self.acknowledged,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
