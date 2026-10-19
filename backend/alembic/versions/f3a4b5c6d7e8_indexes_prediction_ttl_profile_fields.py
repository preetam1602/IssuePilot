"""search indexes, prediction timestamp, GitHub profile fields

Revision ID: f3a4b5c6d7e8
Revises: e1f2a3b4c5d6
Create Date: 2026-10-19 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3a4b5c6d7e8'
down_revision: Union[str, Sequence[str], None] = 'e1f2a3b4c5d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('predictions', sa.Column('predicted_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('location', sa.String(), nullable=True))
    op.add_column('users', sa.Column('website', sa.String(), nullable=True))
    op.add_column('users', sa.Column('twitter_username', sa.String(), nullable=True))
    op.add_column('users', sa.Column('total_stars', sa.Integer(), server_default='0', nullable=False))
    op.add_column('user_skills', sa.Column('repo_count', sa.Integer(), server_default='0', nullable=False))

    op.execute('CREATE EXTENSION IF NOT EXISTS pg_trgm')
    op.create_index('ix_issues_title_trgm', 'issues', ['title'], postgresql_using='gin', postgresql_ops={'title': 'gin_trgm_ops'})
    op.create_index(
        'ix_issues_repo_full_name_trgm', 'issues', ['repo_full_name'],
        postgresql_using='gin', postgresql_ops={'repo_full_name': 'gin_trgm_ops'},
    )
    # Replaces the case-sensitive index, which lowercased lookups couldn't use.
    op.drop_index('ix_issues_repo_issue_number', table_name='issues')
    op.create_index('ix_issues_lower_repo_issue_number', 'issues', [sa.text('lower(repo_full_name)'), 'issue_number'])
    op.create_index('ix_issues_created_at', 'issues', ['created_at'])
    op.create_index('ix_user_skills_user_id', 'user_skills', ['user_id'])
    op.create_index('ix_predictions_user_relevance', 'predictions', ['user_id', sa.text('relevance_score DESC NULLS LAST')])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_predictions_user_relevance', table_name='predictions')
    op.drop_index('ix_user_skills_user_id', table_name='user_skills')
    op.drop_index('ix_issues_created_at', table_name='issues')
    op.drop_index('ix_issues_lower_repo_issue_number', table_name='issues')
    op.create_index('ix_issues_repo_issue_number', 'issues', ['repo_full_name', 'issue_number'])
    op.drop_index('ix_issues_repo_full_name_trgm', table_name='issues')
    op.drop_index('ix_issues_title_trgm', table_name='issues')

    op.drop_column('user_skills', 'repo_count')
    op.drop_column('users', 'total_stars')
    op.drop_column('users', 'twitter_username')
    op.drop_column('users', 'website')
    op.drop_column('users', 'location')
    op.drop_column('predictions', 'predicted_at')
