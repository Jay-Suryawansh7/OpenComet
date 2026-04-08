#!/usr/bin/env python3
"""
Simple test server to verify the basics work.
"""

import sys
import os

# Add agent directory to path
agent_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, agent_dir)

print("Starting simple test server...", flush=True)

from http.server import HTTPServer, BaseHTTPRequestHandler

class TestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status": "ok"}')
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        pass  # Suppress logging

print("Creating server...", flush=True)
server = HTTPServer(('localhost', 8765), TestHandler)
print("Server ready on http://localhost:8765", flush=True)
print("Press Ctrl+C to stop", flush=True)

try:
    server.serve_forever()
except KeyboardInterrupt:
    print("\nShutting down...", flush=True)
    server.shutdown()