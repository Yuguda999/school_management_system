"""add_component_scores_to_grades

Revision ID: e7f92a4c8d31
Revises: 34d4de7bd3a5
Create Date: 2025-11-30 22:24:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e7f92a4c8d31'
down_revision = '34d4de7bd3a5'
branch_labels = None
depends_on = None


def upgrade():
    # Add component_scores JSONB column to grades table
    op.add_column('grades', sa.Column('component_scores', postgresql.JSONB, nullable=True))


def downgrade():
    # Remove component_scores column  
    op.drop_column('grades', 'component_scores')
