"""Create Parent Engagement tables"""
import sys
sys.path.insert(0, 'backend')

from app import create_app, db

app = create_app()
with app.app_context():
    # Import all models to register them
    from app.models.parent import (
        ParentProfile, PTMSlot, PTMBooking, FeedbackSurvey, FeedbackResponse,
        Grievance, ConsentForm, ConsentResponse, ParentNotification, ParentMessage,
        DailyActivity, VolunteerRegistration, PickupAuthorization
    )
    
    # Create all new tables
    db.create_all()
    print("Parent Engagement tables created successfully!")
    
    # Verify tables
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    parent_tables = [
        'parent_profiles', 'ptm_slots', 'ptm_bookings',
        'feedback_surveys', 'feedback_responses', 'grievances',
        'consent_forms', 'consent_responses', 'parent_notifications',
        'parent_messages', 'daily_activities', 'volunteer_registrations',
        'pickup_authorizations'
    ]
    for t in parent_tables:
        status = "OK" if t in tables else "MISSING"
        print(f"  {t}: {status}")
