"""add syllabus columns: book_name, total_chapters, chapter_added_date, nullable chapter_number/name

Revision ID: e1f4a2b3c5d6
Revises: a9b8c7d6e5f4
Create Date: 2026-07-11 18:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'e1f4a2b3c5d6'
down_revision = 'a9b8c7d6e5f4'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('syllabus', sa.Column('book_name', sa.String(255), nullable=True))
    op.add_column('syllabus', sa.Column('total_chapters', sa.Integer(), nullable=True))
    op.add_column('syllabus', sa.Column('chapter_added_date', sa.Date(), nullable=True))
    op.alter_column('syllabus', 'chapter_number', existing_type=sa.Integer(), nullable=True)
    op.alter_column('syllabus', 'chapter_name', existing_type=sa.String(255), nullable=True)


def downgrade():
    op.alter_column('syllabus', 'chapter_name', existing_type=sa.String(255), nullable=False)
    op.alter_column('syllabus', 'chapter_number', existing_type=sa.Integer(), nullable=False)
    op.drop_column('syllabus', 'chapter_added_date')
    op.drop_column('syllabus', 'total_chapters')
    op.drop_column('syllabus', 'book_name')
