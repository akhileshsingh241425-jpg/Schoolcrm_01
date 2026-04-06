"""Create substitute_assignments table"""
import sys
sys.path.insert(0, 'backend')

from app import create_app, db
from app.models.attendance import SubstituteAssignment

app = create_app()

with app.app_context():
    SubstituteAssignment.__table__.create(db.engine, checkfirst=True)
    print("substitute_assignments table created successfully!")
