import { useRef, useState, type PointerEvent } from 'react';
import { Button } from '../../../shared/react/controls/Button';
import { LessonPageFrame } from '../LessonPageFrame';
import './MaskTrainingBridgeCard.css';
const inputs = ['〈开始〉', '我', '爱', '深度', '学习'];
const answers = ['我', '爱', '深度', '学习', '〈结束〉'];
type Phase = 'generation' | 'range' | 'result';
export function MaskTrainingBridgeCard({ onComplete }: {
    onComplete: () => void;
}) {
    const [phase, setPhase] = useState<Phase>('generation');
    const [position, setPosition] = useState(2);
    const [boundary, setBoundary] = useState(4);
    const [feedback, setFeedback] = useState<'future' | 'missing' | null>(null);
    const dragging = useRef(false);
    const result = phase === 'result';
    const visibleEnd = result ? position : boundary;
    const selectPosition = (index: number) => { setPosition(index); setFeedback(null); if (result)
        setBoundary(index); };
    const selectBoundary = (index: number) => { if (result)
        return; setBoundary(Math.max(0, Math.min(4, index))); setFeedback(null); };
    const moveBoundary = (event: PointerEvent<SVGSVGElement>) => {
        if (!dragging.current || result)
            return;
        const matrix = event.currentTarget.getScreenCTM();
        if (!matrix)
            return;
        const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
        selectBoundary(Math.round((point.x - 403) / 210));
    };
    const check = () => { if (boundary === position) {
        setPhase('result');
        setFeedback(null);
    }
    else
        setFeedback(boundary > position ? 'future' : 'missing'); };
    return <LessonPageFrame><section className="tr-mask-bridge-page">
    <header className="tr-lesson-header"><h1>训练时答案已知，模型会不会直接抄答案？</h1><p>{phase === 'generation' ? '先回顾逐词生成，再点击“展开训练的完整输入”，选择可读范围。' : phase === 'range' ? '先选下方预测目标，再点上方最后一个可读输入，确认范围。' : '切换下方预测目标，观察可读范围与所有未来位置怎样一起变化。'}</p></header>
    <div className="tr-mask-bridge-context"><div><span>生成时</span><strong>{inputs.slice(0, position + 1).join(' ')} → <mark>{answers[position]}？</mark></strong></div><i>→</i><div><span>训练时</span><strong>已知完整译文：我爱深度学习。</strong></div></div>
    <main className={`tr-mask-bridge-board is-${phase}${feedback ? ' has-error' : ''}`}>
      {phase === 'generation' ? <section className="tr-mask-generation-recap"><div className="tr-mask-recap-tokens">{inputs.slice(0, 3).map(word => <span key={word}>{word}</span>)}<i>→</i><strong>深度？</strong></div><h2>“深度、学习”此时都还没生成。</h2><Button variant="primary" onClick={() => setPhase('range')}>展开训练的完整输入 →</Button></section> : <>
      <div className="tr-mask-bridge-board-heading"><strong>{result ? '✓ 范围正确' : '选一段可读范围'}</strong><span>{result ? '自己和前文可读，所有后文不可读' : '点击最后一个可读输入，或拖动边界'}</span></div>
      <svg viewBox="0 0 1400 305" role="group" aria-label="选择从开始到某个输入的连续可读范围，预测位置可在下方切换" onPointerMove={moveBoundary} onPointerUp={() => { dragging.current = false; }} onPointerCancel={() => { dragging.current = false; }}>
        <defs><pattern id="tr-mask-bridge-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line y2="10" stroke="#c4d0d7" strokeWidth="3"/></pattern></defs>
        <text x="40" y="92" className="tr-mask-bridge-row-label">译文输入</text><text x="40" y="256" className="tr-mask-bridge-row-label">预测目标</text>
        <rect className="tr-mask-readable-range" x="207" y="43" width={196 + visibleEnd * 210} height="87" rx="20"/>
        {inputs.map((word, i) => <g key={word} role={!result ? 'button' : undefined} tabIndex={!result ? 0 : undefined} aria-label={!result ? `可读范围截止到${word}` : undefined} onClick={() => selectBoundary(i)} onKeyDown={event => { if (!result && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            selectBoundary(i);
        } }} className={`tr-mask-bridge-input ${i <= visibleEnd ? 'is-in-range' : ''} ${result && i > position ? 'is-future' : ''} ${i === position ? 'is-current' : ''} ${feedback && i > position && i <= boundary ? 'is-wrong' : ''}`}><rect x={220 + i * 210} y="56" width="170" height="61" rx="13"/><text x={305 + i * 210} y="95" textAnchor="middle">{word}</text>{i === position && <text className="tr-mask-current-label" x={305 + i * 210} y="31" textAnchor="middle">当前位置</text>}</g>)}
        {result && position < 4 && <g className="tr-mask-future-range"><rect x={207 + (position + 1) * 210} y="43" width={(4 - position) * 210 - 14} height="87" rx="20"/><text x={(207 + (position + 1) * 210 + 1243) / 2} y="157" textAnchor="middle">全部未来词 · 不可读取</text></g>}
        {!result && <g className="tr-mask-boundary-handle" role="slider" tabIndex={0} aria-label="可读范围右边界" aria-valuemin={0} aria-valuemax={4} aria-valuenow={boundary} aria-valuetext={`可读取${inputs.slice(0, boundary + 1).join('、')}`} onPointerDown={event => { dragging.current = true; event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId); event.preventDefault(); }} onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            selectBoundary(boundary + (event.key === 'ArrowLeft' ? -1 : 1));
        }
        else if (event.key === 'Home') {
            event.preventDefault();
            selectBoundary(0);
        }
        else if (event.key === 'End') {
            event.preventDefault();
            selectBoundary(4);
        } }} transform={`translate(${403 + boundary * 210},0)`}><path d="M0 47 V143"/><circle cx="0" cy="149" r="14"/><text x="0" y="156" textAnchor="middle">↔</text></g>}
        <text className="tr-mask-range-label" x={305 + visibleEnd * 105} y="162" textAnchor="middle">{result ? '可读取：自己和前文' : '你选择的可读范围'}</text>
        {answers.map((word, i) => <g key={word} role="button" tabIndex={0} aria-label={`选择预测${word}的位置`} aria-pressed={position === i} className={`tr-mask-bridge-target ${i === position ? 'is-question' : ''}`} onClick={() => selectPosition(i)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectPosition(i);
        } }}><path d={`M${305 + i * 210} 180 V213`}/><rect x={220 + i * 210} y="221" width="170" height="61" rx="14"/><text x={305 + i * 210} y="259" textAnchor="middle">{word}</text></g>)}
      </svg>
      <div className={`tr-mask-bridge-question${result ? ' is-correct' : feedback ? ' is-incorrect' : ''}`} aria-live="polite">{result ? <><h2><span className="tr-mask-feedback-icon">✓</span>范围正确：保留自己和前文，遮住所有后文。</h2><button className="tr-mask-bridge-retry" onClick={() => { setPhase('range'); setFeedback(null); }}>重新选范围 ↶</button></> : <><h2>预测“{answers[position]}”时，可以读取哪些输入？</h2><div className="tr-mask-range-actions">{feedback ? <p className="tr-mask-range-feedback"><span className="tr-mask-feedback-icon">✕</span>{feedback === 'future' ? <>范围包含未来词，不能提前读取答案。</> : <>范围太短：当前位置和前文都可以读取。</>}</p> : <p>选好范围后，点击确认。</p>}<Button variant="primary" onClick={check}>确认这段范围</Button></div></>}</div>
      </>}
    </main>
    <footer><Button variant="primary" onClick={onComplete}>看看掩码怎样实现 →</Button></footer>
  </section></LessonPageFrame>;
}
