"""
Create alert_settings and notification_logs tables,
and add 'whatsapp' column to parent_details and parent_profiles.
"""
import pymysql
import os

DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASS = os.environ.get('DB_PASSWORD', '')
DB_NAME = os.environ.get('DB_NAME', 'school_crm')

conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASS, database=DB_NAME)
cursor = conn.cursor()

# 1. alert_settings table
cursor.execute("""
CREATE TABLE IF NOT EXISTS alert_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    alert_type ENUM('late_arrival','daily_absent','monthly_attendance',
                     'exam_schedule','exam_result','fee_reminder','low_attendance_warning') NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    channels JSON DEFAULT NULL,
    config JSON DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE KEY unique_alert_type_per_school (school_id, alert_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
""")
print("[OK] alert_settings table created")

# 2. notification_logs table
cursor.execute("""
CREATE TABLE IF NOT EXISTS notification_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    channel ENUM('email','whatsapp','sms','in_app') NOT NULL,
    recipient_name VARCHAR(255),
    recipient_contact VARCHAR(255),
    student_id INT,
    subject VARCHAR(255),
    message TEXT,
    status ENUM('sent','failed','pending') DEFAULT 'pending',
    error_message TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    INDEX idx_notiflog_school (school_id),
    INDEX idx_notiflog_type (alert_type),
    INDEX idx_notiflog_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
""")
print("[OK] notification_logs table created")

# 3. Add whatsapp column to parent_details (if not exists)
try:
    cursor.execute("ALTER TABLE parent_details ADD COLUMN whatsapp VARCHAR(20) DEFAULT NULL;")
    print("[OK] whatsapp column added to parent_details")
except Exception as e:
    if 'Duplicate column' in str(e):
        print("[SKIP] whatsapp column already exists in parent_details")
    else:
        print(f"[WARN] parent_details: {e}")

# 4. Add whatsapp column to parent_profiles (if not exists)
try:
    cursor.execute("ALTER TABLE parent_profiles ADD COLUMN whatsapp VARCHAR(20) DEFAULT NULL;")
    print("[OK] whatsapp column added to parent_profiles")
except Exception as e:
    if 'Duplicate column' in str(e):
        print("[SKIP] whatsapp column already exists in parent_profiles")
    else:
        print(f"[WARN] parent_profiles: {e}")

conn.commit()
cursor.close()
conn.close()
print("\n[DONE] All alert tables and columns created successfully!")
