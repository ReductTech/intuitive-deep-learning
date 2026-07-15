from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

from .config import CONFIG
from .diagnostics import trace


DEFAULT_SYSTEM_PROMPT = "你是一个面向初学者的深度学习教学助手。严格遵守任务中的评分标准和结构化输出格式。内部判断过程保持简洁，不需要过分展开。最终响应必须完整且仅包含符合指定 schema 的 JSON 对象，不要在其前后添加解释、Markdown 或分析文字。"


class LLMServiceUnavailable(RuntimeError):
    def __init__(
        self,
        message: str,
        *,
        reason: str = "upstream_error",
        detail: Any = None,
        retryable: bool = False,
    ) -> None:
        super().__init__(message)
        self.reason = reason
        self.detail = detail
        self.retryable = retryable


def classify_service_error(message: str) -> tuple[str, bool]:
    text = message.lower()
    if any(
        token in text
        for token in (
            "quota",
            "credit",
            "billing",
            "payment",
            "balance",
            "funds",
            "insufficient",
            "402",
            "余额",
            "额度",
            "充值",
            "没钱",
        )
    ):
        return "quota_exhausted", False
    if "429" in text or "rate limit" in text or "rate_limit" in text:
        return "rate_limited", True
    if any(
        token in text
        for token in ("401", "403", "unauthorized", "forbidden", "api key", "x-api-key", "invalid key", "auth token")
    ):
        return "authentication_failed", False
    if "timeout" in text or "timed out" in text:
        return "timeout", True
    if any(token in text for token in ("connect", "network", "connection", "dns", "resolve", "port 59413")):
        return "network_error", True
    return "upstream_error", False


def json_bytes(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, ensure_ascii=False).encode("utf-8")


def json_loads(raw: str) -> dict[str, Any]:
    data = json.loads(raw or "{}")
    if not isinstance(data, dict):
        raise ValueError("JSON body must be an object.")
    return data


@dataclass(frozen=True)
class ProxyClient:
    url: str

    def post_json(self, payload: dict[str, Any], timeout: float) -> dict[str, Any]:
        started_at = time.perf_counter()
        request_body = json_bytes(payload)
        trace(
            "proxy.http.start",
            url=self.url,
            timeoutSeconds=timeout,
            requestBytes=len(request_body),
            model=payload.get("model"),
        )
        request = urllib.request.Request(
            self.url,
            data=request_body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                raw = response.read().decode("utf-8", errors="replace")
                status = getattr(response, "status", None)
            trace(
                "proxy.http.complete",
                url=self.url,
                status=status,
                responseChars=len(raw),
                durationMs=int((time.perf_counter() - started_at) * 1000),
            )
            try:
                return json_loads(raw)
            except Exception as exc:
                trace(
                    "proxy.http.invalid_json",
                    url=self.url,
                    responseChars=len(raw),
                    errorType=type(exc).__name__,
                    durationMs=int((time.perf_counter() - started_at) * 1000),
                )
                raise LLMServiceUnavailable(
                    "LLM proxy returned an invalid JSON response.",
                    reason="invalid_proxy_response",
                    detail=raw,
                    retryable=True,
                ) from exc
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode("utf-8", errors="replace")
            try:
                detail: Any = json.loads(raw)
            except Exception:
                detail = raw
            message = f"LLM proxy HTTP {exc.code}: {detail}"
            if isinstance(detail, dict) and isinstance(detail.get("reason"), str):
                reason = detail["reason"]
                retryable = bool(detail.get("retryable"))
            else:
                reason, retryable = classify_service_error(message)
            trace(
                "proxy.http.error",
                url=self.url,
                status=exc.code,
                reason=reason,
                retryable=retryable,
                responseChars=len(raw),
                durationMs=int((time.perf_counter() - started_at) * 1000),
            )
            raise LLMServiceUnavailable(
                message,
                reason=reason,
                detail=detail,
                retryable=retryable,
            ) from exc
        except urllib.error.URLError as exc:
            trace(
                "proxy.http.network_error",
                url=self.url,
                errorType=type(exc.reason).__name__,
                durationMs=int((time.perf_counter() - started_at) * 1000),
            )
            message = (
                f"Cannot reach LLM proxy at {self.url}. The LangChain service is running, but port 59413 "
                "is not responding. Start llm_proxy_service.py in another terminal first."
            )
            raise LLMServiceUnavailable(message, reason="network_error", retryable=True) from exc
        except TimeoutError as exc:
            trace(
                "proxy.http.timeout",
                url=self.url,
                timeoutSeconds=timeout,
                durationMs=int((time.perf_counter() - started_at) * 1000),
            )
            raise LLMServiceUnavailable(
                f"LLM proxy request timed out after {timeout} seconds.",
                reason="timeout",
                retryable=True,
            ) from exc

    def call(
        self,
        prompt: str,
        *,
        model: str,
        temperature: float,
        max_tokens: int,
        timeout: float,
        system_prompt: str | None = None,
    ) -> str:
        started_at = time.perf_counter()
        trace(
            "model.call.start",
            model=model,
            promptChars=len(prompt),
            systemPromptChars=len(system_prompt or DEFAULT_SYSTEM_PROMPT),
            temperature=temperature,
            maxTokens=max_tokens,
            timeoutSeconds=timeout,
        )
        data = self.post_json(
            {
                "messages": [
                    {
                        "role": "system",
                        "content": system_prompt or DEFAULT_SYSTEM_PROMPT,
                    },
                    {"role": "user", "content": prompt},
                ],
                "model": model,
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
            timeout,
        )
        if data.get("ok") is not True:
            message = str(data.get("error", "LLM proxy returned an error."))
            reason = str(data.get("reason")) if isinstance(data.get("reason"), str) else ""
            if reason:
                retryable = bool(data.get("retryable"))
            else:
                reason, retryable = classify_service_error(message)
            trace(
                "model.call.rejected",
                model=model,
                reason=reason,
                retryable=retryable,
                durationMs=int((time.perf_counter() - started_at) * 1000),
            )
            raise LLMServiceUnavailable(
                message,
                reason=reason,
                detail=data,
                retryable=retryable,
            )
        text = data.get("text")
        if not isinstance(text, str) or not text.strip():
            trace(
                "model.call.empty",
                model=model,
                durationMs=int((time.perf_counter() - started_at) * 1000),
            )
            raise LLMServiceUnavailable(
                "LLM proxy returned an empty text response.",
                reason="empty_response",
                detail=data,
                retryable=True,
            )
        trace(
            "model.call.complete",
            model=model,
            responseChars=len(text),
            durationMs=int((time.perf_counter() - started_at) * 1000),
        )
        return text

    def health(self, timeout: float = 2.0) -> dict[str, Any]:
        health_url = self.url.rsplit("/", 1)[0] + "/health"
        request = urllib.request.Request(health_url, headers={"Accept": "application/json"}, method="GET")
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                data = json_loads(response.read().decode("utf-8", errors="replace"))
            return {"ok": bool(data.get("ok")), "url": health_url, "detail": data}
        except Exception as exc:
            return {
                "ok": False,
                "url": health_url,
                "error": str(exc),
                "hint": (
                    "另开一个终端启动 proxy："
                    "python3 .claude/skills/intuitive-deep-learning/scripts/llm_proxy_service.py"
                ),
            }


DEFAULT_CLIENT = ProxyClient(CONFIG.proxy_url)
