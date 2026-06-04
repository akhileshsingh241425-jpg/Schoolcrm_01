"""Create marks entry assignment and deadline tables for the Marks Entry System."""
import sys
sys.path.insert(0, 'backend')
from app import create_app, db
from app.models.academic import MarksEntryAssignment, ScheduleMarksDeadline
from sqlalchemy import text

app = create_app('development')

with app.app_context():
    # Create the new tables
    db.create_all()
    print('Tables created successfully!')

    # Add performance indexes
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_mea_teacher_status ON marks_entry_assignments(teacher_id, status);",
        "CREATE INDEX IF NOT EXISTS idx_mea_schedule ON marks_entry_assignments(exam_schedule_id);",
        "CREATE INDEX IF NOT EXISTS idx_med_deadline_autolock ON marks_entry_deadlines(deadline_date, auto_lock);",
        "CREATE INDEX IF NOT EXISTS idx_mea_school ON marks_entry_assignments(school_id);",
        "CREATE INDEX IF NOT EXISTS idx_med_school ON marks_entry_deadlines(school_id);",
    ]

    for idx_sql in indexes:
        try:
            db.session.execute(text(idx_sql))
            print(f'  ✓ {idx_sql.split("IF NOT EXISTS ")[1].split(" ON")[0]}')
        except Exception as e:
            print(f'  ⚠ Skipped (may already exist): {e}')

    db.session.commit()
    print('\n✅ Marks entry tables migration complete!')
    print('   - marks_entry_assignments (with indexes: idx_mea_teacher_status, idx_mea_schedule, idx_mea_school)')
    print('   - marks_entry_deadlines (with indexes: idx_med_deadline_autolock, idx_med_school)')
