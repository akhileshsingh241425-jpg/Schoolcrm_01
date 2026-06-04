import sys
sys.path.insert(0, '.')
from app import create_app, db

app = create_app('development')
with app.app_context():
    db.session.execute(db.text('''
        CREATE TABLE IF NOT EXISTS room_seating_grids (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NOT NULL,
            exam_id INT NOT NULL,
            hall_id INT NOT NULL,
            date VARCHAR(20),
            start_time VARCHAR(10),
            grid JSON,
            num_columns INT DEFAULT 3,
            num_rows INT DEFAULT 5,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
            FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
            FOREIGN KEY (hall_id) REFERENCES exam_halls(id) ON DELETE CASCADE
        )
    '''))
    db.session.commit()
    print('room_seating_grids table created!')
