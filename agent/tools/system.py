import os
import asyncio
import subprocess
from typing import Optional

class ToolRegistry:
    """Registry of available tools for the agent."""

    @staticmethod
    async def read_file(file_path: str) -> str:
        """Read content from a local file."""
        try:
            # Security: only allow reading from allowed directories
            home = os.path.expanduser("~")
            allowed_dirs = [home, os.getcwd()]
            
            abs_path = os.path.abspath(file_path)
            
            # Check if path is in allowed directories
            allowed = any(abs_path.startswith(d) for d in allowed_dirs)
            if not allowed:
                return f"Error: File must be in allowed directories: {', '.join(allowed_dirs)}"
            
            with open(abs_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Limit content size
            if len(content) > 10000:
                content = content[:10000] + "\n... (truncated)"
            
            return f"File: {abs_path}\n\n{content}"
        except Exception as e:
            return f"Error reading file: {str(e)}"

    @staticmethod
    async def list_directory(dir_path: str = ".") -> str:
        """List contents of a directory."""
        try:
            abs_path = os.path.abspath(dir_path)
            if not os.path.isdir(abs_path):
                return f"Error: Not a directory: {abs_path}"
            
            items = []
            for item in os.listdir(abs_path):
                full_path = os.path.join(abs_path, item)
                if os.path.isdir(full_path):
                    items.append(f"📁 {item}/")
                else:
                    size = os.path.getsize(full_path)
                    items.append(f"📄 {item} ({size} bytes)")
            
            return f"Contents of {abs_path}:\n\n" + "\n".join(items)
        except Exception as e:
            return f"Error listing directory: {str(e)}"

    @staticmethod
    async def execute_code(code: str, language: str = "python") -> str:
        """Execute code in a sandboxed environment."""
        try:
            if language.lower() == "python":
                # Execute Python code
                result = subprocess.run(
                    ["python3", "-c", code],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    cwd=os.getcwd()
                )
                
                output = result.stdout
                if result.stderr:
                    output += f"\nErrors: {result.stderr}"
                
                return output or "(No output)"
            
            elif language.lower() == "javascript":
                result = subprocess.run(
                    ["node", "-e", code],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                output = result.stdout
                if result.stderr:
                    output += f"\nErrors: {result.stderr}"
                
                return output or "(No output)"
            
            else:
                return f"Error: Unsupported language: {language}"
                
        except subprocess.TimeoutExpired:
            return "Error: Code execution timed out (10s limit)"
        except Exception as e:
            return f"Error executing code: {str(e)}"

    @staticmethod
    async def search_web(query: str) -> str:
        """Search the web using DuckDuckGo."""
        try:
            from tools.browser import BrowserTool
            tool = BrowserTool(headless=True)
            result = await tool.search(query)
            await tool.close()
            
            if result["success"]:
                return result.get('content', '')[:2000]
            else:
                return f"Search error: {result.get('error', 'Unknown')}"
        except Exception as e:
            return f"Search error: {str(e)}"

    @staticmethod
    async def get_system_info() -> str:
        """Get system information."""
        try:
            import platform
            info = f"""System Information:
- OS: {platform.system()} {platform.release()}
- Python: {platform.python_version()}
- Architecture: {platform.machine()}
- Current directory: {os.getcwd()}
"""
            return info
        except Exception as e:
            return f"Error getting system info: {str(e)}"


# Tool functions for the agent
async def read_file(file_path: str) -> str:
    """Read a local file."""
    return await ToolRegistry.read_file(file_path)


async def list_directory(dir_path: str = ".") -> str:
    """List directory contents."""
    return await ToolRegistry.list_directory(dir_path)


async def execute_code(code: str, language: str = "python") -> str:
    """Execute code."""
    return await ToolRegistry.execute_code(code, language)


async def get_system_info() -> str:
    """Get system info."""
    return await ToolRegistry.get_system_info()