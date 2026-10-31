const ADDITIVE_PAGE_IDS = ['C05', 'C06', 'C07', 'C08'] as const;
export type AdditivePageId = (typeof ADDITIVE_PAGE_IDS)[number];

export const ADDITIVE_CANDIDATES = [
  { id: 'person', label: '人物', content: '小明', key: [1, 0, 0] },
  { id: 'place', label: '地点', content: '商店', key: [0, 1, 0] },
  { id: 'item', label: '物品', content: '冰水', key: [0, 0, 1] },
] as const;
export type AdditiveCandidateId = (typeof ADDITIVE_CANDIDATES)[number]['id'];

export const ADDITIVE_WQ = [0.85, -0.45] as const;
export const ADDITIVE_WK = [[-0.9, 0.15, 0.8], [0.25, -0.6, 0.4]] as const;

export interface AdditiveScoringState {
  version: 1;
  q: number;
  candidate: AdditiveCandidateId;
  completedPages: AdditivePageId[];
}

export type AdditiveScoringAction =
  | { type: 'set-q'; value: number; page: AdditivePageId }
  | { type: 'set-candidate'; candidate: AdditiveCandidateId }
  | { type: 'reset' };

function isAdditivePage(value: unknown): value is AdditivePageId {
  return typeof value === 'string' && ADDITIVE_PAGE_IDS.some((page) => page === value);
}

function isAdditiveCandidate(value: unknown): value is AdditiveCandidateId {
  return typeof value === 'string' && ADDITIVE_CANDIDATES.some((candidate) => candidate.id === value);
}

function normalizeQuery(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const tenths = Math.round(value * 10);
  const q = tenths / 10;
  if (tenths < -20 || tenths > 20 || Math.abs(value - q) > 1e-9) return null;
  return q === 0 ? 0 : q;
}

export function createAdditiveScoring(): AdditiveScoringState {
  return { version: 1, q: 0.6, candidate: 'place', completedPages: [] };
}

export function normalizeAdditiveScoring(value: unknown): AdditiveScoringState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<AdditiveScoringState>;
  if (candidate.version !== 1 || !isAdditiveCandidate(candidate.candidate)) return null;
  const q = normalizeQuery(candidate.q);
  if (q === null || !Array.isArray(candidate.completedPages) || !candidate.completedPages.every(isAdditivePage)) return null;
  return { version: 1, q, candidate: candidate.candidate, completedPages: [...new Set(candidate.completedPages)] };
}

export function additiveScoringReducer(state: AdditiveScoringState, action: AdditiveScoringAction): AdditiveScoringState {
  if (!action || typeof action !== 'object' || Array.isArray(action)) return state;
  if (action.type === 'set-q') {
    const q = normalizeQuery(action.value);
    if (q === null || !isAdditivePage(action.page) || q === state.q) return state;
    return {
      ...state,
      q,
      completedPages: state.completedPages.includes(action.page) ? state.completedPages : [...state.completedPages, action.page],
    };
  }
  if (action.type === 'set-candidate') {
    if (!isAdditiveCandidate(action.candidate) || action.candidate === state.candidate) return state;
    return { ...state, candidate: action.candidate };
  }
  if (action.type === 'reset') {
    if (state.q === 0.6 && state.candidate === 'place') return state;
    return { ...createAdditiveScoring(), completedPages: state.completedPages };
  }
  return state;
}

export function computeAdditiveProjection(q: number, candidate: AdditiveCandidateId): {
  query: [number, number];
  key: [number, number];
} {
  const queryValue = normalizeQuery(q);
  const column = ADDITIVE_CANDIDATES.findIndex((entry) => entry.id === candidate);
  if (queryValue === null || column < 0) throw new RangeError('Additive projection requires a valid query slider value and candidate.');
  return {
    query: [queryValue === 0 ? 0 : ADDITIVE_WQ[0] * queryValue, queryValue === 0 ? 0 : ADDITIVE_WQ[1] * queryValue],
    key: [ADDITIVE_WK[0][column], ADDITIVE_WK[1][column]],
  };
}

export const ADDITIVE_READOUT = [0.9, -0.7] as const;

export function computeAdditiveStages(q: number, candidate: AdditiveCandidateId): {
  projectedQuery: [number, number];
  projectedKey: [number, number];
  sum: [number, number];
  activation: [number, number];
  terms: [number, number];
  score: number;
} {
  const { query: projectedQuery, key: projectedKey } = computeAdditiveProjection(q, candidate);
  const sum: [number, number] = [projectedQuery[0] + projectedKey[0], projectedQuery[1] + projectedKey[1]];
  const activation: [number, number] = [Math.tanh(sum[0]), Math.tanh(sum[1])];
  const terms: [number, number] = [ADDITIVE_READOUT[0] * activation[0], ADDITIVE_READOUT[1] * activation[1]];
  return { projectedQuery, projectedKey, sum, activation, terms, score: terms[0] + terms[1] };
}
