import os, pymysql
conn = pymysql.connect(
    host=os.getenv('DB_HOST','localhost'), port=int(os.getenv('DB_PORT','3306')),
    user=os.getenv('DB_USER','root'), password=os.getenv('DB_PASSWORD',''),
    database=os.getenv('DB_NAME','school_crm'), charset='utf8mb4')
cur = conn.cursor()
cur.execute("UPDATE schools SET email=%s WHERE id=%s", ("KVS@gmail.com", 4))
conn.commit()
cur.execute("SELECT id, name, email, code, is_active FROM schools")
rows = cur.fetchall()
for r in rows:
    print(r)
conn.close()
print("Done")
