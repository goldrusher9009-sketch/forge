from fastapi import FastAPI, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import uvicorn
from routers import status, tasks, domains, learning
from services.meta_agent import MetaAgent
from services.task_agent import TaskAgent
from db import init_db, get_db
from cache import get_redis

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Load HyperAgent model
    app.state.meta_agent = MetaAgent(
        model_path=os.getenv("META_AGENT_MODEL", "models/meta_agent_v2.pt"),
        openai_key=os.getenv("OPENAI_API_KEY"),
    )
    app.state.task_agent = TaskAgent(app.state.meta_agent)
    yield

app = FastAPI(title="VIVA AI Twin Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(status.router, prefix="/v1/twin")
app.include_router(tasks.router, prefix="/v1/twin")
app.include_router(domains.router, prefix="/v1/twin")
app.include_router(learning.router, prefix="/v1/twin")

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 3006)), reload=False, workers=2)
