try:
    from langchain.memory import ConversationBufferWindowMemory
except ImportError:
    from langchain_classic.memory import ConversationBufferWindowMemory
from app.config import settings

def get_conversation_memory(user_id: str):
    # In a real production app, we would use a RedisChatMessageHistory or similar.
    # For now, we'll return a memory instance. 
    # Note: State management for multiple users needs to be handled in the service layer.
    return ConversationBufferWindowMemory(
        k=settings.MEMORY_LIMIT,
        memory_key="history",
        return_messages=True
    )
