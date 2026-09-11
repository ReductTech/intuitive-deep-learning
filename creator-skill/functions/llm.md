# 大模型调用

课程需要大模型能力时，沿用仓库现有架构：

`React 模块 → LangChain Service :59414 → LLM Proxy :59413 → 上游模型`

`scripts/langchain_service.py` 和 `scripts/llm_proxy_service.py` 只是入口，实际任务、结构化解析和代理逻辑位于 `scripts/langchain_app/`。

本文件只指导大模型能力的设计与实现方式，不负责启动、检查或验证后台服务。除非用户明确要求，不主动启动任何服务。

## 使用原则

只在确实需要语义理解或生成时使用大模型，例如：

- 开放回答评价
- 根据用户输入生成教学情境
- 生成与当前课程相关的因素、案例或解释
- 将自然语言转换为稳定的结构化结果

确定性的数学计算、状态变化、动画、规则判断和前端能够可靠完成的任务应留在本地，不为了增加“AI 感”而调用大模型。

## React 侧

- 优先参考 `modules/Neuron-Guide/services/decisionAnalysis.ts`。
- 模型请求统一封装在模块自己的 `services/` 中，不把 `fetch` 散落在 page 或 block。
- React 只调用 LangChain Service 的业务接口，不直接调用 LLM Proxy 或上游模型。
- 不在浏览器或课程模块中保存 API Key、Base URL 或模型认证信息。
- 页面只依赖稳定的业务字段，不直接依赖模型原始文本。
- 调用期间应有自然的等待状态；失败时提供可理解、可重试的反馈，不伪造 AI 结果继续教学。
- `modules-legacy/` 中的大模型交互可以作为设计参考，但 active 模块不得对 legacy 产生运行时依赖。

## 开放回答评价

开放回答优先复用现有通用简答评价能力。

1. 在 `scripts/langchain_app/data/short_answer_questions.json` 中定义题目、参考答案要点和备注。
2. 新模块优先使用 `/short-answer/evaluate`，传入 `task_id`、`answer` 和必要上下文。
3. 不要为每一道简答题重新设计一套 Prompt、评分逻辑和解析代码。
4. 模型反馈应服务于学习，说明学生已经理解什么、遗漏什么或哪里存在错误，而不只是给出“正确 / 错误”。

## 新的大模型任务

现有任务无法表达需求时：

1. 在 `scripts/langchain_app/tasks/` 中新增或扩展对应任务。
2. 明确输入字段、Prompt 和结构化输出 Schema。
3. 优先使用 `run_structured(...)` 完成模型调用和结构化解析。
4. 在 `scripts/langchain_app/registry.py` 注册业务 Endpoint。
5. React 通过模块自己的 `services/` 调用该 Endpoint。
6. 前端只使用稳定的结构化结果，不解析自由文本来驱动核心课程逻辑。

结构化任务通常使用较低随机性。只有教学任务本身需要多样化案例或开放生成时，才提高生成自由度。

## 设计要求

大模型应成为教学流程中的语义能力，而不是独立的聊天窗口。

优先让模型结果直接作用于当前知识对象，例如：

- 根据学生输入改变当前案例
- 根据回答生成针对性的反馈
- 根据情境补充新的可操作变量
- 根据学习状态调整下一步解释

避免把课程设计成“输入一句话 → AI 输出一大段文字”。

大模型生成的内容应尽量短、结构化、可操作，并继续参与后续页面或交互，使 AI 真正改变学习过程。