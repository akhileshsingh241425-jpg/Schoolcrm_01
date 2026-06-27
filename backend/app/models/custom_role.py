from app import db
from datetime import datetime


# All available modules and their permission levels
AVAILABLE_MODULES = [
    {'key': 'dashboard', 'label': 'Dashboard', 'description': 'School overview and stats'},
    {'key': 'students', 'label': 'Students', 'description': 'Student records management'},
    {'key': 'staff', 'label': 'Staff', 'description': 'Staff/employee management'},
    {'key': 'fees', 'label': 'Fees & Finance', 'description': 'Fee structures, payments, invoices'},
    {'key': 'attendance', 'label': 'Attendance', 'description': 'Student and staff attendance'},
    {'key': 'academics', 'label': 'Academics', 'description': 'Subjects, timetable, syllabus'},
    {'key': 'exams', 'label': 'Exams & Results', 'description': 'Exam management, marks entry, results'},
    {'key': 'admissions', 'label': 'Admissions', 'description': 'Leads, enquiries, admission process'},
    {'key': 'communication', 'label': 'Communication', 'description': 'SMS, WhatsApp, notices'},
    {'key': 'transport', 'label': 'Transport', 'description': 'Vehicles, routes, tracking'},
    {'key': 'library', 'label': 'Library', 'description': 'Books, issue/return'},
    {'key': 'hostel', 'label': 'Hostel', 'description': 'Rooms, allocation, mess'},
    {'key': 'canteen', 'label': 'Canteen', 'description': 'Menu, orders, billing'},
    {'key': 'sports', 'label': 'Sports', 'description': 'Sports activities, events'},
    {'key': 'inventory', 'label': 'Inventory', 'description': 'Stock, items, store'},
    {'key': 'health', 'label': 'Health & Safety', 'description': 'Medical records, incidents'},
    {'key': 'reports', 'label': 'Reports', 'description': 'All analytics and reports'},
    {'key': 'settings', 'label': 'Settings', 'description': 'School settings, branding'},
    {'key': 'user_management', 'label': 'User Management', 'description': 'Create/manage user accounts'},
    {'key': 'data_import', 'label': 'Data Import', 'description': 'Bulk import students, staff'},
]

PERMISSION_LEVELS = ['none', 'view', 'create', 'edit', 'delete', 'full']


class CustomRole(db.Model):
    __tablename__ = 'custom_roles'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    display_name = db.Column(db.String(200))
    description = db.Column(db.Text)
    is_system = db.Column(db.Boolean, default=False)  # Pre-built roles that can't be deleted
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    permissions = db.relationship('RoleModulePermission', backref='custom_role', lazy='dynamic', cascade='all, delete-orphan')

    __table_args__ = (
        db.UniqueConstraint('school_id', 'name', name='unique_school_role_name'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'school_id': self.school_id,
            'name': self.name,
            'display_name': self.display_name or self.name.replace('_', ' ').title(),
            'description': self.description,
            'is_system': self.is_system,
            'is_active': self.is_active,
            'permissions': {p.module: p.level for p in self.permissions.all()},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class RoleModulePermission(db.Model):
    __tablename__ = 'role_module_permissions'

    id = db.Column(db.Integer, primary_key=True)
    custom_role_id = db.Column(db.Integer, db.ForeignKey('custom_roles.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    module = db.Column(db.String(50), nullable=False)  # e.g. 'students', 'fees', 'settings'
    level = db.Column(db.String(20), default='none')  # none, view, create, edit, delete, full

    __table_args__ = (
        db.UniqueConstraint('custom_role_id', 'module', name='unique_role_module'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'module': self.module,
            'level': self.level,
        }


# Pre-built role templates
DEFAULT_ROLE_TEMPLATES = {
    'it_admin': {
        'display_name': 'IT Admin',
        'description': 'System management, user accounts, data import',
        'permissions': {
            'dashboard': 'view', 'students': 'full', 'staff': 'full',
            'fees': 'view', 'attendance': 'view', 'academics': 'view',
            'exams': 'view', 'admissions': 'view', 'communication': 'full',
            'transport': 'view', 'library': 'view', 'hostel': 'view',
            'canteen': 'view', 'sports': 'view', 'inventory': 'view',
            'health': 'view', 'reports': 'full', 'settings': 'full',
            'user_management': 'full', 'data_import': 'full',
        }
    },
    'hr_manager': {
        'display_name': 'HR Manager',
        'description': 'Staff management, attendance, leave',
        'permissions': {
            'dashboard': 'view', 'students': 'none', 'staff': 'full',
            'fees': 'none', 'attendance': 'full', 'academics': 'none',
            'exams': 'none', 'admissions': 'none', 'communication': 'create',
            'transport': 'none', 'library': 'none', 'hostel': 'none',
            'canteen': 'none', 'sports': 'none', 'inventory': 'none',
            'health': 'view', 'reports': 'view', 'settings': 'none',
            'user_management': 'create', 'data_import': 'full',
        }
    },
    'data_operator': {
        'display_name': 'Data Operator',
        'description': 'Data entry for students, attendance, basic records',
        'permissions': {
            'dashboard': 'view', 'students': 'edit', 'staff': 'view',
            'fees': 'view', 'attendance': 'full', 'academics': 'view',
            'exams': 'view', 'admissions': 'edit', 'communication': 'none',
            'transport': 'view', 'library': 'edit', 'hostel': 'view',
            'canteen': 'view', 'sports': 'view', 'inventory': 'view',
            'health': 'edit', 'reports': 'none', 'settings': 'none',
            'user_management': 'none', 'data_import': 'full',
        }
    },
    'accountant': {
        'display_name': 'Accountant',
        'description': 'Financial management, fees, payments',
        'permissions': {
            'dashboard': 'view', 'students': 'view', 'staff': 'view',
            'fees': 'full', 'attendance': 'none', 'academics': 'none',
            'exams': 'none', 'admissions': 'none', 'communication': 'create',
            'transport': 'view', 'library': 'none', 'hostel': 'none',
            'canteen': 'view', 'sports': 'none', 'inventory': 'view',
            'health': 'none', 'reports': 'view', 'settings': 'none',
            'user_management': 'none', 'data_import': 'none',
        }
    },
    'receptionist': {
        'display_name': 'Receptionist',
        'description': 'Visitor management, enquiries, basic communication',
        'permissions': {
            'dashboard': 'view', 'students': 'view', 'staff': 'view',
            'fees': 'view', 'attendance': 'none', 'academics': 'none',
            'exams': 'none', 'admissions': 'full', 'communication': 'create',
            'transport': 'view', 'library': 'none', 'hostel': 'none',
            'canteen': 'none', 'sports': 'none', 'inventory': 'none',
            'health': 'none', 'reports': 'none', 'settings': 'none',
            'user_management': 'none', 'data_import': 'none',
        }
    },
}
