from typing import Optional
from app.core.config import settings
from app.llm.base import BaseLLMProvider
from app.llm.ollama import OllamaProvider
from app.llm.openai import OpenAIProvider

def get_llm_provider(provider_name: Optional[str] = None) -> BaseLLMProvider:
    name = (provider_name or settings.LLM_PROVIDER).lower().strip()
    if name == "openai":
        return OpenAIProvider()
    elif name == "ollama":
        return OllamaProvider()
    else:
        # Default fallback to Ollama
        return OllamaProvider()
