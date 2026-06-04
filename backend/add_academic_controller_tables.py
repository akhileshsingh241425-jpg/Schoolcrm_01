"""Create academic controller tables and seed the academic_controller role."""
import sys
sys.path.insert(0, '.')
from app import create_app, db
from app.models.user import Role
from app.models.academic import (
    Term, TimetableSubstitution, PromotionCriteria, PromotionRecord, AcademicPolicy
)

app = create_app('development')

with app.app_context():
    # Create all new tables (terms, timetable_substitutions, promotion_criteria,
    # promotion_records, academic_policies)
    db.create_all()
    print('Tables created successfully!')

    # Seed the academic_controller role if it doesn't already exist
    role = Role.query.filter_by(name='academic_controller').first()
    if not role:
        role = Role(
            name='academic_controller',
            description='Academic Controller - manages curriculum, timetable, teacher assignments, lesson plans, promotions, and academic analytics',
            is_system_role=True
        )
        db.session.add(role)
        db.session.commit()
        print(f'Created academic_controller role (id={role.id})')
    else:
        print(f'academic_controller role already exists (id={role.id})')

    print('\n✅ Academic controller migration complete!')
