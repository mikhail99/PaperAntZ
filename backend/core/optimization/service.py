"""
Mock Optimization Service for testing purposes
"""

import asyncio
import uuid
from typing import Dict, Any
from datetime import datetime

from api.v1.models import OptimizationConfig, OptimizationSession, OptimizationStatus

class MockOptimizationService:
    """Mock optimization service for testing RAG functionality"""
    
    def __init__(self):
        self.optimizations: Dict[str, Dict[str, Any]] = {}
    
    async def start_optimization(self, config: OptimizationConfig) -> str:
        """Start a mock optimization session"""
        optimization_id = str(uuid.uuid4())
        
        # Store optimization session data
        self.optimizations[optimization_id] = {
            "config": config,
            "status": OptimizationStatus.RUNNING,
            "created_at": datetime.now(),
            "started_at": datetime.now(),
            "progress": 0.0
        }
        
        return optimization_id
    
    async def get_optimization_status(self, optimization_id: str) -> OptimizationSession:
        """Get optimization session status"""
        if optimization_id not in self.optimizations:
            return None
            
        opt_data = self.optimizations[optimization_id]
        
        return OptimizationSession(
            session_id=optimization_id,
            module_id="mock_module",
            status=opt_data["status"],
            config=opt_data["config"],
            created_at=opt_data["created_at"],
            started_at=opt_data["started_at"],
            best_fitness=0.85,  # Mock fitness score
            generations_completed=3
        )
    
    async def stop_optimization(self, optimization_id: str) -> bool:
        """Stop an optimization session"""
        if optimization_id in self.optimizations:
            self.optimizations[optimization_id]["status"] = OptimizationStatus.CANCELLED
            return True
        return False

# Global instance
optimization_service = MockOptimizationService()