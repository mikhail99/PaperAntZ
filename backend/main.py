"""
FastAPI Backend for AI Research Assistant
Main application entry point
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from datetime import datetime

# Import API routers
from api.v1.endpoints import agents, executions, workflows, documents, chat, optimization, health, idea_missions
from core.dependencies import get_service_stats, update_llm_service_config, get_settings

# Create FastAPI app
app = FastAPI(
    title="AI Research Assistant API",
    description="Backend API for AI Research Assistant with agent orchestration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js development
        "http://localhost:3001",  # Alternative port
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(agents.router, prefix="/api/v1", tags=["Agents"])
app.include_router(executions.router, prefix="/api/v1", tags=["Executions"])
app.include_router(workflows.router, prefix="/api/v1", tags=["Workflows"])
app.include_router(documents.router, prefix="/api/v1", tags=["Documents"])
app.include_router(chat.router, prefix="/api/v1", tags=["Chat"])
app.include_router(optimization.router, prefix="/api/v1", tags=["Optimization"])
app.include_router(idea_missions.router, prefix="/api/v1", tags=["IdeaMissions"]) 

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Research Assistant API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "docs": "/docs",
        "status": "running",
        "configuration": {
            "use_mock_llm": get_settings().use_mock_llm,
            "llm_provider": get_settings().llm_provider,
            "llm_model": get_settings().llm_model
        }
    }

@app.get("/api/v1/config")
async def get_config():
    """Get current configuration"""
    settings = get_settings()
    return {
        "use_mock_llm": settings.use_mock_llm,
        "llm_provider": settings.llm_provider,
        "llm_model": settings.llm_model,
        "llm_temperature": settings.llm_temperature,
        "llm_max_tokens": settings.llm_max_tokens,
        "debug": settings.debug
    }

@app.post("/api/v1/config")
async def update_config(config_data: dict):
    """Update configuration"""
    try:
        update_llm_service_config(
            use_mock=config_data.get("use_mock_llm"),
            provider=config_data.get("llm_provider"),
            model=config_data.get("llm_model"),
            temperature=config_data.get("llm_temperature"),
            max_tokens=config_data.get("llm_max_tokens")
        )
        
        return {
            "message": "Configuration updated successfully",
            "config": await get_config()
        }
    except Exception as e:
        return {
            "message": f"Failed to update configuration: {str(e)}",
            "config": await get_config()
        }

@app.get("/api/v1/stats")
async def get_stats():
    """Get service statistics"""
    return get_service_stats()

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    print("🚀 AI Research Assistant API starting up...")
    print("📚 API Documentation available at: http://localhost:8000/docs")
    print("🔗 Frontend should connect to: http://localhost:8000/api/v1")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("🛑 AI Research Assistant API shutting down...")

if __name__ == "__main__":
    # Configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("RELOAD", "true").lower() == "true"
    
    print(f"🌐 Starting server on {host}:{port}")
    print(f"🔄 Auto-reload: {'enabled' if reload else 'disabled'}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )