import pymysql
from werkzeug.security import generate_password_hash

conn = pymysql.connect(host='localhost', user='root', password='root', database='school_crm')
cur = conn.cursor()

# Check super_admin role
cur.execute("SELECT id FROM roles WHERE name='super_admin'")
role = cur.fetchone()
print(f"Super admin role: {role}")

if role:
    role_id = role[0]
    cur.execute("SELECT id, email, first_name FROM users WHERE role_id = %s", (role_id,))
    users = cur.fetchall()
    print(f"Super admin users: {users}")
    
    if not users:
        # Create a super admin user - using school_id=1 (or 2)
        cur.execute("SELECT id FROM schools LIMIT 1")
        school = cur.fetchone()
        school_id = school[0] if school else 1
        
        pw_hash = generate_password_hash("superadmin123")
        cur.execute("""
            INSERT INTO users (school_id, role_id, email, password_hash, first_name, last_name, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, 1)
        """, (school_id, role_id, "admin@schoolcrm.com", pw_hash, "Super", "Admin"))
        conn.commit()
        print("Created super admin user: admin@schoolcrm.com / superadmin123")
else:
    print("No super_admin role found!")

conn.close()
