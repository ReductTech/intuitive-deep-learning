export type Matrix = number[][];
export function multiply(left: Matrix, right: Matrix): Matrix {
    return left.map((row) => right[0].map((_, column) => row.reduce((sum, value, index) => sum + value * right[index][column], 0)));
}
