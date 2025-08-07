"""
Workflow orchestration endpoints
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any, List, Optional

from api.v1.models import (
    WorkflowResponse, WorkflowStatusResponseModel, WorkflowStatusResponse,
    WorkflowRequest
)
from core.orchestration import workflow_orchestrator
from utils.helpers import create_success_response, create_error_response

router = APIRouter()

@router.post("/orchestration/workflows", response_model=WorkflowResponse)
async def create_workflow(request: WorkflowRequest):
    """Create and execute a multi-agent workflow"""
    try:
        # Validate workflow request
        if not request.agents:
            raise HTTPException(
                status_code=400,
                detail="Workflow must have at least one agent step"
            )
        
        # Create workflow
        workflow_id = await workflow_orchestrator.create_workflow(request)
        
        return WorkflowResponse(
            success=True,
            message="Workflow created and started successfully",
            data={
                "workflow_id": workflow_id,
                "status": "running",
                "websocket_url": f"ws://localhost:8000/ws/workflows/{workflow_id}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create workflow: {str(e)}"
        )

@router.get("/orchestration/workflows/{workflow_id}", response_model=WorkflowStatusResponseModel)
async def get_workflow_status(workflow_id: str):
    """Get workflow status and results"""
    try:
        workflow_status = await workflow_orchestrator.get_workflow_status(workflow_id)
        
        if not workflow_status:
            raise HTTPException(
                status_code=404,
                detail=f"Workflow '{workflow_id}' not found"
            )
        
        return WorkflowStatusResponseModel(
            success=True,
            message=f"Workflow status for '{workflow_id}' retrieved",
            data=workflow_status
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get workflow status: {str(e)}"
        )

@router.post("/orchestration/workflows/{workflow_id}/cancel")
async def cancel_workflow(workflow_id: str):
    """Cancel a running workflow"""
    try:
        success = await workflow_orchestrator.cancel_workflow(workflow_id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Workflow '{workflow_id}' not found or cannot be cancelled"
            )
        
        return create_success_response(
            data={
                "workflow_id": workflow_id,
                "status": "cancelled",
                "cancelled_at": workflow_orchestrator.workflows[workflow_id].completed_at.isoformat()
            },
            message=f"Workflow '{workflow_id}' cancelled successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cancel workflow: {str(e)}"
        )

@router.get("/orchestration/workflows")
async def list_workflows(
    status: str = None,
    limit: int = 20,
    offset: int = 0
):
    """List all workflows with optional filtering"""
    try:
        workflows = workflow_orchestrator.get_all_workflows()
        
        # Filter by status if specified
        if status:
            workflows = [w for w in workflows if w["status"] == status]
        
        # Apply pagination
        total_count = len(workflows)
        paginated_workflows = workflows[offset:offset + limit]
        
        return create_success_response(
            data={
                "workflows": paginated_workflows,
                "total_count": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total_count
            },
            message="Workflows retrieved successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list workflows: {str(e)}"
        )

@router.delete("/orchestration/workflows/{workflow_id}")
async def delete_workflow(workflow_id: str):
    """Delete a workflow"""
    try:
        # Check if workflow exists
        if workflow_id not in workflow_orchestrator.workflows:
            raise HTTPException(
                status_code=404,
                detail=f"Workflow '{workflow_id}' not found"
            )
        
        # Cancel if running
        if workflow_id in workflow_orchestrator.running_workflows:
            await workflow_orchestrator.cancel_workflow(workflow_id)
        
        # Remove workflow
        del workflow_orchestrator.workflows[workflow_id]
        
        return create_success_response(
            data={"workflow_id": workflow_id},
            message=f"Workflow '{workflow_id}' deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete workflow: {str(e)}"
        )

@router.post("/orchestration/workflows/cleanup")
async def cleanup_workflows(
    background_tasks: BackgroundTasks,
    max_age_hours: int = 24
):
    """Clean up old completed workflows"""
    try:
        # Run cleanup in background
        background_tasks.add_task(
            workflow_orchestrator.cleanup_completed_workflows,
            max_age_hours
        )
        
        return create_success_response(
            data={"max_age_hours": max_age_hours},
            message=f"Workflow cleanup initiated for workflows older than {max_age_hours} hours"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate workflow cleanup: {str(e)}"
        )

@router.get("/orchestration/workflows/{workflow_id}/steps")
async def get_workflow_steps(workflow_id: str):
    """Get detailed step information for a workflow"""
    try:
        if workflow_id not in workflow_orchestrator.workflows:
            raise HTTPException(
                status_code=404,
                detail=f"Workflow '{workflow_id}' not found"
            )
        
        workflow = workflow_orchestrator.workflows[workflow_id]
        
        steps_data = []
        for step in workflow.steps:
            step_data = {
                "id": step.id,
                "agent_id": step.agent_id,
                "task": step.task,
                "depends_on": step.depends_on,
                "status": step.status.value if step.status else "pending",
                "execution_id": step.execution_id
            }
            
            # Add execution details if available
            if step.execution_id and step.execution_id in workflow.executions:
                execution_data = workflow.executions[step.execution_id]
                step_data["execution_details"] = {
                    "completed_at": execution_data["completed_at"].isoformat(),
                    "result_summary": execution_data["result"].output[:200] + "..." if execution_data["result"] else None,
                    "execution_time": execution_data["metrics"].execution_time,
                    "tokens_used": execution_data["metrics"].tokens_used
                }
            
            steps_data.append(step_data)
        
        return create_success_response(
            data={
                "workflow_id": workflow_id,
                "steps": steps_data,
                "total_steps": len(steps_data),
                "completed_steps": sum(1 for step in steps_data if step["status"] == "completed")
            },
            message="Workflow steps retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get workflow steps: {str(e)}"
        )