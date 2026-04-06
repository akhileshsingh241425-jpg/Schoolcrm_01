import pymysql

conn = pymysql.connect(host='localhost', user='root', password='root', database='school_crm', port=3306)
cursor = conn.cursor()

tables = [
    """CREATE TABLE IF NOT EXISTS hostel_blocks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20),
        block_type VARCHAR(20) DEFAULT 'boys',
        warden_id INT,
        total_floors INT DEFAULT 1,
        description TEXT,
        address TEXT,
        contact_number VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (warden_id) REFERENCES staff(id)
    )""",
    """CREATE TABLE IF NOT EXISTS hostel_rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        block_id INT NOT NULL,
        room_number VARCHAR(20) NOT NULL,
        floor INT DEFAULT 0,
        room_type VARCHAR(30) DEFAULT 'shared',
        capacity INT DEFAULT 2,
        current_occupancy INT DEFAULT 0,
        amenities TEXT,
        monthly_rent DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'available',
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (block_id) REFERENCES hostel_blocks(id)
    )""",
    """CREATE TABLE IF NOT EXISTS hostel_allocations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        student_id INT NOT NULL,
        room_id INT NOT NULL,
        bed_number VARCHAR(10),
        allocation_date DATE NOT NULL,
        vacate_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (room_id) REFERENCES hostel_rooms(id)
    )""",
    """CREATE TABLE IF NOT EXISTS mess_menu (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        day_of_week VARCHAR(15) NOT NULL,
        meal_type VARCHAR(20) NOT NULL,
        menu_items TEXT NOT NULL,
        special_diet TEXT,
        calories INT,
        effective_from DATE,
        effective_to DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id)
    )""",
    """CREATE TABLE IF NOT EXISTS mess_attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        student_id INT NOT NULL,
        date DATE NOT NULL,
        meal_type VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'present',
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (student_id) REFERENCES students(id)
    )""",
    """CREATE TABLE IF NOT EXISTS outpass_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        student_id INT NOT NULL,
        outpass_type VARCHAR(20) DEFAULT 'day',
        reason TEXT NOT NULL,
        from_date DATETIME NOT NULL,
        to_date DATETIME NOT NULL,
        destination VARCHAR(200),
        guardian_contact VARCHAR(20),
        status VARCHAR(20) DEFAULT 'pending',
        approved_by INT,
        approved_at DATETIME,
        actual_return DATETIME,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (approved_by) REFERENCES staff(id)
    )""",
    """CREATE TABLE IF NOT EXISTS hostel_visitors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        student_id INT NOT NULL,
        visitor_name VARCHAR(100) NOT NULL,
        relation VARCHAR(50),
        contact_number VARCHAR(20),
        id_proof_type VARCHAR(30),
        id_proof_number VARCHAR(50),
        visit_date DATE NOT NULL,
        check_in DATETIME,
        check_out DATETIME,
        purpose TEXT,
        status VARCHAR(20) DEFAULT 'checked_in',
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (student_id) REFERENCES students(id)
    )""",
    """CREATE TABLE IF NOT EXISTS hostel_complaints (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        student_id INT NOT NULL,
        complaint_type VARCHAR(30) NOT NULL,
        subject VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'open',
        assigned_to INT,
        resolution TEXT,
        resolved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (assigned_to) REFERENCES staff(id)
    )""",
    """CREATE TABLE IF NOT EXISTS hostel_inspections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        room_id INT NOT NULL,
        inspection_date DATE NOT NULL,
        inspection_type VARCHAR(30) DEFAULT 'routine',
        inspector_id INT,
        cleanliness_score INT,
        maintenance_score INT,
        discipline_score INT,
        overall_score INT,
        findings TEXT,
        action_taken TEXT,
        status VARCHAR(20) DEFAULT 'completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (room_id) REFERENCES hostel_rooms(id),
        FOREIGN KEY (inspector_id) REFERENCES staff(id)
    )"""
]

for sql in tables:
    tname = sql.split('IF NOT EXISTS ')[1].split(' ')[0]
    try:
        cursor.execute(sql)
        print(f"OK: {tname}")
    except Exception as e:
        print(f"FAIL: {tname} - {e}")

# Add hostel feature flag
try:
    cursor.execute("INSERT INTO school_features (school_id, feature_name, is_enabled) VALUES (2, 'hostel', TRUE)")
    print("OK: hostel feature flag added")
except Exception as e:
    print(f"Feature flag: {e}")

conn.commit()
cursor.close()
conn.close()
print("\nDone!")
