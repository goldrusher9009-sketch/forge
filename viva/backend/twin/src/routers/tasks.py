from fastapi import APIRouter, Depends, Request, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime
from ..db import get_db
from ..services.task_agent import run_domain_task

router = APIRouter()

Domain = Literal["commerce", "dating", "food", "freelance", "finance", "health"]
TaskStatus = Literal["pending", "running", "awaiting_approval", "approved", "rejected", "completed", "failed"]
AutonomyLevel = Literal["suggest", "semi-auto", "full-auto"]


class TwinTask(BaseModel):
    id: str
    userId: str
    domain: Domain
    description: str
    status: TaskStatus
    earnedViva: float = 0.0
    result: Optional[dict] = None
    createdAt: datetime
    updatedAt: datetime


class TriggerRequest(BaseModel):
    domain: Domain
    context: Optional[dict] = None


@router.get("/tasks")
async def get_tasks(userId: str, db=Depends(get_db)):
    """All tasks for user (pending + history)."""
    rows = await db.fetch(
        "SELECT * FROM twin_tasks WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50",
        userId
    )
    return [dict(r) for r in rows]


@router.post("/tasks/trigger")
async def trigger_task(
    req: TriggerRequest,
    request: Request,
    background: BackgroundTasks,
    db=Depends(get_db)
):
    """Manually trigger twin to run a domain task."""
    userId = request.headers.get("X-User-Id")
    task_id = await db.fetchval(
        """INSERT INTO twin_tasks(user_id, domain, description, status, created_at, updated_at)
           VALUES($1,$2,$3,'pending',NOW(),NOW()) RETURNING id""",
        userId, req.domain, f"Auto-task: {req.domain}"
    )
    task_agent = request.app.state.task_agent
    background.add_task(run_domain_task, task_agent, task_id, userId, req.domain, req.context or {}, db)
    return {"taskId": task_id, "status": "pending"}


@router.post("/tasks/{taskId}/approve")
async def approve_task(taskId: str, request: Request, db=Depends(get_db)):
    """User approves a twin task (semi-auto mode)."""
    userId = request.headers.get("X-User-Id")
    task = await db.fetchrow("SELECT * FROM twin_tasks WHERE id=$1 AND user_id=$2", taskId, userId)
    if not task:
        raise HTTPException(404, "Task not found")
    if task["status"] != "awaiting_approval":
        raise HTTPException(400, "Task not awaiting approval")

    await db.execute(
        "UPDATE twin_tasks SET status='approved', updated_at=NOW() WHERE id=$1", taskId
    )
    task_agent = request.app.state.task_agent
    # Execute approved task async
    return {"approved": True}


@router.post("/tasks/{taskId}/reject")
async def reject_task(taskId: str, request: Request, db=Depends(get_db)):
    userId = request.headers.get("X-User-Id")
    await db.execute(
        "UPDATE twin_tasks SET status='rejected', updated_at=NOW() WHERE id=$1 AND user_id=$2",
        taskId, userId
    )
    return {"rejected": True}


@router.get("/tasks/{taskId}")
async def get_task(taskId: str, request: Request, db=Depends(get_db)):
    userId = request.headers.get("X-User-Id")
    task = await db.fetchrow("SELECT * FROM twin_tasks WHERE id=$1 AND user_id=$2", taskId, userId)
    if not task:
        raise HTTPException(404, "Task not found")
    return dict(task)


@router.put("/autonomy")
async def set_autonomy(level: AutonomyLevel, request: Request, db=Depends(get_db)):
    """Set twin autonomy level per user."""
    userId = request.headers.get("X-User-Id")
    await db.execute(
        "UPDATE twin_profiles SET autonomy_level=$1 WHERE user_id=$2", level, userId
    )
    return {"level": level}
