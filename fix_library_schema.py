import pymysql

conn = pymysql.connect(host='localhost', user='root', password='root', database='school_crm', port=3306)
c = conn.cursor()

alters = [
    "ALTER TABLE library_categories ADD COLUMN description TEXT AFTER name",
    "ALTER TABLE library_categories ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER description",
    "ALTER TABLE library_categories ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP AFTER is_active",
    "ALTER TABLE library_books ADD COLUMN language VARCHAR(50) DEFAULT 'English' AFTER edition",
    "ALTER TABLE library_books ADD COLUMN subject VARCHAR(100) AFTER language",
    "ALTER TABLE library_books ADD COLUMN publication_year INT AFTER subject",
    "ALTER TABLE library_books ADD COLUMN pages INT AFTER publication_year",
    "ALTER TABLE library_books ADD COLUMN `condition` ENUM('new','good','fair','poor','damaged') DEFAULT 'new' AFTER price",
    "ALTER TABLE library_books ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER `condition`",
    "ALTER TABLE library_issues ADD COLUMN copy_id INT AFTER book_id",
    "ALTER TABLE library_issues ADD COLUMN notes TEXT AFTER status",
    "ALTER TABLE library_issues ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP AFTER issued_by",
    "ALTER TABLE library_issues MODIFY status ENUM('issued','returned','lost','overdue') DEFAULT 'issued'",
]

for sql in alters:
    try:
        c.execute(sql)
        print(f"OK: {sql[:70]}")
    except Exception as e:
        print(f"SKIP: {str(e)[:70]}")

conn.commit()
conn.close()
print("Done!")
