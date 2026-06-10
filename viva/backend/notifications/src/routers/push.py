from fastapi import APIRouter, Depends, Request, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Literal
from ..db import get_db
from ..cache import get_redis

router = APIRouter()

Channel = Literal["fcm", "apns", "websocket"]


class PushPayload(BaseModel):
    userId: str
    title: str
    body: str
    data: Optional[dict] = None
    channel: Optional[Channel] = None    # None = auto-select
    priority: Literal["normal", "high"] = "normal"
    collapseKey: Optional[str] = None    # deduplicate same-type notifs


class DeviceToken(BaseModel):
    token: str
    platform: Literal["ios", "android"]
    userId: str


@router.post("/send")
async def send_notification(
    payload: PushPayload,
    background: BackgroundTasks,
    redis=Depends(get_redis),
    db=Depends(get_db)
):
    """Send push notification to user. Called by other microservices."""
    # Look up device tokens
    tokens = await db.fetch(
        "SELECT token, platform FROM device_tokens WHERE user_id=$1 AND active=TRUE",
        payload.userId
    )
    if not tokens:
        return {"sent": 0, "reason": "no_tokens"}

    # Queue in Redis for workers
    import json
    for t in tokens:
        queue_key = f"push:{'fcm' if t['platform']=='android' else 'apns'}"
        job = {
            "token": t["token"],
            "title": payload.title,
            "body": payload.body,
            "data": payload.data or {},
            "priority": payload.priority,
            "collapseKey": payload.collapseKey,
        }
        await redis.rpush(queue_key, json.dumps(job))

    # Log notification
    await db.execute(
        "INSERT INTO notification_log(user_id, title, body, sent_at) VALUES($1,$2,$3,NOW())",
        payload.userId, payload.title, payload.body
    )
    return {"sent": len(tokens)}


@router.post("/device-token")
async def register_token(token: DeviceToken, request: Request, db=Depends(get_db)):
    """Register or refresh device push token."""
    userId = request.headers.get("X-User-Id")
    await db.execute(
        """INSERT INTO device_tokens(user_id, token, platform, active, updated_at)
           VALUES($1,$2,$3,TRUE,NOW())
           ON CONFLICT(token) DO UPDATE SET user_id=$1, active=TRUE, updated_at=NOW()""",
        userId, token.token, token.platform
    )
    return {"registered": True}


@router.delete("/device-token/{token}")
async def unregister_token(token: str, request: Request, db=Depends(get_db)):
    userId = request.headers.get("X-User-Id")
    await db.execute(
        "UPDATE device_tokens SET active=FALSE WHERE token=$1 AND user_id=$2", token, userId
    )
    return {"unregistered": True}


# ---- Broadcast helpers (called internally) ----

async def notify_match(userId: str, matchName: str, redis):
    """Async match notification helper."""
    import json
    job = {
        "userId": userId,
        "title": "New Match! 💫",
        "body": f"You matched with {matchName}",
        "data": {"type": "dating_match"},
        "priority": "high",
    }
    await redis.rpush("push:broadcast", json.dumps(job))


async def notify_earn(userId: str, amount: float, source: str, redis):
    job = {
        "userId": userId,
        "title": f"+{amount:.2f} $VIVA earned",
        "body": f"From: {source}",
        "data": {"type": "earn", "amount": amount, "source": source},
        "priority": "normal",
        "collapseKey": "earn",
    }
    await redis.rpush("push:broadcast", json.dumps(job))
