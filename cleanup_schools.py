import pymysql
conn = pymysql.connect(host="localhost", user="root", password="root", database="school_crm")
cur = conn.cursor()

# Delete the duplicate (id=5), keep id=4 which has proper email now
cur.execute("DELETE FROM schools WHERE id=%s", (5,))
conn.commit()

cur.execute("SELECT id, name, email, code, is_active FROM schools")
rows = cur.fetchall()
print("Schools after cleanup:")
for r in rows:
    print(r)
conn.close()
print("Done")
