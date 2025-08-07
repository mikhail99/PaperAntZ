"""
Mock Workflow Orchestrator for LLM Toggle Guide testing
This provides basic workflow orchestration functionality using mock services.
"""

import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
import json

class MockWorkflowOrchestrator:
    """Mock implementation of workflow orchestrator for testing"""
    
    def __init__(self):
        self.workflows = {}
        self.execution_id_counter = 1
    
    async def create_workflow(self, workflow_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create and execute a workflow with mock agents"""
        execution_id = f"exec_{self.execution_id_counter}"
        self.execution_id_counter += 1
        
        # Mock workflow execution
        workflow_result = {
            "execution_id": execution_id,
            "status": "completed",
            "created_at": datetime.now().isoformat(),
            "agents_used": workflow_data.get("agents", ["research_agent", "writing_agent"]),
            "results": {
                "research_findings": "Mock research results: Found relevant information about the topic",
                "generated_content": "Mock generated content: This is a sample output from the writing agent",
                "analysis": "Mock analysis: The workflow completed successfully with mock data"
            },
            "execution_time": "2.5s",
            "token_usage": {
                "total_tokens": 1250,
                "prompt_tokens": 800,
                "completion_tokens": 450
            }
        }
        
        self.workflows[execution_id] = workflow_result
        return workflow_result
    
    async def get_workflow(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get workflow execution results"""
        return self.workflows.get(execution_id)
    
    async def list_workflows(self) -> List[Dict[str, Any]]:
        """List all workflow executions"""
        return list(self.workflows.values())

# Global instance for API usage
workflow_orchestrator = MockWorkflowOrchestrator()