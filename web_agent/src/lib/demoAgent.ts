import type { StructuredToolInterface } from "@langchain/core/tools";
import type { RunAgentParams } from "./agent";
import { calculate } from "./calculator";
import type { AgentEvent } from "./types";
import { uid } from "./types";

/**
 * 演示模式运行时：不需要 API Key。
 * 它复用真实的工具（真的联网、真的计算），只是用本地启发式脚本代替 LLM 做「决策」，
 * 因此可以在完全离线配置的情况下展示 Agent 的完整形态：思考 → 调用工具 → 观察 → 回答。
 */

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });

async function streamText(
  emit: (event: AgentEvent) => void,
  text: string,
  signal: AbortSignal | undefined,
  perChunk = 2,
  delay = 14,
) {
  for (let i = 0; i < text.length; i += perChunk) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    emit({ type: "text", delta: text.slice(i, i + perChunk) });
    await sleep(delay, signal);
  }
}

async function streamReasoning(
  emit: (event: AgentEvent) => void,
  text: string,
  signal: AbortSignal | undefined,
) {
  for (const chunk of text.match(/[\s\S]{1,4}/g) ?? []) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    emit({ type: "reasoning", delta: chunk });
    await sleep(10, signal);
  }
}

interface PlannedCall {
  name: string;
  args: Record<string, unknown>;
  reason: string;
}

const URL_RE = /https?:\/\/[^\s，。、；）)】"'<>]+/i;

function extractTopic(input: string): string {
  let topic = input.trim();
  topic = topic.replace(/^(请问|请帮我|请|帮我|麻烦|我想知道|我想了解|你知道|你能|你可以|可以)/, "");
  topic = topic.replace(
    /^(查一下|查询一下|查询|搜索一下|搜索|搜一下|搜|找一下|找找|了解一下|了解一下|介绍一下|介绍|讲讲|说说|解释一下|解释|科普一下|科普)/,
    "",
  );
  topic = topic.replace(/^(什么是|啥是|什么叫)/, "");
  topic = topic.replace(/(是什么|是啥|什么意思|的含义是什么|的含义|的定义是什么|的定义|怎么样|是怎样的|是谁)$/, "");
  topic = topic.replace(/[？?。！!，,：:、；;」』”"']+$/g, "");
  return topic.trim().slice(0, 60);
}

function findMathExpression(input: string): string | null {
  const candidates = input.replace(/[＝]/g, "=").match(/[-\d(][-\d\s.+*/%^()!,a-z]*/gi) ?? [];
  for (const raw of candidates) {
    const candidate = raw.replace(/[，。？?！!：:；;、]+$/, "").trim();
    if (!/[0-9]/.test(candidate)) continue;
    if (!/[-+*/%^]|sqrt|log|ln|sin|cos|tan|abs|round|min|max|avg|exp|floor|ceil|pi|hypot|sum/i.test(candidate)) continue;
    if (!/[0-9]\s*[-+*/%^]|\^\s*[0-9]|\(|\)/.test(candidate)) continue;
    try {
      const value = calculate(candidate);
      if (Number.isFinite(value)) return candidate;
    } catch {
      /* 换下一个候选 */
    }
  }
  return null;
}

function planCalls(input: string): { reasoning: string; calls: PlannedCall[] } {
  const text = input.trim();
  const calls: PlannedCall[] = [];
  const url = text.match(URL_RE)?.[0];

  const todoId = text.match(/id\s*[=:：]?\s*([a-z0-9]{6,})/i)?.[1];
  const wantsComplete = /(完成|做完|勾掉|划掉|搞定)/.test(text) && /(待办|任务|todo)/i.test(text);
  const wantsList = /(待办|任务清单|todo)/i.test(text) && /(有哪|哪些|列表|列出|看看|是什么|有什么)/.test(text);
  const wantsAdd = /(记一下|记下来|记录一下|记个|加个待办|加到待办|添加待办|新增待办|提醒我|帮我记)/.test(text);

  if (wantsComplete && todoId) {
    calls.push({ name: "complete_todo", args: { id: todoId }, reason: "把这条待办标记完成" });
    return { reasoning: "用户想完成一条待办，我先根据 id 精确操作。", calls };
  }
  if (wantsAdd) {
    const title = text
      .replace(/.*?(帮我)?(记一下|记下来|记录一下|记录|记个|加个待办|加到待办|添加待办|新增待办|提醒我|帮我记)\s*/g, "")
      .replace(/^[：:，,。\s]+/, "")
      .trim();
    calls.push({ name: "add_todo", args: { title: title || text }, reason: "写入待办清单" });
    return { reasoning: "这是一个带有副作用的动作请求，我调用 add_todo 把任务写进界面。", calls };
  }
  if (wantsList || /我的待办|待办清单/.test(text)) {
    calls.push({ name: "list_todos", args: {}, reason: "读取当前待办清单" });
    return { reasoning: "我需要先读出当前清单，才能如实回答。", calls };
  }
  if (url) {
    calls.push({ name: "read_webpage", args: { url }, reason: "读取用户给出的链接" });
    return { reasoning: "用户给了一个网址，我先把正文抓下来读懂它。", calls };
  }

  const expression = findMathExpression(text);
  if (expression) {
    calls.push({ name: "calculator", args: { expression }, reason: "用计算器精确求解" });
    if (/(几点|日期|时间|星期)/.test(text)) {
      calls.push({ name: "current_time", args: {}, reason: "同时确认当前时间" });
    }
    return { reasoning: "这是数值计算，我不应该心算，交给 calculator 精确处理。", calls };
  }

  if (/(几点|现在时间|当前时间|今天几号|今天星期|日期是|时区|tim\b|time)/i.test(text)) {
    const tz =
      text.match(/(Asia\/[A-Za-z_]+|America\/[A-Za-z_]+|Europe\/[A-Za-z_]+|UTC)/)?.[0] ?? undefined;
    calls.push({ name: "current_time", args: tz ? { timezone: tz } : {}, reason: "查询当前时间" });
    return { reasoning: "时间问题是事实性问题，浏览器本地就能给出权威答案。", calls };
  }

  const topic = extractTopic(text);
  const wantsWiki = /(什么是|是什么|啥是|什么叫|介绍一下|介绍|解释|讲讲|说说|原理|概念|维基|wiki|定义)/i.test(text);
  if (wantsWiki && topic) {
    calls.push({ name: "wikipedia", args: { query: topic }, reason: `查询词条「${topic}」` });
    return { reasoning: "用户在问概念，维基百科的词条摘要比零散网页更可靠。", calls };
  }

  if (topic && topic.length >= 2) {
    calls.push({ name: "web_search", args: { query: topic }, reason: `联网搜索「${topic}」` });
    return { reasoning: "这类信息可能随时间变化，我先联网检索而不是凭记忆回答。", calls };
  }

  return { reasoning: "", calls };
}

function answerFor(name: string, output: string): string {
  if (name === "calculator") {
    const value = output.split("=").pop()?.trim() ?? output;
    return `计算结果是 **${value}**。\n\n\`\`\`\n${output}\n\`\`\`\n\n需要继续推算下一步的话，把式子发给我就行。\n`;
  }
  if (name === "current_time") {
    return `这是浏览器给出的权威时间：\n\n\`\`\`\n${output}\n\`\`\`\n`;
  }
  if (name === "wikipedia") {
    const [head, ...rest] = output.split("\n");
    const title = head.replace(/[【】]/g, "");
    const body = rest.join("\n").trim();
    return `### ${title}\n\n${body}\n`;
  }
  if (name === "web_search") {
    return `我把检索到的内容整理如下：\n\n${output}\n`;
  }
  if (name === "read_webpage") {
    const text = output.split("\n").slice(1).join("\n").trim();
    return `这一页的正文要点（已抽取纯文本）：\n\n> ${text.slice(0, 900).replace(/\n/g, "\n> ")}\n`;
  }
  return `${output}\n`;
}

export async function runDemoAgent(params: RunAgentParams): Promise<void> {
  const { input, tools, emit, signal } = params;
  const registry = new Map<string, StructuredToolInterface>(tools.map((item) => [item.name, item]));
  const { reasoning, calls } = planCalls(input);

  if (reasoning) {
    await streamReasoning(emit, reasoning, signal);
    await sleep(220, signal);
  }

  if (!calls.length) {
    const greeting = /^(你好|hi|hello|嗨|在吗)/i.test(input.trim());
    const intro = greeting
      ? "你好，我是运行在浏览器里的 Web Agent。\n\n"
      : "这次我没有匹配到需要调用的工具，先把我的能力范围说清楚：\n\n";
    const body = [
      "| 能力 | 工具 | 说明 |",
      "| --- | --- | --- |",
      "| 精确计算 | `calculator` | 表达式求值、函数、阶乘，绝不心算 |",
      "| 时间与时区 | `current_time` | 任意 IANA 时区的当前时间 |",
      "| 联网检索 | `web_search` | DuckDuckGo 实时搜索 |",
      "| 概念解释 | `wikipedia` | 先搜词条再读摘要 |",
      "| 阅读网页 | `read_webpage` | 抓取指定 URL 的正文 |",
      "| 写入操作 | `add_todo` / `list_todos` / `complete_todo` | 真实改变左侧清单 |",
      "",
      "试试这些：",
      "- `(3+4)^3 / 7 保留两位小数是多少`",
      "- `帮我看看纽约现在几点`",
      "- `什么是 Transformer 架构`",
      "- `帮我记一下：明天上午整理周报`",
    ].join("\n");
    await streamText(emit, intro + body, signal, 3, 10);
    await streamText(emit, "\n\n" + DEMO_NOTE, signal, 6, 8);
    return;
  }

  const observations: { name: string; output: string }[] = [];

  for (const [index, call] of calls.entries()) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const tool = registry.get(call.name);
    const runId = `${call.name}-${uid()}`;
    if (index > 0) {
      await streamReasoning(emit, `\n还想确认一下时间，顺便再调一次工具。`, signal);
    }
    await sleep(260, signal);
    emit({ type: "tool-start", id: runId, name: call.name, args: JSON.stringify(call.args, null, 2) });
    await sleep(420, signal);
    let output: string;
    let isError = false;
    try {
      output = String(await tool?.invoke(call.args));
    } catch (error) {
      output = `工具执行失败：${(error as Error).message}`;
      isError = true;
    }
    emit({ type: "tool-end", id: runId, name: call.name, result: output, isError });
    observations.push({ name: call.name, output });
  }

  await streamReasoning(emit, "\n观察结果拿到了，我把它们整理成最终答案。", signal);
  await sleep(200, signal);

  const heading =
    observations.length === 1
      ? ""
      : "我把两次工具调用的结果放在一起：\n\n";
  let answer = heading;
  for (const observation of observations) {
    answer += answerFor(observation.name, observation.output);
    if (observations.length > 1) answer += "\n";
  }
  answer += `\n${DEMO_NOTE}`;
  await streamText(emit, answer, signal, 3, 9);
}

export const DEMO_NOTE =
  "> **演示模式**：以上工具调用是真实执行的（真的联网、真的计算），但「决策与措辞」由本地启发式脚本模拟——这正是没有 API Key 时也能看到 Agent 轨迹的原因。在右上角填入 API Key 并切到 **真实模型**，同一个界面就会变成由 LLM 驱动的 ReAct 循环。";