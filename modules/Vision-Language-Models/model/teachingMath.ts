export function patchStats(size: number, patch: number) {
  if (patch <= 0 || size <= 0 || size % patch !== 0) throw new Error('Image size must be divisible by patch size.');
  const side = size / patch, tokens = side ** 2;
  return { side, tokens, flattened: patch ** 2 * 3, comparisons: tokens ** 2 };
}
export function softmax(values: number[], temperature = 1) {
  if (!values.length || !Number.isFinite(temperature) || temperature <= 0) throw new Error('Invalid softmax input.');
  const max = Math.max(...values), exps = values.map(value => Math.exp((value - max) / temperature));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map(value => value / total);
}
function crossEntropy(values: number[], target: number, temperature: number) {
  const max = Math.max(...values);
  return Math.log(values.reduce((total, value) => total + Math.exp((value - max) / temperature), 0)) + (max - values[target]) / temperature;
}
export function clipLoss(matrix: number[][], temperature: number) {
  if (!matrix.length || matrix.some(row => row.length !== matrix.length) || temperature <= 0) throw new Error('Expected square similarity matrix and positive temperature.');
  const n = matrix.length;
  const image = matrix.reduce((total, row, i) => total + crossEntropy(row, i, temperature), 0) / n;
  const text = matrix.reduce((total, _, i) => total + crossEntropy(matrix.map(row => row[i]), i, temperature), 0) / n;
  return { image, text, total: (image + text) / 2 };
}
export function normalize(vector: number[]) {
  const length = Math.hypot(...vector);
  return length ? vector.map(value => value / length) : vector.map(() => 0);
}
export function dot(a: number[], b: number[]) {
  if (a.length !== b.length) throw new Error('Vector dimensions must match.');
  return a.reduce((total, value, i) => total + value * b[i], 0);
}
export function ensemble(vectors: number[][]) {
  if (!vectors.length) throw new Error('At least one vector is required.');
  const normalized = vectors.map(normalize);
  return normalize(normalized[0].map((_, i) => normalized.reduce((sum, vector) => sum + vector[i], 0) / vectors.length));
}
export const exampleSimilarities = [[.90, .10, .20], [.15, .95, .10], [.10, .20, .92]];

// Three one-hot image inputs and three one-hot text inputs pass through separate
// trainable linear encoders. This small, deterministic model demonstrates the
// actual parameter update behind CLIP's batch objective; it is not CLIP itself.
export type ToyEncoderState = { image: number[][]; text: number[][] };
export const initialToyEncoders: ToyEncoderState = {
  image: [[1, .1, .2], [.2, 1, .1], [.1, .2, 1]],
  text: [[.3, .1, .9], [.9, .3, .1], [.1, .9, .3]],
};
function encodedColumn(weights: number[][], index: number) {
  return normalize(weights.map(row => row[index]));
}
export function toyEncoderScores(state: ToyEncoderState) {
  return [0, 1, 2].map(imageIndex =>
    [0, 1, 2].map(textIndex =>
      dot(encodedColumn(state.image, imageIndex), encodedColumn(state.text, textIndex))));
}
export function toyEncoderLoss(state: ToyEncoderState, temperature = .4) {
  return clipLoss(toyEncoderScores(state), temperature);
}
export function toyEncoderStep(state: ToyEncoderState, temperature = .4) {
  const epsilon = 1e-4;
  const gradient = (kind: keyof ToyEncoderState) => state[kind].map((row, r) => row.map((_, c) => {
    const plus = { ...state, [kind]: state[kind].map((values, i) =>
      values.map((value, j) => value + (i === r && j === c ? epsilon : 0))) };
    const minus = { ...state, [kind]: state[kind].map((values, i) =>
      values.map((value, j) => value - (i === r && j === c ? epsilon : 0))) };
    return (toyEncoderLoss(plus, temperature).total - toyEncoderLoss(minus, temperature).total) / (2 * epsilon);
  }));
  const imageGradient = gradient('image');
  const textGradient = gradient('text');
  const before = toyEncoderLoss(state, temperature).total;
  let learningRate = .25;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const next = {
      image: state.image.map((row, r) => row.map((value, c) => value - learningRate * imageGradient[r][c])),
      text: state.text.map((row, r) => row.map((value, c) => value - learningRate * textGradient[r][c])),
    };
    if (toyEncoderLoss(next, temperature).total < before) return { next, imageGradient, textGradient, learningRate };
    learningRate /= 2;
  }
  return { next: state, imageGradient, textGradient, learningRate: 0 };
}
export function trainToyEncoders(state: ToyEncoderState, temperature = .4) {
  return toyEncoderStep(state, temperature).next;
}

// A score-space experiment, not a substitute for training CLIP encoders.
export function scoreGradient(matrix: number[][], temperature: number) {
  const n = matrix.length;
  const rows = matrix.map(row => softmax(row, temperature));
  const cols = matrix.map((_, j) => softmax(matrix.map(row => row[j]), temperature));
  return matrix.map((row, i) => row.map((_, j) =>
    (rows[i][j] + cols[j][i] - (i === j ? 2 : 0)) / (2 * n * temperature)));
}
export function optimizeScores(matrix: number[][], temperature: number) {
  const gradient = scoreGradient(matrix, temperature);
  return matrix.map((row, i) => row.map((value, j) =>
    Math.max(-1, Math.min(1, value - .25 * temperature * gradient[i][j]))));
}
export function projectPatch(flattened: number[], matrix: number[][]) {
  const width = matrix[0]?.length;
  if (!flattened.length || matrix.length !== flattened.length || !width ||
      flattened.some(value => !Number.isFinite(value)) ||
      matrix.some(row => row.length !== width || row.some(value => !Number.isFinite(value)))) {
    throw new Error('Flattened patch and projection matrix dimensions must match and contain finite values.');
  }
  return Array.from({ length: width }, (_, column) =>
    flattened.reduce((sum, value, row) => sum + value * matrix[row][column], 0));
}
export function projectToken(weights: number[][], token: number[]) {
  if (!token.length || !weights.length || weights.some(row => row.length !== token.length) ||
      token.some(value => !Number.isFinite(value)) || weights.some(row => row.some(value => !Number.isFinite(value)))) {
    throw new Error('Projection matrix and token dimensions must match and contain finite values.');
  }
  return weights.map(row => dot(row, token));
}
export function maskedAttention(q: number[], enabled: boolean[]) {
  const keys = [[1, .1], [.2, 1], [.3, .4]];
  const values = [[1, 0], [0, 1], [.5, .5]];
  const indices = enabled.flatMap((on, i) => on ? [i] : []);
  if (!indices.length) throw new Error('Keep at least one visible region.');
  const scores = keys.map(key => dot(q, key) / Math.sqrt(2));
  const probabilities = softmax(indices.map(i => scores[i]));
  const weights = enabled.map((_, i) => { const j = indices.indexOf(i); return j < 0 ? 0 : probabilities[j]; });
  return { scores, weights, output: [0, 1].map(d => weights.reduce((sum, w, i) => sum + w * values[i][d], 0)) };
}

export function teacherForcingLoss(targetProbabilities: number[]) {
  if (!targetProbabilities.length || targetProbabilities.some(value => !Number.isFinite(value) || value <= 0 || value > 1)) {
    throw new Error('Target probabilities must be finite values in (0, 1].');
  }
  return -targetProbabilities.reduce((sum, value) => sum + Math.log(value), 0) / targetProbabilities.length;
}

// A scalar connector and a frozen two-word predictor. This is an executable
// analogy for gradient flow through a frozen LLM, not a miniature real VLM.
export function connectorTrainingStep(weight = .2, feature = 1, learningRate = .5) {
  if (![weight, feature, learningRate].every(Number.isFinite) || learningRate <= 0) throw new Error('Finite parameters and a positive learning rate are required.');
  const predict = (w: number) => {
    const probabilities = softmax([w * feature, 0]);
    return { probabilities, loss: -Math.log(probabilities[0]) };
  };
  const before = predict(weight);
  const gradient = (before.probabilities[0] - 1) * feature;
  const nextWeight = weight - learningRate * gradient;
  return { weight, feature, learningRate, gradient, nextWeight, before, after: predict(nextWeight) };
}

// Two consecutive scalar updates illustrate the different trainable scopes.
// The input feature is fixed at 1. Language score = a * (w * x).
// Stage 1 trains w only; stage 2 trains both w and a, from the same pre-update loss.
export function jointConnectorStep(weight: number, languageWeight=1, trainLanguage=false, learningRate=.5) {
  const predict=(w:number,a:number)=>{const probabilities=softmax([a*w,0]);return {probabilities,loss:-Math.log(probabilities[0])};};
  const before=predict(weight,languageWeight), error=before.probabilities[0]-1;
  const connectorGradient=error*languageWeight;
  const languageGradient=trainLanguage?error*weight:0;
  const nextWeight=weight-learningRate*connectorGradient;
  const nextLanguageWeight=languageWeight-learningRate*languageGradient;
  return {weight,languageWeight,learningRate,connectorGradient,languageGradient,nextWeight,nextLanguageWeight,before,after:predict(nextWeight,nextLanguageWeight)};
}
export const queryDemo = {
  queries:[[1,0],[0,1],[-1,-.3]],
  keys:[[.2,.1],[-.4,.3],[.8,-.2],[2.8,.4],[1,.9],[-.2,.7],[.3,-.6],[-.7,-.8]],
  values:[[.2,.5],[.3,.4],[.4,.6],[1,.2],[.6,.8],[.8,.3],[.1,.7],[.2,.1]],
};
export function queryAggregation() {
  const weights=queryDemo.queries.map(q=>softmax(queryDemo.keys.map(k=>dot(q,k)/Math.sqrt(q.length))));
  const outputs=weights.map(row=>queryDemo.values[0].map((_,d)=>row.reduce((sum,a,i)=>sum+a*queryDemo.values[i][d],0)));
  return {weights,outputs};
}

// Row-vector convention: z W. These small projection weights are illustrative.
export function attentionDemo() {
  const tokens=[[1,0],[2,0],[0,2]];
  const queryWeights=[[1,0],[0,1]], keyWeights=[[1,0],[0,1]], valueWeights=[[.5,0],[0,.5]];
  const project=(z:number[],w:number[][])=>projectPatch(z,w);
  const q=project(tokens[0],queryWeights);
  const keys=tokens.slice(1).map(z=>project(z,keyWeights));
  const values=tokens.slice(1).map(z=>project(z,valueWeights));
  const scores=keys.map(k=>dot(q,k)/Math.sqrt(q.length));
  const weights=softmax(scores);
  const output=values[0].map((_,d)=>weights.reduce((sum,a,i)=>sum+a*values[i][d],0));
  return {tokens,queryWeights,keyWeights,valueWeights,q,keys,values,scores,weights,output};
}
export function encoderParameterProbe(state:ToyEncoderState,epsilon=.01) {
  const withParameter=(offset:number)=>({...state,text:state.text.map((row,r)=>row.map((v,c)=>v+(r===0&&c===0?offset:0)))});
  return {minus:toyEncoderLoss(withParameter(-epsilon)).total,center:toyEncoderLoss(state).total,plus:toyEncoderLoss(withParameter(epsilon)).total,epsilon};
}
