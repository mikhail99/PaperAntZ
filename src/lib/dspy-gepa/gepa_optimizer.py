"""
GEPA (Genetic-Evolutionary Prompt Architecture) Optimizer.

This module implements genetic-evolutionary optimization for DSPy modules
using natural language reflection and population-based search.
"""

import copy
import random
import asyncio
import time
from typing import List, Dict, Any, Optional, Callable, Tuple
from dataclasses import dataclass

import dspy

from .base_module import BasePromptModule
from .types import GEPAConfig, ExecutionTrace, AsyncEvaluationFunction


class ReflectionModel(dspy.Module):
    """Real LLM-based reflection model for GEPA optimization."""
    
    def __init__(self):
        super().__init__()
        self.reflect = dspy.Predict(
            "prompt, traces, performance -> improved_prompt"
        )
    
    def forward(self, prompt: str, traces: List[ExecutionTrace], performance: float) -> str:
        """Generate reflection-based prompt improvement."""
        # Format traces for reflection
        traces_text = ""
        for i, trace in enumerate(traces):
            traces_text += f"""
Trace {i+1}:
Input: {trace.input_data}
Output: {trace.output_data}
Execution Time: {trace.execution_time:.3f}s
"""
        
        # Create reflection context
        context = f"""
Current Performance: {performance:.3f}

Current Prompt: {prompt}

Execution Traces:
{traces_text}

Analyze these execution traces and suggest an improved version of the prompt that would lead to better performance. Focus on:
1. Clarity and specificity
2. Better task understanding
3. More effective instructions
4. Domain-specific improvements

Provide only the improved prompt, no explanations.
"""
        
        result = self.reflect(context=context, prompt=prompt, traces=traces_text, performance=performance)
        return result.improved_prompt


class GEPAOptimizer:
    """
    GEPA Optimizer for DSPy modules.
    
    Uses genetic-evolutionary algorithms with natural language reflection
    to optimize prompt parameters in DSPy modules.
    """
    
    def __init__(self, config: Optional[GEPAConfig] = None):
        """
        Initialize GEPA Optimizer.
        
        Args:
            config: GEPA configuration parameters
        """
        self.config = config or GEPAConfig()
        self.generation = 0
        self.best_fitness = float('-inf')
        self.optimization_history = []
        
        # Initialize reflection model with real LLM
        self.reflection_model = self._get_reflection_model()
        
    def _get_reflection_model(self) -> ReflectionModel:
        """Get the reflection model with real LLM integration."""
        return ReflectionModel()
    
    async def optimize_module(
        self, 
        module: BasePromptModule, 
        evaluation_fn: AsyncEvaluationFunction,
        task_examples: Optional[List[Any]] = None
    ) -> BasePromptModule:
        """
        Optimize a DSPy module using GEPA.
        
        Args:
            module: The DSPy module to optimize
            evaluation_fn: Async function to evaluate module performance
            task_examples: Optional list of task examples for evaluation
        
        Returns:
            Optimized module
        """
        if not module.is_learning_enabled():
            return module
            
        self.generation = 0
        self.best_fitness = float('-inf')
        self.optimization_history = []
        
        # Create initial population
        population = await self._create_initial_population(module)
        
        # Initialize best individual
        best_individual = copy.deepcopy(population[0])
        
        # Optimization loop
        for generation in range(self.config.generations):
            self.generation = generation
            
            # Evaluate population
            fitness_scores = await self._evaluate_population(
                population, evaluation_fn, task_examples
            )
            
            # Track best individual
            current_best_idx = fitness_scores.index(max(fitness_scores))
            current_best_fitness = fitness_scores[current_best_idx]
            
            if current_best_fitness > self.best_fitness:
                self.best_fitness = current_best_fitness
                best_individual = copy.deepcopy(population[current_best_idx])
            
            # Record generation stats
            self.optimization_history.append({
                'generation': generation,
                'best_fitness': current_best_fitness,
                'avg_fitness': sum(fitness_scores) / len(fitness_scores),
                'population_size': len(population)
            })
            
            # Check convergence
            if self._check_convergence(fitness_scores):
                break
            
            # Create next generation
            population = await self._create_next_generation(
                population, fitness_scores, evaluation_fn, task_examples
            )
        
        return best_individual
    
    async def _create_initial_population(self, module: BasePromptModule) -> List[BasePromptModule]:
        """
        Create initial population of prompt variations.
        
        Args:
            module: Base module to create variations from
        
        Returns:
            List of module variations
        """
        population = []
        
        # Include original module
        population.append(copy.deepcopy(module))
        
        # Create variations through mutation
        for _ in range(self.config.population_size - 1):
            variant = copy.deepcopy(module)
            await self._mutate_module(variant, mutation_strength=0.5)
            population.append(variant)
        
        return population
    
    async def _evaluate_population(
        self, 
        population: List[BasePromptModule], 
        evaluation_fn: AsyncEvaluationFunction,
        task_examples: Optional[List[Any]] = None
    ) -> List[float]:
        """
        Evaluate all individuals in the population.
        
        Args:
            population: List of modules to evaluate
            evaluation_fn: Evaluation function
            task_examples: Optional task examples
        
        Returns:
            List of fitness scores
        """
        fitness_scores = []
        
        for individual in population:
            try:
                # Evaluate the individual
                if task_examples:
                    # Evaluate on multiple examples
                    scores = []
                    for example in task_examples:
                        score = await evaluation_fn(individual, example)
                        scores.append(score)
                    fitness = sum(scores) / len(scores)
                else:
                    # Single evaluation
                    fitness = await evaluation_fn(individual)
                
                fitness_scores.append(fitness)
            except Exception as e:
                # Penalize failed evaluations
                fitness_scores.append(float('-inf'))
        
        return fitness_scores
    
    async def _create_next_generation(
        self, 
        population: List[BasePromptModule], 
        fitness_scores: List[float],
        evaluation_fn: AsyncEvaluationFunction,
        task_examples: Optional[List[Any]] = None
    ) -> List[BasePromptModule]:
        """
        Create next generation through selection, crossover, and mutation.
        
        Args:
            population: Current population
            fitness_scores: Fitness scores for population
            evaluation_fn: Evaluation function
            task_examples: Optional task examples
        
        Returns:
            Next generation population
        """
        next_generation = []
        
        # Elitism: Keep best individuals
        elite_indices = sorted(range(len(fitness_scores)), 
                             key=lambda i: fitness_scores[i], 
                             reverse=True)[:self.config.elitism_count]
        
        for idx in elite_indices:
            next_generation.append(copy.deepcopy(population[idx]))
        
        # Create offspring through crossover and mutation
        while len(next_generation) < self.config.population_size:
            # Select parents
            parent1, parent2 = await self._select_parents(population, fitness_scores)
            
            # Crossover
            if random.random() < self.config.crossover_rate:
                offspring = await self._crossover(parent1, parent2)
            else:
                offspring = copy.deepcopy(random.choice([parent1, parent2]))
            
            # Mutation
            if random.random() < self.config.mutation_rate:
                await self._mutate_module(offspring)
            
            # Reflection-based improvement
            if random.random() < 0.3:  # 30% chance for reflection
                offspring = await self._reflect_and_improve(
                    offspring, evaluation_fn, task_examples
                )
            
            next_generation.append(offspring)
        
        return next_generation
    
    async def _select_parents(
        self, 
        population: List[BasePromptModule], 
        fitness_scores: List[float]
    ) -> Tuple[BasePromptModule, BasePromptModule]:
        """
        Select parents using tournament selection.
        
        Args:
            population: Current population
            fitness_scores: Fitness scores
        
        Returns:
            Tuple of two selected parents
        """
        def tournament_selection():
            # Select tournament_size individuals randomly
            tournament_indices = random.sample(
                range(len(population)), 
                min(self.config.tournament_size, len(population))
            )
            
            # Return the one with highest fitness
            best_idx = max(tournament_indices, key=lambda i: fitness_scores[i])
            return population[best_idx]
        
        # Select two different parents
        parent1 = tournament_selection()
        parent2 = tournament_selection()
        
        # Ensure we get different parents (with a reasonable limit to avoid infinite loops)
        attempts = 0
        while parent1 == parent2 and attempts < 10:
            parent2 = tournament_selection()
            attempts += 1
        
        return parent1, parent2
    
    async def _crossover(
        self, 
        parent1: BasePromptModule, 
        parent2: BasePromptModule
    ) -> BasePromptModule:
        """
        Perform crossover between two parents.
        
        Args:
            parent1: First parent module
            parent2: Second parent module
        
        Returns:
            Offspring module
        """
        offspring = copy.deepcopy(parent1)
        
        # Get all prompt parameters
        parent1_params = dict(parent1.named_parameters(recurse=False))
        parent2_params = dict(parent2.named_parameters(recurse=False))
        
        # Perform crossover on each parameter
        for param_name in parent1_params:
            if param_name in parent2_params:
                if random.random() < 0.5:
                    # Take from parent2
                    offspring.update_prompt(
                        param_name, 
                        parent2_params[param_name].value
                    )
        
        return offspring
    
    async def _mutate_module(
        self, 
        module: BasePromptModule, 
        mutation_strength: float = None
    ) -> None:
        """
        Mutate a module's prompts.
        
        Args:
            module: Module to mutate
            mutation_strength: Strength of mutation (0-1)
        """
        if mutation_strength is None:
            mutation_strength = self.config.mutation_rate
        
        for param_name, param in module.named_parameters(recurse=False):
            if random.random() < mutation_strength:
                mutated_prompt = await self._mutate_prompt(param.value)
                module.update_prompt(param_name, mutated_prompt)
    
    async def _mutate_prompt(self, prompt: str) -> str:
        """
        Mutate a single prompt.
        
        Args:
            prompt: Original prompt
        
        Returns:
            Mutated prompt
        """
        mutations = [
            # Add specificity
            f"Be specific and detailed in your response. {prompt}",
            f"Provide concrete examples in your answer. {prompt}",
            f"Focus on accuracy and precision. {prompt}",
            
            # Add constraints
            f"Keep your response concise and to the point. {prompt}",
            f"Structure your response clearly with headings. {prompt}",
            f"Include relevant data and statistics. {prompt}",
            
            # Add domain context
            f"As an expert in this field, {prompt.lower()}",
            f"Consider both theoretical and practical aspects. {prompt}",
            f"Address potential counterarguments. {prompt}",
            
            # Add reasoning instructions
            f"Think step by step before answering. {prompt}",
            f"Explain your reasoning clearly. {prompt}",
            f"Provide evidence for your claims. {prompt}"
        ]
        
        # Apply random mutation
        mutation = random.choice(mutations)
        
        # Ensure we don't exceed max length
        if len(mutation) > self.config.max_prompt_length:
            mutation = mutation[:self.config.max_prompt_length]
        
        return mutation
    
    async def _reflect_and_improve(
        self, 
        module: BasePromptModule,
        evaluation_fn: AsyncEvaluationFunction,
        task_examples: Optional[List[Any]] = None
    ) -> BasePromptModule:
        """
        Use natural language reflection to improve a module.
        
        Args:
            module: Module to improve
            evaluation_fn: Evaluation function
            task_examples: Optional task examples
        
        Returns:
            Improved module
        """
        # Evaluate current performance
        current_fitness = await evaluation_fn(module)
        
        # Collect execution traces (mock for now)
        traces = await self._collect_execution_traces(module, task_examples)
        
        # Get reflection for each prompt
        improved_module = copy.deepcopy(module)
        
        for param_name, param in module.named_parameters(recurse=False):
            # Use synchronous DSPy reflection
            improved_prompt = self.reflection_model(
                prompt=param.value, 
                traces=traces, 
                performance=current_fitness
            )
            
            improved_module.update_prompt(param_name, improved_prompt)
        
        return improved_module
    
    async def _collect_execution_traces(
        self, 
        module: BasePromptModule,
        task_examples: Optional[List[Any]] = None
    ) -> List[ExecutionTrace]:
        """
        Collect execution traces for reflection.
        
        Args:
            module: Module to trace
            task_examples: Optional task examples
        
        Returns:
            List of execution traces
        """
        # Mock implementation - in reality, this would run the module
        # and collect actual execution traces
        
        traces = []
        
        for i in range(3):  # Collect 3 mock traces
            trace = ExecutionTrace(
                task_id=f"mock_task_{i}",
                module_path=module.__class__.__name__,
                input_data={"query": f"mock_query_{i}"},
                output_data={"response": f"mock_response_{i}"},
                prompt_used=next(iter(module.named_parameters(recurse=False)))[1].value,
                execution_time=0.5 + random.random() * 2.0,
                timestamp=time.time(),
                intermediate_steps=[
                    {"step": "thinking", "output": "analyzing query"},
                    {"step": "retrieval", "output": "found relevant info"},
                    {"step": "synthesis", "output": "compiling response"}
                ]
            )
            traces.append(trace)
        
        return traces
    
    def _check_convergence(self, fitness_scores: List[float]) -> bool:
        """
        Check if optimization has converged.
        
        Args:
            fitness_scores: Current fitness scores
        
        Returns:
            True if converged, False otherwise
        """
        if len(fitness_scores) < 2:
            return False
        
        # Get current best fitness
        current_best = max(fitness_scores)
        
        # For the first generation, don't converge
        if self.generation == 0:
            return False
        
        # Check if improvement is below threshold
        improvement = abs(current_best - self.best_fitness)
        
        return improvement < self.config.convergence_threshold
    
    def get_optimization_stats(self) -> Dict[str, Any]:
        """
        Get optimization statistics.
        
        Returns:
            Dictionary of optimization statistics
        """
        return {
            'generations_completed': self.generation,
            'best_fitness': self.best_fitness,
            'config': self.config.to_dict(),
            'history': self.optimization_history
        }


# Utility functions for GEPA optimization

async def optimize_prompt_with_gepa(
    module: BasePromptModule,
    evaluation_fn: AsyncEvaluationFunction,
    config: Optional[GEPAConfig] = None,
    task_examples: Optional[List[Any]] = None
) -> BasePromptModule:
    """
    Convenience function to optimize a module with GEPA.
    
    Args:
        module: Module to optimize
        evaluation_fn: Evaluation function
        config: GEPA configuration
        task_examples: Optional task examples
    
    Returns:
        Optimized module
    """
    optimizer = GEPAOptimizer(config)
    return await optimizer.optimize_module(module, evaluation_fn, task_examples)


def create_gepa_config(
    population_size: int = 10,
    generations: int = 5,
    mutation_rate: float = 0.3,
    crossover_rate: float = 0.7,
    budget: int = 15,
    **kwargs
) -> GEPAConfig:
    """
    Create a GEPA configuration with common parameters.
    
    Args:
        population_size: Size of population
        generations: Number of generations
        mutation_rate: Mutation rate
        crossover_rate: Crossover rate
        budget: Optimization budget
        **kwargs: Additional configuration parameters
    
    Returns:
        GEPAConfig instance
    """
    config = GEPAConfig(
        population_size=population_size,
        generations=generations,
        mutation_rate=mutation_rate,
        crossover_rate=crossover_rate,
        budget=budget,
        **kwargs
    )
    return config


# Example evaluation function for testing
async def example_evaluation_fn(module: BasePromptModule, task_example: Any = None) -> float:
    """
    Example evaluation function for testing GEPA.
    
    Args:
        module: Module to evaluate
        task_example: Optional task example
    
    Returns:
        Fitness score
    """
    # Mock evaluation - in reality, this would run the module
    # and measure its performance on actual tasks
    
    # Simple heuristic: longer prompts with more specific instructions
    # tend to perform better (this is just for testing)
    total_length = 0
    specificity_keywords = ["specific", "detailed", "accurate", "examples", "step by step"]
    
    for param_name, param in module.named_parameters():
        prompt = param.value
        total_length += len(prompt)
        
        for keyword in specificity_keywords:
            if keyword in prompt.lower():
                total_length += 50  # Bonus for specificity
    
    # Normalize to 0-1 range
    max_possible_length = 10000  # Arbitrary max
    score = min(total_length / max_possible_length, 1.0)
    
    # Add some randomness to simulate real evaluation
    score += random.uniform(-0.1, 0.1)
    score = max(0.0, min(1.0, score))
    
    return score