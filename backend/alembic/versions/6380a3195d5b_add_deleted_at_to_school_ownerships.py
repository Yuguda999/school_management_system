"""add_deleted_at_to_school_ownerships

Revision ID: 6380a3195d5b
Revises: 9ed8e74b411a
Create Date: 2025-09-17 08:01:23.016615

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6380a3195d5b'
down_revision = '9ed8e74b411a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add deleted_at column to school_ownerships table
    op.add_column('school_ownerships', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))

    # Also fix the created_at and updated_at columns to be proper DateTime instead of String
    # Use raw SQL to handle the type conversion properly
    op.execute("ALTER TABLE school_ownerships ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at::timestamp with time zone")
    op.execute("ALTER TABLE school_ownerships ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE USING updated_at::timestamp with time zone")


def downgrade() -> None:
    # Remove deleted_at column
    op.drop_column('school_ownerships', 'deleted_at')

    # Revert created_at and updated_at columns back to String
    op.alter_column('school_ownerships', 'created_at',
                    existing_type=sa.DateTime(timezone=True),
                    type_=sa.String(length=50),
                    existing_nullable=False)

    op.alter_column('school_ownerships', 'updated_at',
                    existing_type=sa.DateTime(timezone=True),
                    type_=sa.String(length=50),
                    existing_nullable=False)
