"""fix library_issues.issued_to type (int -> string, matches students.admission_no)

Revision ID: l1m2n3o4p5q6
Revises: 1a3612c4ed06
Create Date: 2026-09-14 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'l1m2n3o4p5q6'
down_revision = '1a3612c4ed06'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        'library_issues', 'issued_to',
        existing_type=sa.Integer(),
        type_=sa.String(50),
        existing_nullable=False,
    )


def downgrade():
    op.alter_column(
        'library_issues', 'issued_to',
        existing_type=sa.String(50),
        type_=sa.Integer(),
        existing_nullable=False,
    )
