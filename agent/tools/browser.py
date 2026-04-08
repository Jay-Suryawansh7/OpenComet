import asyncio
import logging
from typing import Optional, Dict, Any
from playwright.async_api import async_playwright, Browser, Page, BrowserContext

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BrowserTool:
    """Playwright-based browser automation tool for the agent."""

    def __init__(self, headless: bool = True):
        self.headless = headless
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.current_url = ""
        self.current_title = ""

    async def initialize(self):
        """Initialize the browser."""
        logger.info("Initializing browser...")
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=self.headless,
            args=['--disable-blink-features=AutomationControlled']
        )
        self.context = await self.browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        self.page = await self.context.new_page()
        logger.info("Browser initialized successfully")

    async def navigate(self, url: str) -> Dict[str, Any]:
        """Navigate to a URL and return the page content."""
        if not self.page:
            await self.initialize()

        try:
            logger.info(f"Navigating to: {url}")
            response = await self.page.goto(url, wait_until="domcontentloaded", timeout=30000)
            
            # Wait a bit for dynamic content
            await asyncio.sleep(2)
            
            self.current_url = self.page.url
            self.current_title = await self.page.title()
            
            # Extract main content
            content = await self._extract_content()
            
            return {
                "success": True,
                "url": self.current_url,
                "title": self.current_title,
                "content": content[:5000],  # Limit content length
                "status": response.status if response else 200
            }
        except Exception as e:
            logger.error(f"Navigation error: {e}")
            return {
                "success": False,
                "error": str(e),
                "url": url
            }

    async def _extract_content(self) -> str:
        """Extract visible text content from the page."""
        try:
            # Get visible text
            content = await self.page.evaluate('''
                () => {
                    // Remove scripts and styles
                    const scripts = document.querySelectorAll('script, style, nav, footer, header');
                    scripts.forEach(el => el.remove());
                    
                    // Get main content
                    const main = document.querySelector('main') || document.querySelector('body');
                    return main ? main.innerText : document.body.innerText;
                }
            ''')
            return content.strip()
        except Exception as e:
            logger.error(f"Content extraction error: {e}")
            return ""

    async def search(self, query: str, engine: str = "duckduckgo") -> Dict[str, Any]:
        """Perform a web search."""
        search_urls = {
            "duckduckgo": "https://duckduckgo.com/?q=",
            "google": "https://www.google.com/search?q=",
            "bing": "https://www.bing.com/search?q="
        }
        
        url = search_urls.get(engine, search_urls["duckduckgo"]) + query.replace(" ", "+")
        return await self.navigate(url)

    async def click(self, selector: str) -> Dict[str, Any]:
        """Click on an element."""
        if not self.page:
            return {"success": False, "error": "Browser not initialized"}

        try:
            await self.page.click(selector, timeout=5000)
            await asyncio.sleep(1)
            return {"success": True, "url": self.page.url}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def fill(self, selector: str, text: str) -> Dict[str, Any]:
        """Fill an input field."""
        if not self.page:
            return {"success": False, "error": "Browser not initialized"}

        try:
            await self.page.fill(selector, text)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def get_screenshot(self) -> Optional[bytes]:
        """Take a screenshot of the current page."""
        if not self.page:
            return None

        try:
            return await self.page.screenshot()
        except Exception as e:
            logger.error(f"Screenshot error: {e}")
            return None

    async def get_page_info(self) -> Dict[str, Any]:
        """Get current page information."""
        if not self.page:
            return {"success": False, "error": "Browser not initialized"}

        return {
            "success": True,
            "url": self.page.url,
            "title": await self.page.title(),
            "url": self.current_url
        }

    async def close(self):
        """Close the browser."""
        logger.info("Closing browser...")
        if self.page:
            await self.page.close()
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
        logger.info("Browser closed")


# Tool functions for LangChain
async def navigate_to(url: str) -> str:
    """Navigate to a URL and return the page content."""
    tool = BrowserTool()
    result = await tool.navigate(url)
    await tool.close()
    
    if result["success"]:
        return f"Successfully navigated to {result['url']}\nTitle: {result.get('title', '')}\n\nContent:\n{result.get('content', '')[:2000]}"
    else:
        return f"Failed to navigate: {result.get('error', 'Unknown error')}"


async def search_web(query: str) -> str:
    """Search the web and return results."""
    tool = BrowserTool()
    result = await tool.search(query)
    await tool.close()
    
    if result["success"]:
        return f"Search results for '{query}':\n{result.get('content', '')[:2000]}"
    else:
        return f"Search failed: {result.get('error', 'Unknown error')}"


async def get_current_page() -> str:
    """Get current page information."""
    tool = BrowserTool()
    await tool.initialize()
    result = await tool.get_page_info()
    await tool.close()
    
    if result["success"]:
        return f"Current page: {result.get('url', '')}\nTitle: {result.get('title', '')}"
    else:
        return f"Failed to get page info: {result.get('error', 'Unknown error')}"


if __name__ == "__main__":
    # Test the browser tool
    async def test():
        tool = BrowserTool(headless=True)
        await tool.initialize()
        
        # Test navigation
        result = await tool.navigate("https://example.com")
        print(f"Navigation result: {result}")
        
        # Test search
        search_result = await tool.search("Python programming")
        print(f"Search result: {search_result}")
        
        await tool.close()
    
    asyncio.run(test())