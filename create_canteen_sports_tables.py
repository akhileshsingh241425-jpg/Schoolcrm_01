"""Create Canteen and Sports tables"""
import mysql.connector

conn = mysql.connector.connect(host='localhost', user='root', password='root', database='school_crm')
cursor = conn.cursor()

tables = [
    # ==================== CANTEEN TABLES ====================
    """CREATE TABLE IF NOT EXISTS canteen_wallet (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        student_id INT NOT NULL,
        balance DECIMAL(10,2) DEFAULT 0,
        daily_limit DECIMAL(10,2) DEFAULT 200,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (student_id) REFERENCES students(id)
    )""",
    """CREATE TABLE IF NOT EXISTS canteen_menu (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50),
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        calories INT,
        allergens TEXT,
        is_vegetarian BOOLEAN DEFAULT TRUE,
        is_available BOOLEAN DEFAULT TRUE,
        image_url VARCHAR(500),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id)
    )""",
    """CREATE TABLE IF NOT EXISTS canteen_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        student_id INT NOT NULL,
        wallet_id INT,
        transaction_type VARCHAR(20) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        item_id INT,
        quantity INT DEFAULT 1,
        payment_method VARCHAR(30) DEFAULT 'wallet',
        reference_no VARCHAR(50),
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (wallet_id) REFERENCES canteen_wallet(id),
        FOREIGN KEY (item_id) REFERENCES canteen_menu(id)
    )""",
    """CREATE TABLE IF NOT EXISTS canteen_inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        item_name VARCHAR(100) NOT NULL,
        category VARCHAR(50),
        quantity DECIMAL(10,2) DEFAULT 0,
        unit VARCHAR(20),
        unit_price DECIMAL(10,2) DEFAULT 0,
        min_stock DECIMAL(10,2) DEFAULT 0,
        supplier VARCHAR(100),
        last_restocked DATE,
        expiry_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id)
    )""",
    """CREATE TABLE IF NOT EXISTS canteen_vendors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        contact_person VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(100),
        address TEXT,
        supply_items TEXT,
        rating INT,
        fssai_license VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id)
    )""",
    """CREATE TABLE IF NOT EXISTS canteen_preorders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        student_id INT NOT NULL,
        item_id INT NOT NULL,
        quantity INT DEFAULT 1,
        order_date DATE NOT NULL,
        pickup_time VARCHAR(20),
        status VARCHAR(20) DEFAULT 'pending',
        total_amount DECIMAL(10,2),
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (item_id) REFERENCES canteen_menu(id)
    )""",
    # ==================== SPORTS TABLES ====================
    """CREATE TABLE IF NOT EXISTS sports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50),
        max_team_size INT DEFAULT 15,
        coach_id INT,
        description TEXT,
        season VARCHAR(50),
        practice_schedule TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (coach_id) REFERENCES staff(id)
    )""",
    """CREATE TABLE IF NOT EXISTS sports_teams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        sport_id INT,
        name VARCHAR(100) NOT NULL,
        academic_year VARCHAR(20),
        captain_id INT,
        coach_id INT,
        members TEXT,
        age_group VARCHAR(50),
        achievements TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (sport_id) REFERENCES sports(id),
        FOREIGN KEY (captain_id) REFERENCES students(id),
        FOREIGN KEY (coach_id) REFERENCES staff(id)
    )""",
    """CREATE TABLE IF NOT EXISTS tournaments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        sport_id INT,
        name VARCHAR(200) NOT NULL,
        tournament_type VARCHAR(50),
        start_date DATE,
        end_date DATE,
        venue VARCHAR(200),
        organizer VARCHAR(200),
        status VARCHAR(30) DEFAULT 'upcoming',
        result TEXT,
        medals TEXT,
        remarks TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (sport_id) REFERENCES sports(id)
    )""",
    """CREATE TABLE IF NOT EXISTS tournament_matches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        tournament_id INT,
        team_id INT,
        opponent VARCHAR(200),
        match_date DATE,
        match_time VARCHAR(20),
        venue VARCHAR(200),
        result VARCHAR(50),
        score VARCHAR(100),
        remarks TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
        FOREIGN KEY (team_id) REFERENCES sports_teams(id)
    )""",
    """CREATE TABLE IF NOT EXISTS clubs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50),
        description TEXT,
        advisor_id INT,
        president_id INT,
        meeting_schedule VARCHAR(200),
        max_members INT DEFAULT 50,
        achievements TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (advisor_id) REFERENCES staff(id),
        FOREIGN KEY (president_id) REFERENCES students(id)
    )""",
    """CREATE TABLE IF NOT EXISTS club_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        club_id INT,
        student_id INT,
        role VARCHAR(50) DEFAULT 'member',
        joined_date DATE,
        status VARCHAR(30) DEFAULT 'active',
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (club_id) REFERENCES clubs(id),
        FOREIGN KEY (student_id) REFERENCES students(id)
    )""",
    """CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        name VARCHAR(200) NOT NULL,
        event_type VARCHAR(50),
        description TEXT,
        start_date DATE,
        end_date DATE,
        venue VARCHAR(200),
        organizer_id INT,
        budget DECIMAL(12,2) DEFAULT 0,
        status VARCHAR(30) DEFAULT 'planning',
        participants TEXT,
        remarks TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (organizer_id) REFERENCES staff(id)
    )""",
    """CREATE TABLE IF NOT EXISTS facility_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        facility_name VARCHAR(100) NOT NULL,
        facility_type VARCHAR(50),
        booked_by INT,
        booking_date DATE NOT NULL,
        start_time VARCHAR(20),
        end_time VARCHAR(20),
        purpose VARCHAR(300),
        status VARCHAR(30) DEFAULT 'pending',
        approved_by INT,
        remarks TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (booked_by) REFERENCES staff(id)
    )""",
    """CREATE TABLE IF NOT EXISTS fitness_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        student_id INT NOT NULL,
        academic_year VARCHAR(20),
        test_date DATE,
        height DECIMAL(5,2),
        weight DECIMAL(5,2),
        bmi DECIMAL(5,2),
        sprint_50m VARCHAR(20),
        long_jump VARCHAR(20),
        flexibility VARCHAR(20),
        endurance VARCHAR(20),
        overall_grade VARCHAR(5),
        remarks TEXT,
        tested_by INT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (tested_by) REFERENCES staff(id)
    )""",
    """CREATE TABLE IF NOT EXISTS certificates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        student_id INT,
        certificate_type VARCHAR(50),
        event_name VARCHAR(200),
        issued_date DATE,
        description TEXT,
        position VARCHAR(50),
        issued_by INT,
        template VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (issued_by) REFERENCES staff(id)
    )""",
]

for sql in tables:
    try:
        cursor.execute(sql)
        tname = sql.split('EXISTS')[1].split('(')[0].strip() if 'EXISTS' in sql else 'unknown'
        print(f"OK: {tname}")
    except Exception as e:
        print(f"ERR: {e}")

# Feature flags
for feat in ['canteen', 'sports']:
    try:
        cursor.execute(
            "INSERT INTO school_features (school_id, feature_name, is_enabled) VALUES (%s, %s, %s)",
            (2, feat, True)
        )
        print(f"Feature '{feat}' enabled")
    except Exception as e:
        if 'Duplicate' in str(e):
            cursor.execute(
                "UPDATE school_features SET is_enabled = TRUE WHERE school_id = %s AND feature_name = %s",
                (2, feat)
            )
            print(f"Feature '{feat}' already exists, enabled")
        else:
            print(f"Feature ERR: {e}")

conn.commit()
cursor.close()
conn.close()
print("\nDone! All canteen + sports tables created and features enabled.")
