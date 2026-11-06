/** Reconcile a host seed that retains completion but starts visibility at page one. */
export function reconcileGuideProgress(value: unknown, pageIds: readonly string[]) {
  const source = value && typeof value === 'object'
    ? value as { completedIds?: unknown; visibleCount?: unknown; completed?: unknown } : {};
  const completedIds = Array.isArray(source.completedIds)
    ? [...new Set(source.completedIds.filter((id): id is string => typeof id === 'string' && pageIds.includes(id)))] : [];
  const savedVisible = Number(source.visibleCount);
  const unlocked = Math.max(1, ...completedIds.map(id => pageIds.indexOf(id) + 2));
  const visibleCount = Math.min(pageIds.length, Math.max(unlocked, Number.isFinite(savedVisible) ? Math.trunc(savedVisible) : 1));
  return { completedIds, visibleCount, completed: source.completed === true };
}
