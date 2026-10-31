import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Button } from '../../shared/react/controls/Button';
import { Typography } from '../../shared/react/typography/Typography';
import { Frame, ReferenceVisual, Text } from '../components/Diagrams';
import { LessonSplit, TeachingPanel } from '../components/TeachingPanel';
import './TextCrossAttention.css';

const side = 16;
const regions = [
  { id: 'face', label: '猫脸', col: 5, row: 5, weights: [.78,.12,.1] },
  { id: 'book', label: '书页', col: 11, row: 12, weights: [.08,.3,.62] },
  { id: 'background', label: '背景', col: 1, row: 1, weights: [.2,.55,.25] },
];
const clamp = (v: number) => Math.max(0, Math.min(side - 1, v));

function association(col: number, row: number) {
  // Compact spatial blends of three teaching examples, not model attention.
  const face = Math.max(0, 1 - Math.hypot(col - 5, row - 5) / 4);
  const book = Math.max(0, 1 - Math.hypot(col - 11, row - 12) / 4.5);
  const background = 1 - face - book;
  const raw = [0,1,2].map(i => regions[0].weights[i] * face + regions[1].weights[i] * book + regions[2].weights[i] * background);
  const first = Math.round(raw[0] * 100), second = Math.round(raw[1] * 100);
  return { weights: [first, second, 100 - first - second], label: face > .3 ? '猫脸附近' : book > .3 ? '书页附近' : '背景位置' };
}

export function TextCrossAttention() {
  const [query, setQuery] = useState({ col: 5, row: 5 });
  const [dragging, setDragging] = useState(false);
  const pointer = useRef<number | null>(null);
  const [word, setWord] = useState(0);
  const current = association(query.col, query.row);
  const locate = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setQuery({ col: clamp(Math.floor((event.clientX - rect.left) / rect.width * side)), row: clamp(Math.floor((event.clientY - rect.top) / rect.height * side)) });
  };
  const release = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const moveWithKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta: Record<string, [number, number]> = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1] };
    if (!(event.key in delta) && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === 'Home' || event.key === 'End') {
      const edge = event.key === 'Home' ? 0 : side - 1;
      setQuery({ col: edge, row: edge });
    } else {
      const [dc, dr] = delta[event.key];
      setQuery(q => ({ col: clamp(q.col + dc), row: clamp(q.row + dr) }));
    }
  };
  return <Frame index={3} subtitle="移动特征图上的 Query，观察它从文字中读取什么" takeaway="视觉位置提供 Query，文本提供 Key / Value；每个位置可以读取不同的文本信息。">
    <LessonSplit equal className="vga-attention-layout">
      <TeachingPanel title="① 移动视觉位置 · Query" className="vga-query-panel">
        <div className={'vga-query-surface' + (dragging ? ' is-dragging' : '')} role="group" tabIndex={0} aria-label="视觉特征图，点击或拖动移动 Query，也可用方向键逐格移动" aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Home End" data-testid="query-surface" data-query-col={query.col} data-query-row={query.row}
          onPointerDown={event => { if (!event.isPrimary || event.button !== 0) return; event.preventDefault(); event.currentTarget.focus({preventScroll: true}); pointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); locate(event); }}
          onPointerMove={event => { if (pointer.current === event.pointerId) locate(event); }}
          onPointerUp={event => { if (pointer.current === event.pointerId) locate(event); release(event); }}
          onPointerCancel={release} onLostPointerCapture={() => {pointer.current = null; setDragging(false);}} onKeyDown={moveWithKeys}>
          <ReferenceVisual name="attention-feature" alt="小猫与书本的视觉特征图，原图中的橙框是参考区域" />
          <div className="vga-query-marker" data-testid="query-marker" style={{left: `${query.col / side * 100}%`, top: `${query.row / side * 100}%`}} aria-hidden="true" />
          <div className="vga-query-tag" style={{left: `${Math.min(query.col, 13) / side * 100}%`, top: `${(query.row >= 2 ? query.row - 2 : query.row + 1) / side * 100}%`}} aria-hidden="true"><Typography as="span" variant="bodySmall" tone="inherit">Q</Typography></div>
        </div>
        <Typography variant="bodySmall" tone="accent" data-testid="query-position">Query · 第 {query.row + 1} 行，第 {query.col + 1} 列</Typography>
        <div className="vga-stage-tabs">{regions.map(r => <Button key={r.id} data-testid={`region-${r.id}`} active={query.col === r.col && query.row === r.row} aria-pressed={query.col === r.col && query.row === r.row} aria-label={`定位到${r.label}`} onClick={() => setQuery({col: r.col, row: r.row})}>{r.label}</Button>)}</div>
        <Text muted>点击定位，拖动或用方向键移动。</Text>
      </TeachingPanel>
      <TeachingPanel title="② 读取文本信息 · Key / Value" className="vga-text-panel">
        <Typography variant="h3" tone="accent">{current.label}正在读取文本</Typography>
        <div className="vga-weights">{['小猫','学习','书本'].map((w,i) => <div className="vga-weight-row" key={w}><Button active={word === i} onClick={() => setWord(i)}>{w}</Button><div className="vga-weight-track"><div style={{ width: `${current.weights[i]}%` }} /></div><Typography variant="bodySmall" data-testid={`query-weight-${i}`}>{current.weights[i]}%</Typography></div>)}</div>
        <div className="vga-panel-callout"><Text>当前位置 → {['小猫','学习','书本'][word]}：{current.weights[word]}%</Text><Text muted>Query 移动，文本关联随之变化。</Text></div>
        <Text muted>16 × 16 位置网格与权重插值为教学示意，合计 100%；不执行真实模型。</Text>
      </TeachingPanel>
    </LessonSplit>
  </Frame>;
}
