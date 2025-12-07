"""add_academic_session_and_promotion_tracking

Revision ID: 0d504a55402f
Revises: b2afa869843a
Create Date: 2025-12-06 04:18:36.701688

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0d504a55402f'
down_revision = 'b2afa869843a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new TermType enum values for semester support
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE termtype ADD VALUE IF NOT EXISTS 'first_semester'")
        op.execute("ALTER TYPE termtype ADD VALUE IF NOT EXISTS 'second_semester'")
    
    # Create academic_sessions table
    op.create_table('academic_sessions',
        sa.Column('name', sa.String(length=20), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('status', sa.Enum('UPCOMING', 'ACTIVE', 'COMPLETED', 'ARCHIVED', name='sessionstatus'), nullable=False),
        sa.Column('term_count', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('is_current', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('promotion_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('school_id', sa.String(length=36), nullable=False),
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Add indexes for academic_sessions
    op.create_index('ix_academic_sessions_school_id', 'academic_sessions', ['school_id'])
    op.create_index('ix_academic_sessions_is_current', 'academic_sessions', ['is_current'])
    op.create_index('ix_academic_sessions_name', 'academic_sessions', ['name'])
    
    # Add columns to student_class_history
    op.add_column('student_class_history', sa.Column('academic_session_id', sa.String(length=36), nullable=True))
    op.add_column('student_class_history', sa.Column('final_average', sa.Numeric(precision=5, scale=2), nullable=True))
    # Add with server_default first, then remove default to allow NULL for new rows
    op.add_column('student_class_history', sa.Column('promotion_eligible', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('student_class_history', sa.Column('promotion_decision', sa.String(length=20), nullable=True))
    op.add_column('student_class_history', sa.Column('decided_by', sa.String(length=36), nullable=True))
    op.add_column('student_class_history', sa.Column('decision_date', sa.Date(), nullable=True))
    op.create_foreign_key('fk_student_class_history_session', 'student_class_history', 'academic_sessions', ['academic_session_id'], ['id'])
    op.create_foreign_key('fk_student_class_history_decided_by', 'student_class_history', 'users', ['decided_by'], ['id'])
    
    # Add columns to terms
    # Add sequence_number with server_default for existing rows
    op.add_column('terms', sa.Column('sequence_number', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('terms', sa.Column('academic_session_id', sa.String(length=36), nullable=True))
    op.create_foreign_key('fk_terms_academic_session', 'terms', 'academic_sessions', ['academic_session_id'], ['id'])
    
    # Update existing terms sequence_number based on term type
    op.execute("""
        UPDATE terms SET sequence_number = 
            CASE UPPER(type::text)
                WHEN 'FIRST_TERM' THEN 1
                WHEN 'FIRST_SEMESTER' THEN 1
                WHEN 'SECOND_TERM' THEN 2
                WHEN 'SECOND_SEMESTER' THEN 2
                WHEN 'THIRD_TERM' THEN 3
                ELSE 1
            END
    """)


def downgrade() -> None:
    # Drop foreign keys first
    op.drop_constraint('fk_terms_academic_session', 'terms', type_='foreignkey')
    op.drop_column('terms', 'academic_session_id')
    op.drop_column('terms', 'sequence_number')
    
    op.drop_constraint('fk_student_class_history_decided_by', 'student_class_history', type_='foreignkey')
    op.drop_constraint('fk_student_class_history_session', 'student_class_history', type_='foreignkey')
    op.drop_column('student_class_history', 'decision_date')
    op.drop_column('student_class_history', 'decided_by')
    op.drop_column('student_class_history', 'promotion_decision')
    op.drop_column('student_class_history', 'promotion_eligible')
    op.drop_column('student_class_history', 'final_average')
    op.drop_column('student_class_history', 'academic_session_id')
    
    # Drop indexes
    op.drop_index('ix_academic_sessions_name', 'academic_sessions')
    op.drop_index('ix_academic_sessions_is_current', 'academic_sessions')
    op.drop_index('ix_academic_sessions_school_id', 'academic_sessions')
    
    op.drop_table('academic_sessions')
    
    # Note: Cannot remove enum values in PostgreSQL easily, leaving them in place

