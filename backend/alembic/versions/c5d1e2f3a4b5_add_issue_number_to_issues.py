"""add issue_number to issues

Revision ID: c5d1e2f3a4b5
Revises: 47493ccbe142
Create Date: 2026-10-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5d1e2f3a4b5'
down_revision: Union[str, Sequence[str], None] = '47493ccbe142'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('issues', sa.Column('issue_number', sa.Integer(), nullable=True))
    op.create_index('ix_issues_repo_issue_number', 'issues', ['repo_full_name', 'issue_number'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_issues_repo_issue_number', table_name='issues')
    op.drop_column('issues', 'issue_number')
