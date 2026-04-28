"""
Add missing columns to fee_payments table.
Run: backend/venv/bin/python3 fix_fee_payments_columns.py
"""
import sys
import os

try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
except ImportError:
    pass

try:
    import pymysql
except ImportError:
    os.system(f"{sys.executable} -m pip install pymysql")
    import pymysql

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = int(os.getenv('DB_PORT', 3306))
DB_NAME = os.getenv('DB_NAME', 'rohit0101')
DB_USER = os.getenv('DB_USER', 'rohit')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'rohit0101')

conn = pymysql.connect(
    host=DB_HOST, port=DB_PORT, user=DB_USER,
    password=DB_PASSWORD, db=DB_NAME, charset='utf8mb4'
)
cur = conn.cursor()

# Get existing columns
cur.execute("SHOW COLUMNS FROM fee_payments")
existing = {row[0] for row in cur.fetchall()}
print(f"Existing columns in fee_payments: {len(existing)}")

# Columns to add with their MySQL definitions
columns_to_add = {
    'gateway': "VARCHAR(20) DEFAULT NULL",
    'razorpay_signature': "VARCHAR(255) DEFAULT NULL",
    'paytm_order_id': "VARCHAR(255) DEFAULT NULL",
    'paytm_txn_id': "VARCHAR(255) DEFAULT NULL",
}

for col_name, col_def in columns_to_add.items():
    if col_name not in existing:
        sql = f"ALTER TABLE fee_payments ADD COLUMN `{col_name}` {col_def}"
        try:
            cur.execute(sql)
            conn.commit()
            print(f"  ✓ Added column: fee_payments.{col_name}")
        except Exception as e:
            conn.rollback()
            print(f"  ✗ Error adding fee_payments.{col_name}: {e}")
    else:
        print(f"  - Already exists: fee_payments.{col_name}")

cur.close()
conn.close()
print("\nDone!")
