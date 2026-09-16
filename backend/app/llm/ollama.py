import json
import logging
from typing import AsyncGenerator, List, Dict, Optional
import httpx
from app.llm.base import BaseLLMProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

class OllamaProvider(BaseLLMProvider):
    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_MODEL or "llama3.2"

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
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": self.model,
            "messages": self._prepare_messages(messages, system_prompt),
            "stream": False,
            "options": {"temperature": temperature}
        }
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(url, json=payload)
                if response.status_code == 404:
                    return f"⚠️ Model '{self.model}' not found in local Ollama. Run `ollama pull {self.model}`."
                response.raise_for_status()
                data = response.json()
                return data.get("message", {}).get("content", "")
        except httpx.ConnectError:
            return (
                f"⚠️ **Ollama is not running at `{self.base_url}`.**\n\n"
                f"To start Ollama locally:\n"
                f"1. Open terminal and run `ollama serve`\n"
                f"2. Pull the model: `ollama pull {self.model}`\n"
                f"3. Or switch `LLM_PROVIDER=openai` in `backend/.env` with your API key."
            )
        except Exception as e:
            logger.error(f"Error in Ollama generate: {e}")
            return f"⚠️ Error communicating with Ollama: {str(e)}"

    async def stream(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": self.model,
            "messages": self._prepare_messages(messages, system_prompt),
            "stream": True,
            "options": {"temperature": temperature}
        }
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream("POST", url, json=payload) as response:
                    if response.status_code == 404:
                        yield f"⚠️ **Model '{self.model}' not found in local Ollama.**\n\nPlease run `ollama pull {self.model}` in your terminal."
                        return
                    if response.status_code != 200:
                        yield f"⚠️ Ollama returned HTTP error {response.status_code}."
                        return

                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        try:
                            chunk = json.loads(line)
                            content = chunk.get("message", {}).get("content", "")
                            if content:
                                yield content
                            if chunk.get("done", False):
                                break
                        except json.JSONDecodeError:
                            continue
        except (httpx.ConnectError, httpx.ConnectTimeout):
            yield (
                f"⚠️ **Ollama is not currently running or reachable at `{self.base_url}`.**\n\n"
                f"To run Aether AI locally with free open-source models:\n\n"
                f"1. Download Ollama from [ollama.com](https://ollama.com)\n"
                f"2. Run in terminal: `ollama serve`\n"
                f"3. In another terminal, download the model: `ollama pull {self.model}`\n\n"
                f"💡 *Alternatively, configure `OPENAI_API_KEY` in `backend/.env` to use OpenAI.*"
            )
        except Exception as e:
            logger.error(f"Ollama streaming exception: {e}")
            yield f"\n\n⚠️ Error during streaming from Ollama: {str(e)}"
