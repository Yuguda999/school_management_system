"""create_grade_templates_table

Revision ID: c8f9d1e2a3b4
Revises: a8167fa0aaf7
Create Date: 2025-11-29 23:31:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = 'c8f9d1e2a3b4'
down_revision = 'a8167fa0aaf7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create grade_templates table
    op.create_table(
        'grade_templates',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('school_id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('total_marks', sa.Numeric(5, 2), nullable=False, server_default='100'),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_by', sa.String(36), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_grade_templates_school_id'), 'grade_templates', ['school_id'], unique=False)
    op.create_index(op.f('ix_grade_templates_is_default'), 'grade_templates', ['is_default'], unique=False)

    # Create assessment_components table
    op.create_table(
        'assessment_components',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('school_id', sa.String(36), nullable=False),
        sa.Column('template_id', sa.String(36), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('weight', sa.Numeric(5, 2), nullable=False),
        sa.Column('is_required', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], ),
        sa.ForeignKeyConstraint(['template_id'], ['grade_templates.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_assessment_components_template_id'), 'assessment_components', ['template_id'], unique=False)
    op.create_index(op.f('ix_assessment_components_school_id'), 'assessment_components', ['school_id'], unique=False)

    # Create grade_scales table
    op.create_table(
        'grade_scales',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('school_id', sa.String(36), nullable=False),
        sa.Column('template_id', sa.String(36), nullable=False),
        sa.Column('grade', sa.String(10), nullable=False),
        sa.Column('min_score', sa.Numeric(5, 2), nullable=False),
        sa.Column('max_score', sa.Numeric(5, 2), nullable=False),
        sa.Column('remark', sa.String(100), nullable=True),
        sa.Column('color', sa.String(20), nullable=True),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], ),
        sa.ForeignKeyConstraint(['template_id'], ['grade_templates.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_grade_scales_template_id'), 'grade_scales', ['template_id'], unique=False)
    op.create_index(op.f('ix_grade_scales_school_id'), 'grade_scales', ['school_id'], unique=False)

    # Create remark_templates table
    op.create_table(
        'remark_templates',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('school_id', sa.String(36), nullable=False),
        sa.Column('template_id', sa.String(36), nullable=False),
        sa.Column('min_percentage', sa.Numeric(5, 2), nullable=False),
        sa.Column('max_percentage', sa.Numeric(5, 2), nullable=False),
        sa.Column('remark_text', sa.Text(), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], ),
        sa.ForeignKeyConstraint(['template_id'], ['grade_templates.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_remark_templates_template_id'), 'remark_templates', ['template_id'], unique=False)
    op.create_index(op.f('ix_remark_templates_school_id'), 'remark_templates', ['school_id'], unique=False)


def downgrade() -> None:
    # Drop remark_templates table
    op.drop_index(op.f('ix_remark_templates_school_id'), table_name='remark_templates')
    op.drop_index(op.f('ix_remark_templates_template_id'), table_name='remark_templates')
    op.drop_table('remark_templates')

    # Drop grade_scales table
    op.drop_index(op.f('ix_grade_scales_school_id'), table_name='grade_scales')
    op.drop_index(op.f('ix_grade_scales_template_id'), table_name='grade_scales')
    op.drop_table('grade_scales')

    # Drop assessment_components table
    op.drop_index(op.f('ix_assessment_components_school_id'), table_name='assessment_components')
    op.drop_index(op.f('ix_assessment_components_template_id'), table_name='assessment_components')
    op.drop_table('assessment_components')

    # Drop grade_templates table
    op.drop_index(op.f('ix_grade_templates_is_default'), table_name='grade_templates')
    op.drop_index(op.f('ix_grade_templates_school_id'), table_name='grade_templates')
    op.drop_table('grade_templates')
