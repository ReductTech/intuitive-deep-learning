export interface DotProductState {
  version: 1;
  theta: number;
  keyLength: number;
  interacted: boolean;
}

export type DotProductAction =
  | { type: 'set-theta'; value: number }
  | { type: 'set-length'; value: number }
  | { type: 'reset' };

function isTheta(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 180;
}

function normalizeKeyLength(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const tenths = Math.round(value * 10);
  const length = tenths / 10;
  if (tenths < 5 || tenths > 14 || Math.abs(value - length) > 1e-9) return null;
  return length;
}

export function createDotProduct(): DotProductState {
  return { version: 1, theta: 32, keyLength: 1, interacted: false };
}

export function normalizeDotProduct(value: unknown): DotProductState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<DotProductState>;
  if (candidate.version !== 1 || !isTheta(candidate.theta) || typeof candidate.interacted !== 'boolean') return null;
  const keyLength = normalizeKeyLength(candidate.keyLength);
  if (keyLength === null) return null;
  return { version: 1, theta: candidate.theta === 0 ? 0 : candidate.theta, keyLength, interacted: candidate.interacted };
}

export function dotProductReducer(state: DotProductState, action: DotProductAction): DotProductState {
  if (!action || typeof action !== 'object' || Array.isArray(action)) return state;
  if (action.type === 'set-theta') {
    if (!isTheta(action.value) || action.value === state.theta) return state;
    return { ...state, theta: action.value === 0 ? 0 : action.value, interacted: true };
  }
  if (action.type === 'set-length') {
    const keyLength = normalizeKeyLength(action.value);
    if (keyLength === null || keyLength === state.keyLength) return state;
    return { ...state, keyLength, interacted: true };
  }
  if (action.type === 'reset') {
    if (state.theta === 32 && state.keyLength === 1) return state;
    return { ...createDotProduct(), interacted: state.interacted };
  }
  return state;
}

export function computeDotProduct(theta: number, keyLength: number): {
  q: [number, number];
  k: [number, number];
  score: number;
  cosine: number;
} {
  const length = normalizeKeyLength(keyLength);
  if (!isTheta(theta) || length === null) throw new RangeError('Dot product inputs must match the angle and length slider ranges.');
  const radians = theta * Math.PI / 180;
  // Preserve exact cardinal directions instead of exposing trigonometric round-off.
  const cosine = theta === 0 ? 1 : theta === 90 ? 0 : theta === 180 ? -1 : Math.cos(radians);
  const sine = theta === 0 || theta === 180 ? 0 : theta === 90 ? 1 : Math.sin(radians);
  const x = length * cosine;
  const y = length * sine;
  return { q: [1, 0], k: [x, y], score: x, cosine };
}

export function hasCompletedDotProduct(state: DotProductState): boolean {
  return state.interacted;
}
