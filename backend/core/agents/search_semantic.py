from __future__ import annotations

from typing import Callable, List, Dict, Any, Optional
import os
import json


class SemanticSearchAgent:
    """
    Thin agent wrapper for semantic search with a single tool (collection search).
    It attempts to use OpenAI Agents SDK + LiteLLM when available; otherwise it
    calls the provided search function directly.

    The agent returns a list of items with the shape:
    { id, title, abstract, metadata }
    """

    def __init__(self, search_func: Callable[[str, str, int], List[Dict[str, Any]]]):
        self.search_func = search_func

    async def run(
        self,
        *,
        group_id: str,
        query: str,
        limit: int = 10,
        system_prompt: Optional[str] = None,
    ) -> Dict[str, Any]:
        # Try SDK path first, but ensure fallback is robust
        try:
            from agents import Agent as OAAgent, Runner, function_tool  # type: ignore
            from agents.extensions.models.litellm_model import LitellmModel  # type: ignore

            @function_tool
            def collection_search(group_id: str, query: str, limit: int = 10):
                return self.search_func(group_id, query, limit)

            model_name = os.getenv("SEMANTIC_LITELLM_MODEL", os.getenv("PLANNING_LITELLM_MODEL", "ollama/qwen3:4b"))
            api_key = os.getenv("LITELLM_API_KEY", os.getenv("OPENAI_API_KEY", ""))
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
            result = await Runner.run(agent, payload)
            try:
                text = result.final_output if hasattr(result, "final_output") else str(result)
                data = json.loads(text)
                if isinstance(data, list):
                    return {"mode": "agents_litellm", "results": data}
            except Exception:
                pass
            # Fallback to direct tool result
            return {"mode": "agents_litellm_fallback", "results": self.search_func(group_id, query, limit)}
        except Exception:
            # No SDK or error → direct call
            return {"mode": "direct", "results": self.search_func(group_id, query, limit)}


