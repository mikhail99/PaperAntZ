"""
Agent management endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any

from api.v1.models import (
    AgentListResponse, AgentResponse, AgentExecutionRequest, 
    AgentExecutionResponse, ExecutionStatusResponseModel, ExecutionStatusResponse,
    PerformanceMetrics, ExecutionResult
)
from core.agents import agent_registry
from utils.helpers import generate_id, get_timestamp, create_success_response, create_error_response

router = APIRouter()

@router.get("/agents", response_model=AgentListResponse)
async def get_agents():
    """Get all available agents"""
    try:
        agents = agent_registry.get_all_agents()
        
        return AgentListResponse(
            success=True,
            message="Agents retrieved successfully",
            data=agents
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve agents: {str(e)}"
        )

@router.get("/agents/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str):
    """Get specific agent details"""
    try:
        agent = agent_registry.get_agent(agent_id)
        if not agent:
            raise HTTPException(
                status_code=404,
                detail=f"Agent '{agent_id}' not found"
            )
        
        capability = agent.get_capability()
        
        return AgentResponse(
            success=True,
            message=f"Agent '{agent_id}' retrieved successfully",
            data=capability
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve agent: {str(e)}"
        )

@router.post("/agents/{agent_id}/execute", response_model=AgentExecutionResponse)
async def execute_agent(agent_id: str, request: AgentExecutionRequest):
    """Execute a specific agent"""
    try:
        # Check if agent exists and is available
        if not agent_registry.is_agent_available(agent_id):
            raise HTTPException(
                status_code=404,
                detail=f"Agent '{agent_id}' not found or not available"
            )
        
        # Get the agent
        agent = agent_registry.get_agent(agent_id)
        
        # Generate execution ID
        execution_id = generate_id("exec")
        
        # Create execution response
        execution_response = AgentExecutionResponse(
            execution_id=execution_id,
            agent_id=agent_id,
            status="running",
            started_at=get_timestamp(),
            estimated_duration=10,  # Mock estimate
            websocket_url=f"ws://localhost:8000/ws/executions/{execution_id}"
        )
        
        # Start execution in background (for demo purposes, we'll simulate it)
        # In a real implementation, this would be handled by a task queue
        import asyncio
        asyncio.create_task(_simulate_agent_execution(agent_id, execution_id, request))
        
        return AgentExecutionResponse(
            success=True,
            message=f"Agent '{agent_id}' execution started",
            data=execution_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute agent: {str(e)}"
        )

@router.get("/executions/{execution_id}", response_model=ExecutionStatusResponseModel)
async def get_execution_status(execution_id: str):
    """Get execution status and results"""
    try:
        # In a real implementation, this would query a database or task queue
        # For now, we'll simulate the response
        
        # Mock execution status
        status_response = ExecutionStatusResponse(
            execution_id=execution_id,
            agent_id="research-agent",  # Mock agent ID
            status="completed",  # Mock status
            started_at=get_timestamp(),
            completed_at=get_timestamp(),
            duration=5.0,  # Mock duration
            result=ExecutionResult(
                output="Mock execution result for research task",
                findings=[
                    {
                        "topic": "Research Finding 1",
                        "summary": "Summary of first research finding",
                        "sources": ["source_1", "source_2"]
                    },
                    {
                        "topic": "Research Finding 2",
                        "summary": "Summary of second research finding",
                        "sources": ["source_3"]
                    }
                ],
                metadata={
                    "tokens_used": 1500,
                    "cost": 0.045
                }
            ),
            performance_metrics=PerformanceMetrics(
                execution_time=5.0,
                memory_usage="512MB",
                cpu_usage="45%",
                tokens_used=1500,
                cost=0.045
            )
        )
        
        return ExecutionStatusResponseModel(
            success=True,
            message=f"Execution status for '{execution_id}' retrieved",
            data=status_response
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get execution status: {str(e)}"
        )

@router.post("/executions/{execution_id}/cancel")
async def cancel_execution(execution_id: str):
    """Cancel a running execution"""
    try:
        # In a real implementation, this would cancel the task in the queue
        # For now, we'll just return a success response
        
        return create_success_response(
            data={
                "execution_id": execution_id,
                "status": "cancelled",
                "cancelled_at": get_timestamp()
            },
            message=f"Execution '{execution_id}' cancelled successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cancel execution: {str(e)}"
        )

@router.get("/agents/system/status")
async def get_system_status():
    """Get overall agent system status"""
    try:
        status = agent_registry.get_system_status()
        
        return create_success_response(
            data=status,
            message="System status retrieved successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get system status: {str(e)}"
        )

# Helper function to simulate agent execution
async def _simulate_agent_execution(agent_id: str, execution_id: str, request: AgentExecutionRequest):
    """Simulate agent execution (for demo purposes)"""
    try:
        import asyncio
        from datetime import datetime, timedelta
        
        # Simulate processing time
        await asyncio.sleep(2)
        
        # Get the agent and execute
        agent = agent_registry.get_agent(agent_id)
        if agent:
            result, metrics = await agent.execute_with_metrics(request)
            
            # In a real implementation, this would be stored in a database
            # and made available through the status endpoint
            print(f"Execution {execution_id} completed: {result.output[:100]}...")
            
    except Exception as e:
        print(f"Error in simulated execution {execution_id}: {str(e)}")