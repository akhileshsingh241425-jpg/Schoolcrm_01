"""
Comprehensive migration script - Creates ALL missing database tables.
Uses Flask-SQLAlchemy's db.create_all() to ensure every model-defined table exists.

Run on production server:
  cd /var/www/school-crm
  git pull
  python3 migrate_create_all_tables.py
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def main():
    # Load environment variables
    try:
        from dotenv import load_dotenv
        env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
        if os.path.exists(env_path):
            load_dotenv(env_path)
            print(f"Loaded .env from {env_path}")
        else:
            load_dotenv()
            print("Loaded .env from default location")
    except ImportError:
        print("python-dotenv not installed, using environment variables directly")

    # Set Flask config to production
    os.environ.setdefault('FLASK_ENV', 'production')
    os.environ.setdefault('CONFIG_NAME', 'production')

    from app import create_app, db
    from config import config

    # Try production config first, fallback to default
    config_name = os.getenv('CONFIG_NAME', 'default')
    try:
        app = create_app(config_name)
        print(f"Created Flask app with config: {config_name}")
    except Exception as e:
        print(f"Failed with config '{config_name}': {e}")
        print("Trying default config...")
        app = create_app('default')

    with app.app_context():
        # Import all models to ensure they're registered
        from app.models.school import School, SchoolFeature, SchoolSetting
        from app.models.user import User, Role, Permission, RolePermission
        from app.models.student import (
            Student, ParentDetail, StudentDocument, AcademicYear, Class, Section,
            StudentPromotion, StudentAchievement, StudentBehavior, StudentTimeline,
            StudentCounseling, StudentHouse, Alumni, StudentMedical
        )
        from app.models.lead import Lead, LeadSource, LeadFollowup, LeadActivity, Campaign
        from app.models.admission import (
            Admission, AdmissionSettings, AdmissionDocument, AdmissionStatusHistory,
            SeatMatrix, AdmissionWaitlist, AdmissionTest, AdmissionTestResult, TransferCertificate
        )
        from app.models.staff import (
            Staff, StaffPayroll, StaffDocument, SalaryStructure,
            StaffLeave, StaffLeaveBalance, PerformanceReview,
            Recruitment, JobApplication, TrainingRecord, DutyRoster
        )
        from app.models.academic import (
            Subject, SubjectComponent, ClassSubject, Timetable,
            ExamType, GradingSystem, Grade,
            Exam, ExamSchedule, ExamGroup, ExamGroupMapping,
            ExamResult, MarkEntry,
            ExamHall, ExamSeating, ExamInvigilator, ExamAdmitCard,
            ReportCard, ExamIncident,
            Syllabus, SyllabusProgress, LessonPlan,
            Homework, HomeworkSubmission, StudyMaterial,
            AcademicCalendar, TeacherSubject,
            ElectiveGroup, ElectiveSubject, StudentElective
        )
        from app.models.attendance import (
            StudentAttendance, StaffAttendance,
            LeaveType, LeaveApplication,
            LateArrival, AttendanceRule, AttendanceDevice,
            EventAttendance, SubstituteAssignment
        )
        from app.models.fee import (
            FeeCategory, FeeStructure, FeePayment, FeeDiscount,
            FeeInstallment, FeeReceipt, Scholarship, ScholarshipAward,
            Concession, Expense, Vendor, PurchaseOrder, Budget,
            AccountingEntry, BankReconciliation, FeeRefund
        )
        from app.models.communication import Announcement, Notification, SmsTemplate
        from app.models.inventory import (
            AssetCategory, Asset, AssetMaintenance,
            InventoryCategory, InventoryItem, InventoryTransaction,
            PurchaseRequest, PurchaseOrderInv, VendorQuotation, AssetDisposal
        )
        from app.models.transport import (
            Vehicle, Driver, TransportRoute, TransportStop, StudentTransport,
            GPSTracking, VehicleMaintenance, FuelLog, TransportFee,
            SOSAlert, TripManagement, RouteChangeRequest, SpeedAlert
        )
        from app.models.library import (
            LibraryCategory, LibraryBook, BookCopy, LibraryIssue,
            BookReservation, BookFine, EbookResource, Periodical,
            ReadingHistory, LibraryBudget
        )
        from app.models.parent import (
            ParentProfile, PTMSlot, PTMBooking, FeedbackSurvey, FeedbackResponse,
            Grievance, ConsentForm, ConsentResponse, ParentNotification, ParentMessage,
            DailyActivity, VolunteerRegistration, PickupAuthorization
        )
        from app.models.health import (
            HealthRecord, InfirmaryVisit, IncidentReport, HealthCheckup,
            VisitorLog, SafetyDrill, MedicationTracking, EmergencyContact,
            WellbeingRecord, SanitizationLog, TemperatureScreen
        )
        from app.models.hostel import (
            HostelBlock, HostelRoom, HostelAllocation, MessMenu,
            MessAttendance, OutpassRequest, HostelVisitor,
            HostelComplaint, HostelInspection
        )
        from app.models.canteen import (
            CanteenWallet, CanteenMenuItem, CanteenTransaction,
            CanteenInventory, CanteenVendor, CanteenPreorder
        )
        from app.models.sports import (
            Sport, SportsTeam, Tournament, TournamentMatch,
            Club, ClubMember, Event, FacilityBooking, FitnessRecord, Certificate
        )
        from app.models.subscription import SubscriptionPlan, SchoolSubscription
        from app.models.audit import AuditLog

        print("\n" + "="*60)
        print("CHECKING EXISTING TABLES")
        print("="*60)

        # Get list of existing tables
        inspector = db.inspect(db.engine)
        existing_tables = set(inspector.get_table_names())
        print(f"Found {len(existing_tables)} existing tables: {sorted(existing_tables)}")

        # Get all model table names
        all_models = db.Model.__subclasses__()
        # Also get subclasses of subclasses (nested inheritance)
        all_model_tables = set()
        for model in all_models:
            if hasattr(model, '__tablename__'):
                all_model_tables.add(model.__tablename__)

        # Check for deeply nested subclasses
        for model in list(all_models):
            for sub in model.__subclasses__():
                if hasattr(sub, '__tablename__'):
                    all_model_tables.add(sub.__tablename__)
                for sub2 in sub.__subclasses__():
                    if hasattr(sub2, '__tablename__'):
                        all_model_tables.add(sub2.__tablename__)

        missing_tables = all_model_tables - existing_tables
        print(f"\nModel-defined tables: {len(all_model_tables)}")
        print(f"Missing tables: {len(missing_tables)}")

        if missing_tables:
            print(f"\nTables to be created: {sorted(missing_tables)}")
        else:
            print("\nAll model tables already exist!")

        # Create all tables (only creates tables that don't exist)
        print("\n" + "="*60)
        print("CREATING MISSING TABLES")
        print("="*60)

        try:
            db.create_all()
            print("✓ db.create_all() executed successfully!")
        except Exception as e:
            print(f"✗ Error during db.create_all(): {e}")
            print("\nTrying table-by-table creation...")

            # Fallback: create tables one by one
            for table_name in sorted(missing_tables):
                try:
                    # Find the model for this table
                    model_class = None
                    for model in all_models:
                        if hasattr(model, '__tablename__') and model.__tablename__ == table_name:
                            model_class = model
                            break
                    if model_class:
                        model_class.__table__.create(db.engine, checkfirst=True)
                        print(f"  ✓ Created table: {table_name}")
                    else:
                        print(f"  ? Could not find model for: {table_name}")
                except Exception as te:
                    print(f"  ✗ Error creating {table_name}: {te}")

        # Verify
        print("\n" + "="*60)
        print("VERIFICATION")
        print("="*60)

        inspector = db.inspect(db.engine)
        new_existing = set(inspector.get_table_names())
        newly_created = new_existing - existing_tables
        still_missing = all_model_tables - new_existing

        print(f"Total tables now: {len(new_existing)}")
        if newly_created:
            print(f"Newly created tables ({len(newly_created)}): {sorted(newly_created)}")
        if still_missing:
            print(f"⚠ Still missing tables ({len(still_missing)}): {sorted(still_missing)}")
        else:
            print("✓ All model tables exist in database!")

        # Also check for missing columns in existing tables
        print("\n" + "="*60)
        print("CHECKING FOR MISSING COLUMNS IN EXISTING TABLES")
        print("="*60)

        columns_ok = True
        for model in all_models:
            if not hasattr(model, '__tablename__'):
                continue
            table_name = model.__tablename__
            if table_name not in new_existing:
                continue

            try:
                existing_cols = {col['name'] for col in inspector.get_columns(table_name)}
                model_cols = {col.name for col in model.__table__.columns}
                missing_cols = model_cols - existing_cols

                if missing_cols:
                    columns_ok = False
                    print(f"\n⚠ {table_name}: Missing columns: {missing_cols}")
                    # Try to add missing columns
                    for col_name in sorted(missing_cols):
                        col_obj = None
                        for c in model.__table__.columns:
                            if c.name == col_name:
                                col_obj = c
                                break
                        if col_obj:
                            try:
                                alter_sql = f"ALTER TABLE `{table_name}` ADD COLUMN `{col_name}` {col_obj.type}"
                                db.session.execute(db.text(alter_sql))
                                db.session.commit()
                                print(f"  ✓ Added column {table_name}.{col_name}")
                            except Exception as ce:
                                db.session.rollback()
                                print(f"  ✗ Could not add {table_name}.{col_name}: {ce}")
            except Exception as e:
                print(f"  Error checking {table_name}: {e}")

        if columns_ok:
            print("✓ All columns exist in all tables!")

        print("\n" + "="*60)
        print("MIGRATION COMPLETE!")
        print("="*60)


if __name__ == '__main__':
    main()
