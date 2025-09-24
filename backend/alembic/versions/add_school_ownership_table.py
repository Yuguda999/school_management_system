"""Add school ownership table for multi-school support

Revision ID: add_school_ownership
Revises: 
Create Date: 2024-03-17 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_school_ownership'
down_revision = None  # Update this with the latest revision
branch_labels = None
depends_on = None


def upgrade():
    # Create school_ownerships table
    op.create_table('school_ownerships',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('school_id', sa.String(length=36), nullable=False),
        sa.Column('is_primary_owner', sa.Boolean(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('can_manage_billing', sa.Boolean(), nullable=False),
        sa.Column('can_manage_users', sa.Boolean(), nullable=False),
        sa.Column('can_manage_settings', sa.Boolean(), nullable=False),
        sa.Column('granted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('granted_by', sa.String(length=36), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['granted_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'school_id', name='unique_user_school_ownership')
    )
    
    # Create indexes
    op.create_index(op.f('ix_school_ownerships_user_id'), 'school_ownerships', ['user_id'], unique=False)
    op.create_index(op.f('ix_school_ownerships_school_id'), 'school_ownerships', ['school_id'], unique=False)
    op.create_index(op.f('ix_school_ownerships_is_primary_owner'), 'school_ownerships', ['is_primary_owner'], unique=False)
    
    # Migrate existing school owners to the new table
    # This will create ownership records for existing school_owner users
    op.execute("""
        INSERT INTO school_ownerships (
            id, user_id, school_id, is_primary_owner, is_active, 
            can_manage_billing, can_manage_users, can_manage_settings,
            granted_at, created_at, updated_at, is_deleted
        )
        SELECT 
            gen_random_uuid()::text,
            u.id,
            u.school_id,
            true,  -- is_primary_owner
            true,  -- is_active
            true,  -- can_manage_billing
            true,  -- can_manage_users
            true,  -- can_manage_settings
            NOW(), -- granted_at
            u.created_at,
            u.updated_at,
            false  -- is_deleted
        FROM users u
        WHERE u.role = 'SCHOOL_OWNER'
        AND u.school_id IS NOT NULL 
        AND u.is_deleted = false
    """)


def downgrade():
    # Drop indexes
    op.drop_index(op.f('ix_school_ownerships_is_primary_owner'), table_name='school_ownerships')
    op.drop_index(op.f('ix_school_ownerships_school_id'), table_name='school_ownerships')
    op.drop_index(op.f('ix_school_ownerships_user_id'), table_name='school_ownerships')
    
    # Drop table
    op.drop_table('school_ownerships')
