import type { Matrix } from './lenetTypes';

export const DETECTION_CANVAS_SIZE = 256;
export const DETECTION_IMAGE_SIZE = 28;
export const DETECTION_SCAN_STEP = 12;
export const DETECTION_SCAN_INTERVAL_MS = 40;
export const DETECTION_WINDOWS_PER_TICK = 2;
export const DETECTION_RANKING_UPDATE_EVERY = 6;
export const DETECTION_TARGET_DIGIT = 6;
export const DETECTION_DIGITS = [0, 2, 4, 6, 8] as const;

export interface DetectionPosition {
  left: number;
  top: number;
}

export interface DetectionDigit extends DetectionPosition {
  digit: number;
  image: Matrix;
}

export interface DetectionWindowScore extends DetectionPosition {
  score: number;
}

export function detectionScanStarts() {
  const starts: number[] = [];
  const maxStart = DETECTION_CANVAS_SIZE - DETECTION_IMAGE_SIZE;
  for (let value = 0; value <= maxStart; value += DETECTION_SCAN_STEP) starts.push(value);
  return starts;
}

export function detectionScanWindows(): DetectionPosition[] {
  const starts = detectionScanStarts();
  return starts.flatMap((top) => starts.map((left) => ({ left, top })));
}

export function makeDetectionPositions(
  count: number,
  random: () => number = Math.random,
): DetectionPosition[] {
  const maxStart = DETECTION_CANVAS_SIZE - DETECTION_IMAGE_SIZE - DETECTION_SCAN_STEP;
  const starts = detectionScanStarts().filter(
    (value) => value >= DETECTION_SCAN_STEP && value <= maxStart,
  );
  const candidates = starts.flatMap((top) => starts.map((left) => ({ left, top })));
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.max(0, Math.min(0.999999, random())) * (index + 1));
    [candidates[index], candidates[swap]] = [candidates[swap], candidates[index]];
  }

  const positions: DetectionPosition[] = [];
  while (positions.length < count && candidates.length) {
    const candidate = candidates.shift();
    if (!candidate) break;
    const overlaps = positions.some((position) => (
      Math.abs(position.left - candidate.left) < DETECTION_IMAGE_SIZE + DETECTION_SCAN_STEP
      && Math.abs(position.top - candidate.top) < DETECTION_IMAGE_SIZE + DETECTION_SCAN_STEP
    ));
    if (!overlaps) positions.push(candidate);
  }
  return positions;
}

export function cropMatrix(
  matrix: Matrix,
  left: number,
  top: number,
  width = DETECTION_IMAGE_SIZE,
  height = DETECTION_IMAGE_SIZE,
): Matrix {
  return Array.from({ length: height }, (_, row) => (
    Array.from({ length: width }, (_, column) => {
      const value = Number(matrix[top + row]?.[left + column]);
      return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
    })
  ));
}

export function composeDetectionScene(digits: readonly DetectionDigit[]): Matrix {
  const scene = Array.from(
    { length: DETECTION_CANVAS_SIZE },
    () => Array.from({ length: DETECTION_CANVAS_SIZE }, () => 0),
  );
  digits.forEach((item) => {
    for (let row = 0; row < DETECTION_IMAGE_SIZE; row += 1) {
      for (let column = 0; column < DETECTION_IMAGE_SIZE; column += 1) {
        const targetRow = item.top + row;
        const targetColumn = item.left + column;
        if (targetRow < 0 || targetRow >= DETECTION_CANVAS_SIZE) continue;
        if (targetColumn < 0 || targetColumn >= DETECTION_CANVAS_SIZE) continue;
        const value = Math.max(0, Math.min(1, Number(item.image[row]?.[column]) || 0));
        scene[targetRow][targetColumn] = Math.max(scene[targetRow][targetColumn], value);
      }
    }
  });
  return scene;
}

export function rankDetectionWindows(windows: readonly DetectionWindowScore[]) {
  return [...windows].sort(
    (left, right) => right.score - left.score || left.top - right.top || left.left - right.left,
  );
}

export function bestDetectionWindow(windows: readonly DetectionWindowScore[]) {
  return rankDetectionWindows(windows)[0] ?? null;
}

export function isDetectionCoordinate(value: unknown) {
  const numeric = Number(value);
  const maxStart = DETECTION_CANVAS_SIZE - DETECTION_IMAGE_SIZE;
  return Number.isInteger(numeric)
    && numeric >= 0
    && numeric <= maxStart
    && numeric % DETECTION_SCAN_STEP === 0;
}
