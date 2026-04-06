from flask import Blueprint, request, g
from sqlalchemy import func, extract
from app import db
from app.models.student import Student
from app.models.lead import Lead
from app.models.fee import FeePayment, FeeStructure
from app.models.attendance import StudentAttendance
from app.models.admission import Admission
from app.utils.decorators import school_required, role_required
from app.utils.helpers import success_response

reports_bp = Blueprint('reports', __name__)


@reports_bp.route('/admission', methods=['GET'])
@school_required
def admission_report():
    year = request.args.get('year', type=int)
    
    query = Admission.query.filter_by(school_id=g.school_id)
    if year:
        query = query.filter(extract('year', Admission.created_at) == year)
    
    total = query.count()
    by_status = db.session.query(
        Admission.status, func.count(Admission.id)
    ).filter_by(school_id=g.school_id).group_by(Admission.status).all()
    
    return success_response({
        'total_applications': total,
        'by_status': {s: c for s, c in by_status}
    })


@reports_bp.route('/fee-collection', methods=['GET'])
@school_required
def fee_report():
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')
    
    query = FeePayment.query.filter_by(school_id=g.school_id, status='completed')
    if from_date:
        query = query.filter(FeePayment.payment_date >= from_date)
    if to_date:
        query = query.filter(FeePayment.payment_date <= to_date)
    
    total_collected = db.session.query(
        func.coalesce(func.sum(FeePayment.amount_paid), 0)
    ).filter_by(school_id=g.school_id, status='completed').scalar()
    
    by_mode = db.session.query(
        FeePayment.payment_mode, func.sum(FeePayment.amount_paid)
    ).filter_by(school_id=g.school_id, status='completed').group_by(FeePayment.payment_mode).all()
    
    return success_response({
        'total_collected': float(total_collected),
        'by_payment_mode': {m: float(a) for m, a in by_mode},
        'total_transactions': query.count()
    })


@reports_bp.route('/attendance', methods=['GET'])
@school_required
def attendance_report():
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')
    class_id = request.args.get('class_id', type=int)
    
    query = StudentAttendance.query.filter_by(school_id=g.school_id)
    if from_date:
        query = query.filter(StudentAttendance.date >= from_date)
    if to_date:
        query = query.filter(StudentAttendance.date <= to_date)
    if class_id:
        query = query.filter_by(class_id=class_id)
    
    total = query.count()
    by_status = db.session.query(
        StudentAttendance.status, func.count(StudentAttendance.id)
    ).filter_by(school_id=g.school_id).group_by(StudentAttendance.status).all()
    
    return success_response({
        'total_records': total,
        'by_status': {s: c for s, c in by_status}
    })


@reports_bp.route('/marketing', methods=['GET'])
@school_required
def marketing_report():
    # Lead stats
    total_leads = Lead.query.filter_by(school_id=g.school_id).count()
    
    by_status = db.session.query(
        Lead.status, func.count(Lead.id)
    ).filter_by(school_id=g.school_id).group_by(Lead.status).all()
    
    by_source = db.session.query(
        Lead.source_id, func.count(Lead.id)
    ).filter_by(school_id=g.school_id).group_by(Lead.source_id).all()
    
    admitted = Lead.query.filter_by(school_id=g.school_id, status='admitted').count()
    conversion_rate = round((admitted / total_leads * 100), 2) if total_leads > 0 else 0
    
    return success_response({
        'total_leads': total_leads,
        'by_status': {s: c for s, c in by_status},
        'admitted': admitted,
        'conversion_rate': conversion_rate
    })


@reports_bp.route('/overview', methods=['GET'])
@school_required
def overview_report():
    total_students = Student.query.filter_by(school_id=g.school_id, status='active').count()
    total_leads = Lead.query.filter_by(school_id=g.school_id).count()
    
    total_fees = db.session.query(
        func.coalesce(func.sum(FeePayment.amount_paid), 0)
    ).filter_by(school_id=g.school_id, status='completed').scalar()
    
    pending_admissions = Admission.query.filter(
        Admission.school_id == g.school_id,
        Admission.status.notin_(['enrolled', 'rejected'])
    ).count()
    
    return success_response({
        'total_students': total_students,
        'total_leads': total_leads,
        'total_fee_collected': float(total_fees),
        'pending_admissions': pending_admissions
    })
