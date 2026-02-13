import os
import json
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.config import settings

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)

class SessionHistory(BaseModel):
    session_id: str
    user_id: str
    messages: List[ChatMessage] = []
    mastered_concepts: List[str] = []
    weak_areas: List[str] = []
    topic_mastery: dict[str, float] = {}
    created_at: datetime = Field(default_factory=datetime.now)

def get_history_path(user_id: str):
    path = os.path.join(settings.USER_DATA_PATH, "history", user_id)
    os.makedirs(path, exist_ok=True)
    return path

def save_session_history(history: SessionHistory):
    path = os.path.join(get_history_path(history.user_id), f"{history.session_id}.json")
    with open(path, "w") as f:
        f.write(history.model_dump_json())

def get_all_sessions(user_id: str) -> List[SessionHistory]:
    path = get_history_path(user_id)
sessions = []
if os.path.exists(path):
    for filename in os.listdir(path):
        if filename.endswith(".json"):
            with open(os.path.join(path, filename), "r") as f:
                sessions.append(SessionHistory.model_validate_json(f.read()))
return sorted(sessions, key=lambda x: x.created_at, reverse=True)

def clear_history(user_id: str):
    path = get_history_path(user_id)

    if os.path.exists(path):
        shutil.rmtree(path)
