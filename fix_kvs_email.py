import pymysql
conn = pymysql.connect(host="localhost", user="root", password="root", database="school_crm")
cur = conn.cursor()
cur.execute("UPDATE schools SET email=%s WHERE id=%s", ("KVS@gmail.com", 4))
conn.commit()
cur.execute("SELECT id, name, email, code, is_active FROM schools")
rows = cur.fetchall()
for r in rows:
    print(r)
conn.close()
print("Done")
