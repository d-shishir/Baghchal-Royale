from app.crud.base import CRUDBase
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

class CRUDFeedback(CRUDBase[Feedback, FeedbackCreate, FeedbackCreate]):
    async def get(self, db: AsyncSession, id: uuid.UUID) -> Optional[Feedback]:
        result = await db.execute(select(Feedback).filter(Feedback.feedback_id == id))
        return result.scalars().first()

feedback = CRUDFeedback(Feedback) 