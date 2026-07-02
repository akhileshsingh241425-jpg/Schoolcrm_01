from flask import Blueprint, request, g
from datetime import datetime
from app import db
from app.models.support import SupportTicket
from app.models.user import User
from app.utils.decorators import school_required, role_required, super_admin_required
from app.utils.helpers import success_response, error_response, paginate
import random, string

support_bp = Blueprint('support', __name__)


def _gen_ticket_no():
    """Generate unique ticket number like TKT-20260701-ABCD"""
    now = datetime.utcnow()
    rand = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"TKT-{now.strftime('%Y%m%d')}-{rand}"


# ─── Client Side (School users submit queries) ────────────────

@support_bp.route('/tickets', methods=['GET'])
@school_required
def list_my_tickets():
    """Client: See their own tickets"""
    query = SupportTicket.query.filter_by(school_id=g.school_id).order_by(SupportTicket.created_at.desc())
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
    return success_response(paginate(query))


@support_bp.route('/tickets', methods=['POST'])
@school_required
def create_ticket():
    """Client: Submit a new support query"""
    data = request.get_json()
    if not data or not data.get('subject') or not data.get('message'):
        return error_response('Subject and message are required')

    ticket = SupportTicket(
        school_id=g.school_id,
        user_id=g.user_id,
        ticket_no=_gen_ticket_no(),
        subject=data['subject'],
        message=data['message'],
        category=data.get('category', 'general'),
        priority=data.get('priority', 'medium'),
        status='open',
    )
    db.session.add(ticket)
    db.session.commit()
    return success_response(ticket.to_dict(), 'Support ticket submitted successfully', 201)


@support_bp.route('/tickets/<int:ticket_id>', methods=['GET'])
@school_required
def get_ticket(ticket_id):
    """Client: Get ticket detail"""
    ticket = SupportTicket.query.filter_by(id=ticket_id, school_id=g.school_id).first_or_404()
    return success_response(ticket.to_dict())


# ─── Admin Side (Super Admin / Project Lead manage tickets) ────

@support_bp.route('/admin/tickets', methods=['GET'])
@super_admin_required
def admin_list_tickets():
    """Super Admin: See ALL tickets from all schools"""
    query = SupportTicket.query.order_by(SupportTicket.created_at.desc())

    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)

    priority = request.args.get('priority')
    if priority:
        query = query.filter_by(priority=priority)

    school_id = request.args.get('school_id', type=int)
    if school_id:
        query = query.filter_by(school_id=school_id)

    search = request.args.get('search', '').strip()
    if search:
        query = query.filter(
            db.or_(
                SupportTicket.subject.ilike(f'%{search}%'),
                SupportTicket.ticket_no.ilike(f'%{search}%'),
                SupportTicket.message.ilike(f'%{search}%'),
            )
        )

    return success_response(paginate(query))


@support_bp.route('/admin/tickets/<int:ticket_id>/respond', methods=['POST'])
@super_admin_required
def respond_ticket(ticket_id):
    """Super Admin: Respond to a ticket"""
    ticket = SupportTicket.query.get_or_404(ticket_id)
    data = request.get_json()

    if not data or not data.get('response'):
        return error_response('Response message is required')

    ticket.response = data['response']
    ticket.responded_by = g.user_id
    ticket.responded_at = datetime.utcnow()
    ticket.status = data.get('status', 'in_progress')

    if ticket.status == 'resolved':
        ticket.resolved_at = datetime.utcnow()
    if ticket.status == 'closed':
        ticket.closed_at = datetime.utcnow()

    db.session.commit()
    return success_response(ticket.to_dict(), 'Response sent')


@support_bp.route('/admin/tickets/<int:ticket_id>/status', methods=['PUT'])
@super_admin_required
def update_ticket_status(ticket_id):
    """Super Admin: Update ticket status"""
    ticket = SupportTicket.query.get_or_404(ticket_id)
    data = request.get_json()
    new_status = data.get('status')

    if new_status not in ('open', 'in_progress', 'resolved', 'closed'):
        return error_response('Invalid status')

    ticket.status = new_status
    if new_status == 'resolved':
        ticket.resolved_at = datetime.utcnow()
    if new_status == 'closed':
        ticket.closed_at = datetime.utcnow()

    db.session.commit()
    return success_response(ticket.to_dict(), f'Status updated to {new_status}')


@support_bp.route('/admin/dashboard', methods=['GET'])
@super_admin_required
def support_dashboard():
    """Super Admin: Support stats"""
    total = SupportTicket.query.count()
    open_count = SupportTicket.query.filter_by(status='open').count()
    in_progress = SupportTicket.query.filter_by(status='in_progress').count()
    resolved = SupportTicket.query.filter_by(status='resolved').count()
    critical = SupportTicket.query.filter(
        SupportTicket.priority == 'critical',
        SupportTicket.status.in_(['open', 'in_progress'])
    ).count()

    return success_response({
        'total': total,
        'open': open_count,
        'in_progress': in_progress,
        'resolved': resolved,
        'critical': critical,
    })
