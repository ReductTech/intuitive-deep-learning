import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { galtonSample, clamp, type HeightPair } from './linearRegressionMath';

const STATE_KEY = 'linear-regression-loss:lesson-v1';

interface LessonState {
  slope: number;
  intercept: number;
  prediction: number;
  selectedParent: number;
  checkedLine: boolean;
  checkedLoss: boolean;
}

interface ContextValue {
  state: LessonState;
  points: HeightPair[];
  setSlope: (value: number) => void;
  setIntercept: (value: number) => void;
  setPrediction: (value: number) => void;
  setSelectedParent: (value: number) => void;
  markLineChecked: () => void;
  markLossChecked: () => void;
  reset: () => void;
}

const initialState: LessonState = {
  slope: 0.5,
  intercept: 35,
  prediction: 69,
  selectedParent: 70,
  checkedLine: false,
  checkedLoss: false,
};

const Context = createContext<ContextValue | null>(null);

function readState(): LessonState {
  if (typeof window === 'undefined') return initialState;
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    if (!raw) return initialState;
    const value = JSON.parse(raw) as Partial<LessonState>;
    if (![value.slope, value.intercept, value.prediction, value.selectedParent].every((item) => typeof item === 'number' && Number.isFinite(item))) return initialState;
    return {
      slope: clamp(value.slope!, 0, 1.2),
      intercept: clamp(value.intercept!, -10, 80),
      prediction: clamp(value.prediction!, 55, 85),
      selectedParent: clamp(value.selectedParent!, 64, 75),
      checkedLine: Boolean(value.checkedLine),
      checkedLoss: Boolean(value.checkedLoss),
    };
  } catch { return initialState; }
}

export function LinearRegressionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LessonState>(readState);
  useEffect(() => { window.localStorage.setItem(STATE_KEY, JSON.stringify(state)); }, [state]);
  const value = useMemo<ContextValue>(() => ({
    state,
    points: galtonSample,
    setSlope: (value) => setState((current) => ({ ...current, slope: clamp(value, 0, 1.2), checkedLine: false })),
    setIntercept: (value) => setState((current) => ({ ...current, intercept: clamp(value, -10, 80), checkedLine: false })),
    setPrediction: (value) => setState((current) => ({ ...current, prediction: clamp(value, 55, 85), checkedLoss: false })),
    setSelectedParent: (value) => setState((current) => ({ ...current, selectedParent: clamp(value, 64, 75), checkedLoss: false })),
    markLineChecked: () => setState((current) => ({ ...current, checkedLine: true })),
    markLossChecked: () => setState((current) => ({ ...current, checkedLoss: true })),
    reset: () => setState(initialState),
  }), [state]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLinearRegression() {
  const value = useContext(Context);
  if (!value) throw new Error('useLinearRegression must be used inside LinearRegressionProvider');
  return value;
}

