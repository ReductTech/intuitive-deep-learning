import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { emitTelemetry, getTelemetryState } from '../shared/react';
import type { DecisionAnalysis } from './services/decisionAnalysis';

interface LessonState {
  analysis: DecisionAnalysis | null;
  acceptedImportance: boolean;
  values: Array<number | null>;
  touched: boolean[];
}

interface LessonContextValue {
  state: LessonState;
  scenario: DecisionScenario;
  hydrated: boolean;
  applyAnalysis: (analysis: DecisionAnalysis) => void;
  acceptImportance: () => void;
  setValueDraft: (index: number, value: number) => void;
  commitValues: () => void;
}

const LessonContext = createContext<LessonContextValue | null>(null);

function initialState(): LessonState {
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
    if (![factor.name, factor.valueLabel, factor.valueQuestion, factor.minDesc, factor.maxDesc, factor.explanation].every((item) => typeof item === 'string' && item.trim())) return null;
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

function normalizeState(value: unknown): LessonState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Partial<LessonState>;
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

function stateSignature(state: LessonState) {
  return JSON.stringify(state);
}

function readLocalState(localStateKey: string): LessonState | null {
  if (typeof window === 'undefined') return null;
  try {
    const serialized = window.localStorage.getItem(localStateKey);
    return serialized ? normalizeState(JSON.parse(serialized)) : null;
  } catch {
    return null;
  }
}

function writeLocalState(localStateKey: string, state: LessonState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(localStateKey, JSON.stringify(state));
  } catch {
    // Storage can be unavailable in privacy-restricted embeds; telemetry remains the fallback.
  }
}

export interface LessonProviderProps {
  children: ReactNode;
  moduleId: string;
  stateKey: string;
  events: {
    decisionAnalyzed: string;
    importanceAccepted: string;
    inputValueChanged: string;
  };
}

export function LessonProvider({ children, moduleId, stateKey, events }: LessonProviderProps) {
  const localStateKey = `${moduleId}:${stateKey}`;
  const [state, setState] = useState<LessonState>(() => readLocalState(localStateKey) ?? initialState());
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  const lastCommittedRef = useRef('');

  const replaceState = (next: LessonState) => {
    stateRef.current = next;
    writeLocalState(localStateKey, next);
    setState(next);
  };

  const commitState = (eventName: string, next: LessonState, properties: Record<string, unknown> = {}) => {
    replaceState(next);
    const signature = stateSignature(next);
    if (!hydrated || signature === lastCommittedRef.current) return;
    lastCommittedRef.current = signature;
    emitTelemetry(eventName, null, { ...properties, state_key: stateKey, state: next });
  };

  useEffect(() => {
    let active = true;
    void getTelemetryState<unknown>(stateKey, moduleId).then((entry) => {
      if (!active) return;
      // PPT pages are separate iframe navigations. Prefer the latest synchronous
      // browser state so a previous slide's choice is not replaced by stale telemetry.
      const restored = readLocalState(localStateKey) ?? normalizeState(entry?.state) ?? initialState();
      lastCommittedRef.current = stateSignature(restored);
      replaceState(restored);
      setHydrated(true);
    });
    return () => { active = false; };
  }, [localStateKey, moduleId, stateKey]);

  const fallback = scenarioById('graduate-school');
  const scenario = useMemo<DecisionScenario>(() => state.analysis ? {
    id: 'service-result',
    label: state.analysis.positiveLabel,
    question: state.analysis.decision,
    positiveLabel: state.analysis.positiveLabel,
    negativeLabel: state.analysis.negativeLabel,
    factors: state.analysis.factors.map((factor) => ({ ...factor, suggestedValue: 5 })) as DecisionScenario['factors'],
  } : fallback, [fallback, state.analysis]);

  const value = useMemo<LessonContextValue>(() => ({
    state,
    scenario,
    hydrated,
    applyAnalysis: (analysis) => {
      if (!hydrated) return;
      commitState(events.decisionAnalyzed, { ...initialState(), analysis }, { decision: analysis.decision });
    },
    acceptImportance: () => commitState(events.importanceAccepted, { ...stateRef.current, acceptedImportance: true }),
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
      emitTelemetry(events.inputValueChanged, null, { touched_count: next.touched.filter(Boolean).length, state_key: stateKey, state: next });
    },
  }), [events.decisionAnalyzed, events.importanceAccepted, events.inputValueChanged, hydrated, scenario, state, stateKey]);

  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
}

export function useLesson() {
  const context = useContext(LessonContext);
  if (!context) throw new Error('useLesson must be used inside LessonProvider');
  return context;
}

export interface DecisionFactor {
  name: string;
  valueLabel: string;
  valueQuestion: string;
  minDesc: string;
  maxDesc: string;
  explanation: string;
  suggestedImportance: number;
  suggestedValue: number;
  valueTransform?: 'direct' | 'inverse';
}

export interface DecisionScenario {
  id: string;
  label: string;
  question: string;
  positiveLabel: string;
  negativeLabel: string;
  factors: [DecisionFactor, DecisionFactor, DecisionFactor];
}

export const decisionScenarios: DecisionScenario[] = [
  {
    id: 'graduate-school',
    label: '读研',
    question: '是否要读研？',
    positiveLabel: '读研',
    negativeLabel: '不读研',
    factors: [
      { name: '研究兴趣', valueLabel: '研究兴趣', valueQuestion: '你现在对深入研究的兴趣有多强？', minDesc: '完全没有', maxDesc: '非常强烈', explanation: '它会直接影响长期投入的动力。', suggestedImportance: 9, suggestedValue: 8 },
      { name: '职业帮助', valueLabel: '职业帮助', valueQuestion: '读研对你的目标职业帮助有多大？', minDesc: '完全不需要', maxDesc: '几乎必须', explanation: '它决定这段学习经历与目标的匹配程度。', suggestedImportance: 7, suggestedValue: 7 },
      { name: '经济承受力', valueLabel: '经济承受力', valueQuestion: '你目前承担时间与经济成本的能力有多强？', minDesc: '完全无法承受', maxDesc: '完全没有压力', explanation: '它影响计划是否能够持续执行。', suggestedImportance: 6, suggestedValue: 5 },
    ],
  },
  {
    id: 'job-offer',
    label: '接下这个 offer',
    question: '是否要接下这个 offer？',
    positiveLabel: '接受 offer',
    negativeLabel: '不接受 offer',
    factors: [
      { name: '成长空间', valueLabel: '成长空间', valueQuestion: '这份工作能提供多大的成长空间？', minDesc: '几乎没有', maxDesc: '非常充足', explanation: '它影响这份选择的长期价值。', suggestedImportance: 8, suggestedValue: 9 },
      { name: '薪资满意度', valueLabel: '薪资满意度', valueQuestion: '你对薪资和福利有多满意？', minDesc: '完全不满意', maxDesc: '非常满意', explanation: '它影响现实回报和生活压力。', suggestedImportance: 7, suggestedValue: 6 },
      { name: '生活平衡', valueLabel: '生活平衡', valueQuestion: '这份工作能提供多好的生活平衡？', minDesc: '完全没有平衡', maxDesc: '非常理想', explanation: '它影响这份工作能否长期持续。', suggestedImportance: 8, suggestedValue: 4 },
    ],
  },
  {
    id: 'fitness',
    label: '开始健身',
    question: '是否要开始规律健身？',
    positiveLabel: '开始健身',
    negativeLabel: '暂不开始',
    factors: [
      { name: '健康需要', valueLabel: '健康需要', valueQuestion: '你改善健康状态的需要有多强？', minDesc: '几乎没有', maxDesc: '非常强烈', explanation: '它决定行动能带来多大实际收益。', suggestedImportance: 9, suggestedValue: 8 },
      { name: '时间余量', valueLabel: '时间余量', valueQuestion: '你目前能稳定安排多少时间？', minDesc: '几乎没有时间', maxDesc: '时间非常充裕', explanation: '它影响计划能否真正执行。', suggestedImportance: 7, suggestedValue: 5 },
      { name: '行动意愿', valueLabel: '行动意愿', valueQuestion: '你现在开始行动的意愿有多强？', minDesc: '完全没有', maxDesc: '非常强烈', explanation: '它影响计划能否从想法变成习惯。', suggestedImportance: 8, suggestedValue: 7 },
    ],
  },
  {
    id: 'general',
    label: '自定义决定',
    question: '是否要做这件事？',
    positiveLabel: '做这件事',
    negativeLabel: '暂时不做',
    factors: [
      { name: '预期收益', valueLabel: '预期收益', valueQuestion: '这件事可能带来的收益有多大？', minDesc: '几乎没有', maxDesc: '非常可观', explanation: '它代表这个决定可能带来的正向结果。', suggestedImportance: 8, suggestedValue: 7 },
      { name: '现实可行性', valueLabel: '现实可行性', valueQuestion: '以你目前的条件，这件事有多可行？', minDesc: '完全不可行', maxDesc: '非常可行', explanation: '它决定想法能否真正落地。', suggestedImportance: 7, suggestedValue: 6 },
      { name: '长期匹配度', valueLabel: '长期匹配度', valueQuestion: '这件事与你的长期目标有多匹配？', minDesc: '完全不匹配', maxDesc: '高度匹配', explanation: '它帮助避免只看眼前感受。', suggestedImportance: 8, suggestedValue: 5 },
    ],
  },
];

export const DEFAULT_SCENARIO_ID = decisionScenarios[0].id;

export function scenarioById(id: string): DecisionScenario {
  return decisionScenarios.find((scenario) => scenario.id === id) ?? decisionScenarios[0];
}

export function normalizeDecision(value: string): string {
  const target = value.trim()
    .replace(/[？?。.!！\s]+$/g, '')
    .replace(/^(是否要|要不要|该不该|能不能|可不可以)/, '')
    .trim();
  return `是否要${target || '读研'}？`;
}

export function scenarioIdForDecision(value: string): string {
  if (/offer|工作|求职|入职|跳槽/i.test(value)) return 'job-offer';
  if (/健身|运动|跑步|瑜伽/i.test(value)) return 'fitness';
  if (/读研|研究生|考研|留学/i.test(value)) return 'graduate-school';
  return 'general';
}

export function normalizedInput(value: number | null | undefined): number {
  return Math.max(0, Math.min(10, value ?? 5)) / 10;
}

export function effectiveInput(factor: DecisionFactor, value: number | null | undefined): number {
  const raw = normalizedInput(value);
  return factor.valueTransform === 'inverse' ? 1 - raw : raw;
}

export function normalizedWeight(value: number): number {
  return Math.max(0, Math.min(10, value)) / 10;
}

export function weightedContributions(
  scenario: DecisionScenario,
  values: Array<number | null>,
): number[] {
  return scenario.factors.map((factor, index) => (
    effectiveInput(factor, values[index]) * normalizedWeight(factor.suggestedImportance)
  ));
}

export function weightedSum(
  scenario: DecisionScenario,
  values: Array<number | null>,
): number {
  return weightedContributions(scenario, values)
    .reduce((sum, contribution) => sum + contribution, 0);
}

export function formatScore(value: number): string {
  return value.toFixed(2);
}
