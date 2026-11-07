import { useEffect, useState } from 'react';
import { Button } from '../../../shared/react/controls/Button';
import './LayerNormLessonCard.css';
const TOKENS = [
    { name: 'Token 1', mean: 20, std: 40, color: '#258398' },
    { name: 'Token 2', mean: -12, std: 18, color: '#af783d' },
    { name: 'Token 3', mean: 35, std: 55, color: '#8370a7' },
];
// Deterministic 512-dimensional examples, with the displayed population statistics.
const INPUTS = TOKENS.map((token, index) => {
    const raw = Array.from({ length: 512 }, (_, dim) => Math.sin((dim + 1) * .73 + index) + .6 * Math.cos((dim + 1) * .31 + index));
    const mean = raw.reduce((sum, value) => sum + value, 0) / 512;
    const std = Math.sqrt(raw.reduce((sum, value) => sum + (value - mean) ** 2, 0) / 512);
    return raw.map(value => token.mean + token.std * (value - mean) / std);
});
const currentValues = (index: number, applied: boolean, affine: boolean) => INPUTS[index].map(value => applied ? (affine ? 2 : 1) * (value - TOKENS[index].mean) / Math.sqrt(TOKENS[index].std ** 2 + 1e-5) + (affine ? 1 : 0) : value);
const format = (value: number) => Math.abs(value) < .005 ? '0.00' : value.toFixed(2);
function TokenStatistics({ token, applied, affine, onOpen }: {
    token: typeof TOKENS[number];
    applied: boolean;
    affine: boolean;
    onOpen: () => void;
}) {
    const mean = applied ? affine ? 1 : 0 : token.mean;
    const std = applied ? affine ? 2 : 1 : token.std;
    const baseline = 207, scale = 2.35;
    return <article className="ln3-token" style={{ borderTopColor: token.color }} role="button" tabIndex={0} aria-label={`查看 ${token.name} 的具体数值`} onClick={onOpen} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onOpen();
    } }}>
    <header><h2 style={{ color: token.color }}>{token.name}</h2><span>512 维</span></header>
    <svg viewBox="0 0 420 290" role="img" aria-label={`${token.name}：均值 ${format(mean)}，标准差 ${format(std)}`}>
      {[0, 20, 40, 60].map(tick => <g key={tick}><line x1="48" x2="395" y1={baseline - tick * scale} y2={baseline - tick * scale}/><text x="38" y={baseline - tick * scale + 6} textAnchor="end" className="ln3-tick">{tick}</text></g>)}
      {[{ label: '均值', value: mean, x: 117 }, { label: '标准差', value: std, x: 292 }].map(item => <g key={item.label}>
        <rect className="ln3-bar" x={item.x - 38} y={Math.min(baseline, baseline - item.value * scale)} width="76" height={Math.max(2, Math.abs(item.value) * scale)} rx="5" fill={token.color}/>
        <text className="ln3-value" x={item.x} y={item.value < 0 ? baseline - 15 : baseline - item.value * scale - 15} textAnchor="middle" fill={token.color}>{format(item.value)}</text>
        <text className="ln3-label" x={item.x} y="282" textAnchor="middle">{item.label}</text>
      </g>)}
    </svg>
    <div className={`ln3-state${applied ? ' is-applied' : ''}`}>{applied ? affine ? '教学示例 · γ=2，β=1' : '标准化后 · 初始 γ=1，β=0' : '残差相加后'}</div>
  </article>;
}
export function LayerNormLessonCard({ onComplete }: {
    onComplete: () => void;
}) {
    const [applied, setApplied] = useState(false);
    const [affine, setAffine] = useState(false);
    const [formula, setFormula] = useState(false);
    const [selectedToken, setSelectedToken] = useState<number | null>(null);
    useEffect(() => {
        if (!formula && selectedToken === null)
            return;
        const close = (event: KeyboardEvent) => { if (event.key === 'Escape') {
            setFormula(false);
            setSelectedToken(null);
        } };
        window.addEventListener('keydown', close);
        return () => window.removeEventListener('keydown', close);
    }, [formula, selectedToken]);
    return <section className="ln3-page">
    <header className="tr-lesson-header"><h1>层规范化：帮助稳定训练</h1><p>点击“应用层规范化”，观察三个 Token 的均值和标准差在原位变化。</p></header>
    <main className="ln3-tokens">{TOKENS.map((token, index) => <TokenStatistics key={token.name} token={token} applied={applied} affine={affine} onOpen={() => setSelectedToken(index)}/>)}</main>
    <div className="ln3-click-hint">↖ 点击任一 Token，查看它的 512 个具体数值</div>
    <div className="ln3-lower"><button className="ln3-formula-card" onClick={() => setFormula(true)} aria-label="点击公式卡片，展开层规范化原理"><span>LayerNorm</span><strong>LN(x) = γ ⊙ <span className="ln3-fraction"><span>x − μ</span><span>√(σ² + ε)</span></span> + β</strong><em>点击公式，展开原理 ↗</em></button><section className="ln3-explanation" aria-live="polite">
      {!applied ? <div><h2>数值尺度变化，可能使训练<em className="ln3-unstable">不稳定</em></h2><p>层规范化调整每个 Token 的数值中心与波动幅度，帮助改善训练的<em className="ln3-unstable">不稳定</em>。</p></div> : affine ? <div><h2>γ、β <mark>通过训练学习</mark></h2><p><mark>每一维乘 γ、加 β。</mark><mark>2、1 仅作演示。</mark><br /><strong>1、0 没有错；2、1 也不是训练目标。</strong></p></div> : <div className="ln3-rule-layout"><div className="ln3-rule-grid"><div><h3>统计量<mark>各自计算</mark></h3><p>每个 Token 单独计算<br />自己的均值和标准差。</p></div><div><h3>参数<mark>共同使用</mark></h3><p>这个模块的所有 Token<br />共享一套 γ、β。</p></div></div><p className="ln3-initial-rule"><mark>初始 γ=1、β=0</mark>：乘 1、加 0，保持标准化结果。</p></div>}

    </section></div>
    <footer className="ln3-footer"><span>512 维教学示例</span>{applied && <button onClick={() => { setApplied(false); setAffine(false); }}>重新演示 ↶</button>}<Button variant="primary" onClick={() => { if (!applied)
        setApplied(true);
    else if (!affine)
        setAffine(true);
    else
        onComplete(); }}>{!applied ? '应用层规范化 →' : !affine ? '用示例看 γ、β 的作用 →' : '继续：组装编码器 →'}</Button></footer>
    {selectedToken !== null && <div className="ln3-shade" onClick={() => setSelectedToken(null)}><section className="ln3-values-dialog" role="dialog" aria-modal="true" aria-label={`${TOKENS[selectedToken].name} 的具体数值`} onClick={event => event.stopPropagation()}><button autoFocus onClick={() => setSelectedToken(null)}>关闭 ×</button><h2>{TOKENS[selectedToken].name} · 512 个分量 · {applied ? affine ? '缩放与平移后' : '标准化后' : '残差相加后'}</h2><p>均值 {format(applied ? affine ? 1 : 0 : TOKENS[selectedToken].mean)}　标准差 {format(applied ? affine ? 2 : 1 : TOKENS[selectedToken].std)}{applied && <>　当前参数 γ={affine ? 2 : 1}，β={affine ? 1 : 0}</>}</p>{applied && <div className="ln3-values-rule">每一维：{affine ? '标准化后的数值 × 2 + 1' : '(原数值 − 当前 Token 的均值) ÷ √(方差 + ε)'}</div>}<div className="ln3-values-grid">{currentValues(selectedToken, applied, affine).map((value, index) => <div key={index}><span>第 {index + 1} 维</span><strong>{format(value)}</strong></div>)}</div></section></div>}
    {formula && <div className="ln3-shade" onClick={() => setFormula(false)}><section role="dialog" aria-modal="true" aria-label="层规范化公式" onClick={event => event.stopPropagation()}><button autoFocus onClick={() => setFormula(false)}>关闭 ×</button><h2>在每个 Token 的 512 个分量内计算</h2><div className="ln3-formula">LN(x) = γ ⊙ (x − μ) / √(σ² + ε) + β</div><p>μ、σ²：由当前 Token 单独计算，不跨 Token 求统计量。</p><p>γ、β：这个层规范化模块处理的所有 Token 共享一套参数。每一维各有一个 γ 和 β，分别通过训练学习；其他层规范化模块有各自的参数。</p><p>先将每个分量标准化，再乘对应维度的 γ，加对应维度的 β。ε 避免分母为零。</p></section></div>}
  </section>;
}
