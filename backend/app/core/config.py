from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os


class Settings(BaseSettings):
    # Application
    app_name: str = "School Management System"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "production"
    log_level: str = "WARNING"
    
    model_config = SettingsConfigDict(
        env_prefix="SMS_",  # Use SMS_ prefix to avoid conflicts with system env vars
        case_sensitive=False,
        # Ignore the system DEBUG environment variable
        env_file_encoding='utf-8'
    )
    
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

    # Teacher Materials Configuration
    material_upload_dir: str = "uploads/materials/"
    max_material_size: int = 52428800  # 50MB
    allowed_material_types: str = "pdf,doc,docx,ppt,pptx,xls,xlsx,jpg,jpeg,png,gif,webp,mp4,mp3,wav,zip,txt,csv"
    max_materials_per_teacher: int = 1000
    teacher_storage_quota_mb: int = 5000  # 5GB per teacher
    enable_material_preview: bool = True
    enable_material_versioning: bool = True
    material_retention_days: int = 365  # Keep deleted materials for 1 year

    # CORS
    allowed_origins: str = "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:8080"

    # Pagination
    default_page_size: int = 20
    max_page_size: int = 100

    # AI/Gemini Configuration
    gemini_api_key: Optional[str] = None

    def get_allowed_origins_list(self) -> List[str]:
        """Get allowed origins as a list"""
        return [i.strip() for i in self.allowed_origins.split(",")]

    def get_allowed_extensions_list(self) -> List[str]:
        """Get allowed extensions as a list"""
        return [i.strip() for i in self.allowed_extensions.split(",")]

    def get_allowed_material_types_list(self) -> List[str]:
        """Get allowed material types as a list"""
        return [i.strip() for i in self.allowed_material_types.split(",")]

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra='allow'
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
