import { useEffect, useMemo, useState } from 'react';
import { Button, ContentBlock, ExplainPanelButton, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import './NineGridFeaturePage.css';
import { NINE_GRID_EDGES, NINE_GRID_IMAGE_URL, nineGridCounts, nineGridRegionCells, readNineGridPixels } from '../../services/nineGridDigit';

export function NineGridFeaturePage() {
  const [pixels, setPixels] = useState<boolean[] | null>(null);
  const [region, setRegion] = useState(0);
  const [counted, setCounted] = useState(0);
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      setPixels(readNineGridPixels(image));
    };
    image.src = NINE_GRID_IMAGE_URL;
    return () => { active = false; image.onload = null; };
  }, []);

  const counts = useMemo(() => pixels ? nineGridCounts(pixels) : null, [pixels]);
  const shownRegion = Math.min(region, 8);
  const cells = useMemo(() => pixels ? nineGridRegionCells(pixels, shownRegion) : [], [pixels, shownRegion]);
  const cols = NINE_GRID_EDGES[shownRegion % 3 + 1] - NINE_GRID_EDGES[shownRegion % 3];
  const rows = NINE_GRID_EDGES[Math.floor(shownRegion / 3) + 1] - NINE_GRID_EDGES[Math.floor(shownRegion / 3)];
  const quiz = region === 4 && !solved;
  const finished = region === 9;

  useEffect(() => {
    if (!counts || region >= 9 || quiz) return;
    const target = counts[region];
    const timer = window.setTimeout(() => {
      if (counted < target) {
        setCounted((value) => value + 1);
      } else {
        setRegion((value) => value + 1);
        setCounted(0);
      }
    }, counted < target ? 85 : target === 0 ? 850 : 620);
    return () => window.clearTimeout(timer);
  }, [counts, region, counted, quiz]);

  function markCell(index: number) {
    if (!counts || !quiz || marked.has(index)) return;
    const next = new Set(marked);
    next.add(index);
    setMarked(next);
    if (next.size === counts[4]) {
      setSolved(true);
      setCounted(counts[4]);
    }
  }

  function replay() {
    setRegion(0);
    setCounted(0);
    setMarked(new Set());
    setSolved(false);
  }

  return <ContentBlock
    className="vfl-nine-grid-page"
    headingLevel={1}
    title="九宫格区域统计特征"
    subtitle="将 28 × 28 图像划分为 3 × 3 个区域，用各区域的墨迹像素数描述空间分布。"
  >
    <div className="vfl-nine-grid-main">
      <section className="vfl-nine-grid-source vfl-nine-grid-card" aria-label="完整图像和九个区域">
        <div className="vfl-nine-grid-source-heading">
          <Typography as="h2" variant="h3" tone="accent">28 × 28 手写数字图像</Typography>
        </div>
        <div className="vfl-nine-grid-image">
          <img src={NINE_GRID_IMAGE_URL} alt="真实 MNIST 手写数字 2，划分为九个区域" />
          <div className="vfl-nine-grid-regions" aria-label="按从左到右、从上到下编号的九个区域">
            {Array.from({ length: 9 }, (_, index) => <div key={index} className={`vfl-nine-grid-region ${index === region ? 'is-current' : ''}`}>
              <Typography as="span" variant="bodySmall" tone="inherit" className="vfl-nine-grid-region-number">{index + 1}</Typography>
              {counts && index < region && <Typography as="span" variant="h3" tone="inherit" className="vfl-nine-grid-region-count">{counts[index]}</Typography>}
            </div>)}
          </div>
        </div>
      </section>
      <section className={`vfl-nine-grid-detail vfl-nine-grid-card ${quiz ? 'is-quiz' : ''}`} aria-label="放大的当前区域">
        <div className="vfl-nine-grid-detail-heading">
          <Typography as="span" variant="h2" tone="inherit" className="vfl-nine-grid-active-number">{shownRegion + 1}</Typography>
          <Typography as="h2" variant="h2" tone="inherit">第 {shownRegion + 1} 区域 · 逐像素计数</Typography>
        </div>
        <div className="vfl-nine-grid-detail-body">
          <div className="vfl-nine-grid-pixels" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }} role="group" aria-label={`第 ${shownRegion + 1} 格放大后的像素网格`}>
            {cells.map((cell, index) => {
              const lit = cell.ink && (quiz ? marked.has(index) : cell.rank < counted || finished);
              const className = `vfl-nine-grid-pixel ${cell.ink ? lit ? 'is-counted' : 'is-ink' : ''}`;
              return quiz && cell.ink ? <button key={`${cell.x}-${cell.y}`} type="button" className={className}
                aria-label={`第 ${cell.y - NINE_GRID_EDGES[1] + 1} 行第 ${cell.x - NINE_GRID_EDGES[1] + 1} 列墨迹${marked.has(index) ? '，已标记' : ''}`}
                aria-pressed={marked.has(index)} onClick={() => markCell(index)} /> : <div key={`${cell.x}-${cell.y}`} className={className} aria-hidden="true" />;
            })}
          </div>
          <div className={`vfl-nine-grid-counter ${quiz ? 'is-quiz' : ''}`} role="status" aria-live={quiz ? 'polite' : 'off'}>
            <Typography variant="h3" tone="accent">{finished ? '统计完成' : quiz ? '请你来数' : '已计数'}</Typography>
            <Typography as="strong" variant="display" tone="inherit" className="vfl-nine-grid-counter-value">{String(finished ? counts?.[8] ?? 0 : quiz ? marked.size : counted).padStart(2, '0')}</Typography>
            <div className="vfl-nine-grid-counter-rule"/>
            <Typography variant="bodySmall" tone="accent">{finished ? '九项区域计数，组成下方特征向量。' : quiz ? <>点击深色像素。<br/>点完自动继续。</> : '橙色表示已计数的墨迹像素。'}</Typography>
            {finished && <Button onClick={replay}>重新播放</Button>}
          </div>
        </div>
      </section>
    </div>
    <div className="vfl-nine-grid-footer">
      <div className="vfl-nine-grid-vector">
        <div className="vfl-nine-grid-vector-label">
          <div><Typography as="span" variant="h3" tone="accent">九维特征向量</Typography><Typography variant="bodySmall" tone="accent">各区域墨迹像素数</Typography></div>
          <ExplainPanelButton label="说明九维特征向量及排列顺序">
            <Typography variant="bodySmall" tone="muted">每一维记录一个区域的前景像素数。</Typography>
            <Typography variant="bodySmall" tone="muted">从左到右、从上到下只是常用约定。各维可以统一重新排列，但所有样本及训练、预测必须采用相同顺序，保证每一维对应同一区域。</Typography>
          </ExplainPanelButton>
        </div>
        <span className="vfl-nine-grid-vector-arrow" aria-hidden="true" />
        <MathFormulaBlock className="vfl-nine-grid-vector-formula" ariaLabel="按区域一至九依次填入统计结果的九维特征向量">
          <MathFormulaStatic latex={'\\mathbf{x}=\\lbrack'} />
          {Array.from({ length: 9 }, (_, index) => {
            const complete = !!counts && (index < region || index === region && !quiz && counted >= counts[index]);
            return <span key={index} className="vfl-nine-grid-vector-entry">
              <span className={`vfl-nine-grid-vector-slot ${!complete && index === region ? 'is-pending' : ''}`} aria-label={`第 ${index + 1} 维：${complete ? counts![index] : '待统计'}`}>
                <MathFormulaStatic latex={complete ? String(counts![index]) : '\\underline{\\phantom{00}}'} />
              </span>
              {index < 8 && <MathFormulaStatic latex="," />}
            </span>;
          })}
          <MathFormulaStatic latex={'\\rbrack'} />
        </MathFormulaBlock>
      </div>
    </div>
  </ContentBlock>;
}
