"""Add source to Room model

Revision ID: 455dcb0081f0
Revises: b90396c22524
Create Date: 2025-07-05 18:15:48.771720

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '455dcb0081f0'
down_revision: Union[str, Sequence[str], None] = 'b90396c22524'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

room_source_enum = sa.Enum('PLAYER_CREATED', 'QUICK_MATCH', name='roomsource')

def upgrade() -> None:
    """Upgrade schema."""
    room_source_enum.create(op.get_bind(), checkfirst=True)
    op.add_column('rooms', sa.Column('source', room_source_enum, nullable=False, server_default='PLAYER_CREATED'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('rooms', 'source')
    room_source_enum.drop(op.get_bind())
