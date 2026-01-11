from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
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

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Serve static files from the frontend/dist directory
# Path is relative to the project root in Docker
frontend_dist_path = os.path.join(os.getcwd(), "frontend/dist")
assets_path = os.path.join(frontend_dist_path, "assets")

if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

@app.get("/")
async def serve_frontend():
    index_path = os.path.join(frontend_dist_path, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Welcome to AI Study Buddy API (Frontend not built)", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
