/** 全局共享的类型定义 */

export type RunMode = "live" | "demo";

export interface Settings {
  /** live = 真实 LLM 驱动的 ReAct Agent；demo = 无需 API Key 的离线演示 */
  mode: RunMode;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  /** Agent 最多思考几步，防止死循环 */
  maxSteps: number;
  /** 是否在界面上显示模型的推理（reasoning）增量 */
  showReasoning: boolean;
}

/** Agent 运行时向前端推送的事件 */
export type AgentEvent =
  | { type: "text"; delta: string }
  | { type: "reasoning"; delta: string }
  | { type: "tool-start"; id: string; name: string; args: string }
  | {
      type: "tool-end";
      id: string;
      name: string;
      result: string;
      isError: boolean;
    }
  | { type: "error"; message: string };

/** 一条助手消息里的一个片段：文字 或 一次工具调用 */
export type MessagePart =
  | { kind: "text"; text: string }
  | { kind: "reasoning"; text: string }
  | {
      kind: "tool";
      id: string;
      name: string;
      args: string;
      status: "running" | "done" | "error";
      result?: string;
      startedAt: number;
      durationMs?: number;
    };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  parts: MessagePart[];
  status: "running" | "done" | "error";
  error?: string;
  startedAt: number;
  durationMs?: number;
}

export interface Todo {
  id: string;
  title: string;
  createdAt: number;
}

export interface ToolMeta {
  name: string;
  label: string;
  icon: string;
  blurb: string;
  accent: string;
}

export const uid = () => Math.random().toString(36).slice(2, 10);