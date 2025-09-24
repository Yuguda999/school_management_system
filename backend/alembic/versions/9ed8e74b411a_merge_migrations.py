"""merge_migrations

Revision ID: 9ed8e74b411a
Revises: add_freemium_trial_fields, add_school_ownership
Create Date: 2025-09-17 07:39:07.253893

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9ed8e74b411a'
down_revision = ('add_freemium_trial_fields', 'add_school_ownership')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
