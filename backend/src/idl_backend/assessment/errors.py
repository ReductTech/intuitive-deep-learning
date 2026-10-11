from __future__ import annotations

import json
from dataclasses import dataclass

from .client import LLMServiceUnavailable


@dataclass(frozen=True)
class UserFacingError:
    code: str
    message: str


SERVICE_ERRORS: dict[str, UserFacingError] = {
    "configuration_error": UserFacingError(
        "AI_CONFIGURATION_ERROR",
        "AI 服务配置不完整，请联系管理员检查配置。",
    ),
    "quota_exhausted": UserFacingError(
        "AI_QUOTA_EXHAUSTED",
        "AI 服务额度已用完，请联系管理员充值后重试。",
    ),
    "rate_limited": UserFacingError(
        "AI_RATE_LIMITED",
        "AI 请求过于频繁，请稍后再试。",
    ),
    "authentication_failed": UserFacingError(
        "AI_AUTHENTICATION_FAILED",
        "AI 服务认证失败，请联系管理员检查配置。",
    ),
    "timeout": UserFacingError(
        "AI_REQUEST_TIMEOUT",
        "AI 服务响应超时，请稍后再试。",
    ),
    "network_error": UserFacingError(
        "AI_NETWORK_ERROR",
        "暂时无法连接 AI 服务，请检查服务是否启动或稍后再试。",
    ),
    "invalid_proxy_response": UserFacingError(
        "AI_INVALID_RESPONSE",
        "AI 服务返回了异常响应，请稍后再试。",
    ),
    "empty_response": UserFacingError(
        "AI_EMPTY_RESPONSE",
        "AI 服务没有返回内容，请稍后再试。",
    ),
    "upstream_error": UserFacingError(
        "AI_SERVICE_UNAVAILABLE",
        "AI 服务暂时不可用，请稍后再试。",
    ),
}

FORMAT_WARNING = UserFacingError(
    "MODEL_RESPONSE_FORMAT_ERROR",
    "AI 已返回回答，但返回格式无法解析。下面保留了原始回答。",
)

INTERNAL_ERROR = UserFacingError(
    "INTERNAL_ERROR",
    "服务内部处理失败，请稍后再试或联系管理员。",
)

NOT_FOUND = UserFacingError(
    "NOT_FOUND",
    "请求的接口不存在。",
)


def user_facing_service_error(exc: LLMServiceUnavailable) -> UserFacingError:
    return user_facing_service_reason(exc.reason)


def user_facing_service_reason(reason: str) -> UserFacingError:
    return SERVICE_ERRORS.get(reason, SERVICE_ERRORS["upstream_error"])


def user_facing_input_error(exc: ValueError) -> UserFacingError:
    if isinstance(exc, json.JSONDecodeError):
        return UserFacingError("INVALID_JSON", "请求 JSON 格式不正确。")

    message = str(exc).strip()
    if message == "JSON body must be an object.":
        return UserFacingError("INVALID_REQUEST_BODY", "请求内容必须是 JSON 对象。")
    if message.startswith("Request body too large"):
        return UserFacingError("REQUEST_BODY_TOO_LARGE", "请求内容过大，请缩短后重试。")
    if message.startswith(("请先", "缺少", "未知的简答题")):
        return UserFacingError("INVALID_REQUEST", message[:160])
    return UserFacingError("INVALID_REQUEST", "请求内容不正确，请检查后重试。")
