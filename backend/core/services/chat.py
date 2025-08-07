"""
Chat session management service
"""

import asyncio
import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime

from api.v1.models import ChatSession, ChatMessage, MessageRole, DocumentContext
from core.agents import agent_registry
from utils.helpers import generate_id, get_timestamp, AsyncMockDelay

class ChatService:
    """Service for managing chat sessions and messages"""
    
    def __init__(self):
        self.sessions: Dict[str, ChatSession] = {}
        self.messages: Dict[str, List[ChatMessage]] = {}
    
    async def create_session(self, agent_id: Optional[str] = None, title: Optional[str] = None) -> str:
        """Create a new chat session"""
        try:
            # Validate agent if provided
            if agent_id and not agent_registry.is_agent_available(agent_id):
                raise ValueError(f"Agent '{agent_id}' not found or not available")
            
            # Generate session ID
            session_id = generate_id("session")
            
            # Get agent name if agent_id provided
            agent_name = None
            if agent_id:
                agent = agent_registry.get_agent(agent_id)
                agent_name = agent.name if agent else None
            
            # Create session
            session = ChatSession(
                session_id=session_id,
                agent_id=agent_id,
                title=title or (f"Chat with {agent_name}" if agent_name else "New Chat"),
                created_at=datetime.now(),
                status="active",
                messages=[]
            )
            
            # Store session
            self.sessions[session_id] = session
            self.messages[session_id] = []
            
            return session_id
            
        except Exception as e:
            raise Exception(f"Failed to create chat session: {str(e)}")
    
    async def get_session(self, session_id: str) -> Optional[ChatSession]:
        """Get chat session by ID"""
        session = self.sessions.get(session_id)
        if session:
            # Update messages
            session.messages = self.messages.get(session_id, [])
        return session
    
    async def get_all_sessions(self) -> List[ChatSession]:
        """Get all chat sessions"""
        sessions = []
        for session_id, session in self.sessions.items():
            session.messages = self.messages.get(session_id, [])
            sessions.append(session)
        return sessions
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete a chat session"""
        try:
            if session_id not in self.sessions:
                return False
            
            # Remove session and messages
            del self.sessions[session_id]
            if session_id in self.messages:
                del self.messages[session_id]
            
            return True
            
        except Exception as e:
            print(f"Error deleting session {session_id}: {e}")
            return False
    
    async def send_message(
        self,
        session_id: str,
        message: str,
        document_ids: Optional[List[str]] = None
    ) -> ChatMessage:
        """Send a message and get agent response"""
        try:
            # Get session
            session = await self.get_session(session_id)
            if not session:
                raise ValueError(f"Session '{session_id}' not found")
            
            # Create user message
            user_message = ChatMessage(
                message_id=generate_id("msg"),
                session_id=session_id,
                role=MessageRole.USER,
                content=message,
                timestamp=datetime.now(),
                document_context=[]
            )
            
            # Add document context if provided
            if document_ids:
                # In a real implementation, this would fetch document details
                for doc_id in document_ids:
                    user_message.document_context.append(
                        DocumentContext(
                            id=doc_id,
                            title=f"Document {doc_id}",
                            relevance_score=0.8  # Mock relevance score
                        )
                    )
            
            # Store user message
            self.messages[session_id].append(user_message)
            
            # Generate agent response
            agent_response = await self._generate_agent_response(session, message, document_ids)
            
            # Store agent response
            self.messages[session_id].append(agent_response)
            
            return agent_response
            
        except Exception as e:
            raise Exception(f"Failed to send message: {str(e)}")
    
    async def get_session_messages(self, session_id: str) -> List[ChatMessage]:
        """Get all messages for a session"""
        return self.messages.get(session_id, [])
    
    async def _generate_agent_response(
        self,
        session: ChatSession,
        message: str,
        document_ids: Optional[List[str]] = None
    ) -> ChatMessage:
        """Generate agent response to user message"""
        try:
            await AsyncMockDelay.weighted_delay()
            
            # If session has a specific agent, use that agent
            if session.agent_id:
                agent = agent_registry.get_agent(session.agent_id)
                if agent:
                    # Create execution request
                    execution_request = {
                        "task": message,
                        "context": {
                            "session_id": session.session_id,
                            "document_ids": document_ids or [],
                            "chat_history": [
                                {"role": msg.role.value, "content": msg.content}
                                for msg in self.messages[session.session_id][-5:]  # Last 5 messages
                            ]
                        },
                        "configuration": {
                            "temperature": 0.7,
                            "max_tokens": 1000
                        }
                    }
                    
                    # Execute agent
                    result, _ = await agent.execute_with_metrics(execution_request)
                    
                    # Create response message
                    response = ChatMessage(
                        message_id=generate_id("msg"),
                        session_id=session.session_id,
                        role=MessageRole.AGENT,
                        content=result.output,
                        timestamp=datetime.now(),
                        agent_id=session.agent_id,
                        document_context=[]
                    )
                    
                    return response
            
            # If no specific agent or agent not available, use general response
            response_content = self._generate_general_response(message, document_ids)
            
            return ChatMessage(
                message_id=generate_id("msg"),
                session_id=session.session_id,
                role=MessageRole.AGENT,
                content=response_content,
                timestamp=datetime.now(),
                document_context=[]
            )
            
        except Exception as e:
            # Fallback error response
            return ChatMessage(
                message_id=generate_id("msg"),
                session_id=session.session_id,
                role=MessageRole.AGENT,
                content=f"I apologize, but I encountered an error while processing your message: {str(e)}",
                timestamp=datetime.now(),
                document_context=[]
            )
    
    def _generate_general_response(self, message: str, document_ids: Optional[List[str]] = None) -> str:
        """Generate a general response when no specific agent is available"""
        # Simple response patterns based on message content
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['hello', 'hi', 'hey']):
            return "Hello! I'm your AI research assistant. How can I help you today?"
        
        elif any(word in message_lower for word in ['help', 'assist', 'support']):
            return """I can help you with various research tasks including:
• Creating research plans and strategies
• Conducting research and gathering information
• Writing reports and content
• Reviewing and evaluating materials

To get started, you can either chat with me generally or specify which agent you'd like to work with. What would you like to explore?"""
        
        elif any(word in message_lower for word in ['research', 'investigate', 'analyze']):
            return """I'd be happy to help you with research! To provide you with the most relevant and comprehensive analysis, I recommend using our specialized Research Agent.

Would you like me to:
1. Conduct general research on your topic
2. Create a detailed research plan
3. Analyze specific information you have
4. Something else related to research

Please let me know what specific research task you'd like assistance with."""
        
        elif any(word in message_lower for word in ['write', 'create', 'draft']):
            return """I can help you with writing tasks! For the best results, I recommend using our specialized Writing Agent.

I can assist you with:
• Writing reports and articles
• Creating content and documentation
• Editing and improving existing text
• Summarizing information

What type of writing task would you like help with?"""
        
        elif any(word in message_lower for word in ['plan', 'strategy', 'roadmap']):
            return """Planning is crucial for successful projects! I recommend using our specialized Planning Agent for comprehensive planning tasks.

I can help you create:
• Research plans and methodologies
• Project roadmaps and timelines
• Strategic plans and frameworks
• Resource allocation plans

What would you like to plan or strategize about?"""
        
        elif any(word in message_lower for word in ['review', 'evaluate', 'assess']):
            return """I'd be glad to help you review materials! For thorough evaluations, I recommend using our specialized Review Agent.

I can assist with:
• Content quality assessment
• Document review and critique
• Improvement suggestions
• Compliance checking

What would you like me to review or evaluate?"""
        
        else:
            # Default general response
            document_context_text = ""
            if document_ids:
                document_context_text = f"\n\nI see you've referenced {len(document_ids)} document(s). I can incorporate information from these documents into my response."
            
            return f"""Thank you for your message! I'm here to help you with your research and writing tasks. I have access to specialized agents for different types of tasks:

• **Planning Agent**: For creating research plans and strategies
• **Research Agent**: For conducting research and gathering information  
• **Writing Agent**: For generating reports and content
• **Review Agent**: For evaluating and reviewing materials

To get started, you can:
1. Tell me what you'd like to accomplish, and I'll guide you to the right agent
2. Ask me to connect you with a specific agent
3. Continue with general conversation

What would you like to work on today?{document_context_text}"""
    
    async def add_document_to_session(self, session_id: str, document_id: str) -> bool:
        """Add document context to a session"""
        try:
            session = await self.get_session(session_id)
            if not session:
                return False
            
            # In a real implementation, this would validate the document exists
            # and add it to the session's document context
            
            return True
            
        except Exception as e:
            print(f"Error adding document to session: {e}")
            return False
    
    async def remove_document_from_session(self, session_id: str, document_id: str) -> bool:
        """Remove document context from a session"""
        try:
            session = await self.get_session(session_id)
            if not session:
                return False
            
            # In a real implementation, this would remove the document
            # from the session's document context
            
            return True
            
        except Exception as e:
            print(f"Error removing document from session: {e}")
            return False
    
    def get_chat_stats(self) -> Dict[str, Any]:
        """Get chat service statistics"""
        total_sessions = len(self.sessions)
        total_messages = sum(len(messages) for messages in self.messages.values())
        
        # Count sessions by agent
        agent_sessions = {}
        for session in self.sessions.values():
            if session.agent_id:
                agent_sessions[session.agent_id] = agent_sessions.get(session.agent_id, 0) + 1
            else:
                agent_sessions["general"] = agent_sessions.get("general", 0) + 1
        
        return {
            "total_sessions": total_sessions,
            "total_messages": total_messages,
            "average_messages_per_session": total_messages / max(1, total_sessions),
            "sessions_by_agent": agent_sessions,
            "active_sessions": sum(1 for session in self.sessions.values() if session.status == "active")
        }
    
    def cleanup_old_sessions(self, max_age_hours: int = 24) -> int:
        """Clean up old chat sessions"""
        cutoff_time = datetime.now().timestamp() - (max_age_hours * 3600)
        
        sessions_to_remove = []
        for session_id, session in self.sessions.items():
            if session.created_at.timestamp() < cutoff_time:
                sessions_to_remove.append(session_id)
        
        removed_count = 0
        for session_id in sessions_to_remove:
            if asyncio.run(self.delete_session(session_id)):
                removed_count += 1
        
        return removed_count

# Global chat service instance
chat_service = ChatService()