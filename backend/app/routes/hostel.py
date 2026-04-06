from flask import Blueprint, request, g
from app import db
from app.models.hostel import (
    HostelBlock, HostelRoom, HostelAllocation, MessMenu,
    MessAttendance, OutpassRequest, HostelVisitor,
    HostelComplaint, HostelInspection
)
from app.utils.decorators import school_required, role_required, feature_required
from app.utils.helpers import success_response, error_response, paginate
from sqlalchemy.orm import joinedload

hostel_bp = Blueprint('hostel', __name__)


# ==================== DASHBOARD ====================
@hostel_bp.route('/dashboard', methods=['GET'])
@school_required
@feature_required('hostel')
def dashboard():
    sid = g.school_id
    total_blocks = HostelBlock.query.filter_by(school_id=sid, is_active=True).count()
    total_rooms = HostelRoom.query.filter_by(school_id=sid, is_active=True).count()
    total_beds = db.session.query(db.func.sum(HostelRoom.capacity)).filter_by(school_id=sid, is_active=True).scalar() or 0
    occupied_beds = HostelAllocation.query.filter_by(school_id=sid, status='active').count()
    available_beds = total_beds - occupied_beds
    pending_outpass = OutpassRequest.query.filter_by(school_id=sid, status='pending').count()
    open_complaints = HostelComplaint.query.filter_by(school_id=sid, status='open').count()
    active_visitors = HostelVisitor.query.filter_by(school_id=sid, status='checked_in').count()
    total_inspections = HostelInspection.query.filter_by(school_id=sid).count()
    total_menu_items = MessMenu.query.filter_by(school_id=sid, is_active=True).count()
    return success_response(data={
        'total_blocks': total_blocks,
        'total_rooms': total_rooms,
        'total_beds': int(total_beds),
        'occupied_beds': occupied_beds,
        'available_beds': int(available_beds),
        'pending_outpass': pending_outpass,
        'open_complaints': open_complaints,
        'active_visitors': active_visitors,
        'total_inspections': total_inspections,
        'total_menu_items': total_menu_items,
    })


# ==================== BLOCKS ====================
@hostel_bp.route('/blocks', methods=['GET'])
@school_required
@feature_required('hostel')
def list_blocks():
    q = HostelBlock.query.filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        q = q.filter_by(is_active=(status == 'active'))
    q = q.order_by(HostelBlock.name)
    return success_response(data=paginate(q))

@hostel_bp.route('/blocks', methods=['POST'])
@school_required
@feature_required('hostel')
def create_block():
    data = request.get_json()
    block = HostelBlock(school_id=g.school_id, name=data['name'], code=data.get('code'),
        block_type=data.get('block_type', 'boys'), warden_id=data.get('warden_id'),
        total_floors=data.get('total_floors', 1), description=data.get('description'),
        address=data.get('address'), contact_number=data.get('contact_number'))
    db.session.add(block)
    db.session.commit()
    return success_response(data=block.to_dict(), message='Block created')

@hostel_bp.route('/blocks/<int:id>', methods=['PUT'])
@school_required
@feature_required('hostel')
def update_block(id):
    block = HostelBlock.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['name', 'code', 'block_type', 'warden_id', 'total_floors', 'description', 'address', 'contact_number', 'is_active']:
        if k in data:
            setattr(block, k, data[k])
    db.session.commit()
    return success_response(data=block.to_dict(), message='Block updated')

@hostel_bp.route('/blocks/<int:id>', methods=['DELETE'])
@school_required
@feature_required('hostel')
def delete_block(id):
    block = HostelBlock.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(block)
    db.session.commit()
    return success_response(message='Block deleted')


# ==================== ROOMS ====================
@hostel_bp.route('/rooms', methods=['GET'])
@school_required
@feature_required('hostel')
def list_rooms():
    q = HostelRoom.query.options(
        joinedload(HostelRoom.block)
    ).filter_by(school_id=g.school_id)
    block_id = request.args.get('block_id')
    status = request.args.get('status')
    if block_id:
        q = q.filter_by(block_id=block_id)
    if status:
        q = q.filter_by(status=status)
    q = q.order_by(HostelRoom.room_number)
    return success_response(data=paginate(q))

@hostel_bp.route('/rooms', methods=['POST'])
@school_required
@feature_required('hostel')
def create_room():
    data = request.get_json()
    room = HostelRoom(school_id=g.school_id, block_id=data['block_id'],
        room_number=data['room_number'], floor=data.get('floor', 0),
        room_type=data.get('room_type', 'shared'), capacity=data.get('capacity', 2),
        amenities=data.get('amenities'), monthly_rent=data.get('monthly_rent', 0),
        status=data.get('status', 'available'))
    db.session.add(room)
    db.session.commit()
    return success_response(data=room.to_dict(), message='Room created')

@hostel_bp.route('/rooms/<int:id>', methods=['PUT'])
@school_required
@feature_required('hostel')
def update_room(id):
    room = HostelRoom.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['block_id', 'room_number', 'floor', 'room_type', 'capacity', 'amenities', 'monthly_rent', 'status', 'is_active']:
        if k in data:
            setattr(room, k, data[k])
    db.session.commit()
    return success_response(data=room.to_dict(), message='Room updated')

@hostel_bp.route('/rooms/<int:id>', methods=['DELETE'])
@school_required
@feature_required('hostel')
def delete_room(id):
    room = HostelRoom.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(room)
    db.session.commit()
    return success_response(message='Room deleted')


# ==================== ALLOCATIONS ====================
@hostel_bp.route('/allocations', methods=['GET'])
@school_required
@feature_required('hostel')
def list_allocations():
    q = HostelAllocation.query.options(
        joinedload(HostelAllocation.student),
        joinedload(HostelAllocation.room).joinedload(HostelRoom.block)
    ).filter_by(school_id=g.school_id)
    status = request.args.get('status')
    room_id = request.args.get('room_id')
    if status:
        q = q.filter_by(status=status)
    if room_id:
        q = q.filter_by(room_id=room_id)
    q = q.order_by(HostelAllocation.created_at.desc())
    return success_response(data=paginate(q))

@hostel_bp.route('/allocations', methods=['POST'])
@school_required
@feature_required('hostel')
def create_allocation():
    data = request.get_json()
    alloc = HostelAllocation(school_id=g.school_id, student_id=data['student_id'],
        room_id=data['room_id'], bed_number=data.get('bed_number'),
        allocation_date=data['allocation_date'], remarks=data.get('remarks'))
    db.session.add(alloc)
    # Update room occupancy
    room = HostelRoom.query.get(data['room_id'])
    if room:
        room.current_occupancy = (room.current_occupancy or 0) + 1
        if room.current_occupancy >= room.capacity:
            room.status = 'full'
    db.session.commit()
    return success_response(data=alloc.to_dict(), message='Allocation created')

@hostel_bp.route('/allocations/<int:id>', methods=['PUT'])
@school_required
@feature_required('hostel')
def update_allocation(id):
    alloc = HostelAllocation.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    if data.get('status') == 'vacated' and alloc.status == 'active':
        room = HostelRoom.query.get(alloc.room_id)
        if room:
            room.current_occupancy = max(0, (room.current_occupancy or 0) - 1)
            if room.current_occupancy < room.capacity:
                room.status = 'available'
    for k in ['bed_number', 'status', 'vacate_date', 'remarks']:
        if k in data:
            setattr(alloc, k, data[k])
    db.session.commit()
    return success_response(data=alloc.to_dict(), message='Allocation updated')

@hostel_bp.route('/allocations/<int:id>', methods=['DELETE'])
@school_required
@feature_required('hostel')
def delete_allocation(id):
    alloc = HostelAllocation.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    if alloc.status == 'active':
        room = HostelRoom.query.get(alloc.room_id)
        if room:
            room.current_occupancy = max(0, (room.current_occupancy or 0) - 1)
            if room.current_occupancy < room.capacity:
                room.status = 'available'
    db.session.delete(alloc)
    db.session.commit()
    return success_response(message='Allocation deleted')


# ==================== MESS MENU ====================
@hostel_bp.route('/mess-menu', methods=['GET'])
@school_required
@feature_required('hostel')
def list_mess_menu():
    q = MessMenu.query.filter_by(school_id=g.school_id)
    day = request.args.get('day_of_week')
    meal = request.args.get('meal_type')
    if day:
        q = q.filter_by(day_of_week=day)
    if meal:
        q = q.filter_by(meal_type=meal)
    q = q.order_by(MessMenu.day_of_week, MessMenu.meal_type)
    return success_response(data=paginate(q))

@hostel_bp.route('/mess-menu', methods=['POST'])
@school_required
@feature_required('hostel')
def create_mess_menu():
    data = request.get_json()
    menu = MessMenu(school_id=g.school_id, day_of_week=data['day_of_week'],
        meal_type=data['meal_type'], menu_items=data['menu_items'],
        special_diet=data.get('special_diet'), calories=data.get('calories'),
        effective_from=data.get('effective_from'), effective_to=data.get('effective_to'))
    db.session.add(menu)
    db.session.commit()
    return success_response(data=menu.to_dict(), message='Menu created')

@hostel_bp.route('/mess-menu/<int:id>', methods=['PUT'])
@school_required
@feature_required('hostel')
def update_mess_menu(id):
    menu = MessMenu.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['day_of_week', 'meal_type', 'menu_items', 'special_diet', 'calories', 'effective_from', 'effective_to', 'is_active']:
        if k in data:
            setattr(menu, k, data[k])
    db.session.commit()
    return success_response(data=menu.to_dict(), message='Menu updated')

@hostel_bp.route('/mess-menu/<int:id>', methods=['DELETE'])
@school_required
@feature_required('hostel')
def delete_mess_menu(id):
    menu = MessMenu.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(menu)
    db.session.commit()
    return success_response(message='Menu deleted')


# ==================== MESS ATTENDANCE ====================
@hostel_bp.route('/mess-attendance', methods=['GET'])
@school_required
@feature_required('hostel')
def list_mess_attendance():
    q = MessAttendance.query.options(
        joinedload(MessAttendance.student)
    ).filter_by(school_id=g.school_id)
    date = request.args.get('date')
    meal = request.args.get('meal_type')
    if date:
        q = q.filter_by(date=date)
    if meal:
        q = q.filter_by(meal_type=meal)
    q = q.order_by(MessAttendance.created_at.desc())
    return success_response(data=paginate(q))

@hostel_bp.route('/mess-attendance', methods=['POST'])
@school_required
@feature_required('hostel')
def create_mess_attendance():
    data = request.get_json()
    att = MessAttendance(school_id=g.school_id, student_id=data['student_id'],
        date=data['date'], meal_type=data['meal_type'],
        status=data.get('status', 'present'), remarks=data.get('remarks'))
    db.session.add(att)
    db.session.commit()
    return success_response(data=att.to_dict(), message='Attendance recorded')

@hostel_bp.route('/mess-attendance/<int:id>', methods=['PUT'])
@school_required
@feature_required('hostel')
def update_mess_attendance(id):
    att = MessAttendance.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['status', 'remarks']:
        if k in data:
            setattr(att, k, data[k])
    db.session.commit()
    return success_response(data=att.to_dict(), message='Attendance updated')


# ==================== OUTPASS ====================
@hostel_bp.route('/outpass', methods=['GET'])
@school_required
@feature_required('hostel')
def list_outpass():
    q = OutpassRequest.query.options(
        joinedload(OutpassRequest.student)
    ).filter_by(school_id=g.school_id)
    status = request.args.get('status')
    if status:
        q = q.filter_by(status=status)
    q = q.order_by(OutpassRequest.created_at.desc())
    return success_response(data=paginate(q))

@hostel_bp.route('/outpass', methods=['POST'])
@school_required
@feature_required('hostel')
def create_outpass():
    data = request.get_json()
    op = OutpassRequest(school_id=g.school_id, student_id=data['student_id'],
        outpass_type=data.get('outpass_type', 'day'), reason=data['reason'],
        from_date=data['from_date'], to_date=data['to_date'],
        destination=data.get('destination'), guardian_contact=data.get('guardian_contact'))
    db.session.add(op)
    db.session.commit()
    return success_response(data=op.to_dict(), message='Outpass created')

@hostel_bp.route('/outpass/<int:id>', methods=['PUT'])
@school_required
@feature_required('hostel')
def update_outpass(id):
    op = OutpassRequest.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    if 'status' in data and data['status'] == 'approved':
        op.approved_by = g.current_user.id
        from datetime import datetime
        op.approved_at = datetime.utcnow()
    for k in ['status', 'actual_return', 'remarks']:
        if k in data:
            setattr(op, k, data[k])
    db.session.commit()
    return success_response(data=op.to_dict(), message='Outpass updated')

@hostel_bp.route('/outpass/<int:id>', methods=['DELETE'])
@school_required
@feature_required('hostel')
def delete_outpass(id):
    op = OutpassRequest.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(op)
    db.session.commit()
    return success_response(message='Outpass deleted')


# ==================== VISITORS ====================
@hostel_bp.route('/visitors', methods=['GET'])
@school_required
@feature_required('hostel')
def list_visitors():
    q = HostelVisitor.query.options(
        joinedload(HostelVisitor.student)
    ).filter_by(school_id=g.school_id)
    status = request.args.get('status')
    date = request.args.get('date')
    if status:
        q = q.filter_by(status=status)
    if date:
        q = q.filter_by(visit_date=date)
    q = q.order_by(HostelVisitor.created_at.desc())
    return success_response(data=paginate(q))

@hostel_bp.route('/visitors', methods=['POST'])
@school_required
@feature_required('hostel')
def create_visitor():
    data = request.get_json()
    v = HostelVisitor(school_id=g.school_id, student_id=data['student_id'],
        visitor_name=data['visitor_name'], relation=data.get('relation'),
        contact_number=data.get('contact_number'), id_proof_type=data.get('id_proof_type'),
        id_proof_number=data.get('id_proof_number'), visit_date=data['visit_date'],
        check_in=data.get('check_in'), purpose=data.get('purpose'))
    db.session.add(v)
    db.session.commit()
    return success_response(data=v.to_dict(), message='Visitor registered')

@hostel_bp.route('/visitors/<int:id>', methods=['PUT'])
@school_required
@feature_required('hostel')
def update_visitor(id):
    v = HostelVisitor.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['visitor_name', 'relation', 'contact_number', 'check_out', 'status', 'remarks']:
        if k in data:
            setattr(v, k, data[k])
    db.session.commit()
    return success_response(data=v.to_dict(), message='Visitor updated')

@hostel_bp.route('/visitors/<int:id>', methods=['DELETE'])
@school_required
@feature_required('hostel')
def delete_visitor(id):
    v = HostelVisitor.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(v)
    db.session.commit()
    return success_response(message='Visitor deleted')


# ==================== COMPLAINTS ====================
@hostel_bp.route('/complaints', methods=['GET'])
@school_required
@feature_required('hostel')
def list_complaints():
    q = HostelComplaint.query.options(
        joinedload(HostelComplaint.student)
    ).filter_by(school_id=g.school_id)
    status = request.args.get('status')
    priority = request.args.get('priority')
    if status:
        q = q.filter_by(status=status)
    if priority:
        q = q.filter_by(priority=priority)
    q = q.order_by(HostelComplaint.created_at.desc())
    return success_response(data=paginate(q))

@hostel_bp.route('/complaints', methods=['POST'])
@school_required
@feature_required('hostel')
def create_complaint():
    data = request.get_json()
    c = HostelComplaint(school_id=g.school_id, student_id=data['student_id'],
        complaint_type=data['complaint_type'], subject=data['subject'],
        description=data['description'], priority=data.get('priority', 'medium'))
    db.session.add(c)
    db.session.commit()
    return success_response(data=c.to_dict(), message='Complaint created')

@hostel_bp.route('/complaints/<int:id>', methods=['PUT'])
@school_required
@feature_required('hostel')
def update_complaint(id):
    c = HostelComplaint.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    if data.get('status') == 'resolved' and c.status != 'resolved':
        from datetime import datetime
        c.resolved_at = datetime.utcnow()
    for k in ['complaint_type', 'subject', 'description', 'priority', 'status', 'assigned_to', 'resolution']:
        if k in data:
            setattr(c, k, data[k])
    db.session.commit()
    return success_response(data=c.to_dict(), message='Complaint updated')

@hostel_bp.route('/complaints/<int:id>', methods=['DELETE'])
@school_required
@feature_required('hostel')
def delete_complaint(id):
    c = HostelComplaint.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(c)
    db.session.commit()
    return success_response(message='Complaint deleted')


# ==================== INSPECTIONS ====================
@hostel_bp.route('/inspections', methods=['GET'])
@school_required
@feature_required('hostel')
def list_inspections():
    q = HostelInspection.query.options(
        joinedload(HostelInspection.room).joinedload(HostelRoom.block)
    ).filter_by(school_id=g.school_id)
    room_id = request.args.get('room_id')
    insp_type = request.args.get('inspection_type')
    if room_id:
        q = q.filter_by(room_id=room_id)
    if insp_type:
        q = q.filter_by(inspection_type=insp_type)
    q = q.order_by(HostelInspection.inspection_date.desc())
    return success_response(data=paginate(q))

@hostel_bp.route('/inspections', methods=['POST'])
@school_required
@feature_required('hostel')
def create_inspection():
    data = request.get_json()
    insp = HostelInspection(school_id=g.school_id, room_id=data['room_id'],
        inspection_date=data['inspection_date'],
        inspection_type=data.get('inspection_type', 'routine'),
        inspector_id=data.get('inspector_id'), cleanliness_score=data.get('cleanliness_score'),
        maintenance_score=data.get('maintenance_score'), discipline_score=data.get('discipline_score'),
        overall_score=data.get('overall_score'), findings=data.get('findings'),
        action_taken=data.get('action_taken'), status=data.get('status', 'completed'))
    db.session.add(insp)
    db.session.commit()
    return success_response(data=insp.to_dict(), message='Inspection recorded')

@hostel_bp.route('/inspections/<int:id>', methods=['PUT'])
@school_required
@feature_required('hostel')
def update_inspection(id):
    insp = HostelInspection.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    data = request.get_json()
    for k in ['inspection_date', 'inspection_type', 'inspector_id', 'cleanliness_score', 'maintenance_score', 'discipline_score', 'overall_score', 'findings', 'action_taken', 'status']:
        if k in data:
            setattr(insp, k, data[k])
    db.session.commit()
    return success_response(data=insp.to_dict(), message='Inspection updated')

@hostel_bp.route('/inspections/<int:id>', methods=['DELETE'])
@school_required
@feature_required('hostel')
def delete_inspection(id):
    insp = HostelInspection.query.filter_by(id=id, school_id=g.school_id).first_or_404()
    db.session.delete(insp)
    db.session.commit()
    return success_response(message='Inspection deleted')
