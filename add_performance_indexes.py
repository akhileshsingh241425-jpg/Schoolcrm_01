"""
Performance Indexes Migration
Run this script to add critical database indexes for handling 1 lakh+ students.
"""
import sys
sys.path.insert(0, 'backend')

from app import create_app, db
from sqlalchemy import text

app = create_app()

INDEXES = [
    # Students - most queried table
    "CREATE INDEX IF NOT EXISTS idx_students_school_status ON students(school_id, status)",
    "CREATE INDEX IF NOT EXISTS idx_students_school_class ON students(school_id, current_class_id)",
    "CREATE INDEX IF NOT EXISTS idx_students_school_section ON students(school_id, current_section_id)",
    "CREATE INDEX IF NOT EXISTS idx_students_school_year ON students(school_id, academic_year_id)",
    "CREATE INDEX IF NOT EXISTS idx_students_name ON students(school_id, first_name, last_name)",
    "CREATE INDEX IF NOT EXISTS idx_students_sibling ON students(school_id, sibling_group_id)",

    # Student Attendance - very high volume table
    "CREATE INDEX IF NOT EXISTS idx_student_att_school_date ON student_attendance(school_id, date)",
    "CREATE INDEX IF NOT EXISTS idx_student_att_student_date ON student_attendance(student_id, date)",
    "CREATE INDEX IF NOT EXISTS idx_student_att_class_date ON student_attendance(school_id, class_id, date)",
    "CREATE INDEX IF NOT EXISTS idx_student_att_section_date ON student_attendance(school_id, section_id, date)",

    # Staff Attendance
    "CREATE INDEX IF NOT EXISTS idx_staff_att_school_date ON staff_attendance(school_id, date)",
    "CREATE INDEX IF NOT EXISTS idx_staff_att_staff_date ON staff_attendance(staff_id, date)",

    # Fee Installments
    "CREATE INDEX IF NOT EXISTS idx_fee_inst_school_student ON fee_installments(school_id, student_id)",
    "CREATE INDEX IF NOT EXISTS idx_fee_inst_student_status ON fee_installments(student_id, status)",
    "CREATE INDEX IF NOT EXISTS idx_fee_inst_school_status ON fee_installments(school_id, status)",
    "CREATE INDEX IF NOT EXISTS idx_fee_inst_due_date ON fee_installments(school_id, due_date)",

    # Fee Payments
    "CREATE INDEX IF NOT EXISTS idx_fee_pay_school_date ON fee_payments(school_id, payment_date)",
    "CREATE INDEX IF NOT EXISTS idx_fee_pay_school_status ON fee_payments(school_id, status)",
    "CREATE INDEX IF NOT EXISTS idx_fee_pay_student ON fee_payments(student_id)",
    "CREATE INDEX IF NOT EXISTS idx_fee_pay_structure ON fee_payments(fee_structure_id, status)",

    # Fee Structures
    "CREATE INDEX IF NOT EXISTS idx_fee_struct_school_class ON fee_structures(school_id, class_id)",

    # Parent Details
    "CREATE INDEX IF NOT EXISTS idx_parent_student ON parent_details(student_id)",
    "CREATE INDEX IF NOT EXISTS idx_parent_school ON parent_details(school_id)",
    "CREATE INDEX IF NOT EXISTS idx_parent_user ON parent_details(user_id)",

    # Leads
    "CREATE INDEX IF NOT EXISTS idx_leads_school_status ON leads(school_id, status)",
    "CREATE INDEX IF NOT EXISTS idx_leads_school_created ON leads(school_id, created_at)",

    # Admissions
    "CREATE INDEX IF NOT EXISTS idx_admissions_school_status ON admissions(school_id, status)",

    # Classes & Sections
    "CREATE INDEX IF NOT EXISTS idx_classes_school ON classes(school_id)",
    "CREATE INDEX IF NOT EXISTS idx_sections_school_class ON sections(school_id, class_id)",

    # Leave Applications
    "CREATE INDEX IF NOT EXISTS idx_leave_app_school_status ON leave_applications(school_id, status)",

    # Staff
    "CREATE INDEX IF NOT EXISTS idx_staff_school_status ON staff(school_id, status)",
]

with app.app_context():
    success = 0
    skipped = 0
    for idx_sql in INDEXES:
        try:
            # MySQL doesn't support IF NOT EXISTS for indexes, handle gracefully
            idx_name = idx_sql.split("IF NOT EXISTS ")[1].split(" ON")[0]
            table_name = idx_sql.split(" ON ")[1].split("(")[0]
            
            # Check if index already exists
            result = db.session.execute(text(
                f"SELECT COUNT(*) FROM information_schema.statistics "
                f"WHERE table_schema = DATABASE() AND table_name = '{table_name}' "
                f"AND index_name = '{idx_name}'"
            )).scalar()
            
            if result > 0:
                print(f"  SKIP  {idx_name} (already exists)")
                skipped += 1
                continue

            # Create index (remove IF NOT EXISTS for MySQL compatibility)
            clean_sql = idx_sql.replace("IF NOT EXISTS ", "")
            db.session.execute(text(clean_sql))
            db.session.commit()
            print(f"  OK    {idx_name}")
            success += 1
        except Exception as e:
            db.session.rollback()
            print(f"  FAIL  {idx_sql[:60]}... → {e}")

    print(f"\nDone: {success} created, {skipped} skipped")
