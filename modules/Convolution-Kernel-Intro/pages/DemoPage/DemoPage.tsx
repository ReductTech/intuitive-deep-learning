import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
import { GomokuBoard } from '../../components/GomokuBoard';
import { HUMAN, demoWinGame } from '../../model/gomokuEngine';
import {
  IMAGE_SIZE,
  KERNEL_SIZE,
  activationAt,
  kernelForWinDirection,
} from '../../model/kernelLab';
import { DemoFocusGrid } from './DemoFocusGrid';
import '../ck-pages.css';
import './DemoPage.css';

/** 扫完一整张表的时长；按时间推进，慢机器上也不会越扫越久。 */
const SCAN_DURATION_MS = 5600;
const TICK_MS = 60;
/** 扫完之后停一拍，再让窗口跳到吻合得最好的那一格。 */
const REVEAL_DELAY_MS = 900;
/** 结果留在屏幕上，再交给课程流程。 */
const COMPLETE_DELAY_MS = 3200;

/** 这页只看不下棋，棋盘的回调接口留一个空实现。 */
const ignorePlace = () => {};

export interface DemoPageProps {
  /** 结果揭晓后通知课程流程，把学习者带到第一幕。 */
  onComplete: () => void;
}

/**
 * 开场演示：同一局棋，人看到的是棋盘，计算机看到的是一张 0 / 1 表。
 * 一块 5 × 5 的小窗口在表上逐格移动，窗口以外的数字淡下去，命中的格子亮起来。
 */
export function DemoPage({ onComplete }: DemoPageProps) {
  const game = useMemo(() => demoWinGame(), []);
  const kernel = useMemo(() => kernelForWinDirection(game.winLine), [game]);

  // 窗口可以停的每一个位置，按行优先排好，动画只是在这条线上往前走。
  const positions = useMemo(() => {
    const max = IMAGE_SIZE - KERNEL_SIZE;
    const list: { top: number; left: number }[] = [];
    for (let top = 0; top <= max; top += 1) {
      for (let left = 0; left <= max; left += 1) list.push({ top, left });
    }
    return list;
  }, []);
  const total = positions.length;
  const best = useMemo(() => {
    let bestSpot = positions[0];
    let bestValue = -1;
    positions.forEach((spot) => {
      const value = activationAt(game.board, HUMAN, 'none', spot.top, spot.left, kernel);
      if (value > bestValue) {
        bestValue = value;
        bestSpot = spot;
      }
    });
    return bestSpot;
  }, [game, kernel, positions]);

  const [progress, setProgress] = useState(0);
  const [runId, setRunId] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const anchorRef = useRef(0);
  const reportedRef = useRef(false);
  const completeRef = useRef(onComplete);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    anchorRef.current = window.performance.now();
    const timer = window.setInterval(() => {
      const elapsed = window.performance.now() - anchorRef.current;
      const next = Math.min(total, (elapsed / SCAN_DURATION_MS) * total);
      setProgress(next);
      if (next >= total) window.clearInterval(timer);
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [runId, total]);

  const settled = progress >= total;
  const window0 = revealed ? best : positions[Math.max(0, Math.min(total - 1, Math.ceil(progress) - 1))];

  useEffect(() => {
    if (!settled) return undefined;
    const timer = window.setTimeout(() => setRevealed(true), REVEAL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [settled]);

  useEffect(() => {
    if (!revealed || reportedRef.current) return undefined;
    const timer = window.setTimeout(() => {
      reportedRef.current = true;
      completeRef.current();
    }, COMPLETE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [revealed]);

  const replay = () => {
    setProgress(0);
    setRevealed(false);
    setRunId((value) => value + 1);
  };

  return (
    <ContentBlock
      headingLevel={1}
      className="ck-page ck-page--demo"
      title="卷积核，本质上是在识别局部模式"
      subtitle="以棋盘为例，人看到的是局面，计算机识别的是可匹配的局部结构"
    >
      <div className="ck-demo-stage">
        <figure className="ck-demo-card">
          <figcaption className="ck-demo-card-head">
            <span className="ck-demo-card-mark" aria-hidden="true" />
            <Typography as="span" variant="h3" tone="accent">人眼看到的棋盘</Typography>
          </figcaption>
          <div className="ck-demo-card-body">
            <div className="ck-square-frame">
              <GomokuBoard
                board={game.board}
                winLine={revealed ? game.winLine : []}
                lastMove={null}
                interactive={false}
                onPlace={ignorePlace}
              />
            </div>
          </div>
        </figure>

        <div className="ck-demo-bridge">
          <Typography variant="body" tone="muted" align="center">局部模式</Typography>
          <svg className="ck-demo-arrow" viewBox="0 0 120 24" role="presentation">
            <path d="M0 9h86v-9l34 12-34 12v-9h-86z" />
          </svg>
          <Typography variant="body" tone="muted" align="center">数值表示</Typography>
        </div>

        <figure className="ck-demo-card">
          <figcaption className="ck-demo-card-head">
            <span className="ck-demo-card-mark" aria-hidden="true" />
            <Typography as="span" variant="h3" tone="accent">计算机识别的模式区域</Typography>
          </figcaption>
          <div className="ck-demo-card-body">
            <div className="ck-square-frame">
              <DemoFocusGrid
                board={game.board}
                kernel={kernel}
                windowTop={window0.top}
                windowLeft={window0.left}
                windowSize={KERNEL_SIZE}
                winLine={revealed ? game.winLine : []}
                badge={revealed
                  ? <Typography as="span" variant="bodySmall" tone="inherit">局部命中</Typography>
                  : undefined}
                label="卷积核通过滑动匹配，在全局中定位重复出现的局部模式。"
              />
            </div>
          </div>
        </figure>
      </div>

      <div className="ck-demo-foot">
        <Typography variant="subtitle" tone="main" align="center" className="ck-demo-line">
          卷积核就是一个会滑动的小窗口，专门寻找反复出现的局部模式。
        </Typography>
        <span className="ck-demo-line-mark" aria-hidden="true" />
        <div className="ck-demo-replay">
          <Button onClick={replay}>重播</Button>
        </div>
      </div>
    </ContentBlock>
  );
}
