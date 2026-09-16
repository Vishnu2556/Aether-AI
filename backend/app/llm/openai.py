import json
import logging
import base64
from pathlib import Path
from uuid import uuid4
from typing import AsyncGenerator, List, Dict, Optional
import httpx
from app.llm.base import BaseLLMProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

class OpenAIProvider(BaseLLMProvider):
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: str = "https://api.openai.com/v1"
    ):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.OPENAI_MODEL or "gpt-4o-mini"
        self.base_url = base_url.rstrip("/")

    async def generate_image(self, prompt: str) -> str:
        if not self.api_key:
            raise ValueError("Image generation requires OPENAI_API_KEY in backend/.env.")

        url = f"{self.base_url}/images/generations"
        payload = {
            "model": settings.OPENAI_IMAGE_MODEL,
            "prompt": prompt,
            "size": "1024x1024",
            "quality": "auto",
            "output_format": "png",
        }
        headers = {"Authorization": f"Bearer {self.api_key}"}

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            image_bytes = base64.b64decode(response.json()["data"][0]["b64_json"])

        filename = f"{uuid4().hex}.png"
        output_path = Path(settings.GENERATED_IMAGE_DIR) / filename
        output_path.write_bytes(image_bytes)
        return f"/generated-images/{filename}"

    def _prepare_messages(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None
    ) -> List[Dict[str, str]]:
        prepared = []
        if system_prompt:
            prepared.append({"role": "system", "content": system_prompt})
        for m in messages:
            prepared.append({"role": m["role"], "content": m["content"]})
        return prepared

    async def generate(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7
    ) -> str:
        if not self.api_key:
            return "⚠️ OpenAI API key is missing. Please set `OPENAI_API_KEY` in `backend/.env`."

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": self._prepare_messages(messages, system_prompt),
            "temperature": temperature,
            "stream": False
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            return f"⚠️ OpenAI API Error: {e.response.status_code} - {e.response.text}"
        except Exception as e:
            return f"⚠️ Failed to connect to OpenAI: {str(e)}"

    async def stream(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        if not self.api_key:
            yield "⚠️ **OpenAI API key is missing.** Please set `OPENAI_API_KEY` in your `backend/.env` file or switch `LLM_PROVIDER=ollama`."
            return

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": self._prepare_messages(messages, system_prompt),
            "temperature": temperature,
            "stream": True
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    if response.status_code != 200:
                        err_body = await response.aread()
                        yield f"⚠️ OpenAI error {response.status_code}: {err_body.decode(errors='ignore')}"
                        return

                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        if line.startswith("data: "):
                            raw = line[6:].strip()
                            if raw == "[DONE]":
                                break
                            try:
                                chunk = json.loads(raw)
                                delta = chunk["choices"][0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield content
                            except (json.JSONDecodeError, KeyError, IndexError):
                                continue
        except Exception as e:
            logger.error(f"OpenAI streaming error: {e}")
            yield f"\n\n⚠️ Error during streaming from OpenAI: {str(e)}"
