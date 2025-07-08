"""Add game_state to Game model

Revision ID: 60d607a1b397
Revises: 728fefcbd092
Create Date: 2025-07-07 20:10:00.768003

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy import String, JSON


# revision identifiers, used by Alembic.
revision: str = '60d607a1b397'
down_revision: Union[str, Sequence[str], None] = 'f1ba398e8df8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add the column as nullable first
    op.add_column('games', sa.Column('game_state', sa.JSON(), nullable=True))

    # Create a table object for the update operation
    games_table = table('games',
        column('game_state', JSON)
    )

    # Update existing rows with a default value
    op.execute(
        games_table.update().values(game_state=op.inline_literal('{}'))
    )

    # Alter the column to be non-nullable
    op.alter_column('games', 'game_state', nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('games', 'game_state')
