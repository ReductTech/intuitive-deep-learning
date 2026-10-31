/** Deterministic teaching clock shared by the preview, tool results and tests. */
export type PatchOp = 'clear' | 'release' | 'reset' | 'color';
export type Regression = 'none' | 'resume' | 'record';
export type Program = { patch: PatchOp[]; regression?: Regression };
export type ClockState = {
  remaining: number;
  duration: number;
  running: boolean;
  callbackRegistered: boolean;
  handlePresent: boolean;
  completed: boolean;
  rounds: number;
  notices: number;
};
export const brokenProgram: Program = { patch: [] };
export const fixedProgram: Program = { patch: ['clear', 'release'] };
export const PATCHES: Record<PatchOp, { label: string; code: string; explanation: string }> = {
  clear: { label: '停止回调', code: 'clearInterval(timerId);', explanation: '按当前句柄移除定时回调。' },
  release: { label: '释放句柄', code: 'timerId = null;', explanation: '清空保存的句柄，便于下次重新启动。' },
  reset: { label: '重置时间', code: 'remaining = 5;', explanation: '把剩余时间恢复成一整轮。' },
  color: { label: '改变外观', code: 'setButtonStyle("paused");', explanation: '只改变按钮的显示样式。' },
};
export function newClock(duration = 5): ClockState {
  return { remaining: duration, duration, running: false, callbackRegistered: false, handlePresent: false, completed: false, rounds: 0, notices: 0 };
}
export function startClock(state: ClockState, program: Program = brokenProgram): ClockState {
  return { ...state, remaining: state.completed || program.regression === 'resume' ? state.duration : state.remaining, completed: false, running: true, callbackRegistered: true, handlePresent: true };
}
export function pauseClock(state: ClockState, program: Program): ClockState {
  const next = { ...state, running: false };
  for (const operation of program.patch) {
    if (operation === 'clear' && next.handlePresent) next.callbackRegistered = false;
    if (operation === 'release') next.handlePresent = false;
    if (operation === 'reset') next.remaining = next.duration;
  }
  return next;
}
export function finishClock(state: ClockState, program: Program): ClockState {
  return { ...state, remaining: 0, running: false, callbackRegistered: false, handlePresent: false, completed: true,
    rounds: state.rounds + (!state.completed || program.regression === 'record' ? 1 : 0),
    notices: state.notices + (!state.completed ? 1 : 0) };
}
export function tickClock(state: ClockState, program: Program, seconds = 1): ClockState {
  let next = { ...state };
  for (let i = 0; i < seconds; i++) {
    if (!next.callbackRegistered || next.remaining <= 0) break;
    next.remaining = Math.max(0, next.remaining - 1);
    if (next.remaining === 0) next = finishClock(next, program);
  }
  return next;
}
export type TestEvidence = { id: string; label: string; expected: string; actual: string; pass: boolean; steps: string[] };
export function pauseProbe(program: Program, wait = 2): TestEvidence {
  let state = tickClock(startClock(newClock(), program), program, 2);
  state = pauseClock(state, program);
  const pausedValue = state.remaining;
  state = tickClock(state, program, wait);
  return { id: 'pause', label: '暂停保持剩余时间', expected: '00:03', actual: pausedValue === 3 ? clockText(state.remaining) : `${clockText(pausedValue)} → ${clockText(state.remaining)}`, pass: pausedValue === 3 && state.remaining === 3,
    steps: ['从 5 秒开始', '推进 2 秒', '暂停并核对剩余值', `再推进 ${wait} 秒并核对`] };
}
export function acceptanceSuite(program: Program): TestEvidence[] {
  const pause = pauseProbe(program);
  let resumed = tickClock(startClock(newClock(), program), program, 2);
  resumed = pauseClock(resumed, program);
  resumed = tickClock(startClock(resumed, program), program, 1);
  const completed = tickClock(startClock(newClock(), program), program, 5);
  const duplicateEvent = finishClock(completed, program);
  return [pause,
    { id: 'resume', label: '继续从剩余时间开始', expected: '00:02', actual: clockText(resumed.remaining), pass: resumed.remaining === 2, steps: ['剩余 3 秒时暂停', '点击继续', '推进 1 秒'] },
    { id: 'notice', label: '到点只提醒一次', expected: '1 次', actual: `${duplicateEvent.notices} 次`, pass: duplicateEvent.notices === 1, steps: ['运行到 0', '再次收到完成事件', '检查提醒次数'] },
    { id: 'record', label: '同一轮只记录一次', expected: '1 轮', actual: `${duplicateEvent.rounds} 轮`, pass: duplicateEvent.rounds === 1, steps: ['完成一轮', '再次收到完成事件', '检查完成记录'] },
  ];
}
export function clockText(value: number) { return `00:${String(value).padStart(2, '0')}`; }
export function pauseSource(patch: PatchOp[]) { return ['function pauseTimer() {', '  running = false;', ...patch.map(op => `  ${PATCHES[op].code}`), '}']; }
