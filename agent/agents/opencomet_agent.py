import os
import asyncio
import json
import logging
from typing import List, Dict, Any, Optional
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langchain.tools import tool
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.browser import BrowserTool

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@tool
async def browse_url(url: str) -> str:
    """Navigate to a URL and get the page content."""
    tool = BrowserTool(headless=True)
    result = await tool.navigate(url)
    await tool.close()
    
    if result["success"]:
        return f"Title: {result.get('title', '')}\n\nContent:\n{result.get('content', '')[:3000]}"
    else:
        return f"Error: {result.get('error', 'Unknown error')}"


@tool
async def search_web(query: str) -> str:
    """Search the web for information."""
    tool = BrowserTool(headless=True)
    result = await tool.search(query)
    await tool.close()
    
    if result["success"]:
        return f"Search results for '{query}':\n\n{result.get('content', '')[:3000]}"
    else:
        return f"Error: {result.get('error', 'Unknown error')}"


@tool
async def get_page_info() -> str:
    """Get information about the current page."""
    tool = BrowserTool(headless=True)
    await tool.initialize()
    result = await tool.get_page_info()
    await tool.close()
    
    if result["success"]:
        return f"URL: {result.get('url', 'Unknown')}\nTitle: {result.get('title', 'Unknown')}"
    else:
        return f"Error: {result.get('error', 'Unknown error')}"


# Tool descriptions for the LLM
TOOL_DESCRIPTIONS = """
You have access to the following tools:

1. browse_url: Navigate to a URL and get its content
   - Use when user wants to visit a specific website

2. search_web: Search the web for information
   - Use when user asks about something you need to look up

3. get_page_info: Get current page information
   - Use to check what page is currently loaded

Instructions:
- If the user asks you to browse somewhere or get content from a URL, use browse_url
- If the user asks you to search for something, use search_web
- Be helpful, accurate, and concise
"""


class OpenCometAgent:
    """OpenComet AI Agent - Simple LLM with tool calling."""

    def __init__(
        self,
        model_name: str = "nv-model",
        temperature: float = 0.7,
        api_key: Optional[str] = None
    ):
        self.model_name = model_name
        self.temperature = temperature
        self.tools = [browse_url, search_web, get_page_info]
        
        # Initialize LLM
        if "nv-" in model_name:
            model_to_use = "meta/llama-3.1-8b-instruct"
            api_base = "https://integrate.api.nvidia.com/v1"
            
            from langchain_openai import ChatOpenAI
            self.llm = ChatOpenAI(
                model=model_to_use,
                temperature=temperature,
                api_key=api_key,
                base_url=api_base
            )
        else:
            from langchain_openai import ChatOpenAI
            self.llm = ChatOpenAI(
                model=model_name,
                temperature=temperature,
                api_key=api_key
            )

    async def chat(self, message: str, chat_history: Optional[List[Dict]] = None) -> str:
        """Process a chat message and return the response."""
        try:
            # Build messages
            messages = [
                SystemMessage(content=TOOL_DESCRIPTIONS)
            ]
            
            # Add chat history
            if chat_history:
                for msg in chat_history:
                    if msg.get("role") == "user":
                        messages.append(HumanMessage(content=msg["content"]))
                    elif msg.get("role") == "assistant":
                        messages.append(AIMessage(content=msg["content"]))
            
            # Add current message
            messages.append(HumanMessage(content=message))
            
            # Simple approach: Just call the LLM and check for tool usage in response
            # This is a simplified version - in production you'd want proper tool calling
            response = await self.llm.agenerate([messages])
            response_text = response.generations[0][0].text
            
            # Check if response suggests using a tool
            response_lower = response_text.lower()
            
            # Simple URL detection
            if "http://" in response_text or "https://" in response_text:
                # Extract URL and browse
                import re
                urls = re.findall(r'https?://[^\s]+', response_text)
                if urls:
                    url = urls[0]
                    logger.info(f"Auto-browsing to: {url}")
                    browser_result = await browse_url.ainvoke(url)
                    return f"{response_text}\n\n[browsed: {url}]\n{browser_result}"
            
            return response_text
            
        except Exception as e:
            logger.error(f"Chat error: {e}")
            return f"Error: {str(e)}"


class LiteLLMGateway:
    """Simple LiteLLM gateway for unified API access."""
    
    def __init__(self, config_path: Optional[str] = None):
        self.config_path = config_path or os.path.join(
            os.path.dirname(__file__), "config.yaml"
        )
        
    def get_available_models(self) -> List[str]:
        models = []
        try:
            import yaml
            with open(self.config_path, 'r') as f:
                config = yaml.safe_load(f)
                if config and 'model_list' in config:
                    for model in config['model_list']:
                        models.append(model.get('model_name', ''))
        except:
            pass
        return models


async def main():
    if not os.environ.get("NVIDIA_NIM_API_KEY"):
        print("Warning: NVIDIA_NIM_API_KEY not set.")
        print("Set it with: export NVIDIA_NIM_API_KEY=your_key")
    
    agent = OpenCometAgent(model_name="nv-model")
    
    print("Testing agent...")
    try:
        result = await agent.chat("What is Python? Give a short answer.")
        print(f"Result: {result}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    asyncio.run(main())