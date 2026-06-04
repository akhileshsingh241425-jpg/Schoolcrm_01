"""
Migration script: Fix inventory/store tables to match the current SQLAlchemy models.
Run: python fix_store_schema.py

This script handles:
1. inventory_categories - add description, is_active columns
2. inventory_items - add sku, max_stock_level, reorder_quantity, expiry_date, is_lab_item, is_active; make category_id nullable
3. inventory_transactions - rename 'type' ENUM to 'transaction_type' VARCHAR, add reference_type, reference_id, issued_to
"""

import os, pymysql, sys

# Load .env from backend directory
try:
    from dotenv import load_dotenv
    # Try loading from backend/.env first (when run from project root)
    backend_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend', '.env')
    if os.path.exists(backend_env):
        load_dotenv(backend_env)
        print(f"Loaded .env from {backend_env}")
    else:
        load_dotenv()  # fallback: load from current directory
        print("Loaded .env from current directory")
except ImportError:
    print("python-dotenv not installed, using environment variables only")

# DB config from environment variables
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', '3306')),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'school_crm'),
}

def get_connection():
    return pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor, charset='utf8mb4')

def column_exists(cursor, table, column):
    cursor.execute(
        "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = %s",
        (DB_CONFIG['database'], table, column)
    )
    return cursor.fetchone()['cnt'] > 0

def table_exists(cursor, table):
    cursor.execute(
        "SELECT COUNT(*) AS cnt FROM information_schema.TABLES "
        "WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s",
        (DB_CONFIG['database'], table)
    )
    return cursor.fetchone()['cnt'] > 0

def migrate():
    conn = get_connection()
    cursor = conn.cursor()

    # ── 1. inventory_categories ──────────────────────────────────
    if table_exists(cursor, 'inventory_categories'):
        # Add description column
        if not column_exists(cursor, 'inventory_categories', 'description'):
            cursor.execute("ALTER TABLE inventory_categories ADD COLUMN description TEXT AFTER name")
            print("  ✓ inventory_categories: added 'description'")

        # Add is_active column
        if not column_exists(cursor, 'inventory_categories', 'is_active'):
            cursor.execute("ALTER TABLE inventory_categories ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER description")
            print("  ✓ inventory_categories: added 'is_active'")
        else:
            print("  ✓ inventory_categories: 'is_active' already exists")
    else:
        print("  ⚠ inventory_categories table not found — skipping")

    # ── 2. inventory_items ───────────────────────────────────────
    if table_exists(cursor, 'inventory_items'):
        # Make category_id nullable (was NOT NULL in old schema)
        # Check if it's already nullable
        cursor.execute(
            "SELECT IS_NULLABLE FROM information_schema.COLUMNS "
            "WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND COLUMN_NAME = %s",
            (DB_CONFIG['database'], 'inventory_items', 'category_id')
        )
        row = cursor.fetchone()
        if row and row['IS_NULLABLE'] == 'NO':
            cursor.execute("ALTER TABLE inventory_items MODIFY COLUMN category_id INT NULL")
            print("  ✓ inventory_items: category_id now nullable")

        # Add missing columns
        new_columns = [
            ('sku', "VARCHAR(50) AFTER description"),
            ('max_stock_level', "INT AFTER min_stock_level"),
            ('reorder_quantity', "INT AFTER max_stock_level"),
            ('expiry_date', "DATE AFTER location"),
            ('is_lab_item', "BOOLEAN DEFAULT FALSE AFTER expiry_date"),
            ('is_active', "BOOLEAN DEFAULT TRUE AFTER is_lab_item"),
        ]
        for col_name, col_def in new_columns:
            if not column_exists(cursor, 'inventory_items', col_name):
                cursor.execute(f"ALTER TABLE inventory_items ADD COLUMN {col_name} {col_def}")
                print(f"  ✓ inventory_items: added '{col_name}'")
            else:
                print(f"  ✓ inventory_items: '{col_name}' already exists")
    else:
        print("  ⚠ inventory_items table not found — skipping")

    # ── 3. inventory_transactions ────────────────────────────────
    if table_exists(cursor, 'inventory_transactions'):
        # Check if old 'type' ENUM column exists
        if column_exists(cursor, 'inventory_transactions', 'type'):
            # Add new transaction_type column first
            if not column_exists(cursor, 'inventory_transactions', 'transaction_type'):
                cursor.execute(
                    "ALTER TABLE inventory_transactions ADD COLUMN transaction_type VARCHAR(20) NOT NULL DEFAULT 'in' AFTER item_id"
                )
                print("  ✓ inventory_transactions: added 'transaction_type'")

            # Copy data from old 'type' column to new 'transaction_type'
            cursor.execute("UPDATE inventory_transactions SET transaction_type = type WHERE transaction_type = 'in' AND type IN ('in', 'out')")
            # Map old 'out' values
            cursor.execute("UPDATE inventory_transactions SET transaction_type = 'out' WHERE type = 'out' AND transaction_type = 'in'")
            print("  ✓ inventory_transactions: migrated 'type' → 'transaction_type' data")

            # Drop old 'type' column
            cursor.execute("ALTER TABLE inventory_transactions DROP COLUMN type")
            print("  ✓ inventory_transactions: dropped old 'type' column")
        else:
            print("  ✓ inventory_transactions: 'type' column already removed")

        # Add missing columns
        new_columns = [
            ('reference_type', "VARCHAR(50) AFTER transaction_type"),
            ('reference_id', "INT AFTER reference_type"),
            ('issued_to', "VARCHAR(200) AFTER reference_id"),
        ]
        for col_name, col_def in new_columns:
            if not column_exists(cursor, 'inventory_transactions', col_name):
                cursor.execute(f"ALTER TABLE inventory_transactions ADD COLUMN {col_name} {col_def}")
                print(f"  ✓ inventory_transactions: added '{col_name}'")
            else:
                print(f"  ✓ inventory_transactions: '{col_name}' already exists")
    else:
        print("  ⚠ inventory_transactions table not found — skipping")

    conn.commit()
    cursor.close()
    conn.close()
    print("\n✅ Store/inventory schema migration complete!")

if __name__ == '__main__':
    try:
        migrate()
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)