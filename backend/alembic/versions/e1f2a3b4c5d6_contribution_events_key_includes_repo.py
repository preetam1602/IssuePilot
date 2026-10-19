"""include repo in contribution_events unique key

Revision ID: e1f2a3b4c5d6
Revises: d7e8f9a0b1c2
Create Date: 2026-10-19 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1f2a3b4c5d6'
down_revision: Union[str, Sequence[str], None] = 'd7e8f9a0b1c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_constraint('uq_contribution_events_user_pr', 'contribution_events', type_='unique')
    op.create_unique_constraint(
        'uq_contribution_events_user_repo_pr',
        'contribution_events',
        ['github_user_id', 'repo_full_name', 'pr_number'],
    )


def downgrade() -> None:
    """Downgrade schema."""
    # The narrower key can't hold rows that differ only by repo; keep one of each.
    op.execute(
        """
        DELETE FROM contribution_events a
        USING contribution_events b
        WHERE a.github_user_id = b.github_user_id
          AND a.pr_number = b.pr_number
          AND a.id > b.id
        """
    )
    op.drop_constraint('uq_contribution_events_user_repo_pr', 'contribution_events', type_='unique')
    op.create_unique_constraint('uq_contribution_events_user_pr', 'contribution_events', ['github_user_id', 'pr_number'])
