from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from app.services.tutor_service import tutor_service

router = APIRouter()

class ChatRequest(BaseModel):
    user_id: str
    message: str
    session_id: Optional[str] = "default"
    stream: Optional[bool] = False

class ChatResponse(BaseModel):
    response: str
    mastery_updates: Optional[dict[str, float]] = None

@router.post("/chat")
async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
    try:
        if request.stream:
            return StreamingResponse(
                tutor_service.stream_response(
                    request.user_id, 
                    request.message, 
                    request.session_id,
                    background_tasks=background_tasks
                ),
                media_type="text/event-stream"
            )
        
        response_data = await tutor_service.get_response(
            request.user_id, 
            request.message, 
            request.session_id,
            background_tasks=background_tasks
        )
        return ChatResponse(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{user_id}")
async def get_user_history(user_id: str):
    from app.memory.history import get_all_sessions
    return get_all_sessions(user_id)
