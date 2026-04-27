#!/usr/bin/env python3
"""
Clear All Dummy Data - School CRM
==================================
Ye script saara dummy data database se hata deta hai.
Super Admin account (admin@schoolcrm.com) safe rahega.
Roles aur permissions bhi safe rahenge.
"""

import pymysql

# ─── DB Connection ───────────────────────────────────────────────────
conn = pymysql.connect(
    host='localhost', user='root', password='root', database='school_crm',
    port=3306, autocommit=False, charset='utf8mb4'
)
cur = conn.cursor()

print("=" * 60)
print("  SCHOOL CRM - CLEAR ALL DUMMY DATA")
print("=" * 60)
print("\n⚠  WARNING: Ye saara data hata dega (Super Admin safe rahega)")
confirm = input("  Continue karna hai? (yes/no): ").strip().lower()
if confirm != 'yes':
    print("  Cancelled.")
    conn.close()
    exit(0)

print("\n[1/4] Foreign key checks band kar raha hai...")
cur.execute("SET FOREIGN_KEY_CHECKS=0")
conn.commit()

# ─── Step 1: Large tables TRUNCATE (fast) ────────────────────────────
print("[2/4] Large tables truncate kar raha hai...")
large_tables = [
    'student_attendance', 'exam_results', 'fee_installments', 'fee_payments',
    'staff_attendance', 'staff_payroll', 'parent_details',
    'canteen_transactions', 'library_issues', 'inventory_transactions',
    'sport_match_events', 'student_marks',
]
for t in large_tables:
    try:
        cur.execute(f"TRUNCATE TABLE `{t}`")
        conn.commit()
        print(f"    ✓ Truncated: {t}")
    except Exception as e:
        conn.rollback()
        print(f"    - Skipped: {t} ({e})")

# ─── Step 2: All school data tables ──────────────────────────────────
print("\n[3/4] Sab tables se data hata raha hai...")

tables_to_clean = [
    # Academics
    'homework_submissions', 'homework', 'study_materials',
    'mark_entries', 'exam_results', 'exam_seatings', 'exam_invigilators',
    'exam_admit_cards', 'exam_incidents', 'exam_schedules',
    'exam_group_mappings', 'exam_groups', 'exams', 'exam_types', 'exam_halls',
    'report_cards', 'grades', 'grading_systems',
    'syllabus_progress', 'syllabus', 'lesson_plans',
    'subject_components', 'class_subjects', 'timetable', 'subjects',
    # Attendance & Leave
    'student_attendance', 'staff_attendance', 'leave_applications', 'leave_types',
    'late_arrivals', 'attendance_rules', 'attendance_devices', 'event_attendance',
    # Finance
    'fee_receipts', 'fee_payments', 'fee_installments', 'fee_discounts',
    'scholarship_awards', 'scholarships', 'fee_structures', 'fee_categories',
    # Library
    'library_reservations', 'library_issues', 'library_books',
    'library_categories', 'library_settings',
    # Hostel
    'hostel_complaints', 'hostel_visitors', 'hostel_leaves', 'hostel_fee_payments',
    'hostel_allocations', 'hostel_rooms', 'hostels',
    # Canteen
    'canteen_transactions', 'canteen_wallets', 'canteen_menu',
    'canteen_orders', 'canteen_order_items', 'canteen_vendors',
    # Sports
    'sport_match_events', 'sport_matches', 'tournaments', 'sport_team_members',
    'sports_teams', 'sports', 'sport_categories',
    # Health
    'infirmary_visits', 'health_checkups', 'health_records', 'health_staff',
    'vaccination_records', 'health_complaints',
    # Transport
    'student_transport', 'transport_fees', 'transport_attendance',
    'route_stops', 'transport_routes', 'drivers', 'vehicles',
    # Inventory
    'inventory_transactions', 'inventory_items', 'inventory_categories',
    'assets', 'asset_maintenance', 'asset_allocation',
    # Communication
    'notifications', 'announcements', 'messages', 'notice_board',
    'circular_recipients', 'circulars', 'sms_logs', 'email_logs',
    'whatsapp_logs', 'communication_templates',
    # Events & Activities
    'event_registrations', 'events', 'clubs', 'club_members',
    'galleries', 'achievements',
    # Parent Portal
    'pickup_authorizations', 'volunteer_registrations', 'daily_activities',
    'parent_messages', 'parent_notifications', 'consent_responses',
    'consent_forms', 'grievances', 'feedback_responses', 'feedback_surveys',
    'ptm_bookings', 'ptm_slots', 'parent_profiles',
    # HR
    'duty_rosters', 'training_records', 'job_applications', 'recruitments',
    'performance_reviews', 'staff_leave_balances', 'staff_leaves',
    'staff_payroll', 'salary_structures', 'staff_documents',
    # Leads & Admissions
    'lead_activities', 'lead_followups', 'leads', 'campaigns', 'lead_sources',
    'admission_test_results', 'admission_tests', 'admission_waitlists',
    'seat_matrix', 'admission_status_history', 'admission_documents',
    'admissions', 'admission_settings',
    # Student Records
    'student_timeline', 'student_counseling', 'student_medical',
    'student_achievements', 'student_behaviors', 'student_documents',
    'student_promotions', 'alumni', 'parent_details',
    'student_houses', 'student_marks',
    # Core - Students & Staff (last)
    'students', 'staff',
    # Classes & Sections
    'sections', 'classes',
    # Schools (remove dummy schools but keep super admin's access)
    'school_settings', 'school_branding', 'schools',
    # Alerts & Notifications
    'alert_rules', 'alert_logs',
]

cleaned_total = 0
for t in tables_to_clean:
    try:
        cur.execute(f"DELETE FROM `{t}`")
        count = cur.rowcount
        conn.commit()
        if count > 0:
            print(f"    ✓ Deleted {count:>6,} rows from: {t}")
    except Exception as e:
        try:
            conn.rollback()
        except:
            pass
        print(f"    - Skipped: {t}")

# ─── Step 3: Clean users (keep super admin only) ─────────────────────
print("\n    Cleaning users (super admin safe rakhenge)...")
try:
    cur.execute("""
        DELETE u FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name != 'super_admin'
    """)
    count = cur.rowcount
    conn.commit()
    print(f"    ✓ Deleted {count} non-superadmin users")
except Exception as e:
    conn.rollback()
    print(f"    - User cleanup skipped: {e}")

# Clean orphan user_roles
try:
    cur.execute("""
        DELETE ur FROM user_roles ur
        LEFT JOIN users u ON ur.user_id = u.id
        WHERE u.id IS NULL
    """)
    conn.commit()
except:
    conn.rollback()

# ─── Step 4: Re-enable FK checks ────────────────────────────────────
print("\n[4/4] Foreign key checks wapis on kar raha hai...")
cur.execute("SET FOREIGN_KEY_CHECKS=1")
conn.commit()

# ─── Final Verification ───────────────────────────────────────────────
print("\n" + "=" * 60)
print("  DATABASE CLEAN! ✓")
print("=" * 60)

cur.execute("SELECT COUNT(*) FROM students")
s = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM staff")
st = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM schools")
sc = cur.fetchone()[0]
cur.execute("SELECT id, email FROM users WHERE id IN (SELECT user_id FROM user_roles ur JOIN roles r ON ur.role_id=r.id WHERE r.name='super_admin')")
admins = cur.fetchall()

print(f"\n  Students remaining : {s}")
print(f"  Staff remaining    : {st}")
print(f"  Schools remaining  : {sc}")
print(f"\n  Super Admin accounts:")
for a in admins:
    print(f"    - ID: {a[0]}, Email: {a[1]}")
print(f"\n  Login: admin@schoolcrm.com / superadmin123")
print("\n  Ab aap fresh testing shuru kar sakte hain!")
print("=" * 60)

conn.close()
