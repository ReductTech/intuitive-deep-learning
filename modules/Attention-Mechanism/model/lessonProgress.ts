/** Restore only the completed prefix, followed by the next interactive page. */
export function reconcileLessonVisibility(
  value: unknown,
  pageIds: readonly string[],
): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value) || pageIds.length === 0) return null;
  const saved = value as Record<string, unknown>;
  const completedIds = Array.isArray(saved.completedIds) ? saved.completedIds : [];
  const firstIncomplete = pageIds.findIndex(id => !completedIds.includes(id));
  const prefixLength = firstIncomplete < 0 ? pageIds.length : firstIncomplete;
  const orderedCompleted = pageIds.slice(0, prefixLength);
  const visibleCount = Math.min(pageIds.length, prefixLength + 1);
  if (saved.visibleCount === visibleCount
    && completedIds.length === orderedCompleted.length
    && completedIds.every((id, index) => id === orderedCompleted[index])) return saved;
  // Keep old records available without letting them skip unfinished interactions.
  return { ...saved, completedIds: orderedCompleted, visibleCount,
    previousCompletedIds: saved.previousCompletedIds ?? completedIds };
}
