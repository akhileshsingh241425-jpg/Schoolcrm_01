"""Migration: Create platform staff tables for super admin staff management"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from config import Config
import pymysql

conn = pymysql.connect(
    host=Config.DB_HOST, port=int(Config.DB_PORT),
    user=Config.DB_USER, password=Config.DB_PASSWORD, database=Config.DB_NAME,
)
cursor = conn.cursor()

print("Creating platform staff tables...")

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
)""")
print("  + Created platform_staff")

cursor.execute("""
CREATE TABLE IF NOT EXISTS platform_staff_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present','absent','late','half_day','leave') NOT NULL,
    check_in TIME,
    check_out TIME,
    remarks VARCHAR(255),
    FOREIGN KEY (staff_id) REFERENCES platform_staff(id) ON DELETE CASCADE,
    UNIQUE KEY unique_platform_attendance (staff_id, date)
)""")
print("  + Created platform_staff_attendance")

cursor.execute("""
CREATE TABLE IF NOT EXISTS platform_staff_payroll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    basic_salary DECIMAL(12,2),
    allowances DECIMAL(12,2) DEFAULT 0,
    deductions DECIMAL(12,2) DEFAULT 0,
    net_salary DECIMAL(12,2),
    overtime_amount DECIMAL(12,2) DEFAULT 0,
    leave_deduction DECIMAL(12,2) DEFAULT 0,
    payment_status ENUM('pending','paid','hold') DEFAULT 'pending',
    payment_date DATE,
    payment_mode ENUM('bank_transfer','cheque','cash'),
    transaction_ref VARCHAR(255),
    remarks VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES platform_staff(id) ON DELETE CASCADE
)""")
print("  + Created platform_staff_payroll")

cursor.execute("""
CREATE TABLE IF NOT EXISTS platform_staff_leaves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    leave_type ENUM('CL','EL','SL','ML','LWP') NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    days INT NOT NULL,
    reason TEXT,
    document_url VARCHAR(500),
    status ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
    approved_by INT,
    approved_at DATETIME,
    remarks VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES platform_staff(id) ON DELETE CASCADE
)""")
print("  + Created platform_staff_leaves")

conn.commit()
cursor.close()
conn.close()
print("Migration complete!")
