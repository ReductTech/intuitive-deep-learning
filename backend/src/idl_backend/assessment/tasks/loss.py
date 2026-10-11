from __future__ import annotations

import re
from functools import lru_cache
from typing import Any, Literal

from ..dependencies import load_parts
from ..structured import run_structured
from .common import require_text


PROBABILITY_LOSS_PROMPT = """
你要把学习者对二分类正样本损失 L(p) 的自然语言想法，转换成一个可安全绘图的函数族。p 的范围是 0<p<1，真实答案为 1。

学习者回答：{answer}

只能选择以下 family：
- negative_log: L=-a*log(p)，导数 -a/p。
- linear: L=a*(1-p)，导数 -a。
- quadratic: L=a*(1-p)^power，power 取 1 到 4。
- inverse: L=a*(1/p^power-1)，导数 -a*power/p^(power+1)。
- absolute: L=a*abs(1-p)；在 0<p<1 上等价于线性，导数 -a。

要求：
1. 没有明确公式、函数族或可推断的损失规则时，不要脑补；返回 is_meaningful=false，并展示推荐函数 -log(p)。
2. 只有 is_meaningful=true 时才选择最接近学习者原意的 family。
3. scale 缺省为 1；power 缺省为 2。
4. 只有明确写出 -log(p)、负对数似然或等价表达时，is_negative_log=true。
5. formula 和 derivative 必须与 family、scale、power 一致，只使用纯文本数学表达。
6. explanation 使用一句简短中文。
7. 只返回规定 JSON：

{format_instructions}
""".strip()


def default_probability_loss_design(explanation: str) -> dict[str, Any]:
    return {
        "family": "negative_log",
        "scale": 1.0,
        "power": 1.0,
        "formula": "L(p) = -log(p)",
        "derivative": "L'(p) = -1/p",
        "is_negative_log": True,
        "is_meaningful": False,
        "explanation": explanation,
    }


def has_meaningful_probability_loss_idea(answer: str) -> bool:
    compact = re.sub(r"\s+", "", answer.strip().lower())
    if len(compact) < 2 or re.fullmatch(r"[\d.,，。+\-−*/÷^()（）=]+", compact):
        return False
    if any(phrase in compact for phrase in ("不知道", "不会", "不懂", "随便", "都行", "没有想法")):
        return False
    if re.search(r"(log|ln|abs|p|1[-−]p|p[-−]1|平方|二次|倒数|绝对值)", compact):
        return True
    clues = ("预测", "概率", "接近", "远离", "损失", "惩罚", "错误", "错", "越大", "越小", "越接近", "越远")
    clue_count = sum(1 for clue in clues if clue in compact)
    return clue_count >= 2 and any(anchor in compact for anchor in ("损失", "惩罚", "错", "接近", "远离"))


@lru_cache(maxsize=1)
def _probability_loss_parser() -> Any:
    parts = load_parts()

    class ProbabilityLossDesign(parts.BaseModel):
        family: Literal["negative_log", "linear", "quadratic", "inverse", "absolute"]
        scale: float = parts.Field(ge=0.1, le=10)
        power: float = parts.Field(ge=1, le=4)
        formula: str
        derivative: str
        is_negative_log: bool
        is_meaningful: bool
        explanation: str

    return parts.PydanticOutputParser(pydantic_object=ProbabilityLossDesign)


def parse_probability_loss_design(payload: dict[str, Any], timeout: float) -> dict[str, Any]:
    answer = require_text(payload, "answer", "请先写下你对概率损失函数的想法或公式。")
    if not has_meaningful_probability_loss_idea(answer):
        return default_probability_loss_design(
            "你的输入还不像一个明确的损失规则或公式，这里先只展示常用的推荐函数 -log(p)。"
        )
    return run_structured(
        parser=_probability_loss_parser(),
        template=PROBABILITY_LOSS_PROMPT,
        variables={"answer": answer},
        timeout=timeout,
        error_tag="probability-loss-parse-error",
    )
