import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { emitTelemetry, getTelemetryState } from '../../shared/react';
import type { DecisionAnalysis } from '../services/decisionAnalysis';
import { scenarioById, type DecisionScenario } from './neuronMath';

const MODULE_ID = 'neuron-guide';
const STATE_KEY = 'activity:neuron-guide-core-v3';
const LOCAL_STATE_KEY = `${MODULE_ID}:${STATE_KEY}`;

interface NeuronLessonState {
  analysis: DecisionAnalysis | null;
  acceptedImportance: boolean;
  values: Array<number | null>;
  touched: boolean[];
}

interface NeuronLessonContextValue {
  state: NeuronLessonState;
  scenario: DecisionScenario;
  hydrated: boolean;
  applyAnalysis: (analysis: DecisionAnalysis) => void;
  acceptImportance: () => void;
  setValueDraft: (index: number, value: number) => void;
  commitValues: () => void;
}

const NeuronLessonContext = createContext<NeuronLessonContextValue | null>(null);

function initialState(): NeuronLessonState {
  return {
    analysis: null,
    acceptedImportance: false,
    values: [null, null, null],
    touched: [false, false, false],
  };
}

function clampScore(value: number) {
  return Math.max(0, Math.min(10, value));
}

function normalizeAnalysis(value: unknown): DecisionAnalysis | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<DecisionAnalysis>;
  if (![candidate.decision, candidate.positiveLabel, candidate.negativeLabel].every((item) => typeof item === 'string' && item.trim())) return null;
  if (!Array.isArray(candidate.factors) || candidate.factors.length !== 3) return null;
  const factors = candidate.factors.map((factor) => {
    if (!factor || typeof factor !== 'object') return null;
    if (![factor.name, factor.valueLabel, factor.valueQuestion, factor.explanation].every((item) => typeof item === 'string' && item.trim())) return null;
    if (!Number.isFinite(factor.suggestedImportance) || factor.suggestedImportance < 0 || factor.suggestedImportance > 10) return null;
    if (factor.valueTransform !== 'direct' && factor.valueTransform !== 'inverse') return null;
    return { ...factor, suggestedImportance: Math.ceil(factor.suggestedImportance) };
  });
  if (factors.some((factor) => factor === null)) return null;
  return {
    decision: candidate.decision!,
    positiveLabel: candidate.positiveLabel!,
    negativeLabel: candidate.negativeLabel!,
    factors: factors as DecisionAnalysis['factors'],
  };
}

function normalizeState(value: unknown): NeuronLessonState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<NeuronLessonState>;
  const analysis = normalizeAnalysis(candidate.analysis);
  if (!analysis) return null;
  if (!Array.isArray(candidate.values) || candidate.values.length !== 3) return null;
  if (candidate.values.some((item) => item !== null && (typeof item !== 'number' || !Number.isFinite(item)))) return null;
  return {
    analysis,
    acceptedImportance: Boolean(candidate.acceptedImportance),
    values: candidate.values.map((item) => item === null ? null : clampScore(item)),
    touched: Array.from({ length: 3 }, (_, index) => Boolean(candidate.touched?.[index])),
  };
}

function stateSignature(state: NeuronLessonState) {
  return JSON.stringify(state);
}

function readLocalState(): NeuronLessonState | null {
  if (typeof window === 'undefined') return null;
  try {
    const serialized = window.localStorage.getItem(LOCAL_STATE_KEY);
    return serialized ? normalizeState(JSON.parse(serialized)) : null;
  } catch {
    return null;
  }
}

function writeLocalState(state: NeuronLessonState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable in privacy-restricted embeds; telemetry remains the fallback.
  }
}

export function NeuronLessonProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NeuronLessonState>(() => readLocalState() ?? initialState());
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  const lastCommittedRef = useRef('');

  const replaceState = (next: NeuronLessonState) => {
    stateRef.current = next;
    writeLocalState(next);
    setState(next);
  };

  const commitState = (eventName: string, next: NeuronLessonState, properties: Record<string, unknown> = {}) => {
    replaceState(next);
    const signature = stateSignature(next);
    if (!hydrated || signature === lastCommittedRef.current) return;
    lastCommittedRef.current = signature;
    emitTelemetry(eventName, null, { ...properties, state_key: STATE_KEY, state: next });
  };

  useEffect(() => {
    let active = true;
    void getTelemetryState<unknown>(STATE_KEY, MODULE_ID).then((entry) => {
      if (!active) return;
      // PPT pages are separate iframe navigations. Prefer the latest synchronous
      // browser state so a previous slide's choice is not replaced by stale telemetry.
      const restored = readLocalState() ?? normalizeState(entry?.state) ?? initialState();
      lastCommittedRef.current = stateSignature(restored);
      replaceState(restored);
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  const fallback = scenarioById('graduate-school');
  const scenario = useMemo<DecisionScenario>(() => state.analysis ? {
    id: 'service-result',
    label: state.analysis.positiveLabel,
    question: state.analysis.decision,
    positiveLabel: state.analysis.positiveLabel,
    negativeLabel: state.analysis.negativeLabel,
    factors: state.analysis.factors.map((factor) => ({ ...factor, suggestedValue: 5 })) as DecisionScenario['factors'],
  } : fallback, [fallback, state.analysis]);

  const value = useMemo<NeuronLessonContextValue>(() => ({
    state,
    scenario,
    hydrated,
    applyAnalysis: (analysis) => {
      if (!hydrated) return;
      commitState('neuron_decision_analyzed', { ...initialState(), analysis }, { decision: analysis.decision });
    },
    acceptImportance: () => commitState('neuron_weight_suggestion_accepted', { ...stateRef.current, acceptedImportance: true }),
    setValueDraft: (index, rawValue) => {
      if (!hydrated || index < 0 || index > 2) return;
      replaceState({
        ...stateRef.current,
        values: stateRef.current.values.map((item, currentIndex) => currentIndex === index ? clampScore(rawValue) : item),
        touched: stateRef.current.touched.map((item, currentIndex) => currentIndex === index ? true : item),
      });
    },
    commitValues: () => {
      const next = stateRef.current;
      const signature = stateSignature(next);
      if (!hydrated || signature === lastCommittedRef.current) return;
      lastCommittedRef.current = signature;
      emitTelemetry('neuron_input_value_changed', null, { touched_count: next.touched.filter(Boolean).length, state_key: STATE_KEY, state: next });
    },
  }), [hydrated, scenario, state]);

  return <NeuronLessonContext.Provider value={value}>{children}</NeuronLessonContext.Provider>;
}

export function useNeuronLesson() {
  const context = useContext(NeuronLessonContext);
  if (!context) throw new Error('useNeuronLesson must be used inside NeuronLessonProvider');
  return context;
}
