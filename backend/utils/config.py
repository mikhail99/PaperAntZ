"""
Configuration management for AI Research Assistant Backend
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Application settings"""
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    
    # API settings
    api_prefix: str = "/api/v1"
    debug: bool = True
    
    # CORS settings
    cors_origins: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]
    
    # LLM settings
    use_mock_llm: bool = True
    mock_response_delay: float = 1.0  # seconds
    
    # Real LLM settings (for when use_mock_llm = False)
    llm_provider: str = "openai"  # openai, anthropic, google, etc.
    llm_model: str = "gpt-4"
    llm_api_key: Optional[str] = None
    llm_temperature: float = 0.7
    llm_max_tokens: int = 2000
    llm_timeout: float = 30.0  # seconds
    llm_max_retries: int = 3
    
    # File upload settings
    upload_dir: str = "uploads"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_extensions: set = {".pdf", ".doc", ".docx", ".txt"}
    
    # Database settings (for future use)
    database_url: str = "sqlite:///./research_assistant.db"
    
    # Security settings (disabled for prototype)
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Pydantic v2 settings config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow",  # allow unrelated env vars like NEXTAUTH_*
    )

# Global settings instance
settings = Settings()

# Create upload directory if it doesn't exist
os.makedirs(settings.upload_dir, exist_ok=True)