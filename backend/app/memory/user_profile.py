import os
import json
from pydantic import BaseModel
from typing import List, Optional, Dict
from app.config import settings
from datetime import datetime

class TopicState(BaseModel):
    topic_id: str
    name: str
    mastery: float = 0.0000
    attempted: int = 0
    correct: float = 0 # Can be float because of partial scores (+0.5)
    status: str = "unassessed"
    last_assessed: Optional[datetime] = None

class UserProfile(BaseModel):
    user_id: str
    knowledge_level: str = "Beginner"
    known_concepts: List[str] = []
    weak_areas: List[str] = []
    explanation_preference: str = "Analogy-based"
    confidence_score: float = 0.5
    mastery: float = 0.0
    topic_mastery: Dict[str, float] = {} # Keep for backward compatibility if needed, but we'll use topics
    topics: Dict[str, TopicState] = {} # topic_name -> TopicState
    current_session_id: Optional[str] = None

def get_user_profile_path(user_id: str):
    os.makedirs(settings.USER_DATA_PATH, exist_ok=True)
    return os.path.join(settings.USER_DATA_PATH, f"{user_id}_profile.json")

def load_user_profile(user_id: str) -> UserProfile:
    path = get_user_profile_path(user_id)
    if os.path.exists(path):
        with open(path, "r") as f:
            return UserProfile(**json.load(f))
    return UserProfile(user_id=user_id)

def save_user_profile(profile: UserProfile):
    path = get_user_profile_path(profile.user_id)
    with open(path, "w") as f:
        json.dump(profile.model_dump(mode='json'), f, indent=4)
