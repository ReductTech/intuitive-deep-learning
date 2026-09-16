import { TOOL_META } from "../lib/tools";
import type { RunMode, Settings, Todo } from "../lib/types";

const EXAMPLES = [
  { icon: "∑", label: "复合计算", prompt: "帮我算 (3+4)^3 / 7 + sqrt(144)，并说明每步用了什么" },
  { icon: "◷", label: "跨时区时间", prompt: "纽约和东京现在分别是几点？相差多少小时？" },
  { icon: "⌕", label: "联网找事实", prompt: "查一下 2026 年诺贝尔物理学奖颁给了谁" },
  { icon: "W", label: "概念解释", prompt: "什么是 Transformer 架构？用几句话讲清楚" },
  { icon: "⇣", label: "读网页", prompt: "读一下 https://example.com 这个页面讲了什么" },
  { icon: "✎", label: "写入待办", prompt: "帮我记一下：周五前把 Web Agent Demo 录个屏" },
  { icon: "☑", label: "回忆清单", prompt: "我的待办清单里现在有什么？" },
];

export function Sidebar({
  settings,
  onModeChange,
  onPickExample,
  onOpenSettings,
  todos,
  onRemoveTodo,
  stats,
}: {
  settings: Settings;
  onModeChange: (mode: RunMode) => void;
  onPickExample: (prompt: string) => void;
  onOpenSettings: () => void;
  todos: Todo[];
  onRemoveTodo: (id: string) => void;
  stats: { turns: number; toolCalls: number; elapsed: number };
}) {
  return (
    <aside className="sidebar">
      <header className="brand">
        <div className="brand-mark">A</div>
        <div>
          <h1>Web Agent</h1>
          <p>LangChain.js · 浏览器内 ReAct 智能体</p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-title">
          <span>运行模式</span>
          <button type="button" className="link-btn" onClick={onOpenSettings}>
            设置
          </button>
        </div>
        <div className="segmented">
          <button
            type="button"
            className={settings.mode === "live" ? "active" : ""}
            onClick={() => onModeChange("live")}
          >
            真实模型
          </button>
          <button
            type="button"
            className={settings.mode === "demo" ? "active" : ""}
            onClick={() => onModeChange("demo")}
          >
            离线演示
          </button>
        </div>
        <p className="panel-note">
          {settings.mode === "live" ? (
            <>
              由 <code>{settings.model}</code> 驱动真实 ReAct 循环：模型自主决定何时调用哪个工具。
            </>
          ) : (
            <>不消耗额度：工具真实执行，决策由本地脚本模拟，方便讲清 Agent 的骨架。</>
          )}
        </p>
      </section>

      <section className="panel">
        <div className="panel-title">
          <span>Agent 的工具箱</span>
          <span className="count">{TOOL_META.length}</span>
        </div>
        <ul className="tool-list">
          {TOOL_META.map((tool) => (
            <li key={tool.name}>
              <span className="dot" style={{ background: tool.accent, color: tool.accent }}>
                {tool.icon}
              </span>
              <div>
                <strong>{tool.label}</strong>
                <em>{tool.name}</em>
                <p>{tool.blurb}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-title">
          <span>示例任务</span>
        </div>
        <div className="examples">
          {EXAMPLES.map((item) => (
            <button key={item.label} type="button" onClick={() => onPickExample(item.prompt)}>
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <span>待办清单</span>
          <span className="count">{todos.length}</span>
        </div>
        {todos.length === 0 ? (
          <p className="panel-note">
            空。让 Agent「帮我记一下…」，它会调用 <code>add_todo</code> 写入这里。
          </p>
        ) : (
          <ul className="todo-list">
            {todos.map((todo) => (
              <li key={todo.id}>
                <span>{todo.title}</span>
                <button type="button" title="移除" onClick={() => onRemoveTodo(todo.id)}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="sidebar-foot">
        <div>
          <span>{stats.turns}</span>
          <em>轮对话</em>
        </div>
        <div>
          <span>{stats.toolCalls}</span>
          <em>次工具调用</em>
        </div>
        <div>
          <span>{(stats.elapsed / 1000).toFixed(1)}</span>
          <em>秒总耗时</em>
        </div>
      </footer>
    </aside>
  );
}