"""assign default Section A to students with no section

Revision ID: f2b3c4d5e6f7
Revises: e1f4a2b3c5d6
Create Date: 2026-07-11 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


revision = 'f2b3c4d5e6f7'
down_revision = 'e1f4a2b3c5d6'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    # Get distinct class_ids that have students with no section
    rows = conn.execute(text(
        "SELECT DISTINCT s.current_class_id FROM students s WHERE s.current_section_id IS NULL AND s.current_class_id IS NOT NULL"
    )).fetchall()
    for (class_id,) in rows:
        # Get school_id for this class
        school_id = conn.execute(text(
            "SELECT school_id FROM classes WHERE id = :cid", {'cid': class_id}
        )).scalar()
        if not school_id:
            continue
        # Ensure Section A exists
        sec = conn.execute(text(
            "SELECT id FROM sections WHERE school_id = :sid AND class_id = :cid AND name = 'A' LIMIT 1",
        ), {'sid': school_id, 'cid': class_id}).fetchone()
        if sec:
            section_id = sec[0]
        else:
            r = conn.execute(text(
                "INSERT INTO sections (school_id, class_id, name) VALUES (:sid, :cid, 'A')",
            ), {'sid': school_id, 'cid': class_id})
            section_id = r.inserted_primary_key[0]
        # Update all students in this class that have no section
        conn.execute(text(
            "UPDATE students SET current_section_id = :sec_id WHERE current_class_id = :cid AND current_section_id IS NULL",
        ), {'sec_id': section_id, 'cid': class_id})


def downgrade():
    pass
