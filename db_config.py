"""
Shared DB connection helper for migration/utility scripts.
Reads credentials from environment variables with sensible defaults.
Usage:
    from db_config import get_connection
    conn = get_connection()
"""
import os

def get_connection(**overrides):
    """Return a pymysql/mysql.connector connection using env-based config."""
    import pymysql
    config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', '3306')),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'school_crm'),
        'charset': 'utf8mb4',
    }
    config.update(overrides)
    return pymysql.connect(**config)

def get_config():
    """Return dict of DB config from env vars (for scripts that need custom connect)."""
    return {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', '3306')),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'school_crm'),
    }