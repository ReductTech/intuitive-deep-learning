import {
  DIGIT_CLASS_COUNT,
  IMAGE_SIZE,
  inferImage,
} from './fixedKernelMath';
import type { LenetClassifierSession, Matrix } from './lenetTypes';

export const SEQUENCE_LENGTH = 5;
export const SEQUENCE_SCAN_DURATION_MS = 5_000;
export const SEQUENCE_SCAN_START_DELAY_MS = 80;
export const SEQUENCE_CTC_MIN_CONFIDENCE = 0.42;
export const SEQUENCE_CTC_MIN_RUN_LENGTH = 2;

export interface SequenceDigitBox {
  digit: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SequenceSample {
  digits: string;
  image: Matrix;
  width: number;
  height: number;
  boxes: SequenceDigitBox[];
  spacing: number;
  margin: number;
  seed: number | null;
  sampleSalts: number[];
  durationMs: number;
}

export interface DigitInference {
  digit: string;
  confidence: number;
  probs: number[] | null;
  reject: boolean;
  prediction?: number;
}

export interface SequenceFrame {
  left: number;
  ink: number;
  blank: boolean;
  digit: string;
  confidence: number;
  reject: boolean;
  prediction?: number;
  ctcSymbol: string;
  keep?: boolean;
  ctcBlank?: boolean;
  ctcRunLength?: number;
}

export interface DecodedSequence {
  decoded: string;
  frames: SequenceFrame[];
}

interface DecodeOptions {
  /** The legacy preview decoder does not force the expected five-symbol length. */
  finalize?: boolean;
  targetLength?: number;
}

interface SequenceRun {
  symbol: string;
  indices: number[];
}

interface CandidateRun {
  symbol: string;
  bestIndex: number;
  length: number;
  score: number;
  removed?: boolean;
}

export function randomSequenceDigits(random = Math.random) {
  return Array.from(
    { length: SEQUENCE_LENGTH },
    () => String(Math.floor(random() * DIGIT_CLASS_COUNT)),
  ).join('');
}

export function isSequenceDigits(value: unknown): value is string {
  return typeof value === 'string' && /^\d{5}$/.test(value);
}

export function sequenceScanPositions(sample: Pick<SequenceSample, 'width'>) {
  const maxLeft = Math.max(0, Math.round(Number(sample.width) || IMAGE_SIZE) - IMAGE_SIZE);
  return Array.from({ length: maxLeft + 1 }, (_, left) => left);
}

/** Crop the exact 28 x 28 horizontal window used by the legacy 1 px scan. */
export function cropSequenceWindow(
  sequence: Pick<SequenceSample, 'image' | 'height'>,
  left: number,
): Matrix {
  const image = sequence.image ?? [];
  const y0 = Math.max(
    0,
    Math.round(((Number(sequence.height) || image.length || IMAGE_SIZE) - IMAGE_SIZE) / 2),
  );
  const sourceLeft = Math.max(0, Math.round(Number(left) || 0));
  return Array.from({ length: IMAGE_SIZE }, (_, row) => (
    Array.from({ length: IMAGE_SIZE }, (_, col) => {
      const value = Number(image[y0 + row]?.[sourceLeft + col]) || 0;
      return Math.max(0, Math.min(1, value));
    })
  ));
}

export function meanInk(image: Matrix) {
  const total = image.reduce(
    (sum, row) => sum + row.reduce((rowSum, value) => rowSum + (Number(value) || 0), 0),
    0,
  );
  return total / (IMAGE_SIZE * IMAGE_SIZE);
}

/**
 * Run the trained 11-class fixed-kernel classifier for one 28 x 28 window.
 * Class 10 (or the classifier-provided reject label) is the CTC blank/reject.
 */
export function inferDigitImage(
  classifierSession: LenetClassifierSession | null | undefined,
  image: Matrix,
): DigitInference {
  if (!classifierSession) {
    return { digit: '?', confidence: 0, probs: null, reject: true };
  }
  const inference = inferImage(image, classifierSession.classifier);
  if (!inference) {
    return { digit: '?', confidence: 0, probs: null, reject: true };
  }
  const { prediction, probs } = inference;
  const rejectLabel = Number.isInteger(classifierSession.classifier.reject_label)
    ? classifierSession.classifier.reject_label
    : DIGIT_CLASS_COUNT;
  const reject = prediction === rejectLabel || prediction >= DIGIT_CLASS_COUNT;
  return {
    digit: reject ? '_' : String(prediction),
    confidence: Number(probs[prediction]) || 0,
    probs,
    reject,
    prediction,
  };
}

export function makeSequenceFrame(
  classifierSession: LenetClassifierSession,
  sequence: SequenceSample,
  left: number,
): SequenceFrame {
  const image = cropSequenceWindow(sequence, left);
  const prediction = inferDigitImage(classifierSession, image);
  const ctcSymbol = !prediction.reject
    && prediction.digit !== '_'
    && prediction.confidence >= SEQUENCE_CTC_MIN_CONFIDENCE
    ? prediction.digit
    : '_';
  return {
    left,
    ink: meanInk(image),
    blank: prediction.reject,
    digit: prediction.digit,
    confidence: prediction.confidence,
    reject: prediction.reject,
    prediction: prediction.prediction,
    ctcSymbol,
  };
}

/**
 * Legacy CTC-like merge, kept deliberately exact:
 * - confidence below 0.42 becomes blank;
 * - adjacent equal symbols form a run;
 * - a one-frame run below 0.7 is initially dropped;
 * - final decoding restores/removes the weakest runs to target five symbols;
 * - the highest-confidence frame represents each retained run.
 */
export function decodeSequenceFrames(
  inputFrames: readonly SequenceFrame[],
  { finalize = true, targetLength = SEQUENCE_LENGTH }: DecodeOptions = {},
): DecodedSequence {
  const frames: SequenceFrame[] = inputFrames.map((frame): SequenceFrame => {
    const ctcSymbol = !frame.reject
      && frame.digit !== '_'
      && Number(frame.confidence) >= SEQUENCE_CTC_MIN_CONFIDENCE
      ? frame.digit
      : '_';
    return {
      ...frame,
      ctcSymbol,
      keep: false,
      ctcBlank: false,
      ctcRunLength: undefined,
    };
  });
  const runs: SequenceRun[] = [];
  frames.forEach((frame, index) => {
    const last = runs[runs.length - 1];
    if (last?.symbol === frame.ctcSymbol) last.indices.push(index);
    else runs.push({ symbol: frame.ctcSymbol, indices: [index] });
  });

  const accepted: CandidateRun[] = [];
  const dropped: CandidateRun[] = [];
  runs.forEach((run) => {
    const bestIndex = run.indices.reduce((winner, index) => (
      frames[index].confidence > frames[winner].confidence ? index : winner
    ), run.indices[0]);
    if (run.symbol === '_') {
      frames[bestIndex].ctcBlank = true;
      return;
    }
    const item: CandidateRun = {
      symbol: run.symbol,
      bestIndex,
      length: run.indices.length,
      score: Math.min(run.indices.length, 8) + frames[bestIndex].confidence,
    };
    if (
      run.indices.length < SEQUENCE_CTC_MIN_RUN_LENGTH
      && frames[bestIndex].confidence < 0.7
    ) dropped.push(item);
    else accepted.push(item);
  });

  const forcedLength = finalize && Number.isInteger(targetLength) && targetLength > 0
    ? targetLength
    : 0;
  if (forcedLength && accepted.length < forcedLength) {
    dropped
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, forcedLength - accepted.length)
      .forEach((run) => accepted.push(run));
  }
  if (forcedLength && accepted.length > forcedLength) {
    accepted
      .slice()
      .sort((a, b) => a.score - b.score)
      .slice(0, accepted.length - forcedLength)
      .forEach((run) => { run.removed = true; });
  }

  const decoded: string[] = [];
  accepted
    .slice()
    .sort((a, b) => frames[a.bestIndex].left - frames[b.bestIndex].left)
    .forEach((run) => {
      if (run.removed) return;
      frames[run.bestIndex].keep = true;
      frames[run.bestIndex].ctcRunLength = run.length;
      decoded.push(run.symbol);
    });
  return { decoded: decoded.join(''), frames };
}

export function sequenceScanInterval(frameCount: number) {
  return Math.max(
    16,
    Math.round(
      (SEQUENCE_SCAN_DURATION_MS - SEQUENCE_SCAN_START_DELAY_MS)
      / Math.max(1, Math.round(frameCount)),
    ),
  );
}
