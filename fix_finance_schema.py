import pymysql

conn = pymysql.connect(host='localhost', user='root', password='root', database='school_crm')
cur = conn.cursor()

# --- ALTER TABLE fee_structures (existing) ---
cur.execute("DESCRIBE fee_structures")
existing = [r[0] for r in cur.fetchall()]
struct_cols = [
    ("late_fee_amount", "DECIMAL(10,2) DEFAULT 0"),
    ("late_fee_type", "VARCHAR(20) DEFAULT 'fixed'"),
    ("grace_period_days", "INT DEFAULT 0"),
    ("is_active", "BOOLEAN DEFAULT TRUE"),
]
for col, defn in struct_cols:
    if col not in existing:
        cur.execute(f"ALTER TABLE fee_structures ADD COLUMN {col} {defn}")
        print(f"Added fee_structures.{col}")

# --- ALTER TABLE fee_payments (existing) ---
cur.execute("DESCRIBE fee_payments")
existing = [r[0] for r in cur.fetchall()]
pay_cols = [
    ("installment_id", "INT NULL"),
    ("late_fee_paid", "DECIMAL(10,2) DEFAULT 0"),
    ("discount_amount", "DECIMAL(10,2) DEFAULT 0"),
    ("total_amount", "DECIMAL(10,2) DEFAULT 0"),
    ("cheque_no", "VARCHAR(30) NULL"),
    ("cheque_date", "DATE NULL"),
    ("bank_name", "VARCHAR(100) NULL"),
    ("cheque_status", "VARCHAR(20) NULL"),
]
for col, defn in pay_cols:
    if col not in existing:
        cur.execute(f"ALTER TABLE fee_payments ADD COLUMN {col} {defn}")
        print(f"Added fee_payments.{col}")

conn.commit()
print("\n--- ALTER TABLE done. Now creating new tables via db.create_all() ---")
cur.close()
conn.close()

# Now use Flask app to create new tables
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from app import create_app
app = create_app()
with app.app_context():
    from app import db
    db.create_all()
    print("db.create_all() completed - new tables created!")

# Verify
conn2 = pymysql.connect(host='localhost', user='root', password='root', database='school_crm')
cur2 = conn2.cursor()
cur2.execute("SHOW TABLES")
tables = [r[0] for r in cur2.fetchall()]
expected = ['fee_installments', 'fee_receipts', 'scholarships', 'scholarship_awards',
            'concessions', 'expenses', 'vendors', 'purchase_orders', 'budgets',
            'accounting_entries', 'bank_reconciliation', 'fee_refunds']
print("\n--- Table Verification ---")
for t in expected:
    status = "EXISTS" if t in tables else "MISSING"
    print(f"  {t}: {status}")
cur2.close()
conn2.close()
print("\nDone!")
