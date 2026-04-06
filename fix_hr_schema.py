import pymysql

conn = pymysql.connect(host='localhost', user='root', password='root', database='school_crm')
cur = conn.cursor()

# --- ALTER TABLE staff ---
staff_new_cols = [
    ("staff_type", "VARCHAR(20) DEFAULT 'teaching'"),
    ("contract_type", "VARCHAR(20) DEFAULT 'permanent'"),
    ("probation_end_date", "DATE NULL"),
    ("contract_end_date", "DATE NULL"),
    ("pf_number", "VARCHAR(30) NULL"),
    ("esi_number", "VARCHAR(30) NULL"),
    ("uan_number", "VARCHAR(30) NULL"),
    ("emergency_contact", "VARCHAR(15) NULL"),
    ("emergency_person", "VARCHAR(100) NULL"),
    ("blood_group", "VARCHAR(5) NULL"),
    ("marital_status", "VARCHAR(15) NULL"),
    ("spouse_name", "VARCHAR(100) NULL"),
    ("exit_date", "DATE NULL"),
    ("exit_reason", "TEXT NULL"),
]

cur.execute("DESCRIBE staff")
existing = [r[0] for r in cur.fetchall()]

for col, defn in staff_new_cols:
    if col not in existing:
        cur.execute(f"ALTER TABLE staff ADD COLUMN {col} {defn}")
        print(f"Added staff.{col}")
    else:
        print(f"staff.{col} already exists")

# Update status enum
cur.execute("ALTER TABLE staff MODIFY COLUMN status ENUM('active','inactive','resigned','terminated','on_notice') DEFAULT 'active'")
print("Updated staff.status enum")

# --- ALTER TABLE staff_payroll ---
payroll_new_cols = [
    ("hra", "DECIMAL(12,2) DEFAULT 0"),
    ("da", "DECIMAL(12,2) DEFAULT 0"),
    ("ta", "DECIMAL(12,2) DEFAULT 0"),
    ("medical_allowance", "DECIMAL(12,2) DEFAULT 0"),
    ("special_allowance", "DECIMAL(12,2) DEFAULT 0"),
    ("other_allowance", "DECIMAL(12,2) DEFAULT 0"),
    ("gross_salary", "DECIMAL(12,2) DEFAULT 0"),
    ("pf_deduction", "DECIMAL(12,2) DEFAULT 0"),
    ("esi_deduction", "DECIMAL(12,2) DEFAULT 0"),
    ("tds", "DECIMAL(12,2) DEFAULT 0"),
    ("professional_tax", "DECIMAL(12,2) DEFAULT 0"),
    ("other_deduction", "DECIMAL(12,2) DEFAULT 0"),
    ("total_deductions", "DECIMAL(12,2) DEFAULT 0"),
    ("overtime_hours", "DECIMAL(5,2) DEFAULT 0"),
    ("overtime_amount", "DECIMAL(12,2) DEFAULT 0"),
    ("leave_deduction", "DECIMAL(12,2) DEFAULT 0"),
    ("payment_mode", "VARCHAR(20) DEFAULT 'bank_transfer'"),
    ("transaction_ref", "VARCHAR(100) NULL"),
    ("remarks", "TEXT NULL"),
]

cur.execute("DESCRIBE staff_payroll")
payroll_existing = [r[0] for r in cur.fetchall()]

for col, defn in payroll_new_cols:
    if col not in payroll_existing:
        cur.execute(f"ALTER TABLE staff_payroll ADD COLUMN {col} {defn}")
        print(f"Added staff_payroll.{col}")
    else:
        print(f"staff_payroll.{col} already exists")

# Update payment_status enum
cur.execute("ALTER TABLE staff_payroll MODIFY COLUMN payment_status ENUM('pending','paid','hold') DEFAULT 'pending'")
print("Updated staff_payroll.payment_status enum")

conn.commit()
print("\n--- ALTER TABLE complete ---")

# --- Create new tables via db.create_all ---
conn.close()

import sys
sys.path.insert(0, 'backend')
from app import create_app
app = create_app()
from app import db

with app.app_context():
    db.create_all()
    print("db.create_all() done - new tables created!")

# Verify
conn = pymysql.connect(host='localhost', user='root', password='root', database='school_crm')
cur = conn.cursor()
cur.execute("SHOW TABLES")
tables = sorted([r[0] for r in cur.fetchall()])
new_tables = [t for t in tables if t.startswith(('staff_doc', 'salary_', 'staff_lea', 'performance', 'recruitment', 'job_app', 'training_', 'duty_'))]
print(f"\nNew HR tables: {new_tables}")
conn.close()
