"""Create principal-specific tables."""
import sys
sys.path.insert(0, '.')
from app import create_app, db
from app.models.principal import ClassObservation, DisciplineCase, TeacherPerformanceScore

app = create_app('development')
with app.app_context():
    db.create_all()
    print('Tables created successfully!')
