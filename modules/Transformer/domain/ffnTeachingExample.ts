// Small deterministic example of the original Transformer's position-wise ReLU FFN.
// Parameters are shared by every token. This is not a trained-model activation.
export const FFN_SAMPLE_INPUTS = [[1, 0], [0, 1], [1, 1]];
export const FFN_SHARED_PARAMETERS = {
    w1: [[1, -1, 1], [1, 1, -1]], b1: [0, 0, 0],
    w2: [[1, 0], [0, 1], [1, 1]], b2: [0, 0],
};
export function ffnTeachingExample(input: readonly number[]) {
    const { w1, b1, w2, b2 } = FFN_SHARED_PARAMETERS;
    const hidden = b1.map((bias, j) => bias + input.reduce((sum, value, i) => sum + value * w1[i][j], 0));
    const activated = hidden.map(value => Math.max(0, value));
    const output = b2.map((bias, j) => bias + activated.reduce((sum, value, i) => sum + value * w2[i][j], 0));
    return { input: [...input], hidden, activated, output };
}
