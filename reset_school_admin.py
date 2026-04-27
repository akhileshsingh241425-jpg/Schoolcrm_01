import pymysql
from werkzeug.security import generate_password_hash

new_password = "admin123"

conn = pymysql.connect(host="localhost", user="root", password="root", database="school_crm")
cur = conn.cursor()
hashed = generate_password_hash(new_password)
cur.execute("UPDATE users SET password_hash=%s WHERE id=%s", (hashed, 5))
conn.commit()
conn.close()
print(f"Password reset to: {new_password}")
print("Email: admin@schoolcrm.com")
print("School Code: KVS")
