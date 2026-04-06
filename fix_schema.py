import pymysql

conn = pymysql.connect(host='localhost', user='root', password='root', db='school_crm')
cur = conn.cursor()

alters = [
    # exams table - add missing columns
    "ALTER TABLE exams ADD COLUMN exam_type_id INT NULL AFTER academic_year_id",
    "ALTER TABLE exams ADD COLUMN grading_system_id INT NULL AFTER exam_type_id",
    "ALTER TABLE exams ADD COLUMN description TEXT NULL AFTER grading_system_id",
    "ALTER TABLE exams ADD COLUMN instructions TEXT NULL AFTER status",
    "ALTER TABLE exams ADD COLUMN created_by INT NULL AFTER instructions",
    "ALTER TABLE exams ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP AFTER created_by",
    "ALTER TABLE exams ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at",
    "ALTER TABLE exams MODIFY COLUMN status ENUM('upcoming','ongoing','completed','cancelled','results_published') DEFAULT 'upcoming'",

    # exam_schedules table
    "ALTER TABLE exam_schedules ADD COLUMN section_id INT NULL AFTER class_id",
    "ALTER TABLE exam_schedules ADD COLUMN duration_minutes INT NULL AFTER passing_marks",
    "ALTER TABLE exam_schedules ADD COLUMN hall_id INT NULL AFTER duration_minutes",
    "ALTER TABLE exam_schedules ADD COLUMN instructions TEXT NULL AFTER hall_id",
    "ALTER TABLE exam_schedules ADD COLUMN is_marks_locked TINYINT(1) DEFAULT 0 AFTER instructions",

    # exam_results table
    "ALTER TABLE exam_results ADD COLUMN grade_point DECIMAL(3,1) NULL AFTER grade",
    "ALTER TABLE exam_results ADD COLUMN percentage DECIMAL(5,2) NULL AFTER grade_point",
    "ALTER TABLE exam_results ADD COLUMN is_absent TINYINT(1) DEFAULT 0 AFTER percentage",
    "ALTER TABLE exam_results ADD COLUMN is_exempted TINYINT(1) DEFAULT 0 AFTER is_absent",
    "ALTER TABLE exam_results ADD COLUMN entered_by INT NULL AFTER is_exempted",
    "ALTER TABLE exam_results ADD COLUMN entered_at DATETIME DEFAULT CURRENT_TIMESTAMP AFTER entered_by",
    "ALTER TABLE exam_results ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER entered_at",

    # subjects table
    "ALTER TABLE subjects ADD COLUMN description TEXT NULL AFTER type",
    "ALTER TABLE subjects ADD COLUMN credit_hours DECIMAL(3,1) NULL AFTER description",
    "ALTER TABLE subjects ADD COLUMN is_elective TINYINT(1) DEFAULT 0 AFTER credit_hours",
    "ALTER TABLE subjects ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER is_elective",
    "ALTER TABLE subjects ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP AFTER is_active",
]

for sql in alters:
    try:
        cur.execute(sql)
        print(f"OK: {sql[:70]}...")
    except Exception as e:
        err_code = e.args[0] if e.args else 0
        if err_code == 1060:  # Duplicate column
            print(f"SKIP (exists): {sql[:70]}...")
        elif err_code == 1061:  # Duplicate key
            print(f"SKIP (key exists): {sql[:70]}...")
        else:
            print(f"ERR: {sql[:70]}... -> {e}")

conn.commit()
conn.close()
print("\nSchema update complete!")
