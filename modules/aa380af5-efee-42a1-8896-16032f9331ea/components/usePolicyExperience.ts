import { useEffect, useReducer, useRef } from 'react';
import { sampleDelivery, type DeliveryExperience, type EvaluationPolicy } from './policyEvaluation';

interface SamplingState {
  samples: DeliveryExperience[]; active: DeliveryExperience | null;
  cursor: number; playing: boolean; record: boolean;
}
type SamplingEvent = { type: 'begin'; experience: DeliveryExperience; playing: boolean }
  | { type: 'advance' } | { type: 'play'; playing: boolean }
  | { type: 'batch'; experiences: DeliveryExperience[] }
  | { type: 'replay'; experience: DeliveryExperience } | { type: 'reset' } | { type: 'cancel' };
const initial: SamplingState = { samples: [], active: null, cursor: 0, playing: false, record: false };
function reducer(state: SamplingState, event: SamplingEvent): SamplingState {
  if (event.type === 'reset') return initial;
  if (event.type === 'cancel') {
    const last = state.samples.at(-1) ?? null;
    return { ...state, active: last, cursor: last?.actions.length ?? 0, playing: false, record: false };
  }
  if (event.type === 'begin') return { ...state, active: event.experience, cursor: 0, playing: event.playing, record: true };
  if (event.type === 'play') return { ...state, playing: event.playing };
  if (event.type === 'replay') return { ...state, active: event.experience, cursor: 0, playing: true, record: false };
  if (event.type === 'batch') {
    const last = event.experiences.at(-1)!;
    return { samples: [...state.samples, ...event.experiences], active: last, cursor: last.actions.length, playing: false, record: false };
  }
  if (!state.active || state.cursor >= state.active.actions.length) return state;
  const cursor = state.cursor + 1, finished = cursor === state.active.actions.length;
  return { ...state, cursor, playing: finished ? false : state.playing, record: finished ? false : state.record,
    samples: finished && state.record ? [...state.samples, state.active] : state.samples };
}

export function usePolicyExperience(policy: EvaluationPolicy, firstAction?: number) {
  const [state, dispatch] = useReducer(reducer, initial);
  const rootRef = useRef<HTMLDivElement>(null);
  const pending = !!state.active && state.cursor < state.active.actions.length;
  const make = (index: number) => sampleDelivery(policy, index, firstAction);
  function start() {
    if (pending) dispatch({ type: 'play', playing: !state.playing });
    else dispatch({ type: 'begin', experience: make(state.samples.length), playing: true });
  }
  function step() {
    if (!pending) dispatch({ type: 'begin', experience: make(state.samples.length), playing: false });
    else dispatch({ type: 'play', playing: false });
    dispatch({ type: 'advance' });
  }
  function addBatch(count = 10) {
    if (pending && state.record) return;
    dispatch({ type: 'batch', experiences: Array.from({ length: count }, (_, i) => make(state.samples.length + i)) });
  }
  useEffect(() => {
    if (!state.playing) return;
    const timer = window.setInterval(() => dispatch({ type: 'advance' }), 100);
    return () => window.clearInterval(timer);
  }, [state.playing, state.active]);
  useEffect(() => {
    const pause = () => dispatch({ type: 'play', playing: false });
    const onHidden = () => { if (document.hidden) pause(); };
    const observer = new IntersectionObserver(entries => { if (!entries[0].isIntersecting) pause(); });
    if (rootRef.current) observer.observe(rootRef.current);
    document.addEventListener('visibilitychange', onHidden);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', onHidden); };
  }, []);
  return { ...state, pending, rootRef, start, step, addBatch,
    cancel: () => dispatch({ type: 'cancel' }),
    reset: () => dispatch({ type: 'reset' }),
    replay: (experience: DeliveryExperience) => dispatch({ type: 'replay', experience }),
  };
}
