"""
Add missing columns to schools table on production server.
Run: python3 migrate_school_columns.py
"""
import sys
import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', 3306))
DB_NAME = os.getenv('DB_NAME', 'rohit0101')
DB_USER = os.getenv('DB_USER', 'rohit')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'rohit0101')

try:
    import pymysql
except ImportError:
    os.system(f"{sys.executable} -m pip install pymysql")
    import pymysql

# Try connecting
conn = None
for creds in [
    {'host': DB_HOST, 'port': DB_PORT, 'user': DB_USER, 'password': DB_PASSWORD, 'db': DB_NAME},
    {'host': 'localhost', 'port': 3306, 'user': 'root', 'password': 'root', 'db': 'school_crm'},
    {'host': 'localhost', 'port': 3306, 'user': 'rohit', 'password': 'rohit0101', 'db': 'rohit0101'},
]:
    try:
        conn = pymysql.connect(**creds, charset='utf8mb4')
        print(f"Connected: {creds['user']}@{creds['db']}")
        break
    except:
        continue

if not conn:
    print("Could not connect to database!")
    sys.exit(1)

cur = conn.cursor()

# Get existing columns in schools table
cur.execute("SHOW COLUMNS FROM schools")
existing_cols = {row[0] for row in cur.fetchall()}
print(f"Existing columns in schools: {existing_cols}")

# Define all columns that should exist (from the School model)
required_columns = {
    'logo_url': 'VARCHAR(500) DEFAULT NULL',
    'login_bg_image': 'VARCHAR(500) DEFAULT NULL',
    'banner_image': 'VARCHAR(500) DEFAULT NULL',
    'tagline': 'VARCHAR(255) DEFAULT NULL',
    'website': 'VARCHAR(255) DEFAULT NULL',
    'theme_color': "VARCHAR(7) DEFAULT '#1976d2'",
    'subdomain': 'VARCHAR(100) DEFAULT NULL UNIQUE',
    'custom_domain': 'VARCHAR(255) DEFAULT NULL',
    'plan': "ENUM('basic','standard','premium') DEFAULT 'basic'",
    'subscription_start': 'DATE DEFAULT NULL',
    'subscription_end': 'DATE DEFAULT NULL',
    'max_students': 'INT DEFAULT 500',
    'max_staff': 'INT DEFAULT 50',
    'country': "VARCHAR(100) DEFAULT 'India'",
    'principal_name': 'VARCHAR(255) DEFAULT NULL',
    'principal_email': 'VARCHAR(255) DEFAULT NULL',
    'principal_phone': 'VARCHAR(20) DEFAULT NULL',
    'board': 'VARCHAR(100) DEFAULT NULL',
    'school_type': 'VARCHAR(50) DEFAULT NULL',
    'established_year': 'INT DEFAULT NULL',
    'registration_number': 'VARCHAR(100) DEFAULT NULL',
    'updated_at': 'DATETIME DEFAULT NULL',
}

# Add missing columns
added = 0
for col_name, col_def in required_columns.items():
    if col_name not in existing_cols:
        try:
            sql = f"ALTER TABLE schools ADD COLUMN {col_name} {col_def}"
            print(f"  Adding: {col_name} -> {col_def}")
            cur.execute(sql)
            conn.commit()
            added += 1
        except Exception as e:
            print(f"  SKIP {col_name}: {e}")
            conn.rollback()
    else:
        print(f"  OK: {col_name} already exists")

# Also check and add missing tables
tables_to_create = {
    'school_features': """
        CREATE TABLE IF NOT EXISTS school_features (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NOT NULL,
            feature_name VARCHAR(100) NOT NULL,
            is_enabled BOOLEAN DEFAULT FALSE,
            UNIQUE KEY unique_school_feature (school_id, feature_name),
            FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
        )
    """,
    'school_settings': """
        CREATE TABLE IF NOT EXISTS school_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NOT NULL,
            setting_key VARCHAR(100) NOT NULL,
            setting_value TEXT,
            UNIQUE KEY unique_school_setting (school_id, setting_key),
            FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
        )
    """,
}

cur.execute("SHOW TABLES")
existing_tables = {row[0] for row in cur.fetchall()}

for table_name, create_sql in tables_to_create.items():
    if table_name not in existing_tables:
        try:
            print(f"  Creating table: {table_name}")
            cur.execute(create_sql)
            conn.commit()
            added += 1
        except Exception as e:
            print(f"  SKIP table {table_name}: {e}")
            conn.rollback()
    else:
        print(f"  OK: table {table_name} exists")

# Check other critical tables for missing columns
print("\n--- Checking users table ---")
cur.execute("SHOW COLUMNS FROM users")
user_cols = {row[0] for row in cur.fetchall()}

user_columns = {
    'avatar_url': 'VARCHAR(500) DEFAULT NULL',
    'last_login': 'DATETIME DEFAULT NULL',
    'updated_at': 'DATETIME DEFAULT NULL',
}

for col_name, col_def in user_columns.items():
    if col_name not in user_cols:
        try:
            sql = f"ALTER TABLE users ADD COLUMN {col_name} {col_def}"
            print(f"  Adding: {col_name}")
            cur.execute(sql)
            conn.commit()
            added += 1
        except Exception as e:
            print(f"  SKIP {col_name}: {e}")
            conn.rollback()

conn.close()

print(f"\n{'='*50}")
print(f"Migration complete! Added {added} columns/tables.")
print(f"{'='*50}")
