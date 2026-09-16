from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.dependencies import get_current_user
from app.llm.openai import OpenAIProvider
from app.models.user import User

router = APIRouter(tags=["Images"])


class ImageRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)


@router.post("/api/images/generate")
async def generate_image(payload: ImageRequest, current_user: User = Depends(get_current_user)) -> Dict[str, str]:
    try:
        image_url = await OpenAIProvider().generate_image(payload.prompt.strip())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Image generation failed: {exc}") from exc

    return {"url": image_url, "prompt": payload.prompt.strip()}