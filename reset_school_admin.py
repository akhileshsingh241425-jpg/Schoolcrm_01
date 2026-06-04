import os
import pymysql
from werkzeug.security import generate_password_hash

new_password = input('Enter new password for school admin: ')
db_host = os.getenv('DB_HOST', 'localhost')
db_user = os.getenv('DB_USER', 'root')
db_password = os.getenv('DB_PASSWORD', '')
db_name = os.getenv('DB_NAME', 'school_crm')

conn = pymysql.connect(host=db_host, user=db_user, password=db_password, database=db_name)
cur = conn.cursor()
hashed = generate_password_hash(new_password)
cur.execute("UPDATE users SET password_hash=%s WHERE id=%s", (hashed, 5))
conn.commit()
conn.close()
print("Password has been reset.")
print("Email: admin@schoolcrm.com")
print("School Code: KVS")
