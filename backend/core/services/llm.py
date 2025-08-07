"""
LLM Service for AI Research Assistant
Provides abstraction layer for both mock and real LLM providers
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
import asyncio
import time
import random
import json
from datetime import datetime

from utils.config import settings
from utils.helpers import get_timestamp

@dataclass
class LLMResponse:
    """Standard LLM response format"""
    content: str
    tokens_used: int
    cost: float
    execution_time: float
    model: str
    provider: str
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

class BaseLLMService(ABC):
    """Abstract base class for LLM services"""
    
    def __init__(self, provider: str, model: str):
        self.provider = provider
        self.model = model
        self.last_call_time = None
        self.total_calls = 0
        self.total_tokens = 0
        self.total_cost = 0.0
    
    @abstractmethod
    async def generate_response(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs
    ) -> LLMResponse:
        """Generate a response from the LLM"""
        pass
    
    @abstractmethod
    async def generate_chat_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs
    ) -> LLMResponse:
        """Generate a chat response from the LLM"""
        pass
    
    def get_stats(self) -> Dict[str, Any]:
        """Get usage statistics"""
        return {
            "provider": self.provider,
            "model": self.model,
            "total_calls": self.total_calls,
            "total_tokens": self.total_tokens,
            "total_cost": self.total_cost,
            "average_tokens_per_call": self.total_tokens / max(self.total_calls, 1),
            "average_cost_per_call": self.total_cost / max(self.total_calls, 1),
            "last_call_time": self.last_call_time
        }
    
    def _record_call(self, tokens_used: int, cost: float, execution_time: float):
        """Record call statistics"""
        self.total_calls += 1
        self.total_tokens += tokens_used
        self.total_cost += cost
        self.last_call_time = get_timestamp()

class MockLLMService(BaseLLMService):
    """Mock LLM service for development and testing"""
    
    def __init__(self):
        super().__init__("mock", "mock-model")
        
        # Mock response templates for different agent types
        self.response_templates = {
            "planning": {
                "content": self._generate_planning_response,
                "tokens_range": (800, 1200),
                "cost_range": (0.024, 0.036)
            },
            "research": {
                "content": self._generate_research_response,
                "tokens_range": (1000, 1500),
                "cost_range": (0.030, 0.045)
            },
            "writing": {
                "content": self._generate_writing_response,
                "tokens_range": (1200, 1800),
                "cost_range": (0.036, 0.054)
            },
            "review": {
                "content": self._generate_review_response,
                "tokens_range": (600, 1000),
                "cost_range": (0.018, 0.030)
            },
            "general": {
                "content": self._generate_general_response,
                "tokens_range": (500, 1500),
                "cost_range": (0.015, 0.045)
            }
        }
    
    async def generate_response(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs
    ) -> LLMResponse:
        """Generate a mock response"""
        start_time = time.time()
        
        # Simulate processing delay
        await asyncio.sleep(settings.mock_response_delay)
        
        # Determine response type based on prompt content
        response_type = self._determine_response_type(prompt)
        template = self.response_templates[response_type]
        
        # Generate response content
        content = template["content"](prompt, system_prompt)
        
        # Calculate tokens and cost
        tokens_used = random.randint(*template["tokens_range"])
        cost = random.uniform(*template["cost_range"])
        
        execution_time = time.time() - start_time
        
        # Record call statistics
        self._record_call(tokens_used, cost, execution_time)
        
        return LLMResponse(
            content=content,
            tokens_used=tokens_used,
            cost=cost,
            execution_time=execution_time,
            model=self.model,
            provider=self.provider,
            metadata={
                "response_type": response_type,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "system_prompt": system_prompt
            }
        )
    
    async def generate_chat_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs
    ) -> LLMResponse:
        """Generate a mock chat response"""
        # Extract the last user message as the prompt
        prompt = ""
        for message in reversed(messages):
            if message["role"] == "user":
                prompt = message["content"]
                break
        
        return await self.generate_response(prompt, None, temperature, max_tokens, **kwargs)
    
    def _determine_response_type(self, prompt: str) -> str:
        """Determine the type of response based on prompt content"""
        prompt_lower = prompt.lower()
        
        if any(keyword in prompt_lower for keyword in ["plan", "planning", "outline", "strategy"]):
            return "planning"
        elif any(keyword in prompt_lower for keyword in ["research", "analyze", "investigate", "find"]):
            return "research"
        elif any(keyword in prompt_lower for keyword in ["write", "draft", "compose", "create"]):
            return "writing"
        elif any(keyword in prompt_lower for keyword in ["review", "evaluate", "assess", "check"]):
            return "review"
        else:
            return "general"
    
    def _generate_planning_response(self, prompt: str, system_prompt: Optional[str]) -> str:
        """Generate a planning response"""
        return f"""
# Research Plan

Based on your request: "{prompt[:100]}..."

## 1. Research Objectives
- Define clear research questions and hypotheses
- Identify key areas of investigation
- Establish success criteria

## 2. Methodology
- Literature review approach
- Data collection strategies
- Analysis framework

## 3. Timeline
- Phase 1: Background research (1-2 weeks)
- Phase 2: Data collection (2-3 weeks)
- Phase 3: Analysis and synthesis (1-2 weeks)
- Phase 4: Report writing (1 week)

## 4. Resources Required
- Access to academic databases
- Research tools and software
- Subject matter expertise

## 5. Risk Assessment
- Data availability challenges
- Time constraints
- Quality assurance measures

This plan provides a structured approach to addressing your research needs while ensuring comprehensive coverage of the topic.
"""
    
    def _generate_research_response(self, prompt: str, system_prompt: Optional[str]) -> str:
        """Generate a research response"""
        return f"""
# Research Findings

## Executive Summary
Based on comprehensive analysis of the topic: "{prompt[:100]}..."

## Key Findings

### Finding 1: Primary Insight
- **Detail**: Comprehensive analysis reveals significant patterns in the data
- **Evidence**: Multiple sources confirm this observation
- **Implications**: This finding has substantial impact on the field

### Finding 2: Secondary Patterns
- **Detail**: Supporting evidence shows consistent trends
- **Evidence**: Cross-referenced with established literature
- **Implications**: Provides additional context to primary findings

### Finding 3: Emerging Trends
- **Detail**: New developments indicate future directions
- **Evidence**: Recent publications and expert opinions
- **Implications**: Suggests areas for further investigation

## Methodology
- Systematic literature review
- Data triangulation from multiple sources
- Expert validation of findings
- Peer review process

## Limitations
- Scope constraints due to time/resources
- Potential biases in source materials
- Evolving nature of the research area

## Recommendations
- Pursue additional research in identified gaps
- Consider practical applications of findings
- Monitor ongoing developments in the field

This research provides a solid foundation for understanding the current state and future directions of the topic.
"""
    
    def _generate_writing_response(self, prompt: str, system_prompt: Optional[str]) -> str:
        """Generate a writing response"""
        return f"""
# Research Report

## Introduction
This report addresses the critical aspects of: "{prompt[:100]}..." The following analysis provides comprehensive insights and actionable recommendations based on thorough investigation.

## Background and Context
The topic under consideration represents a significant area of interest within the field. Understanding its nuances and implications requires careful examination of multiple factors and their interrelationships.

## Analysis and Discussion

### Key Components
The analysis reveals several essential components that contribute to our understanding:

1. **Primary Factors**: The main drivers influencing outcomes include structural elements, environmental conditions, and stakeholder perspectives.

2. **Secondary Influences**: Additional factors such as temporal dynamics, resource availability, and external pressures play crucial roles in shaping results.

3. **Emerging Patterns**: New developments suggest evolving trends that warrant attention and further investigation.

### Critical Evaluation
A critical assessment of the evidence indicates both strengths and limitations in current approaches. While significant progress has been made, challenges remain in addressing certain aspects comprehensively.

## Findings and Results
The investigation yields several important findings:

- **Finding 1**: Clear evidence supports the primary hypothesis with statistical significance
- **Finding 2**: Secondary analysis reveals additional insights that complement primary results
- **Finding 3**: Unexpected patterns suggest new avenues for future research

## Recommendations
Based on the analysis, the following recommendations are proposed:

1. **Immediate Actions**: Implement specific measures to address identified issues
2. **Strategic Initiatives**: Develop long-term strategies for sustainable improvement
3. **Research Directions**: Pursue further investigation in areas of uncertainty

## Conclusion
This report provides a comprehensive examination of the topic, offering valuable insights and practical guidance for stakeholders. The findings contribute to the broader understanding of the subject and suggest pathways for future development.

The recommendations outlined above provide a framework for action that balances immediate needs with long-term strategic objectives.
"""
    
    def _generate_review_response(self, prompt: str, system_prompt: Optional[str]) -> str:
        """Generate a review response"""
        return f"""
# Review and Assessment

## Overview
This review evaluates the content related to: "{prompt[:100]}..." The assessment considers multiple dimensions including accuracy, completeness, clarity, and overall quality.

## Strengths

### Content Quality
- **Comprehensive Coverage**: The material addresses key aspects of the topic thoroughly
- **Logical Structure**: Information is organized in a coherent and easy-to-follow manner
- **Supporting Evidence**: Claims are backed by appropriate evidence and references

### Presentation
- **Clarity**: Complex concepts are explained clearly and accessibly
- **Readability**: The writing style is engaging and appropriate for the target audience
- **Visual Elements**: Effective use of formatting and structure enhances understanding

## Areas for Improvement

### Content Enhancements
- **Additional Context**: More background information would strengthen the foundation
- **Counterarguments**: Consideration of alternative perspectives would add depth
- **Recent Developments**: Integration of latest findings would increase relevance

### Structural Improvements
- **Flow Optimization**: Some transitions between sections could be smoother
- **Hierarchy Adjustment**: Reorganization of certain sections might improve clarity
- **Summary Enhancement**: More concise summaries would aid comprehension

## Specific Recommendations

1. **Expand Introduction**: Provide more context about the topic's significance
2. **Strengthen Methodology**: Add details about approach and rationale
3. **Enhance Analysis**: Deeper examination of implications and connections
4. **Update References**: Include more recent sources where applicable
5. **Improve Conclusions**: More specific and actionable recommendations

## Overall Assessment
The content demonstrates strong potential and addresses the topic effectively. With the suggested improvements, it could achieve excellence in both content quality and presentation.

**Rating**: 4/5 - Good quality with room for enhancement

The material provides solid value to readers and serves as a good foundation that can be further developed with the recommended changes.
"""
    
    def _generate_general_response(self, prompt: str, system_prompt: Optional[str]) -> str:
        """Generate a general response"""
        return f"""
I understand you're asking about: "{prompt[:100]}..."

This is a comprehensive topic that requires careful consideration of multiple factors. Based on the information provided, I can offer the following insights:

## Key Points to Consider

1. **Context and Background**: The topic exists within a broader context that influences its significance and application.

2. **Main Aspects**: Several core elements deserve attention, including theoretical foundations, practical applications, and current developments.

3. **Challenges and Opportunities**: Like any complex subject, there are both obstacles to overcome and possibilities to explore.

## Detailed Analysis

The subject matter encompasses various dimensions that need to be examined systematically. Each aspect contributes to a holistic understanding of the topic and its implications.

### Current State
Present conditions suggest ongoing evolution and development in this area. Recent trends indicate growing interest and advancement.

### Future Outlook
Looking ahead, several factors will likely shape the trajectory of this topic. Technological advancements, changing requirements, and emerging best practices will all play roles.

## Recommendations

To address this topic effectively, consider the following approach:

1. **Research and Analysis**: Gather comprehensive information from reliable sources
2. **Stakeholder Engagement**: Involve relevant parties to ensure diverse perspectives
3. **Iterative Development**: Progress through cycles of improvement and refinement
4. **Evaluation and Adjustment**: Continuously assess outcomes and make necessary adjustments

## Conclusion

This topic represents an important area that warrants careful attention and thoughtful approach. By considering the various aspects outlined above and following the recommended strategies, you can develop a comprehensive understanding and effective approach to addressing the challenges and opportunities it presents.

Would you like me to elaborate on any specific aspect of this analysis or provide more detailed information about particular areas of interest?
"""

class RealLLMService(BaseLLMService):
    """Real LLM service using actual API calls"""
    
    def __init__(self):
        super().__init__(settings.llm_provider, settings.llm_model)
        self.api_key = settings.llm_api_key
        self.temperature = settings.llm_temperature
        self.max_tokens = settings.llm_max_tokens
        self.timeout = settings.llm_timeout
        self.max_retries = settings.llm_max_retries
        
        # Import the appropriate client based on provider
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the appropriate LLM client"""
        if self.provider.lower() == "openai":
            try:
                import openai
                self.client = openai.AsyncOpenAI(api_key=self.api_key)
            except ImportError:
                raise ImportError("OpenAI package not installed. Run: pip install openai")
        elif self.provider.lower() == "anthropic":
            try:
                import anthropic
                self.client = anthropic.AsyncAnthropic(api_key=self.api_key)
            except ImportError:
                raise ImportError("Anthropic package not installed. Run: pip install anthropic")
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")
    
    async def generate_response(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None,
        temperature: float = None,
        max_tokens: int = None,
        **kwargs
    ) -> LLMResponse:
        """Generate a response using real LLM API"""
        start_time = time.time()
        
        # Use defaults if not provided
        temp = temperature or self.temperature
        max_tok = max_tokens or self.max_tokens
        
        # Prepare messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        try:
            # Make API call with retry logic
            response = await self._make_api_call_with_retry(
                messages=messages,
                temperature=temp,
                max_tokens=max_tok,
                **kwargs
            )
            
            # Extract content and calculate metrics
            content = self._extract_content(response)
            tokens_used = self._count_tokens(response)
            cost = self._calculate_cost(tokens_used)
            execution_time = time.time() - start_time
            
            # Record call statistics
            self._record_call(tokens_used, cost, execution_time)
            
            return LLMResponse(
                content=content,
                tokens_used=tokens_used,
                cost=cost,
                execution_time=execution_time,
                model=self.model,
                provider=self.provider,
                metadata={
                    "temperature": temp,
                    "max_tokens": max_tok,
                    "system_prompt": system_prompt,
                    "raw_response": str(response)
                }
            )
            
        except Exception as e:
            # Handle API errors gracefully
            error_msg = f"LLM API Error: {str(e)}"
            raise RuntimeError(error_msg)
    
    async def generate_chat_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float = None,
        max_tokens: int = None,
        **kwargs
    ) -> LLMResponse:
        """Generate a chat response using real LLM API"""
        start_time = time.time()
        
        # Use defaults if not provided
        temp = temperature or self.temperature
        max_tok = max_tokens or self.max_tokens
        
        try:
            # Make API call with retry logic
            response = await self._make_api_call_with_retry(
                messages=messages,
                temperature=temp,
                max_tokens=max_tok,
                **kwargs
            )
            
            # Extract content and calculate metrics
            content = self._extract_content(response)
            tokens_used = self._count_tokens(response)
            cost = self._calculate_cost(tokens_used)
            execution_time = time.time() - start_time
            
            # Record call statistics
            self._record_call(tokens_used, cost, execution_time)
            
            return LLMResponse(
                content=content,
                tokens_used=tokens_used,
                cost=cost,
                execution_time=execution_time,
                model=self.model,
                provider=self.provider,
                metadata={
                    "temperature": temp,
                    "max_tokens": max_tok,
                    "raw_response": str(response)
                }
            )
            
        except Exception as e:
            # Handle API errors gracefully
            error_msg = f"LLM API Error: {str(e)}"
            raise RuntimeError(error_msg)
    
    async def _make_api_call_with_retry(self, **kwargs):
        """Make API call with retry logic"""
        last_error = None
        
        for attempt in range(self.max_retries):
            try:
                if self.provider.lower() == "openai":
                    return await self.client.chat.completions.create(
                        model=self.model,
                        messages=kwargs["messages"],
                        temperature=kwargs["temperature"],
                        max_tokens=kwargs["max_tokens"],
                        timeout=self.timeout
                    )
                elif self.provider.lower() == "anthropic":
                    return await self.client.messages.create(
                        model=self.model,
                        messages=kwargs["messages"],
                        temperature=kwargs["temperature"],
                        max_tokens=kwargs["max_tokens"]
                    )
                    
            except Exception as e:
                last_error = e
                if attempt < self.max_retries - 1:
                    # Exponential backoff
                    wait_time = (2 ** attempt) * 1.0
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    raise last_error
        
        raise last_error
    
    def _extract_content(self, response) -> str:
        """Extract content from API response"""
        if self.provider.lower() == "openai":
            return response.choices[0].message.content
        elif self.provider.lower() == "anthropic":
            return response.content[0].text
        else:
            return str(response)
    
    def _count_tokens(self, response) -> int:
        """Count tokens used in the response"""
        if self.provider.lower() == "openai":
            return response.usage.total_tokens
        elif self.provider.lower() == "anthropic":
            # Anthropic doesn't provide token count in response
            # Estimate based on content length
            return len(self._extract_content(response)) // 4  # Rough estimate
        else:
            return 0
    
    def _calculate_cost(self, tokens_used: int) -> float:
        """Calculate cost based on tokens used"""
        # Simplified cost calculation (real implementation would use actual pricing)
        if self.provider.lower() == "openai":
            if "gpt-4" in self.model.lower():
                return tokens_used * 0.00003  # $0.03 per 1K tokens
            else:
                return tokens_used * 0.00001  # $0.01 per 1K tokens
        elif self.provider.lower() == "anthropic":
            return tokens_used * 0.000015  # $0.015 per 1K tokens
        else:
            return 0.0

class LLMServiceFactory:
    """Factory for creating LLM service instances"""
    
    @staticmethod
    def create_service(use_mock: bool = None) -> BaseLLMService:
        """Create an LLM service instance"""
        if use_mock is None:
            use_mock = settings.use_mock_llm
        
        if use_mock:
            return MockLLMService()
        else:
            return RealLLMService()
    
    @staticmethod
    def get_service_stats() -> Dict[str, Any]:
        """Get statistics from all active services"""
        mock_service = MockLLMService()
        stats = {
            "mock_service": mock_service.get_stats(),
            "configuration": {
                "use_mock_llm": settings.use_mock_llm,
                "llm_provider": settings.llm_provider,
                "llm_model": settings.llm_model,
                "llm_temperature": settings.llm_temperature,
                "llm_max_tokens": settings.llm_max_tokens
            }
        }
        
        # Add real service stats if not using mock
        if not settings.use_mock_llm:
            try:
                real_service = RealLLMService()
                stats["real_service"] = real_service.get_stats()
            except Exception as e:
                stats["real_service_error"] = str(e)
        
        return stats