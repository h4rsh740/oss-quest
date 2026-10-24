import os
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Header, Body
from pydantic import BaseModel, Field
import httpx
from backend.app.config import settings

router = APIRouter(prefix="/config", tags=["Configuration"])


class ApiKeyVerificationRequest(BaseModel):
    api_key: str = Field(..., description="BharatCode API key starting with bc_live_")
    base_url: Optional[str] = Field(default="https://bharatcode.ai/api/model/v1")
    model: Optional[str] = Field(default="qwen-3.8-27b")


class ApiKeyVerificationResponse(BaseModel):
    authenticated: bool
    subscription_active: bool
    status_code: int
    models: List[str]
    message: str
    subscription_url: str = "https://bharatcode.ai/subscribe"
    student_url: str = "https://bharatcode.ai/account"


@router.post("/verify-key", response_model=ApiKeyVerificationResponse)
async def verify_bharatcode_key(req: ApiKeyVerificationRequest):
    key = req.api_key.strip()
    base_url = (req.base_url or settings.bharatcode_base_url).rstrip("/")
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

    models_found: List[str] = []
    authenticated = False
    subscription_active = False
    status_code = 0
    message = ""

    # 1. Test /models endpoint for auth
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(f"{base_url}/models", headers=headers)
            status_code = res.status_code
            if res.status_code == 200:
                authenticated = True
                data = res.json()
                for m in data.get("data", []):
                    if isinstance(m, dict) and "id" in m:
                        models_found.append(m["id"])
            elif res.status_code in [401, 403]:
                return ApiKeyVerificationResponse(
                    authenticated=False,
                    subscription_active=False,
                    status_code=res.status_code,
                    models=[],
                    message="Invalid API Key. Please verify the key copied from your BharatCode dashboard.",
                )
    except Exception as e:
        return ApiKeyVerificationResponse(
            authenticated=False,
            subscription_active=False,
            status_code=500,
            models=[],
            message=f"Network error connecting to BharatCode: {str(e)}",
        )

    # 2. Test test chat completion to verify active token quota
    try:
        payload = {
            "model": req.model or settings.bharatcode_model,
            "messages": [{"role": "user", "content": "ping"}],
            "max_tokens": 2,
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            chat_res = await client.post(f"{base_url}/chat/completions", headers=headers, json=payload)
            if chat_res.status_code == 200:
                subscription_active = True
                message = "API Key verified and active! Live generation with Qwen 3.8 27B is fully operational."
            elif chat_res.status_code == 402:
                subscription_active = False
                message = "API Key authenticated! However, an active subscription (Lite/Pro) or verified college student account is required for token generation."
            else:
                subscription_active = False
                message = f"Authenticated with status {chat_res.status_code}: {chat_res.text[:150]}"
    except Exception as e:
        message = f"Authentication succeeded, but chat check encountered error: {str(e)}"

    return ApiKeyVerificationResponse(
        authenticated=authenticated,
        subscription_active=subscription_active,
        status_code=status_code,
        models=models_found,
        message=message,
    )


@router.post("/set-runtime-key")
async def set_runtime_key(payload: Dict[str, str] = Body(...)):
    new_key = payload.get("api_key", "").strip()
    if new_key:
        settings.bharatcode_api_key = new_key
        return {"status": "success", "message": "Runtime API key updated successfully."}
    return {"status": "error", "message": "API key cannot be empty."}
