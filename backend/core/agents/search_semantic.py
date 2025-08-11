from __future__ import annotations

from typing import Callable, List, Dict, Any, Optional, Union
import asyncio
import os
import json
import logging

# Set up logging
logger = logging.getLogger(__name__)


class SemanticSearchAgent:
    """
    Thin agent wrapper for semantic search with a single tool (collection search).
    It attempts to use OpenAI Agents SDK + LiteLLM when available; otherwise it
    calls the provided search function directly.

    The agent returns a list of items with the shape:
    { id, title, abstract, metadata }
    """

    def __init__(self, search_func: Union[Callable[[str, str, int], List[Dict[str, Any]]], Callable[[str, str, int], Any]]):
        self.search_func = search_func

    async def run(
        self,
        *,
        group_id: str,
        query: str,
        limit: int = 10,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        logger.info(f"SemanticSearchAgent starting: group_id={group_id}, query='{query}', limit={limit}")
        
        # Try SDK path first, but ensure fallback is robust
        try:
            from agents import Agent as OAAgent, Runner, function_tool  # type: ignore
            from agents.extensions.models.litellm_model import LitellmModel  # type: ignore

            logger.info("Attempting OpenAI Agents SDK + LiteLLM path")
            
            @function_tool
            async def collection_search(group_id: str, query: str, limit: int = 10):
                logger.info(f"collection_search called: group_id={group_id}, query='{query}', limit={limit}")
                if asyncio.iscoroutinefunction(self.search_func):
                    result = await self.search_func(group_id, query, limit)
                    logger.info(f"collection_search async result: {len(result) if isinstance(result, list) else 'non-list'} items")
                    return result
                else:
                    result = self.search_func(group_id, query, limit)
                    logger.info(f"collection_search sync result: {len(result) if isinstance(result, list) else 'non-list'} items")
                    return result

            model_name = os.getenv("SEMANTIC_LITELLM_MODEL", os.getenv("PLANNING_LITELLM_MODEL", "ollama/qwen3:4b"))
            api_key = os.getenv("LITELLM_API_KEY", os.getenv("OPENAI_API_KEY", ""))
            logger.info(f"Using model: {model_name}, API key present: {bool(api_key)}")
            
            instructions = (
                system_prompt
                or "You are a Semantic Search agent. Given a group_id, query and limit, call collection_search once and return JSON only."
            )
            agent = OAAgent(
                name="Semantic Search",
                instructions=instructions,
                model=LitellmModel(model=model_name, api_key=api_key),
                tools=[collection_search],
            )
            payload = json.dumps({"group_id": group_id, "query": query, "limit": limit})
            logger.info(f"Running agent with payload: {payload}")
            result = await Runner.run(agent, payload)
            logger.info(f"Agent run completed, result type: {type(result)}")
            try:
                text = result.final_output if hasattr(result, "final_output") else str(result)
                logger.info(f"Agent output text: {text[:200]}...")
                data = json.loads(text)
                if isinstance(data, list):
                    logger.info(f"Successfully parsed agent output as list with {len(data)} items")
                    return {"mode": "agents_litellm", "results": data}
                else:
                    logger.warning(f"Agent output parsed but not a list: {type(data)}")
            except Exception as e:
                logger.warning(f"Failed to parse agent output as JSON: {e}")
                pass
            # Fallback to direct tool result
            logger.info("Falling back to direct tool result (agents_litellm_fallback)")
            if asyncio.iscoroutinefunction(self.search_func):
                results = await self.search_func(group_id, query, limit)
            else:
                results = self.search_func(group_id, query, limit)
            logger.info(f"Direct tool result: {len(results) if isinstance(results, list) else 'non-list'} items")
            return {"mode": "agents_litellm_fallback", "results": results}
        except Exception as e:
            # No SDK or error → direct call
            logger.warning(f"OpenAI Agents SDK failed, falling back to direct call: {e}")
            if asyncio.iscoroutinefunction(self.search_func):
                results = await self.search_func(group_id, query, limit)
            else:
                results = self.search_func(group_id, query, limit)
            logger.info(f"Direct call result: {len(results) if isinstance(results, list) else 'non-list'} items")
            return {"mode": "direct", "results": results}


