/**
 * 第二幕：把棋局变成 0/1 数字表格，再用一个小矩阵去扫描它。
 *
 * 这一层同样是纯逻辑：补零后的显示网格、算子矩阵、窗口取值与激活值计算，
 * 都不依赖 DOM、Canvas 或 React。
 */
import { AI, BOARD_SIZE, EMPTY, HUMAN, inBounds, type Board, type Cell } from './gomokuEngine';

/** 为了让 5 × 5 窗口在最外圈也能完整落下，棋盘四周各补两圈 0。 */
export const IMAGE_PADDING = 2;
export const IMAGE_SIZE = BOARD_SIZE + IMAGE_PADDING * 2;
export const KERNEL_SIZE = 5;

export type Matrix = number[][];
export type LayerKey = 'winner' | 'loser';
export type ImageTransform = 'none' | 'flip' | 'rotate';

export interface DisplayCell {
  row: number;
  col: number;
  value: number;
  onBoard: boolean;
  isWin: boolean;
  isHit: boolean;
}

export interface DisplayOptions {
  transform?: ImageTransform;
  winLine?: Cell[];
  kernel?: Matrix | null;
  window?: { top: number; left: number } | null;
}

export function loserOf(winner: number): number {
  if (winner === HUMAN) return AI;
  if (winner === AI) return HUMAN;
  return EMPTY;
}

/** 赢家图取获胜方的棋子，输家图取另一方的棋子。 */
export function playerForLayer(winner: number, layer: LayerKey): number {
  return layer === 'winner' ? winner : loserOf(winner);
}

/** 终局连线的方向；不足两点时按横向处理。 */
export function winDirection(winLine: Cell[]): { dr: number; dc: number } {
  if (winLine.length < 2) return { dr: 0, dc: 1 };
  const first = winLine[0];
  const second = winLine[1];
  return { dr: Math.sign(second.row - first.row), dc: Math.sign(second.col - first.col) };
}

/** 可以单独挑出来匹配的四个方向；每个方向都配一个 5 × 5 算子。 */
export type KernelDirection = 'horizontal' | 'vertical' | 'diagonal' | 'antiDiagonal';

export const KERNEL_DIRECTIONS: readonly KernelDirection[] = [
  'horizontal',
  'vertical',
  'diagonal',
  'antiDiagonal',
];

const DIRECTION_LABELS: Record<KernelDirection, string> = {
  horizontal: '横向',
  vertical: '竖向',
  diagonal: '左上到右下斜线',
  antiDiagonal: '右上到左下斜线',
};

/** 方向按钮上的短标签：一个汉字或一个箭头。 */
const DIRECTION_SHORT_LABELS: Record<KernelDirection, string> = {
  horizontal: '横',
  vertical: '竖',
  diagonal: '↘',
  antiDiagonal: '↙',
};

export function directionLabel(direction: KernelDirection): string {
  return DIRECTION_LABELS[direction];
}

export function directionShortLabel(direction: KernelDirection): string {
  return DIRECTION_SHORT_LABELS[direction];
}

/** 终局连线落在哪个方向。 */
export function directionForWinLine(winLine: Cell[]): KernelDirection {
  const dir = winDirection(winLine);
  if (dir.dr === 0) return 'horizontal';
  if (dir.dc === 0) return 'vertical';
  return dir.dr === dir.dc ? 'diagonal' : 'antiDiagonal';
}

export function winDirectionLabel(winLine: Cell[]): string {
  return directionLabel(directionForWinLine(winLine));
}

export function matrixSize(matrix: Matrix): number {
  return matrix.length;
}

export function zeroKernel(size: number = KERNEL_SIZE): Matrix {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
}

export function mainDiagonalKernel(size: number = KERNEL_SIZE): Matrix {
  return Array.from({ length: size }, (_, row) => (
    Array.from({ length: size }, (_, col) => (row === col ? 1 : 0))
  ));
}

export function antiDiagonalKernel(size: number = KERNEL_SIZE): Matrix {
  return Array.from({ length: size }, (_, row) => (
    Array.from({ length: size }, (_, col) => (row + col === size - 1 ? 1 : 0))
  ));
}

export function horizontalKernel(size: number = KERNEL_SIZE): Matrix {
  const middle = Math.floor(size / 2);
  return Array.from({ length: size }, (_, row) => (
    Array.from({ length: size }, () => (row === middle ? 1 : 0))
  ));
}

export function verticalKernel(size: number = KERNEL_SIZE): Matrix {
  const middle = Math.floor(size / 2);
  return Array.from({ length: size }, () => (
    Array.from({ length: size }, (_, col) => (col === middle ? 1 : 0))
  ));
}

/** 与终局连线形状一致的算子：横向用横算子，斜线用同向的对角算子。 */
export function kernelForWinDirection(winLine: Cell[]): Matrix {
  return kernelForDirection(directionForWinLine(winLine));
}

/** 四个方向各自对应的算子：一条横线、一条竖线、两条对角线。 */
export function kernelForDirection(direction: KernelDirection): Matrix {
  if (direction === 'horizontal') return horizontalKernel();
  if (direction === 'vertical') return verticalKernel();
  return direction === 'diagonal' ? mainDiagonalKernel() : antiDiagonalKernel();
}

export function flipHorizontal(matrix: Matrix): Matrix {
  return matrix.map((line) => [...line].reverse());
}

export function rotateClockwise(matrix: Matrix): Matrix {
  return matrix[0].map((_, col) => matrix.map((line) => line[col]).reverse());
}

/** 把图像整体变换一次，让原来的连线变成另一个方向。 */
export function transformForWinDirection(winLine: Cell[]): ImageTransform {
  const dir = winDirection(winLine);
  return dir.dr === 0 || dir.dc === 0 ? 'rotate' : 'flip';
}

export function transformActionText(winLine: Cell[]): string {
  return transformForWinDirection(winLine) === 'rotate' ? '旋转一次' : '左右翻转';
}

/** 经过变换后，需要重新设计的算子。 */
export function targetOppositeKernel(winLine: Cell[], base: Matrix): Matrix {
  const dir = winDirection(winLine);
  return dir.dr === 0 || dir.dc === 0 ? rotateClockwise(base) : flipHorizontal(base);
}

export function matrixEquals(a: Matrix, b: Matrix): boolean {
  if (a.length !== b.length) return false;
  return a.every((line, row) => line.every((value, col) => value === b[row][col]));
}

export function matrixHasOne(matrix: Matrix): boolean {
  return matrix.some((line) => line.some((value) => value === 1));
}

/** 显示网格的坐标 → 棋盘坐标；补零圈与变换都在这里被消化掉。 */
export function displayToBoardCell(row: number, col: number, transform: ImageTransform = 'none'): Cell {
  const innerRow = row - IMAGE_PADDING;
  const innerCol = col - IMAGE_PADDING;
  if (transform === 'flip') return { row: innerRow, col: BOARD_SIZE - 1 - innerCol };
  if (transform === 'rotate') return { row: BOARD_SIZE - 1 - innerCol, col: innerRow };
  return { row: innerRow, col: innerCol };
}

export function boardValueAt(board: Board, player: number, row: number, col: number): number {
  return inBounds(row, col) && board[row][col] === player ? 1 : 0;
}

export function buildDisplayCells(board: Board, player: number, options: DisplayOptions = {}): DisplayCell[] {
  const transform = options.transform ?? 'none';
  const winKeys = new Set((options.winLine ?? []).map((cell) => cell.row + ':' + cell.col));
  const kernel = options.kernel ?? null;
  const window = options.window ?? null;
  const cells: DisplayCell[] = [];
  for (let row = 0; row < IMAGE_SIZE; row += 1) {
    for (let col = 0; col < IMAGE_SIZE; col += 1) {
      const source = displayToBoardCell(row, col, transform);
      const onBoard = inBounds(source.row, source.col);
      const value = boardValueAt(board, player, source.row, source.col);
      const localRow = window ? row - window.top : -1;
      const localCol = window ? col - window.left : -1;
      const inWindow =
        kernel !== null && localRow >= 0 && localRow < kernel.length && localCol >= 0 && localCol < kernel.length;
      cells.push({
        row,
        col,
        value,
        onBoard,
        isWin: value === 1 && winKeys.has(source.row + ':' + source.col),
        isHit: inWindow && value === 1 && kernel?.[localRow]?.[localCol] === 1,
      });
    }
  }
  return cells;
}

/** 窗口当前覆盖的 5 × 5 输入矩阵。 */
export function patchMatrix(
  board: Board,
  player: number,
  transform: ImageTransform,
  top: number,
  left: number,
  size: number = KERNEL_SIZE,
): Matrix {
  return Array.from({ length: size }, (_, row) => (
    Array.from({ length: size }, (_, col) => {
      const source = displayToBoardCell(top + row, left + col, transform);
      return boardValueAt(board, player, source.row, source.col);
    })
  ));
}

/** 按位相乘再相加。 */
export function dotProduct(a: Matrix, b: Matrix): number {
  return a.reduce((total, line, row) => (
    total + line.reduce((sum, value, col) => sum + value * b[row][col], 0)
  ), 0);
}

export function activationAt(
  board: Board,
  player: number,
  transform: ImageTransform,
  top: number,
  left: number,
  kernel: Matrix,
): number {
  return dotProduct(kernel, patchMatrix(board, player, transform, top, left, kernel.length));
}

/**
 * 棋盘坐标上的 5 × 5 小块：不补零，窗口只落在棋盘内部，
 * 所以位置一共有 (15 − 5 + 1)² = 121 个。
 */
export function boardPatch(
  board: Board,
  player: number,
  top: number,
  left: number,
  size: number = KERNEL_SIZE,
): Matrix {
  return Array.from({ length: size }, (_, row) => (
    Array.from({ length: size }, (_, col) => boardValueAt(board, player, top + row, left + col))
  ));
}

/** 直接按棋盘坐标算激活值，省掉补零圈那一层换算。 */
export function boardActivation(
  board: Board,
  player: number,
  top: number,
  left: number,
  kernel: Matrix,
): number {
  return dotProduct(kernel, boardPatch(board, player, top, left, kernel.length));
}

/** 遍历棋盘上所有窗口位置，返回最大激活值以及取得它的位置。 */
export function bestBoardActivation(
  board: Board,
  player: number,
  kernel: Matrix,
): { value: number; positions: Cell[] } {
  const size = kernel.length;
  const max = BOARD_SIZE - size;
  let value = -Infinity;
  let positions: Cell[] = [];
  for (let row = 0; row <= max; row += 1) {
    for (let col = 0; col <= max; col += 1) {
      const current = boardActivation(board, player, row, col, kernel);
      if (current > value) {
        value = current;
        positions = [{ row, col }];
      } else if (current === value) {
        positions.push({ row, col });
      }
    }
  }
  return { value: Number.isFinite(value) ? value : 0, positions };
}

/** 遍历所有窗口位置，返回最大激活值以及取得它的位置。 */
export function bestActivation(
  board: Board,
  player: number,
  transform: ImageTransform,
  kernel: Matrix,
): { value: number; positions: Cell[] } {
  const size = kernel.length;
  let value = -Infinity;
  let positions: Cell[] = [];
  for (let row = 0; row <= IMAGE_SIZE - size; row += 1) {
    for (let col = 0; col <= IMAGE_SIZE - size; col += 1) {
      const current = activationAt(board, player, transform, row, col, kernel);
      if (current > value) {
        value = current;
        positions = [{ row, col }];
      } else if (current === value) {
        positions.push({ row, col });
      }
    }
  }
  return { value: Number.isFinite(value) ? value : 0, positions };
}

export function clampWindow(top: number, left: number, size: number = KERNEL_SIZE): Cell {
  const max = IMAGE_SIZE - size;
  return {
    row: Math.max(0, Math.min(max, top)),
    col: Math.max(0, Math.min(max, left)),
  };
}
