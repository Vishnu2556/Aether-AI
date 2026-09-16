import logging
from typing import AsyncGenerator, List, Dict, Optional

from google import genai
from google.genai import types

from app.llm.base import BaseLLMProvider
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiProvider(BaseLLMProvider):
    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL

        if not self.api_key:
            self.client = None
        else:
            self.client = genai.Client(api_key=self.api_key)

    def _prepare_contents(
        self,
        messages: List[Dict[str, str]]
    ) -> List[types.Content]:
        contents = []

        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")

            # Gemini uses "user" and "model" roles.
            if role == "assistant":
                role = "model"

            if role == "system":
                continue

            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part(text=content)]
                )
            )

        return contents

    def _system_instruction(
        self,
        system_prompt: Optional[str]
    ):
        if not system_prompt:
            return None

        return types.Content(
            role="user",
            parts=[types.Part(text=system_prompt)]
        )

    async def generate(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7
    ) -> str:

        if not self.client:
            return (
                "⚠️ Gemini API key is missing. "
                "Please set GEMINI_API_KEY in your backend environment."
            )

        try:
            config_kwargs = {
                "temperature": temperature,
            }

            if system_prompt:
                config_kwargs["system_instruction"] = system_prompt

            config = types.GenerateContentConfig(
                **config_kwargs
            )

            response = self.client.models.generate_content(
                model=self.model,
                contents=self._prepare_contents(messages),
                config=config,
            )

            return response.text or ""

        except Exception as e:
            logger.exception("Gemini generation error")
            return f"⚠️ Gemini API Error: {str(e)}"

    async def stream(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:

        if not self.client:
            yield (
                "⚠️ **Gemini API key is missing.** "
                "Please set `GEMINI_API_KEY` in your backend environment."
            )
            return

        try:
            config_kwargs = {
                "temperature": temperature,
            }

            if system_prompt:
                config_kwargs["system_instruction"] = system_prompt

            config = types.GenerateContentConfig(
                **config_kwargs
            )

            response_stream = self.client.models.generate_content_stream(
                model=self.model,
                contents=self._prepare_contents(messages),
                config=config,
            )

            for chunk in response_stream:
                if chunk.text:
                    yield chunk.text

        except Exception as e:
            logger.exception("Gemini streaming error")
            yield f"\n\n⚠️ Gemini streaming error: {str(e)}"