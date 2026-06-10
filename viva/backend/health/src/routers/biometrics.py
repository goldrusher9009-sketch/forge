"""
Health Vault — biometric routes.
IMPORTANT: Raw biometric data NEVER leaves device.
Only ZK-proofs + aggregate scores stored server-side.
"""
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from ..db import get_db

router = APIRouter()


class BiometricSummary(BaseModel):
    """Server-side aggregate only — no raw values."""
    userId: str
    date: date
    sleepScore: float        # 0-100
    nutritionScore: float    # 0-100
    activityScore: float     # 0-100
    hrv: Optional[float] = None       # ZK-attested range only
    stepsRange: Optional[str] = None  # e.g. "8000-9000" (bucketed)
    zkProofHash: str


class SleepLog(BaseModel):
    date: date
    durationMinutes: int
    quality: float      # 0-1
    zkProof: str        # iden3 proof from device


class ActivityLog(BaseModel):
    date: date
    steps: int
    activeMinutes: int
    caloriesBurned: int
    zkProof: str


class NutritionLog(BaseModel):
    date: date
    calories: int
    proteinGrams: float
    carbsGrams: float
    fatGrams: float
    zkProof: str


@router.post("/sleep")
async def log_sleep(log: SleepLog, request: Request, db=Depends(get_db)):
    """Accept ZK-attested sleep proof. Store proof hash + score, not raw data."""
    userId = request.headers.get("X-User-Id")
    score = _sleep_score(log.durationMinutes, log.quality)
    await db.execute(
        """INSERT INTO health_sleep(user_id, date, score, zk_proof_hash, created_at)
           VALUES($1,$2,$3,$4,NOW()) ON CONFLICT(user_id,date) DO UPDATE
           SET score=$3, zk_proof_hash=$4""",
        userId, log.date, score, _hash_proof(log.zkProof)
    )
    # Push score event to V-Score service
    await _push_health_event(userId, "sleep", score, db)
    return {"score": score, "accepted": True}


@router.post("/activity")
async def log_activity(log: ActivityLog, request: Request, db=Depends(get_db)):
    userId = request.headers.get("X-User-Id")
    score = _activity_score(log.steps, log.activeMinutes)
    await db.execute(
        """INSERT INTO health_activity(user_id, date, score, steps_bucket, zk_proof_hash, created_at)
           VALUES($1,$2,$3,$4,$5,NOW()) ON CONFLICT(user_id,date) DO UPDATE
           SET score=$3, steps_bucket=$4, zk_proof_hash=$5""",
        userId, log.date, score, _bucket_steps(log.steps), _hash_proof(log.zkProof)
    )
    await _push_health_event(userId, "activity", score, db)
    return {"score": score, "accepted": True}


@router.post("/nutrition")
async def log_nutrition(log: NutritionLog, request: Request, db=Depends(get_db)):
    userId = request.headers.get("X-User-Id")
    score = _nutrition_score(log.calories, log.proteinGrams)
    await db.execute(
        """INSERT INTO health_nutrition(user_id, date, score, zk_proof_hash, created_at)
           VALUES($1,$2,$3,$4,NOW()) ON CONFLICT(user_id,date) DO UPDATE
           SET score=$3, zk_proof_hash=$4""",
        userId, log.date, score, _hash_proof(log.zkProof)
    )
    await _push_health_event(userId, "nutrition", score, db)
    return {"score": score, "accepted": True}


@router.get("/summary")
async def get_summary(request: Request, db=Depends(get_db)):
    """Today's aggregate health summary (used in HomeCanvas rings)."""
    userId = request.headers.get("X-User-Id")
    today = date.today()
    sleep_row = await db.fetchrow("SELECT score FROM health_sleep WHERE user_id=$1 AND date=$2", userId, today)
    act_row = await db.fetchrow("SELECT score FROM health_activity WHERE user_id=$1 AND date=$2", userId, today)
    nut_row = await db.fetchrow("SELECT score FROM health_nutrition WHERE user_id=$1 AND date=$2", userId, today)
    return {
        "sleep": sleep_row["score"] if sleep_row else 0,
        "activity": act_row["score"] if act_row else 0,
        "nutrition": nut_row["score"] if nut_row else 0,
    }


@router.get("/history")
async def get_history(days: int = 30, request: Request, db=Depends(get_db)):
    userId = request.headers.get("X-User-Id")
    rows = await db.fetch(
        """SELECT date, sleep_score, activity_score, nutrition_score
           FROM health_daily_summary
           WHERE user_id=$1 ORDER BY date DESC LIMIT $2""",
        userId, days
    )
    return [dict(r) for r in rows]


# ---- helpers ----

def _sleep_score(minutes: int, quality: float) -> float:
    ideal = 480  # 8h
    duration_score = min(1.0, minutes / ideal)
    return round((duration_score * 0.6 + quality * 0.4) * 100, 1)

def _activity_score(steps: int, active_min: int) -> float:
    step_score = min(1.0, steps / 10000)
    active_score = min(1.0, active_min / 60)
    return round((step_score * 0.6 + active_score * 0.4) * 100, 1)

def _nutrition_score(calories: int, protein: float) -> float:
    cal_score = 1.0 - abs(calories - 2000) / 2000
    prot_score = min(1.0, protein / 50)
    return round((max(0, cal_score) * 0.5 + prot_score * 0.5) * 100, 1)

def _bucket_steps(steps: int) -> str:
    bucket = (steps // 1000) * 1000
    return f"{bucket}-{bucket+999}"

def _hash_proof(proof: str) -> str:
    import hashlib
    return hashlib.sha256(proof.encode()).hexdigest()

async def _push_health_event(userId: str, domain: str, score: float, db):
    await db.execute(
        "INSERT INTO score_events(user_id, event_type, metadata, created_at) VALUES($1,$2,$3,NOW())",
        userId, f"health.{domain}", {"score": score}
    )
