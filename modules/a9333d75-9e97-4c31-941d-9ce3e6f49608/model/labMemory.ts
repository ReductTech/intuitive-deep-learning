import { useSyncExternalStore } from 'react';
import type { PatchOp } from './labModel';

export type LabMemory = {
  generated: boolean;
  written: boolean;
  contracts: number[];
  pauseEvidence: { before: number; after: number; elapsed: number } | null;
  inspected: boolean;
  patch: PatchOp[] | null;
  revision: number;
  verified: boolean;
};
const KEY = 'agent-complex-task-lab-v3';
const INITIAL: LabMemory = { generated: false, written: false, contracts: [], pauseEvidence: null, inspected: false, patch: null, revision: 0, verified: false };
let snapshot: LabMemory = INITIAL;
try {
  const saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
  if (saved && typeof saved.revision === 'number' && Array.isArray(saved.contracts)) snapshot = { ...INITIAL, ...saved };
} catch { /* The lesson also works when browser storage is disabled. */ }
const listeners = new Set<() => void>();
export function updateLab(update: Partial<LabMemory>) {
  snapshot = { ...snapshot, ...update };
  try { sessionStorage.setItem(KEY, JSON.stringify(snapshot)); } catch { /* In-memory fallback. */ }
  listeners.forEach(notify => notify());
}
export function useLabMemory() {
  return useSyncExternalStore((notify) => { listeners.add(notify); return () => { listeners.delete(notify); }; }, () => snapshot, () => INITIAL);
}
