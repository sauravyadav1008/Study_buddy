from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, user, assessment, upload
from app.utils.logger import configure_logging

# Configure logging
configure_logging()

app = FastAPI(title="AI Study Buddy API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(chat.router, tags=["chat"])
app.include_router(user.router, tags=["user"])
app.include_router(assessment.router, prefix="/assessment", tags=["assessment"])
app.include_router(upload.router, tags=["upload"])

@app.get("/")
async def root():
    return {"message": "Welcome to AI Study Buddy API", "docs": "/docs"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
