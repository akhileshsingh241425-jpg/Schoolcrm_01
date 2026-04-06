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
