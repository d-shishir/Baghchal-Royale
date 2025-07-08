"""empty message

Revision ID: 7fb102034ec1
Revises: 60d607a1b397, 728fefcbd092
Create Date: 2025-07-07 20:10:58.379540

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7fb102034ec1'
down_revision: Union[str, Sequence[str], None] = ('60d607a1b397', '728fefcbd092')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
