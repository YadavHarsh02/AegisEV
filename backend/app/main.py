from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database.mongodb import connect_to_mongo, close_mongo_connection
from app.api.endpoints import router as api_router
from app.detection.risk_scoring import risk_engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    await risk_engine.start()
    yield
    await risk_engine.stop()
    await close_mongo_connection()

app = FastAPI(
    title="AegisEV API",
    description="AI-Powered EV Battery Telemetry Security & Intrusion Detection Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to AegisEV API"}

app.include_router(api_router)
