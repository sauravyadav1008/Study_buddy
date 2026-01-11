from langchain_ollama import ChatOllama
from app.config import settings
from functools import lru_cache

@lru_cache()
def get_ollama_llm(temperature: float = 0.7, max_tokens: int = 2048):
    return ChatOllama(
        model=settings.MODEL_NAME,
        base_url=settings.OLLAMA_BASE_URL,
        temperature=temperature,
        num_predict=max_tokens,
        num_ctx=2048,  # Reduced context window for speed
        repeat_penalty=1.1,
        top_k=40,      # More standard sampling
        top_p=0.9,     # More standard sampling
        keep_alive="5m", # Keep model in memory for 5 minutes
        timeout=120,    # Increased timeout for slower local models
    )
