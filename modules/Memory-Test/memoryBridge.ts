export const MEMORY_SKILL_ID = 'intuitive-deep-learning';
export const MEMORY_MODULE_ID = 'memory-test';

export interface MemoryEvent {
  schema_version: 1;
  event_id: string;
  run_id: string;
  module_id: typeof MEMORY_MODULE_ID;
  page_id: string;
  event_name: string;
  occurred_at: string;
  properties: Record<string, unknown>;
}

interface SkillMemoryResponse {
  ok?: boolean;
  error?: string;
  [key: string]: unknown;
}

interface GrowAgentIpc {
  reportSkillMemory?: (payload: { skill_id: string; content: string }) => Promise<SkillMemoryResponse>;
  skillMemoryList?: (options?: Record<string, unknown>) => Promise<unknown>;
  checkAuthSession?: () => Promise<unknown>;
}

declare global {
  interface Window {
    __growAgentIpc?: GrowAgentIpc;
  }
}

export function bridgeStatus() {
  const bridge = window.__growAgentIpc;
  return {
    report: typeof bridge?.reportSkillMemory === 'function',
    list: typeof bridge?.skillMemoryList === 'function',
    auth: typeof bridge?.checkAuthSession === 'function',
    embedded: window.parent !== window,
  };
}

export function makeEvent(runId: string, pageId: string, eventName: string, properties: Record<string, unknown>): MemoryEvent {
  return {
    schema_version: 1,
    event_id: crypto.randomUUID(),
    run_id: runId,
    module_id: MEMORY_MODULE_ID,
    page_id: pageId,
    event_name: eventName,
    occurred_at: new Date().toISOString(),
    properties,
  };
}

export async function reportEvent(event: MemoryEvent): Promise<SkillMemoryResponse> {
  const ipc = window.__growAgentIpc;
  if (typeof ipc?.reportSkillMemory !== 'function') throw new Error('当前页面没有 window.__growAgentIpc.reportSkillMemory；请确认桥接脚本在课程页所在的 window 中可用。');
  const result = await ipc.reportSkillMemory({ skill_id: MEMORY_SKILL_ID, content: JSON.stringify(event) });
  if (!result?.ok) throw new Error(result?.error || `写入未返回 ok=true：${JSON.stringify(result)}`);
  return result;
}

export async function listMemory(options: Record<string, unknown>): Promise<unknown> {
  const ipc = window.__growAgentIpc;
  if (typeof ipc?.skillMemoryList !== 'function') throw new Error('当前页面没有 window.__growAgentIpc.skillMemoryList。');
  return ipc.skillMemoryList(options);
}
