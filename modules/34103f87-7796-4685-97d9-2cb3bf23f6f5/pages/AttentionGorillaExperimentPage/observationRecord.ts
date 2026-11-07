export const OBSERVATION_RECORD_KEY = 'attention-mechanism:campus-observation-v1';
export const OBSERVATION_RECORD_EVENT = 'attention-observation-record-changed';
export type ObservationPhase = 'intro' | 'count' | 'recall' | 'reveal' | 'complete';
export interface ObservationRecord {
  version: 1;
  phase: ObservationPhase;
  count: number | null;
  recall: string;
}
export const freshObservationRecord = (): ObservationRecord => ({ version: 1, phase: 'intro', count: null, recall: '' });
let memoryFallback = freshObservationRecord();
export function writeObservationRecord(record: ObservationRecord): void {
  memoryFallback = { ...record };
  try { localStorage.setItem(OBSERVATION_RECORD_KEY, JSON.stringify(record)); } catch { /* Keep the shared in-memory record. */ }
  window.dispatchEvent(new Event(OBSERVATION_RECORD_EVENT));
}
export function readObservationRecord(): ObservationRecord {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(OBSERVATION_RECORD_KEY) ?? 'null');
    if (!value || typeof value !== 'object') return freshObservationRecord();
    const record = value as Partial<ObservationRecord>;
    const countValid = record.count === null || (Number.isInteger(record.count) && Number(record.count) >= 0 && Number(record.count) <= 99);
    const phases: ObservationPhase[] = ['intro', 'count', 'recall', 'reveal', 'complete'];
    if (record.version !== 1 || !phases.includes(record.phase as ObservationPhase) || !countValid || typeof record.recall !== 'string' || record.recall.length > 160) return freshObservationRecord();
    if (['recall', 'reveal', 'complete'].includes(record.phase!) && record.count === null) return freshObservationRecord();
    if (['reveal', 'complete'].includes(record.phase!) && !record.recall.trim()) return freshObservationRecord();
    return record as ObservationRecord;
  } catch { return { ...memoryFallback }; }
}
