import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.database.database import Base, engine
import app.models  # Load all models for metadata creation

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create all tables on startup if they don't exist
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="Aether AI - Next-Generation Conversational AI Platform with RAG and Multi-Provider LLM Integration",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

app.mount("/generated-images", StaticFiles(directory=settings.GENERATED_IMAGE_DIR), name="generated-images")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.auth import router as auth_router
from app.api.conversations import router as conversations_router
from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.api.images import router as images_router

app.include_router(auth_router)
app.include_router(conversations_router)
app.include_router(chat_router)
app.include_router(documents_router)
app.include_router(images_router)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": "1.0.0",
        "llm_provider": settings.LLM_PROVIDER,
        "ollama_model": settings.OLLAMA_MODEL,
        "openai_model": settings.OPENAI_MODEL if settings.OPENAI_API_KEY else "Not configured",
    }
