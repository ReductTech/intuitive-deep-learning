import { useEffect, useState } from 'react';
import { Button } from '../../../shared/react/controls/Button';
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
    return <LessonPageFrame><section className="tr-mask19-page">
    <header className="tr-lesson-header"><h2>把可见边界，变成注意力掩码</h2><p>{!scoresVisible ? '点击“先看匹配分数”，从预测“深度”的位置开始观察。' : !masked ? '点击“遮住所有未来位置”，留意右侧两个分数怎样变化。' : calculationPhase < 2 ? '观察后文分数变成 −∞，再点击下方按钮，看看 Softmax 后的权重。' : !formula ? '对照分数与权重的变化，再点击“把过程写成公式”。' : '对照公式与刚才的过程，再扩展到所有预测位置。'}</p></header>
    <main className="tr-mask19-content">
      <section className="tr-mask19-single">
        <div className="tr-mask19-section-head"><div><span className="tr-mask19-eyebrow">接着上一页的可见边界</span><h3>“爱”这个位置，正在预测 <mark>深度</mark></h3></div><span className="tr-mask19-side-note">能读取：〈开始〉我 爱</span></div>
        <p className="tr-mask19-operation">译文自注意力 · {calculationPhase >= 2 ? <>掩码在 <mark>Softmax 之前</mark>生效，后文不会参与信息汇聚。</> : scoresVisible ? <>已算出匹配分数，接下来在 <mark>Softmax 之前加掩码</mark>。</> : <>先用 Q 与 K 计算分数，看看“爱”会关注哪些输入。</>}</p>
        <div className={`tr-mask19-calculation tr-mask19-inplace${masked ? ' is-masking' : ''}`}>
          <div className="tr-mask19-row tr-mask19-token-row"><span>译文输入</span>{input.map((word, j) => <strong key={word} className={masked && j > 2 ? 'is-blocked' : j === 2 ? 'is-focus' : ''}>{word}{j === 2 && <small>当前位置</small>}</strong>)}<i className={`tr-mask19-future-cover${masked ? ' is-covered' : ''}`} aria-hidden="true"/><span className="tr-mask19-future-label">未来词 · 不可读取</span></div>
          <div className={`tr-mask19-live-row tr-mask19-row${calculationPhase >= 2 ? ' is-weights' : ''}${!scoresVisible ? ' is-unshown' : ''}`} aria-hidden={!scoresVisible} aria-live="polite"><span>{calculationPhase >= 2 ? '注意力权重' : calculationPhase === 1 ? '遮挡后的分数' : '匹配分数'}</span>{scores[2].map((score, j) => <b key={j} className={j > 2 && calculationPhase > 0 ? 'is-future' : ''}><span className="tr-mask19-value-stack"><span aria-hidden={!(calculationPhase < 2 && !(j > 2 && calculationPhase >= 1))} className={calculationPhase < 2 && !(j > 2 && calculationPhase >= 1) ? 'is-visible' : ''}>{score.toFixed(1)}</span>{j > 2 && <span aria-hidden={calculationPhase !== 1} className={calculationPhase === 1 ? 'is-visible' : ''}>−∞</span>}<span aria-hidden={calculationPhase < 2} className={calculationPhase >= 2 ? 'is-visible' : ''}>{weights[2][j].toFixed(3)}</span></span></b>)}</div>
          <div className={`tr-mask19-animation-caption${!masked && scoresVisible ? ' is-intro' : ''}`} aria-live="polite">{formula ? <><span className="tr-mask19-eyebrow">最后，把刚才的过程写成公式</span><strong className="tr-mask19-final-formula">S = QKᵀ / √dₖ　　A = Softmax(S + M)</strong><p>允许读取处 M = 0，所有未来位置 M = −∞；exp(−∞) = <mark>0</mark>。</p></> : <><strong>{!scoresVisible ? '先算“爱”与各输入的匹配程度' : !masked ? '“深度、学习”是未来词' : calculationPhase === 0 ? '先遮住所有未来词' : calculationPhase === 1 ? '后文分数已变成 −∞' : '转成权重，后文就归零了'}</strong><p>{!scoresVisible ? '这一步使用自注意力的 Q 和 K；算完分数后，再限制可读范围。' : !masked ? '生成到“爱”时，它们还没有出现，不能参与这次预测。' : calculationPhase === 0 ? '可读范围仍然是：〈开始〉我 爱。' : calculationPhase === 1 ? <>Softmax 中 exp(−∞)=<mark>0</mark>，因此被遮位置的权重将变为 0。</> : <>Softmax 中 exp(−∞)=<mark>0</mark>，因此被遮位置的权重为 0。</>}</p></>}</div>
          <div className={`tr-mask19-flow-result${calculationPhase >= 2 ? ' is-visible' : ''}`}><span>只汇聚可读位置的信息</span><i>→</i><strong>预测：深度</strong></div>
        </div>
      </section>
    </main>
    <footer className="tr-mask19-footer"><small>同一句译文，按词块示意并省略标点；注意力数值为教学示例。</small><div><Button variant="primary" disabled={(masked && !maskReady) || calculationPhase === 2} onClick={() => { if (!scoresVisible)
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
