"""Global Search & Notifications API — works for all roles."""
from flask import Blueprint, request, g, jsonify
from app import db
from app.utils.decorators import school_required
from app.utils.helpers import success_response, error_response
from app.models.user import User
from app.models.student import Class, Section, Student
from app.models.staff import Staff
from app.models.academic import Subject
from app.models.communication import Notification
from datetime import datetime
from sqlalchemy import or_

global_bp = Blueprint('global', __name__)


# ============================================================
# GLOBAL SEARCH
# ============================================================

@global_bp.route('/search', methods=['GET'])
@school_required
def global_search():
    """Search across students, staff, subjects, classes."""
    q = request.args.get('q', '').strip()
    if not q or len(q) < 2:
        return success_response([])

    like = f'%{q}%'
    results = []

    # Search Students
    students = Student.query.filter(
        Student.school_id == g.school_id,
        Student.status == 'active',
        or_(
            Student.first_name.ilike(like),
            Student.last_name.ilike(like),
            Student.admission_no.ilike(like),
            Student.roll_no.ilike(like),
        )
    ).limit(5).all()
    for s in students:
        results.append({
            'id': s.id,
            'type': 'student',
            'title': f"{s.first_name} {s.last_name or ''}".strip(),
            'subtitle': f"Adm: {s.admission_no or '-'} | Roll: {s.roll_no or '-'}",
            'path': f"/students?id={s.id}",
        })

    # Search Staff
    staff = Staff.query.filter(
        Staff.school_id == g.school_id,
        Staff.status == 'active',
        or_(
            Staff.first_name.ilike(like),
            Staff.last_name.ilike(like),
            Staff.email.ilike(like),
            Staff.designation.ilike(like),
        )
    ).limit(5).all()
    for s in staff:
        results.append({
            'id': s.id,
            'type': 'staff',
            'title': f"{s.first_name} {s.last_name or ''}".strip(),
            'subtitle': s.designation or s.department or 'Staff',
            'path': f"/staff?id={s.id}",
        })

    # Search Subjects
    subjects = Subject.query.filter(
        Subject.school_id == g.school_id,
        Subject.is_active == True,
        or_(
            Subject.name.ilike(like),
            Subject.code.ilike(like),
        )
    ).limit(5).all()
    for s in subjects:
        results.append({
            'id': s.id,
            'type': 'subject',
            'title': s.name,
            'subtitle': f"Code: {s.code or '-'} | Type: {s.type or 'theory'}",
            'path': '/academic-controller',
        })

    # Search Classes
    classes = Class.query.filter(
        Class.school_id == g.school_id,
        Class.name.ilike(like),
    ).limit(5).all()
    for c in classes:
        results.append({
            'id': c.id,
            'type': 'class',
            'title': c.name,
            'subtitle': 'Class',
            'path': '/academics/classes',
        })

    return success_response(results[:20])


# ============================================================
# NOTIFICATIONS
# ============================================================

@global_bp.route('/notifications', methods=['GET'])
@school_required
def get_notifications():
    """Get notifications for the current user."""
    limit = request.args.get('limit', 20, type=int)
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'

    query = Notification.query.filter_by(
        school_id=g.school_id,
        user_id=g.user_id
    )
    if unread_only:
        query = query.filter_by(read_at=None)

    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()
    unread_count = Notification.query.filter_by(
        school_id=g.school_id, user_id=g.user_id, read_at=None
    ).count()

    return success_response({
        'notifications': [n.to_dict() for n in notifications],
        'unread_count': unread_count,
    })


@global_bp.route('/notifications/<int:notif_id>/read', methods=['PUT'])
@school_required
def mark_notification_read(notif_id):
    """Mark a notification as read."""
    notif = Notification.query.filter_by(
        id=notif_id, school_id=g.school_id, user_id=g.user_id
    ).first()
    if not notif:
        return error_response('Notification not found', 404)
    notif.read_at = datetime.utcnow()
    db.session.commit()
    return success_response(notif.to_dict(), 'Marked as read')


@global_bp.route('/notifications/read-all', methods=['PUT'])
@school_required
def mark_all_read():
    """Mark all notifications as read."""
    Notification.query.filter_by(
        school_id=g.school_id, user_id=g.user_id, read_at=None
    ).update({'read_at': datetime.utcnow()})
    db.session.commit()
    return success_response(message='All notifications marked as read')
