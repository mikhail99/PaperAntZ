"""
Agent registry for managing AI agents
"""

from typing import Dict, List, Any, Optional
from .base import BaseAgent
from .planning import PlanningAgent
from .research import ResearchAgent
from .writing import WritingAgent
from .review import ReviewAgent

class AgentRegistry:
    """Registry for managing AI agents"""
    
    def __init__(self):
        self._agents: Dict[str, BaseAgent] = {}
        self._initialize_agents()
    
    def _initialize_agents(self):
        """Initialize all available agents"""
        self._agents["planning-agent"] = PlanningAgent()
        self._agents["research-agent"] = ResearchAgent()
        self._agents["writing-agent"] = WritingAgent()
        self._agents["review-agent"] = ReviewAgent()
    
    def get_agent(self, agent_id: str) -> Optional[BaseAgent]:
        """Get an agent by ID"""
        return self._agents.get(agent_id)
    
    def get_all_agents(self) -> List[Dict[str, Any]]:
        """Get all available agents"""
        agents_list = []
        for agent_id, agent in self._agents.items():
            agents_list.append({
                "agent_id": agent_id,
                "name": agent.name,
                "description": agent.description,
                "type": agent.type,
                "version": agent.version,
                "status": agent.status,
                "capabilities": agent.get_capabilities()
            })
        return agents_list
    
    def is_agent_available(self, agent_id: str) -> bool:
        """Check if an agent is available"""
        agent = self.get_agent(agent_id)
        return agent is not None and agent.is_available()
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get overall system status"""
        total_agents = len(self._agents)
        available_agents = sum(1 for agent in self._agents.values() if agent.is_available())
        
        return {
            "total_agents": total_agents,
            "available_agents": available_agents,
            "unavailable_agents": total_agents - available_agents,
            "agents": {
                agent_id: {
                    "name": agent.name,
                    "status": agent.status,
                    "available": agent.is_available()
                }
                for agent_id, agent in self._agents.items()
            }
        }

# Global agent registry instance
agent_registry = AgentRegistry()