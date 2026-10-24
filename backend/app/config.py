import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # BharatCode AI Configuration
    bharatcode_base_url: str = Field(
        default="https://bharatcode.ai/api/model/v1",
        description="Base URL for BharatCode model inference endpoint",
    )
    bharatcode_api_key: Optional[str] = Field(
        default=None,
        description="API Key for BharatCode inference platform",
    )
    bharatcode_model: str = Field(
        default="qwen-3.8-27b",
        description="Default AI model name",
    )

    # GitHub API Configuration
    github_token: Optional[str] = Field(
        default=None,
        description="GitHub personal access token for higher rate limits",
    )

    # Server & Persistence Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    environment: str = "development"
    database_url: str = "sqlite+aiosqlite:///./ossquest.db"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Execution Sandbox Settings
    sandbox_timeout_seconds: int = 60
    sandbox_max_memory_mb: int = 512
    enable_network_in_sandbox: bool = False

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
