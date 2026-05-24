"""
Migration: Add school columns (short_name, domain, session, etc.) and director table.
Run from project root:
  python migrate_school_director.py
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from config import Config
import pymysql

conn = pymysql.connect(
    host=Config.DB_HOST,
    port=int(Config.DB_PORT),
    user=Config.DB_USER,
    password=Config.DB_PASSWORD,
    database=Config.DB_NAME,
)
cursor = conn.cursor()

print("Running migration: school director & new columns...")

# Add new columns to schools table
new_columns = [
    ("short_name", "VARCHAR(100) DEFAULT NULL"),
    ("secondary_phone", "VARCHAR(20) DEFAULT NULL"),
    ("alternate_contacts", "JSON DEFAULT NULL"),
    ("domain_name", "VARCHAR(255) DEFAULT NULL"),
    ("session", "VARCHAR(50) DEFAULT NULL"),
    ("notes", "TEXT DEFAULT NULL"),
    ("custom_fields", "JSON DEFAULT NULL"),
]
for col, col_type in new_columns:
    try:
        cursor.execute(f"ALTER TABLE schools ADD COLUMN {col} {col_type}")
        print(f"  + Added column: {col}")
    except pymysql.err.OperationalError as e:
        if "Duplicate column" in str(e):
            print(f"  ~ Column {col} already exists, skipping")
        else:
            raise

# Create directors table
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
)
""")
print("  + Created directors table")

conn.commit()
cursor.close()
conn.close()
print("Migration complete!")
