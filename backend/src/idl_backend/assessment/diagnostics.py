from __future__ import annotations

import json
import threading
from contextvars import ContextVar, Token
from datetime import datetime, timezone
from typing import Any


_REQUEST_ID: ContextVar[str] = ContextVar("langchain_request_id", default="-")


def request_id() -> str:
    return _REQUEST_ID.get()


def bind_request_id(value: str) -> Token[str]:
    return _REQUEST_ID.set(value)


def reset_request_id(token: Token[str]) -> None:
    _REQUEST_ID.reset(token)


def trace(event: str, **fields: Any) -> None:
    payload = {
        "time": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
        "event": event,
        "requestId": request_id(),
        "thread": threading.current_thread().name,
        **fields,
    }
    print(
        "[langchain-trace] " + json.dumps(payload, ensure_ascii=False, default=str, separators=(",", ":")),
        flush=True,
    )
