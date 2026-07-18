"""add class_teacher_id / co_class_teacher_id to class

Revision ID: a9b8c7d6e5f4
Revises: 72fc1f336c21
Create Date: 2026-07-11 17:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'a9b8c7d6e5f4'
down_revision = '72fc1f336c21'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('classes', sa.Column('class_teacher_id', sa.Integer(), sa.ForeignKey('staff.id', ondelete='SET NULL'), nullable=True))
    op.add_column('classes', sa.Column('co_class_teacher_id', sa.Integer(), sa.ForeignKey('staff.id', ondelete='SET NULL'), nullable=True))


def downgrade():
    op.drop_column('classes', 'co_class_teacher_id')
    op.drop_column('classes', 'class_teacher_id')
