"""Add class_teacher_id and co_class_teacher_id columns to sections table"""
import sys
sys.path.insert(0, 'backend')

from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    with db.engine.connect() as conn:
        # Check if columns already exist
        result = conn.execute(text("SHOW COLUMNS FROM sections LIKE 'class_teacher_id'"))
        if result.rowcount == 0:
            conn.execute(text("ALTER TABLE sections ADD COLUMN class_teacher_id INT NULL"))
            conn.execute(text("ALTER TABLE sections ADD CONSTRAINT fk_section_class_teacher FOREIGN KEY (class_teacher_id) REFERENCES staff(id) ON DELETE SET NULL"))
            print("Added class_teacher_id column")
        else:
            print("class_teacher_id already exists")

        result = conn.execute(text("SHOW COLUMNS FROM sections LIKE 'co_class_teacher_id'"))
        if result.rowcount == 0:
            conn.execute(text("ALTER TABLE sections ADD COLUMN co_class_teacher_id INT NULL"))
            conn.execute(text("ALTER TABLE sections ADD CONSTRAINT fk_section_co_class_teacher FOREIGN KEY (co_class_teacher_id) REFERENCES staff(id) ON DELETE SET NULL"))
            print("Added co_class_teacher_id column")
        else:
            print("co_class_teacher_id already exists")

        conn.commit()
    print("Done!")
