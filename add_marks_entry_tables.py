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

    # Add performance indexes (MySQL 5.x compatible — check before creating)
    indexes = [
        ("idx_mea_teacher_status", "marks_entry_assignments", "CREATE INDEX idx_mea_teacher_status ON marks_entry_assignments(teacher_id, status);"),
        ("idx_mea_schedule", "marks_entry_assignments", "CREATE INDEX idx_mea_schedule ON marks_entry_assignments(exam_schedule_id);"),
        ("idx_med_deadline_autolock", "marks_entry_deadlines", "CREATE INDEX idx_med_deadline_autolock ON marks_entry_deadlines(deadline_date, auto_lock);"),
        ("idx_mea_school", "marks_entry_assignments", "CREATE INDEX idx_mea_school ON marks_entry_assignments(school_id);"),
        ("idx_med_school", "marks_entry_deadlines", "CREATE INDEX idx_med_school ON marks_entry_deadlines(school_id);"),
    ]

    for idx_name, table_name, idx_sql in indexes:
        # Check if index already exists (MySQL 5.x compatible)
        check = db.session.execute(text(
            "SELECT COUNT(*) FROM information_schema.STATISTICS "
            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND INDEX_NAME = :idx"
        ), {'table': table_name, 'idx': idx_name})
        exists = check.scalar() > 0
        if exists:
            print(f'  ⚠ Skipped (already exists): {idx_name}')
        else:
            try:
                db.session.execute(text(idx_sql))
                print(f'  ✓ Created: {idx_name}')
            except Exception as e:
                print(f'  ⚠ Skipped: {idx_name} — {e}')

    db.session.commit()
    print('\n✅ Marks entry tables migration complete!')
    print('   - marks_entry_assignments (with indexes: idx_mea_teacher_status, idx_mea_schedule, idx_mea_school)')
    print('   - marks_entry_deadlines (with indexes: idx_med_deadline_autolock, idx_med_school)')
