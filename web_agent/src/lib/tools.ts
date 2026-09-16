import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { calculate } from "./calculator";
import type { Todo, ToolMeta } from "./types";
import { uid } from "./types";

const TIMEOUT_MS = 15_000;

async function httpGet(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: "application/json, text/plain, */*", ...(init?.headers ?? {}) },
  });
}

function truncate(text: string, max = 4000): string {
  return text.length > max ? `${text.slice(0, max)}\n…（内容已截断）` : text;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** 工具需要访问宿主应用的少量状态（这里用来演示 Agent 可以「改变界面」） */
export interface ToolContext {
  addTodo: (title: string) => Todo;
  listTodos: () => Todo[];
  removeTodo: (id: string) => boolean;
}

export const TOOL_META: ToolMeta[] = [
  {
    name: "calculator",
    label: "计算器",
    icon: "∑",
    blurb: "安全解析数学表达式，支持函数、常量与阶乘，不用 eval。",
    accent: "#7c9cff",
  },
  {
    name: "current_time",
    label: "时间与时区",
    icon: "◷",
    blurb: "查询任意 IANA 时区的当前时间，可做时间换算。",
    accent: "#4fd1c5",
  },
  {
    name: "web_search",
    label: "实时联网搜索",
    icon: "⌕",
    blurb: "调用 DuckDuckGo 即时问答接口，拿到当前网页上的事实。",
    accent: "#f6ad55",
  },
  {
    name: "wikipedia",
    label: "维基百科",
    icon: "W",
    blurb: "先搜索条目再读取摘要，适合概念解释与背景知识。",
    accent: "#9f7aea",
  },
  {
    name: "read_webpage",
    label: "网页正文",
    icon: "⇣",
    blurb: "抓取一个 URL 并抽取正文文本，让 Agent 读懂长文。",
    accent: "#68d391",
  },
  {
    name: "add_todo",
    label: "写入待办",
    icon: "✎",
    blurb: "带副作用：把任务写进左侧面板，演示 Agent 能改变界面状态。",
    accent: "#fc8181",
  },
];

export function createTools(ctx: ToolContext) {
  const calculator = tool(
    async ({ expression }) => {
      const value = calculate(expression);
      return `${expression} = ${value}`;
    },
    {
      name: "calculator",
      description:
        "计算数学表达式。支持 + - * / % ^ 与括号，函数 sqrt/abs/round/floor/ceil/log/ln/exp/sin/cos/tan/min/max/avg，常量 pi/e，后缀 ! 表示阶乘。需要精确算术时必须用它，不要自己心算。",
      schema: z.object({
        expression: z.string().describe("要计算的表达式，例如 (3+4)*2^3 或 sqrt(144)"),
      }),
    },
  );

  const currentTime = tool(
    async ({ timezone }) => {
      const tz = timezone?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone;
      let formatter: Intl.DateTimeFormat;
      try {
        formatter = new Intl.DateTimeFormat("zh-CN", {
          timeZone: tz,
          dateStyle: "full",
          timeStyle: "medium",
        });
      } catch {
        return `无法识别时区 "${tz}"，请使用 IANA 名称，例如 Asia/Shanghai、America/New_York。`;
      }
      const now = new Date();
      const [local, utc] = [formatter.format(now), now.toISOString()];
      return `时区 ${tz}\n本地时间：${local}\nUTC：${utc}\nUnix 时间戳：${Math.floor(now.getTime() / 1000)}`;
    },
    {
      name: "current_time",
      description:
        "获取指定 IANA 时区的当前日期与时间。用户问「现在几点」「今天几号」或者需要做跨时区换算时使用。",
      schema: z.object({
        timezone: z
          .string()
          .optional()
          .describe("IANA 时区名，例如 Asia/Hong_Kong、Europe/London；省略则使用用户浏览器所在时区"),
      }),
    },
  );

  const webSearch = tool(
    async ({ query }) => {
      const url =
        "https://api.duckduckgo.com/?" +
        new URLSearchParams({
          q: query,
          format: "json",
          no_html: "1",
          skip_disambig: "1",
          no_redirect: "1",
        }).toString();
      try {
        const res = await httpGet(url);
        if (!res.ok) return `搜索接口返回 ${res.status}，暂时拿不到结果。`;
        const data = (await res.json()) as {
          AbstractText?: string;
          AbstractURL?: string;
          AbstractSource?: string;
          Heading?: string;
          Results?: { Text?: string; FirstURL?: string }[];
          RelatedTopics?: ({ Text?: string; FirstURL?: string } | { Topics?: { Text?: string; FirstURL?: string }[] })[];
        };
        const lines: string[] = [];
        if (data.AbstractText) {
          lines.push(`【摘要】${data.AbstractText}`);
          if (data.AbstractURL) lines.push(`来源：${data.AbstractSource ?? ""} ${data.AbstractURL}`.trim());
        }
        const flat: { Text?: string; FirstURL?: string }[] = [];
        for (const item of data.RelatedTopics ?? []) {
          if ("Topics" in item && item.Topics) flat.push(...item.Topics);
          else flat.push(item as { Text?: string; FirstURL?: string });
        }
        for (const item of [...(data.Results ?? []), ...flat].slice(0, 6)) {
          if (item.Text) lines.push(`- ${item.Text}${item.FirstURL ? ` (${item.FirstURL})` : ""}`);
        }
        if (!lines.length) {
          return `DuckDuckGo 即时问答没有返回「${query}」的结构化结果。可以改用 wikipedia 工具，或直接访问已知网址。`;
        }
        return truncate(lines.join("\n"));
      } catch (error) {
        return `搜索失败：${(error as Error).message}（可能是网络或浏览器跨域限制）。`;
      }
    },
    {
      name: "web_search",
      description:
        "联网搜索实时信息（DuckDuckGo 即时问答，无需 API Key）。当问题涉及最新消息、具体事实、你不确定的数据时使用。",
      schema: z.object({
        query: z.string().describe("搜索关键词，尽量具体"),
      }),
    },
  );

  const wikipedia = tool(
    async ({ query, lang }) => {
      const code = lang ?? "zh";
      const api = `https://${code}.wikipedia.org/w/api.php`;
      try {
        const searchUrl = `${api}?${new URLSearchParams({
          action: "query",
          list: "search",
          srsearch: query,
          srlimit: "1",
          format: "json",
          origin: "*",
        }).toString()}`;
        const searchRes = await httpGet(searchUrl);
        if (!searchRes.ok) return `维基百科接口返回 ${searchRes.status}。`;
        const searchData = (await searchRes.json()) as {
          query?: { search?: { title: string }[] };
        };
        const title = searchData.query?.search?.[0]?.title;
        if (!title) return `维基百科没有找到与「${query}」相关的条目。`;

        const summaryRes = await httpGet(
          `https://${code}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        );
        if (summaryRes.ok) {
          const summary = (await summaryRes.json()) as { extract?: string; content_urls?: { desktop?: { page?: string } } };
          if (summary.extract) {
            const link = summary.content_urls?.desktop?.page ?? `https://${code}.wikipedia.org/wiki/${encodeURIComponent(title)}`;
            return truncate(`【${title}】\n${summary.extract}\n\n原文：${link}`);
          }
        }
        return `维基百科条目「${title}」：https://${code}.wikipedia.org/wiki/${encodeURIComponent(title)}`;
      } catch (error) {
        return `查询维基百科失败：${(error as Error).message}`;
      }
    },
    {
      name: "wikipedia",
      description:
        "在维基百科上搜索词条并返回摘要。适合解释概念、人物、事件、专业术语，比泛泛的网页搜索更可靠。",
      schema: z.object({
        query: z.string().describe("要查询的词条名称或关键词"),
        lang: z.enum(["zh", "en"]).optional().describe("词条语言，默认 zh"),
      }),
    },
  );

  const readWebpage = tool(
    async ({ url }) => {
      let target = url.trim();
      if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
      try {
        new URL(target);
      } catch {
        return `这不是一个合法的网址：${url}`;
      }
      try {
        const direct = await httpGet(target);
        if (direct.ok) {
          const text = stripHtml(await direct.text());
          if (text.length > 200) return truncate(`【${target}】\n${text}`);
        }
      } catch {
        /* 浏览器跨域拦截是常态，走下面的代理 */
      }
      try {
        const proxy = await httpGet(`https://r.jina.ai/${target}`, {
          headers: { Accept: "text/plain" },
        });
        if (proxy.ok) {
          const text = await proxy.text();
          if (text.trim()) return truncate(`【${target}】\n${text.trim()}`);
        }
        return `抓取 ${target} 失败：代理返回 ${proxy.status}。`;
      } catch (error) {
        return `抓取 ${target} 失败：${(error as Error).message}。多数网站的跨域策略会阻止浏览器直接读取正文。`;
      }
    },
    {
      name: "read_webpage",
      description:
        "读取一个网页的正文文本（先直连，失败时走 r.jina.ai 文本代理）。当用户给出链接，或需要阅读某篇文章的具体内容时使用。",
      schema: z.object({
        url: z.string().describe("完整网址，例如 https://example.com/article"),
      }),
    },
  );

  const addTodo = tool(
    async ({ title }) => {
      const todo = ctx.addTodo(title);
      return `已写入待办：${todo.title}（id=${todo.id}）。当前共 ${ctx.listTodos().length} 条。`;
    },
    {
      name: "add_todo",
      description:
        "把一条任务写进应用左侧的待办清单，这是一个会产生真实副作用的动作。当用户说「帮我记一下」「加个待办」时使用。",
      schema: z.object({
        title: z.string().describe("待办内容，一句话说清楚要做什么"),
      }),
    },
  );

  const listTodos = tool(
    async () => {
      const todos = ctx.listTodos();
      if (!todos.length) return "待办清单目前是空的。";
      return todos.map((todo, index) => `${index + 1}. ${todo.title} (id=${todo.id})`).join("\n");
    },
    {
      name: "list_todos",
      description: "读取当前待办清单。回答「我的待办有哪些」之前必须先调用它。",
      schema: z.object({}),
    },
  );

  const completeTodo = tool(
    async ({ id }) => {
      const ok = ctx.removeTodo(id);
      return ok ? `已把 ${id} 标记完成并移出清单。` : `没有找到 id 为 ${id} 的待办。`;
    },
    {
      name: "complete_todo",
      description: "把某条待办标记为完成。需要先用 list_todos 拿到它的 id。",
      schema: z.object({
        id: z.string().describe("待办 id"),
      }),
    },
  );

  return [calculator, currentTime, webSearch, wikipedia, readWebpage, addTodo, listTodos, completeTodo];
}

export const createDemoTodo = (title: string): Todo => ({
  id: uid(),
  title,
  createdAt: Date.now(),
});