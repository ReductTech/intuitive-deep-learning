export const QUERY_TASKS = ['why', 'where', 'what'] as const;
export type QueryTask = (typeof QUERY_TASKS)[number];

export interface QueryExplorationState {
  task: QueryTask;
  visited: QueryTask[];
}

export function createQueryExploration(): QueryExplorationState {
  return { task: 'why', visited: ['why'] };
}

function isQueryTask(value: unknown): value is QueryTask {
  return typeof value === 'string' && QUERY_TASKS.some((task) => task === value);
}

export function normalizeQueryExploration(value: unknown): QueryExplorationState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<QueryExplorationState>;
  if (!isQueryTask(candidate.task) || !Array.isArray(candidate.visited)) return null;
  if (!candidate.visited.every(isQueryTask)) return null;
  if (!candidate.visited.includes('why') || !candidate.visited.includes(candidate.task)) return null;
  return { task: candidate.task, visited: [...new Set(candidate.visited)] };
}

export function queryReducer(state: QueryExplorationState, task: QueryTask): QueryExplorationState {
  if (!isQueryTask(task)) return state;
  if (state.task === task && state.visited.includes(task)) return state;
  return {
    task,
    visited: state.visited.includes(task) ? state.visited : [...state.visited, task],
  };
}

export function hasCompletedQueryExploration(state: QueryExplorationState): boolean {
  return QUERY_TASKS.every((task) => state.visited.includes(task));
}
