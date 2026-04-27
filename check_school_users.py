import pymysql
conn = pymysql.connect(host="localhost", user="root", password="root", database="school_crm")
cur = conn.cursor()
cur.execute("""
    SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, r.name as role, u.school_id
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.school_id = 4
""")
rows = cur.fetchall()
print("Users for KVS school (id=4):")
for r in rows:
    print(r)
conn.close()
