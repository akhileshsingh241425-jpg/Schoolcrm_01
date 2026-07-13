"""add section_applied column to admissions

Revision ID: g3h4i5j6k7l8
Revises: e1f4a2b3c5d6
Create Date: 2026-07-11 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'g3h4i5j6k7l8'
down_revision = 'e1f4a2b3c5d6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('admissions', sa.Column('section_applied', sa.Integer(), sa.ForeignKey('sections.id'), nullable=True))


def downgrade():
    op.drop_column('admissions', 'section_applied')
