from __future__ import annotations

from functools import lru_cache
from typing import Any, Literal

from ..dependencies import load_parts
from ..structured import run_structured
from .common import optional_text, require_text


FACTOR_DIMENSIONS = """
候选因素只允许来自以下九个维度：
1. 个人意愿：我到底想不想。
2. 经济条件：有没有钱、成本高不高。
3. 家庭因素：家人是否支持、需要承担什么责任。
4. 能力经验：我能不能做好、是否具备相关经验。
5. 时间安排：有没有时间、年龄或时机是否合适。
6. 机会窗口：现在是不是最佳时机、机会是否容易错过。
7. 风险大小：最坏结果是什么、能不能承受。
8. 长期发展：对未来成长、职业或生活有没有帮助。
9. 现实环境：城市、行业、政策、市场等外部条件。

因素名可以使用上面的维度名，也可以结合当前决策做具体化，例如把“经济条件”写成“经济压力”，但语义必须明确属于其中一个维度，不要创造范围外的新维度。
""".strip()


INTAKE_PROMPT = """
你要为一个神经元入门教学网页理解用户正在犹豫的决定，并准备第一幕要展示的一个输入信号。

用户原始输入：{raw_decision}

{factor_dimensions}

要求：
1. 把输入规范成只讨论一个目标动作的 yes/no 决策。
2. normalized_decision 使用自然问句，推荐“要不要 + 目标动作 + ？”。
3. positive_label 只写目标动作短标签；negative_label 写这个动作的否定。
4. 如果表达复杂，只抽取一个最适合作为教学入口的目标动作，不保留多选、对比或并列结构。
5. status 只能是：
   - ok：可以继续分析。
   - unclear：输入太碎或太抽象，无法可靠形成具体决策。
   - refuse：严重违法、严重暴力伤害、剥削、欺诈、非自愿性行为、未成年人性内容等高风险意图。
6. 成人之间自愿的性或亲密关系话题本身不是违规。
7. status 不是 ok 时，reason 用中文说明原因，其余文本字段可以为空，suggested_importance 填 0.5。
8. status 是 ok 时，从上述九个维度中选择最相关的一个，生成第一幕要展示的可量化因素：
   - first_factor_name：简短的概念因素名。
   - first_factor_direction：原始强度越高越支持 positive_label 时为 positive，越削弱时为 negative。
   - first_factor_value_label：用户可以直接评分的具体原始变量名。
   - first_factor_value_question：询问用户当前真实强度的问题，不要替用户给出答案。
   - first_factor_explanation：一句简短说明，解释它为什么影响当前决策。
   - suggested_importance：网页第一幕展示的建议权重，0-1；这是因素对当前决策的重要性，不是用户的真实强度。
9. suggested_importance 需要有区分度，避免无理由固定输出 0.5。

输出必须严格符合下面格式：
{format_instructions}
""".strip()


EXTRA_FACTORS_PROMPT = """
你要为神经元入门教学网页补充两个输入信号。第一个信号已经展示；所有权重由 AI 建议，用户只填写每个信号的当前真实强度。

当前决策：{decision}
正向标签：{positive_label}
反向标签：{negative_label}
已经使用的第一个因素：{primary_factor_name}
用户补充背景：{context}

{factor_dimensions}

要求：
1. factors 必须正好包含 2 个新因素，只能从上述九个维度中选择。
2. 两个新因素必须来自两个不同维度，不能重复“已经使用的第一个因素”所属的维度，两者也不要互相重复。
3. 因素必须具体、可量化，并且适合让用户用 0-1 评分。
4. name 是简短的概念因素名。
5. direction 根据原始变量语义判断：值越高越支持 positive_label 时为 positive，越削弱时为 negative。
6. value_label 是用户可以直接评分的具体原始变量名，不要为了保持正向而改写成不自然的变量。
7. suggested_importance 是 AI 给出的建议权重 w，范围 0-1；用户不会填写或修改这个权重。
8. value_question 询问用户目前在 value_label 上的真实状态，也就是让用户填写输入 x。
9. 不要输出 importance_question，也不要替用户建议 value。
10. explanation 用一句简短说明解释这个因素为什么影响当前决策。
11. 所有内容都围绕规范后的当前决策，不要重新引入多选、对比或并列结构。

输出必须严格符合下面格式：
{format_instructions}
""".strip()


def value_transform(direction: str) -> Literal["direct", "inverse"]:
    return "direct" if direction == "positive" else "inverse"


def prepare_intake_result(result: dict[str, Any]) -> dict[str, Any]:
    status = result.get("status")
    response: dict[str, Any] = {
        "status": status,
        "decision": str(result.get("normalized_decision") or "").strip(),
        "positive_label": str(result.get("positive_label") or "").strip(),
        "negative_label": str(result.get("negative_label") or "").strip(),
        "reason": str(result.get("reason") or "").strip(),
        "primary_factor": None,
    }
    if status == "ok":
        direction = str(result.get("first_factor_direction") or "positive")
        response["primary_factor"] = {
            "name": str(result.get("first_factor_name") or "").strip(),
            "direction": direction,
            "value_transform": value_transform(direction),
            "value_label": str(result.get("first_factor_value_label") or "").strip(),
            "value_question": str(result.get("first_factor_value_question") or "").strip(),
            "explanation": str(result.get("first_factor_explanation") or "").strip(),
            "suggested_importance": float(result.get("suggested_importance", 0.5)),
        }
    return response


def prepare_extra_factors_result(result: dict[str, Any]) -> dict[str, Any]:
    factors = result.get("factors")
    if not isinstance(factors, list):
        return {"factors": []}
    prepared: list[dict[str, Any]] = []
    for factor in factors:
        if not isinstance(factor, dict):
            continue
        item = dict(factor)
        direction = str(item.get("direction") or "positive")
        item["value_transform"] = value_transform(direction)
        prepared.append(item)
    return {"factors": prepared}


@lru_cache(maxsize=1)
def _parsers() -> tuple[Any, Any]:
    parts = load_parts()

    class DecisionIntake(parts.BaseModel):
        status: Literal["ok", "refuse", "unclear"] = parts.Field(description="Whether the input can continue.")
        normalized_decision: str = parts.Field(description="A single natural yes/no Chinese decision question.")
        positive_label: str = parts.Field(description="The concise target action label.")
        negative_label: str = parts.Field(description="The concise opposite action label.")
        first_factor_name: str = parts.Field(description="The best first factor for the teaching scene.")
        first_factor_direction: Literal["positive", "negative"] = parts.Field(
            description="Whether a higher raw factor value supports or weakens the target action."
        )
        first_factor_value_label: str = parts.Field(description="The concrete raw variable the learner can rate.")
        first_factor_value_question: str = parts.Field(description="A natural question asking for the learner's current raw value.")
        first_factor_explanation: str = parts.Field(description="One concise explanation of why this factor matters.")
        suggested_importance: float = parts.Field(ge=0, le=1, description="Suggested first-scene importance weight.")
        reason: str = parts.Field(description="A concise explanation for normalization, refusal, or uncertainty.")

    class ExtraFactor(parts.BaseModel):
        name: str = parts.Field(description="A short factor name.")
        direction: Literal["positive", "negative"] = parts.Field(
            description="Whether a higher raw value supports or weakens the target action."
        )
        value_label: str = parts.Field(description="The concrete raw variable the learner can rate.")
        value_question: str = parts.Field(description="A natural question asking for the learner's current raw value.")
        suggested_importance: float = parts.Field(
            ge=0,
            le=1,
            description="AI-suggested importance weight; the learner does not choose it.",
        )
        explanation: str = parts.Field(description="One concise explanation of why this factor matters.")

    class ExtraFactors(parts.BaseModel):
        factors: list[ExtraFactor] = parts.Field(min_length=2, max_length=2, description="Exactly two additional factors.")

    return (
        parts.PydanticOutputParser(pydantic_object=DecisionIntake),
        parts.PydanticOutputParser(pydantic_object=ExtraFactors),
    )


def analyze_decision_intake(payload: dict[str, Any], timeout: float) -> dict[str, Any]:
    raw_decision = optional_text(payload, "decision", "读研")
    parser, _ = _parsers()
    return run_structured(
        parser=parser,
        template=INTAKE_PROMPT,
        variables={"raw_decision": raw_decision, "factor_dimensions": FACTOR_DIMENSIONS},
        timeout=timeout,
        error_tag="decision-intake-parse-error",
        transform=prepare_intake_result,
    )


def generate_extra_decision_factors(payload: dict[str, Any], timeout: float) -> dict[str, Any]:
    decision = require_text(payload, "decision", "缺少规范化后的决策。")
    positive_label = require_text(payload, "positive_label", "缺少正向标签。")
    negative_label = require_text(payload, "negative_label", "缺少反向标签。")
    primary_factor_name = require_text(payload, "primary_factor_name", "缺少第一个因素名称。")
    context = optional_text(payload, "context", "无")
    _, parser = _parsers()
    return run_structured(
        parser=parser,
        template=EXTRA_FACTORS_PROMPT,
        variables={
            "decision": decision,
            "positive_label": positive_label,
            "negative_label": negative_label,
            "primary_factor_name": primary_factor_name,
            "context": context,
            "factor_dimensions": FACTOR_DIMENSIONS,
        },
        timeout=timeout,
        temperature=float(payload.get("temperature", 0.2)),
        error_tag="decision-extra-factors-parse-error",
        transform=prepare_extra_factors_result,
    )
