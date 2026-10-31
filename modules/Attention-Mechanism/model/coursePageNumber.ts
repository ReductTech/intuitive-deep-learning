/** Stable source IDs retain their progress while the visible lesson order evolves. */
export const ATTENTION_PAGE_ORDER = [1, 2, 3, 26, 4, 5, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 24, 25, 28, 30, 32, 33] as const;
export const ATTENTION_PAGE_COUNT = ATTENTION_PAGE_ORDER.length;

export function formatCoursePageNumber(original: number): string {
  const index = ATTENTION_PAGE_ORDER.findIndex(number => number === original);
  return String(index >= 0 ? index + 1 : original).padStart(2, '0');
}
