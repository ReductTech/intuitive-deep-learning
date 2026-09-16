import { useState } from 'react';
import { Button, Callout, ContentBlock, Typography, ValueTile } from '../../../shared/react';
import { BinaryGrid } from '../../components/BinaryGrid';
import { GameReady } from '../../components/GameReady';
import { playerName, type GomokuGame } from '../../model/gomokuEngine';
import {
  IMAGE_PADDING,
  IMAGE_SIZE,
  buildDisplayCells,
  playerForLayer,
  winDirectionLabel,
  type LayerKey,
} from '../../model/kernelLab';
import '../ck-pages.css';
import './BinaryBoardPage.css';

const LAYERS: ReadonlyArray<{ key: LayerKey; label: string }> = [
  { key: 'winner', label: '赢家图' },
  { key: 'loser', label: '输家图' },
];

const POINTS: readonly string[] = [
  '15 × 15 的棋盘，本来就只是一张 15 行 15 列的数字表格。',
  '把「某一方的棋子」写成 1，其余格子写成 0，就得到一张 0 / 1 图。',
  '四周再补两圈 0，让 5 × 5 窗口也能落在最外圈的棋子上。',
];

export interface BinaryBoardPageProps {
  /** 两张图都看过以后进入扫描下一页。 */
  onComplete: () => void;
}

export function BinaryBoardPage({ onComplete }: BinaryBoardPageProps) {
  const [layer, setLayer] = useState<LayerKey>('winner');
  const [seen, setSeen] = useState<readonly LayerKey[]>(['winner']);

  const pickLayer = (key: LayerKey) => {
    setLayer(key);
    setSeen((current) => (current.includes(key) ? current : [...current, key]));
  };
  const bothSeen = seen.length === LAYERS.length;

  const renderPage = (game: GomokuGame) => {
    const player = playerForLayer(game.winner, layer);
    const cells = buildDisplayCells(game.board, player, {
      winLine: layer === 'winner' ? game.winLine : [],
    });
    const oneCount = cells.reduce((total, cell) => total + (cell.value ? 1 : 0), 0);
    return (
      <div className="ck-split">
        <section className="ck-figure-column" aria-label="0 / 1 棋盘">
          <div className="ck-switch" role="group" aria-label="选择图层">
            {LAYERS.map((item) => (
              <Button key={item.key} active={layer === item.key} onClick={() => pickLayer(item.key)}>
                {item.label}
              </Button>
            ))}
            <Typography variant="bodySmall" tone="muted">
              {game.winner === 0 ? '平局' : playerName(game.winner) + '的棋子写成 1'}
            </Typography>
          </div>
          <div className="ck-figure-area">
            <div className="ck-square-frame">
              <BinaryGrid
                cells={cells}
                windowTop={0}
                windowLeft={0}
                windowSize={5}
                showWindow={false}
                label={'补零后的 19 × 19 的 0 / 1 棋盘，' + (layer === 'winner' ? '赢家图' : '输家图')}
              />
            </div>
          </div>
        </section>

        <aside className="ck-side">
          <div className="ck-tile-row">
            <ValueTile label="棋盘" value="15 × 15" tone="blue" />
            <ValueTile label="补零后" value={IMAGE_SIZE + ' × ' + IMAGE_SIZE} />
            <ValueTile label="这一张图上的 1" value={oneCount} tone="orange" />
          </div>

          <section className="ck-card">
            <Typography as="h2" variant="h3" tone="accent">棋盘是怎么变成数字的</Typography>
            <ul className="ck-points">
              {POINTS.map((point) => (
                <Typography as="li" key={point} variant="bodySmall" tone="muted">{point}</Typography>
              ))}
            </ul>
            <Typography variant="bodySmall" tone="muted">
              补零圈里的格子不算棋子，它们只是让窗口有位置可站：{IMAGE_PADDING} 圈 × 2 + 15 = {IMAGE_SIZE}。
            </Typography>
          </section>

          <Callout
            tone="blue"
            label="刚才那五子连成的线"
            text={'这盘棋是' + winDirectionLabel(game.winLine) + '连成五子，所以赢家图里就有五个 1 排成同一个方向。'}
          />

          <div className="ck-actions">
            <Button variant="primary" disabled={!bothSeen} onClick={onComplete}>看懂了，继续</Button>
            {!bothSeen && (
              <Typography variant="bodySmall" tone="muted">另一张图也看过以后就可以继续。</Typography>
            )}
          </div>
        </aside>
      </div>
    );
  };

  return (
    <ContentBlock
      headingLevel={1}
      className="ck-page ck-page--binary"
      title="把刚刚这盘棋拆成两个 0 / 1 图"
      subtitle="计算机不认识棋子，它只认识数字。先看清楚棋盘变成数字表格以后是什么样子。"
    >
      <GameReady>{renderPage}</GameReady>
    </ContentBlock>
  );
}

