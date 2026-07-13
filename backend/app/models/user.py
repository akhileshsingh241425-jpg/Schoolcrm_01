from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


user_roles = db.Table('user_roles',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True)
)


class Role(db.Model):
    __tablename__ = 'roles'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    description = db.Column(db.String(255))
    is_system_role = db.Column(db.Boolean, default=False)

    users = db.relationship('User', backref='role', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description
        }


class Permission(db.Model):
    __tablename__ = 'permissions'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    module = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'module': self.module,
            'description': self.description
        }


class RolePermission(db.Model):
    __tablename__ = 'role_permissions'

    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id', ondelete='CASCADE'), nullable=False)
    permission_id = db.Column(db.Integer, db.ForeignKey('permissions.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'))

    __table_args__ = (
        db.UniqueConstraint('role_id', 'permission_id', 'school_id', name='unique_role_perm'),
    )


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    school_id = db.Column(db.Integer, db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=True)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    avatar_url = db.Column(db.String(500))
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('school_id', 'email', name='unique_school_email'),
    )

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name or ''}".strip()

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    roles = db.relationship('Role', secondary=user_roles, lazy='joined')

    @property
    def all_roles(self):
        """Return all roles: primary role + additional roles (direct DB query)"""
        from app import db as _db
        primary = Role.query.get(self.role_id)
        rows = _db.session.execute(
            user_roles.select().where(user_roles.c.user_id == self.id)
        ).fetchall()
        extra_ids = [r.role_id for r in rows]
        seen = set()
        result = []
        if primary:
            result.append(primary)
            seen.add(primary.id)
        for rid in extra_ids:
            if rid not in seen:
                r = Role.query.get(rid)
                if r:
                    result.append(r)
                    seen.add(rid)
        return result

    @property
    def role_names(self):
        return [r.name for r in self.all_roles]

    def has_role(self, *role_names):
        return any(r.name in role_names for r in self.all_roles)

    def to_dict(self):
        from app import db as _db
        from app.models.staff import Staff
        primary = Role.query.get(self.role_id)
        rows = _db.session.execute(
            user_roles.select().where(user_roles.c.user_id == self.id)
        ).fetchall()
        extra_ids = [r.role_id for r in rows]
        seen = set()
        all_objs = []
        if primary:
            all_objs.append(primary)
            seen.add(primary.id)
        for rid in extra_ids:
            if rid not in seen:
                r = Role.query.get(rid)
                if r:
                    all_objs.append(r)
                    seen.add(rid)
        staff = Staff.query.filter_by(user_id=self.id).first()
        return {
            'id': self.id,
            'school_id': self.school_id,
            'staff_id': staff.id if staff else None,
            'role': primary.to_dict() if primary else None,
            'roles': [r.to_dict() for r in all_objs],
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'avatar_url': self.avatar_url,
            'is_active': self.is_active,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def get_allowed_modules(self):
        """Get list of modules this user can access based on ALL role permissions"""
        from app import db as _db
        role_ids = [self.role_id]
        rows = _db.session.execute(
            user_roles.select().where(user_roles.c.user_id == self.id)
        ).fetchall()
        for row in rows:
            if row.role_id != self.role_id:
                role_ids.append(row.role_id)
        if not role_ids:
            return []
        perms = RolePermission.query.filter(
            RolePermission.role_id.in_(role_ids),
            db.or_(RolePermission.school_id == self.school_id if self.school_id else RolePermission.school_id.is_(None), RolePermission.school_id.is_(None))
        ).all()
        perm_ids = list(set(rp.permission_id for rp in perms))
        if not perm_ids:
            return []
        permissions = Permission.query.filter(Permission.id.in_(perm_ids)).all()
        modules = list(set(p.module for p in permissions))
        return sorted(modules)
