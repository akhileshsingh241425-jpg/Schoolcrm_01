import pymysql

conn = pymysql.connect(host='localhost', user='root', password='root', database='school_crm')
cur = conn.cursor()

# Add branding columns to schools
for col_sql in [
    "ALTER TABLE schools ADD COLUMN login_bg_image VARCHAR(500) NULL AFTER logo_url",
    "ALTER TABLE schools ADD COLUMN banner_image VARCHAR(500) NULL AFTER login_bg_image",
    "ALTER TABLE schools ADD COLUMN tagline VARCHAR(255) NULL AFTER banner_image",
]:
    try:
        cur.execute(col_sql)
        print(f"OK: {col_sql[:60]}")
    except Exception as e:
        print(f"Skip: {e}")

# Ensure subscription_plans table exists
cur.execute("SHOW TABLES LIKE 'subscription_plans'")
if cur.fetchone():
    print("subscription_plans already exists")
else:
    cur.execute("""
        CREATE TABLE subscription_plans (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            monthly_price DECIMAL(12,2),
            yearly_price DECIMAL(12,2),
            max_students INT,
            max_staff INT,
            features JSON,
            is_active BOOLEAN DEFAULT TRUE
        )
    """)
    print("Created subscription_plans")

# Ensure school_subscriptions table exists
cur.execute("SHOW TABLES LIKE 'school_subscriptions'")
if cur.fetchone():
    print("school_subscriptions already exists")
else:
    cur.execute("""
        CREATE TABLE school_subscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NOT NULL,
            plan_id INT NOT NULL,
            billing_cycle ENUM('monthly','yearly') DEFAULT 'yearly',
            amount DECIMAL(12,2) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            payment_status ENUM('pending','paid','failed') DEFAULT 'pending',
            razorpay_subscription_id VARCHAR(255),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
            FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
        )
    """)
    print("Created school_subscriptions")

# Seed default plans if none exist
cur.execute("SELECT COUNT(*) FROM subscription_plans")
count = cur.fetchone()[0]
if count == 0:
    plans = [
        ("Basic", "Essential school management features", 999, 9999, 500, 50,
         '["student_management","staff_management","fee_management","attendance","communication"]'),
        ("Standard", "Advanced features with reports and analytics", 2499, 24999, 2000, 200,
         '["student_management","staff_management","fee_management","attendance","communication","marketing_crm","admission","academic","reports","inventory","transport","library"]'),
        ("Premium", "All features with unlimited access", 4999, 49999, 10000, 1000,
         '["student_management","staff_management","fee_management","attendance","communication","marketing_crm","admission","academic","reports","inventory","transport","library","parent_engagement","health_safety","hostel","canteen","sports"]'),
    ]
    for p in plans:
        cur.execute("""
            INSERT INTO subscription_plans (name, description, monthly_price, yearly_price, max_students, max_staff, features)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, p)
    print("Seeded 3 default plans")
else:
    print(f"Plans already exist: {count}")

# Ensure super_admin role exists
cur.execute("SELECT id FROM roles WHERE name='super_admin'")
if cur.fetchone():
    print("super_admin role exists")
else:
    cur.execute("INSERT INTO roles (name, description) VALUES ('super_admin', 'Platform Super Administrator')")
    print("Created super_admin role")

conn.commit()
conn.close()
print("\nMigration complete!")
