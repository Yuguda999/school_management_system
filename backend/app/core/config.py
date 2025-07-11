from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    app_name: str = "School Management System"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "production"
    
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
    
    # Email (SendGrid)
    sendgrid_api_key: Optional[str] = None
    from_email: str = "noreply@school.com"
    
    # SMS (Twilio)
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    
    # File Upload
    max_file_size: int = 10485760  # 10MB
    upload_dir: str = "uploads/"
    allowed_extensions: str = "pdf,doc,docx,jpg,jpeg,png,gif"

    # CORS
    allowed_origins: str = "http://localhost:3000,http://localhost:3001,http://localhost:8080"
    
    # Pagination
    default_page_size: int = 20
    max_page_size: int = 100
    
    def get_allowed_origins_list(self) -> List[str]:
        """Get allowed origins as a list"""
        return [i.strip() for i in self.allowed_origins.split(",")]

    def get_allowed_extensions_list(self) -> List[str]:
        """Get allowed extensions as a list"""
        return [i.strip() for i in self.allowed_extensions.split(",")]

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
