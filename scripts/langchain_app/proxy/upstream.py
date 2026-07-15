from __future__ import annotations

import json
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

from llm_settings import LLM_MAX_TOKENS, LlmSettings, get_llm_settings

from ..client import classify_service_error, json_bytes


class UpstreamServiceError(RuntimeError):
    def __init__(
        self,
        message: str,
        *,
        reason: str,
        retryable: bool,
        detail: Any = None,
    ) -> None:
        super().__init__(message)
        self.reason = reason
        self.retryable = retryable
        self.detail = detail


@dataclass(frozen=True)
class Completion:
    model: str
    text: str
    raw: dict[str, Any]


def upstream_url(settings: LlmSettings) -> str:
    if settings.base_url.endswith("/v1/messages"):
        return settings.base_url
    if settings.base_url.endswith("/v1"):
        return settings.base_url + "/messages"
    return settings.base_url + "/v1/messages"


def message_text(message: dict[str, Any]) -> str:
    content = message.get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, dict) and isinstance(item.get("text"), str):
                parts.append(item["text"])
            elif isinstance(item, str):
                parts.append(item)
        return "\n".join(parts)
    return ""


def normalize_messages(payload: dict[str, Any]) -> list[dict[str, str]]:
    messages = payload.get("messages")
    if isinstance(messages, list):
        normalized: list[dict[str, str]] = []
        for item in messages:
            if not isinstance(item, dict):
                continue
            role = item.get("role")
            content = message_text(item)
            if role in {"system", "user", "assistant"} and content:
                normalized.append({"role": role, "content": content})
        if normalized:
            return normalized

    prompt = payload.get("prompt")
    if isinstance(prompt, str) and prompt.strip():
        return [{"role": "user", "content": prompt.strip()}]
    raise ValueError("Request must include either messages[] or prompt.")


def build_upstream_request(
    payload: dict[str, Any],
    *,
    settings: LlmSettings | None = None,
) -> tuple[str, dict[str, str], dict[str, Any], str]:
    try:
        active_settings = settings or get_llm_settings()
    except ValueError as exc:
        raise UpstreamServiceError(
            "LLM provider settings are incomplete.",
            reason="configuration_error",
            retryable=False,
            detail=str(exc),
        ) from exc

    normalized = normalize_messages(payload)
    system_parts = [item["content"] for item in normalized if item["role"] == "system"]
    messages = [item for item in normalized if item["role"] != "system"]
    if not messages:
        raise ValueError("Request must contain at least one user or assistant message.")

    body: dict[str, Any] = {
        "model": active_settings.model,
        "messages": messages,
        "temperature": payload.get("temperature", 0.7),
        "max_tokens": LLM_MAX_TOKENS,
    }
    if system_parts:
        body["system"] = "\n\n".join(system_parts)
    headers = {
        "Authorization": f"Bearer {active_settings.auth_token}",
        "x-api-key": active_settings.auth_token,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }
    return upstream_url(active_settings), headers, body, active_settings.model


def extract_text(data: dict[str, Any]) -> str:
    content = data.get("content")
    if isinstance(content, list):
        text_parts: list[str] = []
        thinking_parts: list[str] = []
        for item in content:
            if not isinstance(item, dict):
                continue
            if item.get("type") == "text" and isinstance(item.get("text"), str):
                text_parts.append(item["text"])
            elif item.get("type") == "thinking" and isinstance(item.get("thinking"), str):
                thinking_parts.append(item["thinking"])
        if any(part.strip() for part in text_parts):
            return "".join(text_parts)
        if thinking_parts:
            return "".join(thinking_parts)
    choices = data.get("choices")
    if isinstance(choices, list) and choices:
        first = choices[0]
        if isinstance(first, dict):
            message = first.get("message")
            if isinstance(message, dict):
                if isinstance(message.get("content"), str) and message["content"].strip():
                    return message["content"]
                reasoning = message.get("reasoning_content") or message.get("reasoning")
                if isinstance(reasoning, str):
                    return reasoning
            if isinstance(first.get("text"), str):
                return first["text"]
    reasoning = data.get("reasoning_content") or data.get("reasoning")
    if isinstance(reasoning, str):
        return reasoning
    return ""


def _http_error_reason(status: int, detail: Any) -> tuple[str, bool]:
    if status in {401, 403}:
        return "authentication_failed", False
    if status == 402:
        return "quota_exhausted", False
    if status == 429:
        return "rate_limited", True
    return classify_service_error(f"HTTP {status}: {detail}")


def post_json(url: str, headers: dict[str, str], body: dict[str, Any], timeout: float) -> dict[str, Any]:
    request = urllib.request.Request(url, data=json_bytes(body), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            detail: Any = json.loads(raw)
        except Exception:
            detail = raw
        reason, retryable = _http_error_reason(exc.code, detail)
        raise UpstreamServiceError(
            f"Anthropic-compatible upstream rejected the request with HTTP {exc.code}.",
            reason=reason,
            retryable=retryable,
            detail=detail,
        ) from exc
    except urllib.error.URLError as exc:
        raise UpstreamServiceError(
            "Could not connect to the Anthropic-compatible upstream.",
            reason="network_error",
            retryable=True,
            detail=str(exc),
        ) from exc
    except TimeoutError as exc:
        raise UpstreamServiceError(
            "Anthropic-compatible upstream request timed out.",
            reason="timeout",
            retryable=True,
            detail=str(exc),
        ) from exc

    try:
        data = json.loads(raw or "{}")
    except json.JSONDecodeError as exc:
        raise UpstreamServiceError(
            "Anthropic-compatible upstream returned invalid JSON.",
            reason="invalid_proxy_response",
            retryable=True,
            detail=raw,
        ) from exc
    if not isinstance(data, dict):
        raise UpstreamServiceError(
            "Anthropic-compatible upstream returned a non-object response.",
            reason="invalid_proxy_response",
            retryable=True,
            detail=data,
        )
    return data


def request_completion(payload: dict[str, Any], timeout: float) -> Completion:
    url, headers, body, model = build_upstream_request(payload)
    print(
        f"[llm-proxy] forwarding model={model} messages={len(body.get('messages', []))} "
        f"max_tokens={body.get('max_tokens')}",
        flush=True,
    )
    raw = post_json(url, headers, body, timeout)
    text = extract_text(raw)
    if not text.strip():
        raise UpstreamServiceError(
            "Anthropic-compatible upstream returned no text content.",
            reason="empty_response",
            retryable=True,
            detail=raw,
        )
    return Completion(model=model, text=text, raw=raw)
