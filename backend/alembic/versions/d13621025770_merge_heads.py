"""merge heads

Revision ID: d13621025770
Revises: b729811a71f2, c8f9d1e2a3b4
Create Date: 2025-11-29 23:52:08.667656

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd13621025770'
down_revision = ('b729811a71f2', 'c8f9d1e2a3b4')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
