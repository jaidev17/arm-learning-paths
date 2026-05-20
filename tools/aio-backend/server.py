"""
Thin HTTP server wrapping rag.py for the AIO prototype frontend.
Run with: python server.py
Listens on http://localhost:5001
"""

import json
from http.server import BaseHTTPRequestHandler, HTTPServer

from rag import answer_question, retrieve


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[server] {fmt % args}")

    def _send_json(self, status, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path not in {"/query", "/query/", "/"}:
            self._send_json(404, {"error": "Not found"})
            return

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            self._send_json(400, {"error": "Invalid JSON"})
            return

        query = (payload.get("query") or "").strip()
        if not query:
            self._send_json(400, {"error": "query is required"})
            return

        try:
            hits = retrieve(query)
            answer = answer_question(query)
            sources = [
                {"title": h.get("title", "Source"), "url": h.get("source", "")}
                for h in hits
                if h.get("source")
            ]
            self._send_json(200, {"answer": answer, "sources": sources})
        except Exception as err:
            print(f"[server] error: {err}")
            self._send_json(500, {"error": str(err)})


if __name__ == "__main__":
    port = 5001
    print(f"AIO backend listening on http://localhost:{port}")
    HTTPServer(("localhost", port), Handler).serve_forever()
