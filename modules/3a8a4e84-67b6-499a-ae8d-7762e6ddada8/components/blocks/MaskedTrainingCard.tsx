import { useEffect, useState } from 'react';
import { Button } from "@shuku/course-style/react/controls/Button";
import { LessonPageFrame } from '../LessonPageFrame';
import { MaskParallelTransition } from './MaskParallelTransition';
import './MaskedTrainingCard.css';
interface MaskedTrainingCardProps {
    onComplete: () => void;
}
const input = ['〈开始〉', '我', '爱', '深度', '学习'];
// Teaching examples of the scaled scores S = QKᵀ / √d_k, not trained-model measurements.
const scores = [[1.1, .6, .4, 1.2, .8], [.8, 1.3, .7, .9, 1.5], [1.6, .3, 1.1, 2, .7], [.2, 1.6, .5, 1.1, .8], [1.2, .1, 1.8, .6, 1]];
const weights = scores.map((row, i) => {
    const total = row.slice(0, i + 1).reduce((sum, value) => sum + Math.exp(value), 0);
    return row.map((value, j) => j <= i ? Math.exp(value) / total : 0);
});
export function MaskedTrainingCard({ onComplete }: MaskedTrainingCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [masked, setMasked] = useState(false);
    const [scoresVisible, setScoresVisible] = useState(false);
    const [formula, setFormula] = useState(false);
    const [calculationPhase, setCalculationPhase] = useState(0);
    const [maskReady, setMaskReady] = useState(false);
    useEffect(() => {
        if (!masked)
            return;
        const timers = [setTimeout(() => setCalculationPhase(1), 550), setTimeout(() => setMaskReady(true), 1250)];
        return () => timers.forEach(clearTimeout);
    }, [masked]);
    useEffect(() => {
        if (calculationPhase !== 2)
            return;
        const timer = setTimeout(() => setCalculationPhase(3), 950);
        return () => clearTimeout(timer);
    }, [calculationPhase]);
    if (expanded)
        return <MaskParallelTransition onComplete={onComplete}/>;
    return <LessonPageFrame><section shuku-edit-id="e-53a5c67d-8960-4cd9-935a-5ca877d10e08" className="tr-mask19-page">
    <header shuku-edit-id="e-f1de8a42-4645-40a5-ad78-4d055adf5d31" className="tr-lesson-header"><h2 shuku-edit-id="e-139b36f0-00ab-45fd-a7a5-2085c232cea8">把可见边界，变成注意力掩码</h2><p shuku-edit-id="e-4bed6a74-44ea-4b5a-b0db-4be8ea3234b7">{!scoresVisible ? '点击“先看匹配分数”，从预测“深度”的位置开始观察。' : !masked ? '点击“遮住所有未来位置”，留意右侧两个分数怎样变化。' : calculationPhase < 2 ? '观察后文分数变成 −∞，再点击下方按钮，看看 Softmax 后的权重。' : !formula ? '对照分数与权重的变化，再点击“把过程写成公式”。' : '对照公式与刚才的过程，再扩展到所有预测位置。'}</p></header>
    <main shuku-edit-id="e-6d5c9490-aa34-456e-9e1d-24b3ffc986d3" className="tr-mask19-content">
      <section shuku-edit-id="e-e86c5aed-48f2-4d5b-b308-e3ca35102fab" className="tr-mask19-single">
        <div shuku-edit-id="e-ec238570-7748-49f7-a056-e250e92783d6" className="tr-mask19-section-head"><div shuku-edit-id="e-08063b7e-5577-4e2c-b1c3-607c5127950d"><span shuku-edit-id="e-59afe644-43b3-40af-8e9c-bc93757e3b68" className="tr-mask19-eyebrow">接着上一页的可见边界</span><h3 shuku-edit-id="e-48077d55-2aaa-40b6-8140-9392fe7f030d">“爱”这个位置，正在预测 <mark shuku-edit-id="e-58f97355-5c27-4762-8d4c-f8c04df35e7c">深度</mark></h3></div><span shuku-edit-id="e-067efc12-078b-40a5-a1c7-5f0ae4a7cff7" className="tr-mask19-side-note">能读取：〈开始〉我 爱</span></div>
        <p shuku-edit-id="e-e66bc27a-5808-4ad2-ab1d-865891dab51b" className="tr-mask19-operation">译文自注意力 · {calculationPhase >= 2 ? <>掩码在 <mark shuku-edit-id="e-64fb05fe-635d-4db2-8215-2a7c1c3813ba">Softmax 之前</mark>生效，后文不会参与信息汇聚。</> : scoresVisible ? <>已算出匹配分数，接下来在 <mark shuku-edit-id="e-7377d34e-9fff-4ba2-b515-9cc37b1a947f">Softmax 之前加掩码</mark>。</> : <>先用 Q 与 K 计算分数，看看“爱”会关注哪些输入。</>}</p>
        <div shuku-edit-id="e-ef95ee79-e874-4ca6-988a-f068d0e1a1bb" className={`tr-mask19-calculation tr-mask19-inplace${masked ? ' is-masking' : ''}`}>
          <div shuku-edit-id="e-26899c48-cdab-4cd5-9880-ea683594b918" className="tr-mask19-row tr-mask19-token-row"><span shuku-edit-id="e-58513d06-4fad-48c8-a5cf-8e8fd21e63f7">译文输入</span>{input.map((word, j) => <strong shuku-edit-id="e-92515c2f-52ba-4aa9-80d3-da6b3e821a73" key={word} className={masked && j > 2 ? 'is-blocked' : j === 2 ? 'is-focus' : ''}>{word}{j === 2 && <small shuku-edit-id="e-6a82f034-1dad-478d-bd7b-3c04c9a51ccf">当前位置</small>}</strong>)}<i shuku-edit-id="e-ded26208-1092-4973-8f85-b38bd73cca63" className={`tr-mask19-future-cover${masked ? ' is-covered' : ''}`} aria-hidden="true"/><span shuku-edit-id="e-15e2689e-0eaf-4050-ac69-e0c14fce3840" className="tr-mask19-future-label">未来词 · 不可读取</span></div>
          <div shuku-edit-id="e-4d1e3f8b-3f34-4a40-8602-e7107c4ee561" className={`tr-mask19-live-row tr-mask19-row${calculationPhase >= 2 ? ' is-weights' : ''}${!scoresVisible ? ' is-unshown' : ''}`} aria-hidden={!scoresVisible} aria-live="polite"><span shuku-edit-id="e-b08eb493-5287-4ad4-986c-b11e535c39d5">{calculationPhase >= 2 ? '注意力权重' : calculationPhase === 1 ? '遮挡后的分数' : '匹配分数'}</span>{scores[2].map((score, j) => <b shuku-edit-id="e-1ea036ed-ee1d-4808-b2f8-6185e2dbab91" key={j} className={j > 2 && calculationPhase > 0 ? 'is-future' : ''}><span shuku-edit-id="e-33bf1115-fb50-4ff5-a375-0a418fafaed3" className="tr-mask19-value-stack"><span shuku-edit-id="e-eb96a888-9f31-45de-88ae-338a7bf883aa" aria-hidden={!(calculationPhase < 2 && !(j > 2 && calculationPhase >= 1))} className={calculationPhase < 2 && !(j > 2 && calculationPhase >= 1) ? 'is-visible' : ''}>{score.toFixed(1)}</span>{j > 2 && <span shuku-edit-id="e-24b07801-4231-4cd3-a0d9-feef248acef3" aria-hidden={calculationPhase !== 1} className={calculationPhase === 1 ? 'is-visible' : ''}>−∞</span>}<span shuku-edit-id="e-286410c7-dbf6-460f-957a-5a802f21f16c" aria-hidden={calculationPhase < 2} className={calculationPhase >= 2 ? 'is-visible' : ''}>{weights[2][j].toFixed(3)}</span></span></b>)}</div>
          <div shuku-edit-id="e-4bc23270-1969-4aa6-8130-411014647620" className={`tr-mask19-animation-caption${!masked && scoresVisible ? ' is-intro' : ''}`} aria-live="polite">{formula ? <><span shuku-edit-id="e-44baab51-650f-4049-9336-1ed46b9df77b" className="tr-mask19-eyebrow">最后，把刚才的过程写成公式</span><strong shuku-edit-id="e-af5c6aae-400f-4240-bded-16f2347d995a" className="tr-mask19-final-formula">S = QKᵀ / √dₖ　　A = Softmax(S + M)</strong><p shuku-edit-id="e-aa8c7f7f-e284-472d-b6e0-0a7dc84ddfab">允许读取处 M = 0，所有未来位置 M = −∞；exp(−∞) = <mark shuku-edit-id="e-1f97033a-344b-41fc-a60e-76d29f726539">0</mark>。</p></> : <><strong shuku-edit-id="e-fe51fac1-8f51-40a5-a934-ca9cdab2dbc8">{!scoresVisible ? '先算“爱”与各输入的匹配程度' : !masked ? '“深度、学习”是未来词' : calculationPhase === 0 ? '先遮住所有未来词' : calculationPhase === 1 ? '后文分数已变成 −∞' : '转成权重，后文就归零了'}</strong><p shuku-edit-id="e-9978bc74-0268-4bb8-8aec-a270c4946e7f">{!scoresVisible ? '这一步使用自注意力的 Q 和 K；算完分数后，再限制可读范围。' : !masked ? '生成到“爱”时，它们还没有出现，不能参与这次预测。' : calculationPhase === 0 ? '可读范围仍然是：〈开始〉我 爱。' : calculationPhase === 1 ? <>Softmax 中 exp(−∞)=<mark shuku-edit-id="e-d3f7340c-fc44-4462-99a6-eb77d759ad13">0</mark>，因此被遮位置的权重将变为 0。</> : <>Softmax 中 exp(−∞)=<mark shuku-edit-id="e-8e011895-0ba3-40f0-b888-9a9222e198a5">0</mark>，因此被遮位置的权重为 0。</>}</p></>}</div>
          <div shuku-edit-id="e-37229fbd-8a57-4f33-8275-3c52df9a0040" className={`tr-mask19-flow-result${calculationPhase >= 2 ? ' is-visible' : ''}`}><span shuku-edit-id="e-4c6f808d-0aa4-4b45-8c2c-0d6eb3881e93">只汇聚可读位置的信息</span><i shuku-edit-id="e-1c4753c5-532c-48e4-a198-24882e251588">→</i><strong shuku-edit-id="e-aa3f2878-71cd-4d07-ac0a-06c0ae2061f0">预测：深度</strong></div>
        </div>
      </section>
    </main>
    <footer shuku-edit-id="e-a8c82718-c37c-42ef-8f2e-74ebe713fef2" className="tr-mask19-footer"><small shuku-edit-id="e-3293ccd8-11c7-48d4-882b-75845f70ff67">同一句译文，按词块示意并省略标点；注意力数值为教学示例。</small><div shuku-edit-id="e-af2eca57-aebe-40b8-afa1-787f07cb8a28"><Button variant="primary" disabled={(masked && !maskReady) || calculationPhase === 2} onClick={() => { if (!scoresVisible)
        setScoresVisible(true);
    else if (!masked)
        setMasked(true);
    else if (calculationPhase === 1)
        setCalculationPhase(2);
    else if (!formula)
        setFormula(true);
    else
        setExpanded(true); }}>{!scoresVisible ? '先看匹配分数 →' : !masked ? '遮住所有未来位置 →' : !maskReady ? '正在遮住未来位置…' : calculationPhase === 1 ? '经过 Softmax，看看权重 →' : calculationPhase === 2 ? '正在将分数转为权重…' : !formula ? '把过程写成公式 →' : '扩展到所有预测位置 →'}</Button></div></footer>
  </section></LessonPageFrame>;
}
