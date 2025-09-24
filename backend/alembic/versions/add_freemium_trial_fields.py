"""Add freemium trial fields to schools table

Revision ID: add_freemium_trial_fields
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_freemium_trial_fields'
down_revision = '4b64de626935'
branch_labels = None
depends_on = None


def upgrade():
    """Add freemium trial fields to schools table"""
    
    # Add subscription and trial management columns
    op.add_column('schools', sa.Column('subscription_plan', sa.String(50), nullable=False, server_default='trial'))
    op.add_column('schools', sa.Column('subscription_status', sa.String(20), nullable=False, server_default='trial'))
    op.add_column('schools', sa.Column('trial_started_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()))
    op.add_column('schools', sa.Column('trial_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('schools', sa.Column('trial_days', sa.Integer(), nullable=False, server_default='30'))
    
    # Add billing information columns
    op.add_column('schools', sa.Column('billing_email', sa.String(255), nullable=True))
    op.add_column('schools', sa.Column('last_payment_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('schools', sa.Column('next_billing_date', sa.DateTime(timezone=True), nullable=True))
    
    # Add usage limits columns
    op.add_column('schools', sa.Column('max_students', sa.Integer(), nullable=True))
    op.add_column('schools', sa.Column('max_teachers', sa.Integer(), nullable=True))
    op.add_column('schools', sa.Column('max_classes', sa.Integer(), nullable=True))
    
    # Update existing schools to have trial settings
    op.execute("""
        UPDATE schools 
        SET 
            subscription_plan = 'trial',
            subscription_status = 'trial',
            trial_started_at = created_at,
            trial_expires_at = created_at + INTERVAL '30 days',
            trial_days = 30,
            max_students = 100,
            max_teachers = 10,
            max_classes = 20
        WHERE subscription_plan IS NULL OR subscription_plan = ''
    """)


def downgrade():
    """Remove freemium trial fields from schools table"""
    
    # Remove the added columns
    op.drop_column('schools', 'max_classes')
    op.drop_column('schools', 'max_teachers')
    op.drop_column('schools', 'max_students')
    op.drop_column('schools', 'next_billing_date')
    op.drop_column('schools', 'last_payment_at')
    op.drop_column('schools', 'billing_email')
    op.drop_column('schools', 'trial_days')
    op.drop_column('schools', 'trial_expires_at')
    op.drop_column('schools', 'trial_started_at')
    op.drop_column('schools', 'subscription_status')
    op.drop_column('schools', 'subscription_plan')
