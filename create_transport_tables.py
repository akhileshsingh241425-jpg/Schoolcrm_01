"""Create new transport tables directly via SQL."""
import pymysql

conn = pymysql.connect(host='localhost', user='root', password='root', database='school_crm')
cur = conn.cursor()

sqls = [
    """CREATE TABLE IF NOT EXISTS vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        vehicle_number VARCHAR(50) NOT NULL,
        vehicle_type VARCHAR(50) DEFAULT 'bus',
        make VARCHAR(100),
        model VARCHAR(100),
        year INT,
        capacity INT DEFAULT 40,
        fuel_type VARCHAR(20) DEFAULT 'diesel',
        registration_date DATE,
        insurance_expiry DATE,
        fitness_expiry DATE,
        permit_expiry DATE,
        pollution_expiry DATE,
        chassis_number VARCHAR(100),
        engine_number VARCHAR(100),
        gps_device_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active',
        current_odometer INT DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
    )""",
    """CREATE TABLE IF NOT EXISTS drivers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(120),
        license_number VARCHAR(50),
        license_type VARCHAR(20),
        license_expiry DATE,
        medical_fitness_expiry DATE,
        aadhar_number VARCHAR(20),
        address TEXT,
        blood_group VARCHAR(10),
        emergency_contact VARCHAR(20),
        experience_years INT DEFAULT 0,
        driving_score INT DEFAULT 100,
        status VARCHAR(20) DEFAULT 'active',
        photo_url VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
    )""",
    """CREATE TABLE IF NOT EXISTS gps_tracking (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        vehicle_id INT NOT NULL,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        speed_kmh FLOAT DEFAULT 0,
        heading FLOAT,
        altitude FLOAT,
        accuracy FLOAT,
        is_ignition_on BOOLEAN DEFAULT TRUE,
        is_overspeeding BOOLEAN DEFAULT FALSE,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    )""",
    """CREATE TABLE IF NOT EXISTS vehicle_maintenance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        vehicle_id INT NOT NULL,
        maintenance_type VARCHAR(50) DEFAULT 'scheduled',
        description TEXT,
        vendor_name VARCHAR(200),
        cost DECIMAL(10,2) DEFAULT 0,
        odometer_reading INT,
        scheduled_date DATE,
        completed_date DATE,
        next_due_date DATE,
        status VARCHAR(20) DEFAULT 'scheduled',
        invoice_no VARCHAR(50),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    )""",
    """CREATE TABLE IF NOT EXISTS fuel_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        vehicle_id INT NOT NULL,
        fill_date DATE NOT NULL,
        fuel_type VARCHAR(20) DEFAULT 'diesel',
        quantity_liters DECIMAL(8,2) NOT NULL,
        rate_per_liter DECIMAL(8,2),
        total_cost DECIMAL(10,2),
        odometer_reading INT,
        mileage_kmpl DECIMAL(6,2),
        pump_name VARCHAR(200),
        receipt_no VARCHAR(50),
        filled_by VARCHAR(100),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    )""",
    """CREATE TABLE IF NOT EXISTS transport_fees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        route_id INT,
        stop_id INT,
        academic_year VARCHAR(20),
        fee_type VARCHAR(30) DEFAULT 'monthly',
        amount DECIMAL(10,2) NOT NULL,
        distance_based BOOLEAN DEFAULT FALSE,
        distance_km DECIMAL(6,2),
        rate_per_km DECIMAL(8,2),
        effective_from DATE,
        effective_to DATE,
        status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
    )""",
    """CREATE TABLE IF NOT EXISTS sos_alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        vehicle_id INT,
        route_id INT,
        driver_id INT,
        alert_type VARCHAR(50) NOT NULL,
        description TEXT,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        status VARCHAR(20) DEFAULT 'active',
        resolved_at DATETIME,
        resolved_by INT,
        resolution_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
    )""",
    """CREATE TABLE IF NOT EXISTS trip_management (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        trip_name VARCHAR(200) NOT NULL,
        trip_type VARCHAR(50) DEFAULT 'field_trip',
        destination VARCHAR(300),
        vehicle_id INT,
        driver_id INT,
        departure_datetime DATETIME,
        return_datetime DATETIME,
        actual_departure DATETIME,
        actual_return DATETIME,
        total_students INT DEFAULT 0,
        total_staff INT DEFAULT 0,
        estimated_cost DECIMAL(10,2),
        actual_cost DECIMAL(10,2),
        notes TEXT,
        status VARCHAR(20) DEFAULT 'planned',
        approved_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
    )""",
    """CREATE TABLE IF NOT EXISTS route_change_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        student_id INT,
        current_route_id INT,
        requested_route_id INT,
        current_stop_id INT,
        requested_stop_id INT,
        reason TEXT,
        effective_date DATE,
        status VARCHAR(20) DEFAULT 'pending',
        approved_by INT,
        approved_date DATE,
        admin_remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
    )""",
    """CREATE TABLE IF NOT EXISTS speed_alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        school_id INT NOT NULL,
        vehicle_id INT NOT NULL,
        driver_id INT,
        speed_kmh FLOAT NOT NULL,
        speed_limit_kmh FLOAT DEFAULT 60,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        location_name VARCHAR(200),
        route_id INT,
        acknowledged BOOLEAN DEFAULT FALSE,
        acknowledged_by INT,
        acknowledged_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    )"""
]

for sql in sqls:
    try:
        cur.execute(sql)
        table_name = sql.split('IF NOT EXISTS ')[1].split(' ')[0]
        print(f"[OK] {table_name} created")
    except Exception as e:
        print(f"[ERR] {e}")

# Also ALTER existing tables
alters = [
    ("transport_routes", "route_code", "VARCHAR(50)"),
    ("transport_routes", "vehicle_id", "INT"),
    ("transport_routes", "driver_id", "INT"),
    ("transport_routes", "start_location", "VARCHAR(200)"),
    ("transport_routes", "end_location", "VARCHAR(200)"),
    ("transport_routes", "total_distance_km", "FLOAT"),
    ("transport_routes", "estimated_time_min", "INT"),
    ("transport_routes", "shift", "VARCHAR(20) DEFAULT 'morning'"),
    ("transport_stops", "latitude", "DECIMAL(10,8)"),
    ("transport_stops", "longitude", "DECIMAL(11,8)"),
    ("transport_stops", "radius_meters", "INT DEFAULT 100"),
    ("student_transport", "rfid_card_no", "VARCHAR(50)"),
    ("student_transport", "effective_from", "DATE"),
    ("student_transport", "effective_to", "DATE"),
    ("student_transport", "status", "VARCHAR(20) DEFAULT 'active'"),
]
for tbl, col, dtype in alters:
    try:
        cur.execute(f"ALTER TABLE {tbl} ADD COLUMN {col} {dtype}")
        print(f"[OK] {tbl}.{col} added")
    except Exception as e:
        if '1060' in str(e):
            print(f"[SKIP] {tbl}.{col} exists")
        else:
            print(f"[ERR] {tbl}.{col}: {e}")

conn.commit()
conn.close()
print("\n[DONE] All tables created!")
