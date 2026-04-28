from flask import Blueprint, g
from sqlalchemy import func, extract, case
from datetime import datetime, date, timedelta
from app import db
from app.models.student import Student
from app.models.lead import Lead
from app.models.fee import FeePayment
from app.models.admission import Admission
from app.models.attendance import StudentAttendance
from app.models.staff import Staff
from app.utils.decorators import school_required
from app.utils.helpers import success_response
from sqlalchemy.orm import joinedload

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/', methods=['GET'])
@school_required
def get_dashboard():
    school_id = g.school_id
    today = date.today()
    month_start = today.replace(day=1)
    
    try:
        # Combined counts in fewer queries
        total_students = Student.query.filter_by(school_id=school_id, status='active').count()
    except Exception:
        total_students = 0

    try:
        total_staff = Staff.query.filter_by(school_id=school_id, status='active').count()
    except Exception:
        total_staff = 0
    
    try:
        # Attendance today - single query with conditional counts
        att_stats = db.session.query(
            func.count(StudentAttendance.id),
            func.sum(case((StudentAttendance.status == 'present', 1), else_=0))
        ).filter_by(school_id=school_id, date=today).first()
        
        total_marked = att_stats[0] or 0
        present_today = int(att_stats[1] or 0)
    except Exception:
        db.session.rollback()
        total_marked = 0
        present_today = 0
    
    try:
        # Fees this month
        monthly_collection = db.session.query(
            func.coalesce(func.sum(FeePayment.amount_paid), 0)
        ).filter(
            FeePayment.school_id == school_id,
            FeePayment.status == 'completed',
            FeePayment.payment_date >= month_start,
            FeePayment.payment_date <= today
        ).scalar()
    except Exception:
        db.session.rollback()
        monthly_collection = 0
    
    try:
        # Leads + Admissions in fewer round trips
        new_leads = Lead.query.filter(
            Lead.school_id == school_id,
            Lead.created_at >= month_start
        ).count()
    except Exception:
        new_leads = 0
    
    try:
        pending_admissions = Admission.query.filter(
            Admission.school_id == school_id,
            Admission.status.notin_(['enrolled', 'rejected'])
        ).count()
    except Exception:
        pending_admissions = 0
    
    try:
        # Recent leads (no relationship lazy-loads needed — Lead.to_dict() is lightweight)
        recent_leads = Lead.query.filter_by(school_id=school_id).order_by(
            Lead.created_at.desc()
        ).limit(5).all()
    except Exception:
        db.session.rollback()
        recent_leads = []
    
    try:
        # Recent payments - eager load student to avoid N+1
        recent_payments = FeePayment.query.options(
            joinedload(FeePayment.student)
        ).filter_by(
            school_id=school_id, status='completed'
        ).order_by(FeePayment.created_at.desc()).limit(5).all()
    except Exception:
        db.session.rollback()
        recent_payments = []
    
    return success_response({
        'stats': {
            'total_students': total_students,
            'total_staff': total_staff,
            'attendance_today': {
                'present': present_today,
                'total_marked': total_marked,
                'percentage': round((present_today / total_marked * 100), 1) if total_marked > 0 else 0
            },
            'monthly_fee_collection': float(monthly_collection),
            'new_leads_this_month': new_leads,
            'pending_admissions': pending_admissions
        },
        'recent_leads': [l.to_dict() for l in recent_leads],
        'recent_payments': [p.to_dict() for p in recent_payments]
    })
