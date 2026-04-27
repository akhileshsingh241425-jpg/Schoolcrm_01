"""
Run this script on the production server to create/reset the super admin user.
Usage: python3 create_superadmin_prod.py
"""
import sys
import os

# Try to load from .env file if exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Database config - reads from environment or uses production defaults
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', 3306))
DB_NAME = os.getenv('DB_NAME', 'rohit0101')
DB_USER = os.getenv('DB_USER', 'rohit')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'rohit0101')

SUPER_ADMIN_EMAIL = 'admin@schoolcrm.com'
SUPER_ADMIN_PASSWORD = 'superadmin123'

try:
    import pymysql
    from werkzeug.security import generate_password_hash
except ImportError:
    print("Installing required packages...")
    os.system(f"{sys.executable} -m pip install pymysql werkzeug")
    import pymysql
    from werkzeug.security import generate_password_hash

print(f"Connecting to database: {DB_NAME}@{DB_HOST}:{DB_PORT} as {DB_USER}")

try:
    conn = pymysql.connect(
        host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASSWORD,
        database=DB_NAME, charset='utf8mb4'
    )
except Exception as e:
    print(f"Database connection failed: {e}")
    print("\nTrying with common credentials...")
    # Try alternative credentials
    for creds in [
        {'user': 'root', 'password': 'root', 'db': 'school_crm'},
        {'user': 'root', 'password': '', 'db': 'school_crm'},
        {'user': 'rohit', 'password': 'rohit0101', 'db': 'rohit0101'},
    ]:
        try:
            conn = pymysql.connect(
                host='localhost', user=creds['user'], password=creds['password'],
                database=creds['db'], charset='utf8mb4'
            )
            print(f"Connected with: {creds['user']}@{creds['db']}")
            break
        except:
            continue
    else:
        print("Could not connect to any database! Please check credentials.")
        sys.exit(1)

cur = conn.cursor()

# 1. Check/Create super_admin role
cur.execute("SELECT id, name FROM roles WHERE name='super_admin'")
role = cur.fetchone()
if not role:
    cur.execute("INSERT INTO roles (name, description) VALUES ('super_admin', 'Super Administrator')")
    conn.commit()
    cur.execute("SELECT id, name FROM roles WHERE name='super_admin'")
    role = cur.fetchone()
    print(f"Created super_admin role: {role}")
else:
    print(f"Found super_admin role: {role}")

role_id = role[0]

# 2. Check if super_admin user exists
cur.execute("SELECT id, email, first_name, is_active FROM users WHERE role_id=%s", (role_id,))
existing = cur.fetchall()
print(f"Existing super_admin users: {existing}")

# 3. Get a school_id (super_admin needs one)
cur.execute("SELECT id, name, code FROM schools LIMIT 5")
schools = cur.fetchall()
print(f"Available schools: {schools}")

school_id = schools[0][0] if schools else 1

# 4. Create or update super_admin user
pw_hash = generate_password_hash(SUPER_ADMIN_PASSWORD)

if existing:
    # Update existing user
    user_id = existing[0][0]
    cur.execute("""
        UPDATE users SET password_hash=%s, email=%s, is_active=1 
        WHERE id=%s
    """, (pw_hash, SUPER_ADMIN_EMAIL, user_id))
    conn.commit()
    print(f"\nUpdated super admin user (ID: {user_id})")
else:
    # Create new user
    cur.execute("""
        INSERT INTO users (school_id, role_id, email, password_hash, first_name, last_name, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, 1)
    """, (school_id, role_id, SUPER_ADMIN_EMAIL, pw_hash, 'Super', 'Admin'))
    conn.commit()
    print(f"\nCreated super admin user")

# 5. Setup RBAC permissions for super_admin
try:
    cur.execute("SELECT id FROM permissions")
    all_perms = [p[0] for p in cur.fetchall()]
    
    cur.execute("SELECT permission_id FROM role_permissions WHERE role_id=%s", (role_id,))
    existing_perms = [p[0] for p in cur.fetchall()]
    
    new_perms = [pid for pid in all_perms if pid not in existing_perms]
    if new_perms:
        for pid in new_perms:
            cur.execute("INSERT INTO role_permissions (role_id, permission_id) VALUES (%s, %s)", (role_id, pid))
        conn.commit()
        print(f"Added {len(new_perms)} permissions to super_admin role")
    else:
        print("Super admin already has all permissions")
except Exception as e:
    print(f"RBAC setup skipped: {e}")

conn.close()

print("\n" + "=" * 50)
print("SUPER ADMIN LOGIN CREDENTIALS:")
print("=" * 50)
print(f"  Email:    {SUPER_ADMIN_EMAIL}")
print(f"  Password: {SUPER_ADMIN_PASSWORD}")
print(f"  School:   Not required (Super Admin)")
print("=" * 50)
print("\nOn the login page, click 'Login as Super Admin' button")
print("then enter the email and password above.")
