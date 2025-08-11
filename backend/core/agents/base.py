"""
Base agent class for AI agents
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import asyncio
import uuid

from core.services.llm import BaseLLMService, LLMResponse
from utils.helpers import generate_id, get_timestamp

class BaseAgent(ABC):
    """Abstract base class for AI agents"""
    
    def __init__(self, agent_id: str, name: str, description: str, agent_type: str):
        self.agent_id = agent_id
        self.name = name
        self.description = description
        self.type = agent_type
        self.version = "1.0.0"
        self.status = "active"
        self.created_at = datetime.now()
        self.last_used = None
        self.execution_count = 0
    
    @abstractmethod
    async def execute(self, task: str, input_data: Dict[str, Any], parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the agent's primary task"""
        pass
    
    @abstractmethod
    def get_capabilities(self) -> Dict[str, Any]:
        """Get the agent's capabilities"""
        pass
    
    async def execute_with_metrics(self, request: Any) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """Execute the agent with performance metrics"""
        start_time = get_timestamp()
        
        try:
            # Extract task and parameters from request
            task = getattr(request, 'task', 'Default task')
            input_data = getattr(request, 'input_data', {})
            parameters = getattr(request, 'parameters', {})
            
            # Execute the agent
            result = await self.execute(task, input_data, parameters)
            
            # Calculate execution time
            end_time = get_timestamp()
            execution_time = end_time - start_time
            
            # Update agent stats
            self.execution_count += 1
            self.last_used = end_time
            
            # Create metrics
            metrics = {
                "execution_time": execution_time,
                "agent_id": self.agent_id,
                "task_type": task,
                "success": True,
                "timestamp": end_time
            }
            
            return result, metrics
            
        except Exception as e:
            # Calculate execution time even for failed executions
            end_time = get_timestamp()
            execution_time = end_time - start_time
            
            # Create error metrics
            metrics = {
                "execution_time": execution_time,
                "agent_id": self.agent_id,
                "task_type": task,
                "success": False,
                "error": str(e),
                "timestamp": end_time
            }
            
            # Create error result
            result = {
                "success": False,
                "error": str(e),
                "agent_id": self.agent_id,
                "timestamp": end_time
            }
            
            return result, metrics
    
    def is_available(self) -> bool:
        """Check if the agent is available"""
        return self.status == "active"
    
    def get_stats(self) -> Dict[str, Any]:
        """Get agent statistics"""
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "type": self.type,
            "version": self.version,
            "status": self.status,
            "execution_count": self.execution_count,
            "created_at": self.created_at.isoformat(),
            "last_used": self.last_used.isoformat() if self.last_used else None,
            "available": self.is_available()
        }
    
    async def generate_llm_response(
        self, 
        llm_service: BaseLLMService,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> LLMResponse:
        """Generate a response using the LLM service"""
        return await llm_service.generate_response(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )
    
    def format_task_prompt(self, task: str, input_data: Dict[str, Any]) -> str:
        """Format the task into a prompt for the LLM"""
        prompt = f"""
Task: {task}

Input Data:
{self._format_input_data(input_data)}

Please provide a comprehensive response that addresses this task effectively.
"""
        return prompt
    
    def _format_input_data(self, input_data: Dict[str, Any]) -> str:
        """Format input data for inclusion in prompts"""
        if not input_data:
            return "No additional input data provided."
        
        formatted = []
        for key, value in input_data.items():
            if isinstance(value, (list, dict)):
                formatted.append(f"{key}: {str(value)}")
            else:
                formatted.append(f"{key}: {value}")
        
        return "\n".join(formatted)


# Preset helpers (mission-scoped)
def find_agent_preset(presets: list[dict], agent_type: str) -> dict:
    for p in presets or []:
        if p.get('agentType') == agent_type or p.get('id') in (f'preset_{agent_type}', agent_type):
            return p
    return {}