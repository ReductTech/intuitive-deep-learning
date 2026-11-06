import { useState, type CSSProperties } from 'react';
import { Button } from '../../../shared/react/controls/Button';
import { LessonStage } from '../LessonStage';
import { Typography } from '../../../shared/react/typography/Typography';
import { multiply } from '../../domain/math';
import './SelfAttentionCard.css';
interface CompleteProps {
    onComplete: () => void;
}
const tokens = ['夜幕', '降临', '那座', '矗立', '在', '塞纳河畔', '的', '塔', '亮起', '金色灯光', '成为', '巴黎夜空', '最醒目', '轮廓'];
const semanticSeeds = [
    [.95, .10, .05, .25], [.75, .10, .05, .30], [.10, .20, .55, .10], [.05, .20, .75, .15],
    [.05, .45, .10, .05], [.15, .95, .35, .10], [.05, .10, .05, .05], [.10, .65, .95, .45],
    [.25, .15, .35, .90], [.35, .20, .30, 1.00], [.10, .15, .25, .15], [.85, .90, .25, .65],
    [.35, .20, .40, .85], [.20, .30, .70, .55],
];
const MODEL_DIM = 512;
const embeddings = semanticSeeds.map((seed, row) => Array.from({ length: MODEL_DIM }, (_, dim) => {
    const a = seed[dim % seed.length];
    const b = seed[(dim + 1) % seed.length];
    return a * Math.cos((dim + 1) * .071) + b * Math.sin((row + 1) * (dim + 1) * .013);
}));
const project512 = (matrix: number[][], phase: number) => matrix.map((row) => row.map((value, dim) => .62 * value + .23 * row[(dim + 17) % MODEL_DIM] - .15 * row[(dim + 71) % MODEL_DIM] + .04 * Math.sin((dim + 1) * phase)));
const queries = project512(embeddings, .37);
const keys = project512(embeddings, .83);
const values = project512(embeddings, 1.31);
const valueProjection = Array.from({ length: MODEL_DIM }, (_, row) => Array.from({ length: MODEL_DIM }, (_, column) => {
    if (column === row)
        return .62;
    if (column === (row + 17) % MODEL_DIM)
        return .23;
    if (column === (row + 71) % MODEL_DIM)
        return -.15;
    return 0;
}));
const scores = queries.map((query) => keys.map((key) => query.reduce((sum, value, index) => sum + value * key[index], 0) / Math.sqrt(key.length)));
const weights = scores.map((row) => {
    const peak = Math.max(...row);
    const exps = row.map((value) => Math.exp((value - peak) * 2.25));
    const total = exps.reduce((sum, value) => sum + value, 0);
    return exps.map((value) => value / total);
});
const outputs = multiply(weights, values);
function Bubble({ weight }: {
    weight: number;
}) {
    return <i className="tr-attention-bubble" style={{ '--bubble': weight } as CSSProperties}/>;
}
function TeachingHeatMatrix({ data, tone, labels = true, focus = 7 }: {
    data: number[][];
    tone: 'x' | 'w' | 'v' | 'z';
    labels?: boolean;
    focus?: number;
}) {
    let max = .001;
    data.forEach((row) => row.forEach((value) => { max = Math.max(max, Math.abs(value)); }));
    const columnIndices: Array<number | null> = data[0].length > 7 ? [0, 1, 2, null, data[0].length - 3, data[0].length - 2, data[0].length - 1] : data[0].map((_, index) => index);
    const rowIndices: Array<number | null> = !labels && data.length > 7 ? [0, 1, 2, null, data.length - 3, data.length - 2, data.length - 1] : data.map((_, index) => index);
    return <div className={`tr-teaching-heat is-${tone} ${labels ? 'has-labels' : ''}`} style={{ '--heat-columns': columnIndices.length } as CSSProperties}>
    {rowIndices.flatMap((rowIndex, displayRow) => [
            ...(labels ? [<strong className={rowIndex === focus ? 'is-focus' : ''} key={`label-${displayRow}`}>{rowIndex === null ? '…' : tokens[rowIndex]}</strong>] : []),
            ...columnIndices.map((columnIndex, displayColumn) => rowIndex === null || columnIndex === null
                ? <i className="is-ellipsis" key={`${displayRow}-${displayColumn}`}>…</i>
                : <i className={rowIndex === focus ? 'is-focus' : ''} style={{ '--heat': Math.abs(data[rowIndex][columnIndex]) / max } as CSSProperties} key={`${displayRow}-${displayColumn}`}/>),
        ])}
  </div>;
}
function StaticPatternGrid({ focus = 7 }: {
    focus?: number;
}) {
    return <div className="tr-static-pattern" style={{ '--matrix-count': tokens.length } as CSSProperties}>
    {weights.flatMap((row, rowIndex) => row.map((weight, columnIndex) => <span className={rowIndex === focus ? 'is-focus' : ''} key={`${rowIndex}-${columnIndex}`}><Bubble weight={weight}/></span>))}
  </div>;
}
export function SelfAttentionCard({ onComplete, phase = 'aggregate', summaryOnly = false }: CompleteProps & {
    phase?: 'value' | 'aggregate';
    summaryOnly?: boolean;
}) {
    const step = phase === 'value' ? 0 : 1;
    const [revealed, setRevealed] = useState(summaryOnly);
    return <LessonStage kicker="注意力机制 · 汇聚信息" title={step === 0 ? 'Value：为每个词准备可传递的信息' : '自注意力：按权重汇聚句内信息'} description={step === 0 ? '对照输入与投影结果，观察每个位置怎样得到自己的 V。' : revealed ? '沿连线回看 Q、K、V 的来源，判断“自”体现在哪里。' : '先对照权重与 Value，再展开汇聚结果，观察每行输出。'} className="tr-stage tr-self-aggregate-stage">
    {!summaryOnly && (step === 0 ? <section className="tr-value-figure" aria-label="生成 Value 矩阵">
      <header><Typography variant="h2">为每个 Token 生成 Value</Typography><code>V = XW<sub>V</sub></code></header>
      <div className="tr-matrix-flow is-value-origin">
        <div><Typography variant="h3">原始 Token 表示 X</Typography><TeachingHeatMatrix data={embeddings} tone="x"/><small>14 × 512（中间维度以 … 收起）</small></div>
        <b>×</b>
        <div><Typography variant="h3">线性投影 W<sub>V</sub></Typography><TeachingHeatMatrix data={valueProjection} tone="w" labels={false} focus={-1}/><small>512 × 512</small></div>
        <b>=</b>
        <div><Typography variant="h3">Value 矩阵 V</Typography><TeachingHeatMatrix data={values} tone="v"/><small>14 × 512（中间维度以 … 收起）</small></div>
      </div>
      <p>每一行都从原始表示变成一份可以被传递的 <b>Value 信息</b>。</p>
    </section> : <section className="tr-value-figure" aria-label="按照注意力权重汇聚 Value">
      <header><Typography variant="h2">按照注意力权重汇聚 Value</Typography><code>Z = AV</code></header>
      <div className="tr-matrix-flow is-value-aggregate">
        <div><Typography variant="h3">注意力权重 A</Typography><StaticPatternGrid /><small>14 × 14（每行对应一个 Query）</small></div>
        <b>×</b>
        <div><Typography variant="h3">Value 矩阵 V</Typography><TeachingHeatMatrix data={values} tone="v"/><small>14 × 512</small></div>
        <b>=</b>
        <div><Typography variant="h3">上下文表示 Z</Typography><TeachingHeatMatrix data={outputs} tone="z"/><small>14 × 512</small></div>
        <aside><code>z<sub>i</sub> = Σ<sub>j</sub> α<sub>ij</sub>v<sub>j</sub></code><p><b>α<sub>ij</sub></b> 决定第 j 个词取多少；<strong>v<sub>j</sub></strong> 决定第 j 个词提供什么。</p><span>所有信息按比例混合，形成新的 z<sub>i</sub>。</span></aside>
      </div>
      <p><b>Q、K 负责选择信息</b>　·　<strong>V 负责提供信息</strong></p>
    </section>)}
    {step === 0 && <div className="tr-self-page-action"><Button variant="primary" onClick={onComplete}>继续：按权重汇聚信息</Button></div>}
    {step === 1 && !revealed && <div className="tr-self-page-action"><Button variant="primary" onClick={() => setRevealed(true)}>安装自注意力眼镜</Button></div>}
    {step === 1 && revealed && <section className="tr-self-reveal" aria-label="自注意力结论">
      <header><span>回看信息从哪里来</span><Typography variant="h2">原来，这就是“自”注意力</Typography></header>
      <div className="tr-self-source-map">
        <div className="is-source"><small>同一句话</small><b>X</b></div>
        <i>→</i>
        <div className="is-branches"><span><b>Q</b><small>提出问题</small></span><span><b>K</b><small>接受匹配</small></span><span><b>V</b><small>提供信息</small></span></div>
      </div>
      <div className="tr-self-takeaways"><span><b>同一来源</b><small>Q、K、V 都来自 X</small></span><span><b>句内关联</b><small>词与同一句话中的词建立联系</small></span><span><b>同源 ≠ 相同</b><small>分别使用三组投影参数，数值不必相同</small></span></div>
      <footer><strong>“自”描述的是信息来源。</strong><Button variant="primary" onClick={onComplete}>继续：多头注意力</Button></footer>
    </section>}
  </LessonStage>;
}
