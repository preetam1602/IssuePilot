"""add url and llm_* fields to issues

Revision ID: d7e8f9a0b1c2
Revises: c5d1e2f3a4b5
Create Date: 2026-10-13 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd7e8f9a0b1c2'
down_revision: Union[str, Sequence[str], None] = 'c5d1e2f3a4b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('issues', sa.Column('url', sa.String(), nullable=True))
    op.add_column('issues', sa.Column('llm_difficulty', sa.String(), nullable=True))
    op.add_column('issues', sa.Column('llm_required_skills', sa.ARRAY(sa.String()), nullable=True))
    op.add_column('issues', sa.Column('llm_category', sa.String(), nullable=True))
    op.add_column('issues', sa.Column('llm_potential_blockers', sa.ARRAY(sa.String()), nullable=True))
    # Issues pushed from n8n don't carry GitHub's global issue id.
    op.alter_column('issues', 'github_issue_id', existing_type=sa.BigInteger(), nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('issues', 'github_issue_id', existing_type=sa.BigInteger(), nullable=False)
    op.drop_column('issues', 'llm_potential_blockers')
    op.drop_column('issues', 'llm_category')
    op.drop_column('issues', 'llm_required_skills')
    op.drop_column('issues', 'llm_difficulty')
    op.drop_column('issues', 'url')
