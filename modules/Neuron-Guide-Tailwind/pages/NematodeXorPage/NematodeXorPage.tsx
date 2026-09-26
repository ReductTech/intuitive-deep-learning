import { useEffect, useMemo, useRef, useState } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import wormStill from '../../assets/worm_1.png';
import wormTurn from '../../assets/worm_2.png';
import './NematodeXorPage.css';

interface NematodeXorPageProps { onComplete?: () => void; }

interface CaseState {
  id: string;
  left: 0 | 1;
  right: 0 | 1;
  action: '转向' | '不转向';
}

interface LinePoint {
  x: number;
  y: number;
}

function clipHalfPlane(start: LinePoint, end: LinePoint, keepPositive: boolean) {
  const corners: LinePoint[] = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }];
  const side = (point: LinePoint) => (end.x - start.x) * (point.y - start.y) - (end.y - start.y) * (point.x - start.x);
  const isInside = (value: number) => keepPositive ? value >= 0 : value <= 0;
  const clipped: LinePoint[] = [];

  corners.forEach((current, index) => {
    const previous = corners[(index + corners.length - 1) % corners.length];
    const currentSide = side(current);
    const previousSide = side(previous);
    const currentInside = isInside(currentSide);
    const previousInside = isInside(previousSide);
    if (currentInside !== previousInside) {
      const ratio = previousSide / (previousSide - currentSide);
      clipped.push({
        x: previous.x + (current.x - previous.x) * ratio,
        y: previous.y + (current.y - previous.y) * ratio,
      });
    }
    if (currentInside) clipped.push(current);
  });

  return clipped.map((point) => `${point.x},${point.y}`).join(' ');
}

const cases: CaseState[] = [
  { id: '00', left: 0, right: 0, action: '不转向' },
  { id: '10', left: 1, right: 0, action: '转向' },
  { id: '01', left: 0, right: 1, action: '转向' },
  { id: '11', left: 1, right: 1, action: '不转向' },
];

function pointPosition(left: number, right: number) {
  return { left: `${16 + left * 68}%`, top: `${16 + (1 - right) * 68}%` };
}

function StimulusCue({ side, active }: { side: '左侧' | '右侧'; active: boolean }) {
  return (
    <div className={`ngtw-nematode-xor__cue grid min-w-0 justify-items-center gap-0 text-center${active ? ' is-active' : ''}`}>
      <span className="ngtw-nematode-xor__cue-icon grid min-w-[34px] h-[34px] place-items-center rounded-[50%]" aria-hidden="true">{active ? ')))' : '○'}</span>
      <Typography as="span" variant="bodySmall" tone={active ? 'accent' : 'muted'}>{side}</Typography>
      <Typography as="strong" variant="bodySmall" tone={active ? 'accent' : 'muted'}>{active ? '有刺激' : '无刺激'}</Typography>
    </div>
  );
}

function CaseCard({ item, selected, onSelect, index }: { item: CaseState; selected: boolean; onSelect: () => void; index: number }) {
  const isTurn = item.action === '转向';
  return (
    <button type="button" className={`ngtw-nematode-xor__case grid min-w-0 min-h-0 max-w-full grid-rows-[auto_minmax(0,_1fr)_auto] gap-[6px] p-[10px_12px] ${isTurn ? 'is-turn' : 'is-stay'}${selected ? ' is-selected' : ''}`} onClick={onSelect} aria-pressed={selected}>
      <div className="ngtw-nematode-xor__case-head grid min-w-0 grid-cols-[43px_minmax(0,_1fr)] items-start gap-[9px] text-left">
        <Typography as="span" variant="body" tone="inherit" className="ngtw-nematode-xor__case-number">{index + 1}</Typography>
        <div>
          <Typography as="strong" variant="bodySmall" tone="main">左侧{item.left ? '有' : '无'}刺激，右侧{item.right ? '有' : '无'}刺激</Typography>
          <Typography as="code" variant="bodySmall" tone="accent" wrap="nowrap">x₁ = {item.left}　 x₂ = {item.right}</Typography>
        </div>
      </div>
      <div className="ngtw-nematode-xor__case-scene grid min-w-0 min-h-0 grid-cols-[minmax(0,_.72fr)_minmax(78px,_1.3fr)_minmax(0,_.72fr)] items-center gap-[5px]">
        <StimulusCue side="左侧" active={Boolean(item.left)} />
        <img className={`ngtw-nematode-xor__worm block w-full h-[86px] max-w-[150px] justify-self-center${isTurn && item.right ? ' is-flipped' : ''}`} src={isTurn ? wormTurn : wormStill} alt={isTurn ? '正在转向的秀丽隐杆线虫' : '没有转向的秀丽隐杆线虫'} />
        <StimulusCue side="右侧" active={Boolean(item.right)} />
      </div>
      <Typography as="strong" variant="body" tone={isTurn ? 'success' : 'warning'} className="ngtw-nematode-xor__case-action">{item.action}</Typography>
    </button>
  );
}

function DecisionMap({ start, end, classified, touched, onChange }: { start: LinePoint; end: LinePoint; classified: Array<CaseState & { correct: boolean }>; touched: boolean; onChange: (target: 'start' | 'end', point: LinePoint) => void }) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<'start' | 'end' | null>(null);
  const updatePoint = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current || !mapRef.current) return;
    const bounds = mapRef.current.getBoundingClientRect();
    onChange(dragRef.current, {
      x: Math.max(2, Math.min(98, (event.clientX - bounds.left) / bounds.width * 100)),
      y: Math.max(2, Math.min(98, (event.clientY - bounds.top) / bounds.height * 100)),
    });
  };
  const handleKeyDown = (target: 'start' | 'end', point: LinePoint) => (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const movement = 2;
    const next = { ...point };
    if (event.key === 'ArrowLeft') next.x -= movement;
    else if (event.key === 'ArrowRight') next.x += movement;
    else if (event.key === 'ArrowUp') next.y -= movement;
    else if (event.key === 'ArrowDown') next.y += movement;
    else return;
    event.preventDefault();
    onChange(target, { x: Math.max(2, Math.min(98, next.x)), y: Math.max(2, Math.min(98, next.y)) });
  };
  return (
    <div ref={mapRef} className="ngtw-nematode-xor__map relative min-w-0 min-h-0 max-w-full m-[6px_26px_66px_82px] bg-[#fff] overflow-visible" aria-label="左右刺激与转向结果的输入空间">
      <svg className="ngtw-nematode-xor__decision-regions absolute inset-0 w-full h-full max-w-full overflow-hidden" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polygon className="is-turn" points={clipHalfPlane(start, end, false)} />
        <polygon className="is-stay" points={clipHalfPlane(start, end, true)} />
      </svg>
      <div className="ngtw-nematode-xor__map-grid absolute inset-0" aria-hidden="true" />
      <Typography as="span" variant="bodySmall" tone="muted" className="ngtw-nematode-xor__axis-label ngtw-nematode-xor__axis-label--x">左侧刺激 x₁</Typography>
      <Typography as="span" variant="bodySmall" tone="muted" className="ngtw-nematode-xor__axis-label ngtw-nematode-xor__axis-label--y">右侧刺激 x₂</Typography>
      <Typography as="span" variant="bodySmall" tone="main" className="ngtw-nematode-xor__tick ngtw-nematode-xor__tick--x0">0</Typography>
      <Typography as="span" variant="bodySmall" tone="main" className="ngtw-nematode-xor__tick ngtw-nematode-xor__tick--x1">1</Typography>
      <Typography as="span" variant="bodySmall" tone="main" className="ngtw-nematode-xor__tick ngtw-nematode-xor__tick--y0">0</Typography>
      <Typography as="span" variant="bodySmall" tone="main" className="ngtw-nematode-xor__tick ngtw-nematode-xor__tick--y1">1</Typography>
      {classified.map((item) => (
        <div key={item.id} className={`ngtw-nematode-xor__point absolute grid min-w-0 justify-items-center gap-[5px] ngtw-nematode-xor__point--${item.action === '转向' ? 'turn' : 'stay'} ${item.correct ? 'is-correct' : 'is-wrong'}`} style={pointPosition(item.left, item.right)}>
          <span className="ngtw-nematode-xor__point-marker relative block w-[25px] h-[25px]"><i aria-hidden="true" />{!item.correct && <b className="ngtw-nematode-xor__point-error absolute inset-0 grid place-items-center" aria-label="判断错误">×</b>}</span>
          <Typography as="span" variant="bodySmall" tone={item.action === '转向' ? 'success' : 'warning'} wrap="nowrap">{item.action}</Typography>
        </div>
      ))}
      <svg className="ngtw-nematode-xor__decision-line absolute inset-0 w-full h-full max-w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} />
      </svg>
      {(['start', 'end'] as const).map((target) => {
        const point = target === 'start' ? start : end;
        return <button key={target} type="button" className={`ngtw-nematode-xor__line-handle absolute w-[17px] h-[17px] rounded-[50%] bg-[#fff]${touched ? '' : ' is-pulsing'}`} style={{ left: `${point.x}%`, top: `${point.y}%` }} onPointerDown={(event) => { dragRef.current = target; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={updatePoint} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }} onKeyDown={handleKeyDown(target, point)} aria-label={target === 'start' ? '拖动分界线起点' : '拖动分界线终点'} />;
      })}
    </div>
  );
}

export function NematodeXorPage({ onComplete }: NematodeXorPageProps) {
  const [selectedCase, setSelectedCase] = useState('00');
  const [lineStart, setLineStart] = useState<LinePoint>({ x: 10, y: 4 });
  const [lineEnd, setLineEnd] = useState<LinePoint>({ x: 92, y: 96 });
  const [checked, setChecked] = useState(false);
  const completedRef = useRef(false);
  const selected = cases.find((item) => item.id === selectedCase) ?? cases[0];
  const classified = useMemo(() => cases.map((item) => {
    const point = { x: 16 + item.left * 68, y: 16 + (1 - item.right) * 68 };
    const cross = (lineEnd.x - lineStart.x) * (point.y - lineStart.y) - (lineEnd.y - lineStart.y) * (point.x - lineStart.x);
    const predictTurn = cross < 0;
    return { ...item, correct: predictTurn === (item.action === '转向') };
  }), [lineStart, lineEnd]);
  const correctCount = classified.filter((item) => item.correct).length;

  useEffect(() => {
    if (checked && !completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [checked, onComplete]);

  const chooseCase = (id: string) => setSelectedCase(id);
  const updateLine = (target: 'start' | 'end', point: LinePoint) => {
    if (target === 'start') setLineStart(point);
    else setLineEnd(point);
    setChecked(true);
  };
  return (
    <ContentBlock headingLevel={1} className="ngtw-nematode-xor" title="线性分类的边界：秀丽隐杆线虫的双侧刺激" subtitle="四种左右刺激组合对应四种行为反应。现在检验一条直线能否将它们分成两类。">
      <div className="ngtw-nematode-xor__columns grid min-w-0 min-h-0 max-w-full grid-cols-[minmax(0,_1.08fr)_minmax(0,_.92fr)] gap-[14px]">
        <section className="ngtw-nematode-xor__cases grid-rows-[auto_minmax(0,_1fr)] gap-[12px]">
          <div className="ngtw-nematode-xor__rule-note grid min-w-0 max-w-full grid-cols-[42px_minmax(0,_1fr)] items-center gap-[12px] p-[10px_14px]"><span aria-hidden="true">!</span><Typography as="strong" variant="bodySmall" tone="accent">只有一侧受到刺激时，线虫转向；两侧都没有或两侧都有时，不转向。</Typography></div>
          <div className="ngtw-nematode-xor__case-grid grid min-w-0 min-h-0 max-w-full grid-cols-[repeat(2,_minmax(0,_1fr))] grid-rows-[repeat(2,_minmax(0,_1fr))] gap-[12px]">{cases.map((item, index) => <CaseCard item={item} selected={selected.id === item.id} onSelect={() => chooseCase(item.id)} index={index} key={item.id} />)}</div>
        </section>

        <section className="ngtw-nematode-xor__line-panel grid-rows-[auto_minmax(0,_1fr)] gap-[10px]">
          <header><div><Typography as="h2" variant="h3" tone="accent">尝试建立分类边界</Typography><Typography variant="bodySmall" tone="muted">调整直线的位置和方向，使两个“转向”状态位于同一侧</Typography></div><Typography as="strong" variant="bodySmall" tone={correctCount === 3 ? 'warning' : correctCount === 4 ? 'success' : 'accent'} wrap="nowrap">当前正确 {correctCount} / 4</Typography></header>
          <DecisionMap start={lineStart} end={lineEnd} classified={classified} touched={checked} onChange={updateLine} />
        </section>

      </div>
    </ContentBlock>
  );
}

