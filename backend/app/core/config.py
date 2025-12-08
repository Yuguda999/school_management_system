from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv(override=True)


class Settings(BaseSettings):
    # Application
    app_name: str = "School Management System"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "production"
    log_level: str = "INFO"
    
    # model_config removed from here, defined at bottom

    
    def __init__(self, **kwargs):
        # Remove the system DEBUG environment variable to prevent conflicts
        if 'DEBUG' in os.environ and os.environ['DEBUG'] == 'WARN':
            del os.environ['DEBUG']
        super().__init__(**kwargs)
    
    # Database
    database_url: str = "sqlite+aiosqlite:///./school_management.db"
    database_url_sync: str = "sqlite:///./school_management.db"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # JWT
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # Email Configuration
    # SMTP Settings
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_tls: bool = True
    smtp_ssl: bool = False
    emails_from_email: str = "noreply@school.com"

    # SendGrid (alternative)
    sendgrid_api_key: Optional[str] = None
    
    # SMS (Twilio)
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    
    # File Upload
    max_file_size: int = 10485760  # 10MB
    upload_dir: str = "uploads/"
    allowed_extensions: str = "pdf,doc,docx,jpg,jpeg,png,gif"



    # CORS
    allowed_origins: str = "*"
    
    # Trusted Hosts
    allowed_hosts: str = "*"

    # Pagination
    default_page_size: int = 20
    max_page_size: int = 100

    # AI Configuration
    ai_provider: str = "asi"  # Options: "gemini", "openrouter", "asi"
    gemini_api_key: Optional[str] = None
    openrouter_api_key: Optional[str] = None
    openrouter_model: str = "openrouter/auto"  # Default to auto model selection
    
    # ASI Cloud
    asi_api_key: Optional[str] = None
    asi_model: str = "openai/gpt-oss-20b"  # Default model

    def get_allowed_origins_list(self) -> List[str]:
        """Get allowed origins as a list"""
        return [i.strip() for i in self.allowed_origins.split(",")]

    def get_allowed_hosts_list(self) -> List[str]:
        """Get allowed hosts as a list"""
        return [i.strip() for i in self.allowed_hosts.split(",")]

    def get_allowed_extensions_list(self) -> List[str]:
        """Get allowed extensions as a list"""
        return [i.strip() for i in self.allowed_extensions.split(",")]

    @model_validator(mode='after')
    def compute_database_urls(self) -> 'Settings':
        """
        Ensure correct async and sync database URLs are generated.
        1. Convert standard postgresql:// to postgresql+asyncpg:// for the async engine.
        2. Derive postgresql:// sync URL for Alembic migrations.
        """
        if self.database_url:
            # Handle Supabase/Standard Postgres URLs for Async Engine
            if self.database_url.startswith("postgresql://"):
                # Force asyncpg driver for the main async database_url
                self.database_url = self.database_url.replace("postgresql://", "postgresql+asyncpg://")
            
            # Derive Sync URL for Alembic/Migrations
            if self.database_url.startswith("postgresql+asyncpg://"):
                if not self.database_url_sync or self.database_url_sync.startswith("sqlite"):
                    self.database_url_sync = self.database_url.replace("postgresql+asyncpg://", "postgresql://")
                    
        return self


    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="",  # No prefix for now since .env vars are mixed
        case_sensitive=False,
        extra='allow',
        env_file_encoding='utf-8'
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
