"""merge_migration_branches

Revision ID: f0040b89e855
Revises: 8eb7595cc9d3, e7f92a4c8d31
Create Date: 2025-12-01 09:05:00.456681

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f0040b89e855'
down_revision = ('8eb7595cc9d3', 'e7f92a4c8d31')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
