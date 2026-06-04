import os, pymysql
conn = pymysql.connect(
    host=os.getenv('DB_HOST','localhost'), port=int(os.getenv('DB_PORT','3306')),
    user=os.getenv('DB_USER','root'), password=os.getenv('DB_PASSWORD',''),
    database=os.getenv('DB_NAME','school_crm'), charset='utf8mb4')
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
