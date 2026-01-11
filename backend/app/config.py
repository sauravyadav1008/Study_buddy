import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    MODEL_NAME: str = os.getenv("MODEL_NAME", "llama3.2:1b")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    CHROMA_PATH: str = os.getenv("CHROMA_PATH", "./data/chroma")
    USER_DATA_PATH: str = os.getenv("USER_DATA_PATH", "./data/users")
    MEMORY_LIMIT: int = int(os.getenv("MEMORY_LIMIT", 10))
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")

    class Config:
        env_file = ".env"

settings = Settings()
