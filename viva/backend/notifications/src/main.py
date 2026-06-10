from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import asyncio
import uvicorn
from routers import push, inbox, preferences
from workers import fcm_worker, apns_worker
from db import init_db, get_db
from cache import get_redis

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Start background push workers
    asyncio.create_task(fcm_worker.run())
    asyncio.create_task(apns_worker.run())
    yield

app = FastAPI(title="VIVA Notifications Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(push.router, prefix="/v1/notifications")
app.include_router(inbox.router, prefix="/v1/notifications")
app.include_router(preferences.router, prefix="/v1/notifications")

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 3010)), reload=False, workers=2)
