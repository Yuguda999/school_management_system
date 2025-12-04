"""add_missing_field_types

Revision ID: 8eb7595cc9d3
Revises: 6d13f61863cd
Create Date: 2025-11-30 15:26:09.982553

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '8eb7595cc9d3'
down_revision = '6d13f61863cd'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new values to FieldType enum
    # We use execute with commit because ALTER TYPE cannot run inside a transaction block
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE fieldtype ADD VALUE IF NOT EXISTS 'SCHOOL_LOGO'")
        op.execute("ALTER TYPE fieldtype ADD VALUE IF NOT EXISTS 'SCHOOL_NAME'")
        op.execute("ALTER TYPE fieldtype ADD VALUE IF NOT EXISTS 'SCHOOL_ADDRESS'")
        op.execute("ALTER TYPE fieldtype ADD VALUE IF NOT EXISTS 'SCHOOL_MOTTO'")
        op.execute("ALTER TYPE fieldtype ADD VALUE IF NOT EXISTS 'STUDENT_NAME'")
        op.execute("ALTER TYPE fieldtype ADD VALUE IF NOT EXISTS 'CLASS_NAME'")
        op.execute("ALTER TYPE fieldtype ADD VALUE IF NOT EXISTS 'ROLL_NUMBER'")
        op.execute("ALTER TYPE fieldtype ADD VALUE IF NOT EXISTS 'ACADEMIC_YEAR'")
        op.execute("ALTER TYPE fieldtype ADD VALUE IF NOT EXISTS 'TERM'")
        op.execute("ALTER TYPE fieldtype ADD VALUE IF NOT EXISTS 'TOTAL_MARKS'")
        op.execute("ALTER TYPE fieldtype ADD VALUE IF NOT EXISTS 'PERCENTAGE'")
        op.execute("ALTER TYPE fieldtype ADD VALUE IF NOT EXISTS 'POSITION'")
        op.execute("ALTER TYPE fieldtype ADD VALUE IF NOT EXISTS 'RESULT'")
        op.execute("ALTER TYPE fieldtype ADD VALUE IF NOT EXISTS 'ATTENDANCE_SUMMARY'")
        op.execute("ALTER TYPE fieldtype ADD VALUE IF NOT EXISTS 'NEXT_TERM_DATE'")


def downgrade() -> None:
    # Postgres does not support removing values from Enums easily
    pass
