import sys
sys.path.insert(0, 'backend')

from app import create_app, db
from sqlalchemy import text

app = create_app()
with app.app_context():
    # Create new tables only
    db.create_all()
    print('db.create_all() done')

    # ALTER existing tables to add new columns
    alters = [
        "ALTER TABLE student_attendance ADD COLUMN period INT NULL AFTER status",
        "ALTER TABLE student_attendance ADD COLUMN capture_mode ENUM('manual','biometric','rfid','qr_code','face','gps') DEFAULT 'manual' AFTER period",
        "ALTER TABLE student_attendance ADD COLUMN check_in_time TIME NULL AFTER capture_mode",
        "ALTER TABLE student_attendance ADD COLUMN check_out_time TIME NULL AFTER check_in_time",
        "ALTER TABLE staff_attendance ADD COLUMN capture_mode ENUM('manual','biometric','rfid','qr_code','face','gps') DEFAULT 'manual' AFTER check_out",
    ]

    for sql in alters:
        try:
            db.session.execute(text(sql))
            db.session.commit()
            col = sql.split('ADD COLUMN ')[1].split(' ')[0]
            print(f'Added column: {col}')
        except Exception as e:
            db.session.rollback()
            if 'Duplicate column' in str(e):
                print(f'Column already exists, skipping')
            else:
                print(f'Error: {e}')

    # Fix unique constraint on student_attendance
    try:
        db.session.execute(text('ALTER TABLE student_attendance DROP INDEX unique_student_date'))
        db.session.commit()
        print('Dropped old unique constraint')
    except Exception as e:
        db.session.rollback()
        print(f'Old constraint note: {e}')

    try:
        db.session.execute(text('ALTER TABLE student_attendance ADD UNIQUE INDEX unique_student_date_period (student_id, date, period)'))
        db.session.commit()
        print('Added new unique constraint')
    except Exception as e:
        db.session.rollback()
        if 'Duplicate' in str(e):
            print('New constraint already exists')
        else:
            print(f'Constraint error: {e}')

    print('All done!')
