from app.crud.base import CRUDBase
from app.models.report import Report
from app.schemas.report import ReportCreate
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

class CRUDReport(CRUDBase[Report, ReportCreate, ReportCreate]):
    async def get(self, db: AsyncSession, id: uuid.UUID) -> Optional[Report]:
        result = await db.execute(select(Report).filter(Report.report_id == id))
        return result.scalars().first()

report = CRUDReport(Report) 