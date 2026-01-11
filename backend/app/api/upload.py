from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from app.services.file_service import file_service
from typing import Dict

import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Temporary storage for extracted content: {user_id: {filename: content}}
# In a production app, this should be in Redis or a database with TTL
uploaded_content_store: Dict[str, Dict[str, str]] = {}

@router.post("/upload")
async def upload_file(user_id: str = Query(...), file: UploadFile = File(...)):
    logger.info(f"Received upload request for user_id: {user_id}, filename: {file.filename}")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    try:
        content = await file.read()
        logger.info(f"Read {len(content)} bytes from {file.filename}")
        
        extracted_text = file_service.extract_text(content, file.filename)
        
        if extracted_text is None:
            logger.error(f"Failed to extract text from {file.filename}")
            raise HTTPException(status_code=400, detail="Could not extract text from file or unsupported format")
        
        logger.info(f"Successfully extracted {len(extracted_text)} characters from {file.filename}")
        
        if user_id not in uploaded_content_store:
            uploaded_content_store[user_id] = {}
        
        uploaded_content_store[user_id][file.filename] = extracted_text
        
        return {
            "filename": file.filename,
            "message": "File uploaded and processed successfully",
            "content_length": len(extracted_text)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during upload: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

def get_user_uploaded_content(user_id: str) -> str:
    if user_id not in uploaded_content_store:
        return ""
    
    # Combine all uploaded files for this user
    return "\n\n".join(uploaded_content_store[user_id].values())

def clear_user_uploaded_content(user_id: str):
    if user_id in uploaded_content_store:
        del uploaded_content_store[user_id]
