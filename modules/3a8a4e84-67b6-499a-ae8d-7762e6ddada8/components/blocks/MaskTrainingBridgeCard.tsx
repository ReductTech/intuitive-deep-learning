import { useRef, useState, type PointerEvent } from 'react';
import { Button } from "@shuku/course-style/react/controls/Button";
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
    return <LessonPageFrame><section shuku-edit-id="e-f4854f21-a968-46fe-a08f-737d1bf5ccf7" className="tr-mask-bridge-page">
    <header shuku-edit-id="e-d415fa83-82b8-4d30-9cda-195920bab973" className="tr-lesson-header"><h1 shuku-edit-id="e-91683186-1a00-4f3e-8800-96c57a2b3540">训练时答案已知，模型会不会直接抄答案？</h1><p shuku-edit-id="e-55690caa-868d-40d5-b2ed-fd14388d0c91">{phase === 'generation' ? '先回顾逐词生成，再点击“展开训练的完整输入”，选择可读范围。' : phase === 'range' ? '先选下方预测目标，再点上方最后一个可读输入，确认范围。' : '切换下方预测目标，观察可读范围与所有未来位置怎样一起变化。'}</p></header>
    <div shuku-edit-id="e-eedabcab-6796-414f-b092-cdb769547153" className="tr-mask-bridge-context"><div shuku-edit-id="e-ab3ce199-ba3a-427a-bf31-99e8133bde70"><span shuku-edit-id="e-452faa1e-df70-49be-833f-c39f1d71dc9e">生成时</span><strong shuku-edit-id="e-13ef58ce-6817-4d21-a2c6-8fa2c8955dbf">{inputs.slice(0, position + 1).join(' ')} → <mark shuku-edit-id="e-1465233c-c80c-432a-b08e-570c91a89e06">{answers[position]}？</mark></strong></div><i shuku-edit-id="e-ea557a75-0466-4c6e-9c11-c90f44307cd8">→</i><div shuku-edit-id="e-b613a907-ced2-4310-96a0-e05560ed0e04"><span shuku-edit-id="e-133ae32d-95e7-477d-bbbd-012e614e0835">训练时</span><strong shuku-edit-id="e-66c9d5b3-4e60-49ff-ade1-4fd12a47af0c">已知完整译文：我爱深度学习。</strong></div></div>
    <main shuku-edit-id="e-248fba2f-769e-4179-81b3-6669fe2e8be6" className={`tr-mask-bridge-board is-${phase}${feedback ? ' has-error' : ''}`}>
      {phase === 'generation' ? <section shuku-edit-id="e-f4f974b2-3760-48bd-bb7a-97aefaf57ea8" className="tr-mask-generation-recap"><div shuku-edit-id="e-3167d66f-5253-4626-b093-2342a728b9bb" className="tr-mask-recap-tokens">{inputs.slice(0, 3).map(word => <span shuku-edit-id="e-3d020451-7cdd-410b-b962-0d6131effad5" key={word}>{word}</span>)}<i shuku-edit-id="e-6210fb2b-c56a-4207-b1fd-158f43dd93d1">→</i><strong shuku-edit-id="e-587eeb4f-be5c-409c-8055-786d6c70e3bd">深度？</strong></div><h2 shuku-edit-id="e-e63b855f-9c01-4f37-9bd8-4d901558c435">“深度、学习”此时都还没生成。</h2><Button variant="primary" onClick={() => setPhase('range')}>展开训练的完整输入 →</Button></section> : <>
      <div shuku-edit-id="e-b234f42f-4fee-4e86-8e74-3013fe41272f" className="tr-mask-bridge-board-heading"><strong shuku-edit-id="e-ed70b6c8-3499-423d-92b2-6f90b45d70b4">{result ? '✓ 范围正确' : '选一段可读范围'}</strong><span shuku-edit-id="e-83ce9685-7629-47b3-8fad-452590533b5b">{result ? '自己和前文可读，所有后文不可读' : '点击最后一个可读输入，或拖动边界'}</span></div>
      <svg shuku-edit-id="e-0efc9721-9b7a-4ccf-87c7-31dc3a1cb3f2" viewBox="0 0 1400 305" role="group" aria-label="选择从开始到某个输入的连续可读范围，预测位置可在下方切换" onPointerMove={moveBoundary} onPointerUp={() => { dragging.current = false; }} onPointerCancel={() => { dragging.current = false; }}>
        <defs shuku-edit-id="e-b0e7659d-c188-4539-994a-fd87f145a9ce"><pattern shuku-edit-id="e-174b00e8-9d3f-4c2a-a3b4-734f127e2501" id="tr-mask-bridge-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line shuku-edit-id="e-74936baf-0983-4f45-9b02-b9a96cfc2c52" y2="10" stroke="#c4d0d7" strokeWidth="3"/></pattern></defs>
        <text shuku-edit-id="e-a4347e92-b701-432a-99d2-e83ba8135837" x="40" y="92" className="tr-mask-bridge-row-label">译文输入</text><text shuku-edit-id="e-e740ee4b-394b-4c99-bf1d-aa815a0ceba6" x="40" y="256" className="tr-mask-bridge-row-label">预测目标</text>
        <rect shuku-edit-id="e-c2685b7d-48ae-463a-aedb-f12138cfebab" className="tr-mask-readable-range" x="207" y="43" width={196 + visibleEnd * 210} height="87" rx="20"/>
        {inputs.map((word, i) => <g shuku-edit-id="e-f644b619-7ddb-4d48-844a-61ac98f85e54" key={word} role={!result ? 'button' : undefined} tabIndex={!result ? 0 : undefined} aria-label={!result ? `可读范围截止到${word}` : undefined} onClick={() => selectBoundary(i)} onKeyDown={event => { if (!result && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            selectBoundary(i);
        } }} className={`tr-mask-bridge-input ${i <= visibleEnd ? 'is-in-range' : ''} ${result && i > position ? 'is-future' : ''} ${i === position ? 'is-current' : ''} ${feedback && i > position && i <= boundary ? 'is-wrong' : ''}`}><rect shuku-edit-id="e-fc44f8cb-f05f-4dde-8a06-2bc8f84eb426" x={220 + i * 210} y="56" width="170" height="61" rx="13"/><text shuku-edit-id="e-63ab1bf5-eca8-41a7-8f16-a9439ea516b5" x={305 + i * 210} y="95" textAnchor="middle">{word}</text>{i === position && <text shuku-edit-id="e-c65969df-32a3-436b-b37a-95e6c6550ab7" className="tr-mask-current-label" x={305 + i * 210} y="31" textAnchor="middle">当前位置</text>}</g>)}
        {result && position < 4 && <g shuku-edit-id="e-bc10fdbd-a3e9-4dea-997b-f10dde923012" className="tr-mask-future-range"><rect shuku-edit-id="e-a0f2a78f-3d24-4595-8f4d-f0fa00fd1aff" x={207 + (position + 1) * 210} y="43" width={(4 - position) * 210 - 14} height="87" rx="20"/><text shuku-edit-id="e-3ab0aa4b-5c34-4c4c-a39b-880252ed9c91" x={(207 + (position + 1) * 210 + 1243) / 2} y="157" textAnchor="middle">全部未来词 · 不可读取</text></g>}
        {!result && <g shuku-edit-id="e-90152bd9-4eec-4633-833a-80979c814e73" className="tr-mask-boundary-handle" role="slider" tabIndex={0} aria-label="可读范围右边界" aria-valuemin={0} aria-valuemax={4} aria-valuenow={boundary} aria-valuetext={`可读取${inputs.slice(0, boundary + 1).join('、')}`} onPointerDown={event => { dragging.current = true; event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId); event.preventDefault(); }} onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
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
        } }} transform={`translate(${403 + boundary * 210},0)`}><path shuku-edit-id="e-676f7e42-e16a-4c67-9db3-8facf81c0bba" d="M0 47 V143"/><circle shuku-edit-id="e-bc86f578-727a-4414-96e3-d4e0156c50a0" cx="0" cy="149" r="14"/><text shuku-edit-id="e-ed635c87-6d52-4ed1-aa0d-3a011ca2e822" x="0" y="156" textAnchor="middle">↔</text></g>}
        <text shuku-edit-id="e-30a003af-8dcc-46a0-8221-4412d87a10de" className="tr-mask-range-label" x={305 + visibleEnd * 105} y="162" textAnchor="middle">{result ? '可读取：自己和前文' : '你选择的可读范围'}</text>
        {answers.map((word, i) => <g shuku-edit-id="e-cae0d527-0293-4545-a004-cdd939ef5c37" key={word} role="button" tabIndex={0} aria-label={`选择预测${word}的位置`} aria-pressed={position === i} className={`tr-mask-bridge-target ${i === position ? 'is-question' : ''}`} onClick={() => selectPosition(i)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectPosition(i);
        } }}><path shuku-edit-id="e-a65b47d0-d8d4-4eb5-a8a2-e439cdb008e0" d={`M${305 + i * 210} 180 V213`}/><rect shuku-edit-id="e-5977359f-bde8-438a-96ae-f450437ff8be" x={220 + i * 210} y="221" width="170" height="61" rx="14"/><text shuku-edit-id="e-51137034-1393-4edd-89dc-8d17886702f0" x={305 + i * 210} y="259" textAnchor="middle">{word}</text></g>)}
      </svg>
      <div shuku-edit-id="e-e63d2114-6616-41e4-b19f-2399d7878bba" className={`tr-mask-bridge-question${result ? ' is-correct' : feedback ? ' is-incorrect' : ''}`} aria-live="polite">{result ? <><h2 shuku-edit-id="e-dd7ae500-8820-42b5-880a-5142a645f2af"><span shuku-edit-id="e-1c443355-77a9-4ff2-b165-70122735ef7d" className="tr-mask-feedback-icon">✓</span>范围正确：保留自己和前文，遮住所有后文。</h2><button shuku-edit-id="e-89af5674-cb63-4d66-b17a-9caea500895b" className="tr-mask-bridge-retry" onClick={() => { setPhase('range'); setFeedback(null); }}>重新选范围 ↶</button></> : <><h2 shuku-edit-id="e-5ea32458-377a-45f4-a0c7-769b9318d2c1">预测“{answers[position]}”时，可以读取哪些输入？</h2><div shuku-edit-id="e-02721105-8841-4760-b172-4c318b4a5b4b" className="tr-mask-range-actions">{feedback ? <p shuku-edit-id="e-e1115fc3-81d0-4a36-9fe9-01feb8757827" className="tr-mask-range-feedback"><span shuku-edit-id="e-e129bf9b-bb79-463c-b8f3-8094e13452e6" className="tr-mask-feedback-icon">✕</span>{feedback === 'future' ? <>范围包含未来词，不能提前读取答案。</> : <>范围太短：当前位置和前文都可以读取。</>}</p> : <p shuku-edit-id="e-4afd0dae-d7b7-414d-8098-2e83b9ff9c25">选好范围后，点击确认。</p>}<Button variant="primary" onClick={check}>确认这段范围</Button></div></>}</div>
      </>}
    </main>
    <footer shuku-edit-id="e-63506752-e239-4271-bcc8-b7a30b82b7e1"><Button variant="primary" onClick={onComplete}>看看掩码怎样实现 →</Button></footer>
  </section></LessonPageFrame>;
}
