"""create component mappings table

Revision ID: 6d13f61863cd
Revises: d13621025770
Create Date: 2025-11-30 11:41:56.452238

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6d13f61863cd'
down_revision = 'd13621025770'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create component_mappings table
    op.create_table(
        'component_mappings',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('school_id', sa.String(), nullable=False),
        sa.Column('teacher_id', sa.String(), nullable=False),
        sa.Column('subject_id', sa.String(), nullable=False),
        sa.Column('term_id', sa.String(), nullable=False),
        sa.Column('component_id', sa.String(), nullable=False),
        sa.Column('exam_type_name', sa.String(length=100), nullable=False),
        sa.Column('include_in_calculation', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['teacher_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['term_id'], ['terms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['component_id'], ['assessment_components.id'], ondelete='CASCADE'),
    )
    
    # Create indexes for efficient querying
    op.create_index(
        'idx_component_mapping_teacher_subject_term',
        'component_mappings',
        ['teacher_id', 'subject_id', 'term_id']
    )
    op.create_index(
        'idx_component_mapping_teacher_subject_term_exam_type',
        'component_mappings',
        ['teacher_id', 'subject_id', 'term_id', 'exam_type_name']
    )


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_component_mapping_teacher_subject_term_exam_type', table_name='component_mappings')
    op.drop_index('idx_component_mapping_teacher_subject_term', table_name='component_mappings')
    
    # Drop table
    op.drop_table('component_mappings')
