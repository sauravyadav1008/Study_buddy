import os
from fastapi import APIRouter, HTTPException
from app.memory.user_profile import load_user_profile, UserProfile, save_user_profile
from app.services.tutor_service import tutor_service
from app.config import settings

router = APIRouter()

@router.get("/user/{user_id}/profile", response_model=UserProfile)
async def get_profile(user_id: str):
    return load_user_profile(user_id)

@router.post("/user/{user_id}/reset")
async def reset_memory(user_id: str):
    success = await tutor_service.reset_user(user_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to reset memory")
    
    return {"status": "success", "message": "New session started. All previous progress archived."}
