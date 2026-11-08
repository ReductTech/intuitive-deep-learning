import type recordData from '../assets/precomputed/translation.json';
import {loadPrecomputed} from '../precomputed';
const record=await loadPrecomputed<typeof recordData>('translation');
export const SOURCE_VOCAB = ["<pad>","The","white","black","team","player","passes","moves","waits","now","here","again",".","is"] as const;

export const TARGET_VOCAB = ["<pad>","<bos>","<eos>","白衣队","黑衣队","白衣队员","黑衣队员","传球","移动","等待","现在","在这里","再次","。"] as const;

export const TRANSLATION_OUTPUT_CLASSES = TARGET_VOCAB.length;

export interface TranslationBatchExample {
  label: string;
  source: number[];
  sourceTokens: string[];
  sourceValidLength: number;
  teacherInput: number[];
  target: number[];
  targetTokens: string[];
}

const MAX_SOURCE_LENGTH = 6;

function makeTranslationExample(source: string[], target: string[]): TranslationBatchExample {
  const paddedSource = [...source, ...Array(Math.max(0, MAX_SOURCE_LENGTH - source.length)).fill('<pad>')];
  const targetWithEnd = [...target, '<eos>'];
  const teacher = ['<bos>', ...target];
  return {
    label: source.join(' '),
    source: paddedSource.map((token) => SOURCE_VOCAB.indexOf(token as typeof SOURCE_VOCAB[number])),
    sourceTokens: paddedSource,
    sourceValidLength: source.length,
    teacherInput: teacher.map((token) => TARGET_VOCAB.indexOf(token as typeof TARGET_VOCAB[number])),
    target: targetWithEnd.map((token) => TARGET_VOCAB.indexOf(token as typeof TARGET_VOCAB[number])),
    targetTokens: targetWithEnd,
  };
}

// Controlled campus-passing narration corpus: 45 training sentences and 6 held-out combinations.
// Exact order is fixed for reproducible seed-10404 full-batch training; B1 is the recurring example.
export const TRANSLATION_TRAINING_SET: TranslationBatchExample[] = [
  makeTranslationExample(["The","white","team","passes","now","."], ["白衣队","现在","传球","。"]),
  makeTranslationExample(["The","white","team","passes","."], ["白衣队","传球","。"]),
  makeTranslationExample(["The","white","team","passes","again","."], ["白衣队","再次","传球","。"]),
  makeTranslationExample(["The","white","team","moves","."], ["白衣队","移动","。"]),
  makeTranslationExample(["The","white","team","moves","now","."], ["白衣队","现在","移动","。"]),
  makeTranslationExample(["The","white","team","moves","here","."], ["白衣队","在这里","移动","。"]),
  makeTranslationExample(["The","white","team","moves","again","."], ["白衣队","再次","移动","。"]),
  makeTranslationExample(["The","white","team","waits","."], ["白衣队","等待","。"]),
  makeTranslationExample(["The","white","team","waits","now","."], ["白衣队","现在","等待","。"]),
  makeTranslationExample(["The","white","team","waits","here","."], ["白衣队","在这里","等待","。"]),
  makeTranslationExample(["The","black","team","passes","."], ["黑衣队","传球","。"]),
  makeTranslationExample(["The","black","team","passes","now","."], ["黑衣队","现在","传球","。"]),
  makeTranslationExample(["The","black","team","passes","here","."], ["黑衣队","在这里","传球","。"]),
  makeTranslationExample(["The","black","team","moves","."], ["黑衣队","移动","。"]),
  makeTranslationExample(["The","black","team","moves","now","."], ["黑衣队","现在","移动","。"]),
  makeTranslationExample(["The","black","team","moves","here","."], ["黑衣队","在这里","移动","。"]),
  makeTranslationExample(["The","black","team","moves","again","."], ["黑衣队","再次","移动","。"]),
  makeTranslationExample(["The","black","team","waits","."], ["黑衣队","等待","。"]),
  makeTranslationExample(["The","black","team","waits","now","."], ["黑衣队","现在","等待","。"]),
  makeTranslationExample(["The","black","team","waits","here","."], ["黑衣队","在这里","等待","。"]),
  makeTranslationExample(["The","black","team","waits","again","."], ["黑衣队","再次","等待","。"]),
  makeTranslationExample(["The","white","player","passes","."], ["白衣队员","传球","。"]),
  makeTranslationExample(["The","white","player","passes","now","."], ["白衣队员","现在","传球","。"]),
  makeTranslationExample(["The","white","player","passes","here","."], ["白衣队员","在这里","传球","。"]),
  makeTranslationExample(["The","white","player","passes","again","."], ["白衣队员","再次","传球","。"]),
  makeTranslationExample(["The","white","player","moves","."], ["白衣队员","移动","。"]),
  makeTranslationExample(["The","white","player","moves","here","."], ["白衣队员","在这里","移动","。"]),
  makeTranslationExample(["The","white","player","moves","again","."], ["白衣队员","再次","移动","。"]),
  makeTranslationExample(["The","white","player","waits","."], ["白衣队员","等待","。"]),
  makeTranslationExample(["The","white","player","waits","now","."], ["白衣队员","现在","等待","。"]),
  makeTranslationExample(["The","white","player","waits","here","."], ["白衣队员","在这里","等待","。"]),
  makeTranslationExample(["The","white","player","waits","again","."], ["白衣队员","再次","等待","。"]),
  makeTranslationExample(["The","black","player","passes","."], ["黑衣队员","传球","。"]),
  makeTranslationExample(["The","black","player","passes","now","."], ["黑衣队员","现在","传球","。"]),
  makeTranslationExample(["The","black","player","passes","here","."], ["黑衣队员","在这里","传球","。"]),
  makeTranslationExample(["The","black","player","passes","again","."], ["黑衣队员","再次","传球","。"]),
  makeTranslationExample(["The","black","player","moves","."], ["黑衣队员","移动","。"]),
  makeTranslationExample(["The","black","player","moves","here","."], ["黑衣队员","在这里","移动","。"]),
  makeTranslationExample(["The","black","player","moves","again","."], ["黑衣队员","再次","移动","。"]),
  makeTranslationExample(["The","black","player","waits","."], ["黑衣队员","等待","。"]),
  makeTranslationExample(["The","black","player","waits","now","."], ["黑衣队员","现在","等待","。"]),
  makeTranslationExample(["The","black","player","waits","again","."], ["黑衣队员","再次","等待","。"]),
  makeTranslationExample(["The","white","team","is","here","."], ["白衣队","在这里","。"]),
  makeTranslationExample(["The","black","team","is","here","."], ["黑衣队","在这里","。"]),
  makeTranslationExample(["The","white","player","is","here","."], ["白衣队员","在这里","。"]),
];
export const TRANSLATION_VALIDATION_SET: TranslationBatchExample[] = [
  makeTranslationExample(["The","black","team","passes","again","."], ["黑衣队","再次","传球","。"]),
  makeTranslationExample(["The","white","player","moves","now","."], ["白衣队员","现在","移动","。"]),
  makeTranslationExample(["The","black","player","waits","here","."], ["黑衣队员","在这里","等待","。"]),
  makeTranslationExample(["The","white","team","passes","here","."], ["白衣队","在这里","传球","。"]),
  makeTranslationExample(["The","white","team","waits","again","."], ["白衣队","再次","等待","。"]),
  makeTranslationExample(["The","black","player","moves","now","."], ["黑衣队员","现在","移动","。"]),
];
export const TRANSLATION_TRAINING_SIZE = TRANSLATION_TRAINING_SET.length;
export const TRANSLATION_TARGET_TOKEN_COUNT = TRANSLATION_TRAINING_SET.reduce((sum, example) => sum + example.target.length, 0);
export const TRANSLATION_VALIDATION_SIZE = TRANSLATION_VALIDATION_SET.length;
export const TRANSLATION_HELD_OUT = TRANSLATION_VALIDATION_SET[0];

export const TRANSLATION_VISIBLE_INDICES = [0, 2] as const;
export const TRANSLATION_BATCH = TRANSLATION_VISIBLE_INDICES.map((index) => TRANSLATION_TRAINING_SET[index]);

export interface TranslationTrainingState {
  epoch: number;
  parameters: number[];
  firstMoment: number[];
  secondMoment: number[];
  loss: number;
  accuracy: number;
  correctTokens: number;
  tokenCount: number;
  gradientNorm: number;
  attentionParameterDelta: number;
  lossHistory: number[];
  accuracyHistory: number[];
  attentionMatrices: number[][][];
  scoreMatrices: number[][][];
  predictions: string[][];
  greedyPredictions: string[][];
  greedyAttentionMatrices: number[][][];
  greedyScoreMatrices: number[][][];
  heldOutAccuracy: number;
  heldOutPrediction: string[];
  heldOutGreedyPrediction: string[];
  heldOutAttentionMatrix: number[][];
  heldOutScoreMatrix: number[][];
  validationAccuracy: number;
  validationPredictions: string[][];
  validationGreedyPredictions: string[][];
  validationAttentionMatrices: number[][][];
  validationScoreMatrices: number[][][];
  validationGreedyAttentionMatrices: number[][][];
  validationGreedyScoreMatrices: number[][][];
}

interface ParameterSpec {
  offset: number;
  rows: number;
  columns: number;
}

const EMBEDDING_SIZE = 3;
const HIDDEN_SIZE = 4;
const ATTENTION_SIZE = 3;
const DECODER_INPUT_SIZE = EMBEDDING_SIZE + HIDDEN_SIZE;
const OUTPUT_INPUT_SIZE = HIDDEN_SIZE * 2;
const LEARNING_RATE = 0.025;
export const TRANSLATION_GRADIENT_CLIP = 1.5;
const MAX_GREEDY_DECODE_STEPS = 6;

let parameterCursor = 0;
function parameterSpec(rows: number, columns: number): ParameterSpec {
  const spec = { offset: parameterCursor, rows, columns };
  parameterCursor += rows * columns;
  return spec;
}

function gruSpecs(inputSize: number) {
  return {
    updateInput: parameterSpec(HIDDEN_SIZE, inputSize),
    updateHidden: parameterSpec(HIDDEN_SIZE, HIDDEN_SIZE),
    updateBias: parameterSpec(HIDDEN_SIZE, 1),
    resetInput: parameterSpec(HIDDEN_SIZE, inputSize),
    resetHidden: parameterSpec(HIDDEN_SIZE, HIDDEN_SIZE),
    resetBias: parameterSpec(HIDDEN_SIZE, 1),
    candidateInput: parameterSpec(HIDDEN_SIZE, inputSize),
    candidateHidden: parameterSpec(HIDDEN_SIZE, HIDDEN_SIZE),
    candidateBias: parameterSpec(HIDDEN_SIZE, 1),
  };
}

const parameterLayout = {
  sourceEmbedding: parameterSpec(SOURCE_VOCAB.length, EMBEDDING_SIZE),
  targetEmbedding: parameterSpec(TARGET_VOCAB.length, EMBEDDING_SIZE),
  encoder: gruSpecs(EMBEDDING_SIZE),
  attentionQuery: parameterSpec(ATTENTION_SIZE, HIDDEN_SIZE),
  attentionKey: parameterSpec(ATTENTION_SIZE, HIDDEN_SIZE),
  attentionBias: parameterSpec(ATTENTION_SIZE, 1),
  attentionVector: parameterSpec(ATTENTION_SIZE, 1),
  decoder: gruSpecs(DECODER_INPUT_SIZE),
  outputWeight: parameterSpec(TARGET_VOCAB.length, OUTPUT_INPUT_SIZE),
  outputBias: parameterSpec(TARGET_VOCAB.length, 1),
  attentionValue: parameterSpec(HIDDEN_SIZE, HIDDEN_SIZE),
};

export const TRANSLATION_PARAMETER_COUNT = parameterCursor;

const attentionParameterSpecs = [
  parameterLayout.attentionQuery,
  parameterLayout.attentionKey,
  parameterLayout.attentionValue,
  parameterLayout.attentionBias,
  parameterLayout.attentionVector,
] as const;

class Scalar {
  data: number;
  grad = 0;
  private readonly previous: Scalar[];
  private readonly backwardOperation: () => void;

  constructor(data: number, previous: Scalar[] = [], backwardOperation: () => void = () => undefined) {
    this.data = data;
    this.previous = previous;
    this.backwardOperation = backwardOperation;
  }

  add(other: Scalar | number) {
    const right = scalar(other);
    const output = new Scalar(this.data + right.data, [this, right], () => {
      this.grad += output.grad;
      right.grad += output.grad;
    });
    return output;
  }

  multiply(other: Scalar | number) {
    const right = scalar(other);
    const output = new Scalar(this.data * right.data, [this, right], () => {
      this.grad += right.data * output.grad;
      right.grad += this.data * output.grad;
    });
    return output;
  }

  subtract(other: Scalar | number) {
    return this.add(scalar(other).multiply(-1));
  }

  divide(other: Scalar | number) {
    const right = scalar(other);
    const output = new Scalar(this.data / right.data, [this, right], () => {
      this.grad += output.grad / right.data;
      right.grad -= output.grad * this.data / (right.data * right.data);
    });
    return output;
  }

  tanh() {
    const value = Math.tanh(this.data);
    const output = new Scalar(value, [this], () => {
      this.grad += (1 - value * value) * output.grad;
    });
    return output;
  }

  sigmoid() {
    const value = 1 / (1 + Math.exp(-this.data));
    const output = new Scalar(value, [this], () => {
      this.grad += value * (1 - value) * output.grad;
    });
    return output;
  }

  exp() {
    const value = Math.exp(this.data);
    const output = new Scalar(value, [this], () => {
      this.grad += value * output.grad;
    });
    return output;
  }

  log() {
    const output = new Scalar(Math.log(this.data), [this], () => {
      this.grad += output.grad / this.data;
    });
    return output;
  }

  backward() {
    const ordered: Scalar[] = [];
    const visited = new Set<Scalar>();
    const visit = (value: Scalar) => {
      if (visited.has(value)) return;
      visited.add(value);
      value.previous.forEach(visit);
      ordered.push(value);
    };
    visit(this);
    this.grad = 1;
    ordered.reverse().forEach((value) => value.backwardOperation());
  }
}

function scalar(value: Scalar | number) {
  return value instanceof Scalar ? value : new Scalar(value);
}

function zeros(length: number) {
  return Array.from({ length }, () => new Scalar(0));
}

function matrix(parameters: Scalar[], spec: ParameterSpec) {
  return Array.from({ length: spec.rows }, (_, row) => (
    Array.from({ length: spec.columns }, (_, column) => (
      parameters[spec.offset + row * spec.columns + column]
    ))
  ));
}

function vector(parameters: Scalar[], spec: ParameterSpec) {
  return matrix(parameters, spec).map((row) => row[0]);
}

function embedding(parameters: Scalar[], spec: ParameterSpec, token: number) {
  return matrix(parameters, spec)[token];
}

function matVec(weight: Scalar[][], input: Scalar[], bias?: Scalar[]) {
  return weight.map((row, rowIndex) => row.reduce(
    (sum, item, column) => sum.add(item.multiply(input[column])),
    bias?.[rowIndex] ?? new Scalar(0),
  ));
}

function addVectors(left: Scalar[], right: Scalar[]) {
  return left.map((value, index) => value.add(right[index]));
}

function multiplyVectors(left: Scalar[], right: Scalar[]) {
  return left.map((value, index) => value.multiply(right[index]));
}

function dot(left: Scalar[], right: Scalar[]) {
  return left.reduce((sum, value, index) => sum.add(value.multiply(right[index])), new Scalar(0));
}

function softmaxScalars(values: Scalar[]) {
  const maximum = Math.max(...values.map((value) => value.data));
  const exponentials = values.map((value) => value.subtract(maximum).exp());
  const denominator = exponentials.reduce((sum, value) => sum.add(value), new Scalar(0));
  return exponentials.map((value) => value.divide(denominator));
}

function gruCellTrace(
  parameters: Scalar[],
  specs: ReturnType<typeof gruSpecs>,
  input: Scalar[],
  previous: Scalar[],
) {
  const update = addVectors(
    matVec(matrix(parameters, specs.updateInput), input, vector(parameters, specs.updateBias)),
    matVec(matrix(parameters, specs.updateHidden), previous),
  ).map((value) => value.sigmoid());
  const reset = addVectors(
    matVec(matrix(parameters, specs.resetInput), input, vector(parameters, specs.resetBias)),
    matVec(matrix(parameters, specs.resetHidden), previous),
  ).map((value) => value.sigmoid());
  const candidate = addVectors(
    matVec(matrix(parameters, specs.candidateInput), input, vector(parameters, specs.candidateBias)),
    matVec(matrix(parameters, specs.candidateHidden), multiplyVectors(reset, previous)),
  ).map((value) => value.tanh());
  const state = update.map((gate, index) => (
    gate.multiply(previous[index]).add(scalar(1).subtract(gate).multiply(candidate[index]))
  ));
  return { state, update, reset, candidate };
}

function gruCell(
  parameters: Scalar[],
  specs: ReturnType<typeof gruSpecs>,
  input: Scalar[],
  previous: Scalar[],
) {
  return gruCellTrace(parameters, specs, input, previous).state;
}

interface ForwardResult {
  loss: Scalar;
  accuracy: number;
  correct: number;
  targetCount: number;
  attentionMatrices: number[][][];
  scoreMatrices: number[][][];
  predictions: string[][];
}

export interface TranslationStepInspection {
  sourceEmbeddings: number[][];
  encoderStates: number[][];
  previousDecoderState: number[];
  decoderInputToken: string;
  decoderInputEmbedding: number[];
  projectedQuery: number[];
  projectedKeys: number[][];
  projectedValues: number[][];
  energyVectors: number[][];
  scores: number[];
  weights: number[];
  context: number[];
  decoderInput: number[];
  decoderUpdateGate: number[];
  decoderResetGate: number[];
  decoderCandidate: number[];
  decoderState: number[];
  outputInput: number[];
  logits: number[];
  probabilities: number[];
  topProbabilities: Array<{ token: string; probability: number }>;
  predicted: string;
  target: string;
  nll: number;
}

function forward(
  parameters: Scalar[],
  examples: readonly TranslationBatchExample[] = TRANSLATION_TRAINING_SET,
): ForwardResult {
  const attentionQuery = matrix(parameters, parameterLayout.attentionQuery);
  const attentionKey = matrix(parameters, parameterLayout.attentionKey);
  const attentionValue = matrix(parameters, parameterLayout.attentionValue);
  const attentionBias = vector(parameters, parameterLayout.attentionBias);
  const attentionVector = vector(parameters, parameterLayout.attentionVector);
  const outputWeight = matrix(parameters, parameterLayout.outputWeight);
  const outputBias = vector(parameters, parameterLayout.outputBias);
  let totalLoss = new Scalar(0);
  let correct = 0;
  let targetCount = 0;
  const attentionMatrices: number[][][] = [];
  const scoreMatrices: number[][][] = [];
  const predictions: string[][] = [];

  examples.forEach((example) => {
    let encoderHidden = zeros(HIDDEN_SIZE);
    const encoderStates: Scalar[][] = [];
    for (let sourceIndex = 0; sourceIndex < example.sourceValidLength; sourceIndex += 1) {
      const sourceEmbedding = embedding(
        parameters,
        parameterLayout.sourceEmbedding,
        example.source[sourceIndex],
      );
      encoderHidden = gruCell(parameters, parameterLayout.encoder, sourceEmbedding, encoderHidden);
      encoderStates.push(encoderHidden);
    }

    const projectedValues = encoderStates.map(state => matVec(attentionValue, state));
    let decoderHidden = encoderHidden;
    const exampleAttention: number[][] = [];
    const exampleScores: number[][] = [];
    const examplePredictions: string[] = [];
    example.target.forEach((targetToken, targetIndex) => {
      const projectedQuery = matVec(attentionQuery, decoderHidden);
      const scores = encoderStates.map((key) => {
        const projectedKey = matVec(attentionKey, key);
        const shared = projectedQuery.map((value, index) => (
          value.add(projectedKey[index]).add(attentionBias[index]).tanh()
        ));
        return dot(attentionVector, shared);
      });
      const weights = softmaxScalars(scores);
      const context = Array.from({ length: HIDDEN_SIZE }, (_, hiddenIndex) => (
        weights.reduce(
          (sum, weight, sourceIndex) => sum.add(weight.multiply(projectedValues[sourceIndex][hiddenIndex])),
          new Scalar(0),
        )
      ));
      const targetEmbedding = embedding(
        parameters,
        parameterLayout.targetEmbedding,
        example.teacherInput[targetIndex],
      );
      decoderHidden = gruCell(
        parameters,
        parameterLayout.decoder,
        [...targetEmbedding, ...context],
        decoderHidden,
      );
      const logits = matVec(outputWeight, [...decoderHidden, ...context], outputBias);
      const probabilities = softmaxScalars(logits);
      totalLoss = totalLoss.add(probabilities[targetToken].log().multiply(-1));
      const predicted = probabilities.reduce(
        (best, probability, index) => probability.data > probabilities[best].data ? index : best,
        0,
      );
      if (predicted === targetToken) correct += 1;
      targetCount += 1;
      examplePredictions.push(TARGET_VOCAB[predicted]);
      exampleAttention.push([
        ...weights.map((weight) => weight.data),
        ...Array(example.source.length - example.sourceValidLength).fill(0),
      ]);
      exampleScores.push([
        ...scores.map((score) => score.data),
        ...Array(example.source.length - example.sourceValidLength).fill(Number.NEGATIVE_INFINITY),
      ]);
    });
    attentionMatrices.push(exampleAttention);
    scoreMatrices.push(exampleScores);
    predictions.push(examplePredictions);
  });

  return {
    loss: totalLoss.divide(targetCount),
    accuracy: correct / targetCount,
    correct,
    targetCount,
    attentionMatrices,
    scoreMatrices,
    predictions,
  };
}

interface GreedyDecodeResult {
  predictions: string[][];
  attentionMatrices: number[][][];
  scoreMatrices: number[][][];
}

function greedyDecode(
  parameters: Scalar[],
  examples: readonly TranslationBatchExample[],
  maxSteps = MAX_GREEDY_DECODE_STEPS,
): GreedyDecodeResult {
  const attentionQuery = matrix(parameters, parameterLayout.attentionQuery);
  const attentionKey = matrix(parameters, parameterLayout.attentionKey);
  const attentionValue = matrix(parameters, parameterLayout.attentionValue);
  const attentionBias = vector(parameters, parameterLayout.attentionBias);
  const attentionVector = vector(parameters, parameterLayout.attentionVector);
  const outputWeight = matrix(parameters, parameterLayout.outputWeight);
  const outputBias = vector(parameters, parameterLayout.outputBias);
  const bosId = TARGET_VOCAB.indexOf('<bos>');
  const eosId = TARGET_VOCAB.indexOf('<eos>');
  const predictions: string[][] = [];
  const attentionMatrices: number[][][] = [];
  const scoreMatrices: number[][][] = [];

  examples.forEach((example) => {
    let encoderHidden = zeros(HIDDEN_SIZE);
    const encoderStates: Scalar[][] = [];
    for (let sourceIndex = 0; sourceIndex < example.sourceValidLength; sourceIndex += 1) {
      const sourceEmbedding = embedding(parameters, parameterLayout.sourceEmbedding, example.source[sourceIndex]);
      encoderHidden = gruCell(parameters, parameterLayout.encoder, sourceEmbedding, encoderHidden);
      encoderStates.push(encoderHidden);
    }

    const projectedValues = encoderStates.map(state => matVec(attentionValue, state));
    let decoderHidden = encoderHidden;
    let decoderInputToken = bosId;
    const examplePredictions: string[] = [];
    const exampleAttention: number[][] = [];
    const exampleScores: number[][] = [];
    for (let targetIndex = 0; targetIndex < maxSteps; targetIndex += 1) {
      const projectedQuery = matVec(attentionQuery, decoderHidden);
      const scores = encoderStates.map((key) => {
        const projectedKey = matVec(attentionKey, key);
        const shared = projectedQuery.map((value, index) => (
          value.add(projectedKey[index]).add(attentionBias[index]).tanh()
        ));
        return dot(attentionVector, shared);
      });
      const weights = softmaxScalars(scores);
      const context = Array.from({ length: HIDDEN_SIZE }, (_, hiddenIndex) => (
        weights.reduce(
          (sum, weight, sourceIndex) => sum.add(weight.multiply(projectedValues[sourceIndex][hiddenIndex])),
          new Scalar(0),
        )
      ));
      const targetEmbedding = embedding(parameters, parameterLayout.targetEmbedding, decoderInputToken);
      decoderHidden = gruCell(parameters, parameterLayout.decoder, [...targetEmbedding, ...context], decoderHidden);
      const logits = matVec(outputWeight, [...decoderHidden, ...context], outputBias);
      const probabilities = softmaxScalars(logits);
      const predicted = probabilities.reduce(
        (best, probability, index) => probability.data > probabilities[best].data ? index : best,
        0,
      );
      examplePredictions.push(TARGET_VOCAB[predicted]);
      exampleAttention.push([
        ...weights.map((weight) => weight.data),
        ...Array(example.source.length - example.sourceValidLength).fill(0),
      ]);
      exampleScores.push([
        ...scores.map((score) => score.data),
        ...Array(example.source.length - example.sourceValidLength).fill(Number.NEGATIVE_INFINITY),
      ]);
      decoderInputToken = predicted;
      if (predicted === eosId) break;
    }
    predictions.push(examplePredictions);
    attentionMatrices.push(exampleAttention);
    scoreMatrices.push(exampleScores);
  });

  return { predictions, attentionMatrices, scoreMatrices };
}

export function inspectTranslationStep(
  rawParameters: readonly number[],
  example: TranslationBatchExample,
  requestedRow: number,
): TranslationStepInspection {
  const parameters = rawParameters.map((value) => new Scalar(value));
  const attentionQuery = matrix(parameters, parameterLayout.attentionQuery);
  const attentionKey = matrix(parameters, parameterLayout.attentionKey);
  const attentionValue = matrix(parameters, parameterLayout.attentionValue);
  const attentionBias = vector(parameters, parameterLayout.attentionBias);
  const attentionVector = vector(parameters, parameterLayout.attentionVector);
  const outputWeight = matrix(parameters, parameterLayout.outputWeight);
  const outputBias = vector(parameters, parameterLayout.outputBias);
  const toNumbers = (items: Scalar[]) => items.map((item) => item.data);

  let encoderHidden = zeros(HIDDEN_SIZE);
  const sourceEmbeddings: number[][] = [];
  const encoderStates: Scalar[][] = [];
  for (let sourceIndex = 0; sourceIndex < example.sourceValidLength; sourceIndex += 1) {
    const sourceEmbedding = embedding(parameters, parameterLayout.sourceEmbedding, example.source[sourceIndex]);
    sourceEmbeddings.push(toNumbers(sourceEmbedding));
    encoderHidden = gruCell(parameters, parameterLayout.encoder, sourceEmbedding, encoderHidden);
    encoderStates.push(encoderHidden);
  }

  const row = Math.max(0, Math.min(requestedRow, example.target.length - 1));
  const projectedValues = encoderStates.map(state => matVec(attentionValue, state));
    let decoderHidden = encoderHidden;
  let snapshot: TranslationStepInspection | undefined;

  for (let targetIndex = 0; targetIndex <= row; targetIndex += 1) {
    const previousDecoderState = decoderHidden;
    const projectedQuery = matVec(attentionQuery, previousDecoderState);
    const projectedKeys = encoderStates.map((key) => matVec(attentionKey, key));
    const energyVectors = projectedKeys.map((projectedKey) => projectedQuery.map((value, index) => (
      value.add(projectedKey[index]).add(attentionBias[index]).tanh()
    )));
    const scores = energyVectors.map((energy) => dot(attentionVector, energy));
    const weights = softmaxScalars(scores);
    const context = Array.from({ length: HIDDEN_SIZE }, (_, hiddenIndex) => (
      weights.reduce(
        (sum, weight, sourceIndex) => sum.add(weight.multiply(projectedValues[sourceIndex][hiddenIndex])),
        new Scalar(0),
      )
    ));
    const inputTokenId = example.teacherInput[targetIndex];
    const decoderInputEmbedding = embedding(parameters, parameterLayout.targetEmbedding, inputTokenId);
    const decoderInput = [...decoderInputEmbedding, ...context];
    const decoderTrace = gruCellTrace(parameters, parameterLayout.decoder, decoderInput, previousDecoderState);
    decoderHidden = decoderTrace.state;
    const outputInput = [...decoderHidden, ...context];
    const logits = matVec(outputWeight, outputInput, outputBias);
    const probabilities = softmaxScalars(logits);
    const predictedIndex = probabilities.reduce(
      (best, probability, index) => probability.data > probabilities[best].data ? index : best,
      0,
    );
    if (targetIndex === row) {
      const numericProbabilities = toNumbers(probabilities);
      const targetProbability = numericProbabilities[example.target[targetIndex]];
      snapshot = {
        sourceEmbeddings,
        encoderStates: encoderStates.map(toNumbers),
        previousDecoderState: toNumbers(previousDecoderState),
        decoderInputToken: TARGET_VOCAB[inputTokenId],
        decoderInputEmbedding: toNumbers(decoderInputEmbedding),
        projectedQuery: toNumbers(projectedQuery),
        projectedKeys: projectedKeys.map(toNumbers),
        projectedValues: projectedValues.map(toNumbers),
        energyVectors: energyVectors.map(toNumbers),
        scores: toNumbers(scores),
        weights: toNumbers(weights),
        context: toNumbers(context),
        decoderInput: toNumbers(decoderInput),
        decoderUpdateGate: toNumbers(decoderTrace.update),
        decoderResetGate: toNumbers(decoderTrace.reset),
        decoderCandidate: toNumbers(decoderTrace.candidate),
        decoderState: toNumbers(decoderHidden),
        outputInput: toNumbers(outputInput),
        logits: toNumbers(logits),
        probabilities: numericProbabilities,
        topProbabilities: numericProbabilities
          .map((probability, index) => ({ token: TARGET_VOCAB[index], probability }))
          .sort((left, right) => right.probability - left.probability)
          .slice(0, 5),
        predicted: TARGET_VOCAB[predictedIndex],
        target: TARGET_VOCAB[example.target[targetIndex]],
        nll: -Math.log(Math.max(Number.EPSILON, targetProbability)),
      };
    }
  }

  if (!snapshot) throw new Error('Unable to inspect translation step.');
  return snapshot;
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomNormal(random: () => number) {
  const first = Math.max(Number.EPSILON, random());
  const second = Math.max(Number.EPSILON, random());
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
}

function fillSpec(parameters: number[], spec: ParameterSpec, scale: number, random: () => number) {
  for (let index = 0; index < spec.rows * spec.columns; index += 1) {
    parameters[spec.offset + index] = randomNormal(random) * scale;
  }
}

function initializeParameters(seed = 10404) {
  const random = seededRandom(seed);
  const parameters = Array(TRANSLATION_PARAMETER_COUNT).fill(0);
  fillSpec(parameters, parameterLayout.sourceEmbedding, .18, random);
  fillSpec(parameters, parameterLayout.targetEmbedding, .18, random);
  const fillGru = (specs: ReturnType<typeof gruSpecs>) => {
    fillSpec(parameters, specs.updateInput, .22, random);
    fillSpec(parameters, specs.updateHidden, .22, random);
    fillSpec(parameters, specs.resetInput, .22, random);
    fillSpec(parameters, specs.resetHidden, .22, random);
    fillSpec(parameters, specs.candidateInput, .22, random);
    fillSpec(parameters, specs.candidateHidden, .22, random);
  };
  fillGru(parameterLayout.encoder);
  fillSpec(parameters, parameterLayout.attentionQuery, .24, random);
  fillSpec(parameters, parameterLayout.attentionKey, .24, random);
  fillSpec(parameters, parameterLayout.attentionVector, .24, random);
  fillGru(parameterLayout.decoder);
  fillSpec(parameters, parameterLayout.outputWeight, .20, random);
  // Independent, trainable value projection; start near identity for stability.
  fillSpec(parameters, parameterLayout.attentionValue, .05, random);
  for (let i = 0; i < HIDDEN_SIZE; i += 1) parameters[parameterLayout.attentionValue.offset+i*HIDDEN_SIZE+i] += 1;
  return parameters;
}

function evaluate(parameters: number[]) {
  const result = forward(parameters.map((value) => new Scalar(value)), TRANSLATION_TRAINING_SET);
  const greedy = greedyDecode(parameters.map((value) => new Scalar(value)), TRANSLATION_TRAINING_SET);
  const validation = forward(parameters.map((value) => new Scalar(value)), TRANSLATION_VALIDATION_SET);
  const validationGreedy = greedyDecode(parameters.map((value) => new Scalar(value)), TRANSLATION_VALIDATION_SET);
  const validationExact = validationGreedy.predictions.map((prediction, index) => (
    prediction.join(' ') === TRANSLATION_VALIDATION_SET[index].targetTokens.join(' ')
  ));
  return {
    loss: result.loss.data,
    accuracy: result.accuracy,
    correctTokens: result.correct,
    tokenCount: result.targetCount,
    attentionMatrices: result.attentionMatrices,
    scoreMatrices: result.scoreMatrices,
    predictions: result.predictions,
    greedyPredictions: greedy.predictions,
    greedyAttentionMatrices: greedy.attentionMatrices,
    greedyScoreMatrices: greedy.scoreMatrices,
    heldOutAccuracy: validationExact[0] ? 1 : 0,
    heldOutPrediction: validation.predictions[0],
    heldOutGreedyPrediction: validationGreedy.predictions[0],
    heldOutAttentionMatrix: validation.attentionMatrices[0],
    heldOutScoreMatrix: validation.scoreMatrices[0],
    validationAccuracy: validationExact.filter(Boolean).length / Math.max(1, validationExact.length),
    validationPredictions: validation.predictions,
    validationGreedyPredictions: validationGreedy.predictions,
    validationAttentionMatrices: validation.attentionMatrices,
    validationScoreMatrices: validation.scoreMatrices,
    validationGreedyAttentionMatrices: validationGreedy.attentionMatrices,
    validationGreedyScoreMatrices: validationGreedy.scoreMatrices,
  };
}

function attentionDelta(parameters: number[], initial: number[]) {
  let squared = 0;
  attentionParameterSpecs.forEach((spec) => {
    for (let index = 0; index < spec.rows * spec.columns; index += 1) {
      const parameterIndex = spec.offset + index;
      squared += (parameters[parameterIndex] - initial[parameterIndex]) ** 2;
    }
  });
  return Math.sqrt(squared);
}

export function createTranslationTrainingState(seed = 10404): TranslationTrainingState { if(seed!==10404)throw new Error("该随机种子的演示缓存尚未准备好。");return structuredClone(record.frames[0]) as TranslationTrainingState; }

export function trainTranslationEpoch(
  state: TranslationTrainingState,
  learningRate = LEARNING_RATE,
): TranslationTrainingState { if(learningRate!==LEARNING_RATE)throw new Error("该学习率的演示缓存尚未准备好。");return structuredClone(record.frames[Math.min(TRANSLATION_MAX_EPOCHS,state.epoch+1)]) as TranslationTrainingState; }

export function runTranslationTraining(
  state: TranslationTrainingState,
  epochs: number,
  learningRate = LEARNING_RATE,
) { if(learningRate!==LEARNING_RATE)throw new Error("该学习率的演示缓存尚未准备好。");return structuredClone(record.frames[Math.min(TRANSLATION_MAX_EPOCHS,state.epoch+epochs)]) as TranslationTrainingState; }

export function isTranslationTrainingState(value: unknown): value is TranslationTrainingState {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<TranslationTrainingState>;
  return Number.isFinite(candidate.epoch)
    && Array.isArray(candidate.parameters)
    && candidate.parameters.length === TRANSLATION_PARAMETER_COUNT
    && Array.isArray(candidate.firstMoment)
    && candidate.firstMoment.length === TRANSLATION_PARAMETER_COUNT
    && Array.isArray(candidate.secondMoment)
    && candidate.secondMoment.length === TRANSLATION_PARAMETER_COUNT
    && Array.isArray(candidate.greedyPredictions)
    && candidate.greedyPredictions.length === TRANSLATION_TRAINING_SET.length
    && Array.isArray(candidate.greedyAttentionMatrices)
    && Array.isArray(candidate.greedyScoreMatrices)
    && Array.isArray(candidate.attentionMatrices)
    && candidate.attentionMatrices.length === TRANSLATION_TRAINING_SET.length
    && Array.isArray(candidate.heldOutGreedyPrediction)
    && Array.isArray(candidate.heldOutAttentionMatrix)
    && Array.isArray(candidate.heldOutScoreMatrix)
    && Array.isArray(candidate.validationGreedyPredictions)
    && candidate.validationGreedyPredictions.length === TRANSLATION_VALIDATION_SET.length
    && Array.isArray(candidate.validationAttentionMatrices)
    && Array.isArray(candidate.validationScoreMatrices)
    && Array.isArray(candidate.validationGreedyAttentionMatrices)
    && Array.isArray(candidate.validationGreedyScoreMatrices);
}


// The numerical engine above is preserved from the original course implementation.
// These adapters expose inference and JSON-safe snapshots; they never train on import.
export const TRANSLATION_MAX_EPOCHS = 150;
export const TRANSLATION_CHECKPOINT_EPOCHS = [0, 5, 20, 60, 120, 150] as const;
export const TRANSLATION_MODEL_DIMENSIONS = Object.freeze({
  embedding: EMBEDDING_SIZE, hidden: HIDDEN_SIZE, attention: ATTENTION_SIZE,
  decoderInput: DECODER_INPUT_SIZE, outputInput: OUTPUT_INPUT_SIZE,
  sourceLength: MAX_SOURCE_LENGTH, outputClasses: TRANSLATION_OUTPUT_CLASSES,
});

export interface TranslationTeacherForcedStep extends TranslationStepInspection {
  mode: 'teacher-forcing';
  epoch: number;
  row: number;
  /** Inputs already consumed before this step's attention is computed. */
  attentionPrefix: string[];
  /** Includes the current input, consumed after attention to update the decoder. */
  teacherPrefix: string[];
  targetProbability: number;
  paddedWeights: number[];
  paddedScores: number[];
}

/** ATT and vocabulary probabilities use the same parameters and teacher-forcing trajectory. */
export function inspectTranslationTeacherForcedStep(
  state: Pick<TranslationTrainingState, 'epoch' | 'parameters'>,
  example: TranslationBatchExample,
  row: number,
): TranslationTeacherForcedStep {
  if (!Number.isInteger(row) || row < 0 || row >= example.target.length) {
    throw new RangeError('The target row must refer to an existing teacher-forcing step.');
  }
  if (state.parameters.length !== TRANSLATION_PARAMETER_COUNT || !state.parameters.every(Number.isFinite)) {
    throw new RangeError(`Expected all ${TRANSLATION_PARAMETER_COUNT} finite model parameters.`);
  }
  const inspection = inspectTranslationStep(state.parameters, example, row);
  const padding = example.source.length - example.sourceValidLength;
  return {
    ...inspection,
    mode: 'teacher-forcing', epoch: state.epoch, row,
    attentionPrefix: example.teacherInput.slice(0, row).map((id) => TARGET_VOCAB[id]),
    teacherPrefix: example.teacherInput.slice(0, row + 1).map((id) => TARGET_VOCAB[id]),
    targetProbability: inspection.probabilities[example.target[row]],
    paddedWeights: [...inspection.weights, ...Array(padding).fill(0)],
    paddedScores: [...inspection.scores, ...Array(padding).fill(Number.NEGATIVE_INFINITY)],
  };
}

/** A resumable checkpoint includes Adam moments. Parameter-only C19 snapshots are not resumable. */
export interface TranslationCheckpoint {
  version: 1;
  model: 'attention-gru-campus-496-kv-v1';
  epoch: number;
  parameters: number[];
  firstMoment: number[];
  secondMoment: number[];
  gradientNorm: number;
  attentionParameterDelta: number;
  lossHistory: number[];
  accuracyHistory: number[];
}

export function createTranslationCheckpoint(state: TranslationTrainingState): TranslationCheckpoint {
  return {
    version: 1, model: 'attention-gru-campus-496-kv-v1', epoch: state.epoch,
    parameters: [...state.parameters], firstMoment: [...state.firstMoment], secondMoment: [...state.secondMoment],
    gradientNorm: state.gradientNorm, attentionParameterDelta: state.attentionParameterDelta,
    lossHistory: [...state.lossHistory], accuracyHistory: [...state.accuracyHistory],
  };
}

export function serializeTranslationCheckpoint(state: TranslationTrainingState): string {
  // Do not serialize full scoreMatrices: JSON changes masked -Infinity to null.
  return JSON.stringify(createTranslationCheckpoint(state));
}

function isFiniteNumberArray(value: unknown, length: number): value is number[] {
  return Array.isArray(value) && value.length === length
    && value.every((item) => typeof item === 'number' && Number.isFinite(item));
}

/** Restores by forward evaluation only; no gradient update and no missing-epoch replay. */
export function restoreTranslationCheckpoint(value: unknown): TranslationTrainingState | null {
  let raw = value;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { return null; }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const saved = raw as Partial<TranslationCheckpoint>;
  if (saved.version !== 1 || saved.model !== 'attention-gru-campus-496-kv-v1'
    || typeof saved.epoch !== 'number' || !Number.isInteger(saved.epoch)
    || saved.epoch < 0 || saved.epoch > TRANSLATION_MAX_EPOCHS) return null;
  if (!isFiniteNumberArray(saved.parameters, TRANSLATION_PARAMETER_COUNT)
    || !isFiniteNumberArray(saved.firstMoment, TRANSLATION_PARAMETER_COUNT)
    || !isFiniteNumberArray(saved.secondMoment, TRANSLATION_PARAMETER_COUNT)
    || saved.secondMoment.some((item) => item < 0)
    || !isFiniteNumberArray(saved.lossHistory, saved.epoch + 1)
    || saved.lossHistory.some((item) => item < 0)
    || !isFiniteNumberArray(saved.accuracyHistory, saved.epoch + 1)
    || saved.accuracyHistory.some((item) => item < 0 || item > 1)
    || typeof saved.gradientNorm !== 'number' || !Number.isFinite(saved.gradientNorm) || saved.gradientNorm < 0
    || typeof saved.attentionParameterDelta !== 'number' || !Number.isFinite(saved.attentionParameterDelta)
    || saved.attentionParameterDelta < 0) return null;
  const parameters = [...saved.parameters];
  const metrics = evaluate(parameters);
  // Reject inconsistent snapshots instead of showing curves unrelated to their model.
  if (!Number.isFinite(metrics.loss)
    || Math.abs(metrics.loss - saved.lossHistory[saved.epoch]) > 1e-8
    || Math.abs(metrics.accuracy - saved.accuracyHistory[saved.epoch]) > 1e-8) return null;
  return {
    ...metrics, epoch: saved.epoch, parameters,
    firstMoment: [...saved.firstMoment], secondMoment: [...saved.secondMoment],
    gradientNorm: saved.gradientNorm, attentionParameterDelta: saved.attentionParameterDelta,
    lossHistory: [...saved.lossHistory], accuracyHistory: [...saved.accuracyHistory],
  };
}

// Actual campus-corpus checkpoint; the 496 parameters were trained on the exact corpus above.
// Seed 10404, 45 distinct training examples, full-batch Adam, epoch 120. Independent of the live C24/C25 experiment.
export const TRANSLATION_STRUCTURE_EPOCH = 120;

export const TRANSLATION_STRUCTURE_PARAMETERS: readonly number[] = Object.freeze([
  -0.41363316475044337, 0.21793884337716085, 0.1935865327159507, -0.4054176512587096, -0.2735769535474736, 0.5947311643747347,
  -1.3717438791558059, 1.294243199039867, 0.36650227162091564, -0.010350405042709334, -1.1297822538690325, -0.6519613994636841,
  -1.1935503174346085, 0.2693704559745266, -1.4914743631125047, -0.30281630865584963, 0.8869577250893049, 0.9789728383279613,
  0.7305729447812399, 0.037547803374679965, 2.5121519284096334, -1.0517242129342002, -0.9197964586389854, 0.1100575829259552,
  1.6158272294259637, -0.04644064152760467, 0.5826668708411702, 2.2501962123295463, 1.0210104724825435, -0.6601520727520835,
  0.09217383242242345, -0.4303039100901257, -0.18291849199336202, -0.49020650164529306, 0.5011740655258696, 1.3077132694301818,
  1.0188027461221143, -1.6051230189752428, -1.0859759433267189, -0.20410175829795055, -0.4600824161887266, -1.176500133303638,
  0.1449739273530857, -0.0720978024349882, -0.08674507804146017, 1.4522053025445698, -1.1457609180811617, -1.2895138889530744,
  -0.2642972337974081, 0.2200385995815614, 0.21870184521715133, 1.0268939493246583, 0.9961171919260304, 0.8732826832185945,
  0.8830362515768404, 1.4038415904346064, 0.8041670414218091, 0.7057840838670029, 1.0014670964143673, 0.6722984406944875,
  -0.17834388839854637, 1.5200397276836517, 1.3056865154725639, -1.7651530260329917, -2.1607976391431425, -0.7668447937275238,
  -1.132968518891113, -1.7950807615007096, -0.9755544199508412, -1.448342933431902, -1.7544377168331855, -1.0379556566997123,
  -0.7151175275920406, 0.6456596662971983, -0.9084506245228735, -0.5262463622743581, 0.051200914110130294, -0.4659924167063357,
  0.1260993370514912, 0.7147621864639937, -1.0689710877181324, -1.057818654983039, 0.6896439999402352, 1.3410775788461338,
  0.2490913029016184, -0.8207551139555329, -1.1600685327800722, -0.4256621961004919, 0.4388727588978859, -0.3321409119049126,
  -0.14854434483310278, -0.9269054293213619, -0.1360320048120956, 0.31259623514219986, -2.600707628288998, -0.7729476555089314,
  0.599905663194122, -0.6717613231597335, -1.4196162229575804, -1.8613678698472729, 0.3991220453656573, -1.0538692917213455,
  0.7705920412991828, -2.023306959091424, 1.1547912905684212, -0.8474426289649039, -1.444742678797995, -1.6540903854785713,
  1.2333004859011478, 0.23925563132558025, 0.04936776314733937, 0.01746435218815045, -1.2203916565751158, -1.1354776147967305,
  -1.4606079700645616, 0.25199577434633474, 0.7526374484272166, 0.1511286944527542, -2.2623297118699135, -0.6624811625056064,
  -1.6381629729498002, -1.9148178399395261, -0.507549308631298, -0.39781040196829537, -0.9678886579444961, -1.763976460457211,
  -1.2628679151512368, 0.016468617483336768, -1.336752318825801, -0.6797817815563382, -0.25967923013582783, -0.49347061720207713,
  0.5469114500785448, 0.261151736344465, -0.3703116929271166, -1.0932544055936129, -1.5837860594641162, -0.5970486822626228,
  -0.01594218847371782, -0.5401681750349557, -0.06263521102921918, 0.02742549712369103, -0.7674011071821576, 0.4157764588343623,
  -0.2113821753470433, -0.07099087737711729, -0.35814390979768024, 0.48667375814743413, 1.4974887856051438, 0.07869247467907667,
  0.7760827345378988, 0.6820807166302828, -1.5444588598424072, 0.012061217293338028, 0.9088827650327078, -0.5224236053684815,
  -2.06923933279943, -0.6840820463960358, -0.015046705064799229, 0.8756010102953813, 0.5662976655686458, -0.23666267388048964,
  0.5828052263092068, -0.09046190646524513, 0.08589742174926658, 0.49161397566032666, 0.21436992951066952, 1.1474494153661636,
  0.07598693144624795, 0.5752507741553605, -0.04388117222266328, -0.06930084345859121, -1.5195905652082855, 0.7712504541769684,
  -0.25447373530657164, 0.8810938919757694, -0.24118429508427325, 0.6460173359886305, 0.01039653265262544, 0.6846395106350777,
  0.7078299192149098, -0.609025180954242, 0.27673986860809247, -2.241253180509879, 1.0287505160266242, 0.02382021170822115,
  -2.689571500017167, -1.3536707289431278, -1.3216382641217794, 0.549918723672857, 1.1909446686338185, 2.0371359227823804,
  -1.9592196814426044, -1.346649676906747, 0.7646690550172021, 0.9158202300854124, -0.4884096306642374, -1.7832064079900425,
  0.6433819418014206, -1.2201543552340879, 1.4392871112251264, 0.8020351784350104, 0.3127023007936324, 0.7128247250079328,
  0.029381144174419727, -0.21652681185363173, 0.8753115602662422, 2.21496512784786, -2.6196601737303693, 2.591601945788745,
  0.781014640500564, 0.764413905887223, 0.3828588828735731, 0.9613785218507876, -1.1818468323357063, -0.554620528106434,
  -1.048172244142468, 1.2360730450067199, 1.0013911129930402, 0.611450452811373, 0.3855137528572892, -0.4023819924605426,
  -0.0882118059018994, -0.5319946366794716, 0.057867293186367345, 0.0849615650988765, -0.23536877291357214, 0.8299259177909609,
  -1.0290560439065248, -0.39469101582421257, -1.6020544518499538, -0.10968105811572039, 0.7299566578827967, 0.8001782815937301,
  1.104196562047111, -1.564347882047249, -0.5110965283464586, -1.622710709446193, -0.21506096484819792, 0.010254187187609856,
  0.6066720187898003, 0.6678494937101671, 0.6247848434175765, 0.9025325723349835, 0.7776853987365334, 0.75389464972501,
  0.44119253578240203, -0.5699102890708793, -0.9120982681327325, 0.700125091597041, 0.9486836953051686, -0.7162540534965792,
  -0.054331027359338056, 0.7727044353678063, -0.5626119605824168, -0.40656696132073455, -1.1768348532451767, -1.256570367556973,
  -0.5495687520834154, -0.4407124758404389, -0.01672336806502855, -0.736587103573383, 1.1213683552559364, 0.9644278858207941,
  1.2510241211723734, 0.16114789841059857, 1.9757662899948345, 0.668230967545935, 1.0374099497935583, 0.10259996068011037,
  -0.2639433930628286, 0.24071620153118609, -0.42385017610305836, -0.5312457954975911, -0.44824422483949095, -0.16590656469435622,
  0.8528332693756542, 0.029864129853297897, 0.6837994739223612, -0.4767539734404344, -0.8891841022557763, -0.48143048836218266,
  -1.7764443761958997, 0.4581115649644864, -0.0666183930231552, -0.5619243013193899, 0.04878861394878137, -0.0945260750510837,
  0.03546463357287064, -0.5581913344417012, -0.7326464802570027, 0.5411155766347081, -0.8079348844257376, 0.3969655420068252,
  -0.037245084631952266, 0.6458476802014993, 1.0178104475289618, -0.6860569141322793, -1.3082265038084877, -0.6708276961041275,
  -0.885536446103498, -0.16487689758612, 0.5875831195039101, 0.3016447079486432, 0.7083907986557854, 0.49449401229104123,
  1.4542730918259084, 0.17416614438424552, -0.10050464583704721, 0.5361274146872567, -0.19687214983558063, 0.1748173234761571,
  -0.11405508907581534, 1.3587880471823637, 1.416925496203264, -0.9185022688961769, 0.35969133771668865, 0.2630198497280133,
  -0.5069870283470646, 0.05960899821041888, 0.6287991944357647, -2.130434289970562, -1.1708504811271565, 0.21362024575425245,
  -0.29059172913284564, 0.06799912495046395, 0.03273992819282096, -0.05720414093543916, 1.4065251419045839, 1.688373662404534,
  0.1549349663872944, -0.20509279369591563, 0.22317600280585387, -0.06464328464126096, 2.0120235988665764, 0.27002061739557964,
  1.2317644356077901, 0.9152931390511021, 0.35167230196969596, 1.0653476608120425, 1.0850226465863728, 1.1624413279034091,
  -0.5278693668166057, -0.4131401416441337, 0.4106226816197834, -0.02971176978138582, -0.5080036828034826, -0.5683941613995956,
  0.34556142721947586, -0.3732968525344469, -0.44539615909786534, -0.2267261193159837, -0.2901719446855451, -0.17513227899902206,
  0.4680868490950156, 0.3163542924856597, 0.34592059451368123, 0.9160387095805896, 0.48574078001901777, -1.3598316355280682,
  -0.34475561040266395, -1.1194454776015417, 0.592632613377842, 0.39093249398878716, 0.2864338525716795, 0.6412383774825768,
  0.827877625292145, -0.9504582879396196, -1.008093251832576, -1.1202086182153452, -1.5816560850634298, -1.9365725059302488,
  -1.4139745814582712, 1.3445405209315162, -0.3020722049517305, 0.6828097443238319, -0.09926552310525942, 0.43303699807858353,
  1.1222373538980133, 0.5861110222582979, 1.123224992994749, -0.48416484574741514, -2.2696471526704713, -1.0243030420996466,
  -0.8002846738399183, 0.8574879613809206, 1.2705578453415114, 1.0350149140228682, 1.5030206708444416, -1.0911959885416276,
  -2.254958576164823, 0.7137544690408109, 1.4036231986083088, -2.2652436173512025, 0.8565863158611656, 1.1457794657501659,
  1.4389540868217745, -0.9716710972767111, 0.829280843641227, -1.891011963794247, -2.5611949340644298, 0.3797720371599416,
  2.2707016594261087, 1.4301574772391297, 2.1359375772481313, -1.9730913781552735, 0.9244310080997984, 0.9445691665129984,
  -0.3750177009042812, -0.4911064284876797, 0.5304438163162862, 1.391568141157868, -1.8498399920343072, -0.6352274501525513,
  2.7140751287841387, 0.05138390102206109, -0.8840338967971872, 0.45848586866426566, -1.9986637972995376, 1.7980316110796202,
  -2.367735891325462, -0.716442957423027, -1.8922917991498525, 0.20449686683823728, -0.7139670187502285, -0.2120505359747687,
  0.5713674491396409, 1.2704270070705415, -1.6451470383804134, -1.883846633696575, 1.0636131045507082, 0.4493505636594865,
  1.807148848377733, 0.0529555900926277, 1.5559014970752867, 1.5447464412780432, -1.4286411966631771, 1.05335724697912,
  2.2861500161361406, -0.769947262226788, 2.2496208815202254, -1.9284768213065304, 1.1963173899194421, 1.0792403001993183,
  -0.8672021460745256, 0.9914827643857737, -1.3468867903304345, 0.10548547909890225, 1.4708586109440365, 0.4444287629866014,
  1.6163063902072932, 1.8044774246910413, -1.9467045778618746, 1.9978674409919446, -0.718644115732555, 0.0753938619319511,
  -1.648725441089013, 0.11369285349887788, -1.4178317843991315, -1.7286534438071877, 1.1957618092530353, -1.7300393499744169,
  -0.2604070793147131, 0.6573338811282743, 0.5605168073436749, 0.9407378574312869, -0.6358112762599661, -0.6494470265330355,
  0.4797964843767929, -0.8944050246817447, -0.660552678744541, -0.07085414113496287, 0.1723865947720806, 0.0630910706223528,
  -0.45827821080337267, -0.0286095823087175, -0.2876747029139244, -1.2444280398902057, 0.2488849332175327, 0.505865414333326,
  3.0778019487707233, -0.28155797596821047, -1.1985211346713653, -0.3184705966361946, -0.4484781256094326, 2.5753009333699053,
  0.6798585236047546, 1.494293408661604, 1.3261723140569779, 1.1872111095410052, 3.2587990761126724, -0.8511564219774107,
  0.15003712246096132, -0.03980507568309887, -0.26653766781494515, 2.8259288921462766,
]);

const structureInspectionCache = new Map<number, TranslationStepInspection>();

/** Fixed B1 snapshot for C19. Computes at most five cached forward passes, never trains. */
export function inspectStructureTranslationStep(row = 1): TranslationStepInspection {
  const example = TRANSLATION_TRAINING_SET[0];
  if (!Number.isInteger(row) || row < 0 || row >= example.target.length) {
    throw new RangeError('The structure target row must be between 0 and 4.');
  }
  let inspection = structureInspectionCache.get(row);
  if (!inspection) {
    inspection = inspectTranslationStep(TRANSLATION_STRUCTURE_PARAMETERS, example, row);
    structureInspectionCache.set(row, inspection);
  }
  return inspection;
}


export interface TranslationParameterGroup {
  readonly id: string;
  readonly label: string;
  /** 0 embedding, 1 encoder, 2 attention, 3 context (no parameters), 4 decoder, 5 output. */
  readonly layer: 0 | 1 | 2 | 3 | 4 | 5;
  readonly rows: number;
  readonly columns: number;
  readonly values: readonly (readonly number[])[];
}

/** Read-only copies of all learned tensors, using the same layout as forward/training. */
export function getTranslationParameterGroups(
  parameters: readonly number[] = TRANSLATION_STRUCTURE_PARAMETERS,
): readonly TranslationParameterGroup[] {
  if (parameters.length !== TRANSLATION_PARAMETER_COUNT || !Array.from(parameters).every(Number.isFinite)) {
    throw new RangeError(`Expected all ${TRANSLATION_PARAMETER_COUNT} finite translation parameters.`);
  }
  const groups: TranslationParameterGroup[] = [];
  const add = (id: string, label: string, layer: TranslationParameterGroup['layer'], spec: ParameterSpec) => {
    const values = Array.from({ length: spec.rows }, (_, row) => Object.freeze(
      parameters.slice(spec.offset + row * spec.columns, spec.offset + (row + 1) * spec.columns),
    ));
    groups.push(Object.freeze({ id, label, layer, rows: spec.rows, columns: spec.columns, values: Object.freeze(values) }));
  };
  const gruLabels: Record<keyof ReturnType<typeof gruSpecs>, string> = {
    updateInput: '保留门 · 输入权重', updateHidden: '保留门 · 状态权重', updateBias: '保留门 · 偏置',
    resetInput: '重置门 · 输入权重', resetHidden: '重置门 · 状态权重', resetBias: '重置门 · 偏置',
    candidateInput: '候选状态 · 输入权重', candidateHidden: '候选状态 · 状态权重', candidateBias: '候选状态 · 偏置',
  };
  const addGru = (name: 'encoder' | 'decoder', label: string, layer: 1 | 4) => {
    const specs = parameterLayout[name];
    for (const key of Object.keys(specs) as Array<keyof typeof specs>) {
      add(name + '.' + key, label + ' · ' + gruLabels[key], layer, specs[key]);
    }
  };
  add('sourceEmbedding', '源词向量表 Es', 0, parameterLayout.sourceEmbedding);
  add('targetEmbedding', '目标词向量表 Et', 0, parameterLayout.targetEmbedding);
  addGru('encoder', '编码器', 1);
  add('attentionValue', 'Value · 投影权重', 2, parameterLayout.attentionValue);
  add('attentionQuery', '注意力 Wq', 2, parameterLayout.attentionQuery);
  add('attentionKey', '注意力 Wk', 2, parameterLayout.attentionKey);
  add('attentionBias', '注意力偏置 b', 2, parameterLayout.attentionBias);
  add('attentionVector', '评分向量 v', 2, parameterLayout.attentionVector);
  addGru('decoder', '解码器', 4);
  add('outputWeight', '词表头 Wo', 5, parameterLayout.outputWeight);
  add('outputBias', '词表头偏置 bo', 5, parameterLayout.outputBias);
  return Object.freeze(groups);
}
