import pymysql

conn = pymysql.connect(host='localhost', user='root', password='root', database='school_crm', port=3306)
cursor = conn.cursor()

tables = [
    """CREATE TABLE IF NOT EXISTS library_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
    )""",
    """CREATE TABLE IF NOT EXISTS library_books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        category_id INT,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255),
        isbn VARCHAR(20),
        publisher VARCHAR(255),
        edition VARCHAR(50),
        language VARCHAR(50) DEFAULT 'English',
        subject VARCHAR(100),
        publication_year INT,
        pages INT,
        total_copies INT DEFAULT 1,
        available_copies INT DEFAULT 1,
        rack_no VARCHAR(20),
        price DECIMAL(12,2),
        `condition` ENUM('new','good','fair','poor','damaged') DEFAULT 'new',
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES library_categories(id)
    )""",
    """CREATE TABLE IF NOT EXISTS book_copies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        book_id INT NOT NULL,
        accession_no VARCHAR(50) NOT NULL,
        barcode VARCHAR(100),
        `condition` ENUM('new','good','fair','poor','damaged','lost') DEFAULT 'new',
        location VARCHAR(100),
        is_available BOOLEAN DEFAULT TRUE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES library_books(id) ON DELETE CASCADE
    )""",
    """CREATE TABLE IF NOT EXISTS library_issues (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        book_id INT NOT NULL,
        copy_id INT,
        issued_to INT NOT NULL,
        issued_to_type ENUM('student','staff') NOT NULL,
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        return_date DATE,
        fine_amount DECIMAL(12,2) DEFAULT 0,
        fine_paid BOOLEAN DEFAULT FALSE,
        status ENUM('issued','returned','lost','overdue') DEFAULT 'issued',
        notes TEXT,
        issued_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES library_books(id) ON DELETE CASCADE,
        FOREIGN KEY (copy_id) REFERENCES book_copies(id),
        FOREIGN KEY (issued_by) REFERENCES users(id)
    )""",
    """CREATE TABLE IF NOT EXISTS book_reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        book_id INT NOT NULL,
        reserved_by INT NOT NULL,
        reserved_by_type ENUM('student','staff') DEFAULT 'student',
        reservation_date DATE NOT NULL,
        expiry_date DATE,
        status ENUM('pending','fulfilled','cancelled','expired') DEFAULT 'pending',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES library_books(id) ON DELETE CASCADE
    )""",
    """CREATE TABLE IF NOT EXISTS book_fines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        issue_id INT NOT NULL,
        student_id INT NOT NULL,
        fine_type ENUM('overdue','lost','damaged') DEFAULT 'overdue',
        amount DECIMAL(12,2) NOT NULL,
        paid_amount DECIMAL(12,2) DEFAULT 0,
        status ENUM('pending','paid','waived') DEFAULT 'pending',
        paid_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
        FOREIGN KEY (issue_id) REFERENCES library_issues(id) ON DELETE CASCADE
    )""",
    """CREATE TABLE IF NOT EXISTS ebook_resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255),
        resource_type ENUM('ebook','pdf','journal','article','video') DEFAULT 'ebook',
        subject VARCHAR(100),
        url VARCHAR(500),
        file_path VARCHAR(500),
        description TEXT,
        access_level ENUM('all','students','staff','restricted') DEFAULT 'all',
        is_active BOOLEAN DEFAULT TRUE,
        download_count INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
    )""",
    """CREATE TABLE IF NOT EXISTS periodicals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        periodical_type ENUM('magazine','journal','newspaper') DEFAULT 'magazine',
        publisher VARCHAR(255),
        frequency ENUM('daily','weekly','biweekly','monthly','quarterly','yearly') DEFAULT 'monthly',
        subscription_start DATE,
        subscription_end DATE,
        subscription_cost DECIMAL(12,2),
        status ENUM('active','expired','cancelled') DEFAULT 'active',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
    )""",
    """CREATE TABLE IF NOT EXISTS reading_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        student_id INT NOT NULL,
        book_id INT NOT NULL,
        start_date DATE,
        end_date DATE,
        rating INT,
        review TEXT,
        pages_read INT,
        status ENUM('reading','completed','abandoned') DEFAULT 'reading',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES library_books(id) ON DELETE CASCADE
    )""",
    """CREATE TABLE IF NOT EXISTS library_budget (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        academic_year VARCHAR(20) NOT NULL,
        category ENUM('books','periodicals','ebooks','furniture','equipment','other') DEFAULT 'books',
        allocated_amount DECIMAL(12,2) NOT NULL,
        spent_amount DECIMAL(12,2) DEFAULT 0,
        description TEXT,
        status ENUM('planned','approved','in_progress','completed') DEFAULT 'planned',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
    )""",
]

for sql in tables:
    tname = sql.split('EXISTS')[1].split('(')[0].strip()
    try:
        cursor.execute(sql)
        print(f"OK: {tname}")
    except Exception as e:
        print(f"SKIP: {tname} - {e}")

# Add feature flag
try:
    cursor.execute("SELECT id FROM school_features WHERE school_id=2 AND feature_name='library'")
    if not cursor.fetchone():
        cursor.execute("INSERT INTO school_features (school_id, feature_name, is_enabled) VALUES (2, 'library', TRUE)")
        print("OK: library feature flag added")
    else:
        print("OK: library feature flag exists")
except Exception as e:
    print(f"Feature flag: {e}")

conn.commit()
cursor.close()
conn.close()
print("\nDone!")
