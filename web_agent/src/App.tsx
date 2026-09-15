import { useEffect, useMemo, useRef, useState } from "react";
import { MessageView } from "./components/ChatMessage";
import { Composer } from "./components/Composer";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { Sidebar } from "./components/Sidebar";
import { friendlyError, runAgentTurn } from "./lib/runner";
import { loadSettings, saveSettings } from "./lib/settings";
import { createTools, TOOL_META } from "./lib/tools";
import type { AgentEvent, ChatMessage, MessagePart, RunMode, Settings, Todo } from "./lib/types";
import { uid } from "./lib/types";

const START_CARDS = [
  { icon: "∑", title: "精确计算", text: "(3+4)^3 / 7 + sqrt(144) 等于多少？" },
  { icon: "⌕", title: "联网检索", text: "搜一下 2026 年最重要的开源大模型进展" },
  { icon: "W", title: "概念解释", text: "什么是 ReAct 智能体？和普通聊天机器人有什么区别" },
  { icon: "✎", title: "真实副作用", text: "帮我记一下：周四下午给团队演示 Web Agent" },
];

const textOf = (message: ChatMessage) =>
  message.parts
    .filter((part): part is Extract<MessagePart, { kind: "text" }> => part.kind === "text")
    .map((part) => part.text)
    .join("");

function appendText(parts: MessagePart[], delta: string): MessagePart[] {
  const last = parts[parts.length - 1];
  if (last && last.kind === "text") {
    return [...parts.slice(0, -1), { ...last, text: last.text + delta }];
  }
  return [...parts, { kind: "text", text: delta }];
}

function appendReasoning(parts: MessagePart[], delta: string): MessagePart[] {
  const last = parts[parts.length - 1];
  if (last && last.kind === "reasoning") {
    return [...parts.slice(0, -1), { ...last, text: last.text + delta }];
  }
  return [...parts, { kind: "reasoning", text: delta }];
}

function settleTool(
  parts: MessagePart[],
  id: string,
  result: string,
  isError: boolean,
): MessagePart[] {
  return parts.map((part) =>
    part.kind === "tool" && part.id === id
      ? {
          ...part,
          status: isError ? "error" : "done",
          result,
          durationMs: Math.max(1, Date.now() - part.startedAt),
        }
      : part,
  );
}

export function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [running, setRunning] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stats, setStats] = useState({ turns: 0, toolCalls: 0, elapsed: 0 });

  const todosRef = useRef<Todo[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !stickToBottom.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const addTodo = (title: string) => {
    const todo: Todo = { id: uid(), title, createdAt: Date.now() };
    setTodos((prev) => {
      const next = [...prev, todo];
      todosRef.current = next;
      return next;
    });
    return todo;
  };

  const listTodos = () => todosRef.current;

  const removeTodo = (id: string) => {
    const exists = todosRef.current.some((todo) => todo.id === id);
    setTodos((prev) => {
      const next = prev.filter((todo) => todo.id !== id);
      todosRef.current = next;
      return next;
    });
    return exists;
  };

  const tools = useMemo(
    () => createTools({ addTodo, listTodos, removeTodo }),
    // 三个回调都只依赖 ref / setState，创建一次即可
    [],
  );

  const applyEvent = (messageId: string, event: AgentEvent) => {
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id !== messageId) return message;
        switch (event.type) {
          case "text":
            return { ...message, parts: appendText(message.parts, event.delta) };
          case "reasoning":
            return { ...message, parts: appendReasoning(message.parts, event.delta) };
          case "tool-start":
            return {
              ...message,
              parts: [
                ...message.parts,
                {
                  kind: "tool",
                  id: event.id,
                  name: event.name,
                  args: event.args,
                  status: "running",
                  startedAt: Date.now(),
                },
              ],
            };
          case "tool-end":
            return {
              ...message,
              parts: settleTool(message.parts, event.id, event.result, event.isError),
            };
          case "error":
            return { ...message, error: event.message, status: "error" };
          default:
            return message;
        }
      }),
    );
    if (event.type === "tool-start") {
      setStats((prev) => ({ ...prev, toolCalls: prev.toolCalls + 1 }));
    }
  };

  const send = async (text: string) => {
    if (running || !text.trim()) return;
    const startedAt = Date.now();
    const userMessage: ChatMessage = {
      id: uid(),
      role: "user",
      parts: [{ kind: "text", text }],
      status: "done",
      startedAt,
    };
    const assistantId = uid();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      parts: [],
      status: "running",
      startedAt,
    };
    const history = messagesRef.current
      .filter((message) => message.status === "done" && textOf(message).trim())
      .map((message) => ({ role: message.role, content: textOf(message) }));

    stickToBottom.current = true;
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await runAgentTurn({
        input: text,
        history,
        settings,
        tools,
        signal: controller.signal,
        emit: (event) => applyEvent(assistantId, event),
      });
      const durationMs = Date.now() - startedAt;
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId && message.status === "running"
            ? { ...message, status: "done", durationMs }
            : message,
        ),
      );
      setStats((prev) => ({ ...prev, turns: prev.turns + 1, elapsed: prev.elapsed + durationMs }));
    } catch (error) {
      const aborted = controller.signal.aborted;
      const durationMs = Date.now() - startedAt;
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                status: aborted ? "done" : "error",
                durationMs,
                error: aborted ? undefined : friendlyError(error),
              }
            : message,
        ),
      );
      setStats((prev) => ({ ...prev, turns: prev.turns + 1, elapsed: prev.elapsed + durationMs }));
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  const clearAll = () => {
    stop();
    setMessages([]);
    setStats({ turns: 0, toolCalls: 0, elapsed: 0 });
  };

  const changeMode = (mode: RunMode) => setSettings((prev) => ({ ...prev, mode }));

  return (
    <div className="app">
      <Sidebar
        settings={settings}
        onModeChange={changeMode}
        onPickExample={send}
        onOpenSettings={() => setSettingsOpen(true)}
        todos={todos}
        onRemoveTodo={(id) => removeTodo(id)}
        stats={stats}
      />

      <main className="chat">
        <header className="chat-head">
          <div>
            <h2>Agent 工作台</h2>
            <p>
              模型自己决定要不要调用工具、调用哪一个 —— 下方的每一次调用都是真实发生的。
            </p>
          </div>
          <div className="chat-head-actions">
            <span className={`badge ${settings.mode}`}>
              {settings.mode === "live" ? `真实模型 · ${settings.model}` : "离线演示模式"}
            </span>
            <button type="button" className="ghost-btn" onClick={clearAll} disabled={!messages.length}>
              清空会话
            </button>
            <button type="button" className="ghost-btn" onClick={() => setSettingsOpen(true)}>
              设置
            </button>
          </div>
        </header>

        <div
          className="messages"
          ref={scrollRef}
          onScroll={(event) => {
            const el = event.currentTarget;
            stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
          }}
        >
          {messages.length === 0 ? (
            <div className="hero">
              <div className="hero-badge">ReAct · Tool Calling · Streaming</div>
              <h3>给你的模型装上工具，它就从「聊天」变成「干活」</h3>
              <p>
                这个页面是一个完整的 Web Agent 演示：LangChain.js 负责推理循环，浏览器负责执行工具，
                React 把每一步思考、调用和观察实时渲染出来。
              </p>
              <div className="hero-cards">
                {START_CARDS.map((card) => (
                  <button key={card.title} type="button" onClick={() => send(card.text)}>
                    <span className="hero-icon">{card.icon}</span>
                    <strong>{card.title}</strong>
                    <em>{card.text}</em>
                  </button>
                ))}
              </div>
              <div className="hero-tools">
                {TOOL_META.map((tool) => (
                  <span key={tool.name} className="chip" style={{ borderColor: tool.accent }}>
                    {tool.icon} {tool.label}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => <MessageView key={message.id} message={message} />)
          )}
        </div>

        <Composer onSend={send} onStop={stop} running={running} />
      </main>

      <SettingsDrawer
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onSave={setSettings}
      />
    </div>
  );
}