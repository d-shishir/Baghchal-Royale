from typing import Any, List
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.post("/", response_model=schemas.Report)
async def create_report(
    *,
    db: AsyncSession = Depends(deps.get_db),
    report_in: schemas.ReportCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new report.
    """
    if current_user.user_id != report_in.reporter_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    report = await crud.report.create(db, obj_in=report_in)
    return report

@router.get("/", response_model=List[schemas.Report])
async def get_reports(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Retrieve reports.
    """
    reports = await crud.report.get_multi(db, skip=skip, limit=limit)
    return reports

@router.get("/{report_id}", response_model=schemas.Report)
async def get_report(
    *,
    report_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Get report by ID.
    """
    report = await crud.report.get(db, id=report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.put("/{report_id}", response_model=schemas.Report)
async def update_report(
    *,
    db: AsyncSession = Depends(deps.get_db),
    report_id: uuid.UUID,
    report_in: schemas.ReportUpdate,
    current_user: models.User = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Update a report.
    """
    report = await crud.report.get(db, id=report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    updated_report = await crud.report.update(db, db_obj=report, obj_in=report_in)
    return updated_report 