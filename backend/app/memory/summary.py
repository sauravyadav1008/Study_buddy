import os
import json
from app.config import settings

def get_user_summary_path(user_id: str):
    os.makedirs(settings.USER_DATA_PATH, exist_ok=True)
    return os.path.join(settings.USER_DATA_PATH, f"{user_id}_summary.txt")

def load_user_summary(user_id: str) -> str:
    path = get_user_summary_path(user_id)
    if os.path.exists(path):
        with open(path, "r") as f:
            return f.read()
    return "No previous learning summary available."

def save_user_summary(user_id: str, summary: str):
    path = get_user_summary_path(user_id)
    with open(path, "w") as f:
        f.write(summary)
