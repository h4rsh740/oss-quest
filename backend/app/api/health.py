from fastapi import APIRouter
from backend.app.config import settings

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def health_check():
    return {
        "status": "healthy",
        "service": "OSS Quest + PHOENIX Recovery Engine",
        "version": "0.1.0",
        "bharatcode_model": settings.bharatcode_model,
        "bharatcode_configured": bool(settings.bharatcode_api_key and settings.bharatcode_api_key != "your_bharatcode_api_key_here"),
        "github_token_configured": bool(settings.github_token and settings.github_token != "your_github_personal_access_token_here"),
        "sandbox_timeout_seconds": settings.sandbox_timeout_seconds,
    }
