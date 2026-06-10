from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..db import get_db
from ..cache import get_redis
from ..services.gnn import compute_vscore
from ..services.zkproof import generate_zk_proof

router = APIRouter()


class ScoreResponse(BaseModel):
    userId: str
    score: float          # 0-1000
    tier: str             # seed/rising/stable/guardian/sovereign
    rings: dict           # 5-ring breakdown
    lastUpdated: str
    zkProofHash: Optional[str] = None


class RingsResponse(BaseModel):
    social: float
    wealth: float
    activity: float
    sleep: float
    nutrition: float


@router.get("/score/{userId}", response_model=ScoreResponse)
async def get_score(userId: str, request: Request, redis=Depends(get_redis), db=Depends(get_db)):
    """Get full V-Score for user. Cached 60s."""
    cache_key = f"vscore:{userId}"
    cached = await redis.get(cache_key)
    if cached:
        return ScoreResponse.parse_raw(cached)

    # Compute via GNN
    gnn = request.app.state.gnn
    score_data = await compute_vscore(gnn, userId, db)

    tier = _tier_from_score(score_data["score"])
    result = ScoreResponse(
        userId=userId,
        score=score_data["score"],
        tier=tier,
        rings=score_data["rings"],
        lastUpdated=score_data["updated_at"],
    )

    await redis.setex(cache_key, 60, result.json())
    return result


@router.get("/score/{userId}/rings", response_model=RingsResponse)
async def get_rings(userId: str, db=Depends(get_db)):
    """5-ring breakdown for HomeCanvas."""
    rings = await db.fetchrow(
        "SELECT social, wealth, activity, sleep, nutrition FROM vscore_rings WHERE user_id=$1", userId
    )
    if not rings:
        raise HTTPException(404, "Score not found")
    return RingsResponse(**dict(rings))


@router.post("/score/{userId}/event")
async def push_score_event(userId: str, event: dict, request: Request, db=Depends(get_db)):
    """Push a score event (action completed). Triggers async recompute."""
    await db.execute(
        "INSERT INTO score_events(user_id, event_type, metadata, created_at) VALUES($1,$2,$3,NOW())",
        userId, event["type"], event.get("metadata", {})
    )
    # Async recompute — invalidate cache
    redis = request.app.state.redis
    await redis.delete(f"vscore:{userId}")
    return {"accepted": True}


@router.get("/score/{userId}/public")
async def get_public_score(userId: str, db=Depends(get_db)):
    """Public-safe score (no raw rings). Used on profiles."""
    row = await db.fetchrow("SELECT score, tier FROM vscore WHERE user_id=$1", userId)
    if not row:
        raise HTTPException(404, "User not found")
    return {"score": row["score"], "tier": row["tier"]}


def _tier_from_score(score: float) -> str:
    if score < 200: return "seed"
    if score < 400: return "rising"
    if score < 650: return "stable"
    if score < 850: return "guardian"
    return "sovereign"
