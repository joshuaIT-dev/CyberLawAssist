"""Dependency-free local API, used when FastAPI has not been installed yet."""
import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import re
import time

from engine import OfflineBot


def allowed_origin(origin):
    return origin == "null" or bool(re.fullmatch(r"https?://(?:localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)(?::\d+)?", origin or ""))


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass  # Do not log message bodies or personal details.

    def respond(self, status, body=None):
        payload = json.dumps(body, ensure_ascii=False).encode("utf-8") if body is not None else b""
        self.send_response(status)
        origin = self.headers.get("Origin")
        if allowed_origin(origin):
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        if payload:
            self.wfile.write(payload)

    def do_OPTIONS(self):
        self.respond(204 if allowed_origin(self.headers.get("Origin")) else 403)

    def do_GET(self):
        if self.path != "/api/health":
            self.respond(404, {"detail": "Not found"})
            return
        self.respond(200, {"status": "ok", "offline": True, "engine": "local-tfidf-character-retrieval", "languages": self.server.bot.counts, "total_pairs": sum(self.server.bot.counts.values())})

    def do_POST(self):
        if self.path != "/api/chat":
            self.respond(404, {"detail": "Not found"})
            return
        if self.headers.get("Origin") and not allowed_origin(self.headers["Origin"]):
            self.respond(403, {"detail": "Origin not allowed"})
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if not 0 < size <= 16000:
                raise ValueError("Invalid request size")
            if self.headers.get_content_type() != "application/json":
                raise ValueError("Expected JSON")
            body = json.loads(self.rfile.read(size))
            if not isinstance(body, dict):
                raise ValueError("Expected a JSON object")
            context = body.get("context_topic")
            if context is not None and (not isinstance(context, str) or len(context) > 80):
                raise ValueError("Invalid context")
            start = time.perf_counter()
            result = self.server.bot.reply(body.get("message"), body.get("language", "auto"), context)
            result["elapsed_ms"] = round((time.perf_counter() - start) * 1000, 2)
        except (ValueError, TypeError, UnicodeError):
            self.respond(422, {"detail": "Use a message of 1-2000 characters and language auto, en, tl, or taglish."})
            return
        self.respond(200, result)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CyberLawAssist offline NLP API")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8001)
    args = parser.parse_args()
    bot = OfflineBot()
    with ThreadingHTTPServer((args.host, args.port), Handler) as server:
        server.bot = bot
        print(f"Offline NLP ready at http://{args.host}:{args.port} ({sum(bot.counts.values())} Q&A pairs)", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
