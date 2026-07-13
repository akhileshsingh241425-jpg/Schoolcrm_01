"""add chapter_number, chapter_name to syllabus_progress

Revision ID: i9j0k1l2m3n4
Revises: g3h4i5j6k7l8
Create Date: 2026-07-13 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'i9j0k1l2m3n4'
down_revision = 'g3h4i5j6k7l8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('syllabus_progress', sa.Column('chapter_number', sa.Integer(), nullable=True))
    op.add_column('syllabus_progress', sa.Column('chapter_name', sa.String(200), nullable=True))


def downgrade():
    op.drop_column('syllabus_progress', 'chapter_name')
    op.drop_column('syllabus_progress', 'chapter_number')
