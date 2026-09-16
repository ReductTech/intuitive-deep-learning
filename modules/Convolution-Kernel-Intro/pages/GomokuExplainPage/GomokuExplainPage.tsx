import { useState } from 'react';
import {
  Button,
  Callout,
  ContentBlock,
  Question,
  Typography,
  ValueTile,
  type QuestionCheckResult,
} from '../../../shared/react';
import { GomokuBoard } from '../../components/GomokuBoard';
import { useKernelLesson } from '../../LessonContext';
import { demoWinGame, playerName } from '../../model/gomokuEngine';
import { winDirectionLabel } from '../../model/kernelLab';
import './GomokuExplainPage.css';

const WRITE_HINTS: readonly string[] = [
  '棋盘在程序里是什么样子？',
  '要检查哪几个方向？',
  '怎样才算「连成五子」？',
];

const CHECK_POINTS: readonly string[] = [
  '棋盘可以表示成二维数组或矩阵。',
  '每个格子存储空、黑子、白子这样的状态。',
  '每次落子后，沿横向、竖向、两条斜线四个方向检查。',
  '在同一方向上把正反两边连续同色棋子加起来，再加当前棋子。',
  '连续同色棋子数量达到 5，就判定对应玩家获胜。',
];

export interface GomokuExplainPageProps {
  /** 学习者提交解释后进入下一页。 */
  onComplete: () => void;
}

export function GomokuExplainPage({ onComplete }: GomokuExplainPageProps) {
  const { game, updateGame } = useKernelLesson();
  const [submitted, setSubmitted] = useState(false);
  const finished = game.gameOver && game.winner !== 0;

  const handleCheck = (result: QuestionCheckResult) => {
    if (!result.answer.some((value) => value.trim())) return;
    setSubmitted(true);
    onComplete();
  };

  return (
    <ContentBlock
      headingLevel={1}
      className="ck-page ck-page--explain"
      title="计算机刚才是怎么判断胜负的？"
      subtitle="先用你自己的话说一遍这段过程。说出来以后，我们再把它变成真正的数字。"
    >
      <div className="ck-explain-layout">
        <section className="ck-explain-board-column" aria-label="终局棋盘">
          {finished ? (
            <div className="ck-explain-scorebar">
              <ValueTile label="获胜方" value={playerName(game.winner)} tone="orange" />
              <ValueTile label="连成方向" value={winDirectionLabel(game.winLine)} tone="blue" />
              <ValueTile label="连成棋子" value={game.winLine.length} tone="success" />
            </div>
          ) : (
            <div className="ck-explain-fallback">
              <Callout
                tone="orange"
                label="还没有分出胜负"
                text="可以回到上一页把这盘棋下完，或者直接加载一个已经结束的示例棋局。"
              />
              <Button variant="primary" onClick={() => updateGame(() => demoWinGame())}>加载示例棋局</Button>
            </div>
          )}
          <div className="ck-explain-board">
            <GomokuBoard
              board={game.board}
              winLine={game.winLine}
              lastMove={game.lastMove}
              interactive={false}
              onPlace={() => undefined}
            />
          </div>
        </section>

        <aside className="ck-explain-side">
          <section className="ck-explain-card">
            {submitted ? (
              <>
                <Typography as="h2" variant="h3" tone="accent">常见的解释会提到这几点</Typography>
                <ul className="ck-explain-points">
                  {CHECK_POINTS.map((point) => (
                    <Typography as="li" key={point} variant="bodySmall" tone="muted">{point}</Typography>
                  ))}
                </ul>
                <Callout
                  tone="blue"
                  label="下一页"
                  text="把这些说法变成看得见的东西：棋盘 → 0/1 表格 → 5 × 5 窗口扫描。"
                />
              </>
            ) : (
              <>
                <Typography as="h2" variant="h3" tone="accent">写之前想一想</Typography>
                <ul className="ck-explain-points">
                  {WRITE_HINTS.map((point) => (
                    <Typography as="li" key={point} variant="bodySmall" tone="muted">{point}</Typography>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="ck-explain-card">
            <Question
              type="short"
              title="请用自己的话解释：计算机怎样判断这盘棋的胜负？"
              rows={4}
              submitText="提交我的解释"
              textVariant="bodySmall"
              persistenceKey="convolution-kernel-intro-gomoku-explain-v1"
              feedback={{
                initial: '不用追求术语准确，写清楚「看哪里、看什么」就够了。',
                empty: '先写几句你的想法，再提交。',
                sample: '你的解释已经记录。下一页开始，我们把棋盘变成数字，再回头对照这段话。',
              }}
              onCheck={handleCheck}
            />
          </section>
        </aside>
      </div>
    </ContentBlock>
  );
}
