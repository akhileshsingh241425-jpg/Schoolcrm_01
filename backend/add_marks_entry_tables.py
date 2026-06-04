"""
Migration script: Create marks_entry_assignments and schedule_marks_deadlines tables.
Uses SQLAlchemy's create_all (dialect-aware) so it works on MySQL/PostgreSQL/SQLite.
Run from the backend/ directory: python add_marks_entry_tables.py
"""
import sys
sys.path.insert(0, '.')
from app import create_app, db
# Import the models so create_all knows about them
from app.models.academic import MarksEntryAssignment, ScheduleMarksDeadline  # noqa: F401
from sqlalchemy import text

app = create_app('development')

# Indexes created individually; ignored if they already exist.
INDEXES = [
    ("idx_mea_school_teacher_status",
     "CREATE INDEX idx_mea_school_teacher_status ON marks_entry_assignments(school_id, teacher_id, status)"),
    ("idx_mea_school_schedule",
     "CREATE INDEX idx_mea_school_schedule ON marks_entry_assignments(school_id, exam_schedule_id)"),
    ("idx_smd_school_deadline_autolock",
     "CREATE INDEX idx_smd_school_deadline_autolock ON schedule_marks_deadlines(school_id, deadline_date, auto_lock)"),
]

with app.app_context():
    # 1. Create tables (only the two new ones, dialect-aware, skips existing)
    engine = db.engine
    MarksEntryAssignment.__table__.create(bind=engine, checkfirst=True)
    ScheduleMarksDeadline.__table__.create(bind=engine, checkfirst=True)
    print('Tables ensured: marks_entry_assignments, schedule_marks_deadlines')

    # 2. Create indexes (ignore if they already exist)
    for idx_name, idx_sql in INDEXES:
        try:
            db.session.execute(text(idx_sql))
            db.session.commit()
            print(f'  Created index: {idx_name}')
        except Exception as e:
            db.session.rollback()
            msg = str(e).lower()
            if 'duplicate' in msg or 'already exists' in msg or 'exists' in msg:
                print(f'  Index {idx_name} already exists, skipping')
            else:
                print(f'  Index {idx_name} skipped: {e}')

    print('\nMarks entry tables migration complete!')
