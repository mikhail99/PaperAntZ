"""
Planning agent for creating research plans and strategies
"""

from typing import Dict, Any
from .base import BaseAgent

class PlanningAgent(BaseAgent):
    """Agent for creating research plans and strategies"""
    
    def __init__(self):
        super().__init__(
            agent_id="planning-agent",
            name="Planning Agent",
            description="Creates comprehensive research plans and strategies",
            agent_type="planning"
        )
    
    async def execute(self, task: str, input_data: Dict[str, Any], parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Execute planning task"""
        # For now, return a mock response
        return {
            "success": True,
            "plan": {
                "title": f"Research Plan: {task}",
                "objectives": [
                    "Define clear research questions",
                    "Identify key stakeholders",
                    "Establish timeline and milestones",
                    "Determine resource requirements"
                ],
                "methodology": [
                    "Literature review",
                    "Data collection",
                    "Analysis",
                    "Validation"
                ],
                "timeline": {
                    "phase_1": "2 weeks - Background research",
                    "phase_2": "3 weeks - Data collection",
                    "phase_3": "2 weeks - Analysis",
                    "phase_4": "1 week - Report writing"
                },
                "resources": [
                    "Research databases",
                    "Subject matter experts",
                    "Data analysis tools",
                    "Documentation templates"
                ]
            },
            "agent_id": self.agent_id,
            "timestamp": self.last_used
        }
    
    def get_capabilities(self) -> Dict[str, Any]:
        """Get planning agent capabilities"""
        return {
            "name": self.name,
            "description": self.description,
            "input_types": ["text", "research_topic", "project_requirements"],
            "output_types": ["research_plan", "strategy", "timeline", "resource_allocation"],
            "parameters": {
                "detail_level": {
                    "type": "string",
                    "enum": ["basic", "detailed", "comprehensive"],
                    "default": "detailed"
                },
                "timeframe": {
                    "type": "string",
                    "description": "Expected project duration"
                },
                "budget": {
                    "type": "number",
                    "description": "Available budget (optional)"
                }
            },
            "examples": [
                {
                    "input": "Create a research plan for AI ethics study",
                    "output": "Comprehensive research plan with timeline and resources"
                },
                {
                    "input": "Plan a market research project",
                    "output": "Structured market research methodology and timeline"
                }
            ]
        }