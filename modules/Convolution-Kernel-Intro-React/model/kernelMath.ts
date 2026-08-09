import {
  AI,
  BOARD_SIZE,
  EMPTY,
  HUMAN,
  getLoser,
  type Board,
  type Cell,
  type Player,
  type WinDirection,
} from './gomokuEngine';

export const IMAGE_PADDING = 2;
export const IMAGE_SIZE = BOARD_SIZE + IMAGE_PADDING * 2;
export const KERNEL_SIZE = 5;

export type Matrix = number[][];
export type ImageTransform = 'none' | 'flip' | 'rotate';
export type BinaryLayer = 'winner' | 'loser';

export interface ScanPosition {
  row: number;
  col: number;
}

export interface ActivationMaximum {
  value: number;
  positions: ScanPosition[];
}

export function zeroKernel(size = KERNEL_SIZE): Matrix {
  return Array.from({ length: size }, () => Array<number>(size).fill(0));
}

export function mainDiagonalKernel(size = KERNEL_SIZE): Matrix {
  return Array.from(
    { length: size },
    (_, row) => Array.from({ length: size }, (_, col) => (row === col ? 1 : 0)),
  );
}

export function antiDiagonalKernel(size = KERNEL_SIZE): Matrix {
  return Array.from(
    { length: size },
    (_, row) => Array.from({ length: size }, (_, col) => (row + col === size - 1 ? 1 : 0)),
  );
}

export function horizontalKernel(size = KERNEL_SIZE): Matrix {
  const center = Math.floor(size / 2);
  return Array.from(
    { length: size },
    (_, row) => Array.from({ length: size }, () => (row === center ? 1 : 0)),
  );
}

export function verticalKernel(size = KERNEL_SIZE): Matrix {
  const center = Math.floor(size / 2);
  return Array.from(
    { length: size },
    () => Array.from({ length: size }, (_, col) => (col === center ? 1 : 0)),
  );
}

export function cloneMatrix(matrix: readonly (readonly number[])[]): Matrix {
  return matrix.map((row) => [...row]);
}

export function flipHorizontal(matrix: readonly (readonly number[])[]): Matrix {
  return matrix.map((row) => [...row].reverse());
}

export function rotateClockwise(matrix: readonly (readonly number[])[]): Matrix {
  if (!matrix.length) return [];
  return Array.from(
    { length: matrix[0].length },
    (_, col) => matrix.map((row) => row[col]).reverse(),
  );
}

export function matrixEquals(
  left: readonly (readonly number[])[],
  right: readonly (readonly number[])[],
): boolean {
  return (
    left.length === right.length
    && left.every(
      (row, rowIndex) => (
        row.length === right[rowIndex]?.length
        && row.every((value, colIndex) => value === right[rowIndex]?.[colIndex])
      ),
    )
  );
}

export function dotProduct(
  left: readonly (readonly number[])[],
  right: readonly (readonly number[])[],
): number {
  let sum = 0;
  for (let row = 0; row < left.length; row += 1) {
    for (let col = 0; col < (left[row]?.length ?? 0); col += 1) {
      sum += (left[row]?.[col] ?? 0) * (right[row]?.[col] ?? 0);
    }
  }
  return sum;
}

export function getKernelForDirection(direction: WinDirection): Matrix {
  if (direction.dr === 0) return horizontalKernel();
  if (direction.dc === 0) return verticalKernel();
  if (direction.dr === direction.dc) return mainDiagonalKernel();
  return antiDiagonalKernel();
}

export function getTargetOppositeKernel(
  direction: WinDirection,
  baseKernel: readonly (readonly number[])[] = getKernelForDirection(direction),
): Matrix {
  return direction.dr === 0 || direction.dc === 0
    ? rotateClockwise(baseKernel)
    : flipHorizontal(baseKernel);
}

export function getTransformForDirection(direction: WinDirection): ImageTransform {
  return direction.dr === 0 || direction.dc === 0 ? 'rotate' : 'flip';
}

export function getTransformActionText(direction: WinDirection): string {
  return getTransformForDirection(direction) === 'rotate' ? '旋转一次' : '左右翻转';
}

export function displayToBoardCell(
  row: number,
  col: number,
  transform: ImageTransform = 'none',
): Cell {
  const innerRow = row - IMAGE_PADDING;
  const innerCol = col - IMAGE_PADDING;
  if (transform === 'flip') return { row: innerRow, col: BOARD_SIZE - 1 - innerCol };
  if (transform === 'rotate') return { row: BOARD_SIZE - 1 - innerCol, col: innerRow };
  return { row: innerRow, col: innerCol };
}

function boardContains(board: Board, row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE && Boolean(board[row]);
}

export function resolveLayerPlayer(
  winner: Player,
  layer: BinaryLayer,
): Player {
  return layer === 'winner' ? winner : getLoser(winner);
}

export function createBinaryLayer(
  board: Board,
  player: Player,
  transform: ImageTransform = 'none',
): Matrix {
  return Array.from(
    { length: IMAGE_SIZE },
    (_, row) => Array.from({ length: IMAGE_SIZE }, (_, col) => {
      const source = displayToBoardCell(row, col, transform);
      return (
        player !== EMPTY
        && boardContains(board, source.row, source.col)
        && board[source.row]?.[source.col] === player
      ) ? 1 : 0;
    }),
  );
}

export function currentPatchMatrix(
  board: Board,
  player: Player,
  scanPosition: ScanPosition,
  transform: ImageTransform = 'none',
  kernelSize = KERNEL_SIZE,
): Matrix {
  return Array.from(
    { length: kernelSize },
    (_, row) => Array.from({ length: kernelSize }, (_, col) => {
      const source = displayToBoardCell(
        scanPosition.row + row,
        scanPosition.col + col,
        transform,
      );
      return (
        player !== EMPTY
        && boardContains(board, source.row, source.col)
        && board[source.row]?.[source.col] === player
      ) ? 1 : 0;
    }),
  );
}

export function activationAt(
  board: Board,
  player: Player,
  top: number,
  left: number,
  kernel: readonly (readonly number[])[],
  transform: ImageTransform = 'none',
): number {
  return dotProduct(
    kernel,
    currentPatchMatrix(board, player, { row: top, col: left }, transform, kernel.length),
  );
}

export function findMaxActivation(
  board: Board,
  player: Player,
  kernel: readonly (readonly number[])[],
  transform: ImageTransform = 'none',
): ActivationMaximum {
  let value = Number.NEGATIVE_INFINITY;
  let positions: ScanPosition[] = [];
  const limit = IMAGE_SIZE - kernel.length;

  for (let row = 0; row <= limit; row += 1) {
    for (let col = 0; col <= limit; col += 1) {
      const current = activationAt(board, player, row, col, kernel, transform);
      if (current > value) {
        value = current;
        positions = [{ row, col }];
      } else if (current === value) {
        positions.push({ row, col });
      }
    }
  }

  return {
    value: Number.isFinite(value) ? value : 0,
    positions,
  };
}

export function maxActivation(
  board: Board,
  player: Player,
  kernel: readonly (readonly number[])[],
  transform: ImageTransform = 'none',
): number {
  return findMaxActivation(board, player, kernel, transform).value;
}

export function toggleKernelCell(
  kernel: readonly (readonly number[])[],
  row: number,
  col: number,
): Matrix {
  const next = cloneMatrix(kernel);
  if (next[row]?.[col] === undefined) return next;
  next[row][col] = next[row][col] ? 0 : 1;
  return next;
}

export function isStonePlayer(player: Player): player is typeof HUMAN | typeof AI {
  return player === HUMAN || player === AI;
}
