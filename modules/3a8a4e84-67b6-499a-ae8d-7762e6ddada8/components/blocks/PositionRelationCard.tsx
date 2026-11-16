import { memo, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
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
    { title: '从生成公式出发', explain: '固定 512 维，只观察同一组维度 i。', formula: <><span shuku-edit-id="e-6b41f309-5875-4dd3-9ed9-5db125df2946">PE(pos, 2i) = sin( pos / 10000<sup shuku-edit-id="e-6308ec77-feb9-4926-be79-6fe7e7167a5a">2i / 512</sup> )</span><span shuku-edit-id="e-e89ec6ae-9caa-4716-8ca3-0af357ade708">PE(pos, 2i+1) = cos( pos / 10000<sup shuku-edit-id="e-4fde2701-bc8b-4552-a298-656dfa07ef75">2i / 512</sup> )</span></> },
    { title: '把固定频率记作 ωᵢ', explain: '同一维度组里，i 不变，频率也不变。', formula: <span shuku-edit-id="e-7aa54fa1-db92-407f-9b45-9f856b57eb53">ω<sub shuku-edit-id="e-4f16d5f1-4a6d-41c7-913c-0857eb5f0c44">i</sub> = 1 / 10000<sup shuku-edit-id="e-685a1ee3-36e7-45b0-b32b-fe6fb9bbd23f">2i / 512</sup></span> },
    { title: '原公式变得很简单', explain: '位置 p 乘固定频率，再取 sin 或 cos。', formula: <><span shuku-edit-id="e-e302e284-bd4e-441e-8bfe-f465cc52f85d">PE(p, 2i) = sin(pω<sub shuku-edit-id="e-e92b8119-1999-4e23-a3ef-487d61a02f8b">i</sub>)</span><span shuku-edit-id="e-2ea7e81c-0345-4f61-8af1-1d8ffc75416d">PE(p, 2i+1) = cos(pω<sub shuku-edit-id="e-d36b344a-1dd1-41ef-a95f-4f247010461d">i</sub>)</span></> },
    { title: '取两个位置 p₁、p₂', explain: '各自的一对 sin、cos 组成二维向量。', formula: <><span shuku-edit-id="e-59d89e8c-a040-42b3-bac5-52609e7a0aa6">r<sub shuku-edit-id="e-706cb9ac-64e3-4c4d-af05-46aa88157d41">i</sub>(p₁) = [ sin(p₁ω<sub shuku-edit-id="e-dbb50333-1681-4207-9457-efed7b758c28">i</sub>), cos(p₁ω<sub shuku-edit-id="e-fd6a969a-6459-417d-902a-51c175a781ea">i</sub>) ]ᵀ</span><span shuku-edit-id="e-4ea097ee-b2b7-4088-8dd8-2a43f5e53184">r<sub shuku-edit-id="e-c2f1584d-0718-4265-89b9-37c5da60cbc7">i</sub>(p₂) = [ sin(p₂ω<sub shuku-edit-id="e-540d5398-9721-4f93-803e-d1ebb80cc2b2">i</sub>), cos(p₂ω<sub shuku-edit-id="e-2b0ba0cc-d208-4f14-8660-e5262a832a63">i</sub>) ]ᵀ</span></> },
    { title: '让两个位置编码做点积', explain: '对应元素相乘再相加。', formula: <span shuku-edit-id="e-18cc9b61-1c3b-414a-81dc-6a741e9fc622">r<sub shuku-edit-id="e-1c67d789-7246-463d-9255-4f916f49e3bb">i</sub>(p₁)ᵀr<sub shuku-edit-id="e-42de0383-9da6-40ec-a5c0-5ccaa2052efa">i</sub>(p₂) = sin(p₁ω<sub shuku-edit-id="e-8785064d-67dd-4e83-b2f5-3d6878f47a46">i</sub>)sin(p₂ω<sub shuku-edit-id="e-72a6d807-1698-47f6-9d2c-e850d4326b83">i</sub>) + cos(p₁ω<sub shuku-edit-id="e-bda91388-78be-42ba-aaba-3affdff034c4">i</sub>)cos(p₂ω<sub shuku-edit-id="e-a4ed80b7-6cb8-4639-971c-7a10a588fafb">i</sub>)</span> },
    { title: '合角公式留下位置差', explain: '利用 cos(A−B) 恒等式，绝对位置被相减。', formula: <span shuku-edit-id="e-fe3d4375-6d6d-4776-afc6-c76f03653aeb">r<sub shuku-edit-id="e-8c484db1-2c96-4e89-8255-2ce59a9c13b2">i</sub>(p₁)ᵀr<sub shuku-edit-id="e-46e695a5-a953-4da8-9aac-1fe50d9e0291">i</sub>(p₂) = cos((p₁−p₂)ω<sub shuku-edit-id="e-a11a1d94-6538-4afd-8730-ff3affb08158">i</sub>)</span> },
    { title: '结论：点积取决于位置差', explain: '同一组内，位置差相同则点积相同；但点积随距离并非单调变化。', formula: <><span shuku-edit-id="e-3cfe8f7f-029c-427f-b35e-10b6bdd3bdf3">p₁−p₂ = q₁−q₂</span><span shuku-edit-id="e-386a7dd0-61a5-4f85-bd8f-7e1835ad737d">⇒ r<sub shuku-edit-id="e-712fba84-451f-4a06-937b-7fd88dbe1683">i</sub>(p₁)ᵀr<sub shuku-edit-id="e-cc8009fc-d854-4f04-aca1-c1914c1245d1">i</sub>(p₂) = r<sub shuku-edit-id="e-8cf524fa-5294-4a8d-bc1b-b456003f814f">i</sub>(q₁)ᵀr<sub shuku-edit-id="e-5876092f-9630-4ca9-8cc2-d56fc4fe5b3c">i</sub>(q₂)</span></> },
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
        return <div shuku-edit-id="e-f3c1b96c-c2dc-4593-822c-5eacb86cd6a8" className={`tr-viewfinder ${which === 1 ? 'is-one' : 'is-two'} is-pair-${pairIndex}${dragVisual ? ' is-dragging' : ''}`} role="slider" tabIndex={0} aria-label={which === 1 ? '位置 p₁，拖动同步移动两个框' : '位置 p₂，拖动改变位置间隔'} aria-valuemin={which === 1 ? 0 : pos1 + 1} aria-valuemax={which === 1 ? 5 - (pos2 - pos1) : 5} aria-valuenow={position} style={{ left: group.left, width: group.width, height: matrixLayout.height, top: matrixLayout.top, transform: `translate3d(0,${displayPosition * matrixLayout.step}px,0)`, '--label-left': `${12 - group.left}px` } as CSSProperties} onKeyDown={event => {
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
      <span shuku-edit-id="e-3b0683e6-ca96-4ee2-a192-a3132c5f02b6"><b shuku-edit-id="e-de78b272-8c23-4a3d-8fca-9d866f414e88">{which === 1 ? 'p₁' : 'p₂'}</b><em shuku-edit-id="e-91db021a-ca50-45dd-83a3-4dcffec43164">{which === 1 ? '同步移动' : '改变间隔'}</em><i shuku-edit-id="e-729e4677-8bd3-4390-be25-f3a6c9bbc53a" aria-hidden="true">↕</i></span>
    </div>;
    };
    return <LessonPageFrame><section shuku-edit-id="e-4c303fca-513e-48c4-abac-24eaff81ec82" className={`tr-relative is-${page}`} aria-labelledby="tr-relative-title">
    <header shuku-edit-id="e-a93ad6c0-a30e-449d-acc7-32e9bcf940ca" className="tr-lesson-header tr-relative__header"><div shuku-edit-id="e-f64d9545-667b-4476-b98c-f7b8eac3c801"><Typography shuku-edit-id="e-7c025b44-cc4a-41b2-8249-60d22740bf77" id="tr-relative-title" as="h1" variant="display" tone="accent">{experiment ? '移动位置，观察点积怎样变化' : '位置编码的点积为什么与位置差有关？'}</Typography><p shuku-edit-id="e-a9831aac-022d-4459-98ba-7095f936f48b">{experiment ? '同步移动两框，位置差不变，再单独移动 p₂ 改变间隔。' : '点击“下一步”逐步展开推导，留意两个位置怎样变成位置差。'}</p></div></header>
    {!experiment ? <main shuku-edit-id="e-ebd93fe8-bb5c-41be-b42c-2da39af914e7" className="tr-relative-stepper">
      <div shuku-edit-id="e-f70ee729-5e69-49cb-8380-e9f112cfdd93" className="tr-relative-progress" aria-label={`推导第 ${step + 1} 步，共 ${steps.length} 步`}>{steps.map((_, index) => <i shuku-edit-id="e-0a6dd396-26df-4f37-947f-e1ba3fe9ccf6" className={index <= step ? 'is-done' : ''} key={index}/>)}</div>
      <div shuku-edit-id="e-23aca067-2e4f-413a-8400-e2752208a164" className="tr-relative-derivation"><nav shuku-edit-id="e-64a2cb21-d953-416e-9c41-1352db1bcdbf" className="tr-relative-step-menu" aria-label="公式推导步骤">{steps.map((item, index) => <button shuku-edit-id="e-c529c499-a5b4-4ce9-a44c-83cc2f243f3b" type="button" aria-current={index === step ? 'step' : undefined} onClick={() => selectStep(index)} key={item.title}><b shuku-edit-id="e-56bd4897-ce6a-486b-a412-6526e8ffc792">{index + 1}</b><span shuku-edit-id="e-58cb7950-2767-43d2-91b8-1ea15cbfd834">{item.title}</span></button>)}</nav><div shuku-edit-id="e-02fb461e-faff-4085-9886-f96729d526c8" className="tr-relative-formula-history" ref={historyRef} tabIndex={0} role="region" aria-label="已展开的推导步骤，可上下滚动对比">{steps.slice(0, revealedStep + 1).map((item, index) => <article shuku-edit-id="e-1d9f5250-4fd1-4d43-9fa1-4692c74324ea" className={`tr-relative-formula-card${index === step ? ' is-selected' : ''}`} data-derivation-step={index} aria-label={`第${index + 1}步：${item.title}`} key={item.title}><div shuku-edit-id="e-6b6f24a2-f878-4aae-a3ba-25739a09bf34" className="tr-relative-formula">{item.formula}</div><p shuku-edit-id="e-e3390c5a-6058-4248-87f3-eb3442df9061" className="tr-relative-step-explain">{item.explain}</p></article>)}</div></div>
      <nav shuku-edit-id="e-e21b8828-f776-49ac-aec7-a38c4eaee9bc" className="tr-relative-nav"><Button disabled={step === 0} onClick={() => selectStep(Math.max(0, step - 1))}>上一步</Button><span shuku-edit-id="e-28db7942-287f-4b31-bd0d-e9f21a5697bc">{step + 1} / {steps.length}</span><Button className="tr-relative-primary" variant="primary" onClick={next}>{step === steps.length - 1 ? '下一页：拖动观察' : '下一步'}</Button></nav>
    </main> : <main shuku-edit-id="e-cd54f42a-8575-4bad-b7b2-8f44b93aeb39" className="tr-relative-experiment">
      <section shuku-edit-id="e-7ee0391e-5fdd-4d30-a791-3a27084d37e8" className="tr-relative-matrix" ref={matrixRef}><div shuku-edit-id="e-9e71f849-7648-43b8-8ef6-85945a377855" className="tr-relative-drag-caption">拖动位置框</div><PositionGrid onPairChange={setPair}/>{renderDragFrame(1)}{renderDragFrame(2)}</section>
      <section shuku-edit-id="e-3bba6148-54bb-4b5b-a8f7-400ec077686d" className="tr-relative-results"><div shuku-edit-id="e-3d77d043-6d1d-4f18-bf13-f03adea78ce2"><span shuku-edit-id="e-29c6d1d7-74f4-483e-9ff9-c764ec3cab23">同一维度组 i = {pair} 的点积只取决于位置差 Δp = {pos1 - pos2}</span><strong shuku-edit-id="e-aee18c62-34bb-464a-9ca1-51f3b6768b1a">cos(({pos1} − {pos2}) / 10000<sup shuku-edit-id="e-73f0f4b5-b36c-422d-9cdf-b804ef8ad413">{2 * pair}/512</sup>) = <mark shuku-edit-id="e-b2270abc-d583-423a-82d4-d835f413cc21">{point.toFixed(6)}</mark></strong></div></section>
      <footer shuku-edit-id="e-e0c7c263-4bea-4167-8026-84b08e289d3a" className="tr-relative-nav"><Button className="tr-relative-primary" variant="primary" onClick={onComplete}>继续：不同维度怎样记录位置</Button></footer>
    </main>}
  </section></LessonPageFrame>;
}
const PositionGrid = memo(function PositionGrid({ onPairChange }: {
    onPairChange: (pair: number) => void;
}) {
    return <div shuku-edit-id="e-a87936dc-d2b0-401c-b93d-128693ef8f2c" className="tr-relative-grid">
        <div shuku-edit-id="e-f33f4d6d-ee29-4ce4-90eb-ad55f7c17c72" className="head pos">pos</div>{pairs.map((group, index) => <div shuku-edit-id="e-ad130d06-4dd3-49e1-99a2-a314d46e5e37" className={`head group is-pair-${index}`} style={{ gridColumn: `${2 + index * 2 + (index === 2 ? 1 : 0)} / span 2` }} key={group.i}>维度组 i = {group.i}</div>)}<div shuku-edit-id="e-53ac715c-ba85-491f-a082-b4f921359a9d" className="head gap" style={{ gridColumn: 6 }}>…</div>
        <div shuku-edit-id="e-b5c8d4af-34b8-4ef4-a08a-cab52146140f" className="head dim" style={{ gridColumn: 2 }}>第0维</div><div shuku-edit-id="e-b10be31f-06c4-4809-912f-10f78b13767f" className="head dim" style={{ gridColumn: 3 }}>第1维</div><div shuku-edit-id="e-64d14464-4c7a-4019-afdc-32746c50acac" className="head dim" style={{ gridColumn: 4 }}>第2维</div><div shuku-edit-id="e-0ab83eb6-234c-459e-b631-8ff3c23eacd4" className="head dim" style={{ gridColumn: 5 }}>第3维</div><div shuku-edit-id="e-20e40f6b-42ae-4c52-9a37-ee820709d263" className="head dim" style={{ gridColumn: 7 }}>第510维</div><div shuku-edit-id="e-4bc35d2a-ee78-4255-b3de-61aa4affac00" className="head dim" style={{ gridColumn: 8 }}>第511维</div>
        {positions.map((row) => <div shuku-edit-id="e-ae023c17-30d2-4967-9d09-6cd0c2c990fe" className="tr-relative-row" style={{ '--tr-row': row + 3 } as CSSProperties} key={row}><div shuku-edit-id="e-35157322-a01e-405f-90eb-9a2a6b6ae2cb" className="cell pos">{row}</div>{pairs.flatMap((group, groupIndex) => [...(groupIndex === 2 ? [<div shuku-edit-id="e-0abbccfb-7e4d-471f-8cbe-b469a711fe7a" className="cell gap" key={`gap-${row}`}>…</div>] : []), ...group.dims.map((dim, dimIndex) => <button shuku-edit-id="e-34604232-1671-40ce-84d2-167ee9f78f19" className={`cell formula is-pair-${groupIndex}`} data-position-row={row} data-dimension={dim} style={{ gridColumn: groupIndex < 2 ? 2 + groupIndex * 2 + dimIndex : 7 + dimIndex }} type="button" onClick={() => onPairChange(group.i)} key={`${row}-${dim}`}><EncodingValue pos={row} dim={dim}/></button>)])}</div>)}
  </div>;
});
