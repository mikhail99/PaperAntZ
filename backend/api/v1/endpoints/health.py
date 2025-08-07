"""
Health check endpoints
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from datetime import datetime

from api.v1.models import HealthResponseModel, HealthResponse, HealthStatus, ServiceHealth
from utils.helpers import get_timestamp

router = APIRouter()

@router.get("/health", response_model=HealthResponseModel)
async def health_check():
    """Health check endpoint"""
    try:
        # Check all services (mock implementation)
        services_status = {
            "database": ServiceHealth(
                status=HealthStatus.HEALTHY,
                message="Database connection successful",
                last_check=datetime.now()
            ),
            "redis": ServiceHealth(
                status=HealthStatus.HEALTHY,
                message="Redis cache operational",
                last_check=datetime.now()
            ),
            "agents": ServiceHealth(
                status=HealthStatus.HEALTHY,
                message="All agents operational",
                last_check=datetime.now()
            ),
            "api": ServiceHealth(
                status=HealthStatus.HEALTHY,
                message="API endpoints responding",
                last_check=datetime.now()
            )
        }
        
        # Determine overall status
        overall_status = HealthStatus.HEALTHY
        for service in services_status.values():
            if service.status == HealthStatus.UNHEALTHY:
                overall_status = HealthStatus.UNHEALTHY
                break
            elif service.status == HealthStatus.DEGRADED and overall_status == HealthStatus.HEALTHY:
                overall_status = HealthStatus.DEGRADED
        
        health_response = HealthResponse(
            status=overall_status,
            timestamp=datetime.now(),
            version="1.0.0",
            services=services_status
        )
        
        return HealthResponseModel(
            success=True,
            message="Health check completed",
            data=health_response
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Health check failed: {str(e)}"
        )