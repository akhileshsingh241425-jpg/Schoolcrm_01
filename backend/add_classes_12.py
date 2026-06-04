"""Add Class 11 and Class 12 with sections A, B"""
import sys
sys.path.insert(0, '.')
from app import create_app, db
from app.models.student import Class, Section
from app.models.school import School

app = create_app('development')
with app.app_context():
    school = School.query.filter_by(code='DEMO001').first()
    sid = school.id
    
    existing = [c.name for c in Class.query.filter_by(school_id=sid).all()]
    print(f"Existing classes: {existing}")
    
    for num in [11, 12]:
        name = f"Class {num}"
        if name not in existing:
            cls = Class(school_id=sid, name=name, numeric_name=num)
            db.session.add(cls)
            db.session.flush()
            # Add sections
            for sec_name in ['A', 'B']:
                db.session.add(Section(school_id=sid, class_id=cls.id, name=sec_name))
            print(f"  Added {name} with sections A, B")
        else:
            print(f"  {name} already exists")
    
    db.session.commit()
    all_classes = Class.query.filter_by(school_id=sid).order_by(Class.id).all()
    print(f"\nAll classes now: {[c.name for c in all_classes]}")
