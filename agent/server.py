#!/usr/bin/env python3
"""
OpenComet Agent Server - Lazy initialization version
Runs as a local server that the Electron app communicates with.
"""

import os
import sys

# Add agent directory to path
agent_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, agent_dir)

print("OpenComet Agent Server starting...", flush=True)

import json
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Optional
from urllib.parse import urlparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import database utilities
from utils import db

# Global state - lazy initialization
agent = None
current_conversation_id = None


def get_agent():
    """Lazy initialization of the agent."""
    global agent
    if agent is None:
        print("Initializing agent on first request...", flush=True)
        try:
            from agents.opencomet_agent import OpenCometAgent
            
            # Use NVIDIA NIM model by default
            model_name = os.environ.get("OPENCOMET_MODEL", "nv-model")
            api_key = os.environ.get("NVIDIA_NIM_API_KEY", "")
            
            if not api_key:
                logger.warning("NVIDIA_NIM_API_KEY not set. Using placeholder.")
                api_key = "nvapi-dummy"
            
            agent = OpenCometAgent(
                model_name=model_name,
                temperature=0.7,
                api_key=api_key
            )
            print(f"Agent initialized with model: {model_name}", flush=True)
        except Exception as e:
            print(f"Agent init error: {e}", flush=True)
            raise
    return agent


class AgentRequestHandler(BaseHTTPRequestHandler):
    """HTTP request handler for the agent server."""

    def _send_json_response(self, status: int, data: dict):
        """Send a JSON response with CORS headers."""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests."""
        parsed = urlparse(self.path)
        
        if parsed.path == '/health':
            self._send_json_response(200, {"status": "ok", "agent": "lazy-init"})
        elif parsed.path == '/conversations':
            # Get all conversations
            conversations = db.get_conversations()
            self._send_json_response(200, {"conversations": conversations})
        elif parsed.path == '/history':
            # Get current conversation messages
            global current_conversation_id
            if current_conversation_id:
                conv = db.get_conversation(current_conversation_id)
                self._send_json_response(200, {"history": conv['messages'] if conv else []})
            else:
                self._send_json_response(200, {"history": []})
        elif parsed.path == '/pages':
            # Get bookmarked pages
            pages = db.get_pages()
            self._send_json_response(200, {"pages": pages})
        else:
            self._send_json_response(404, {"error": "Not found"})

    def do_POST(self):
        """Handle POST requests."""
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        try:
            data = json.loads(body.decode())
        except json.JSONDecodeError:
            self._send_json_response(400, {"error": "Invalid JSON"})
            return

        parsed = urlparse(self.path)
        
        if parsed.path == '/chat':
            self._handle_chat(data)
        elif parsed.path == '/clear':
            self._handle_clear(data)
        elif parsed.path == '/browse':
            self._handle_browse(data)
        elif parsed.path == '/conversation':
            self._handle_new_conversation(data)
        elif parsed.path == '/conversation/delete':
            self._handle_delete_conversation(data)
        elif parsed.path == '/bookmark':
            self._handle_bookmark(data)
        elif parsed.path == '/settings':
            self._handle_settings(data)
        elif parsed.path == '/tool':
            self._handle_tool(data)
        elif parsed.path == '/tools':
            self._handle_list_tools(data)
        else:
            self._send_json_response(404, {"error": "Not found"})

    def _handle_chat(self, data: dict):
        """Handle chat requests."""
        global current_conversation_id
        
        message = data.get('message', '')
        if not message:
            self._send_json_response(400, {"error": "No message provided"})
            return

        logger.info(f"Chat message: {message[:50]}...")
        
        try:
            # Use lazy initialization
            agent_instance = get_agent()
            
            # Create conversation if needed
            if not current_conversation_id:
                current_conversation_id = db.create_conversation()
            
            # Get conversation history from DB
            conv = db.get_conversation(current_conversation_id)
            chat_history = conv['messages'] if conv else []
            
            import asyncio
            response = asyncio.run(agent_instance.chat(message, chat_history))
            
            # Save to database
            db.add_message(current_conversation_id, "user", message)
            db.add_message(current_conversation_id, "assistant", response)
            
            self._send_json_response(200, {
                "response": response,
                "conversation_id": current_conversation_id
            })
        except Exception as e:
            logger.error(f"Chat error: {e}")
            self._send_json_response(500, {"error": str(e)})

    def _handle_new_conversation(self, data: dict):
        """Create a new conversation."""
        global current_conversation_id
        current_conversation_id = db.create_conversation()
        self._send_json_response(200, {"conversation_id": current_conversation_id})

    def _handle_delete_conversation(self, data: dict):
        """Delete a conversation."""
        conv_id = data.get('conversation_id')
        if conv_id:
            db.delete_conversation(conv_id)
        self._send_json_response(200, {"status": "deleted"})

    def _handle_browse(self, data: dict):
        """Handle direct browse requests."""
        url = data.get('url', '')
        if not url:
            self._send_json_response(400, {"error": "No URL provided"})
            return

        logger.info(f"Browse request: {url}")
        
        try:
            import asyncio
            from tools.browser import navigate_to
            result = asyncio.run(navigate_to(url))
            self._send_json_response(200, {"result": result})
        except Exception as e:
            logger.error(f"Browse error: {e}")
            self._send_json_response(500, {"error": str(e)})

    def _handle_clear(self, data: dict):
        """Clear chat history - start new conversation."""
        global current_conversation_id
        current_conversation_id = db.create_conversation()
        self._send_json_response(200, {"status": "cleared", "conversation_id": current_conversation_id})

    def _handle_bookmark(self, data: dict):
        """Save a bookmark."""
        url = data.get('url', '')
        title = data.get('title', 'Untitled')
        if url:
            db.save_page(url, title)
            self._send_json_response(200, {"status": "saved"})
        else:
            self._send_json_response(400, {"error": "No URL provided"})

    def _handle_settings(self, data: dict):
        """Save settings."""
        for key, value in data.items():
            db.save_setting(key, str(value))
        self._send_json_response(200, {"status": "saved"})

    def _handle_tool(self, data: dict):
        """Execute a tool."""
        import asyncio
        from tools.system import ToolRegistry
        
        tool_name = data.get('tool', '')
        params = data.get('params', {})
        
        logger.info(f"Tool request: {tool_name}")
        
        try:
            if tool_name == "read_file":
                result = asyncio.run(ToolRegistry.read_file(params.get('path', '')))
            elif tool_name == "list_directory":
                result = asyncio.run(ToolRegistry.list_directory(params.get('path', '.')))
            elif tool_name == "execute_code":
                result = asyncio.run(ToolRegistry.execute_code(
                    params.get('code', ''),
                    params.get('language', 'python')
                ))
            elif tool_name == "system_info":
                result = asyncio.run(ToolRegistry.get_system_info())
            else:
                self._send_json_response(400, {"error": f"Unknown tool: {tool_name}"})
                return
            
            self._send_json_response(200, {"result": result})
        except Exception as e:
            logger.error(f"Tool error: {e}")
            self._send_json_response(500, {"error": str(e)})

    def _handle_list_tools(self, data: dict):
        """List available tools."""
        tools = [
            {"name": "browse_url", "description": "Navigate to a URL and get content"},
            {"name": "search_web", "description": "Search the web for information"},
            {"name": "get_page_info", "description": "Get current page information"},
            {"name": "read_file", "description": "Read a local file"},
            {"name": "list_directory", "description": "List directory contents"},
            {"name": "execute_code", "description": "Execute code (Python/JS)"},
            {"name": "system_info", "description": "Get system information"}
        ]
        self._send_json_response(200, {"tools": tools})

    def log_message(self, format, *args):
        """Override to customize logging."""
        logger.debug(f"{self.client_address[0]} - {format % args}")


def run_server(host: str = "localhost", port: int = 8765):
    """Run the agent server."""
    print(f"Starting server on http://{host}:{port}", flush=True)
    
    server = HTTPServer((host, port), AgentRequestHandler)
    logger.info(f"OpenComet Agent Server running on http://{host}:{port}")
    logger.info("Endpoints:")
    logger.info("  GET  /health - Health check")
    logger.info("  GET  /conversations - List all conversations")
    logger.info("  GET  /history - Get current conversation messages")
    logger.info("  GET  /pages - Get bookmarked pages")
    logger.info("  POST /chat - Send a message")
    logger.info("  POST /browse - Direct browse URL")
    logger.info("  POST /clear - Start new conversation")
    logger.info("  POST /conversation - Create new conversation")
    logger.info("  POST /conversation/delete - Delete a conversation")
    logger.info("  POST /bookmark - Save a bookmark")
    logger.info("  POST /settings - Save settings")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Server shutting down...")
        server.shutdown()


if __name__ == "__main__":
    run_server()