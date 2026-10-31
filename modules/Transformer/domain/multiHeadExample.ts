import { INPUTS } from './attentionMatrixExample';
export const HEAD_COLORS = ['#d18c66', '#55a4a8', '#638fb9', '#9b83b1', '#c4a15c', '#5d929d', '#b57f98', '#858eba'];
export const HEAD_QUESTIONS = ['谁在存钱？', '存了什么？', '存到哪里？', 'bank 指什么？', '动作是什么？', '有形容词吗？', '谁和谁有关？', '整句说什么？'];
// Explicit teaching projections. They illustrate the mechanics, not trained heads.
function project(head: number, kind: number) {
    return INPUTS.map(row => {
        const average = row.reduce((a, b) => a + b, 0) / row.length;
        return Array.from({ length: 64 }, (_, d) => .55 * row[(d * 7 + head * 53 + kind * 31) % 512] + .35 * row[(d * 3 + head * 17 + kind * 71 + 71) % 512] + .1 * average);
    });
}
export const HEADS = Array.from({ length: 8 }, (_, head) => {
    const q = project(head, 0), k = project(head, 1), v = project(head, 2);
    const scores = q.map(query => k.map(key => query.reduce((sum, x, d) => sum + x * key[d], 0) / 8));
    const weights = scores.map(row => { const exps = row.map(x => Math.exp(x - Math.max(...row))); const total = exps.reduce((a, b) => a + b, 0); return exps.map(x => x / total); });
    const output = weights.map(row => Array.from({ length: 64 }, (_, d) => row.reduce((sum, a, j) => sum + a * v[j][d], 0)));
    return { q, k, v, scores, weights, output };
});
export const CONCATENATED = INPUTS.map((_, row) => HEADS.flatMap(head => head.output[row]));
export function outputParameter(row: number, column: number) {
    return row === column ? .6 : row === (column + 64) % 512 ? .25 : row === (column + 193) % 512 ? .15 : 0;
}
export const MULTI_HEAD_OUTPUT = CONCATENATED.map(row => row.map((x, d) => .6 * x + .25 * row[(d + 64) % 512] + .15 * row[(d + 193) % 512]));
