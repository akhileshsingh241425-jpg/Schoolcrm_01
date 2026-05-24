"""
Comprehensive migration: All new tables + columns added in recent updates.
Run from project root:
  cd /var/www/school-crm && sudo /var/www/school-crm/backend/venv/bin/python3 migrate_comprehensive.py
"""
import sys, os, pymysql
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from config import Config

conn = pymysql.connect(
    host=Config.DB_HOST, port=int(Config.DB_PORT),
    user=Config.DB_USER, password=Config.DB_PASSWORD, database=Config.DB_NAME,
)
cursor = conn.cursor()
print("=== COMPREHENSIVE MIGRATION ===\n")

# ─── 1. SCHOOLS: Add missing columns ───────────────────────────
print("[1/6] Checking schools table columns...")
school_cols = [
    ("short_name", "VARCHAR(100) DEFAULT NULL"),
    ("secondary_phone", "VARCHAR(20) DEFAULT NULL"),
    ("alternate_contacts", "JSON DEFAULT NULL"),
    ("domain_name", "VARCHAR(255) DEFAULT NULL"),
    ("session", "VARCHAR(50) DEFAULT NULL"),
    ("notes", "TEXT DEFAULT NULL"),
    ("custom_fields", "JSON DEFAULT NULL"),
    ("theme_color", "VARCHAR(50) DEFAULT NULL"),
]
for col, col_type in school_cols:
    try:
        cursor.execute(f"ALTER TABLE schools ADD COLUMN {col} {col_type}")
        print(f"  + Added column: schools.{col}")
    except pymysql.err.OperationalError as e:
        if "Duplicate column" in str(e):
            print(f"  ~ schools.{col} already exists")
        else:
            raise

# ─── 2. DIRECTORS table ────────────────────────────────────────
print("\n[2/6] Creating directors table...")
cursor.execute("""
CREATE TABLE IF NOT EXISTS directors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    secondary_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    qualification VARCHAR(255),
    experience_years INT,
    aadhar_no VARCHAR(20),
    aadhar_doc_url VARCHAR(500),
    pan_no VARCHAR(20),
    pan_doc_url VARCHAR(500),
    photo_url VARCHAR(500),
    other_doc_name VARCHAR(255),
    other_doc_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
""")
print("  + Created directors table")

# ─── 3. PARENT DOCUMENTS table ─────────────────────────────────
print("\n[3/6] Creating parent_documents table...")
cursor.execute("""
CREATE TABLE IF NOT EXISTS parent_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    school_id INT NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255),
    file_url VARCHAR(500) NOT NULL,
    verified TINYINT(1) DEFAULT 0,
    verified_by INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parent_details(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
""")
print("  + Created parent_documents table")

# ─── 4. SUBSCRIPTION PAYMENTS table ────────────────────────────
print("\n[4/6] Creating subscription_payments table...")
cursor.execute("""
CREATE TABLE IF NOT EXISTS subscription_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subscription_id INT NOT NULL,
    school_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_mode ENUM('cash','online','bank_transfer','cheque','upi','dd') NOT NULL,
    transaction_id VARCHAR(255),
    receipt_no VARCHAR(50) NOT NULL,
    status ENUM('completed','pending','failed','refunded') DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_id) REFERENCES school_subscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
""")
print("  + Created subscription_payments table")

# ─── 5. PLATFORM STAFF tables ──────────────────────────────────
print("\n[5/6] Creating platform staff tables...")
cursor.execute("""
CREATE TABLE IF NOT EXISTS platform_staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    gender ENUM('male','female','other'),
    date_of_birth DATE,
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    qualification VARCHAR(255),
    experience_years INT,
    designation VARCHAR(100),
    department VARCHAR(100),
    date_of_joining DATE,
    salary DECIMAL(12,2),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    photo_url VARCHAR(500),
    aadhar_no VARCHAR(20),
    pan_no VARCHAR(20),
    bank_name VARCHAR(100),
    bank_account_no VARCHAR(50),
    ifsc_code VARCHAR(20),
    staff_type ENUM('admin','technical','support','management') DEFAULT 'admin',
    contract_type ENUM('permanent','contract','probation','part_time') DEFAULT 'permanent',
    pf_number VARCHAR(50),
    emergency_contact VARCHAR(20),
    emergency_person VARCHAR(100),
    blood_group VARCHAR(10),
    status ENUM('active','inactive','resigned','terminated') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
""")
print("  + Created platform_staff")

cursor.execute("""
CREATE TABLE IF NOT EXISTS platform_staff_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present','absent','late','half_day','leave') NOT NULL,
    check_in TIME,
    check_out TIME,
    remarks TEXT,
    marked_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES platform_staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
""")
print("  + Created platform_staff_attendance")

cursor.execute("""
CREATE TABLE IF NOT EXISTS platform_staff_payroll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    month_year DATE NOT NULL,
    basic_salary DECIMAL(12,2) DEFAULT 0,
    allowances DECIMAL(12,2) DEFAULT 0,
    deductions DECIMAL(12,2) DEFAULT 0,
    net_salary DECIMAL(12,2) NOT NULL,
    payment_date DATE,
    payment_mode VARCHAR(50),
    transaction_id VARCHAR(255),
    remarks TEXT,
    status ENUM('pending','paid','cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES platform_staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
""")
print("  + Created platform_staff_payroll")

cursor.execute("""
CREATE TABLE IF NOT EXISTS platform_staff_leave (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    leave_type ENUM('sick','casual','earned','annual','maternity','paternity','other') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL,
    reason TEXT,
    status ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
    approved_by INT,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES platform_staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
""")
print("  + Created platform_staff_leave")

# ─── 6. CHECK existing tables for missing columns ──────────────
print("\n[6/6] Checking for other missing columns...")

# student_documents might need issue_date
try:
    cursor.execute("SHOW COLUMNS FROM student_documents LIKE 'issue_date'")
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE student_documents ADD COLUMN issue_date DATE DEFAULT NULL")
        print("  + Added student_documents.issue_date")
except Exception as e:
    print(f"  ~ student_documents check: {e}")

# Check school_subscriptions has all needed columns
try:
    cursor.execute("SHOW COLUMNS FROM school_subscriptions LIKE 'razorpay_subscription_id'")
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE school_subscriptions ADD COLUMN razorpay_subscription_id VARCHAR(255) DEFAULT NULL")
        print("  + Added school_subscriptions.razorpay_subscription_id")
except Exception as e:
    print(f"  ~ school_subscriptions check: {e}")

conn.commit()
cursor.close()
conn.close()

print("\n=== MIGRATION COMPLETE! ===")
print("""
Now run:
  sudo /var/www/school-crm/backend/venv/bin/python3 create_dummy_school.py
""")
