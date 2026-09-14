"""add device_tokens table for push notifications

Revision ID: n7o8p9q0r1s2
Revises: l1m2n3o4p5q6
Create Date: 2026-09-14 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'n7o8p9q0r1s2'
down_revision = 'l1m2n3o4p5q6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'device_tokens',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('school_id', sa.Integer(), sa.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False),
        sa.Column('expo_push_token', sa.String(255), nullable=False, unique=True),
        sa.Column('platform', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_device_tokens_user_id', 'device_tokens', ['user_id'])


def downgrade():
    op.drop_index('ix_device_tokens_user_id', table_name='device_tokens')
    op.drop_table('device_tokens')
