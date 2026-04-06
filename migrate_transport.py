"""
Migration script for Transport & Fleet Management Module.
Creates new tables and alters existing transport tables.
"""
import sys
sys.path.insert(0, 'backend')

from backend.app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    # 1. Create all new tables (db.create_all only creates tables that don't exist)
    db.create_all()
    print("[OK] db.create_all() - new tables created")

    conn = db.session.connection()

    # 2. ALTER existing transport_routes table - add new columns
    route_cols = {
        'route_code': "VARCHAR(50)",
        'vehicle_id': "INT",
        'driver_id': "INT",
        'helper_name': "VARCHAR(100)",
        'helper_phone': "VARCHAR(20)",
        'start_location': "VARCHAR(200)",
        'end_location': "VARCHAR(200)",
        'total_distance_km': "FLOAT",
        'estimated_time_min': "INT",
        'shift': "VARCHAR(20) DEFAULT 'morning'",
    }
    for col, dtype in route_cols.items():
        try:
            conn.execute(text(f"ALTER TABLE transport_routes ADD COLUMN {col} {dtype}"))
            print(f"  [OK] transport_routes.{col} added")
        except Exception as e:
            if 'Duplicate column' in str(e):
                print(f"  [SKIP] transport_routes.{col} already exists")
            else:
                print(f"  [ERR] transport_routes.{col}: {e}")

    # 3. ALTER transport_stops - add new columns
    stop_cols = {
        'latitude': "DECIMAL(10,8)",
        'longitude': "DECIMAL(11,8)",
        'radius_meters': "INT DEFAULT 100",
        'fare': "DECIMAL(10,2)",
    }
    for col, dtype in stop_cols.items():
        try:
            conn.execute(text(f"ALTER TABLE transport_stops ADD COLUMN {col} {dtype}"))
            print(f"  [OK] transport_stops.{col} added")
        except Exception as e:
            if 'Duplicate column' in str(e):
                print(f"  [SKIP] transport_stops.{col} already exists")
            else:
                print(f"  [ERR] transport_stops.{col}: {e}")

    # 4. ALTER student_transport - add new columns
    st_cols = {
        'rfid_card_no': "VARCHAR(50)",
        'effective_from': "DATE",
        'effective_to': "DATE",
        'status': "VARCHAR(20) DEFAULT 'active'",
    }
    for col, dtype in st_cols.items():
        try:
            conn.execute(text(f"ALTER TABLE student_transport ADD COLUMN {col} {dtype}"))
            print(f"  [OK] student_transport.{col} added")
        except Exception as e:
            if 'Duplicate column' in str(e):
                print(f"  [SKIP] student_transport.{col} already exists")
            else:
                print(f"  [ERR] student_transport.{col}: {e}")

    db.session.commit()
    print("\n[DONE] Transport migration complete!")
