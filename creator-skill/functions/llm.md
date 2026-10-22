# 大模型调用与简答题

用于开放回答评价、教学情境生成和自然语言结构化。确定性计算、状态变化、规则与动画留在本地；模型结果应直接服务当前知识对象，避免独立聊天窗口和长段生成文字。

## 普通简答题：直接使用 Shared Question

```tsx
<Question
  type="short"
  title="为什么数像素也可以叫特征？"
  referenceAnswer="像素数量是按固定规则测得、可在不同样本间比较的数值，因此能帮助区分类别。"
/>
```

- PPT：SceneDeck 自动切换到揭示模式，点击后在只读答题框显示已核对的参考答案，不提交学生回答、不调用模型。
- Guide：保留可输入答题框，提交后由 Shared 发送题目、参考答案与学生回答到 `/short-answer/evaluate`，呈现真实反馈。
- 新题不需要 `taskId`，不需要题库登记，也不要求创建 `assessment.json`。服务根据题目和参考答案生成稳定 SHA-256 标识。
- 旧题可继续使用 `taskId`；特殊评价可用 `review` 覆盖。没有可用的文字题目与参考答案、旧 `taskId` 或 `review` 时仅作本地提交，不声称完成模型评阅。
- 不在页面里手写 URL、DOM 类名或 `isPpt` 判断双入口。其他题型不套用这套简答题行为。

以 `modules/shared/react/learning/Question.tsx`、`reviewShortAnswer.ts` 和 `backend/src/idl_backend/assessment/tasks/short_answer.py` 为当前实现依据。

## 评价契约

普通简答题评价接口接受：

```json
{"question":"题目","reference_answer":"参考答案","answer":"学生回答"}
```

直接调用业务接口时 `reference_answer` 也可为非空要点数组，`notes` 可提供判定备注；Shared Question 的 `referenceAnswer` 使用字符串。旧接口兼容 `{task_id, answer}`。

当前结果分为 `correct`、`close`、`incorrect`，对应正确、接近正确、错误。按语义判断，不匹配关键词或要求逐字复述。主要思路完整且无冲突为正确；无明显错误但不足以确认主要思路为接近正确；明确事实、逻辑或方向错误为错误。反馈应忠实指出说对、缺失或冲突之处。

不在页面重写 Prompt、解析或评分规则，不把三级评价改成两级；新增特殊业务规则先检查现有任务能否表达。

## 服务与前端边界

沿用现有链路：`React → 共用 Cloud API /api/ai → assessment → LLM Proxy → 上游模型`。本地与云端使用同一份 Cloud `frontend/cloud-runtime.js` 做既有 URL 的同源转换和课程上下文注入。实际配置与启动方式查 `backend/README.md`，不要在课程中硬编码一套服务配置。

- 自定义请求封装在模块自己的 `services/`，复用现有业务接口；Shared Question 已有能力直接使用。
- 请求带 `X-Course-ID`，值为当前模块 UUID；检查共用 runtime 的自动注入，绕过它调用时沿用同一契约。
- 浏览器和课程模块不保存 API Key、上游地址或模型认证信息，不直接调用 Proxy 或上游模型。
- 页面只使用结构化业务字段，提供等待、失败与重试反馈，不伪造成功或模型结果。
- 服务运行是实际评阅的前提；本说明不要求自动启动服务。未获相关授权时不启动后台服务或训练。

## 新增语义任务

先检查 `backend/src/idl_backend/assessment/registry.py` 与 `contracts/tasks.py` 中已有接口。确需扩展时，在 `assessment/tasks/` 定义输入、Prompt 和输出 Schema，优先复用 `run_structured(...)`；在 assessment registry 注册处理器，并同步 contracts 中的 endpoint 目录。前端仅消费稳定结构化结果。

只在任务需要开放生成时提高随机性。保持输出简短、可操作，并参与后续教学交互。
