"""Add teacher permissions and audit log delegated fields

Revision ID: 2025121101
Revises: 2071656af265
Create Date: 2025-12-11 23:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2025121101'
down_revision: Union[str, None] = '2071656af265'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create teacher_permissions table
    op.create_table(
        'teacher_permissions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('school_id', sa.String(36), nullable=False, index=True),
        sa.Column('teacher_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('permission_type', sa.Enum(
            'manage_students', 'manage_fees', 'manage_assets', 'manage_grades',
            'manage_classes', 'manage_attendance', 'view_analytics',
            name='permissiontype'
        ), nullable=False),
        sa.Column('granted_by', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
        sa.Column('is_deleted', sa.Boolean(), default=False, nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    
    # Create unique constraint to prevent duplicate permissions
    op.create_unique_constraint(
        'uq_teacher_permission',
        'teacher_permissions',
        ['school_id', 'teacher_id', 'permission_type']
    )
    
    # Add delegated action tracking columns to audit_logs
    op.add_column('audit_logs', sa.Column('is_delegated', sa.Boolean(), default=False, nullable=False, server_default='false'))
    op.add_column('audit_logs', sa.Column('delegated_by', sa.String(36), sa.ForeignKey('users.id'), nullable=True))


def downgrade() -> None:
    # Remove columns from audit_logs
    op.drop_column('audit_logs', 'delegated_by')
    op.drop_column('audit_logs', 'is_delegated')
    
    # Drop teacher_permissions table
    op.drop_constraint('uq_teacher_permission', 'teacher_permissions', type_='unique')
    op.drop_table('teacher_permissions')
    
    # Drop the enum type
    op.execute('DROP TYPE IF EXISTS permissiontype')
