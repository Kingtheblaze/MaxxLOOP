import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_ENV: str = "development"
    PORT: int = 8000
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./maxxloop.db"
    
    # LLM Settings
    LLM_PROVIDER: str = "template"  # template | gemini | ollama | openai
    GEMINI_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # Demo & Engine Settings
    DEMO_MODE: bool = True
    TIMEWARP_SECONDS: int = 20
    STANDARD_WINDOW_MINUTES: int = 25
    
    # Drop Detection thresholds
    DROP_THRESHOLD_POINTS: float = 10.0
    RAPID_DROP_POINTS: float = 15.0
    MIN_COOLDOWN_MINUTES: int = 45
    MAX_INTERVENTIONS_PER_DAY: int = 3
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
