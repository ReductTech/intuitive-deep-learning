from __future__ import annotations

import json
from functools import lru_cache, partial
from pathlib import Path
from typing import Any, Literal

from ..dependencies import load_parts
from ..structured import run_structured
from .common import require_text


QUESTION_BANK_PATH = Path(__file__).resolve().parent.parent / "data" / "short_answer_questions.json"

SHORT_ANSWER_SYSTEM_PROMPT = """
你是深度学习互动课程的简答题评阅器。你只评估学习者的回答，不改变题目，也不补造学习者没有表达的观点。内部判断过程保持简洁，不需要过分展开。最终响应必须完整且仅包含符合指定 schema 的 JSON 对象，不要在其前后添加解释、Markdown 或分析文字。

所有题目统一分为三个等级：
1. 正确：学习者已经回答出参考答案的主要思路。允许使用不同措辞，不要求逐字复述，也不要求覆盖备注中标为非必需的补充点。
2. 接近正确：回答没有明显事实或逻辑错误，也没有与参考答案冲突，但只回答了部分要点、表达过于笼统，或还不足以确认主要思路完整成立。
3. 错误：回答包含明确的事实或逻辑错误、把关键方向说反、与参考答案冲突，或答非所问到无法体现相关理解。

判分原则：
- 只要回答中包含明确错误，即使同时提到部分正确内容，也应判为“错误”，不能判“接近正确”。
- 不做关键词机械匹配，要按语义判断。
- explanation 必须忠实说明学习者说对了什么、缺了什么或错在哪里，不能声称其缺少实际已经写出的内容。
- explanation 使用简短、友好的中文，不使用 Markdown，不重复 verdict。
- 输出必须严格遵守用户消息中给出的 JSON schema。
""".strip()

SHORT_ANSWER_PROMPT = """
任务 ID：{task_id}

题目：
{question}

参考答案的核心要点：
{reference_answer}

备注：
{notes}

页面或题目上下文：
{context}

学习者回答：
{answer}

请按照统一的“正确 / 接近正确 / 错误”三级标准评阅。

输出格式：
{format_instructions}
""".strip()


def load_question_bank() -> dict[str, dict[str, Any]]:
    try:
        raw = json.loads(QUESTION_BANK_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RuntimeError(f"Cannot load short-answer question bank: {QUESTION_BANK_PATH}: {exc}") from exc

    questions = raw.get("questions") if isinstance(raw, dict) else None
    if not isinstance(questions, list):
        raise RuntimeError("Short-answer question bank must contain a questions array.")

    bank: dict[str, dict[str, Any]] = {}
    for index, item in enumerate(questions):
        if not isinstance(item, dict):
            raise RuntimeError(f"Short-answer question #{index + 1} must be an object.")
        extra_fields = set(item) - {"id", "question", "answer", "notes"}
        if extra_fields:
            raise RuntimeError(
                f"Short-answer question #{index + 1} contains unsupported fields: {sorted(extra_fields)}"
            )
        task_id = item.get("id")
        question = item.get("question")
        answer = item.get("answer")
        notes = item.get("notes")
        if not isinstance(task_id, str) or not task_id.strip():
            raise RuntimeError(f"Short-answer question #{index + 1} has no valid id.")
        if task_id in bank:
            raise RuntimeError(f"Duplicate short-answer question id: {task_id}")
        if not isinstance(question, str) or not question.strip():
            raise RuntimeError(f"Short-answer question {task_id} has no valid question.")
        if not isinstance(answer, list) or not answer or not all(isinstance(point, str) and point.strip() for point in answer):
            raise RuntimeError(f"Short-answer question {task_id} must have a non-empty answer array.")
        if notes is not None and not isinstance(notes, str):
            raise RuntimeError(f"Short-answer question {task_id} notes must be a string or null.")
        bank[task_id] = {
            "id": task_id,
            "question": question.strip(),
            "answer": [point.strip() for point in answer],
            "notes": notes.strip() if isinstance(notes, str) else "",
        }
    return bank


@lru_cache(maxsize=1)
def _evaluation_parser() -> Any:
    parts = load_parts()

    class ShortAnswerEvaluation(parts.BaseModel):
        verdict: Literal["正确", "接近正确", "错误"] = parts.Field(description="The unified three-level verdict.")
        level: Literal["correct", "close", "incorrect"] = parts.Field(description="Stable machine-readable level.")
        is_correct: bool = parts.Field(description="True only when verdict is 正确.")
        explanation: str = parts.Field(description="A concise Chinese response grounded in the learner answer.")

    return parts.PydanticOutputParser(pydantic_object=ShortAnswerEvaluation)


def _normalize_evaluation(result: dict[str, Any], *, task_id: str) -> dict[str, Any]:
    level_by_verdict = {"正确": "correct", "接近正确": "close", "错误": "incorrect"}
    verdict = str(result.get("verdict", "错误"))
    result["task_id"] = task_id
    result["level"] = level_by_verdict.get(verdict, "incorrect")
    result["is_correct"] = verdict == "正确"
    return result


def evaluate_short_answer(
    payload: dict[str, Any],
    timeout: float,
    *,
    task_id: str | None = None,
) -> dict[str, Any]:
    resolved_task_id = task_id or require_text(payload, "task_id", "缺少简答题 task_id。")
    answer = require_text(payload, "answer", "请先填写简答题答案。")
    task = load_question_bank().get(resolved_task_id)
    if task is None:
        raise ValueError(f"未知的简答题 task_id：{resolved_task_id}")

    context_payload = {
        key: value
        for key, value in payload.items()
        if key not in {"task_id", "answer", "temperature", "max_tokens", "maxTokens"}
    }
    reference_answer = "\n".join(f"- {point}" for point in task["answer"])
    context = json.dumps(context_payload, ensure_ascii=False, indent=2) if context_payload else "无"
    return run_structured(
        parser=_evaluation_parser(),
        template=SHORT_ANSWER_PROMPT,
        variables={
            "task_id": task["id"],
            "question": task["question"],
            "reference_answer": reference_answer,
            "notes": task["notes"] or "无",
            "context": context,
            "answer": answer,
        },
        timeout=timeout,
        temperature=0.0,
        error_tag=f"short-answer:{resolved_task_id}:parse-error",
        system_prompt=SHORT_ANSWER_SYSTEM_PROMPT,
        transform=partial(_normalize_evaluation, task_id=resolved_task_id),
    )
