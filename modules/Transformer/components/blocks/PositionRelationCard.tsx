import { memo, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPageFrame } from '../LessonPageFrame';
import './PositionRelationCard.css';
interface PositionRelationCardProps {
    onComplete: () => void;
    page?: 'derivation' | 'experiment';
}
const positions = [0, 1, 2, 3, 4, 5];
const pairs = [{ i: 0, dims: [0, 1] }, { i: 1, dims: [2, 3] }, { i: 255, dims: [510, 511] }];
const steps: {
    title: string;
    explain: string;
    formula: ReactNode;
}[] = [
    { title: '从生成公式出发', explain: '固定 512 维，只观察同一组维度 i。', formula: <><span>PE(pos, 2i) = sin( pos / 10000<sup>2i / 512</sup> )</span><span>PE(pos, 2i+1) = cos( pos / 10000<sup>2i / 512</sup> )</span></> },
    { title: '把固定频率记作 ωᵢ', explain: '同一维度组里，i 不变，频率也不变。', formula: <span>ω<sub>i</sub> = 1 / 10000<sup>2i / 512</sup></span> },
    { title: '原公式变得很简单', explain: '位置 p 乘固定频率，再取 sin 或 cos。', formula: <><span>PE(p, 2i) = sin(pω<sub>i</sub>)</span><span>PE(p, 2i+1) = cos(pω<sub>i</sub>)</span></> },
    { title: '取两个位置 p₁、p₂', explain: '各自的一对 sin、cos 组成二维向量。', formula: <><span>r<sub>i</sub>(p₁) = [ sin(p₁ω<sub>i</sub>), cos(p₁ω<sub>i</sub>) ]ᵀ</span><span>r<sub>i</sub>(p₂) = [ sin(p₂ω<sub>i</sub>), cos(p₂ω<sub>i</sub>) ]ᵀ</span></> },
    { title: '让两个位置编码做点积', explain: '对应元素相乘再相加。', formula: <span>r<sub>i</sub>(p₁)ᵀr<sub>i</sub>(p₂) = sin(p₁ω<sub>i</sub>)sin(p₂ω<sub>i</sub>) + cos(p₁ω<sub>i</sub>)cos(p₂ω<sub>i</sub>)</span> },
    { title: '合角公式留下位置差', explain: '利用 cos(A−B) 恒等式，绝对位置被相减。', formula: <span>r<sub>i</sub>(p₁)ᵀr<sub>i</sub>(p₂) = cos((p₁−p₂)ω<sub>i</sub>)</span> },
    { title: '结论：点积取决于位置差', explain: '同一组内，位置差相同则点积相同；但点积随距离并非单调变化。', formula: <><span>p₁−p₂ = q₁−q₂</span><span>⇒ r<sub>i</sub>(p₁)ᵀr<sub>i</sub>(p₂) = r<sub>i</sub>(q₁)ᵀr<sub>i</sub>(q₂)</span></> },
];
function EncodingValue({ pos, dim }: {
    pos: number;
    dim: number;
}) {
    const pair = Math.floor(dim / 2);
    const angle = pos / 10000 ** ((2 * pair) / 512);
    const value = dim % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
    return <>{value.toFixed(4)}</>;
}
export function PositionRelationCard({ onComplete, page = 'derivation' }: PositionRelationCardProps) {
    const [step, setStep] = useState(0);
    const experiment = page === 'experiment';
    const [pair, setPair] = useState(0);
    const [pos1, setPos1] = useState(1);
    const [pos2, setPos2] = useState(4);
    const [revealedStep, setRevealedStep] = useState(0);
    const historyRef = useRef<HTMLDivElement | null>(null);
    const matrixRef = useRef<HTMLElement>(null);
    const [matrixLayout, setMatrixLayout] = useState<{
        top: number;
        step: number;
        height: number;
        groups: {
            left: number;
            width: number;
        }[];
    } | null>(null);
    const [dragVisual, setDragVisual] = useState<{
        one: number;
        two: number;
    } | null>(null);
    const drag = useRef<{
        which: 1 | 2;
        pointerId: number;
        startY: number;
        latestY: number;
        start1: number;
        start2: number;
        screenStep: number;
    } | null>(null);
    const dragFrame = useRef<number | null>(null);
    const pairIndex = pairs.findIndex((item) => item.i === pair);
    const denominator = 10000 ** ((2 * pair) / 512);
    const point = Math.cos((pos1 - pos2) / denominator);
    useLayoutEffect(() => {
        const matrix = matrixRef.current;
        if (!experiment || !matrix)
            return;
        const measure = () => {
            const rows = matrix.querySelectorAll<HTMLElement>('.cell.pos');
            if (rows.length < 2)
                return;
            const bounds = matrix.getBoundingClientRect();
            if (!bounds.width || !bounds.height)
                return;
            const sx = matrix.offsetWidth / bounds.width, sy = matrix.offsetHeight / bounds.height;
            const first = rows[0].getBoundingClientRect(), second = rows[1].getBoundingClientRect();
            const groups = pairs.map(group => {
                const a = matrix.querySelector(`[data-position-row="0"][data-dimension="${group.dims[0]}"]`)!.getBoundingClientRect();
                const b = matrix.querySelector(`[data-position-row="0"][data-dimension="${group.dims[1]}"]`)!.getBoundingClientRect();
                return { left: (a.left - bounds.left) * sx - matrix.clientLeft, width: (b.right - a.left) * sx };
            });
            setMatrixLayout({ top: (first.top - bounds.top) * sy - matrix.clientTop, step: (second.top - first.top) * sy, height: first.height * sy, groups });
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(matrix);
        return () => observer.disconnect();
    }, [experiment]);
    useEffect(() => () => { if (dragFrame.current !== null)
        cancelAnimationFrame(dragFrame.current); }, []);
    const selectStep = (index: number) => {
        setStep(index);
        setRevealedStep(previous => Math.max(previous, index));
        requestAnimationFrame(() => {
            const list = historyRef.current;
            const card = list?.querySelector<HTMLElement>(`[data-derivation-step="${index}"]`);
            if (list && card)
                list.scrollTo({ top: card.offsetTop - 8, behavior: 'auto' });
        });
    };
    const next = () => { if (step < steps.length - 1)
        selectStep(step + 1);
    else
        onComplete(); };
    const updateDrag = () => {
        dragFrame.current = null;
        const current = drag.current;
        if (!current)
            return;
        const delta = (current.latestY - current.startY) / current.screenStep;
        if (current.which === 1) {
            const movement = Math.max(-current.start1, Math.min(5 - current.start2, delta));
            setDragVisual({ one: current.start1 + movement, two: current.start2 + movement });
            const snapped = Math.round(movement);
            setPos1(current.start1 + snapped);
            setPos2(current.start2 + snapped);
        }
        else {
            const two = Math.max(current.start1 + 1, Math.min(5, current.start2 + delta));
            setDragVisual({ one: current.start1, two });
            setPos2(Math.round(two));
        }
    };
    const startDrag = (which: 1 | 2, event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.button !== 0 || !matrixRef.current)
            return;
        event.preventDefault();
        const rows = matrixRef.current.querySelectorAll('.cell.pos');
        const screenStep = rows[1].getBoundingClientRect().top - rows[0].getBoundingClientRect().top;
        drag.current = { which, pointerId: event.pointerId, startY: event.clientY, latestY: event.clientY, start1: pos1, start2: pos2, screenStep: Math.max(1, screenStep) };
        setDragVisual({ one: pos1, two: pos2 });
        event.currentTarget.setPointerCapture(event.pointerId);
    };
    const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!drag.current || event.pointerId !== drag.current.pointerId)
            return;
        drag.current.latestY = event.clientY;
        if (dragFrame.current === null)
            dragFrame.current = requestAnimationFrame(updateDrag);
    };
    const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!drag.current || event.pointerId !== drag.current.pointerId)
            return;
        drag.current.latestY = event.clientY;
        if (dragFrame.current !== null)
            cancelAnimationFrame(dragFrame.current);
        updateDrag();
        drag.current = null;
        setDragVisual(null);
        if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
    };
    const renderDragFrame = (which: 1 | 2) => {
        if (!matrixLayout)
            return null;
        const group = matrixLayout.groups[pairIndex];
        const position = which === 1 ? pos1 : pos2;
        const displayPosition = dragVisual ? which === 1 ? dragVisual.one : dragVisual.two : position;
        return <div className={`tr-viewfinder ${which === 1 ? 'is-one' : 'is-two'} is-pair-${pairIndex}${dragVisual ? ' is-dragging' : ''}`} role="slider" tabIndex={0} aria-label={which === 1 ? '位置 p₁，拖动同步移动两个框' : '位置 p₂，拖动改变位置间隔'} aria-valuemin={which === 1 ? 0 : pos1 + 1} aria-valuemax={which === 1 ? 5 - (pos2 - pos1) : 5} aria-valuenow={position} style={{ left: group.left, width: group.width, height: matrixLayout.height, top: matrixLayout.top, transform: `translate3d(0,${displayPosition * matrixLayout.step}px,0)`, '--label-left': `${12 - group.left}px` } as CSSProperties} onKeyDown={event => {
                if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')
                    return;
                event.preventDefault();
                const delta = event.key === 'ArrowDown' ? 1 : -1;
                if (which === 1) {
                    if (pos1 + delta >= 0 && pos2 + delta <= 5) {
                        setPos1(pos1 + delta);
                        setPos2(pos2 + delta);
                    }
                }
                else
                    setPos2(Math.max(pos1 + 1, Math.min(5, pos2 + delta)));
            }} onPointerDown={event => startDrag(which, event)} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={finishDrag} onLostPointerCapture={() => { if (drag.current) {
            if (dragFrame.current !== null)
                cancelAnimationFrame(dragFrame.current);
            dragFrame.current = null;
            drag.current = null;
            setDragVisual(null);
        } }}>
      <span><b>{which === 1 ? 'p₁' : 'p₂'}</b><em>{which === 1 ? '同步移动' : '改变间隔'}</em><i aria-hidden="true">↕</i></span>
    </div>;
    };
    return <LessonPageFrame><section className={`tr-relative is-${page}`} aria-labelledby="tr-relative-title">
    <header className="tr-lesson-header tr-relative__header"><div><Typography id="tr-relative-title" as="h1" variant="display" tone="accent">{experiment ? '移动位置，观察点积怎样变化' : '位置编码的点积为什么与位置差有关？'}</Typography><p>{experiment ? '同步移动两框，位置差不变，再单独移动 p₂ 改变间隔。' : '点击“下一步”逐步展开推导，留意两个位置怎样变成位置差。'}</p></div></header>
    {!experiment ? <main className="tr-relative-stepper">
      <div className="tr-relative-progress" aria-label={`推导第 ${step + 1} 步，共 ${steps.length} 步`}>{steps.map((_, index) => <i className={index <= step ? 'is-done' : ''} key={index}/>)}</div>
      <div className="tr-relative-derivation"><nav className="tr-relative-step-menu" aria-label="公式推导步骤">{steps.map((item, index) => <button type="button" aria-current={index === step ? 'step' : undefined} onClick={() => selectStep(index)} key={item.title}><b>{index + 1}</b><span>{item.title}</span></button>)}</nav><div className="tr-relative-formula-history" ref={historyRef} tabIndex={0} role="region" aria-label="已展开的推导步骤，可上下滚动对比">{steps.slice(0, revealedStep + 1).map((item, index) => <article className={`tr-relative-formula-card${index === step ? ' is-selected' : ''}`} data-derivation-step={index} aria-label={`第${index + 1}步：${item.title}`} key={item.title}><div className="tr-relative-formula">{item.formula}</div><p className="tr-relative-step-explain">{item.explain}</p></article>)}</div></div>
      <nav className="tr-relative-nav"><Button disabled={step === 0} onClick={() => selectStep(Math.max(0, step - 1))}>上一步</Button><span>{step + 1} / {steps.length}</span><Button className="tr-relative-primary" variant="primary" onClick={next}>{step === steps.length - 1 ? '下一页：拖动观察' : '下一步'}</Button></nav>
    </main> : <main className="tr-relative-experiment">
      <section className="tr-relative-matrix" ref={matrixRef}><div className="tr-relative-drag-caption">拖动位置框</div><PositionGrid onPairChange={setPair}/>{renderDragFrame(1)}{renderDragFrame(2)}</section>
      <section className="tr-relative-results"><div><span>同一维度组 i = {pair} 的点积只取决于位置差 Δp = {pos1 - pos2}</span><strong>cos(({pos1} − {pos2}) / 10000<sup>{2 * pair}/512</sup>) = <mark>{point.toFixed(6)}</mark></strong></div></section>
      <footer className="tr-relative-nav"><Button className="tr-relative-primary" variant="primary" onClick={onComplete}>继续：不同维度怎样记录位置</Button></footer>
    </main>}
  </section></LessonPageFrame>;
}
const PositionGrid = memo(function PositionGrid({ onPairChange }: {
    onPairChange: (pair: number) => void;
}) {
    return <div className="tr-relative-grid">
        <div className="head pos">pos</div>{pairs.map((group, index) => <div className={`head group is-pair-${index}`} style={{ gridColumn: `${2 + index * 2 + (index === 2 ? 1 : 0)} / span 2` }} key={group.i}>维度组 i = {group.i}</div>)}<div className="head gap" style={{ gridColumn: 6 }}>…</div>
        <div className="head dim" style={{ gridColumn: 2 }}>第0维</div><div className="head dim" style={{ gridColumn: 3 }}>第1维</div><div className="head dim" style={{ gridColumn: 4 }}>第2维</div><div className="head dim" style={{ gridColumn: 5 }}>第3维</div><div className="head dim" style={{ gridColumn: 7 }}>第510维</div><div className="head dim" style={{ gridColumn: 8 }}>第511维</div>
        {positions.map((row) => <div className="tr-relative-row" style={{ '--tr-row': row + 3 } as CSSProperties} key={row}><div className="cell pos">{row}</div>{pairs.flatMap((group, groupIndex) => [...(groupIndex === 2 ? [<div className="cell gap" key={`gap-${row}`}>…</div>] : []), ...group.dims.map((dim, dimIndex) => <button className={`cell formula is-pair-${groupIndex}`} data-position-row={row} data-dimension={dim} style={{ gridColumn: groupIndex < 2 ? 2 + groupIndex * 2 + dimIndex : 7 + dimIndex }} type="button" onClick={() => onPairChange(group.i)} key={`${row}-${dim}`}><EncodingValue pos={row} dim={dim}/></button>)])}</div>)}
  </div>;
});
