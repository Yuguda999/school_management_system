"""add_assets_table

Revision ID: a8167fa0aaf7
Revises: 34d4de7bd3a5
Create Date: 2025-11-27 10:05:24.195191

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a8167fa0aaf7'
down_revision = '34d4de7bd3a5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'assets',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('school_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('category', sa.Enum('furniture', 'building', 'equipment', 'electronics', 'vehicles', 'sports', 'laboratory', 'other', name='assetcategory'), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('condition', sa.Enum('excellent', 'good', 'fair', 'poor', 'damaged', name='assetcondition'), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('purchase_date', sa.Date(), nullable=True),
        sa.Column('purchase_price', sa.Float(), nullable=True),
        sa.Column('serial_number', sa.String(length=255), nullable=True),
        sa.Column('warranty_expiry', sa.Date(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_assets_school_id'), 'assets', ['school_id'], unique=False)
    op.create_index(op.f('ix_assets_category'), 'assets', ['category'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_assets_category'), table_name='assets')
    op.drop_index(op.f('ix_assets_school_id'), table_name='assets')
    op.drop_table('assets')

