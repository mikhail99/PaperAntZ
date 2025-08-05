"""
Type definitions for the DSPy-GEPA Research Assistant framework.

This module contains all type definitions used throughout the framework,
providing a centralized location for type annotations and ensuring consistency
across the codebase.
"""

from typing import (
    Any, Dict, List, Tuple, Optional, Union, Callable, Iterator, 
    Set, FrozenSet, Sequence, TypedDict, TypeVar, Generic
)
from dataclasses import dataclass
from enum import Enum
import asyncio
from datetime import datetime

# Basic type aliases
PromptText = str
ParameterName = str
ModulePath = str
Score = float
Timestamp = float
JSONSerializable = Union[str, int, float, bool, List, Dict, None]

# Type variables for generic types
T = TypeVar('T')
ModuleType = TypeVar('ModuleType', bound='BasePromptModule')
ResultType = TypeVar('ResultType')

# --- Core Framework Types ---

class OptimizationStatus(Enum):
    """Status of optimization processes"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class LearningMode(Enum):
    """Learning modes for agents"""
    DISABLED = "disabled"
    ONLINE = "online"
    OFFLINE = "offline"
    HYBRID = "hybrid"

class AgentRole(Enum):
    """Roles for research agents"""
    PLANNING = "planning"
    RESEARCH = "research"
    WRITING = "writing"
    REVIEW = "review"
    COORDINATION = "coordination"

class TaskType(Enum):
    """Types of research tasks"""
    PLANNING = "planning"
    RESEARCH = "research"
    ANALYSIS = "analysis"
    SYNTHESIS = "synthesis"
    WRITING = "writing"
    REVIEW = "review"
    OPTIMIZATION = "optimization"

# --- Data Structures ---

@dataclass
class Task:
    """Represents a research task"""
    id: str
    type: TaskType
    description: str
    input_data: Dict[str, Any]
    expected_output: Optional[str] = None
    priority: int = 1
    created_at: datetime = None
    deadline: Optional[datetime] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()

@dataclass
class TaskResult:
    """Represents the result of a task execution"""
    task_id: str
    success: bool
    output: Any
    execution_time: float
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

@dataclass
class ExecutionTrace:
    """Represents an execution trace for learning"""
    task_id: str
    module_path: str
    input_data: Dict[str, Any]
    output_data: Dict[str, Any]
    prompt_used: str
    execution_time: float
    timestamp: datetime
    intermediate_steps: List[Dict[str, Any]] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.intermediate_steps is None:
            self.intermediate_steps = []
        if self.metadata is None:
            self.metadata = {}

@dataclass
class OptimizationRecord:
    """Represents a single optimization record"""
    parameter_name: str
    old_prompt: PromptText
    new_prompt: PromptText
    performance_change: Score
    timestamp: datetime
    optimization_method: str
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

@dataclass
class PerformanceMetrics:
    """Performance metrics for evaluation"""
    accuracy: Optional[float] = None
    relevance: Optional[float] = None
    completeness: Optional[float] = None
    coherence: Optional[float] = None
    efficiency: Optional[float] = None
    user_satisfaction: Optional[float] = None
    cost: Optional[float] = None
    execution_time: Optional[float] = None
    custom_metrics: Dict[str, float] = None
    
    def __post_init__(self):
        if self.custom_metrics is None:
            self.custom_metrics = {}
    
    def to_dict(self) -> Dict[str, float]:
        """Convert to dictionary"""
        result = {k: v for k, v in self.__dict__.items() if v is not None and k != 'custom_metrics'}
        result.update(self.custom_metrics)
        return result

# --- Configuration Types ---

@dataclass
class GEPAConfig:
    """Configuration for GEPA optimization"""
    population_size: int = 10
    generations: int = 5
    mutation_rate: float = 0.3
    crossover_rate: float = 0.7
    tournament_size: int = 3
    elitism_count: int = 2
    reflection_model: str = "gemini-1.5-flash"
    max_prompt_length: int = 4000
    budget: int = 15
    convergence_threshold: float = 0.01
    max_iterations: int = 100
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return self.__dict__

@dataclass
class AgentConfig:
    """Configuration for individual agents"""
    role: AgentRole
    model_name: str
    temperature: float = 0.7
    max_tokens: int = 2000
    learning_enabled: bool = True
    optimization_config: Optional[GEPAConfig] = None
    
    def __post_init__(self):
        if self.optimization_config is None:
            self.optimization_config = GEPAConfig()

@dataclass
class SystemConfig:
    """System-wide configuration"""
    agents: List[AgentConfig]
    global_learning_mode: LearningMode = LearningMode.HYBRID
    default_model: str = "gemini-1.5-flash"
    storage_backend: str = "json"
    log_level: str = "INFO"
    enable_metrics: bool = True
    max_concurrent_tasks: int = 5
    
    def get_agent_config(self, role: AgentRole) -> Optional[AgentConfig]:
        """Get configuration for a specific agent role"""
        for agent_config in self.agents:
            if agent_config.role == role:
                return agent_config
        return None

# --- Research-Specific Types ---

@dataclass
class ResearchQuestion:
    """Represents a research question"""
    text: str
    domain: Optional[str] = None
    complexity: int = 1  # 1-10 scale
    keywords: List[str] = None
    context: Optional[str] = None
    
    def __post_init__(self):
        if self.keywords is None:
            self.keywords = []

@dataclass
class Document:
    """Represents a research document"""
    id: str
    title: str
    content: str
    source: str
    metadata: Dict[str, Any] = None
    relevance_score: Optional[float] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

@dataclass
class ResearchPlan:
    """Represents a research plan"""
    question: ResearchQuestion
    outline: List[str]
    required_documents: List[str]
    methodology: str
    estimated_duration: str
    success_criteria: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'question': self.question.text,
            'outline': self.outline,
            'required_documents': self.required_documents,
            'methodology': self.methodology,
            'estimated_duration': self.estimated_duration,
            'success_criteria': self.success_criteria
        }

@dataclass
class ResearchFinding:
    """Represents a research finding"""
    document_id: str
    content: str
    relevance_score: float
    confidence: float
    source_excerpts: List[str]
    analysis_notes: str
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'document_id': self.document_id,
            'content': self.content,
            'relevance_score': self.relevance_score,
            'confidence': self.confidence,
            'source_excerpts': self.source_excerpts,
            'analysis_notes': self.analysis_notes
        }

@dataclass
class ResearchReport:
    """Represents a complete research report"""
    id: str
    question: ResearchQuestion
    plan: ResearchPlan
    findings: List[ResearchFinding]
    synthesis: str
    conclusion: str
    references: List[str]
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'id': self.id,
            'question': self.question.text,
            'plan': self.plan.to_dict(),
            'findings': [f.to_dict() for f in self.findings],
            'synthesis': self.synthesis,
            'conclusion': self.conclusion,
            'references': self.references,
            'metadata': self.metadata
        }

# --- TypedDicts for JSON Serialization ---

class PromptParameterDict(TypedDict):
    """TypedDict for prompt parameter serialization"""
    name: str
    value: str
    path: str
    optimization_history: List[Dict[str, Any]]
    performance_metrics: Dict[str, float]

class ExecutionTraceDict(TypedDict):
    """TypedDict for execution trace serialization"""
    task_id: str
    module_path: str
    input_data: Dict[str, Any]
    output_data: Dict[str, Any]
    prompt_used: str
    execution_time: float
    timestamp: str
    intermediate_steps: List[Dict[str, Any]]
    metadata: Dict[str, Any]

class OptimizationRecordDict(TypedDict):
    """TypedDict for optimization record serialization"""
    parameter_name: str
    old_prompt: str
    new_prompt: str
    performance_change: float
    timestamp: str
    optimization_method: str
    metadata: Dict[str, Any]

# --- Function Types ---

EvaluationFunction = Callable[[Any], Score]
AsyncEvaluationFunction = Callable[[Any], asyncio.Future[Score]]
OptimizationFunction = Callable[[Any], Any]
AsyncOptimizationFunction = Callable[[Any], asyncio.Future[Any]]
LearningFunction = Callable[[List[ExecutionTrace]], None]
AsyncLearningFunction = Callable[[List[ExecutionTrace]], asyncio.Future[None]]

# --- Collection Types ---

PromptParameters = Dict[ParameterName, 'PromptParameter']
ExecutionTraces = List[ExecutionTrace]
OptimizationHistory = List[OptimizationRecord]
PerformanceMetricsDict = Dict[str, PerformanceMetrics]
TaskQueue = List[Task]
ResultsDict = Dict[str, TaskResult]

# --- Generic Types for Framework Components ---

class ModuleRegistry(Generic[ModuleType]):
    """Generic registry for framework modules"""
    def __init__(self):
        self._modules: Dict[str, ModuleType] = {}
    
    def register(self, name: str, module: ModuleType):
        """Register a module"""
        self._modules[name] = module
    
    def get(self, name: str) -> Optional[ModuleType]:
        """Get a registered module"""
        return self._modules.get(name)
    
    def list_modules(self) -> List[str]:
        """List all registered module names"""
        return list(self._modules.keys())

class ResultCache(Generic[ResultType]):
    """Generic cache for results"""
    def __init__(self, max_size: int = 1000):
        self._cache: Dict[str, ResultType] = {}
        self._max_size = max_size
        self._access_times: Dict[str, float] = {}
    
    def get(self, key: str) -> Optional[ResultType]:
        """Get cached result"""
        if key in self._cache:
            self._access_times[key] = asyncio.get_event_loop().time()
            return self._cache[key]
        return None
    
    def set(self, key: str, value: ResultType):
        """Set cached result"""
        if len(self._cache) >= self._max_size:
            # Remove least recently used
            lru_key = min(self._access_times.keys(), key=lambda k: self._access_times[k])
            del self._cache[lru_key]
            del self._access_times[lru_key]
        
        self._cache[key] = value
        self._access_times[key] = asyncio.get_event_loop().time()
    
    def clear(self):
        """Clear cache"""
        self._cache.clear()
        self._access_times.clear()

# --- Type Validation ---

def validate_prompt_text(prompt: str) -> bool:
    """Validate prompt text"""
    if not isinstance(prompt, str):
        return False
    if len(prompt.strip()) == 0:
        return False
    if len(prompt) > 10000:  # Reasonable upper limit
        return False
    return True

def validate_parameter_name(name: str) -> bool:
    """Validate parameter name"""
    if not isinstance(name, str):
        return False
    if len(name.strip()) == 0:
        return False
    if not name.replace('_', '').replace('.', '').isalnum():
        return False
    return True

def validate_score(score: float) -> bool:
    """Validate score"""
    if not isinstance(score, (int, float)):
        return False
    return 0.0 <= score <= 1.0

# --- Type Conversion Utilities ---

def serialize_datetime(dt: datetime) -> str:
    """Serialize datetime to ISO string"""
    return dt.isoformat()

def deserialize_datetime(dt_str: str) -> datetime:
    """Deserialize datetime from ISO string"""
    return datetime.fromisoformat(dt_str)

def to_json_serializable(obj: Any) -> JSONSerializable:
    """Convert object to JSON serializable format"""
    if isinstance(obj, datetime):
        return serialize_datetime(obj)
    elif isinstance(obj, Enum):
        return obj.value
    elif hasattr(obj, 'to_dict'):
        return obj.to_dict()
    elif isinstance(obj, (list, tuple)):
        return [to_json_serializable(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: to_json_serializable(v) for k, v in obj.items()}
    else:
        return obj

# --- Common Type Aliases for Framework Usage ---

# Type hints for common return types
MaybePrompt = Optional[PromptText]
PromptList = List[PromptText]
ParameterList = List['PromptParameter']
ModuleList = List['BasePromptModule']
TaskResultDict = Dict[str, TaskResult]
MetricsDict = Dict[str, float]
ConfigDict = Dict[str, Any]

# Async type hints
AsyncTaskResult = asyncio.Future[TaskResult]
AsyncResearchReport = asyncio.Future[ResearchReport]
AsyncOptimizationResult = asyncio.Future['BasePromptModule']

# Collection type hints
PromptRegistry = Dict[ParameterName, PromptText]
ModuleRegistryDict = Dict[str, 'BasePromptModule']
TraceCollection = List[ExecutionTrace]
MetricsCollection = Dict[str, PerformanceMetrics]

# Export all important types for easy importing
__all__ = [
    # Basic types
    'PromptText', 'ParameterName', 'ModulePath', 'Score', 'Timestamp',
    'JSONSerializable',
    
    # Enums
    'OptimizationStatus', 'LearningMode', 'AgentRole', 'TaskType',
    
    # Data classes
    'Task', 'TaskResult', 'ExecutionTrace', 'OptimizationRecord',
    'PerformanceMetrics', 'GEPAConfig', 'AgentConfig', 'SystemConfig',
    'ResearchQuestion', 'Document', 'ResearchPlan', 'ResearchFinding',
    'ResearchReport',
    
    # TypedDicts
    'PromptParameterDict', 'ExecutionTraceDict', 'OptimizationRecordDict',
    
    # Function types
    'EvaluationFunction', 'AsyncEvaluationFunction', 'OptimizationFunction',
    'AsyncOptimizationFunction', 'LearningFunction', 'AsyncLearningFunction',
    
    # Collection types
    'PromptParameters', 'ExecutionTraces', 'OptimizationHistory',
    'PerformanceMetricsDict', 'TaskQueue', 'ResultsDict',
    
    # Generic classes
    'ModuleRegistry', 'ResultCache',
    
    # Common aliases
    'MaybePrompt', 'PromptList', 'ParameterList', 'ModuleList',
    'TaskResultDict', 'MetricsDict', 'ConfigDict',
    'AsyncTaskResult', 'AsyncResearchReport', 'AsyncOptimizationResult',
    'PromptRegistry', 'ModuleRegistryDict', 'TraceCollection',
    'MetricsCollection',
    
    # Validation functions
    'validate_prompt_text', 'validate_parameter_name', 'validate_score',
    
    # Conversion utilities
    'serialize_datetime', 'deserialize_datetime', 'to_json_serializable',
]