import os
import click
from flask.cli import with_appcontext
from app import db
from app.models.user import User, Role
from app.models.student import Student, Class, Section


def init_app(app):
    app.cli.add_command(create_super_admin)
    app.cli.add_command(seed_db)
    app.cli.add_command(assign_default_section)


@click.command('create-super-admin')
@click.option('--email', envvar='SUPER_ADMIN_EMAIL', prompt=True, help='Super admin email')
@click.option('--password', envvar='SUPER_ADMIN_PASSWORD', prompt=True, hide_input=True, confirmation_prompt=True, help='Super admin password')
@click.option('--first-name', default='Super', help='First name')
@click.option('--last-name', default='Admin', help='Last name')
@with_appcontext
def create_super_admin(email, password, first_name, last_name):
    role = Role.query.filter_by(name='super_admin').first()
    if not role:
        click.echo('Error: super_admin role not found. Run seed-db first.')
        return

    existing = User.query.filter_by(email=email, role_id=role.id).first()
    if existing:
        click.echo(f'Super admin "{email}" already exists.')
        return

    user = User(
        school_id=None,
        role_id=role.id,
        email=email,
        first_name=first_name,
        last_name=last_name,
        is_active=True,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    click.echo(f'Super admin "{email}" created successfully.')


@click.command('seed-db')
@with_appcontext
def seed_db():
    roles_data = [
        ('super_admin', 'Platform Super Admin', True),
        ('school_admin', 'School Administrator', True),
        ('principal', 'Principal', True),
        ('teacher', 'Teacher', True),
        ('exam_controller', 'Exam Controller', True),
        ('academic_controller', 'Academic Controller', True),
        ('it_department', 'IT Department', True),
        ('accountant', 'Accountant', True),
        ('counselor', 'Counselor / Marketing', True),
        ('parent', 'Parent', True),
        ('student', 'Student', True),
        ('librarian', 'Librarian', True),
        ('transport_manager', 'Transport Manager', True),
    ]
    for name, desc, system in roles_data:
        if not Role.query.filter_by(name=name).first():
            db.session.add(Role(name=name, description=desc, is_system_role=system))

    db.session.commit()
    click.echo('Database seeded: roles created.')


@click.command('assign-default-section')
@with_appcontext
def assign_default_section():
    """Assign Section A to all students with no section assigned"""
    students = Student.query.filter(
        Student.current_section_id.is_(None),
        Student.current_class_id.isnot(None)
    ).all()

    if not students:
        click.echo('No students found without a section.')
        return

    updated = 0
    for student in students:
        sec = Section.query.filter_by(
            school_id=student.school_id,
            class_id=student.current_class_id,
            name='A'
        ).first()
        if not sec:
            sec = Section(
                school_id=student.school_id,
                class_id=student.current_class_id,
                name='A'
            )
            db.session.add(sec)
            db.session.flush()
        student.current_section_id = sec.id
        updated += 1

    db.session.commit()
    click.echo(f'{updated} student(s) updated with Section A.')
