import { classifierIsUsable } from '../model/fixedKernelMath';
import type {
  FixedKernelActivityState,
  FixedKernelId,
  LenetClassifier,
} from '../model/lenetTypes';

interface EncodedFloat32Vector {
  encoding: 'f32-base64';
  length: number;
  data: string;
}

interface EncodedFloat32Matrix {
  encoding: 'f32-base64-matrix';
  rows: number;
  cols: number;
  data: string;
}

interface CompactLenetClassifier {
  encoding: 'lenet-classifier-f32-v1';
  weights: EncodedFloat32Matrix;
  bias: EncodedFloat32Vector;
  mean: EncodedFloat32Vector;
  std: EncodedFloat32Vector;
  kernels: FixedKernelId[];
  class_count: number;
  reject_label: number;
}

function bytesToBase64(bytes: Uint8Array) {
  const chunkSize = 0x8000;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return window.btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function encodeVector(values: readonly number[]): EncodedFloat32Vector {
  const bytes = new Uint8Array(values.length * Float32Array.BYTES_PER_ELEMENT);
  const view = new DataView(bytes.buffer);
  values.forEach((value, index) => {
    view.setFloat32(index * Float32Array.BYTES_PER_ELEMENT, Number(value) || 0, true);
  });
  return {
    encoding: 'f32-base64',
    length: values.length,
    data: bytesToBase64(bytes),
  };
}

function decodeVector(value: unknown): number[] | null {
  if (!value || typeof value !== 'object') return null;
  const encoded = value as Partial<EncodedFloat32Vector>;
  const length = Number(encoded.length);
  if (
    encoded.encoding !== 'f32-base64'
    || !Number.isInteger(length)
    || length < 0
    || length > 100_000
    || typeof encoded.data !== 'string'
  ) return null;
  try {
    const bytes = base64ToBytes(encoded.data);
    if (bytes.byteLength !== length * Float32Array.BYTES_PER_ELEMENT) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return Array.from({ length }, (_, index) => (
      view.getFloat32(index * Float32Array.BYTES_PER_ELEMENT, true)
    ));
  } catch {
    return null;
  }
}

function encodeMatrix(values: readonly (readonly number[])[]): EncodedFloat32Matrix {
  const rows = values.length;
  const cols = rows ? values[0].length : 0;
  if (values.some((row) => row.length !== cols)) {
    throw new Error('Classifier weight matrix is not rectangular.');
  }
  const flattened = values.flat();
  const vector = encodeVector(flattened);
  return {
    encoding: 'f32-base64-matrix',
    rows,
    cols,
    data: vector.data,
  };
}

function decodeMatrix(value: unknown): number[][] | null {
  if (!value || typeof value !== 'object') return null;
  const encoded = value as Partial<EncodedFloat32Matrix>;
  const rows = Number(encoded.rows);
  const cols = Number(encoded.cols);
  if (
    encoded.encoding !== 'f32-base64-matrix'
    || !Number.isInteger(rows)
    || rows < 0
    || rows > 10_000
    || !Number.isInteger(cols)
    || cols < 0
    || cols > 1_000
    || typeof encoded.data !== 'string'
  ) return null;
  const flattened = decodeVector({
    encoding: 'f32-base64',
    length: rows * cols,
    data: encoded.data,
  });
  if (!flattened) return null;
  return Array.from({ length: rows }, (_, rowIndex) => (
    flattened.slice(rowIndex * cols, (rowIndex + 1) * cols)
  ));
}

function encodeClassifier(classifier: LenetClassifier): CompactLenetClassifier {
  if (!classifierIsUsable(classifier)) {
    throw new Error('Classifier cannot be persisted because its shape is invalid.');
  }
  return {
    encoding: 'lenet-classifier-f32-v1',
    weights: encodeMatrix(classifier.weights),
    bias: encodeVector(classifier.bias),
    mean: encodeVector(classifier.mean),
    std: encodeVector(classifier.std),
    kernels: [...classifier.kernels],
    class_count: classifier.class_count,
    reject_label: classifier.reject_label,
  };
}

/** Restores both the new compact format and any earlier array-based state. */
export function restorePersistedClassifier(value: unknown): LenetClassifier | null {
  if (classifierIsUsable(value)) return value;
  if (!value || typeof value !== 'object') return null;
  const encoded = value as Partial<CompactLenetClassifier>;
  if (encoded.encoding !== 'lenet-classifier-f32-v1') return null;
  const weights = decodeMatrix(encoded.weights);
  const bias = decodeVector(encoded.bias);
  const mean = decodeVector(encoded.mean);
  const std = decodeVector(encoded.std);
  if (!weights || !bias || !mean || !std || !Array.isArray(encoded.kernels)) return null;
  const classifier: LenetClassifier = {
    weights,
    bias,
    mean,
    std,
    kernels: encoded.kernels as FixedKernelId[],
    class_count: Number(encoded.class_count),
    reject_label: Number(encoded.reject_label),
  };
  return classifierIsUsable(classifier) ? classifier : null;
}

/**
 * Keeps the in-memory classifier unchanged while shrinking only the SQLite
 * telemetry representation below the browser keepalive request limit.
 */
export function serializeFixedKernelActivityState(state: FixedKernelActivityState): unknown {
  const session = state.classifierSession;
  if (!session) return state;
  return {
    ...state,
    classifierSession: {
      ...session,
      classifier: encodeClassifier(session.classifier),
    },
  };
}
