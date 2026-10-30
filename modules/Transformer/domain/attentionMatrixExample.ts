export const WORDS = ['She', 'deposited', 'money', 'in', 'the', 'bank'];
const QUERY_FEATURES = [[.6, -.2], [.8, 1.1], [1.2, .6], [-.2, .3], [.1, .1], [1.2, 1]];
const KEY_FEATURES = [[.1, -.2], [1.4, .6], [1.8, 1.2], [-.3, .1], [0, -.4], [.8, .8]];
export const DIMENSION = 512;
// Given teaching vectors: a fixed linear lift into 512 dimensions.
// Scores and Softmax below use these full vectors; no trained-model claim.
const lift = (features: number[]) => Array.from({ length: DIMENSION }, (_, i) => features[i % 2] * Math.pow(DIMENSION, .25) / 16);
export const QUERIES = QUERY_FEATURES.map(lift);
export const KEYS = KEY_FEATURES.map(lift);
export const SCORES = QUERIES.map(q => KEYS.map(k => {
    const score = q.reduce((sum, x, d) => sum + x * k[d], 0) / Math.sqrt(DIMENSION);
    return Math.abs(score) < 1e-10 ? 0 : score;
}));
export const WEIGHTS = SCORES.map(row => { const exps = row.map(x => Math.exp(x - Math.max(...row))); const total = exps.reduce((a, b) => a + b, 0); return exps.map(x => x / total); });
// A fully specified teaching projection: W_V has two nonzero entries per column.
export const INPUTS = WORDS.map((_, row) => Array.from({ length: DIMENSION }, (_, d) => .75 * Math.sin((row + 1) * .71 + d * .083) + .25 * Math.cos((d + 1) * .047 - row * .31)));
export function valueParameter(row: number, column: number) {
    return row === column ? .65 : row === (column + 17) % DIMENSION ? .35 : 0;
}
export const VALUES = INPUTS.map(row => row.map((x, d) => .65 * x + .35 * row[(d + 17) % DIMENSION]));
export const OUTPUTS = WEIGHTS.map(weights => Array.from({ length: DIMENSION }, (_, d) => weights.reduce((sum, weight, j) => sum + weight * VALUES[j][d], 0)));
