"""
Dependency injection for AI Research Assistant Backend
Provides centralized access to services and configuration
"""

from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from functools import lru_cache

from utils.config import settings
from core.services.llm import LLMServiceFactory, BaseLLMService
from core.services.document import DocumentService
from core.services.chat import ChatService

# Cache for service instances
_service_cache: Dict[str, Any] = {}

def get_llm_service(use_mock: Optional[bool] = None) -> BaseLLMService:
    """
    Get LLM service instance with optional override for mock/real selection
    
    Args:
        use_mock: Override the global setting. If None, uses global setting.
    
    Returns:
        LLM service instance
    """
    cache_key = f"llm_service_{use_mock if use_mock is not None else settings.use_mock_llm}"
    
    if cache_key not in _service_cache:
        _service_cache[cache_key] = LLMServiceFactory.create_service(use_mock)
    
    return _service_cache[cache_key]

def get_document_service() -> DocumentService:
    """Get document service instance"""
    if "document_service" not in _service_cache:
        _service_cache["document_service"] = DocumentService()
    
    return _service_cache["document_service"]

def get_chat_service() -> ChatService:
    """Get chat service instance"""
    if "chat_service" not in _service_cache:
        _service_cache["chat_service"] = ChatService()
    
    return _service_cache["chat_service"]

@lru_cache()
def get_settings() -> settings:
    """Get application settings (cached)"""
    return settings

def validate_api_key(api_key: Optional[str] = None) -> bool:
    """
    Validate API key (for future use when authentication is added)
    
    Args:
        api_key: API key to validate
    
    Returns:
        True if valid, False otherwise
    """
    # For now, always return True (no authentication)
    # In the future, this would validate against stored API keys
    return True

def get_current_user(api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Get current user information (for future use when authentication is added)
    
    Args:
        api_key: API key for authentication
    
    Returns:
        User information dictionary
    """
    # For now, return a mock user
    return {
        "id": "mock_user_id",
        "name": "Research User",
        "email": "research@example.com",
        "role": "researcher",
        "permissions": ["read", "write", "execute"]
    }

def require_real_llm():
    """
    Dependency that ensures real LLM is being used
    
    Raises:
        HTTPException: If mock LLM is being used
    """
    if settings.use_mock_llm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This endpoint requires real LLM. Mock LLM is currently enabled."
        )

def allow_mock_llm():
    """
    Dependency that allows mock LLM (no validation needed)
    
    This is a pass-through dependency for endpoints that work with both mock and real LLM
    """
    pass

def get_service_stats() -> Dict[str, Any]:
    """
    Get statistics from all services
    
    Returns:
        Dictionary containing service statistics
    """
    stats = {
        "llm_service": LLMServiceFactory.get_service_stats(),
        "document_service": get_document_service().get_stats(),
        "chat_service": get_chat_service().get_stats(),
        "system": {
            "uptime": "N/A",  # Would implement uptime tracking in production
            "version": "1.0.0",
            "environment": "development" if settings.debug else "production"
        }
    }
    
    return stats

def clear_service_cache():
    """
    Clear the service cache (useful for testing or service reloads)
    """
    global _service_cache
    _service_cache.clear()
    get_settings.cache_clear()

def update_llm_service_config(
    use_mock: Optional[bool] = None,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None
):
    """
    Update LLM service configuration and clear cache
    
    Args:
        use_mock: Whether to use mock LLM
        provider: LLM provider
        model: LLM model
        temperature: LLM temperature
        max_tokens: LLM max tokens
    """
    # Update settings (in a real implementation, this would persist to config)
    if use_mock is not None:
        settings.use_mock_llm = use_mock
    if provider is not None:
        settings.llm_provider = provider
    if model is not None:
        settings.llm_model = model
    if temperature is not None:
        settings.llm_temperature = temperature
    if max_tokens is not None:
        settings.llm_max_tokens = max_tokens
    
    # Clear cache to force new service instances with updated config
    clear_service_cache()

# Common dependency combinations for different endpoint types

def get_chat_dependencies(use_mock: Optional[bool] = None):
    """
    Get all dependencies needed for chat endpoints
    
    Args:
        use_mock: Override for mock/real LLM selection
    
    Returns:
        Tuple of (llm_service, chat_service, document_service)
    """
    return (
        get_llm_service(use_mock),
        get_chat_service(),
        get_document_service()
    )

def get_agent_dependencies(use_mock: Optional[bool] = None):
    """
    Get all dependencies needed for agent endpoints
    
    Args:
        use_mock: Override for mock/real LLM selection
    
    Returns:
        Tuple of (llm_service, document_service)
    """
    return (
        get_llm_service(use_mock),
        get_document_service()
    )

def get_optimization_dependencies(use_mock: Optional[bool] = None):
    """
    Get all dependencies needed for optimization endpoints
    
    Args:
        use_mock: Override for mock/real LLM selection
    
    Returns:
        Tuple of (llm_service, settings)
    """
    return (
        get_llm_service(use_mock),
        get_settings()
    )