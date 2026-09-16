import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "Aether AI"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./aether_ai.db"
    
    # JWT
    JWT_SECRET_KEY: str = "change_this_secret_key_aether_ai_2026_super_secure"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # LLM Settings
    LLM_PROVIDER: str = "ollama"  # ollama | openai
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_IMAGE_MODEL: str = "gpt-image-1"
    
    MAX_HISTORY_MESSAGES: int = 20
    
    # RAG Settings
    UPLOAD_DIR: str = str(BASE_DIR.parent / "data" / "uploads")
    VECTOR_STORE_DIR: str = str(BASE_DIR.parent / "data" / "vector_store")
    GENERATED_IMAGE_DIR: str = str(BASE_DIR.parent / "data" / "generated_images")
    MAX_UPLOAD_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.VECTOR_STORE_DIR, exist_ok=True)
os.makedirs(settings.GENERATED_IMAGE_DIR, exist_ok=True)
