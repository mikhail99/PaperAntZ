"""
Execution management endpoints
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List

from api.v1.models import (
    ExecutionStatusResponseModel, ExecutionStatusResponse,
    PerformanceMetrics, ExecutionResult, ExecutionStatus
)
from utils.helpers import generate_id, get_timestamp, create_success_response, create_error_response

router = APIRouter()

# In-memory storage for demo purposes
# In a real implementation, this would be a database
execution_store: Dict[str, Dict[str, Any]] = {}

@router.get("/executions/{execution_id}", response_model=ExecutionStatusResponseModel)
async def get_execution_status(execution_id: str):
    """Get execution status and results"""
    try:
        # Check if execution exists
        if execution_id not in execution_store:
            # Create a mock execution if not found
            execution_store[execution_id] = {
                "agent_id": "research-agent",
                "status": "completed",
                "started_at": get_timestamp(),
                "completed_at": get_timestamp(),
                "duration": 5.0,
                "result": ExecutionResult(
                    output="Mock execution result completed successfully",
                    findings=[
                        {
                            "topic": "Analysis Complete",
                            "summary": "Comprehensive analysis finished with key insights",
                            "sources": ["data_source_1", "reference_2"]
                        }
                    ],
                    metadata={
                        "tokens_used": 1200,
                        "cost": 0.036
                    }
                ),
                "performance_metrics": PerformanceMetrics(
                    execution_time=5.0,
                    memory_usage="512MB",
                    cpu_usage="45%",
                    tokens_used=1200,
                    cost=0.036
                )
            }
        
        execution_data = execution_store[execution_id]
        
        # Create response
        status_response = ExecutionStatusResponse(
            execution_id=execution_id,
            agent_id=execution_data["agent_id"],
            status=execution_data["status"],
            started_at=execution_data["started_at"],
            completed_at=execution_data.get("completed_at"),
            duration=execution_data.get("duration"),
            result=execution_data.get("result"),
            performance_metrics=execution_data.get("performance_metrics")
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
        # Check if execution exists
        if execution_id not in execution_store:
            raise HTTPException(
                status_code=404,
                detail=f"Execution '{execution_id}' not found"
            )
        
        execution_data = execution_store[execution_id]
        
        # Check if execution is still running
        if execution_data["status"] not in ["pending", "running"]:
            raise HTTPException(
                status_code=400,
                detail=f"Execution '{execution_id}' is not running and cannot be cancelled"
            )
        
        # Update execution status
        execution_data["status"] = "cancelled"
        execution_data["completed_at"] = get_timestamp()
        
        return create_success_response(
            data={
                "execution_id": execution_id,
                "status": "cancelled",
                "cancelled_at": get_timestamp()
            },
            message=f"Execution '{execution_id}' cancelled successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cancel execution: {str(e)}"
        )

@router.get("/executions")
async def list_executions(
    status: str = None,
    agent_id: str = None,
    limit: int = 10,
    offset: int = 0
):
    """List executions with optional filtering"""
    try:
        # Filter executions based on parameters
        filtered_executions = []
        
        for exec_id, exec_data in execution_store.items():
            if status and exec_data["status"] != status:
                continue
            if agent_id and exec_data["agent_id"] != agent_id:
                continue
            
            filtered_executions.append({
                "execution_id": exec_id,
                "agent_id": exec_data["agent_id"],
                "status": exec_data["status"],
                "started_at": exec_data["started_at"],
                "completed_at": exec_data.get("completed_at"),
                "duration": exec_data.get("duration")
            })
        
        # Apply pagination
        total_count = len(filtered_executions)
        paginated_executions = filtered_executions[offset:offset + limit]
        
        return create_success_response(
            data={
                "executions": paginated_executions,
                "total_count": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total_count
            },
            message="Executions retrieved successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list executions: {str(e)}"
        )

@router.delete("/executions/{execution_id}")
async def delete_execution(execution_id: str):
    """Delete an execution record"""
    try:
        # Check if execution exists
        if execution_id not in execution_store:
            raise HTTPException(
                status_code=404,
                detail=f"Execution '{execution_id}' not found"
            )
        
        # Remove execution
        del execution_store[execution_id]
        
        return create_success_response(
            data={"execution_id": execution_id},
            message=f"Execution '{execution_id}' deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete execution: {str(e)}"
        )

# Helper function to create execution record
def create_execution_record(
    execution_id: str,
    agent_id: str,
    status: str = "pending"
) -> Dict[str, Any]:
    """Create a new execution record"""
    record = {
        "execution_id": execution_id,
        "agent_id": agent_id,
        "status": status,
        "started_at": get_timestamp(),
        "created_at": get_timestamp()
    }
    
    execution_store[execution_id] = record
    return record

# Helper function to update execution record
def update_execution_record(
    execution_id: str,
    status: str = None,
    result: ExecutionResult = None,
    performance_metrics: PerformanceMetrics = None
) -> bool:
    """Update an execution record"""
    if execution_id not in execution_store:
        return False
    
    record = execution_store[execution_id]
    
    if status:
        record["status"] = status
        if status in ["completed", "failed", "cancelled"]:
            record["completed_at"] = get_timestamp()
            if "started_at" in record:
                duration = (record["completed_at"] - record["started_at"]).total_seconds()
                record["duration"] = duration
    
    if result:
        record["result"] = result
    
    if performance_metrics:
        record["performance_metrics"] = performance_metrics
    
    return True