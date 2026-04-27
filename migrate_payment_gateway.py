"""
Migration: Add payment gateway columns to fee_payments table
Adds: gateway, razorpay_signature, paytm_order_id, paytm_txn_id
"""
import pymysql
import sys

DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'root',
    'database': 'school_crm'
}

MIGRATIONS = [
    "ALTER TABLE fee_payments ADD COLUMN gateway VARCHAR(20) NULL AFTER transaction_id",
    "ALTER TABLE fee_payments ADD COLUMN razorpay_signature VARCHAR(255) NULL AFTER razorpay_order_id",
    "ALTER TABLE fee_payments ADD COLUMN paytm_order_id VARCHAR(255) NULL AFTER razorpay_signature",
    "ALTER TABLE fee_payments ADD COLUMN paytm_txn_id VARCHAR(255) NULL AFTER paytm_order_id",
]


def run():
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()

    for sql in MIGRATIONS:
        col_name = sql.split('ADD COLUMN ')[1].split(' ')[0]
        try:
            cursor.execute(sql)
            print(f"  [OK] Added column: {col_name}")
        except pymysql.err.OperationalError as e:
            if 'Duplicate column' in str(e):
                print(f"  [SKIP] Column already exists: {col_name}")
            else:
                print(f"  [ERROR] {col_name}: {e}")

    conn.commit()
    cursor.close()
    conn.close()
    print("\nMigration completed!")


if __name__ == '__main__':
    print("Running payment gateway migration...")
    run()
