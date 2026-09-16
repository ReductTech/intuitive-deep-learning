import { AIMessage, HumanMessage, type BaseMessage } from "@langchain/core/messages";
import type { StructuredToolInterface } from "@langchain/core/tools";
import type { AgentEvent, Settings } from "./types";

export const SYSTEM_PROMPT = `你是「Web Agent」——一个运行在浏览器里的智能体 Demo。

工作方式：
- 你是 ReAct 智能体：先思考，再决定是否调用工具，拿到观察结果后继续推理，直到能给出可靠答案。
- 工具是你在浏览器里唯一的信息来源，也是你唯一的行动手段。
- 凡是可以用工具确认的事实（算术、时间、事实性知识、用户给的链接、副作用操作），必须先调用工具，不要凭记忆回答。
- 一次可以调用多个工具；如果第一次结果不够，就继续调用。
- 工具失败时，向用户说明失败原因，并给出可用的替代方案，不要编造结果。

回答要求：
- 用中文回答，语气专业但简洁。
- 使用 Markdown：小标题、短列表、必要时用表格；公式写成行内代码或 LaTeX 风格文本。
- 引用工具返回的来源链接，让用户能自行核对。
- 结尾不要写「希望这对你有帮助」之类的客套话。`;

export interface RunAgentParams {
  input: string;
  history: { role: "user" | "assistant"; content: string }[];
  settings: Settings;
  tools: StructuredToolInterface[];
  emit: (event: AgentEvent) => void;
  signal?: AbortSignal;
}

interface ContentBlock {
  type?: string;
  text?: string;
  reasoning?: string;
}

function readChunk(chunk: unknown): { text: string; reasoning: string } {
  let text = "";
  let reasoning = "";
  const message = chunk as { content?: unknown; additional_kwargs?: Record<string, unknown> } | undefined;
  const content = message?.content;
  if (typeof content === "string") {
    text += content;
  } else if (Array.isArray(content)) {
    for (const block of content as (ContentBlock | string)[]) {
      if (typeof block === "string") {
        text += block;
        continue;
      }
      if (!block || typeof block !== "object") continue;
      if (block.type === "text" || block.type === "text_delta") text += block.text ?? "";
      else if (block.type === "reasoning" || block.type === "reasoning_delta") {
        reasoning += block.reasoning ?? block.text ?? "";
      }
    }
  }
  const reasoningContent = message?.additional_kwargs?.reasoning_content;
  if (typeof reasoningContent === "string") reasoning += reasoningContent;
  return { text, reasoning };
}

function stringify(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  const message = value as { content?: unknown };
  if (message && typeof message === "object" && "content" in message) {
    const inner = message.content;
    if (typeof inner === "string") return inner;
    if (Array.isArray(inner)) return readChunk({ content: inner }).text;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function prettyArgs(input: unknown): string {
  if (typeof input === "string") {
    try {
      return JSON.stringify(JSON.parse(input), null, 2);
    } catch {
      return input;
    }
  }
  if (input && typeof input === "object") {
    const wrapper = input as { input?: unknown };
    const inner = "input" in wrapper && Object.keys(input as object).length === 1 ? wrapper.input : input;
    try {
      return JSON.stringify(inner, null, 2);
    } catch {
      return String(inner);
    }
  }
  return String(input ?? "");
}

export function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/401|invalid_api_key|Incorrect API key/i.test(message)) {
    return "API Key 无效或已过期（401）。请在设置里检查 Key，或切换到离线演示模式。";
  }
  if (/429|rate limit/i.test(message)) {
    return "请求被限流（429）。稍等几秒再试，或换一个模型。";
  }
  if (/insufficient|quota|余额|额度/i.test(message)) {
    return `账户额度不足：${message}`;
  }
  if (/Failed to fetch|NetworkError|Load failed|fetch failed/i.test(message)) {
    return "网络请求失败：无法连接到接口地址。请检查 Base URL、本机网络代理，以及该服务是否允许浏览器跨域调用（CORS）。";
  }
  if (/404|model_not_found|does not exist|not supported/i.test(message)) {
    return `模型不可用：${message}。请在设置里更换模型，例如 gpt-5.4-mini。`;
  }
  return message;
}

export function toMessages(
  history: { role: "user" | "assistant"; content: string }[],
  input: string,
): BaseMessage[] {
  const messages: BaseMessage[] = history
    .filter((item) => item.content.trim())
    .map((item) => (item.role === "user" ? new HumanMessage(item.content) : new AIMessage(item.content)));
  messages.push(new HumanMessage(input));
  return messages;
}

/** 用 LangChain 的 createAgent 跑一轮真实的 ReAct 循环，并把轨迹实时推给界面 */
export async function runLiveAgent(params: RunAgentParams): Promise<void> {
  const { settings, tools, emit, signal, history, input } = params;
  if (!settings.apiKey) {
    throw new Error("缺少 API Key：请在设置里填写，或切换到离线演示模式。");
  }

  // LangChain 体积较大，只有真正跑模型时才加载
  const [{ ChatOpenAI }, { createAgent }] = await Promise.all([
    import("@langchain/openai"),
    import("langchain"),
  ]);

  const model = new ChatOpenAI({
    model: settings.model,
    apiKey: settings.apiKey,
    temperature: settings.temperature,
    streaming: true,
    maxRetries: 1,
    configuration: { baseURL: settings.baseUrl || undefined },
  });

  const agent = createAgent({ model, tools, systemPrompt: SYSTEM_PROMPT });
  const messages = toMessages(history, input);

  const stream = agent.streamEvents(
    { messages },
    { version: "v2", signal, recursionLimit: Math.max(4, settings.maxSteps * 2 + 2) },
  );

  for await (const event of stream) {
    if (signal?.aborted) break;
    if (event.event === "on_chat_model_stream") {
      const { text, reasoning } = readChunk(event.data?.chunk);
      if (reasoning && settings.showReasoning) emit({ type: "reasoning", delta: reasoning });
      if (text) emit({ type: "text", delta: text });
      continue;
    }
    if (event.event === "on_tool_start") {
      emit({
        type: "tool-start",
        id: event.run_id,
        name: event.name,
        args: prettyArgs(event.data?.input),
      });
      continue;
    }
    if (event.event === "on_tool_end") {
      const output = stringify(event.data?.output);
      emit({
        type: "tool-end",
        id: event.run_id,
        name: event.name,
        result: output,
        isError: /^error|失败|exception/i.test(output.slice(0, 40)),
      });
    }
  }
}