"""add_inactive_to_student_status_enum

Revision ID: 34d4de7bd3a5
Revises: 95f2585e64bf
Create Date: 2025-11-26 17:29:00.619857

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '34d4de7bd3a5'
down_revision = '95f2585e64bf'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add 'inactive' value to studentstatus enum
    op.execute("ALTER TYPE studentstatus ADD VALUE IF NOT EXISTS 'inactive'")


def downgrade() -> None:
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum type, which is complex and risky
    # For now, we'll leave the value in place even on downgrade
    pass
