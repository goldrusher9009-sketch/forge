from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import uvicorn
from routers import score, factors, zkproof, leaderboard
from services.gnn import GraphNeuralNet
from db import get_db, init_db
from cache import get_redis

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Load pre-trained GNN model
    app.state.gnn = GraphNeuralNet.load(os.getenv("GNN_MODEL_PATH", "models/vscore_gnn.pt"))
    yield
    # cleanup on shutdown

app = FastAPI(title="VIVA V-Score Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(score.router, prefix="/v1/vscore")
app.include_router(factors.router, prefix="/v1/vscore")
app.include_router(zkproof.router, prefix="/v1/vscore")
app.include_router(leaderboard.router, prefix="/v1/vscore")

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 3005)), reload=False, workers=4)
