"""Local FastAPI adapter. The knowledge base and inference make no network calls."""
from contextlib import asynccontextmanager
import time
from typing import Literal

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from engine import OfflineBot


@asynccontextmanager
async def lifespan(app):
    app.state.bot = OfflineBot()
    yield


app = FastAPI(title="CyberLawAssist Offline NLP", version="1.0.0", lifespan=lifespan, docs_url=None, redoc_url=None)
app.add_middleware(CORSMiddleware, allow_origins=["null"],
                   allow_origin_regex=r"^https?://(?:localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)(?::\d+)?$",
                   allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    language: Literal["auto", "en", "tl", "taglish"] = "auto"
    context_topic: str | None = Field(default=None, max_length=80)

    @field_validator("message")
    @classmethod
    def nonempty(cls, value):
        if not value.strip():
            raise ValueError("A message is required")
        return value.strip()


@app.get("/api/health")
def health(request: Request):
    return {"status":"ok", "offline":True, "engine":"local-tfidf-character-retrieval", "languages":request.app.state.bot.counts, "total_pairs":sum(request.app.state.bot.counts.values())}


@app.post("/api/chat")
def chat(body: ChatRequest, request: Request):
    start = time.perf_counter()
    result = request.app.state.bot.reply(body.message, body.language, body.context_topic)
    result["elapsed_ms"] = round((time.perf_counter() - start) * 1000, 2)
    return result
