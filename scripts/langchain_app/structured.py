from __future__ import annotations

import time
from typing import Any, Callable

from .client import DEFAULT_CLIENT, ProxyClient
from .config import CONFIG
from .dependencies import load_parts
from .diagnostics import trace
from .errors import FORMAT_WARNING
from llm_settings import LLM_MAX_TOKENS


ResultTransform = Callable[[dict[str, Any]], dict[str, Any]]


class TaskResult(dict[str, Any]):
    def __init__(
        self,
        result: dict[str, Any] | None,
        *,
        structured: bool,
        raw_text: str | None = None,
        parse_error: str | None = None,
        repair_attempted: bool = False,
        repair_error: str | None = None,
        repaired: bool = False,
    ) -> None:
        super().__init__(result or {})
        self.structured = structured
        self.raw_text = raw_text
        self.parse_error = parse_error
        self.repair_attempted = repair_attempted
        self.repair_error = repair_error
        self.repaired = repaired

    @classmethod
    def parsed(
        cls,
        result: dict[str, Any],
        *,
        repaired: bool = False,
        parse_error: str | None = None,
    ) -> "TaskResult":
        return cls(
            result,
            structured=True,
            parse_error=parse_error,
            repair_attempted=repaired,
            repaired=repaired,
        )

    @classmethod
    def unstructured(
        cls,
        raw_text: str,
        *,
        parse_error: str,
        repair_attempted: bool,
        repair_error: str | None = None,
    ) -> "TaskResult":
        return cls(
            None,
            structured=False,
            raw_text=raw_text,
            parse_error=parse_error,
            repair_attempted=repair_attempted,
            repair_error=repair_error,
        )

    def http_fields(self) -> dict[str, Any]:
        fields: dict[str, Any] = {
            "structured": self.structured,
            "result": dict(self) if self.structured else None,
        }
        if self.repaired:
            fields["repaired"] = True
        if not self.structured:
            fields.update(
                {
                    "rawText": self.raw_text,
                    "warning": {
                        "code": FORMAT_WARNING.code,
                        "message": FORMAT_WARNING.message,
                        "repairAttempted": self.repair_attempted,
                    },
                }
            )
        return fields


def as_dict(model_obj: Any) -> dict[str, Any]:
    if hasattr(model_obj, "model_dump"):
        return model_obj.model_dump()
    if hasattr(model_obj, "dict"):
        return model_obj.dict()
    raise TypeError("Parsed result is not a Pydantic object.")


def format_prompt(template: str, parser: Any, variables: dict[str, Any]) -> str:
    prompt = load_parts().PromptTemplate.from_template(template).partial(
        format_instructions=parser.get_format_instructions()
    )
    return prompt.format(**variables)


def repair_output(
    bad_text: str,
    parse_error: str,
    parser: Any,
    *,
    model: str,
    timeout: float,
    max_tokens: int,
    client: ProxyClient,
    transform: ResultTransform | None = None,
    system_prompt: str | None = None,
) -> TaskResult:
    repair_started = time.perf_counter()
    trace(
        "structured.repair.start",
        model=model,
        badResponseChars=len(bad_text),
        parseErrorChars=len(parse_error),
        maxTokens=max_tokens,
    )
    repair_prompt = f"""
下面的模型输出没有通过 JSON/Pydantic 解析。

解析错误：
{parse_error}

原始输出：
{bad_text}

请只返回一份修复后的 JSON。不要解释，不要 Markdown。

格式要求：
{parser.get_format_instructions()}
""".strip()
    fixed_text = client.call(
        repair_prompt,
        model=model,
        temperature=0.0,
        max_tokens=max_tokens,
        timeout=timeout,
        system_prompt=system_prompt,
    )
    trace(
        "structured.repair.response_received",
        model=model,
        responseChars=len(fixed_text),
        durationMs=int((time.perf_counter() - repair_started) * 1000),
    )
    parse_started = time.perf_counter()
    result = as_dict(parser.parse(fixed_text))
    if transform:
        result = transform(result)
    trace(
        "structured.repair.complete",
        model=model,
        resultKeys=sorted(result.keys()),
        parseDurationMs=int((time.perf_counter() - parse_started) * 1000),
        durationMs=int((time.perf_counter() - repair_started) * 1000),
    )
    return TaskResult.parsed(result, repaired=True, parse_error=parse_error)


def run_structured(
    *,
    parser: Any,
    template: str,
    variables: dict[str, Any],
    timeout: float,
    temperature: float = 0.0,
    max_tokens: int = LLM_MAX_TOKENS,
    repair_max_tokens: int = LLM_MAX_TOKENS,
    error_tag: str = "parse-error",
    model: str = CONFIG.model,
    client: ProxyClient | None = None,
    transform: ResultTransform | None = None,
    system_prompt: str | None = None,
) -> TaskResult:
    run_started = time.perf_counter()
    active_client = client or DEFAULT_CLIENT
    format_started = time.perf_counter()
    prompt_text = format_prompt(template, parser, variables)
    trace(
        "structured.prompt.ready",
        errorTag=error_tag,
        model=model,
        promptChars=len(prompt_text),
        variableKeys=sorted(variables.keys()),
        durationMs=int((time.perf_counter() - format_started) * 1000),
    )
    raw_text = active_client.call(
        prompt_text,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        timeout=timeout,
        system_prompt=system_prompt,
    )
    trace(
        "structured.initial_response.received",
        errorTag=error_tag,
        model=model,
        responseChars=len(raw_text),
        durationMs=int((time.perf_counter() - run_started) * 1000),
    )
    parse_started = time.perf_counter()
    try:
        result = as_dict(parser.parse(raw_text))
        if transform:
            result = transform(result)
        trace(
            "structured.parse.complete",
            errorTag=error_tag,
            resultKeys=sorted(result.keys()),
            parseDurationMs=int((time.perf_counter() - parse_started) * 1000),
            durationMs=int((time.perf_counter() - run_started) * 1000),
        )
        return TaskResult.parsed(result)
    except Exception as exc:
        trace(
            "structured.parse.failed",
            errorTag=error_tag,
            errorType=type(exc).__name__,
            error=str(exc)[:500],
            parseDurationMs=int((time.perf_counter() - parse_started) * 1000),
            durationMs=int((time.perf_counter() - run_started) * 1000),
        )
        parse_error = str(exc)
        try:
            repaired_result = repair_output(
                raw_text,
                parse_error,
                parser,
                model=model,
                timeout=timeout,
                max_tokens=repair_max_tokens,
                client=active_client,
                transform=transform,
                system_prompt=system_prompt,
            )
            trace(
                "structured.complete",
                errorTag=error_tag,
                structured=True,
                repaired=True,
                durationMs=int((time.perf_counter() - run_started) * 1000),
            )
            return repaired_result
        except Exception as repair_exc:
            trace(
                "structured.repair.failed",
                errorTag=error_tag,
                errorType=type(repair_exc).__name__,
                error=str(repair_exc)[:500],
                durationMs=int((time.perf_counter() - run_started) * 1000),
            )
            return TaskResult.unstructured(
                raw_text,
                parse_error=parse_error,
                repair_attempted=True,
                repair_error=str(repair_exc),
            )
