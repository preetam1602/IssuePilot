"""saved issues and matcher preferences

Revision ID: a9b8c7d6e5f4
Revises: f3a4b5c6d7e8
Create Date: 2026-10-20 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a9b8c7d6e5f4'
down_revision: Union[str, Sequence[str], None] = 'f3a4b5c6d7e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'saved_issues',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('issue_id', sa.UUID(), nullable=False),
        sa.Column('comments_at_save', sa.Integer(), server_default='0', nullable=False),
        sa.Column('saved_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['issue_id'], ['issues.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'issue_id', name='uq_saved_issues_user_issue'),
    )
    op.create_index('ix_saved_issues_user_id', 'saved_issues', ['user_id'])

    op.create_table(
        'user_preferences',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('boosted_languages', postgresql.ARRAY(sa.String()), server_default='{}', nullable=False),
        sa.Column('muted_languages', postgresql.ARRAY(sa.String()), server_default='{}', nullable=False),
        sa.Column('comfort_difficulty', sa.String(), server_default='any', nullable=False),
        sa.Column('prefer_fresh', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('user_preferences')
    op.drop_index('ix_saved_issues_user_id', table_name='saved_issues')
    op.drop_table('saved_issues')
