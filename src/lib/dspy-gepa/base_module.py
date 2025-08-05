"""
Base module for DSPy-GEPA framework with prompt parameter management.
"""

import inspect
import time
from typing import Dict, List, Any, Iterator, Tuple, Optional, Callable
from enum import Enum

import dspy

from .types import (
    PromptText, ParameterName, ModulePath, Score, Timestamp,
    LearningMode, GEPAConfig, PerformanceMetrics
)
from .parameter import PromptParameter, ParameterState


class BasePromptModule(dspy.Module):
    """
    Base class for DSPy modules with prompt parameter management and optimization support.
    """
    
    def __init__(self):
        """Initialize the base prompt module"""
        super().__init__()
        
        # Core prompt management
        self._prompt_parameters: Dict[ParameterName, PromptParameter] = {}
        self._parameter_paths: Dict[ParameterName, ModulePath] = {}
        
        # Learning and optimization
        self._learning_enabled: bool = True
        self._learning_mode: LearningMode = LearningMode.HYBRID
        self._optimization_config: Optional[GEPAConfig] = None
        
        # Performance tracking
        self._performance_metrics = PerformanceMetrics()
        self._execution_count: int = 0
        self._total_execution_time: float = 0.0
        
        # Module state
        self._is_frozen: bool = False
        self._metadata: Dict[str, Any] = {}
        
        # Initialize DSPy attributes
        self._modules = {}
    
    # --- Parameter Management ---
    
    def register_prompt(self, name: str, prompt: str, 
                       metadata: Optional[Dict[str, Any]] = None) -> PromptParameter:
        """
        Register a prompt parameter.
        
        Args:
            name: Parameter name
            prompt: Prompt text
            metadata: Optional metadata
            
        Returns:
            Registered PromptParameter instance
        """
        if name in self._prompt_parameters:
            # Update existing parameter
            param = self._prompt_parameters[name]
            param.value = prompt
            param.metadata.update(metadata or {})
            param.last_updated = time.time()
            return param
        
        # Create new parameter
        param = PromptParameter(
            name=name,
            value=prompt,
            path=f"{self.__class__.__name__}.{name}",
            module=self,
            metadata=metadata or {}
        )
        
        self._prompt_parameters[name] = param
        self._parameter_paths[name] = param.path
        
        # Apply to actual DSPy module if it exists
        self._apply_prompt_to_module(name, prompt)
        
        return param
    
    def update_prompt(self, name: str, new_prompt: str, 
                     record_optimization: bool = True) -> bool:
        """
        Update a prompt parameter.
        
        Args:
            name: Parameter name
            new_prompt: New prompt text
            record_optimization: Whether to record this as an optimization
            
        Returns:
            True if successful, False otherwise
        """
        if name not in self._prompt_parameters:
            return False
        
        param = self._prompt_parameters[name]
        old_prompt = param.value
        
        # Update parameter
        param.value = new_prompt
        param.last_updated = time.time()
        
        # Apply to module
        self._apply_prompt_to_module(name, new_prompt)
        
        # Record optimization if requested
        if record_optimization:
            param.record_optimization(
                old_prompt=old_prompt,
                new_prompt=new_prompt,
                performance_change=0.0,  # Will be calculated during evaluation
                method="manual_update"
            )
        
        return True
    
    def get_prompt(self, name: str) -> Optional[PromptText]:
        """Get a prompt parameter value"""
        param = self._prompt_parameters.get(name)
        return param.value if param else None
    
    def has_prompt(self, name: str) -> bool:
        """Check if a prompt parameter exists"""
        return name in self._prompt_parameters
    
    def remove_prompt(self, name: str) -> bool:
        """Remove a prompt parameter"""
        if name in self._prompt_parameters:
            del self._prompt_parameters[name]
            if name in self._parameter_paths:
                del self._parameter_paths[name]
            return True
        return False
    
    def freeze_prompt(self, name: str) -> bool:
        """Freeze a prompt parameter to prevent optimization"""
        if name in self._prompt_parameters:
            self._prompt_parameters[name].freeze()
            return True
        return False
    
    def unfreeze_prompt(self, name: str) -> bool:
        """Unfreeze a prompt parameter to allow optimization"""
        if name in self._prompt_parameters:
            self._prompt_parameters[name].unfreeze()
            return True
        return False
    
    def is_prompt_frozen(self, name: str) -> bool:
        """Check if a prompt parameter is frozen"""
        param = self._prompt_parameters.get(name)
        return param.state == ParameterState.FROZEN if param else False
    
    # --- Parameter Access (PyTorch-like API) ---
    
    def parameters(self, recurse: bool = True) -> Iterator[PromptParameter]:
        """
        Return an iterator over module parameters.
        
        Args:
            recurse: If True, return parameters from all submodules
            
        Yields:
            PromptParameter instances
        """
        # Yield direct parameters
        for param in self._prompt_parameters.values():
            if param.is_optimizable():
                yield param
        
        # Recursively yield from submodules
        if recurse:
            for module in self.modules():
                yield from module.parameters(recurse=True)
    
    def named_parameters(self, recurse: bool = True) -> Iterator[Tuple[str, PromptParameter]]:
        """
        Return an iterator over module parameters, yielding both the name and parameter.
        
        Args:
            recurse: If True, return parameters from all submodules
            
        Yields:
            Tuples of (name, PromptParameter)
        """
        # Yield direct parameters
        for name, param in self._prompt_parameters.items():
            if param.is_optimizable():
                yield name, param
        
        # Recursively yield from submodules
        if recurse:
            for module_name, module in self.named_modules():
                if module_name:  # Skip empty module names
                    for name, param in module.named_parameters(recurse=False):
                        yield f"{module_name}.{name}", param
    
    # --- Module Access (PyTorch-like API) ---
    
    def modules(self) -> Iterator['BasePromptModule']:
        """
        Return an iterator over all modules in the network.
        
        Yields:
            BasePromptModule instances
        """
        for name, module in self.named_modules():
            yield module
    
    def named_modules(self, memo: Optional[set] = None, prefix: str = '') -> Iterator[Tuple[str, 'BasePromptModule']]:
        """
        Return an iterator over all modules in the network, yielding both the name and module.
        
        Args:
            memo: Set to track visited modules (prevent cycles)
            prefix: Current prefix for module names
            
        Yields:
            Tuples of (name, BasePromptModule)
        """
        if memo is None:
            memo = set()
        
        if self not in memo:
            memo.add(self)
            yield prefix, self
            
            # Iterate over attributes to find submodules
            for name, module in self.__dict__.items():
                if isinstance(module, BasePromptModule):
                    # Handle our base modules
                    submodule_prefix = f"{prefix}.{name}" if prefix else name
                    yield from module.named_modules(memo, submodule_prefix)
                elif isinstance(module, dspy.Module) and not isinstance(module, BasePromptModule):
                    # Handle regular DSPy modules
                    if hasattr(module, 'named_modules'):
                        submodule_prefix = f"{prefix}.{name}" if prefix else name
                        yield from module.named_modules(memo, submodule_prefix)
    
    # --- Prompt Application ---
    
    def _apply_prompt_to_module(self, name: str, prompt: str):
        """
        Apply a prompt to the actual DSPy module.
        
        Args:
            name: Parameter name
            prompt: Prompt text to apply
        """
        if hasattr(self, name):
            module = getattr(self, name)
            
            # Try to apply to signature
            if hasattr(module, 'signature') and hasattr(module.signature, 'instructions'):
                module.signature.instructions = prompt
            elif hasattr(module, 'predict') and hasattr(module.predict, 'signature'):
                module.predict.signature.instructions = prompt
            elif hasattr(module, 'instructions'):
                module.instructions = prompt
    
    def _apply_prompts(self):
        """Apply all registered prompts to their respective modules"""
        for name, param in self._prompt_parameters.items():
            if param.is_optimizable():
                self._apply_prompt_to_module(name, param.value)
    
    # --- Learning and Optimization ---
    
    def enable_learning(self, enabled: bool = True):
        """Enable or disable learning for this module"""
        self._learning_enabled = enabled
    
    def is_learning_enabled(self) -> bool:
        """Check if learning is enabled"""
        return self._learning_enabled
    
    def set_learning_mode(self, mode: LearningMode):
        """Set the learning mode"""
        self._learning_mode = mode
    
    def get_learning_mode(self) -> LearningMode:
        """Get the current learning mode"""
        return self._learning_mode
    
    def set_optimization_config(self, config: GEPAConfig):
        """Set optimization configuration"""
        self._optimization_config = config
    
    def get_optimization_config(self) -> Optional[GEPAConfig]:
        """Get optimization configuration"""
        return self._optimization_config
    
    def freeze(self):
        """Freeze the entire module (no optimization)"""
        self._is_frozen = True
        for param in self._prompt_parameters.values():
            param.freeze()
    
    def unfreeze(self):
        """Unfreeze the entire module"""
        self._is_frozen = False
        for param in self._prompt_parameters.values():
            if param.state != ParameterState.ARCHIVED:
                param.unfreeze()
    
    def is_frozen(self) -> bool:
        """Check if the module is frozen"""
        return self._is_frozen
    
    # --- Performance Tracking ---
    
    def record_execution(self, execution_time: float, metrics: Optional[Dict[str, float]] = None):
        """Record an execution event"""
        self._execution_count += 1
        self._total_execution_time += execution_time
        
        if metrics:
            self.update_performance_metrics(metrics)
    
    def update_performance_metrics(self, metrics: Dict[str, float]):
        """Update performance metrics"""
        self._performance_metrics.__dict__.update(metrics)
        
        # Also update parameter-specific metrics
        for param in self._prompt_parameters.values():
            param.update_metrics(metrics)
    
    def get_performance_metrics(self) -> PerformanceMetrics:
        """Get current performance metrics"""
        return self._performance_metrics
    
    def get_execution_stats(self) -> Dict[str, Any]:
        """Get execution statistics"""
        avg_time = self._total_execution_time / max(self._execution_count, 1)
        return {
            'execution_count': self._execution_count,
            'total_execution_time': self._total_execution_time,
            'average_execution_time': avg_time,
            'performance_metrics': self._performance_metrics.to_dict()
        }
    
    # --- Data Export/Import ---
    
    def get_prompt_dict(self, recurse: bool = True) -> Dict[str, PromptText]:
        """
        Get all prompts as a dictionary.
        
        Args:
            recurse: Include prompts from submodules
            
        Returns:
            Dictionary mapping parameter names to prompt values
        """
        prompt_dict = {}
        
        # Add direct prompts
        for name, param in self._prompt_parameters.items():
            if param.is_optimizable():
                prompt_dict[name] = param.value
        
        # Add submodule prompts
        if recurse:
            for module_name, module in self.named_modules():
                if module_name:  # Skip empty module names
                    for name, prompt in module.get_prompt_dict(recurse=False).items():
                        full_name = f"{module_name}.{name}"
                        prompt_dict[full_name] = prompt
        
        return prompt_dict
    
    def load_prompt_dict(self, prompt_dict: Dict[str, PromptText], recurse: bool = True):
        """
        Load prompts from a dictionary.
        
        Args:
            prompt_dict: Dictionary of parameter names to prompt values
            recurse: Apply to submodules as well
        """
        # Load direct prompts
        for name, prompt in prompt_dict.items():
            if '.' not in name:  # Direct parameter
                if self.has_prompt(name):
                    self.update_prompt(name, prompt, record_optimization=False)
                else:
                    self.register_prompt(name, prompt)
        
        # Load submodule prompts
        if recurse:
            submodule_prompts = {}
            for name, prompt in prompt_dict.items():
                if '.' in name:  # Submodule parameter
                    module_name, param_name = name.split('.', 1)
                    if module_name not in submodule_prompts:
                        submodule_prompts[module_name] = {}
                    submodule_prompts[module_name][param_name] = prompt
            
            # Apply to submodules
            for module_name, prompts in submodule_prompts.items():
                if hasattr(self, module_name):
                    module = getattr(self, module_name)
                    if isinstance(module, BasePromptModule):
                        module.load_prompt_dict(prompts, recurse=False)
    
    def get_module_info(self) -> Dict[str, Any]:
        """
        Get comprehensive module information.
        
        Returns:
            Dictionary with module information
        """
        return {
            'class_name': self.__class__.__name__,
            'module_id': id(self),
            'learning_enabled': self._learning_enabled,
            'learning_mode': self._learning_mode.value,
            'is_frozen': self._is_frozen,
            'prompt_count': len(self._prompt_parameters),
            'prompts': {name: param.value for name, param in self._prompt_parameters.items()},
            'submodules': [name for name, _ in self.named_modules()],
            'performance_metrics': self._performance_metrics.to_dict(),
            'execution_stats': self.get_execution_stats(),
            'optimization_config': self._optimization_config.to_dict() if self._optimization_config else None,
            'metadata': self._metadata,
            'source_code': inspect.getsource(self.__class__)
        }
    
    # --- Metadata ---
    
    def set_metadata(self, key: str, value: Any):
        """Set metadata value"""
        self._metadata[key] = value
    
    def get_metadata(self, key: str, default: Any = None) -> Any:
        """Get metadata value"""
        return self._metadata.get(key, default)
    
    def get_all_metadata(self) -> Dict[str, Any]:
        """Get all metadata"""
        return self._metadata.copy()
    
    # --- String Representation ---
    
    def __repr__(self) -> str:
        """String representation"""
        return (f"{self.__class__.__name__}("
                f"prompts={len(self._prompt_parameters)}, "
                f"learning={'enabled' if self._learning_enabled else 'disabled'}, "
                f"frozen={'yes' if self._is_frozen else 'no'})")
    
    def __str__(self) -> str:
        """Human-readable string representation"""
        lines = [f"{self.__class__.__name__}:"]
        lines.append(f"  Learning: {'enabled' if self._learning_enabled else 'disabled'}")
        lines.append(f"  Mode: {self._learning_mode.value}")
        lines.append(f"  Frozen: {'yes' if self._is_frozen else 'no'}")
        lines.append(f"  Prompts: {len(self._prompt_parameters)}")
        
        if self._prompt_parameters:
            lines.append("  Prompt Parameters:")
            for name, param in self._prompt_parameters.items():
                status = "frozen" if param.state == ParameterState.FROZEN else "active"
                lines.append(f"    {name}: {status} ({len(param.optimization_history)} optimizations)")
        
        return "\n".join(lines)