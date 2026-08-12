import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  Button,
  Callout,
  ContentBlock,
  NoticeStrip,
  Question,
  ValueTile,
  type QuestionCheckResult,
} from '../../shared/react';
import { usePersistedActivity } from '../components/usePersistedActivity';
import {
  EMPTY,
  createDemoGame,
  getWinDirection,
  type Cell,
} from '../model/gomokuEngine';
import {
  IMAGE_SIZE,
  KERNEL_SIZE,
  activationAt,
  cloneMatrix,
  createBinaryLayer,
  currentPatchMatrix,
  displayToBoardCell,
  dotProduct,
  getKernelForDirection,
  getTargetOppositeKernel,
  getTransformActionText,
  getTransformForDirection,
  matrixEquals,
  maxActivation,
  resolveLayerPlayer,
  toggleKernelCell,
  zeroKernel,
  type BinaryLayer,
  type ImageTransform,
  type Matrix,
  type ScanPosition,
} from '../model/kernelMath';
import type { GomokuSessionSnapshot } from '../model/sessionTypes';

type KernelPhase = 'scanOriginal' | 'designOpposite' | 'scanOpposite' | 'complete';

interface KernelState {
  game: GomokuSessionSnapshot;
  activeLayer: BinaryLayer;
  baseKernel: Matrix;
  designKernel: Matrix;
  scanPosition: ScanPosition;
  bestActivation: number;
  foundMaxActivation: boolean;
  kernelPhase: KernelPhase;
  imageTransform: ImageTransform;
  kernelQuestionPassed: boolean;
}

function demoSnapshot(): GomokuSessionSnapshot {
  const demo = createDemoGame();
  return {
    board: demo.board,
    moveHistory: demo.moveHistory,
    winner: demo.winner,
    winLine: demo.winLine,
  };
}

function createInitial(game: GomokuSessionSnapshot = demoSnapshot()): KernelState {
  const direction = getWinDirection(game.winLine);
  return {
    game,
    activeLayer: 'winner',
    baseKernel: getKernelForDirection(direction),
    designKernel: zeroKernel(),
    scanPosition: { row: 0, col: 0 },
    bestActivation: Number.NEGATIVE_INFINITY,
    foundMaxActivation: false,
    kernelPhase: 'scanOriginal',
    imageTransform: 'none',
    kernelQuestionPassed: false,
  };
}

function normalizeState(stored: unknown): KernelState | null {
  if (!stored || typeof stored !== 'object') return null;
  const value = stored as Partial<KernelState>;
  if (
    !value.game
    || !Array.isArray(value.game.board)
    || !Array.isArray(value.game.winLine)
    || value.game.winner === EMPTY
  ) return null;
  const initial = createInitial(value.game);
  const validMatrix = (matrix: unknown) => (
    Array.isArray(matrix)
    && matrix.length === KERNEL_SIZE
    && matrix.every((row) => Array.isArray(row) && row.length === KERNEL_SIZE)
  );
  return {
    ...initial,
    ...value,
    activeLayer: value.activeLayer === 'loser' ? 'loser' : 'winner',
    baseKernel: validMatrix(value.baseKernel) ? cloneMatrix(value.baseKernel as Matrix) : initial.baseKernel,
    designKernel: validMatrix(value.designKernel) ? cloneMatrix(value.designKernel as Matrix) : initial.designKernel,
    scanPosition: {
      row: Math.max(0, Math.min(IMAGE_SIZE - KERNEL_SIZE, Number(value.scanPosition?.row) || 0)),
      col: Math.max(0, Math.min(IMAGE_SIZE - KERNEL_SIZE, Number(value.scanPosition?.col) || 0)),
    },
    bestActivation: Number.isFinite(value.bestActivation) ? Number(value.bestActivation) : Number.NEGATIVE_INFINITY,
    foundMaxActivation: value.foundMaxActivation === true,
    kernelPhase: ['scanOriginal', 'designOpposite', 'scanOpposite', 'complete'].includes(String(value.kernelPhase))
      ? value.kernelPhase as KernelPhase
      : 'scanOriginal',
    imageTransform: ['none', 'flip', 'rotate'].includes(String(value.imageTransform))
      ? value.imageTransform as ImageTransform
      : 'none',
    kernelQuestionPassed: value.kernelQuestionPassed === true,
  };
}

function KernelGrid({
  matrix,
  editable = false,
  hitMatrix,
  onToggle,
  ariaLabel,
}: {
  matrix: Matrix;
  editable?: boolean;
  hitMatrix?: Matrix;
  onToggle?: (row: number, col: number) => void;
  ariaLabel: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <div
      className={`ck-kernel-grid ${editable ? 'ck-kernel-grid--editable' : ''} ${hitMatrix ? 'ck-kernel-grid--input' : ''}`}
      aria-label={ariaLabel}
    >
      {matrix.flatMap((row, rowIndex) => row.map((value, colIndex) => {
        const key = `${rowIndex}:${colIndex}`;
        const shown = editable && preview === key ? (value ? 0 : 1) : value;
        const className = [
          'ck-kernel-cell',
          shown ? 'is-one' : '',
          hitMatrix && value && hitMatrix[rowIndex]?.[colIndex] ? 'is-hit' : '',
          editable && preview === key && value === 0 ? 'is-preview-one' : '',
          editable && preview === key && value === 1 ? 'is-preview-zero' : '',
        ].filter(Boolean).join(' ');
        if (!editable) return <span className={className} key={key}>{shown}</span>;
        return (
          <button
            className={className}
            type="button"
            key={key}
            aria-label={`第 ${rowIndex + 1} 行第 ${colIndex + 1} 列，当前为 ${value}，点击切换为 ${value ? 0 : 1}`}
            onPointerEnter={() => setPreview(key)}
            onPointerLeave={() => setPreview(null)}
            onFocus={() => setPreview(key)}
            onBlur={() => setPreview(null)}
            onClick={() => onToggle?.(rowIndex, colIndex)}
          >
            {shown}
          </button>
        );
      }))}
    </div>
  );
}

export function KernelOperatorBlock({
  game,
  onComplete,
  lessonStepComplete = false,
  onKernelReady,
}: {
  game?: GomokuSessionSnapshot | null;
  onComplete: () => void;
  lessonStepComplete?: boolean;
  onKernelReady?: (kernel: Matrix) => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const calcPopoverRef = useRef<HTMLDivElement | null>(null);
  const calcCloseTimerRef = useRef<number | null>(null);
  const initialGameRef = useRef(game ?? demoSnapshot());
  const [calcOpen, setCalcOpen] = useState(false);
  const { state, stateRef, hydrated, setDraft, commit } = usePersistedActivity<KernelState>({
    stateKey: 'activity:convolution-kernel-operator',
    createInitial: () => createInitial(initialGameRef.current),
    normalizeState,
    getElement: () => rootRef.current,
  });

  useEffect(() => {
    if (!hydrated || !game || !stateRef.current) return;
    const current = stateRef.current;
    if (current.kernelPhase !== 'scanOriginal' || current.foundMaxActivation) return;
    const sameGame = JSON.stringify(current.game.winLine) === JSON.stringify(game.winLine)
      && current.game.moveHistory.length === game.moveHistory.length;
    if (!sameGame) setDraft(createInitial(game));
  }, [game, hydrated, setDraft, stateRef]);

  const derived = useMemo(() => {
    if (!state) return null;
    const direction = getWinDirection(state.game.winLine);
    const currentKernel = state.kernelPhase === 'scanOriginal'
      ? state.baseKernel
      : state.designKernel;
    const player = resolveLayerPlayer(state.game.winner, state.activeLayer);
    const binary = createBinaryLayer(state.game.board, player, state.imageTransform);
    const patch = currentPatchMatrix(
      state.game.board,
      player,
      state.scanPosition,
      state.imageTransform,
      KERNEL_SIZE,
    );
    const sum = dotProduct(currentKernel, patch);
    const maximum = maxActivation(
      state.game.board,
      player,
      currentKernel,
      state.imageTransform,
    );
    return {
      direction,
      currentKernel,
      player,
      binary,
      patch,
      sum,
      maximum,
      atMaximum: maximum > 0 && sum === maximum,
      target: getTargetOppositeKernel(direction, state.baseKernel),
    };
  }, [state]);

  useEffect(() => {
    if (!state || !state.kernelQuestionPassed) return;
    onKernelReady?.(cloneMatrix(state.designKernel));
  }, [onKernelReady, state?.kernelQuestionPassed]);

  useEffect(() => {
    if (!hydrated || !state?.kernelQuestionPassed || lessonStepComplete) return;
    onComplete();
  }, [hydrated, lessonStepComplete, onComplete, state?.kernelQuestionPassed]);

  useEffect(() => () => {
    if (calcCloseTimerRef.current !== null) {
      window.clearTimeout(calcCloseTimerRef.current);
    }
  }, []);

  useLayoutEffect(() => {
    if (!calcOpen || !rootRef.current || !calcPopoverRef.current) return;
    const card = rootRef.current.querySelector<HTMLElement>('.ck-operator-card');
    const button = card?.querySelector<HTMLElement>('.ck-process-btn');
    const popover = calcPopoverRef.current;
    if (!card || !button) return;

    const clamp = (value: number, minimum: number, maximum: number) => (
      Math.min(Math.max(value, minimum), maximum)
    );
    const positionPopover = () => {
      popover.style.left = '0px';
      popover.style.top = '0px';

      const cardRect = card.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const gap = 8;
      popover.style.maxHeight = `${Math.max(180, cardRect.height - gap * 2)}px`;

      const popoverRect = popover.getBoundingClientRect();
      let left = buttonRect.right - cardRect.left - popoverRect.width;
      let top = buttonRect.bottom - cardRect.top + gap;
      left = clamp(left, gap, Math.max(gap, cardRect.width - popoverRect.width - gap));
      if (top + popoverRect.height > cardRect.height - gap) {
        top = buttonRect.top - cardRect.top - popoverRect.height - gap;
      }
      top = clamp(top, gap, Math.max(gap, cardRect.height - popoverRect.height - gap));
      popover.style.left = `${left}px`;
      popover.style.top = `${top}px`;
    };

    positionPopover();
    window.addEventListener('resize', positionPopover);
    return () => window.removeEventListener('resize', positionPopover);
  }, [calcOpen, derived?.sum, state?.kernelPhase]);

  if (!hydrated || !state || !derived) {
    return <ContentBlock title="把刚刚这盘棋拆成两个 0/1 图">正在恢复算子实验状态…</ContentBlock>;
  }

  const designing = state.kernelPhase === 'designOpposite';
  const complete = state.kernelPhase === 'complete';
  const showQuestion = complete;
  const readout = state.kernelPhase === 'scanOriginal'
    ? derived.atMaximum
      ? `找到了。激活值达到 ${derived.maximum}。`
      : '拖动橙色窗口，继续寻找激活值更高的位置。'
    : state.kernelPhase === 'designOpposite'
      ? '观察图像中 1 的排列，再调整 5 × 5 小矩阵。'
      : state.kernelPhase === 'scanOpposite'
        ? derived.atMaximum
          ? `完成。新算子也找到了最大激活值 ${derived.maximum}。`
          : '反向算子已经生效。继续拖动，寻找激活值最大的区域。'
        : state.kernelQuestionPassed
          ? '你已经完成这一幕。可以切换赢家图和输家图，再向下进入下一幕。'
          : '你已经完成算子实验。请回答下方的单选题，再进入下一幕。';

  function scanPositionFromEvent(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(0.9999, (event.clientX - rect.left) / Math.max(1, rect.width)));
    const y = Math.max(0, Math.min(0.9999, (event.clientY - rect.top) / Math.max(1, rect.height)));
    const col = Math.floor(x * IMAGE_SIZE);
    const row = Math.floor(y * IMAGE_SIZE);
    return {
      row: Math.max(0, Math.min(IMAGE_SIZE - KERNEL_SIZE, row - 2)),
      col: Math.max(0, Math.min(IMAGE_SIZE - KERNEL_SIZE, col - 2)),
    };
  }

  function moveScan(position: ScanPosition) {
    const current = stateRef.current;
    if (!current || current.kernelPhase === 'designOpposite') return;
    const kernel = current.kernelPhase === 'scanOriginal' ? current.baseKernel : current.designKernel;
    const player = resolveLayerPlayer(current.game.winner, current.activeLayer);
    const value = activationAt(
      current.game.board,
      player,
      position.row,
      position.col,
      kernel,
      current.imageTransform,
    );
    setDraft({
      ...current,
      scanPosition: position,
      bestActivation: Math.max(current.bestActivation, value),
      foundMaxActivation: value === maxActivation(
        current.game.board,
        player,
        kernel,
        current.imageTransform,
      ) && value > 0,
    });
  }

  function finishScan() {
    const current = stateRef.current;
    if (!current || current.kernelPhase === 'designOpposite') return;
    const kernel = current.kernelPhase === 'scanOriginal' ? current.baseKernel : current.designKernel;
    const player = resolveLayerPlayer(current.game.winner, current.activeLayer);
    const value = activationAt(
      current.game.board,
      player,
      current.scanPosition.row,
      current.scanPosition.col,
      kernel,
      current.imageTransform,
    );
    const maximum = maxActivation(current.game.board, player, kernel, current.imageTransform);
    const reached = maximum > 0 && value === maximum;
    const nextPhase = current.kernelPhase === 'scanOpposite' && reached
      ? 'complete'
      : current.kernelPhase;
    commit('kernel_scan_committed', {
      ...current,
      bestActivation: Math.max(current.bestActivation, value),
      foundMaxActivation: reached,
      kernelPhase: nextPhase,
    }, {
      phase: current.kernelPhase,
      row: current.scanPosition.row,
      col: current.scanPosition.col,
      activation: value,
      maximum,
      reached_maximum: reached,
    });
  }

  function startOppositeDesign() {
    const current = stateRef.current;
    const currentDerived = derived;
    if (!current || !currentDerived || current.kernelPhase !== 'scanOriginal' || !currentDerived.atMaximum) return;
    setCalcOpen(false);
    const transform = getTransformForDirection(currentDerived.direction);
    commit('kernel_transform_started', {
      ...current,
      kernelPhase: 'designOpposite',
      imageTransform: transform,
      designKernel: zeroKernel(),
      scanPosition: { row: 0, col: 0 },
      bestActivation: Number.NEGATIVE_INFINITY,
      foundMaxActivation: false,
    }, { transform });
  }

  function toggleDesign(row: number, col: number) {
    const current = stateRef.current;
    if (!current || current.kernelPhase !== 'designOpposite') return;
    const nextKernel = toggleKernelCell(current.designKernel, row, col);
    const matches = matrixEquals(
      nextKernel,
      getTargetOppositeKernel(getWinDirection(current.game.winLine), current.baseKernel),
    );
    commit('kernel_design_cell_toggled', {
      ...current,
      designKernel: nextKernel,
      kernelPhase: matches ? 'scanOpposite' : 'designOpposite',
      scanPosition: matches ? { row: 0, col: 0 } : current.scanPosition,
      bestActivation: matches ? Number.NEGATIVE_INFINITY : current.bestActivation,
      foundMaxActivation: false,
    }, { row, col, value: nextKernel[row][col], design_complete: matches });
  }

  function handleQuestion(result: QuestionCheckResult) {
    if (!result.ok || stateRef.current?.kernelQuestionPassed) return;
    setDraft((current) => ({ ...current, kernelQuestionPassed: true }));
  }

  function cancelCalcClose() {
    if (calcCloseTimerRef.current === null) return;
    window.clearTimeout(calcCloseTimerRef.current);
    calcCloseTimerRef.current = null;
  }

  function scheduleCalcClose() {
    cancelCalcClose();
    calcCloseTimerRef.current = window.setTimeout(() => {
      setCalcOpen(false);
      calcCloseTimerRef.current = null;
    }, 120);
  }

  const winKeys = new Set(state.game.winLine.map((cell: Cell) => `${cell.row}:${cell.col}`));
  const transformText = getTransformActionText(derived.direction);

  return (
    <div ref={rootRef}>
      <ContentBlock
        className="edu-stage ck-matrix-stage"
        title="把刚刚这盘棋拆成两个 0/1 图"
        subtitle="我们可以用一个小矩阵去检测图像中出现的特定模式。这个矩阵的 1 要和刚才获胜连线的形状保持一致，拖动 5 × 5 窗口，找到激活值最大的地方。"
      >
        <div className="ck-matrix-layout">
          <section className="edu-card ck-matrix-card">
            <div className="ck-card-head">
              <h3 className="edu-panel-title">二值棋盘</h3>
              {complete && (
                <div className="ck-segmented" role="group" aria-label="切换二值棋盘图层">
                  <button className={state.activeLayer === 'winner' ? 'is-active' : ''} type="button" onClick={() => commit('kernel_layer_changed', (current) => ({ ...current, activeLayer: 'winner' }), { layer: 'winner' })}>赢家图</button>
                  <button className={state.activeLayer === 'loser' ? 'is-active' : ''} type="button" onClick={() => commit('kernel_layer_changed', (current) => ({ ...current, activeLayer: 'loser' }), { layer: 'loser' })}>输家图</button>
                </div>
              )}
            </div>
            <div
              className={`ck-binary-grid ${draggingRef.current ? 'is-dragging' : ''} ${designing ? 'is-locked' : ''}`}
              aria-label="带两圈零填充的二值棋盘"
              onPointerDown={(event) => {
                if (designing) return;
                draggingRef.current = true;
                event.currentTarget.setPointerCapture(event.pointerId);
                moveScan(scanPositionFromEvent(event));
              }}
              onPointerMove={(event) => {
                if (draggingRef.current) moveScan(scanPositionFromEvent(event));
              }}
              onPointerUp={(event) => {
                if (!draggingRef.current) return;
                draggingRef.current = false;
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
                finishScan();
              }}
              onPointerCancel={() => { draggingRef.current = false; }}
            >
              {derived.binary.flatMap((row, rowIndex) => row.map((value, colIndex) => {
                const localRow = rowIndex - state.scanPosition.row;
                const localCol = colIndex - state.scanPosition.col;
                const inWindow = !designing
                  && localRow >= 0 && localRow < KERNEL_SIZE
                  && localCol >= 0 && localCol < KERNEL_SIZE;
                const hit = inWindow
                  && value === 1
                  && derived.currentKernel[localRow]?.[localCol] === 1;
                return (
                  <span
                    key={`${rowIndex}:${colIndex}`}
                    className={[
                      'ck-binary-cell',
                      value ? 'is-one' : '',
                      rowIndex < 2 || colIndex < 2 || rowIndex >= 17 || colIndex >= 17 ? 'is-padding' : '',
                      inWindow ? 'is-window' : '',
                      inWindow && localRow === 2 && localCol === 2 ? 'is-window-center' : '',
                      hit ? 'is-kernel-hit' : '',
                      (() => {
                        const source = displayToBoardCell(rowIndex, colIndex, state.imageTransform);
                        return winKeys.has(`${source.row}:${source.col}`) ? 'is-win' : '';
                      })(),
                    ].filter(Boolean).join(' ')}
                  >
                    {value}
                  </span>
                );
              }))}
            </div>
          </section>
          <section className="edu-card ck-matrix-card ck-operator-card">
            {!designing && (
              <div className="ck-card-head ck-operator-title">
                <h3 className="edu-panel-title"><span>拖动左侧橙色窗口</span><span>寻找激活值最大的区域。</span></h3>
              </div>
            )}
            <div className={`ck-operator-workspace ${designing ? 'is-designing' : ''}`}>
              {!designing && (
                <div>
                  <span className="ck-mini-title">当前窗口</span>
                  <KernelGrid matrix={derived.patch} hitMatrix={derived.currentKernel} ariaLabel="棋盘当前五乘五窗口" />
                </div>
              )}
              {state.kernelPhase === 'scanOriginal' ? (
                <div>
                  <span className="ck-mini-title">5 × 5 算子</span>
                  <KernelGrid matrix={state.baseKernel} ariaLabel="五乘五检测算子" />
                </div>
              ) : (
                <div className={designing ? `is-designing-only ${state.designKernel.some((row) => row.some(Boolean)) ? 'has-input' : ''}` : undefined}>
                  {designing ? (
                    <div className="ck-design-task">
                      <strong>现在请点击下面的方格</strong>
                      <span>棋盘已经{transformText}。悬浮方格会临时切换 0/1，点击才会保存。</span>
                    </div>
                  ) : <span className="ck-mini-title">5 × 5 算子</span>}
                  <KernelGrid
                    matrix={state.designKernel}
                    editable={designing}
                    onToggle={toggleDesign}
                    ariaLabel={designing ? '可编辑的五乘五算子' : '已设计的五乘五算子'}
                  />
                </div>
              )}
            </div>
            {designing && (
              <Callout
                tone="blue"
                label="换个方向，还能检测到吗？"
                text="观察左侧图像中 1 的排列，再看看上面的算子：它们还能对齐吗？试着调整 5 × 5 小矩阵，让它对新的排列产生更强的响应。"
                className="ck-design-explain"
              />
            )}
            {!designing && (
              <>
                <div className="ck-activation-row">
                  <ValueTile tone="orange" label="当前激活值" value={derived.sum} />
                  <Button
                    variant="explain"
                    className="ck-process-btn"
                    aria-expanded={calcOpen}
                    aria-controls="ck-calc-popover"
                    onClick={() => {
                      cancelCalcClose();
                      setCalcOpen((open) => !open);
                    }}
                    onMouseEnter={() => {
                      cancelCalcClose();
                      setCalcOpen(true);
                    }}
                    onMouseLeave={scheduleCalcClose}
                    onFocus={() => {
                      cancelCalcClose();
                      setCalcOpen(true);
                    }}
                    onBlur={() => setCalcOpen(false)}
                  >计算过程</Button>
                </div>
                <NoticeStrip tone={derived.atMaximum || complete ? 'green' : 'orange'} className="ck-readout">{readout}</NoticeStrip>
                {state.kernelPhase === 'scanOriginal' && derived.atMaximum && (
                  <Button variant="primary" hint className="ck-pattern-btn" onClick={startOppositeDesign}>换一种模式试试吧</Button>
                )}
                {calcOpen && (
                  <div
                    ref={calcPopoverRef}
                    id="ck-calc-popover"
                    className="ck-operator-guide"
                    role="dialog"
                    aria-label="按位相乘再相加的计算过程"
                    onMouseEnter={cancelCalcClose}
                    onMouseLeave={scheduleCalcClose}
                  >
                    <h4>按位相乘再相加</h4>
                    <p className="edu-helper ck-calc-note">M 是 5 × 5 算子，X 是当前窗口；i、j 表示第 i 行第 j 列。</p>
                    <div className="ck-multiply-grid">
                      {derived.currentKernel.flatMap((row, rowIndex) => row.map((kernelValue, colIndex) => {
                        const inputValue = derived.patch[rowIndex]?.[colIndex] ?? 0;
                        const product = kernelValue * inputValue;
                        return <span className={`ck-multiply-cell ${product ? 'is-active' : ''}`} key={`${rowIndex}:${colIndex}`}><b>{product}</b><em>{kernelValue}×{inputValue}</em></span>;
                      }))}
                    </div>
                    <div className="ck-sum-line">Σ Mij × Xij = {derived.sum}</div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </ContentBlock>
      {showQuestion && (
        <div className="ck-kernel-question">
          <Question
            title="不同的算子，有什么不同的效果？"
            options={[
              { key: 'A', value: 'brightness-only', label: '只改变输出数值的范围。' },
              { key: 'B', value: 'position-only', label: '让同一特征出现在不同位置。' },
              { key: 'C', value: 'spatial-pattern', label: '突出不同方向或形状的特征。' },
              { key: 'D', value: 'same-sum', label: '权重总和相同，效果就相同。' },
            ]}
            answer="spatial-pattern"
            feedback={{
              correct: '正确。不同算子会突出不同的局部特征。',
              wrong: '再想想：算子的排列不同，关注的局部特征也不同。',
            }}
            persistenceKey="convolution-kernel-effect"
            onCheck={handleQuestion}
          />
        </div>
      )}
    </div>
  );
}
