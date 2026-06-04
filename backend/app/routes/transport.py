from flask import Blueprint, request, g
from app import db
from app.models.transport import (
    Vehicle, Driver, TransportRoute, TransportStop, StudentTransport,
    GPSTracking, VehicleMaintenance, FuelLog, TransportFee,
    SOSAlert, TripManagement, RouteChangeRequest, SpeedAlert
)
from app.utils.decorators import school_required, role_required, feature_required
from app.utils.helpers import success_response, error_response, paginate
from sqlalchemy.orm import joinedload, subqueryload
from datetime import datetime

transport_bp = Blueprint('transport', __name__)


# ═══════════════════════════════════════════════════════════════
# FLEET DASHBOARD
# ═══════════════════════════════════════════════════════════════
@transport_bp.route('/dashboard', methods=['GET'])
@school_required
@feature_required('transport')
def fleet_dashboard():
    sid = g.school_id
    total_vehicles = Vehicle.query.filter_by(school_id=sid).count()
    active_vehicles = Vehicle.query.filter_by(school_id=sid, status='active').count()
    under_repair = Vehicle.query.filter_by(school_id=sid, status='under_repair').count()
    spare_vehicles = Vehicle.query.filter_by(school_id=sid, status='spare').count()
    total_drivers = Driver.query.filter_by(school_id=sid, status='active').count()
    total_routes = TransportRoute.query.filter_by(school_id=sid, status='active').count()
    total_students = StudentTransport.query.filter_by(school_id=sid, status='active').count()
    active_sos = SOSAlert.query.filter_by(school_id=sid, status='active').count()
    pending_maintenance = VehicleMaintenance.query.filter_by(school_id=sid, status='scheduled').count()
    active_trips = TripManagement.query.filter(TripManagement.school_id == sid, TripManagement.status.in_(['planned', 'approved', 'in_progress'])).count()
    pending_requests = RouteChangeRequest.query.filter_by(school_id=sid, status='pending').count()
    speed_alerts_today = SpeedAlert.query.filter(
        SpeedAlert.school_id == sid,
        SpeedAlert.acknowledged == False,
    ).count()
    return success_response({
        'total_vehicles': total_vehicles, 'active_vehicles': active_vehicles,
        'under_repair': under_repair, 'spare_vehicles': spare_vehicles,
        'total_drivers': total_drivers, 'total_routes': total_routes,
        'total_students': total_students, 'active_sos': active_sos,
        'pending_maintenance': pending_maintenance, 'active_trips': active_trips,
        'pending_requests': pending_requests, 'speed_alerts_today': speed_alerts_today,
    })


# ═══════════════════════════════════════════════════════════════
# VEHICLES CRUD
# ═══════════════════════════════════════════════════════════════
@transport_bp.route('/vehicles', methods=['GET'])
@school_required
@feature_required('transport')
def list_vehicles():
    query = Vehicle.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(Vehicle.created_at.desc())
    return success_response(paginate(query))


@transport_bp.route('/vehicles', methods=['POST'])
@role_required('school_admin', 'transport_manager', 'principal')
def create_vehicle():
    data = request.get_json()
    v = Vehicle(school_id=g.school_id, vehicle_number=data['vehicle_number'])
    for f in ['vehicle_type', 'make', 'model', 'year', 'capacity', 'fuel_type',
              'registration_date', 'insurance_expiry', 'fitness_expiry', 'permit_expiry',
              'pollution_expiry', 'chassis_number', 'engine_number', 'gps_device_id',
              'status', 'current_odometer', 'notes']:
        if f in data:
            setattr(v, f, data[f])
    db.session.add(v)
    db.session.commit()
    return success_response(v.to_dict(), 'Vehicle created', 201)


@transport_bp.route('/vehicles/<int:vid>', methods=['GET'])
@school_required
@feature_required('transport')
def get_vehicle(vid):
    v = Vehicle.query.filter_by(id=vid, school_id=g.school_id).first()
    if not v:
        return error_response('Vehicle not found', 404)
    return success_response(v.to_dict())


@transport_bp.route('/vehicles/<int:vid>', methods=['PUT'])
@role_required('school_admin', 'transport_manager', 'principal')
def update_vehicle(vid):
    v = Vehicle.query.filter_by(id=vid, school_id=g.school_id).first()
    if not v:
        return error_response('Vehicle not found', 404)
    data = request.get_json()
    for f in ['vehicle_number', 'vehicle_type', 'make', 'model', 'year', 'capacity',
              'fuel_type', 'registration_date', 'insurance_expiry', 'fitness_expiry',
              'permit_expiry', 'pollution_expiry', 'chassis_number', 'engine_number',
              'gps_device_id', 'status', 'current_odometer', 'notes']:
        if f in data:
            setattr(v, f, data[f])
    db.session.commit()
    return success_response(v.to_dict(), 'Vehicle updated')


@transport_bp.route('/vehicles/<int:vid>', methods=['DELETE'])
@role_required('school_admin', 'principal')
def delete_vehicle(vid):
    v = Vehicle.query.filter_by(id=vid, school_id=g.school_id).first()
    if not v:
        return error_response('Vehicle not found', 404)
    db.session.delete(v)
    db.session.commit()
    return success_response(None, 'Vehicle deleted')


# ═══════════════════════════════════════════════════════════════
# DRIVERS CRUD
# ═══════════════════════════════════════════════════════════════
@transport_bp.route('/drivers', methods=['GET'])
@school_required
@feature_required('transport')
def list_drivers():
    query = Driver.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(Driver.name)
    return success_response(paginate(query))


@transport_bp.route('/drivers', methods=['POST'])
@role_required('school_admin', 'transport_manager', 'principal')
def create_driver():
    data = request.get_json()
    d = Driver(school_id=g.school_id, name=data['name'])
    for f in ['phone', 'email', 'license_number', 'license_type', 'license_expiry',
              'medical_fitness_expiry', 'aadhar_number', 'address', 'blood_group',
              'emergency_contact', 'experience_years', 'driving_score', 'photo_url',
              'status', 'joined_date']:
        if f in data:
            setattr(d, f, data[f])
    db.session.add(d)
    db.session.commit()
    return success_response(d.to_dict(), 'Driver created', 201)


@transport_bp.route('/drivers/<int:did>', methods=['GET'])
@school_required
@feature_required('transport')
def get_driver(did):
    d = Driver.query.filter_by(id=did, school_id=g.school_id).first()
    if not d:
        return error_response('Driver not found', 404)
    return success_response(d.to_dict())


@transport_bp.route('/drivers/<int:did>', methods=['PUT'])
@role_required('school_admin', 'transport_manager', 'principal')
def update_driver(did):
    d = Driver.query.filter_by(id=did, school_id=g.school_id).first()
    if not d:
        return error_response('Driver not found', 404)
    data = request.get_json()
    for f in ['name', 'phone', 'email', 'license_number', 'license_type', 'license_expiry',
              'medical_fitness_expiry', 'aadhar_number', 'address', 'blood_group',
              'emergency_contact', 'experience_years', 'driving_score', 'photo_url',
              'status', 'joined_date']:
        if f in data:
            setattr(d, f, data[f])
    db.session.commit()
    return success_response(d.to_dict(), 'Driver updated')


@transport_bp.route('/drivers/<int:did>', methods=['DELETE'])
@role_required('school_admin', 'principal')
def delete_driver(did):
    d = Driver.query.filter_by(id=did, school_id=g.school_id).first()
    if not d:
        return error_response('Driver not found', 404)
    db.session.delete(d)
    db.session.commit()
    return success_response(None, 'Driver deleted')


# ═══════════════════════════════════════════════════════════════
# ROUTES CRUD (enhanced existing)
# ═══════════════════════════════════════════════════════════════
@transport_bp.route('/routes', methods=['GET'])
@school_required
@feature_required('transport')
def list_routes():
    query = TransportRoute.query.options(
        joinedload(TransportRoute.vehicle),
        joinedload(TransportRoute.driver)
    ).filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(TransportRoute.route_name)
    return success_response(paginate(query))


@transport_bp.route('/routes', methods=['POST'])
@role_required('school_admin', 'transport_manager', 'principal')
def create_route():
    data = request.get_json()
    route = TransportRoute(school_id=g.school_id, route_name=data['route_name'])
    for f in ['route_code', 'description', 'vehicle_id', 'driver_id', 'helper_name',
              'helper_phone', 'start_location', 'end_location', 'total_distance_km',
              'estimated_time_min', 'shift', 'status', 'vehicle_no', 'driver_name', 'driver_phone']:
        if f in data:
            setattr(route, f, data[f])
    db.session.add(route)
    db.session.commit()
    return success_response(route.to_dict(), 'Route created', 201)


@transport_bp.route('/routes/<int:route_id>', methods=['GET'])
@school_required
@feature_required('transport')
def get_route(route_id):
    route = TransportRoute.query.filter_by(id=route_id, school_id=g.school_id).first()
    if not route:
        return error_response('Route not found', 404)
    return success_response(route.to_dict())


@transport_bp.route('/routes/<int:route_id>', methods=['PUT'])
@role_required('school_admin', 'transport_manager', 'principal')
def update_route(route_id):
    route = TransportRoute.query.filter_by(id=route_id, school_id=g.school_id).first()
    if not route:
        return error_response('Route not found', 404)
    data = request.get_json()
    for f in ['route_name', 'route_code', 'description', 'vehicle_id', 'driver_id',
              'helper_name', 'helper_phone', 'start_location', 'end_location',
              'total_distance_km', 'estimated_time_min', 'shift', 'status',
              'vehicle_no', 'driver_name', 'driver_phone']:
        if f in data:
            setattr(route, f, data[f])
    db.session.commit()
    return success_response(route.to_dict(), 'Route updated')


@transport_bp.route('/routes/<int:route_id>', methods=['DELETE'])
@role_required('school_admin', 'principal')
def delete_route(route_id):
    route = TransportRoute.query.filter_by(id=route_id, school_id=g.school_id).first()
    if not route:
        return error_response('Route not found', 404)
    db.session.delete(route)
    db.session.commit()
    return success_response(None, 'Route deleted')


# ── Route Stops ───────────────────────────────────────────────
@transport_bp.route('/routes/<int:route_id>/stops', methods=['GET'])
@school_required
@feature_required('transport')
def list_stops(route_id):
    stops = TransportStop.query.filter_by(route_id=route_id, school_id=g.school_id).order_by(TransportStop.stop_order).all()
    return success_response([s.to_dict() for s in stops])


@transport_bp.route('/routes/<int:route_id>/stops', methods=['POST'])
@role_required('school_admin', 'transport_manager', 'principal')
def add_stop(route_id):
    data = request.get_json()
    stop = TransportStop(route_id=route_id, school_id=g.school_id, stop_name=data['stop_name'])
    for f in ['latitude', 'longitude', 'pickup_time', 'drop_time', 'fare', 'stop_order', 'radius_meters']:
        if f in data:
            setattr(stop, f, data[f])
    db.session.add(stop)
    db.session.commit()
    return success_response(stop.to_dict(), 'Stop added', 201)


@transport_bp.route('/stops/add-by-name', methods=['POST'])
@role_required('school_admin', 'transport_manager', 'principal')
def add_stop_by_name():
    """Add a stop using the route's NAME (no IDs needed).
    Body: { route_name, stop_name, pickup_time?, drop_time?, fare? }"""
    data = request.get_json() or {}
    route_name = (data.get('route_name') or '').strip()
    stop_name = (data.get('stop_name') or '').strip()
    if not route_name or not stop_name:
        return error_response('Route name aur Stop name dono required hai', 400)
    route = TransportRoute.query.filter(
        TransportRoute.school_id == g.school_id,
        db.func.lower(TransportRoute.route_name) == route_name.lower()
    ).first()
    if not route:
        return error_response(f"Koi route '{route_name}' naam se nahi mila", 404)
    count = TransportStop.query.filter_by(school_id=g.school_id, route_id=route.id).count()
    stop = TransportStop(school_id=g.school_id, route_id=route.id, stop_name=stop_name,
                         stop_order=data.get('stop_order') or count + 1)
    for f in ['pickup_time', 'drop_time', 'fare']:
        if data.get(f) not in (None, ''):
            setattr(stop, f, data[f])
    db.session.add(stop)
    db.session.commit()
    return success_response(stop.to_dict(), 'Stop added', 201)


@transport_bp.route('/stops/<int:stop_id>', methods=['PUT'])
@role_required('school_admin', 'transport_manager', 'principal')
def update_stop(stop_id):
    stop = TransportStop.query.filter_by(id=stop_id, school_id=g.school_id).first()
    if not stop:
        return error_response('Stop not found', 404)
    data = request.get_json()
    for f in ['stop_name', 'latitude', 'longitude', 'pickup_time', 'drop_time', 'fare', 'stop_order', 'radius_meters']:
        if f in data:
            setattr(stop, f, data[f])
    db.session.commit()
    return success_response(stop.to_dict(), 'Stop updated')


@transport_bp.route('/stops/<int:stop_id>', methods=['DELETE'])
@role_required('school_admin', 'transport_manager', 'principal')
def delete_stop(stop_id):
    stop = TransportStop.query.filter_by(id=stop_id, school_id=g.school_id).first()
    if not stop:
        return error_response('Stop not found', 404)
    db.session.delete(stop)
    db.session.commit()
    return success_response(None, 'Stop deleted')


# ═══════════════════════════════════════════════════════════════
# STUDENT TRANSPORT ASSIGNMENT
# ═══════════════════════════════════════════════════════════════
@transport_bp.route('/students', methods=['GET'])
@school_required
@feature_required('transport')
def list_student_transport():
    query = StudentTransport.query.options(
        joinedload(StudentTransport.route),
        joinedload(StudentTransport.stop)
    ).filter_by(school_id=g.school_id)
    route_id = request.args.get('route_id', type=int)
    if route_id:
        query = query.filter_by(route_id=route_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    return success_response(paginate(query))


@transport_bp.route('/student-lookup', methods=['GET'])
@school_required
@feature_required('transport')
def student_lookup():
    """Lookup a student by admission number → return name + father name.
    Used by the Assign dialog to auto-fill / confirm the student.
    Query param: admission_no"""
    from app.models.student import Student, ParentDetail
    adm = (request.args.get('admission_no') or '').strip()
    if not adm:
        return error_response('Admission number required', 400)
    stu = Student.query.filter_by(school_id=g.school_id, admission_no=adm).first()
    if not stu:
        return error_response(f"Koi student '{adm}' se nahi mila", 404)
    father = ParentDetail.query.filter_by(
        school_id=g.school_id, student_id=stu.id, relation='father'
    ).first()
    guardian = None
    if not father:
        guardian = ParentDetail.query.filter_by(
            school_id=g.school_id, student_id=stu.id
        ).first()
    return success_response({
        'student_id': stu.id,
        'admission_no': stu.admission_no,
        'student_name': f"{stu.first_name} {stu.last_name or ''}".strip(),
        'father_name': father.name if father else (guardian.name if guardian else None),
        'class_name': stu.current_class.name if stu.current_class else None,
        'section_name': stu.current_section.name if stu.current_section else None,
    })


@transport_bp.route('/assign', methods=['POST'])
@role_required('school_admin', 'transport_manager', 'principal')
def assign_transport():
    """Assign a student to a route+stop. Accepts either IDs or human-friendly
    names so the user never has to know internal IDs:
      - admission_no (string)  → resolved to student
      - route_name (string)    → resolved to existing route
      - stop_name (string)     → found on that route, or created if missing
      - monthly_fee (number)   → stored as the stop fare (transport fee)
    """
    from app.models.student import Student
    data = request.get_json() or {}

    # ── Resolve student ──
    student_id = data.get('student_id')
    if not student_id and data.get('admission_no'):
        stu = Student.query.filter_by(
            school_id=g.school_id, admission_no=str(data['admission_no']).strip()
        ).first()
        if not stu:
            return error_response(f"Koi student admission no '{data['admission_no']}' se nahi mila", 404)
        student_id = stu.id
    if not student_id:
        return error_response('Student admission number required', 400)

    # ── Resolve route ──
    route_id = data.get('route_id')
    if not route_id and data.get('route_name'):
        route = TransportRoute.query.filter(
            TransportRoute.school_id == g.school_id,
            db.func.lower(TransportRoute.route_name) == str(data['route_name']).strip().lower()
        ).first()
        if not route:
            return error_response(f"Koi route '{data['route_name']}' naam se nahi mila. Pehle route banao.", 404)
        route_id = route.id
    if not route_id:
        return error_response('Route name required', 400)

    # ── Resolve / create stop ──
    stop_id = data.get('stop_id')
    fee = data.get('monthly_fee') or data.get('fare')
    if not stop_id:
        stop_name = (data.get('stop_name') or '').strip()
        if not stop_name:
            return error_response('Stop name required', 400)
        stop = TransportStop.query.filter(
            TransportStop.school_id == g.school_id,
            TransportStop.route_id == route_id,
            db.func.lower(TransportStop.stop_name) == stop_name.lower()
        ).first()
        if not stop:
            # auto-create the stop under this route
            count = TransportStop.query.filter_by(school_id=g.school_id, route_id=route_id).count()
            stop = TransportStop(
                school_id=g.school_id, route_id=route_id, stop_name=stop_name,
                stop_order=count + 1, fare=fee,
            )
            db.session.add(stop)
            db.session.flush()
        elif fee is not None and stop.fare is None:
            stop.fare = fee
        stop_id = stop.id

    assignment = StudentTransport(
        student_id=student_id, school_id=g.school_id,
        route_id=route_id, stop_id=stop_id,
        pickup_type=data.get('pickup_type', 'both'),
        rfid_card_no=data.get('rfid_card_no'),
        effective_from=data.get('effective_from'),
        effective_to=data.get('effective_to'),
        status=data.get('status', 'active'),
    )
    db.session.add(assignment)
    db.session.commit()
    return success_response(assignment.to_dict(), 'Transport assigned', 201)


@transport_bp.route('/assign/<int:aid>', methods=['PUT'])
@role_required('school_admin', 'transport_manager', 'principal')
def update_assignment(aid):
    a = StudentTransport.query.filter_by(id=aid, school_id=g.school_id).first()
    if not a:
        return error_response('Assignment not found', 404)
    data = request.get_json()
    for f in ['route_id', 'stop_id', 'pickup_type', 'rfid_card_no', 'effective_from', 'effective_to', 'status']:
        if f in data:
            setattr(a, f, data[f])
    db.session.commit()
    return success_response(a.to_dict(), 'Assignment updated')


# ═══════════════════════════════════════════════════════════════
# GPS TRACKING
# ═══════════════════════════════════════════════════════════════
@transport_bp.route('/gps', methods=['GET'])
@school_required
@feature_required('transport')
def list_gps():
    query = GPSTracking.query.filter_by(school_id=g.school_id)
    vehicle_id = request.args.get('vehicle_id', type=int)
    if vehicle_id:
        query = query.filter_by(vehicle_id=vehicle_id)
    query = query.order_by(GPSTracking.timestamp.desc())
    return success_response(paginate(query))


@transport_bp.route('/gps', methods=['POST'])
@school_required
def log_gps():
    data = request.get_json()
    gps = GPSTracking(
        school_id=g.school_id, vehicle_id=data['vehicle_id'],
        latitude=data['latitude'], longitude=data['longitude'],
        speed_kmh=data.get('speed_kmh', 0), heading=data.get('heading'),
        is_overspeeding=data.get('is_overspeeding', False),
    )
    db.session.add(gps)
    db.session.commit()
    return success_response(gps.to_dict(), 'GPS logged', 201)


@transport_bp.route('/gps/latest', methods=['GET'])
@school_required
@feature_required('transport')
def latest_gps():
    from sqlalchemy import func
    subq = db.session.query(
        GPSTracking.vehicle_id,
        func.max(GPSTracking.id).label('max_id')
    ).filter_by(school_id=g.school_id).group_by(GPSTracking.vehicle_id).subquery()

    points = GPSTracking.query.join(
        subq, db.and_(GPSTracking.vehicle_id == subq.c.vehicle_id, GPSTracking.id == subq.c.max_id)
    ).all()
    return success_response([p.to_dict() for p in points])


# ═══════════════════════════════════════════════════════════════
# VEHICLE MAINTENANCE
# ═══════════════════════════════════════════════════════════════
@transport_bp.route('/maintenance', methods=['GET'])
@school_required
@feature_required('transport')
def list_maintenance():
    query = VehicleMaintenance.query.filter_by(school_id=g.school_id)
    vehicle_id = request.args.get('vehicle_id', type=int)
    status = request.args.get('status')
    if vehicle_id:
        query = query.filter_by(vehicle_id=vehicle_id)
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(VehicleMaintenance.created_at.desc())
    return success_response(paginate(query))


@transport_bp.route('/maintenance', methods=['POST'])
@role_required('school_admin', 'transport_manager', 'principal')
def create_maintenance():
    data = request.get_json()
    m = VehicleMaintenance(school_id=g.school_id, vehicle_id=data['vehicle_id'],
                           maintenance_type=data['maintenance_type'])
    for f in ['description', 'vendor_name', 'cost', 'odometer_reading', 'scheduled_date',
              'completed_date', 'next_due_date', 'next_due_km', 'status', 'invoice_no', 'notes']:
        if f in data:
            setattr(m, f, data[f])
    db.session.add(m)
    db.session.commit()
    return success_response(m.to_dict(), 'Maintenance record created', 201)


@transport_bp.route('/maintenance/<int:mid>', methods=['PUT'])
@role_required('school_admin', 'transport_manager', 'principal')
def update_maintenance(mid):
    m = VehicleMaintenance.query.filter_by(id=mid, school_id=g.school_id).first()
    if not m:
        return error_response('Record not found', 404)
    data = request.get_json()
    for f in ['maintenance_type', 'description', 'vendor_name', 'cost', 'odometer_reading',
              'scheduled_date', 'completed_date', 'next_due_date', 'next_due_km', 'status',
              'invoice_no', 'notes']:
        if f in data:
            setattr(m, f, data[f])
    db.session.commit()
    return success_response(m.to_dict(), 'Maintenance updated')


# ═══════════════════════════════════════════════════════════════
# FUEL LOGS
# ═══════════════════════════════════════════════════════════════
@transport_bp.route('/fuel-logs', methods=['GET'])
@school_required
@feature_required('transport')
def list_fuel_logs():
    query = FuelLog.query.filter_by(school_id=g.school_id)
    vehicle_id = request.args.get('vehicle_id', type=int)
    if vehicle_id:
        query = query.filter_by(vehicle_id=vehicle_id)
    query = query.order_by(FuelLog.fill_date.desc())
    return success_response(paginate(query))


@transport_bp.route('/fuel-logs', methods=['POST'])
@role_required('school_admin', 'transport_manager', 'principal')
def create_fuel_log():
    data = request.get_json()
    fl = FuelLog(school_id=g.school_id, vehicle_id=data['vehicle_id'],
                 fill_date=data['fill_date'], quantity_liters=data['quantity_liters'])
    for f in ['fuel_type', 'rate_per_liter', 'total_cost', 'odometer_reading',
              'mileage_kmpl', 'pump_name', 'receipt_no', 'filled_by', 'notes']:
        if f in data:
            setattr(fl, f, data[f])
    # Auto-calculate total if not provided
    if not fl.total_cost and fl.rate_per_liter and fl.quantity_liters:
        fl.total_cost = float(fl.quantity_liters) * float(fl.rate_per_liter)
    db.session.add(fl)
    db.session.commit()
    return success_response(fl.to_dict(), 'Fuel log created', 201)


@transport_bp.route('/fuel-logs/<int:fid>', methods=['PUT'])
@role_required('school_admin', 'transport_manager', 'principal')
def update_fuel_log(fid):
    fl = FuelLog.query.filter_by(id=fid, school_id=g.school_id).first()
    if not fl:
        return error_response('Fuel log not found', 404)
    data = request.get_json()
    for f in ['fill_date', 'fuel_type', 'quantity_liters', 'rate_per_liter', 'total_cost',
              'odometer_reading', 'mileage_kmpl', 'pump_name', 'receipt_no', 'filled_by', 'notes']:
        if f in data:
            setattr(fl, f, data[f])
    db.session.commit()
    return success_response(fl.to_dict(), 'Fuel log updated')


# ═══════════════════════════════════════════════════════════════
# TRANSPORT FEES
# ═══════════════════════════════════════════════════════════════
@transport_bp.route('/fees', methods=['GET'])
@school_required
@feature_required('transport')
def list_transport_fees():
    query = TransportFee.query.filter_by(school_id=g.school_id)
    route_id = request.args.get('route_id', type=int)
    if route_id:
        query = query.filter_by(route_id=route_id)
    query = query.order_by(TransportFee.created_at.desc())
    return success_response(paginate(query))


@transport_bp.route('/fees', methods=['POST'])
@role_required('school_admin', 'transport_manager', 'principal')
def create_transport_fee():
    """Record a transport fee for a student. Accepts admission_no (string),
    distance_km, amount and paid_date — no internal IDs needed."""
    from app.models.student import Student
    data = request.get_json() or {}

    student_id = data.get('student_id')
    if not student_id and data.get('admission_no'):
        stu = Student.query.filter_by(
            school_id=g.school_id, admission_no=str(data['admission_no']).strip()
        ).first()
        if not stu:
            return error_response(f"Koi student '{data['admission_no']}' se nahi mila", 404)
        student_id = stu.id

    if not data.get('amount'):
        return error_response('Amount required', 400)

    tf = TransportFee(school_id=g.school_id, amount=data['amount'], student_id=student_id)
    for f in ['route_id', 'stop_id', 'academic_year', 'fee_type', 'distance_based',
              'distance_km', 'rate_per_km', 'paid_date', 'effective_from', 'effective_to', 'status']:
        if data.get(f) not in (None, ''):
            setattr(tf, f, data[f])
    db.session.add(tf)
    db.session.commit()
    return success_response(tf.to_dict(), 'Transport fee recorded', 201)


@transport_bp.route('/fees/<int:fid>', methods=['PUT'])
@role_required('school_admin', 'transport_manager', 'principal')
def update_transport_fee(fid):
    tf = TransportFee.query.filter_by(id=fid, school_id=g.school_id).first()
    if not tf:
        return error_response('Fee not found', 404)
    data = request.get_json()
    for f in ['route_id', 'stop_id', 'academic_year', 'fee_type', 'amount',
              'distance_based', 'distance_km', 'rate_per_km', 'effective_from', 'effective_to', 'status']:
        if f in data:
            setattr(tf, f, data[f])
    db.session.commit()
    return success_response(tf.to_dict(), 'Transport fee updated')


# ═══════════════════════════════════════════════════════════════
# SOS ALERTS
# ═══════════════════════════════════════════════════════════════
@transport_bp.route('/sos-alerts', methods=['GET'])
@school_required
@feature_required('transport')
def list_sos_alerts():
    query = SOSAlert.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(SOSAlert.created_at.desc())
    return success_response(paginate(query))


@transport_bp.route('/sos-alerts', methods=['POST'])
@school_required
def create_sos_alert():
    data = request.get_json()
    sos = SOSAlert(school_id=g.school_id, alert_type=data['alert_type'],
                   triggered_by=g.current_user.id)
    for f in ['vehicle_id', 'route_id', 'driver_id', 'description', 'latitude', 'longitude']:
        if f in data:
            setattr(sos, f, data[f])
    db.session.add(sos)
    db.session.commit()
    return success_response(sos.to_dict(), 'SOS Alert created', 201)


@transport_bp.route('/sos-alerts/<int:sid>', methods=['PUT'])
@role_required('school_admin', 'transport_manager', 'principal')
def update_sos_alert(sid):
    sos = SOSAlert.query.filter_by(id=sid, school_id=g.school_id).first()
    if not sos:
        return error_response('Alert not found', 404)
    data = request.get_json()
    if data.get('status') == 'resolved':
        sos.resolved_by = g.current_user.id
        sos.resolved_at = datetime.utcnow()
    for f in ['status', 'resolution_notes']:
        if f in data:
            setattr(sos, f, data[f])
    db.session.commit()
    return success_response(sos.to_dict(), 'SOS Alert updated')


# ═══════════════════════════════════════════════════════════════
# TRIP MANAGEMENT
# ═══════════════════════════════════════════════════════════════
@transport_bp.route('/trips', methods=['GET'])
@school_required
@feature_required('transport')
def list_trips():
    query = TripManagement.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(TripManagement.created_at.desc())
    return success_response(paginate(query))


@transport_bp.route('/trips', methods=['POST'])
@role_required('school_admin', 'transport_manager', 'principal')
def create_trip():
    data = request.get_json()
    trip = TripManagement(school_id=g.school_id, trip_name=data['trip_name'],
                          organizer_id=g.current_user.id)
    for f in ['trip_type', 'destination', 'vehicle_id', 'driver_id', 'departure_datetime',
              'return_datetime', 'total_students', 'total_staff', 'estimated_cost',
              'actual_cost', 'notes', 'status']:
        if f in data:
            setattr(trip, f, data[f])
    db.session.add(trip)
    db.session.commit()
    return success_response(trip.to_dict(), 'Trip created', 201)


@transport_bp.route('/trips/<int:tid>', methods=['PUT'])
@role_required('school_admin', 'transport_manager', 'principal')
def update_trip(tid):
    trip = TripManagement.query.filter_by(id=tid, school_id=g.school_id).first()
    if not trip:
        return error_response('Trip not found', 404)
    data = request.get_json()
    for f in ['trip_name', 'trip_type', 'destination', 'vehicle_id', 'driver_id',
              'departure_datetime', 'return_datetime', 'total_students', 'total_staff',
              'estimated_cost', 'actual_cost', 'notes', 'status']:
        if f in data:
            setattr(trip, f, data[f])
    db.session.commit()
    return success_response(trip.to_dict(), 'Trip updated')


# ═══════════════════════════════════════════════════════════════
# ROUTE CHANGE REQUESTS
# ═══════════════════════════════════════════════════════════════
@transport_bp.route('/route-requests', methods=['GET'])
@school_required
@feature_required('transport')
def list_route_requests():
    query = RouteChangeRequest.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(RouteChangeRequest.created_at.desc())
    return success_response(paginate(query))


@transport_bp.route('/route-requests', methods=['POST'])
@school_required
def create_route_request():
    data = request.get_json()
    req = RouteChangeRequest(school_id=g.school_id, requested_by=g.current_user.id)
    for f in ['student_id', 'current_route_id', 'requested_route_id',
              'current_stop_id', 'requested_stop_id', 'reason', 'effective_date']:
        if f in data:
            setattr(req, f, data[f])
    db.session.add(req)
    db.session.commit()
    return success_response(req.to_dict(), 'Route change request submitted', 201)


@transport_bp.route('/route-requests/<int:rid>', methods=['PUT'])
@role_required('school_admin', 'transport_manager', 'principal')
def approve_route_request(rid):
    req = RouteChangeRequest.query.filter_by(id=rid, school_id=g.school_id).first()
    if not req:
        return error_response('Request not found', 404)
    data = request.get_json()
    req.status = data.get('status', req.status)
    req.admin_remarks = data.get('admin_remarks', req.admin_remarks)
    if req.status == 'approved':
        req.approved_by = g.current_user.id
    db.session.commit()
    return success_response(req.to_dict(), 'Request updated')


# ═══════════════════════════════════════════════════════════════
# SPEED ALERTS
# ═══════════════════════════════════════════════════════════════
@transport_bp.route('/speed-alerts', methods=['GET'])
@school_required
@feature_required('transport')
def list_speed_alerts():
    query = SpeedAlert.query.filter_by(school_id=g.school_id)
    vehicle_id = request.args.get('vehicle_id', type=int)
    if vehicle_id:
        query = query.filter_by(vehicle_id=vehicle_id)
    query = query.order_by(SpeedAlert.created_at.desc())
    return success_response(paginate(query))


@transport_bp.route('/speed-alerts', methods=['POST'])
@school_required
def create_speed_alert():
    data = request.get_json()
    sa = SpeedAlert(school_id=g.school_id, vehicle_id=data['vehicle_id'],
                    speed_kmh=data['speed_kmh'])
    for f in ['driver_id', 'speed_limit_kmh', 'latitude', 'longitude', 'location_name']:
        if f in data:
            setattr(sa, f, data[f])
    db.session.add(sa)
    db.session.commit()
    return success_response(sa.to_dict(), 'Speed alert created', 201)


@transport_bp.route('/speed-alerts/<int:said>', methods=['PUT'])
@role_required('school_admin', 'transport_manager', 'principal')
def acknowledge_speed_alert(said):
    sa = SpeedAlert.query.filter_by(id=said, school_id=g.school_id).first()
    if not sa:
        return error_response('Alert not found', 404)
    sa.acknowledged = True
    sa.acknowledged_by = g.current_user.id
    db.session.commit()
    return success_response(sa.to_dict(), 'Speed alert acknowledged')


# ═══════════════════════════════════════════════════════════════
# EMERGENCY ALERT (sound + auto-popup) & TRANSPORT NOTIFICATIONS
# Only principal (and admins) can broadcast. Targets students assigned
# to a route, their linked parents, and optionally all transport users.
# ═══════════════════════════════════════════════════════════════

def _transport_recipient_user_ids(school_id, route_id=None):
    """Resolve recipient User ids for a transport notice.
    If route_id given → only students on that route (+ their parent users).
    Else → all students who have any active transport assignment (+ parents).
    """
    from app.models.student import Student, ParentDetail
    from app.models.user import User

    q = StudentTransport.query.filter_by(school_id=school_id, status='active')
    if route_id:
        q = q.filter_by(route_id=route_id)
    student_ids = [st.student_id for st in q.all()]
    if not student_ids:
        return [], []

    students = Student.query.filter(Student.id.in_(student_ids)).all()
    user_ids = set()
    for s in students:
        if s.user_id:
            user_ids.add(s.user_id)
    # Parent users linked to these students
    parents = ParentDetail.query.filter(
        ParentDetail.school_id == school_id,
        ParentDetail.student_id.in_(student_ids),
    ).all()
    for p in parents:
        if getattr(p, 'user_id', None):
            user_ids.add(p.user_id)
    return list(user_ids), student_ids


@transport_bp.route('/emergency-alert', methods=['POST'])
@role_required('school_admin', 'transport_manager', 'principal')
def emergency_alert():
    """Broadcast an EMERGENCY transport alert that pops up with sound on
    recipients' screens. Title is prefixed so the frontend can detect it.
    Body: { title, message, route_id? (optional → target one route),
            audience? ('route'|'all_transport'|'everyone') }"""
    from app.models.communication import Notification
    from app.models.user import User
    data = request.get_json() or {}
    title = (data.get('title') or 'Emergency Alert').strip()
    message = (data.get('message') or '').strip()
    route_id = data.get('route_id')
    audience = data.get('audience', 'route' if route_id else 'all_transport')

    if audience == 'everyone':
        users = User.query.filter_by(school_id=g.school_id, is_active=True).all()
        user_ids = [u.id for u in users]
    else:
        user_ids, _ = _transport_recipient_user_ids(
            g.school_id, route_id if audience == 'route' else None
        )

    posted_by = f"{g.current_user.first_name or ''} {g.current_user.last_name or ''}".strip() or 'Principal'
    # [EMERGENCY] prefix → frontend triggers sound + auto-open modal
    full_title = f"[EMERGENCY] 🚨 {title}"
    count = 0
    for uid in user_ids:
        db.session.add(Notification(
            school_id=g.school_id, user_id=uid,
            title=full_title,
            message=(message + (f"\n— {posted_by}" if posted_by else '')),
            type='in_app', status='sent', sent_at=datetime.utcnow(),
        ))
        count += 1

    # Also record an active SOS row for the transport dashboard
    sos = SOSAlert(school_id=g.school_id, alert_type='emergency',
                   triggered_by=g.current_user.id, description=f"{title}: {message}",
                   status='active')
    if route_id:
        sos.route_id = route_id
    db.session.add(sos)
    db.session.commit()
    return success_response({'notified_users': count, 'sos_id': sos.id},
                            'Emergency alert broadcast', 201)


@transport_bp.route('/notify', methods=['POST'])
@role_required('school_admin', 'transport_manager', 'principal')
def transport_notify():
    """Send a NORMAL transport notification (no sound). Examples:
    'Bus reached school', 'Bus left school', 'Bus will not come today'.
    Body: { title, message, route_id? }"""
    from app.models.communication import Notification
    data = request.get_json() or {}
    title = (data.get('title') or '').strip()
    message = (data.get('message') or '').strip()
    route_id = data.get('route_id')
    if not title:
        return error_response('Title is required', 400)

    user_ids, _ = _transport_recipient_user_ids(g.school_id, route_id)
    posted_by = f"{g.current_user.first_name or ''} {g.current_user.last_name or ''}".strip() or 'Transport'
    full_title = f"🚌 {title}"
    count = 0
    for uid in user_ids:
        db.session.add(Notification(
            school_id=g.school_id, user_id=uid,
            title=full_title,
            message=(message + (f"\n— {posted_by}" if posted_by else '')),
            type='in_app', status='sent', sent_at=datetime.utcnow(),
        ))
        count += 1
    db.session.commit()
    return success_response({'notified_users': count}, 'Notification sent', 201)


# ═══════════════════════════════════════════════════════════════
# STUDENT-FACING: my transport details (bus no, driver name, driver no)
# ═══════════════════════════════════════════════════════════════
@transport_bp.route('/my-transport', methods=['GET'])
@school_required
def my_transport():
    """Return the logged-in student's transport assignment with bus & driver
    details. Students see only their own bus. Optional ?student_id= for
    parent/admin viewing a specific child."""
    from app.models.student import Student
    user = g.current_user
    role = user.role.name if user.role else None

    student = None
    override_id = request.args.get('student_id', type=int)
    if override_id and role in ('school_admin', 'super_admin', 'principal', 'teacher', 'parent'):
        student = Student.query.filter_by(id=override_id, school_id=g.school_id).first()
    elif role == 'student':
        student = Student.query.filter_by(user_id=user.id, school_id=g.school_id).first()

    if not student:
        return error_response('Student not found', 404)

    assignment = StudentTransport.query.options(
        joinedload(StudentTransport.route),
        joinedload(StudentTransport.stop),
    ).filter_by(school_id=g.school_id, student_id=student.id, status='active').first()

    if not assignment:
        return success_response({'has_transport': False})

    route = assignment.route
    veh = route.vehicle if route else None
    drv = route.driver if route else None
    return success_response({
        'has_transport': True,
        'route_name': route.route_name if route else None,
        'route_code': route.route_code if route else None,
        'shift': route.shift if route else None,
        'bus_number': (veh.vehicle_number if veh else None) or (route.vehicle_no if route else None),
        'driver_name': (drv.name if drv else None) or (route.driver_name if route else None),
        'driver_phone': (drv.phone if drv else None) or (route.driver_phone if route else None),
        'helper_name': route.helper_name if route else None,
        'helper_phone': route.helper_phone if route else None,
        'stop_name': assignment.stop.stop_name if assignment.stop else None,
        'pickup_time': (assignment.stop.pickup_time.isoformat() if assignment.stop and assignment.stop.pickup_time else None),
        'drop_time': (assignment.stop.drop_time.isoformat() if assignment.stop and assignment.stop.drop_time else None),
        'pickup_type': assignment.pickup_type,
    })
