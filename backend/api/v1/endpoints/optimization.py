"""
Optimization service endpoints
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional, Dict, Any

from api.v1.models import (
    OptimizationResponse, OptimizationListResponse, OptimizationSession, OptimizationConfig
)
from core.optimization import optimization_service
from utils.helpers import create_success_response, create_error_response

router = APIRouter()

@router.post("/optimization/sessions", response_model=OptimizationResponse)
async def start_optimization(config: OptimizationConfig):
    """Start an optimization session"""
    try:
        # Simple optimization session creation with mock data
        agent_id = "mock_agent"
        optimization_type = "prompt_optimization"
        
        # Start optimization
        optimization_id = await optimization_service.start_optimization(config)
        
        # Create session object  
        from datetime import datetime
        optimization_session = OptimizationSession(
            session_id=optimization_id,
            module_id=agent_id,
            status="running",
            config=config,
            created_at=datetime.now(),
            started_at=datetime.now()
        )
        
        return OptimizationResponse(
            success=True,
            message="Optimization session started successfully",
            data=optimization_session
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start optimization: {str(e)}"
        )

@router.get("/optimization/sessions/{optimization_id}", response_model=OptimizationResponse)
async def get_optimization_status(optimization_id: str):
    """Get optimization status and results"""
    try:
        optimization_result = await optimization_service.get_optimization_status(optimization_id)
        
        if not optimization_result:
            raise HTTPException(
                status_code=404,
                detail=f"Optimization session '{optimization_id}' not found"
            )
        
        return OptimizationResponse(
            success=True,
            message=f"Optimization status for '{optimization_id}' retrieved",
            data=optimization_result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get optimization status: {str(e)}"
        )

@router.post("/optimization/sessions/{optimization_id}/cancel")
async def cancel_optimization(optimization_id: str):
    """Cancel a running optimization"""
    try:
        success = await optimization_service.cancel_optimization(optimization_id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Optimization session '{optimization_id}' not found or cannot be cancelled"
            )
        
        return create_success_response(
            data={
                "optimization_id": optimization_id,
                "status": "cancelled",
                "cancelled_at": optimization_service.optimizations[optimization_id]["completed_at"].isoformat()
            },
            message=f"Optimization session '{optimization_id}' cancelled successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cancel optimization: {str(e)}"
        )

@router.get("/optimization/sessions")
async def list_optimizations(
    status: str = None,
    agent_id: str = None,
    limit: int = 20,
    offset: int = 0
):
    """List all optimization sessions"""
    try:
        optimizations = optimization_service.get_all_optimizations()
        
        # Filter by status if specified
        if status:
            optimizations = [opt for opt in optimizations if opt["status"] == status]
        
        # Filter by agent_id if specified
        if agent_id:
            optimizations = [opt for opt in optimizations if opt["agent_id"] == agent_id]
        
        # Apply pagination
        total_count = len(optimizations)
        paginated_optimizations = optimizations[offset:offset + limit]
        
        return create_success_response(
            data={
                "optimizations": paginated_optimizations,
                "total_count": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": offset + limit < total_count
            },
            message="Optimization sessions retrieved successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list optimization sessions: {str(e)}"
        )

@router.delete("/optimization/sessions/{optimization_id}")
async def delete_optimization(optimization_id: str):
    """Delete an optimization session"""
    try:
        # Check if optimization exists
        if optimization_id not in optimization_service.optimizations:
            raise HTTPException(
                status_code=404,
                detail=f"Optimization session '{optimization_id}' not found"
            )
        
        # Cancel if running
        if optimization_id in optimization_service.running_optimizations:
            await optimization_service.cancel_optimization(optimization_id)
        
        # Remove optimization
        del optimization_service.optimizations[optimization_id]
        
        return create_success_response(
            data={"optimization_id": optimization_id},
            message=f"Optimization session '{optimization_id}' deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete optimization session: {str(e)}"
        )

@router.get("/optimization/sessions/{optimization_id}/progress")
async def get_optimization_progress(optimization_id: str):
    """Get detailed optimization progress"""
    try:
        if optimization_id not in optimization_service.optimizations:
            raise HTTPException(
                status_code=404,
                detail=f"Optimization session '{optimization_id}' not found"
            )
        
        opt_data = optimization_service.optimizations[optimization_id]
        
        progress_data = {
            "optimization_id": optimization_id,
            "agent_id": opt_data["agent_id"],
            "status": opt_data["status"],
            "progress": opt_data.get("progress", 0.0),
            "current_generation": opt_data.get("current_generation", 0),
            "total_generations": opt_data.get("total_generations", 0),
            "best_score": opt_data.get("best_score", 0.0),
            "best_prompt": opt_data.get("best_prompt"),
            "population_size": len(opt_data.get("population", [])),
            "started_at": opt_data["started_at"].isoformat(),
            "estimated_completion": None
        }
        
        # Estimate completion time
        if opt_data["status"] == "running" and opt_data.get("progress", 0) > 0:
            elapsed_time = (datetime.now() - opt_data["started_at"]).total_seconds()
            estimated_total = elapsed_time / opt_data["progress"]
            remaining_time = estimated_total - elapsed_time
            progress_data["estimated_completion"] = {
                "remaining_seconds": remaining_time,
                "estimated_completion_time": (datetime.now().timestamp() + remaining_time)
            }
        
        return create_success_response(
            data=progress_data,
            message="Optimization progress retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get optimization progress: {str(e)}"
        )

@router.get("/optimization/sessions/{optimization_id}/population")
async def get_optimization_population(optimization_id: str):
    """Get current population of optimization"""
    try:
        if optimization_id not in optimization_service.optimizations:
            raise HTTPException(
                status_code=404,
                detail=f"Optimization session '{optimization_id}' not found"
            )
        
        opt_data = optimization_service.optimizations[optimization_id]
        population = opt_data.get("population", [])
        
        # Return population with fitness scores (sorted by fitness)
        sorted_population = sorted(population, key=lambda x: x.get("fitness_score", 0), reverse=True)
        
        population_data = {
            "optimization_id": optimization_id,
            "population_size": len(sorted_population),
            "individuals": [
                {
                    "rank": i + 1,
                    "prompt": ind["prompt"],
                    "fitness_score": ind.get("fitness_score", 0)
                }
                for i, ind in enumerate(sorted_population[:10])  # Top 10 individuals
            ],
            "best_individual": sorted_population[0] if sorted_population else None,
            "worst_individual": sorted_population[-1] if sorted_population else None,
            "average_fitness": sum(ind.get("fitness_score", 0) for ind in sorted_population) / len(sorted_population) if sorted_population else 0
        }
        
        return create_success_response(
            data=population_data,
            message="Optimization population retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get optimization population: {str(e)}"
        )

@router.post("/optimization/cleanup")
async def cleanup_optimizations(
    background_tasks: BackgroundTasks,
    max_age_hours: int = 24
):
    """Clean up old optimization sessions"""
    try:
        # Run cleanup in background
        background_tasks.add_task(
            optimization_service.cleanup_completed_optimizations,
            max_age_hours
        )
        
        return create_success_response(
            data={"max_age_hours": max_age_hours},
            message=f"Optimization cleanup initiated for sessions older than {max_age_hours} hours"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate optimization cleanup: {str(e)}"
        )

@router.get("/optimization/stats")
async def get_optimization_stats():
    """Get optimization service statistics"""
    try:
        optimizations = optimization_service.get_all_optimizations()
        
        # Calculate statistics
        total_optimizations = len(optimizations)
        status_counts = {}
        agent_counts = {}
        type_counts = {}
        
        for opt in optimizations:
            # Count by status
            status = opt["status"]
            status_counts[status] = status_counts.get(status, 0) + 1
            
            # Count by agent
            agent_id = opt["agent_id"]
            agent_counts[agent_id] = agent_counts.get(agent_id, 0) + 1
            
            # Count by type (would need to be stored in optimization data)
            # For now, using placeholder
            opt_type = "prompt_optimization"  # Default
            type_counts[opt_type] = type_counts.get(opt_type, 0) + 1
        
        # Calculate average scores
        completed_optimizations = [opt for opt in optimizations if opt["status"] == "completed"]
        avg_best_score = 0.0
        if completed_optimizations:
            avg_best_score = sum(opt.get("best_score", 0) for opt in completed_optimizations) / len(completed_optimizations)
        
        stats = {
            "total_optimizations": total_optimizations,
            "status_distribution": status_counts,
            "agent_distribution": agent_counts,
            "type_distribution": type_counts,
            "completed_optimizations": len(completed_optimizations),
            "running_optimizations": len(optimization_service.running_optimizations),
            "average_best_score": avg_best_score,
            "success_rate": len(completed_optimizations) / max(1, total_optimizations)
        }
        
        return create_success_response(
            data=stats,
            message="Optimization statistics retrieved successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get optimization statistics: {str(e)}"
        )