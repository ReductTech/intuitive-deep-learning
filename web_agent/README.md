# Web Agent Demo

一个**完全独立**的前端小 Demo：用 **LangChain.js + React + Vite** 在浏览器里展示 Web 智能体（Web Agent）能做什么。

不需要后端。模型通过任何兼容 OpenAI Chat Completions 的接口调用，工具全部在浏览器里真实执行。

## 快速开始

```bash
cd web_agent
npm install
npm run dev          # http://localhost:5183
```

生产构建：

```bash
npm run build        # tsc + vite build → dist/
npm run preview      # 预览构建产物
```

## 这个 Agent 能干什么

界面左侧列出了 Agent 的工具箱，每个工具都是真实可用的：

| 工具 | 类型 | 说明 |
| --- | --- | --- |
| `calculator` | 纯本地 | 自写的表达式解析器（递归下降），支持 `+ - * / % ^`、括号、`sqrt/round/log/ln/exp/sin/cos/min/max/avg` 等函数、`pi/e`、阶乘 `!`。**不使用 eval**。 |
| `current_time` | 纯本地 | 任意 IANA 时区的当前时间，含 UTC 与 Unix 时间戳，可做跨时区换算。 |
| `web_search` | 联网 | DuckDuckGo 即时问答接口，零 API Key 拿实时事实。 |
| `wikipedia` | 联网 | 先 `list=search` 找词条，再读 `rest_v1/page/summary` 摘要。 |
| `read_webpage` | 联网 | 抓取 URL 正文：先直连，被跨域拦截时回退到 `r.jina.ai` 文本代理。 |
| `add_todo` / `list_todos` / `complete_todo` | 副作用 | 真实写入左侧「待办清单」面板，演示 Agent 不只读数据，还能改变应用状态。 |

界面上能直观看到 Agent 的完整轨迹：**思考 → 调用工具（入参 / 观察结果 / 耗时）→ 继续推理 → 最终回答**。

## 两种运行模式

- **真实模型**：`createAgent()` 构建的 ReAct 智能体，模型自主决定调用哪个工具、调用几次，全程流式输出。
- **离线演示**：不需要任何 API Key。工具照样真实执行，只是「决策」由本地启发式脚本模拟，用于讲清 Agent 骨架或做无网络演示。

两种模式共用同一套界面与事件流，切换只影响 `src/lib/runner.ts` 走哪条分支。

## 配置

右上角 **设置** 面板可修改 Base URL、API Key、模型、温度、最大思考步数，配置持久化在 `localStorage`。

`src/lib/settings.ts` 中内置了一套演示凭据（Base URL / Key / 模型），所以 clone 下来 `npm run dev` 就能直接对话。也可以用环境变量覆盖：

```bash
# web_agent/.env.local
VITE_OPENAI_BASE_URL=https://api.example.com/v1
VITE_OPENAI_API_KEY=sk-...
VITE_OPENAI_MODEL=gpt-5.4-mini
```

## 目录结构

```
web_agent/
├── index.html
├── vite.config.ts
└── src/
    ├── main.tsx              # 入口
    ├── App.tsx               # 状态编排：会话、事件流、待办、统计
    ├── styles.css            # 全部样式（暗色主题，无 CSS 框架）
    ├── components/
    │   ├── Sidebar.tsx       # 工具箱 / 示例任务 / 待办 / 统计
    │   ├── ChatMessage.tsx   # 消息、工具卡片、思考过程折叠块
    │   ├── Composer.tsx      # 输入框与快捷示例
    │   ├── SettingsDrawer.tsx# 运行设置抽屉
    │   └── Markdown.tsx      # Markdown 渲染 + 代码块复制
    └── lib/
        ├── types.ts          # 共享类型与事件协议
        ├── agent.ts          # 真实 LangChain ReAct 运行时 + 事件流映射
        ├── demoAgent.ts      # 无需 Key 的离线演示运行时
        ├── runner.ts         # 模式分发入口
        ├── tools.ts          # 工具定义（zod schema + 实现）
        ├── calculator.ts     # 零依赖安全表达式求值器
        └── settings.ts       # 默认配置与持久化
```

## 实现要点

- **事件协议统一**：`agent.ts` 把 LangGraph 的 `streamEvents(version: "v2")`（`on_chat_model_stream` / `on_tool_start` / `on_tool_end`）翻译成 `text` / `reasoning` / `tool-start` / `tool-end` 四种事件，UI 只认这套协议，因此换模型、换运行时都不需要动界面。
- **按需加载**：`@langchain/openai` 与 `langchain` 用动态 `import()` 加载，只有真正跑模型时才下载，首屏更轻。
- **可中断**：每轮对话持有 `AbortController`，`signal` 一路透传到 LangGraph 与 fetch，点「停止」立即中断。
- **错误可读**：401 / 429 / 404 / 跨域失败会被 `friendlyError()` 翻译成中文提示，而不是抛出原始堆栈。

## 注意事项

- Demo 会把 API Key 打包进浏览器产物，**仅适合本地演示或内部试用**；生产环境请改为由后端代理调用模型。
- `web_search` 依赖 DuckDuckGo 接口，`read_webpage` 依赖目标站点或 `r.jina.ai` 代理的可用性与限流。
- 部分模型（如 `gpt-5.6-terra`）在 `/v1/chat/completions` 下不支持函数调用，需要换模型或改用 Responses API。