export const QKV_ROLES = ['query', 'key', 'value'] as const;
export type QkvRole = (typeof QKV_ROLES)[number];

export const QKV_TASKS = [
  { id: 'who', label: '谁？', question: '谁去了商店？', clue: '人物', content: '小明' },
  { id: 'why', label: '为什么？', question: '为什么去商店？', clue: '原因', content: '口渴' },
  { id: 'where', label: '去了哪里？', question: '小明去了哪里？', clue: '地点', content: '商店' },
  { id: 'what', label: '买了什么？', question: '小明买了什么？', clue: '物品', content: '冰水' },
] as const;
export type QkvTask = (typeof QKV_TASKS)[number]['id'];

export interface QkvRoleState {
  version: 1;
  attempt: string;
  answer: QkvRole | null;
  task: QkvTask;
}

export type QkvRoleAction =
  | { type: 'answer'; value: QkvRole }
  | { type: 'select-task'; task: QkvTask }
  | { type: 'retry'; attempt: string };

function isQkvRole(value: unknown): value is QkvRole {
  return typeof value === 'string' && QKV_ROLES.some((role) => role === value);
}

function isQkvTask(value: unknown): value is QkvTask {
  return typeof value === 'string' && QKV_TASKS.some((task) => task.id === value);
}

function isAttempt(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 100;
}

export function createQkvRole(attempt: string): QkvRoleState {
  if (!isAttempt(attempt)) throw new TypeError('A QKV attempt must be a non-empty string of at most 100 characters.');
  return { version: 1, attempt, answer: null, task: 'where' };
}

export function normalizeQkvRole(value: unknown): QkvRoleState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<QkvRoleState>;
  if (candidate.version !== 1 || !isAttempt(candidate.attempt)) return null;
  if (candidate.answer !== null && !isQkvRole(candidate.answer)) return null;
  const task = 'task' in candidate ? candidate.task : 'where';
  if (!isQkvTask(task)) return null;
  return { version: 1, attempt: candidate.attempt, answer: candidate.answer, task };
}

export function qkvRoleReducer(state: QkvRoleState, action: QkvRoleAction): QkvRoleState {
  if (!action || typeof action !== 'object' || Array.isArray(action)) return state;
  if (action.type === 'select-task') {
    if (!isQkvTask(action.task) || action.task === state.task) return state;
    return { ...state, task: action.task };
  }
  if (action.type === 'retry') {
    // Ignore a duplicate retry so a stale event cannot clear this attempt's answer.
    if (!isAttempt(action.attempt) || action.attempt === state.attempt) return state;
    return { ...createQkvRole(action.attempt), task: state.task };
  }
  if (action.type === 'answer' && state.answer !== 'query' && isQkvRole(action.value) && state.answer !== action.value) {
    return { ...state, answer: action.value };
  }
  return state;
}

export function hasCompletedQkvRole(state: QkvRoleState): boolean {
  return state.answer === 'query';
}
