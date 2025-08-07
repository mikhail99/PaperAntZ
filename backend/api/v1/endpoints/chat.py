"""
Chat session management endpoints
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from api.v1.models import (
    ChatSessionResponse, ChatMessageResponse, ChatHistoryResponse,
    ChatMessage, MessageRole
)
from core.dependencies import get_llm_service, get_chat_service
from core.services.llm import BaseLLMService
from utils.helpers import create_success_response, create_error_response

router = APIRouter()

class ChatMessageRequest(BaseModel):
    """Request model for sending chat messages with LLM toggle"""
    message: str
    document_ids: Optional[List[str]] = None
    use_real_llm: Optional[bool] = None

class ChatMessageWithToggleRequest(BaseModel):
    """Request model for sending chat messages with explicit LLM toggle"""
    message: str
    document_ids: Optional[List[str]] = None
    use_real_llm: bool = False

@router.post("/chat/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    agent_id: Optional[str] = None,
    title: Optional[str] = None
):
    """Create a new chat session"""
    try:
        chat_service = get_chat_service()
        session_id = await chat_service.create_session(agent_id, title)
        
        session = await chat_service.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=500,
                detail="Failed to create session"
            )
        
        return ChatSessionResponse(
            success=True,
            message="Chat session created successfully",
            data={
                "session_id": session.session_id,
                "agent_id": session.agent_id,
                "title": session.title
            }
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create chat session: {str(e)}"
        )

@router.get("/chat/sessions/{session_id}")
async def get_chat_session(session_id: str):
    """Get chat session details"""
    try:
        chat_service = get_chat_service()
        session = await chat_service.get_session(session_id)
        
        if not session:
            raise HTTPException(
                status_code=404,
                detail=f"Chat session '{session_id}' not found"
            )
        
        return create_success_response(
            data={
                "session_id": session.session_id,
                "agent_id": session.agent_id,
                "title": session.title,
                "created_at": session.created_at.isoformat(),
                "status": session.status,
                "message_count": len(session.messages)
            },
            message="Chat session retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get chat session: {str(e)}"
        )

@router.get("/chat/sessions")
async def list_chat_sessions(
    limit: int = 20,
    offset: int = 0,
    agent_id: Optional[str] = None
):
    """List all chat sessions"""
    try:
        sessions = await chat_service.get_all_sessions()
        
        # Filter by agent_id if specified
        if agent_id:
            sessions = [s for s in sessions if s.agent_id == agent_id]
        
        # Apply pagination
        total_count = len(sessions)
        paginated_sessions = sessions[offset:offset + limit]
        
        session_data = []
        for session in paginated_sessions:
            session_data.append({
                "session_id": session.session_id,
                "agent_id": session.agent_id,
                "title": session.title,
                "created_at": session.created_at.isoformat(),
                "status": session.status,
                "message_count": len(session.messages),
                "last_message": session.messages[-1].timestamp.isoformat() if session.messages else None
            })
        
        return create_success_response(
            data={
                "sessions": session_data,
                "total_count": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total_count
            },
            message="Chat sessions retrieved successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list chat sessions: {str(e)}"
        )

@router.post("/chat/sessions/{session_id}/messages", response_model=ChatMessageResponse)
async def send_chat_message(
    session_id: str,
    request: ChatMessageRequest
):
    """Send a message in a chat session with optional LLM toggle"""
    try:
        # Validate message
        if not request.message or not request.message.strip():
            raise HTTPException(
                status_code=400,
                detail="Message cannot be empty"
            )
        
        # Get services with LLM toggle
        llm_service = get_llm_service(use_mock=not request.use_real_llm)
        chat_service = get_chat_service()
        
        # Send message and get response using the selected LLM service
        response = await chat_service.send_message_with_llm(
            session_id=session_id,
            message=request.message.strip(),
            document_ids=request.document_ids,
            llm_service=llm_service
        )
        
        # Add LLM service info to response
        response_data = response.copy()
        response_data["llm_service"] = {
            "provider": llm_service.provider,
            "model": llm_service.model,
            "use_real_llm": request.use_real_llm if request.use_real_llm is not None else not llm_service.provider == "mock"
        }
        
        return ChatMessageResponse(
            success=True,
            message="Message sent and response received",
            data=response_data
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send message: {str(e)}"
        )

@router.post("/chat/sessions/{session_id}/messages/toggle", response_model=ChatMessageResponse)
async def send_chat_message_with_toggle(
    session_id: str,
    request: ChatMessageWithToggleRequest
):
    """Send a message in a chat session with explicit LLM toggle"""
    try:
        # Validate message
        if not request.message or not request.message.strip():
            raise HTTPException(
                status_code=400,
                detail="Message cannot be empty"
            )
        
        # Get services with explicit LLM toggle
        llm_service = get_llm_service(use_mock=not request.use_real_llm)
        chat_service = get_chat_service()
        
        # Send message and get response using the selected LLM service
        response = await chat_service.send_message_with_llm(
            session_id=session_id,
            message=request.message.strip(),
            document_ids=request.document_ids,
            llm_service=llm_service
        )
        
        # Add LLM service info to response
        response_data = response.copy()
        response_data["llm_service"] = {
            "provider": llm_service.provider,
            "model": llm_service.model,
            "use_real_llm": request.use_real_llm,
            "tokens_used": getattr(llm_service, 'total_tokens', 0),
            "total_cost": getattr(llm_service, 'total_cost', 0.0)
        }
        
        return ChatMessageResponse(
            success=True,
            message=f"Message sent and response received using {'real' if request.use_real_llm else 'mock'} LLM",
            data=response_data
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send message: {str(e)}"
        )

@router.get("/chat/sessions/{session_id}/messages", response_model=ChatHistoryResponse)
async def get_chat_messages(session_id: str):
    """Get chat session messages"""
    try:
        chat_service = get_chat_service()
        messages = await chat_service.get_session_messages(session_id)
        
        return ChatHistoryResponse(
            success=True,
            message="Chat messages retrieved successfully",
            data={"messages": messages}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get chat messages: {str(e)}"
        )

@router.delete("/chat/sessions/{session_id}")
async def delete_chat_session(session_id: str):
    """Delete a chat session"""
    try:
        chat_service = get_chat_service()
        success = await chat_service.delete_session(session_id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Chat session '{session_id}' not found"
            )
        
        return create_success_response(
            data={"session_id": session_id},
            message=f"Chat session '{session_id}' deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete chat session: {str(e)}"
        )

@router.post("/chat/sessions/{session_id}/documents/{document_id}")
async def add_document_to_session(session_id: str, document_id: str):
    """Add document context to a chat session"""
    try:
        chat_service = get_chat_service()
        success = await chat_service.add_document_to_session(session_id, document_id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Session '{session_id}' or document '{document_id}' not found"
            )
        
        return create_success_response(
            data={
                "session_id": session_id,
                "document_id": document_id
            },
            message="Document added to session successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add document to session: {str(e)}"
        )

@router.delete("/chat/sessions/{session_id}/documents/{document_id}")
async def remove_document_from_session(session_id: str, document_id: str):
    """Remove document context from a chat session"""
    try:
        chat_service = get_chat_service()
        success = await chat_service.remove_document_from_session(session_id, document_id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Session '{session_id}' or document '{document_id}' not found"
            )
        
        return create_success_response(
            data={
                "session_id": session_id,
                "document_id": document_id
            },
            message="Document removed from session successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to remove document from session: {str(e)}"
        )

@router.get("/chat/stats")
async def get_chat_stats():
    """Get chat service statistics"""
    try:
        chat_service = get_chat_service()
        stats = chat_service.get_chat_stats()
        
        return create_success_response(
            data=stats,
            message="Chat statistics retrieved successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get chat statistics: {str(e)}"
        )

@router.post("/chat/cleanup")
async def cleanup_chat_sessions(
    background_tasks: BackgroundTasks,
    max_age_hours: int = 24
):
    """Clean up old chat sessions"""
    try:
        chat_service = get_chat_service()
        # Run cleanup in background
        background_tasks.add_task(
            chat_service.cleanup_old_sessions,
            max_age_hours
        )
        
        return create_success_response(
            data={"max_age_hours": max_age_hours},
            message=f"Chat session cleanup initiated for sessions older than {max_age_hours} hours"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate chat session cleanup: {str(e)}"
        )

@router.get("/chat/sessions/{session_id}/export")
async def export_chat_session(
    session_id: str,
    format: str = "json"
):
    """Export chat session in specified format"""
    try:
        chat_service = get_chat_service()
        session = await chat_service.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=404,
                detail=f"Chat session '{session_id}' not found"
            )
        
        if format.lower() == "json":
            export_data = {
                "session_id": session.session_id,
                "agent_id": session.agent_id,
                "title": session.title,
                "created_at": session.created_at.isoformat(),
                "messages": [
                    {
                        "message_id": msg.message_id,
                        "role": msg.role.value,
                        "content": msg.content,
                        "timestamp": msg.timestamp.isoformat(),
                        "agent_id": msg.agent_id
                    }
                    for msg in session.messages
                ]
            }
            
            return create_success_response(
                data=export_data,
                message="Chat session exported as JSON"
            )
        
        elif format.lower() == "txt":
            # Create text export
            lines = [
                f"Chat Session: {session.title}",
                f"Agent: {session.agent_id or 'General'}",
                f"Created: {session.created_at.strftime('%Y-%m-%d %H:%M:%S')}",
                f"Messages: {len(session.messages)}",
                "=" * 50
            ]
            
            for msg in session.messages:
                lines.append(f"\n[{msg.timestamp.strftime('%H:%M:%S')}] {msg.role.value.upper()}")
                if msg.agent_id:
                    lines.append(f"Agent: {msg.agent_id}")
                lines.append(f"{msg.content}")
                lines.append("-" * 30)
            
            export_data = {
                "session_id": session.session_id,
                "format": "txt",
                "content": "\n".join(lines)
            }
            
            return create_success_response(
                data=export_data,
                message="Chat session exported as text"
            )
        
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported export format: {format}. Supported formats: json, txt"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export chat session: {str(e)}"
        )