from typing import Any, Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api import deps
from app import models, schemas
from app.models.game import GameStatus


router = APIRouter()


@router.get("/stats")
async def get_admin_stats(
    db: AsyncSession = Depends(deps.get_db),
    current_admin: models.User = Depends(deps.get_current_active_superuser),
) -> Dict[str, Any]:
    """
    Return aggregate statistics for the admin dashboard.
    Requires ADMIN role.
    """

    # Total users
    total_users = (await db.execute(select(func.count(models.User.user_id)))).scalar_one()

    # Total games and breakdown by status
    total_games = (await db.execute(select(func.count(models.Game.game_id)))).scalar_one()
    games_by_status_rows = (
        await db.execute(
            select(models.Game.status, func.count(models.Game.game_id)).group_by(models.Game.status)
        )
    ).all()
    games_by_status = {status.value if hasattr(status, "value") else str(status): count for status, count in games_by_status_rows}

    # Total reports and breakdown by status
    total_reports = (await db.execute(select(func.count(models.Report.report_id)))).scalar_one()
    reports_by_status_rows = (
        await db.execute(
            select(models.Report.status, func.count(models.Report.report_id)).group_by(models.Report.status)
        )
    ).all()
    reports_by_status = {status.value if hasattr(status, "value") else str(status): count for status, count in reports_by_status_rows}

    # Total feedback
    total_feedback = (await db.execute(select(func.count(models.Feedback.feedback_id)))).scalar_one()

    return {
        "total_users": total_users,
        "total_games": total_games,
        "games_by_status": games_by_status,
        "total_reports": total_reports,
        "reports_by_status": reports_by_status,
        "total_feedback": total_feedback,
    }



@router.get("/games", response_model=List[schemas.Game])
async def get_all_games(
    db: AsyncSession = Depends(deps.get_db),
    current_admin: models.User = Depends(deps.get_current_active_superuser),
    status: GameStatus | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Return recent games across the platform. Admin only.
    Optional filter by status.
    """
    query = (
        select(models.Game)
        .order_by(desc(models.Game.created_at))
        .options(
            selectinload(models.Game.player_goat),
            selectinload(models.Game.player_tiger),
            selectinload(models.Game.winner),
        )
    )
    if status is not None:
        query = query.where(models.Game.status == status)

    result = await db.execute(query.offset(skip).limit(limit))
    games = result.scalars().all()
    return games


@router.get("/activity")
async def get_recent_activity(
    db: AsyncSession = Depends(deps.get_db),
    current_admin: models.User = Depends(deps.get_current_active_superuser),
    limit: int = 20,
) -> Dict[str, Any]:
    """
    Return a combined recent activity feed for the dashboard. Admin only.
    """
    # Recent users
    users_rows = (
        await db.execute(select(models.User).order_by(desc(models.User.created_at)).limit(10))
    ).scalars().all()

    # Recent games started
    games_started_rows = (
        await db.execute(select(models.Game).order_by(desc(models.Game.created_at)).limit(10))
    ).scalars().all()

    # Recent games completed
    games_completed_rows = (
        await db.execute(
            select(models.Game)
            .where(models.Game.ended_at.is_not(None))
            .order_by(desc(models.Game.ended_at))
            .limit(10)
        )
    ).scalars().all()

    # Recent reports
    reports_rows = (
        await db.execute(select(models.Report).order_by(desc(models.Report.created_at)).limit(10))
    ).scalars().all()

    activities: List[Dict[str, Any]] = []

    for u in users_rows:
        activities.append({
            "type": "user",
            "text": f"New user {u.username} joined",
            "created_at": u.created_at,
            "id": str(u.user_id),
            "icon": "fas fa-user-plus",
        })

    for g in games_started_rows:
        activities.append({
            "type": "game",
            "text": "Game started",
            "created_at": g.created_at,
            "id": str(g.game_id),
            "status": g.status.value if hasattr(g.status, "value") else str(g.status),
            "icon": "fas fa-gamepad",
        })

    for g in games_completed_rows:
        activities.append({
            "type": "game",
            "text": "Game completed",
            "created_at": g.ended_at or g.created_at,
            "id": str(g.game_id),
            "status": g.status.value if hasattr(g.status, "value") else str(g.status),
            "icon": "fas fa-flag-checkered",
        })

    for r in reports_rows:
        activities.append({
            "type": "report",
            "text": "New report submitted",
            "created_at": r.created_at,
            "id": str(r.report_id),
            "status": r.status.value if hasattr(r.status, "value") else str(r.status),
            "icon": "fas fa-flag",
        })

    # Sort by time and trim
    activities.sort(key=lambda a: a.get("created_at") or 0, reverse=True)
    activities = activities[:limit]

    # Serialize datetimes to ISO strings
    for a in activities:
        if a.get("created_at") is not None:
            a["created_at"] = a["created_at"].isoformat()

    return {"items": activities}

