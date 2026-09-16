from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Dict, Optional

class BaseLLMProvider(ABC):
    """
    Abstract base class for all LLM providers in Aether AI.
    Ensures seamless plug-and-play interchangeability between local models
    (Ollama) and cloud APIs (OpenAI, Anthropic, etc.).
    """

    @abstractmethod
    async def generate(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7
    ) -> str:
        """Generate a complete completion non-streamed."""
        pass

    @abstractmethod
    async def stream(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        """Stream completion tokens as they are generated."""
        pass
