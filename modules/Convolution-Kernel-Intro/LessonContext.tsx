import { useSyncExternalStore, type ReactNode } from 'react';
import { createGame, type GomokuGame } from './model/gomokuEngine';
import { zeroKernel, type Matrix } from './model/kernelLab';

/**
 * 这一门课从头到尾只围绕一副棋局展开：对局、二值棋盘、激活扫描和卷积核都取用同一份数据。
 *
 * 状态放在模块级的 store 里，而不是某一次挂载的 React state 里。幻灯片播放器会为每一页
 * 单独渲染一棵组件树，甚至同时渲染缩略图，只有模块级 store 才能让「这一节课的棋局」和
 * 「你设计的那个卷积核」在所有页面之间保持一致。
 */
export interface KernelLessonValue {
  game: GomokuGame;
  updateGame: (updater: (current: GomokuGame) => GomokuGame) => void;
  resetGame: () => void;
  /** 学习者在算子实验里自己设计的 5 × 5 核，最后会被拿去扫描手写数字。 */
  designKernel: Matrix;
  setDesignKernel: (updater: (current: Matrix) => Matrix) => void;
}

interface KernelLessonState {
  game: GomokuGame;
  designKernel: Matrix;
}

let state: KernelLessonState = { game: createGame(), designKernel: zeroKernel() };
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): KernelLessonState {
  return state;
}

function commit(next: KernelLessonState) {
  state = next;
  listeners.forEach((listener) => listener());
}

const updateGame = (updater: (current: GomokuGame) => GomokuGame) => {
  commit({ ...state, game: updater(state.game) });
};

const resetGame = () => {
  commit({ ...state, game: createGame() });
};

const setDesignKernel = (updater: (current: Matrix) => Matrix) => {
  commit({ ...state, designKernel: updater(state.designKernel) });
};

/**
 * 保留 Provider 是为了让课程外壳的写法保持统一；状态本身不依赖组件树。
 */
export function KernelLessonProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useKernelLesson(): KernelLessonValue {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    game: snapshot.game,
    updateGame,
    resetGame,
    designKernel: snapshot.designKernel,
    setDesignKernel,
  };
}

/** 只给测试与调试用：把整节课的状态恢复到初始值。 */
export function resetKernelLessonState() {
  commit({ game: createGame(), designKernel: zeroKernel() });
}
