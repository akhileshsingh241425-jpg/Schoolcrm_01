import os, pymysql

conn = pymysql.connect(
    host=os.getenv('DB_HOST','localhost'), port=int(os.getenv('DB_PORT','3306')),
    user=os.getenv('DB_USER','root'), password=os.getenv('DB_PASSWORD',''),
    database=os.getenv('DB_NAME','school_crm'), charset='utf8mb4')
cur = conn.cursor()

# Check timetable columns
cur.execute('DESCRIBE timetable')
cols = [r[0] for r in cur.fetchall()]
print('timetable columns:', cols)

alters = [
    "ALTER TABLE timetable ADD COLUMN period_number INT NULL",
    "ALTER TABLE timetable ADD COLUMN is_break TINYINT(1) DEFAULT 0",
    "ALTER TABLE timetable ADD COLUMN academic_year_id INT NULL",
    "ALTER TABLE timetable ADD COLUMN room_no VARCHAR(20) NULL",
]

for sql in alters:
    try:
        cur.execute(sql)
        print(f"OK: {sql}")
    except Exception as e:
        if e.args[0] == 1060:
            print(f"SKIP (exists): {sql}")
        else:
            print(f"ERR: {sql} -> {e}")

conn.commit()
conn.close()
print("\nTimetable fix complete!")
