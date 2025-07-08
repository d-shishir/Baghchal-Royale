"""Add level, xp, and achievements to User model

Revision ID: ff9eecae1025
Revises: 7fb102034ec1
Create Date: 2025-07-07 22:28:14.477036

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ff9eecae1025'
down_revision: Union[str, Sequence[str], None] = '7fb102034ec1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('level', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('xp', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('achievements', sa.JSON(), nullable=True))

    users_table = sa.table('users',
        sa.column('level', sa.Integer),
        sa.column('xp', sa.Integer),
        sa.column('achievements', sa.JSON)
    )

    op.execute(
        users_table.update().values(
            level=1,
            xp=0,
            achievements=op.inline_literal('[]')
        )
    )

    op.alter_column('users', 'level', nullable=False)
    op.alter_column('users', 'xp', nullable=False)
    op.alter_column('users', 'achievements', nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'achievements')
    op.drop_column('users', 'xp')
    op.drop_column('users', 'level')
