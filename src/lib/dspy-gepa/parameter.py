"""
Prompt parameter dataclass for the DSPy-GEPA framework.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
from enum import Enum
import time

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .base_module import BasePromptModule

from .types import OptimizationRecord, PerformanceMetrics


class ParameterState(Enum):
    """States for prompt parameters"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    FROZEN = "frozen"
    ARCHIVED = "archived"


@dataclass
class PromptParameter:
    """
    Represents a prompt parameter in a DSPy module with optimization metadata.
    """
    name: str
    value: str
    path: str
    module: 'BasePromptModule'  # Forward reference
    state: ParameterState = ParameterState.ACTIVE
    optimization_history: List[OptimizationRecord] = field(default_factory=list)
    performance_metrics: PerformanceMetrics = field(default_factory=PerformanceMetrics)
    created_at: float = field(default_factory=time.time)
    last_updated: float = field(default_factory=time.time)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def __post_init__(self):
        """Initialize default values after creation"""
        if not self.optimization_history:
            self.optimization_history = []
        if not self.performance_metrics:
            self.performance_metrics = PerformanceMetrics()
        if not self.metadata:
            self.metadata = {}
    
    def record_optimization(self, old_prompt: str, new_prompt: str, 
                           performance_change: float, method: str = "GEPA",
                           metadata: Optional[Dict[str, Any]] = None):
        """Record an optimization event for this parameter"""
        record = OptimizationRecord(
            parameter_name=self.name,
            old_prompt=old_prompt,
            new_prompt=new_prompt,
            performance_change=performance_change,
            timestamp=time.time(),
            optimization_method=method,
            metadata=metadata or {}
        )
        self.optimization_history.append(record)
        self.last_updated = time.time()
    
    def update_metrics(self, metrics: Dict[str, float]):
        """Update performance metrics"""
        for key, value in metrics.items():
            if hasattr(self.performance_metrics, key):
                setattr(self.performance_metrics, key, value)
            else:
                # Custom metrics go into the custom_metrics dictionary
                self.performance_metrics.custom_metrics[key] = value
        self.last_updated = time.time()
    
    def freeze(self):
        """Freeze this parameter to prevent further optimization"""
        self.state = ParameterState.FROZEN
        self.last_updated = time.time()
    
    def unfreeze(self):
        """Unfreeze this parameter to allow optimization"""
        self.state = ParameterState.ACTIVE
        self.last_updated = time.time()
    
    def is_optimizable(self) -> bool:
        """Check if this parameter can be optimized"""
        return self.state == ParameterState.ACTIVE
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            'name': self.name,
            'value': self.value,
            'path': self.path,
            'state': self.state.value,
            'optimization_history': [
                {
                    'parameter_name': r.parameter_name,
                    'old_prompt': r.old_prompt,
                    'new_prompt': r.new_prompt,
                    'performance_change': r.performance_change,
                    'timestamp': r.timestamp,
                    'optimization_method': r.optimization_method,
                    'metadata': r.metadata
                }
                for r in self.optimization_history
            ],
            'performance_metrics': self.performance_metrics.to_dict(),
            'created_at': self.created_at,
            'last_updated': self.last_updated,
            'metadata': self.metadata
        }