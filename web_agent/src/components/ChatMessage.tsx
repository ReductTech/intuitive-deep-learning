import { useState, type CSSProperties } from "react";
import { TOOL_META } from "../lib/tools";
import type { ChatMessage, MessagePart } from "../lib/types";
import { MarkdownView } from "./Markdown";

type ToolPart = Extract<MessagePart, { kind: "tool" }>;

const metaOf = (name: string) => TOOL_META.find((item) => item.name === name);

function StatusDot({ status }: { status: ToolPart["status"] }) {
  if (status === "running") return <span className="tool-status running">调用中…</span>;
  if (status === "error") return <span className="tool-status error">失败</span>;
  return <span className="tool-status done">已完成</span>;
}

function ToolCard({ part }: { part: ToolPart }) {
  const meta = metaOf(part.name);
  const [open, setOpen] = useState(false);
  const expanded = open || part.status === "running";
  const accent = meta?.accent ?? "#7c9cff";
  return (
    <div
      className={`tool-card ${part.status}`}
      style={{ "--accent": accent } as CSSProperties}
    >
      <button type="button" className="tool-head" onClick={() => setOpen((value) => !value)}>
        <span className="tool-icon">{meta?.icon ?? "⚙"}</span>
        <span className="tool-label">{meta?.label ?? part.name}</span>
        <code className="tool-name">{part.name}</code>
        <StatusDot status={part.status} />
        {part.durationMs != null && <span className="tool-duration">{part.durationMs} ms</span>}
        <span className="chev">{expanded ? "▾" : "▸"}</span>
      </button>
      <div className="tool-call-line">
        <span className="kw">调用</span>
        <code>{describeCall(part)}</code>
      </div>
      {expanded && (
        <div className="tool-body">
          <div className="tool-section">
            <h4>入参</h4>
            <pre>{part.args}</pre>
          </div>
          {part.result != null && (
            <div className="tool-section">
              <h4>观察结果</h4>
              <pre>{part.result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function describeCall(part: ToolPart): string {
  try {
    const parsed = JSON.parse(part.args) as Record<string, unknown>;
    const entries = Object.entries(parsed);
    if (!entries.length) return `${part.name}()`;
    return `${part.name}(${entries.map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(", ")})`;
  } catch {
    return `${part.name}(${part.args})`;
  }
}

function ReasoningBlock({ text, streaming }: { text: string; streaming: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`reasoning ${open ? "open" : ""}`}>
      <button type="button" onClick={() => setOpen((value) => !value)}>
        <span className="spark">✦</span>
        <span>思考过程</span>
        {streaming && <span className="dots" />}
        <span className="chev">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="reasoning-body">{text}</div>}
    </div>
  );
}

export function MessageView({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <article className="msg user">
        <div className="avatar">你</div>
        <div className="bubble">
          {message.parts.map((part, index) =>
            part.kind === "text" ? <p key={index}>{part.text}</p> : null,
          )}
        </div>
      </article>
    );
  }

  const streaming = message.status === "running";
  const toolCount = message.parts.filter((part) => part.kind === "tool").length;
  const empty = message.parts.length === 0;

  return (
    <article className="msg assistant">
      <div className="avatar agent">A</div>
      <div className="assistant-main">
        <div className="assistant-meta">
          <span className="who">Web Agent</span>
          {toolCount > 0 && <span className="pill">{toolCount} 次工具调用</span>}
          {message.durationMs != null && (
            <span className="pill subtle">{(message.durationMs / 1000).toFixed(2)} s</span>
          )}
          {streaming && <span className="pill live">运行中</span>}
        </div>

        <div className="assistant-body">
          {empty && streaming && (
            <div className="thinking-line">
              <span className="spinner" /> 正在规划下一步…
            </div>
          )}
          {message.parts.map((part, index) => {
            if (part.kind === "reasoning") {
              return <ReasoningBlock key={index} text={part.text} streaming={streaming} />;
            }
            if (part.kind === "tool") return <ToolCard key={part.id} part={part} />;
            return <MarkdownView key={index}>{part.text}</MarkdownView>;
          })}
        </div>

        {message.error && <div className="error-box">{message.error}</div>}
      </div>
    </article>
  );
}