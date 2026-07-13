"""merge f2b3c4d5e6f7 and i9j0k1l2m3n4 heads

Revision ID: m3n4o5p6q7r8
Revises: f2b3c4d5e6f7, i9j0k1l2m3n4
Create Date: 2026-07-13 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'm3n4o5p6q7r8'
down_revision = ('f2b3c4d5e6f7', 'i9j0k1l2m3n4')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
