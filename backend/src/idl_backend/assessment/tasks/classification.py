from __future__ import annotations

from functools import lru_cache
from typing import Any

from ..config import CONFIG
from ..dependencies import load_parts
from ..structured import run_structured
from .common import optional_text


PROMPT = """
你要为一个“从手绘分类边界到 MLP”的中文教学网页，把用户熟悉的事物转成一个真实可讲的二分类场景。

用户输入的事物：{subject}
用户补充背景：{context}

网页交互会这样使用你的输出：
- 页面会展示二维散点图。
- 横轴使用 feature_x.axis_label。
- 纵轴使用 feature_y.axis_label。
- 蓝点是 negative_label，红点是 positive_label。
- 学生要手动画出分类边界，把大多数蓝点和红点分开。

要求：
1. 不要再使用固定的“煎饼果子”演示，除非用户真的输入了煎饼果子。
2. normalized_subject 必须贴近用户输入，不要偷换成无关主题。
3. task_question 必须是围绕该主题的二分类问题，例如“能不能判断一个人是否喜欢网球？”或“能不能判断一碗拉面是否会被顾客喜欢？”。
4. positive_label 和 negative_label 要互为对立，并适合标在红点/蓝点上。
5. feature_x 与 feature_y 都必须是可以用 0-1 估计的可量化特征。
6. 两个 axis_label 必须自然、短，适合显示在图上；并且数值越高，越应该支持 positive_label。
7. 如果原始概念里最自然的是阻力因素，请改写成正向量，例如把“价格压力”改成“价格接受度”，不要让轴越高越反向。
8. intro_lines 必须正好四句，每句不超过 42 个中文字符，像网页逐行输出，不要 Markdown。
9. intro_lines 应依次说明：用户输入、如何变成分类任务、两个特征是什么、为什么画边界就是分类模型在学的事。
10. boundary_note 必须提到横轴和纵轴的真实 feature axis label。
11. first/second/third level description 都要围绕该主题，不要出现煎饼果子、饼皮湿度、顾客试吃等固定旧例子，除非用户输入就是它。
12. second_level_description 要说明加入了更接近真实数据的噪声或模糊样本。
13. third_level_description 要说明出现非线性结构，单条简单边界会吃力。
14. 用中文输出，严格符合下面格式：

{format_instructions}
""".strip()


@lru_cache(maxsize=1)
def _parser() -> Any:
    parts = load_parts()

    class ClassificationFeature(parts.BaseModel):
        name: str = parts.Field(description="A short semantic feature name, 2-8 Chinese characters when possible.")
        axis_label: str = parts.Field(
            description="A concise measurable axis label. Higher values must support the positive class."
        )
        question: str = parts.Field(description="A natural question used to estimate this feature for one sample.")
        measurement: str = parts.Field(description="How this feature can be estimated on a 0-1 scale.")

    class ClassificationScenario(parts.BaseModel):
        subject: str = parts.Field(description="The original user subject.")
        normalized_subject: str = parts.Field(description="A concise cleaned subject.")
        task_question: str = parts.Field(description="A binary classification question for the MLP playground.")
        positive_label: str = parts.Field(description="The red class label.")
        negative_label: str = parts.Field(description="The blue class label, opposite to positive_label.")
        summary: str = parts.Field(description="A short summary of the classification setup.")
        feature_x: ClassificationFeature = parts.Field(description="The horizontal input feature.")
        feature_y: ClassificationFeature = parts.Field(description="The vertical input feature.")
        intro_lines: list[str] = parts.Field(min_length=4, max_length=4, description="Exactly four short Chinese lines.")
        boundary_note: str = parts.Field(description="One sentence explaining the axes and drawn boundary.")
        first_level_name: str = parts.Field(description="Short title for the first hand-drawn-boundary challenge.")
        first_level_description: str = parts.Field(description="Description for the first challenge.")
        second_level_description: str = parts.Field(description="Description for the noisy-sample challenge.")
        third_level_description: str = parts.Field(description="Description for the nonlinear challenge.")

    return parts.PydanticOutputParser(pydantic_object=ClassificationScenario)


def generate_classification_scenario(payload: dict[str, Any], timeout: float) -> dict[str, Any]:
    subject = optional_text(payload, "subject") or optional_text(payload, "example", "网球")
    context = optional_text(payload, "context")
    temperature = float(payload.get("temperature", 0.25))
    print(
        f"[langchain-service] generating classification scenario subject={subject!r} model={CONFIG.model}",
        flush=True,
    )
    return run_structured(
        parser=_parser(),
        template=PROMPT,
        variables={"subject": subject, "context": context or "无"},
        timeout=timeout,
        temperature=temperature,
        error_tag="classification-parse-error",
    )
