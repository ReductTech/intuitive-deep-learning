import { useEffect, useState } from "react";
import { BUILTIN_API_KEY, BUILTIN_BASE_URL, BUILTIN_MODEL, MODEL_PRESETS } from "../lib/settings";
import type { Settings } from "../lib/types";

export function SettingsDrawer({
  open,
  settings,
  onClose,
  onSave,
}: {
  open: boolean;
  settings: Settings;
  onClose: () => void;
  onSave: (next: Settings) => void;
}) {
  const [draft, setDraft] = useState<Settings>(settings);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    if (open) setDraft(settings);
  }, [open, settings]);

  const patch = (partial: Partial<Settings>) => setDraft((prev) => ({ ...prev, ...partial }));

  return (
    <div className={`drawer-root ${open ? "open" : ""}`} aria-hidden={!open}>
      <div className="drawer-mask" onClick={onClose} />
      <div className="drawer">
        <header>
          <div>
            <h2>运行设置</h2>
            <p>配置保存在浏览器 localStorage，仅本机可见。</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="field">
          <label>运行模式</label>
          <div className="segmented full">
            <button
              type="button"
              className={draft.mode === "live" ? "active" : ""}
              onClick={() => patch({ mode: "live" })}
            >
              真实模型（LangChain ReAct）
            </button>
            <button
              type="button"
              className={draft.mode === "demo" ? "active" : ""}
              onClick={() => patch({ mode: "demo" })}
            >
              离线演示
            </button>
          </div>
        </div>

        <div className="field">
          <label htmlFor="base-url">Base URL</label>
          <input
            id="base-url"
            value={draft.baseUrl}
            spellCheck={false}
            onChange={(event) => patch({ baseUrl: event.target.value })}
          />
          <small>任何兼容 OpenAI Chat Completions 的服务都可以，例如自建网关或本地 Ollama。</small>
        </div>

        <div className="field">
          <label htmlFor="api-key">API Key</label>
          <div className="input-row">
            <input
              id="api-key"
              type={reveal ? "text" : "password"}
              value={draft.apiKey}
              spellCheck={false}
              onChange={(event) => patch({ apiKey: event.target.value })}
            />
            <button type="button" className="ghost-btn" onClick={() => setReveal((value) => !value)}>
              {reveal ? "隐藏" : "显示"}
            </button>
          </div>
          <small>Demo 已内置一个可用 Key，清空后会回退到内置值。</small>
        </div>

        <div className="field">
          <label htmlFor="model">模型</label>
          <input
            id="model"
            list="model-presets"
            value={draft.model}
            spellCheck={false}
            onChange={(event) => patch({ model: event.target.value })}
          />
          <datalist id="model-presets">
            {MODEL_PRESETS.map((model) => (
              <option key={model} value={model} />
            ))}
          </datalist>
          <div className="preset-row">
            {MODEL_PRESETS.slice(0, 6).map((model) => (
              <button key={model} type="button" onClick={() => patch({ model })}>
                {model}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="temperature">温度 · {draft.temperature.toFixed(2)}</label>
          <input
            id="temperature"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={draft.temperature}
            onChange={(event) => patch({ temperature: Number(event.target.value) })}
          />
        </div>

        <div className="field">
          <label htmlFor="steps">最大思考步数 · {draft.maxSteps}</label>
          <input
            id="steps"
            type="range"
            min={2}
            max={12}
            step={1}
            value={draft.maxSteps}
            onChange={(event) => patch({ maxSteps: Number(event.target.value) })}
          />
        </div>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={draft.showReasoning}
            onChange={(event) => patch({ showReasoning: event.target.checked })}
          />
          显示模型的推理增量（reasoning）
        </label>

        <div className="drawer-actions">
          <button
            type="button"
            className="ghost-btn"
            onClick={() => setDraft({ ...draft, baseUrl: BUILTIN_BASE_URL, apiKey: BUILTIN_API_KEY, model: BUILTIN_MODEL })}
          >
            恢复内置凭据
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
          >
            保存
          </button>
        </div>

        <p className="drawer-warning">
          注意：前端 Demo 会把 Key 打包进浏览器，仅适合本地演示。生产环境请通过后端代理调用模型。
        </p>
      </div>
    </div>
  );
}