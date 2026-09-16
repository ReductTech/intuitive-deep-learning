import type { Settings } from "./types";

const STORAGE_KEY = "web-agent-demo:settings:v1";

const env = import.meta.env as Record<string, string | undefined>;

/** 内置的演示凭据（可在设置面板里覆盖） */
export const BUILTIN_BASE_URL = "https://api.zhizengzeng.com/v1";
export const BUILTIN_API_KEY = "sk-zk281ac3a0d2915b73ecc252dbcc1657a1a6aa92dd640611";
export const BUILTIN_MODEL = "gpt-5.4-mini";

export const MODEL_PRESETS = [
  "gpt-5.4-mini",
  "gpt-5.4",
  "gpt-5.5",
  "gpt-5.1",
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4.1-mini",
  "deepseek-chat",
  "deepseek-v3.2",
  "claude-sonnet-4-5",
  "gemini-2.5-flash",
  "kimi-k2",
];

export const defaultSettings: Settings = {
  mode: "live",
  baseUrl: env.VITE_OPENAI_BASE_URL ?? BUILTIN_BASE_URL,
  apiKey: env.VITE_OPENAI_API_KEY ?? BUILTIN_API_KEY,
  model: env.VITE_OPENAI_MODEL ?? BUILTIN_MODEL,
  temperature: 0.2,
  maxSteps: 6,
  showReasoning: true,
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const merged = { ...defaultSettings, ...parsed };
    // 内置 Key 被清空时回退到内置凭据，保证 Demo 开箱可用
    if (!merged.apiKey) merged.apiKey = BUILTIN_API_KEY;
    if (!merged.baseUrl) merged.baseUrl = BUILTIN_BASE_URL;
    if (!merged.model) merged.model = BUILTIN_MODEL;
    return merged;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* localStorage 不可用时静默忽略 */
  }
}