import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
from app.config import settings
from functools import lru_cache

@lru_cache()
def get_embeddings():
    return OllamaEmbeddings(
        model=settings.EMBEDDING_MODEL,
        base_url=settings.OLLAMA_BASE_URL
    )

_vectorstore = None

def get_chroma_client():
    global _vectorstore
    if _vectorstore is None:
        embeddings = get_embeddings()
        _vectorstore = Chroma(
            persist_directory=settings.CHROMA_PATH,
            embedding_function=embeddings,
            collection_name="study_materials"
        )
    return _vectorstore
