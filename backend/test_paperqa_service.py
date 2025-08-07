import asyncio
import pytest

from core.services.paperqa_service import PaperQAService


@pytest.mark.asyncio
async def test_paperqa_service_with_llm_reasoning_agents():
    """Test PaperQAService with LLM_Reasoning_Agents collection"""
    
    # Create the service
    service = PaperQAService()
    
    try:
        # Query the LLM_Reasoning_Agents collection
        result = await service.query_documents(
            "LLM_Reasoning_Agents", 
            "What are recent advances in tool-use agents?"
        )
        
        # Check the result structure
        assert isinstance(result, dict)
        assert "error" in result
        assert "answer_text" in result
        assert "context" in result
        
        # Print the result for inspection
        print(f"\nQuery result:")
        print(f"Error: {result.get('error')}")
        print(f"Answer: {result.get('answer_text', '')[:200]}...")
        print(f"Context length: {len(result.get('context', []))}")
        
        # Verify we got a real answer
        assert result.get('error') is None
        assert len(result.get('answer_text', '')) > 0
        assert len(result.get('context', [])) > 0
        
    finally:
        # Clean up any remaining sessions
        await asyncio.sleep(0.1)  # Give time for cleanup


if __name__ == "__main__":
    # Run the test
    asyncio.run(test_paperqa_service_with_llm_reasoning_agents())


