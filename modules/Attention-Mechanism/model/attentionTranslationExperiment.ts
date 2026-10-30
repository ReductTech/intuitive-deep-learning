export const SOURCE_VOCAB = [
  '<pad>', 'I', 'am', 'home', '.', 'we', 'are', 'here', 'love', 'deep', 'learning',
  'Go', 'go', 'to', 'the', 'bank', 'school', 'store', 'The', 'is', 'at',
] as const;

export const TARGET_VOCAB = [
  '<pad>', '<bos>', '<eos>', '我', '我们', '到家', '了', '。', '在', '这里', '热爱', '深度学习',
  '去', '银行', '学校', '商店', '回', '家',
] as const;

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

const originalTrainingExamples: TranslationBatchExample[] = [
  makeTranslationExample(['I', 'am', 'home', '.'], ['我', '到家', '了', '。']),
  makeTranslationExample(['we', 'are', 'home', '.'], ['我们', '到家', '了', '。']),
  makeTranslationExample(['I', 'am', 'here', '.'], ['我', '在', '这里', '。']),
  makeTranslationExample(['we', 'are', 'here', '.'], ['我们', '在', '这里', '。']),
  makeTranslationExample(['I', 'love', 'deep', 'learning', '.'], ['我', '热爱', '深度学习', '。']),
  makeTranslationExample(['we', 'love', 'deep', 'learning', '.'], ['我们', '热爱', '深度学习', '。']),
  makeTranslationExample(['Go', 'home', '.'], ['回', '家', '。']),
  makeTranslationExample(['Go', 'to', 'bank', '.'], ['去', '银行', '。']),
  makeTranslationExample(['Go', 'to', 'school', '.'], ['去', '学校', '。']),
  makeTranslationExample(['Go', 'to', 'store', '.'], ['去', '商店', '。']),
  makeTranslationExample(['Go', 'to', 'the', 'school', '.'], ['去', '学校', '。']),
  makeTranslationExample(['Go', 'to', 'the', 'store', '.'], ['去', '商店', '。']),
  makeTranslationExample(['I', 'go', 'home', '.'], ['我', '回', '家', '。']),
  makeTranslationExample(['we', 'go', 'home', '.'], ['我们', '回', '家', '。']),
  makeTranslationExample(['I', 'go', 'to', 'bank', '.'], ['我', '去', '银行', '。']),
  makeTranslationExample(['I', 'go', 'to', 'school', '.'], ['我', '去', '学校', '。']),
  makeTranslationExample(['I', 'go', 'to', 'store', '.'], ['我', '去', '商店', '。']),
  makeTranslationExample(['I', 'go', 'to', 'the', 'bank', '.'], ['我', '去', '银行', '。']),
  makeTranslationExample(['I', 'go', 'to', 'the', 'school', '.'], ['我', '去', '学校', '。']),
  makeTranslationExample(['we', 'go', 'to', 'bank', '.'], ['我们', '去', '银行', '。']),
  makeTranslationExample(['we', 'go', 'to', 'store', '.'], ['我们', '去', '商店', '。']),
  makeTranslationExample(['we', 'go', 'to', 'the', 'bank', '.'], ['我们', '去', '银行', '。']),
  makeTranslationExample(['we', 'go', 'to', 'the', 'school', '.'], ['我们', '去', '学校', '。']),
  makeTranslationExample(['we', 'go', 'to', 'the', 'store', '.'], ['我们', '去', '商店', '。']),
  makeTranslationExample(['The', 'bank', 'is', 'here', '.'], ['银行', '在', '这里', '。']),
  makeTranslationExample(['The', 'school', 'is', 'here', '.'], ['学校', '在', '这里', '。']),
  makeTranslationExample(['The', 'store', 'is', 'here', '.'], ['商店', '在', '这里', '。']),
  makeTranslationExample(['I', 'am', 'at', 'the', 'bank', '.'], ['我', '在', '银行', '。']),
  makeTranslationExample(['I', 'am', 'at', 'the', 'school', '.'], ['我', '在', '学校', '。']),
  makeTranslationExample(['I', 'am', 'at', 'school', '.'], ['我', '在', '学校', '。']),
  makeTranslationExample(['I', 'am', 'at', 'the', 'store', '.'], ['我', '在', '商店', '。']),
  makeTranslationExample(['we', 'are', 'at', 'the', 'bank', '.'], ['我们', '在', '银行', '。']),
  makeTranslationExample(['we', 'are', 'at', 'the', 'school', '.'], ['我们', '在', '学校', '。']),
  makeTranslationExample(['we', 'are', 'at', 'the', 'store', '.'], ['我们', '在', '商店', '。']),
];

// Small-vocabulary expansion: grammatical templates, not repeated training rows.
// Existing B1/B2/... order and the first three validation IDs remain stable.
export const TRANSLATION_VALIDATION_SET: TranslationBatchExample[] = [
  makeTranslationExample(['we', 'are', 'at', 'school', '.'], ['我们', '在', '学校', '。']),
  makeTranslationExample(['I', 'go', 'to', 'the', 'store', '.'], ['我', '去', '商店', '。']),
  makeTranslationExample(['we', 'go', 'to', 'school', '.'], ['我们', '去', '学校', '。']),
  makeTranslationExample(['I', 'am', 'at', 'home', '.'], ['我', '在', '家', '。']),
  makeTranslationExample(['we', 'go', 'here', '.'], ['我们', '去', '这里', '。']),
  makeTranslationExample(['we', 'love', 'school', '.'], ['我们', '热爱', '学校', '。']),
];
const additionalExamples: TranslationBatchExample[] = [
  makeTranslationExample(['Go', 'to', 'the', 'bank', '.'], ['去', '银行', '。']),
  makeTranslationExample(['Go', 'here', '.'], ['去', '这里', '。']),
];
for (const [subject, copula, translatedSubject] of [['I','am','我'], ['we','are','我们']]) {
  additionalExamples.push(makeTranslationExample([subject,'love','the','store','.'], [translatedSubject,'热爱','商店','。']));
  additionalExamples.push(
    makeTranslationExample([subject,copula,'at','home','.'], [translatedSubject,'在','家','。']),
    makeTranslationExample([subject,'go','here','.'], [translatedSubject,'去','这里','。']),
    makeTranslationExample([subject,'love','school','.'], [translatedSubject,'热爱','学校','。']),
    makeTranslationExample([subject,'love','the','school','.'], [translatedSubject,'热爱','学校','。']),
  );
}
for (const [place, translatedPlace] of [['bank','银行'], ['store','商店']]) {
  additionalExamples.push(makeTranslationExample(['The',place,'is','at','school','.'], [translatedPlace,'在','学校','。']));
}
const heldOutLabels = new Set(TRANSLATION_VALIDATION_SET.map(example => example.label));
const seenLabels = new Set<string>();
export const TRANSLATION_TRAINING_SET: TranslationBatchExample[] = [...originalTrainingExamples, ...additionalExamples].filter(example => {
  if (heldOutLabels.has(example.label) || seenLabels.has(example.label)) return false;
  seenLabels.add(example.label);
  return true;
});
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

export function createTranslationTrainingState(seed = 10404): TranslationTrainingState {
  const parameters = initializeParameters(seed);
  const metrics = evaluate(parameters);
  return {
    epoch: 0,
    parameters,
    firstMoment: Array(parameters.length).fill(0),
    secondMoment: Array(parameters.length).fill(0),
    loss: metrics.loss,
    accuracy: metrics.accuracy,
    correctTokens: metrics.correctTokens,
    tokenCount: metrics.tokenCount,
    gradientNorm: 0,
    attentionParameterDelta: 0,
    lossHistory: [metrics.loss],
    accuracyHistory: [metrics.accuracy],
    attentionMatrices: metrics.attentionMatrices,
    scoreMatrices: metrics.scoreMatrices,
    predictions: metrics.predictions,
    greedyPredictions: metrics.greedyPredictions,
    greedyAttentionMatrices: metrics.greedyAttentionMatrices,
    greedyScoreMatrices: metrics.greedyScoreMatrices,
    heldOutAccuracy: metrics.heldOutAccuracy,
    heldOutPrediction: metrics.heldOutPrediction,
    heldOutGreedyPrediction: metrics.heldOutGreedyPrediction,
    heldOutAttentionMatrix: metrics.heldOutAttentionMatrix,
    heldOutScoreMatrix: metrics.heldOutScoreMatrix,
    validationAccuracy: metrics.validationAccuracy,
    validationPredictions: metrics.validationPredictions,
    validationGreedyPredictions: metrics.validationGreedyPredictions,
    validationAttentionMatrices: metrics.validationAttentionMatrices,
    validationScoreMatrices: metrics.validationScoreMatrices,
    validationGreedyAttentionMatrices: metrics.validationGreedyAttentionMatrices,
    validationGreedyScoreMatrices: metrics.validationGreedyScoreMatrices,
  };
}

export function trainTranslationEpoch(
  state: TranslationTrainingState,
  learningRate = LEARNING_RATE,
): TranslationTrainingState {
  const parameters = state.parameters.map((value) => new Scalar(value));
  const before = forward(parameters);
  before.loss.backward();
  const rawGradientNorm = Math.sqrt(parameters.reduce((sum, parameter) => sum + parameter.grad ** 2, 0));
  const clipScale = rawGradientNorm > TRANSLATION_GRADIENT_CLIP ? TRANSLATION_GRADIENT_CLIP / rawGradientNorm : 1;
  const step = state.epoch + 1;
  const betaOne = .9;
  const betaTwo = .999;
  const epsilon = 1e-8;
  const firstMoment = parameters.map((parameter, index) => (
    betaOne * state.firstMoment[index] + (1 - betaOne) * parameter.grad * clipScale
  ));
  const secondMoment = parameters.map((parameter, index) => (
    betaTwo * state.secondMoment[index]
      + (1 - betaTwo) * (parameter.grad * clipScale) ** 2
  ));
  const nextParameters = state.parameters.map((value, index) => {
    const correctedFirst = firstMoment[index] / (1 - betaOne ** step);
    const correctedSecond = secondMoment[index] / (1 - betaTwo ** step);
    return value - learningRate * correctedFirst / (Math.sqrt(correctedSecond) + epsilon);
  });
  const after = evaluate(nextParameters);
  const initial = initializeParameters();
  return {
    epoch: step,
    parameters: nextParameters,
    firstMoment,
    secondMoment,
    loss: after.loss,
    accuracy: after.accuracy,
    correctTokens: after.correctTokens,
    tokenCount: after.tokenCount,
    gradientNorm: rawGradientNorm,
    attentionParameterDelta: attentionDelta(nextParameters, initial),
    lossHistory: [...state.lossHistory, after.loss],
    accuracyHistory: [...state.accuracyHistory, after.accuracy],
    attentionMatrices: after.attentionMatrices,
    scoreMatrices: after.scoreMatrices,
    predictions: after.predictions,
    greedyPredictions: after.greedyPredictions,
    greedyAttentionMatrices: after.greedyAttentionMatrices,
    greedyScoreMatrices: after.greedyScoreMatrices,
    heldOutAccuracy: after.heldOutAccuracy,
    heldOutPrediction: after.heldOutPrediction,
    heldOutGreedyPrediction: after.heldOutGreedyPrediction,
    heldOutAttentionMatrix: after.heldOutAttentionMatrix,
    heldOutScoreMatrix: after.heldOutScoreMatrix,
    validationAccuracy: after.validationAccuracy,
    validationPredictions: after.validationPredictions,
    validationGreedyPredictions: after.validationGreedyPredictions,
    validationAttentionMatrices: after.validationAttentionMatrices,
    validationScoreMatrices: after.validationScoreMatrices,
    validationGreedyAttentionMatrices: after.validationGreedyAttentionMatrices,
    validationGreedyScoreMatrices: after.validationGreedyScoreMatrices,
  };
}

export function runTranslationTraining(
  state: TranslationTrainingState,
  epochs: number,
  learningRate = LEARNING_RATE,
) {
  let next = state;
  for (let index = 0; index < epochs; index += 1) {
    next = trainTranslationEpoch(next, learningRate);
  }
  return next;
}

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
    throw new RangeError('Expected all 565 finite model parameters.');
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
  model: 'attention-gru-565-kv-v2';
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
    version: 1, model: 'attention-gru-565-kv-v2', epoch: state.epoch,
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
  if (saved.version !== 1 || saved.model !== 'attention-gru-565-kv-v2'
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

// Copied verbatim from the original TranslatorNetworkInspector checkpoint.
// Seed 10404, 45 distinct training examples, full-batch Adam, epoch 120. Independent of the live C24/C25 experiment.
export const TRANSLATION_STRUCTURE_EPOCH = 120;

export const TRANSLATION_STRUCTURE_PARAMETERS: readonly number[] = Object.freeze([
  -0.41363316475044337, 0.21793884337716088, 0.1935865327159507, 1.7395144232877648, -1.6271037347451998, -0.7244128178901464,
  1.796928832131251, 0.8907726831818742, -1.1028600182038946, 1.311432474120189, 0.6963690520853123, -1.5761766801862889,
  -1.751651520264949, -1.5510443180823696, -0.4902068241569389, 0.3515878997120997, 0.8994478131679136, -0.4440138615631021,
  -0.05252457521726738, 0.16499177768890003, -0.8401953679871066, -0.8030169269176717, 0.8399379902452759, -0.606599250708531,
  2.314831686486434, -0.3726960018461846, -0.20398372021259215, 1.2249020417605045, -0.2514755328228284, -1.3462261609676043,
  1.5784524173426426, -1.1302198305911444, -1.535724771047091, -0.3894762152745724, -0.0703701033041849, -1.046829188167634,
  0.8760614197622535, -0.8183669091332502, -1.5797957175972073, -0.9617039386795239, -0.7155189856273684, 0.25331015411175495,
  -0.8223071985841183, -1.971509416132417, -2.1078010480950233, -0.002099268335690315, -1.9433593667327678, -0.24296543800542067,
  -1.0009435072949229, 1.1716081075404088, 1.586920219989943, -1.305627391907451, -0.8034581492666172, 1.6863229496714822,
  -0.25488396243970807, 1.0918429180704938, 0.551447424182721, 0.6499733042432982, 0.04486721977410114, 0.45315448706047406,
  -0.16260993363636767, 0.19867223677662849, -0.1045831855408193, -0.14255719747589543, -0.18785006814069363, -0.11364235303603366,
  0.8359802117677247, 0.9386123907087084, -0.7701111326927677, -0.13380134398142204, 0.04074786628850052, -0.0872268424009742,
  0.23888618904482475, -0.3338049106574487, -0.9048886076220104, 0.11967683753260448, -0.6508365833824897, -0.6094908845509972,
  0.0873692441111694, 0.24126493470894012, 0.30769569586994405, -0.7446436532962931, -0.10545484019321855, 0.35759268451908544,
  -1.291715162008763, -1.0167461644784486, 1.9264076161991655, -0.2940086651369539, -0.8137476424534091, 0.5626948352720467,
  -0.3398960441839603, -0.03462085257058797, 0.1806628026914886, -0.29202319593009024, -0.9027884725516373, 0.2744079909701537,
  -0.8031993307450881, -0.12161996911499423, 0.3110901501294603, -0.6684605806267584, -1.1184904107559968, 0.8284979195799891,
  -0.35151741350121957, 0.12135434671204237, 0.13776819234259557, -0.7975689445275963, -0.169669472855591, 0.09474221336058805,
  -0.48786115937780217, -0.22842628970538928, 0.18299872160389485, -0.2611436268224001, -1.4257962729718219, 0.3490872369231974,
  -0.6869636961984847, -0.11833833702588985, -0.14584696002998968, 0.5114311359528649, 0.8555157648397249, -0.19540024534497244,
  -1.0781328266371588, -0.11417449240650489, 0.447008242346226, -1.1843332755707083, -1.1329595302695772, -1.7742438266751681,
  1.0177569994797422, 0.9011730279509343, 1.114944768096925, 0.14828421321765364, -1.1608590443136366, -1.156431535444395,
  2.5614713053375233, -1.1469579888658838, -1.4819073715857323, -0.2128563379214266, 0.9610964630373258, 0.06926997396439949,
  0.19972727246450311, -0.7064650398575903, 2.1850117144614765, -0.7938003254800537, 0.07551595661427231, 0.07390106993656917,
  0.5820353668630223, -0.6484978560086659, -1.0474510423770655, -1.2233212378710432, -1.9684727671398776, 2.2999827332424134,
  1.1424002157019044, -0.2672227232049949, -0.3065992904906069, -1.398946386210274, 0.07426889888210865, 0.6861437810703024,
  0.15392139012971667, 0.10538712689361313, -1.620658464859506, -0.5870727395771895, 0.7853611223157643, -0.4783772178759785,
  0.6674150875438922, 0.04289367690590816, -0.0760791381332796, 0.12049420308499466, 1.238730961802875, 0.272216299902043,
  -1.3070727093179886, 0.991124003289484, -0.2774031596684823, -2.0731823706409007, 0.6935288771774186, 0.01725803510922031,
  0.0349647203453639, 0.2031488131803924, 0.3017105908969181, -0.44464072128827364, 0.32722336216361947, -0.051260352059639885,
  -0.5475381265552459, -1.4263753520577678, -0.9555422224403545, 0.7805978945795333, 0.14622814407335266, -1.763235750807368,
  0.05828681747231662, 1.4233427886350585, -0.32126869629207777, -0.5969014174326196, 0.21579527513522714, 1.4772531432338716,
  2.1822542785535335, 0.4196073420479436, 1.0039374218469015, -0.9105023244587431, -0.6068362931721815, 0.0637532059370409,
  0.527708356019081, -0.5848572065888442, 0.07645652217910685, 0.38126698294918976, 0.07257600233158074, -0.1537511563666102,
  0.37379339337978346, -0.40265498358759133, -0.7671830907068221, -0.4396210646176443, -0.10165039429335176, 0.42840563209115706,
  0.20466358290970585, -0.09144922060189808, -0.6753797032933149, 1.572041701558105, 0.38074925384456415, 1.9032084327283856,
  -1.7001490721866612, -1.255849580168631, -0.9717127109047095, 0.20562204608462947, -1.0751876185781502, 1.7462043010222825,
  1.7908393684791997, -1.2902548895145178, -0.8670191520517705, 1.739875190054795, 1.4630474980650545, 1.059116333075109,
  -2.1221822906681194, -2.164045807953213, -0.4404330338334765, 2.1825238308036323, 1.032109190668585, 2.2759086532402812,
  1.4070178631477295, -2.9957100133466588, 0.5389818176085177, 1.4270809018253103, 1.067336140969285, 1.2610522773615553,
  2.2810803937712496, 1.9274541587560237, 2.607162384051606, 1.211618525040858, 1.0477279249198301, -0.1444147821284995,
  -0.8950345234193916, -0.6712199840624238, 0.2604135110994941, 0.6044355916421539, 0.1673117842427076, -0.8096268765266758,
  0.2455704647555138, -0.7869298992311101, -1.1403533752150121, 0.057933474437359044, 1.4986922685119914, 0.5014412834977084,
  0.8167160670973503, -0.5122965614148378, -0.1640445218147471, -0.12296276937296041, 0.47966884800911547, 1.6469291537184287,
  0.44383868552217, 0.35219820377281374, -1.6603108503121737, -0.018253400619386868, -0.806134979002776, 0.12589444559224527,
  -0.29276357743169545, 0.012633065300563408, 1.3343292491444265, -1.4542197050491072, 0.1256897517110184, -0.13811652651978698,
  -0.7554047520548793, 1.3508365125326567, 1.2617773962846228, 0.46479825915483425, -0.127293334410891, 0.07179982345514749,
  1.289240077919157, 0.795811832119496, -1.1316034336770318, 0.962498426756247, -1.3334396103957697, -0.5407130470957607,
  -1.3525280201870584, -1.3310131067774789, 0.061526705251552447, 0.014122195707197535, -0.026484115047153353, -0.46797924938446367,
  0.9359013090872021, 0.631878341290611, -0.17257311568391118, -0.9141038901170908, -1.5678318015755441, -1.8047150474785634,
  1.1434296356281055, 0.17875047945776884, -0.09769377976214702, 0.18081540224728873, -0.12593443945416535, -0.7833319186497387,
  -1.0367357781825306, 0.7285435119659429, 0.24992258115853827, 0.9354373103264348, 0.45311616660398435, -1.0483577757743017,
  -0.4472634135760664, -0.534588082109302, -0.1995698044136015, 0.643465658720283, 0.8703477909085047, -1.0570179702643854,
  -1.2685110114921139, 0.8303453674486491, -0.2570936027666065, 0.08468719323972765, -1.5086479546611977, -1.2611662126288903,
  0.004224971071860016, 0.24536294173391784, 0.5546926224106227, -0.7973464677201778, -0.7049788610977483, 0.12664478628744072,
  0.25884878966102803, 0.44333984330267934, 0.00684943454790265, 0.059219120252316834, -0.7447011803243846, 0.8198047237300206,
  0.20177584410374153, 0.7154627389422034, 0.9209980730009089, 0.8648726386071114, 2.110591453431586, -0.3472372706614425,
  -0.6570581487837428, -0.4943333155063673, 0.4794497161602858, 0.828745968100842, -0.9604025448601016, 0.44456762540940564,
  0.558963178214688, 0.04574887870480905, -0.13923862498106274, 0.17854326944899573, -0.1318049661750803, 1.2857559548734794,
  1.0868705309759246, -1.8389447852887313, 0.32809725064853873, -0.39673173346292506, 0.021138165852192078, 0.26990344410538897,
  -0.5375487788329489, -0.5043654192265953, 0.8474629566590717, -0.27525802521133036, -0.2992203243571229, -0.15220980870638143,
  0.1123905201688568, -0.3555796485130131, 0.2762514287327391, -0.3341743404428021, 0.23575737230097274, -1.3078504497621302,
  0.46749387263703973, -2.6411634577576493, 1.3167503959057956, 1.8015274762805684, 0.4706358232604502, 0.4732884593033986,
  -0.8886012677343699, -0.06337522455589757, 1.39210122403354, -0.5410300353852598, 0.8786567105551658, -0.7898158170829813,
  0.07107992662960647, -0.17523341163904305, 0.16554663461241262, 0.5837064579912283, -0.22357029606120907, 0.19903309669547797,
  -0.5868369857996918, -0.8564648300823361, -0.8222568924230111, 0.3770772110550828, 0.9325709306794144, 0.6712327657682332,
  -0.18368662500768407, 0.2478076213903263, -0.2837918430990642, -0.7671998168439543, -1.3166126970701646, 0.48767918582342173,
  1.1058476240722805, -1.3230625424844817, 1.4877229139553712, -1.3506242203615653, 2.6368899760080646, 0.20531554072933494,
  0.6447635238241297, -0.21642641424240183, -1.1127067722622503, 1.8632884118721027, -0.133178400313406, 1.5361778114677809,
  -0.76756592060339, -1.1186866858724582, 1.6399150836434355, 0.815723558028883, -0.7760629515526509, 2.0860529222557216,
  -0.8663980807806508, 1.831463691356332, -1.3428879932946778, -1.735548766765328, -1.548459405136843, 1.236477728122121,
  -0.009670819373615924, -1.3358401122388908, -1.2825736022769516, 1.8631518545899248, -1.3194126578504277, -1.0263229450310656,
  -1.6056081078761602, 1.1374793288414216, -0.49075526397032265, 0.020320278518273893, -1.0743976053205302, -0.8596114937867858,
  -0.7569426793853302, -1.9844773473133521, -1.6226491015512963, 1.2577360622478333, -0.1348365325344679, -0.82743388484699,
  2.1083696348027576, -1.2010680902151103, -0.8104913841092447, 1.3410954394683539, 0.4437056886343983, -0.8617368552232911,
  -0.7024421303221956, -2.0661312183245615, -1.2771345468164774, 2.5568558555644976, -1.2639512511685769, 0.3377495647501809,
  -1.4282272797521902, -1.7949866890092674, 1.0795944102033332, -1.363941319161586, -1.799743591268425, -1.8320713508895918,
  -1.1639971988599418, 0.9068974430180796, -0.624267808055034, -1.082582643486881, -0.43005599128026745, -1.602951464516991,
  -0.6591729551057051, 1.8991362705144808, -0.932911786868209, 0.2857622400207614, 1.5160879202622024, 1.5897751149129067,
  -0.02393153355607982, -0.9642900678964254, -1.7144499846442436, -1.0352677971226476, -0.8071960833896765, -0.33541257766430216,
  1.3103009553271778, 1.3653501906508447, 0.06467116978286765, 0.40281508028146606, -0.590259672930332, 2.5625309757654713,
  -0.7332454422119673, 1.176868736571497, 1.3517071524475004, -1.6110493051618207, -0.4048052777445659, 1.8450782478657364,
  -2.0901544007081605, -1.3586519928260572, -0.9272082801834255, 1.4884741896732911, 1.4886399820037532, 0.053442965845630214,
  -0.06903838579388437, 0.31714415147590963, -1.8890183599418406, -1.1814748526649481, 0.2686351511544145, 1.3013461627788214,
  -0.8775045962372938, -2.6777737333870535, 1.7733389535689463, 1.1880004638314003, -1.2595174489833156, -0.8605630153340698,
  -0.41499629397582155, 2.075766504647265, 0.8244554515332345, -1.0972146920073849, 2.4223594276727427, -0.940243177410475,
  -1.2946042588440065, 1.8361239828468543, -1.4930177005333818, -0.12412878994028818, -0.3456016646230194, 0.6697321867256395,
  -1.005036247296636, -1.992071201591277, -2.026428679912006, -1.6682793109174348, -0.9436070570562204, -0.9944265393643019,
  -1.0402207161136632, 0.9028418126136839, -0.3955195459256701, -0.6816700421485808, -0.5703562731143195, 0.5978867506296764,
  -0.23689875903810187, 0.7308276180757834, -0.24555219348390828, -0.29017999098652114, 0.4611861903580753, 0.5603243187124852,
  0.27310508033745756, -0.7559243455944148, -0.4635911590111097, -0.27260006727460306, -0.23856443211785647, -0.31840892100693313,
  -1.0562439021311334, -0.19727015608086135, 0.0980339373101601, 3.237467759155659, 1.6046726774574591, -1.9659154028184735,
  0.4968942494840904, 0.8967899693901209, 3.0963381774709537, -0.20460594919937616, -0.5733968513046567, -0.7635469684654118,
  0.31219332783789405, 2.8391041315997216, -0.25476121110812855, -0.0672067592512219, -0.2568857438140462, -0.9059803121313698,
  2.5979472985118917
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
    throw new RangeError('Expected all 565 finite translation parameters.');
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
