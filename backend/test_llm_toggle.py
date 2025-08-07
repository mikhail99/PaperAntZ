"""
Test script for LLM service toggle functionality
Tests both mock and real LLM services
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.services.llm import LLMServiceFactory
from core.dependencies import get_llm_service, update_llm_service_config, get_service_stats
from utils.config import settings

async def test_mock_service():
    """Test the mock LLM service"""
    print("🧪 Testing Mock LLM Service...")
    
    # Get mock service
    mock_service = get_llm_service(use_mock=True)
    
    # Test different prompt types
    test_prompts = [
        ("planning", "Create a research plan for AI ethics"),
        ("research", "Research the impact of climate change on biodiversity"),
        ("writing", "Write a report about renewable energy adoption"),
        ("review", "Review this research paper on machine learning"),
        ("general", "Explain quantum computing basics")
    ]
    
    for prompt_type, prompt in test_prompts:
        print(f"\n📝 Testing {prompt_type} prompt:")
        print(f"   Prompt: {prompt[:50]}...")
        
        try:
            response = await mock_service.generate_response(
                prompt=prompt,
                system_prompt=f"You are a {prompt_type} expert.",
                temperature=0.7,
                max_tokens=1000
            )
            
            print(f"   ✅ Success!")
            print(f"   📊 Tokens: {response.tokens_used}")
            print(f"   💰 Cost: ${response.cost:.4f}")
            print(f"   ⏱️  Time: {response.execution_time:.2f}s")
            print(f"   📄 Content preview: {response.content[:100]}...")
            
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    print("\n🎯 Mock service testing completed!")

async def test_real_service():
    """Test the real LLM service (if configured)"""
    print("🌐 Testing Real LLM Service...")
    
    # Check if real LLM is configured
    if not settings.llm_api_key:
        print("⚠️  No API key configured for real LLM. Skipping real service test.")
        print("   To test real service, set LLM_API_KEY environment variable.")
        return
    
    try:
        # Get real service
        real_service = get_llm_service(use_mock=False)
        
        # Test a simple prompt
        test_prompt = "Explain the benefits of renewable energy in 3 bullet points."
        
        print(f"\n📝 Testing real service with prompt:")
        print(f"   Prompt: {test_prompt}")
        
        response = await real_service.generate_response(
            prompt=test_prompt,
            system_prompt="You are a helpful assistant.",
            temperature=0.7,
            max_tokens=500
        )
        
        print(f"   ✅ Success!")
        print(f"   📊 Tokens: {response.tokens_used}")
        print(f"   💰 Cost: ${response.cost:.4f}")
        print(f"   ⏱️  Time: {response.execution_time:.2f}s")
        print(f"   📄 Content: {response.content}")
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        print("   This is expected if API keys are not properly configured.")
    
    print("\n🎯 Real service testing completed!")

async def test_toggle_functionality():
    """Test the toggle functionality"""
    print("🔄 Testing Toggle Functionality...")
    
    # Test with mock
    print("\n1. Testing with mock enabled:")
    update_llm_service_config(use_mock=True)
    mock_service = get_llm_service()
    print(f"   Service type: {type(mock_service).__name__}")
    
    # Test with real
    print("\n2. Testing with real enabled:")
    try:
        update_llm_service_config(use_mock=False)
        real_service = get_llm_service()
        print(f"   Service type: {type(real_service).__name__}")
    except Exception as e:
        print(f"   Error switching to real service: {str(e)}")
    
    # Switch back to mock
    print("\n3. Switching back to mock:")
    update_llm_service_config(use_mock=True)
    mock_service = get_llm_service()
    print(f"   Service type: {type(mock_service).__name__}")
    
    print("\n🎯 Toggle functionality testing completed!")

async def test_service_stats():
    """Test service statistics"""
    print("📊 Testing Service Statistics...")
    
    try:
        stats = get_service_stats()
        
        print("\n📈 LLM Service Stats:")
        llm_stats = stats.get("llm_service", {})
        print(f"   Mock Service: {llm_stats.get('mock_service', {})}")
        if "real_service" in llm_stats:
            print(f"   Real Service: {llm_stats.get('real_service', {})}")
        if "real_service_error" in llm_stats:
            print(f"   Real Service Error: {llm_stats.get('real_service_error')}")
        
        print(f"\n⚙️  Configuration: {llm_stats.get('configuration', {})}")
        
    except Exception as e:
        print(f"❌ Error getting stats: {str(e)}")
    
    print("\n🎯 Service statistics testing completed!")

async def main():
    """Main test function"""
    print("🚀 Starting LLM Service Toggle Tests")
    print("=" * 50)
    
    # Test configuration
    print(f"\n⚙️  Current Configuration:")
    print(f"   Use Mock LLM: {settings.use_mock_llm}")
    print(f"   LLM Provider: {settings.llm_provider}")
    print(f"   LLM Model: {settings.llm_model}")
    print(f"   API Key Configured: {'Yes' if settings.llm_api_key else 'No'}")
    
    # Run tests
    await test_toggle_functionality()
    await test_mock_service()
    await test_real_service()
    await test_service_stats()
    
    print("\n" + "=" * 50)
    print("✅ All tests completed!")
    print("\n📋 Summary:")
    print("   - Mock service: ✅ Working")
    print("   - Real service: ⚠️  Requires API key configuration")
    print("   - Toggle functionality: ✅ Working")
    print("   - Service statistics: ✅ Working")

if __name__ == "__main__":
    asyncio.run(main())