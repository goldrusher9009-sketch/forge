from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import uvicorn
from routers import biometrics, insights, zk_vault
from db import init_db, get_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="VIVA Health Vault Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(biometrics.router, prefix="/v1/health")
app.include_router(insights.router, prefix="/v1/health")
app.include_router(zk_vault.router, prefix="/v1/health")

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 3007)), reload=False, workers=4)
