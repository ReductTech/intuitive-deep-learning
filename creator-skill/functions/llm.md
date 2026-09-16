# 大模型调用

课程需要大模型能力时，沿用仓库现有架构：

`React 模块 → LangChain Service :59414 → LLM Proxy :59413 → 上游模型`

`scripts/langchain_service.py` 和 `scripts/llm_proxy_service.py` 只是入口，实际任务、结构化解析和代理逻辑位于 `scripts/langchain_app/`。

本文件只指导大模型能力的设计与实现，不负责启动或检查后台服务。除非用户明确要求，不主动启动任何服务。

## 使用原则

只在确实需要语义理解或生成时调用大模型，例如开放回答评价、教学情境生成、因素或案例生成、自然语言结构化等。

确定性的计算、规则判断、状态变化和动画应留在本地，不为了增加“AI 感”调用大模型。

## React 侧

- 模型请求统一封装在模块自己的 `services/` 中，不在 page 或 block 中散落 `fetch`。
- React 只调用 LangChain Service 的业务接口，不直接访问 LLM Proxy 或上游模型。
- 浏览器和课程模块中不得保存 API Key、Base URL 或模型认证信息。
- 页面只依赖稳定的结构化业务字段，不解析模型原始文本驱动核心逻辑。
- 调用期间提供自然的等待状态，失败时提供可理解、可重试的反馈。
- `modules-legacy/` 只能作为参考，active 模块不得依赖其中的运行时代码。

## 开放回答评价

需要大模型根据参考答案评价学习者输入时，在模块根目录建立统一的 `assessment.json`，供该模块下不同 pages 共享使用，不再维护集中式全局题库。

标准结构：

~~~json
{
  "assessments": [
    {
      "id": "...",
      "question": "...",
      "reference_answer": ["...", "..."],
      "grading_notes": "..."
    }
  ]
}
~~~

字段说明：

- `id`：稳定的评价任务标识，使用“小写英文 + 点号”命名，例如 `loss.l1_l2_comparison`。
- `question`：展示给学习者的问题。
- `reference_answer`：列出该题可接受的核心答案要点。学习者只要表达出其中一个或部分正确要点，且没有明显错误或与参考答案冲突，即判为 `correct`；不要求覆盖全部要点，也不要求措辞一致。
- `grading_notes`：补充该题的判定边界，例如允许哪些近似表达、哪些遗漏仍可判正确，以及哪些错误必须判为 `incorrect`。
评价仅分两档：
- `correct`：回答与 `reference_answer` 的核心含义一致，即使表达不完整也算正确。
- `incorrect`：回答核心结论错误、方向相反、明显事实错误，或完全没有体现任何参考答案中的正确含义。

不要为每一道简答题分别实现 Prompt、评分逻辑或解析代码。通用评价规则和结构化输出统一由 LangChain Service 负责。

## 新的大模型任务

现有能力无法表达需求时：

1. 在 `scripts/langchain_app/tasks/` 中新增或扩展任务。
2. 明确输入字段、Prompt 和结构化输出 Schema。
3. 优先使用 `run_structured(...)` 完成调用和解析。
4. 在 `scripts/langchain_app/registry.py` 注册业务 Endpoint。
5. React 通过模块自己的 `services/` 调用该 Endpoint。

前端只使用稳定的结构化结果。结构化任务通常使用较低随机性，只有任务本身需要开放生成时才提高生成自由度。

## 设计要求

大模型应作为教学流程中的语义能力，而不是独立聊天窗口。

模型结果应尽量直接作用于当前知识对象，例如根据学生回答生成反馈、根据输入改变案例、补充变量或调整后续解释。

避免“输入一句话 → AI 输出一大段文字”。生成内容应尽量短、结构化、可操作，并继续参与后续教学交互。