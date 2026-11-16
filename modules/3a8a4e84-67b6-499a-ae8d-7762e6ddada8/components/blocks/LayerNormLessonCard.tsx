import { useEffect, useState } from 'react';
import { Button } from "@shuku/course-style/react/controls/Button";
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
    return <article shuku-edit-id="e-dde9773b-0848-4690-8e9a-6aaa4635af99" className="ln3-token" style={{ borderTopColor: token.color }} role="button" tabIndex={0} aria-label={`查看 ${token.name} 的具体数值`} onClick={onOpen} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onOpen();
    } }}>
    <header shuku-edit-id="e-5f06f38a-60fd-43df-bb23-d542f31f5767"><h2 shuku-edit-id="e-c18f3f8e-fbb6-46b1-b199-242617e57aa5" style={{ color: token.color }}>{token.name}</h2><span shuku-edit-id="e-08ee6d04-0b17-421d-99d6-b73b133b5fc6">512 维</span></header>
    <svg shuku-edit-id="e-4a2085b0-fb8e-47bc-a440-a11cd0acdbe2" viewBox="0 0 420 290" role="img" aria-label={`${token.name}：均值 ${format(mean)}，标准差 ${format(std)}`}>
      {[0, 20, 40, 60].map(tick => <g shuku-edit-id="e-0d794384-9084-4a01-abe1-67d351d81896" key={tick}><line shuku-edit-id="e-4b94d85b-ad04-4226-a33f-d691c2baca89" x1="48" x2="395" y1={baseline - tick * scale} y2={baseline - tick * scale}/><text shuku-edit-id="e-c2637cf5-f061-4cd0-96f3-9c3fbadfa8d3" x="38" y={baseline - tick * scale + 6} textAnchor="end" className="ln3-tick">{tick}</text></g>)}
      {[{ label: '均值', value: mean, x: 117 }, { label: '标准差', value: std, x: 292 }].map(item => <g shuku-edit-id="e-4515d822-5256-4a36-b8f7-be70f367ed0d" key={item.label}>
        <rect shuku-edit-id="e-bc1973ef-a1b1-4e5a-a25c-aa40f818d280" className="ln3-bar" x={item.x - 38} y={Math.min(baseline, baseline - item.value * scale)} width="76" height={Math.max(2, Math.abs(item.value) * scale)} rx="5" fill={token.color}/>
        <text shuku-edit-id="e-7b785c64-19e1-48c9-9856-cd9a10f13c82" className="ln3-value" x={item.x} y={item.value < 0 ? baseline - 15 : baseline - item.value * scale - 15} textAnchor="middle" fill={token.color}>{format(item.value)}</text>
        <text shuku-edit-id="e-86ec3884-fcd7-4938-a2b0-20a342e044e9" className="ln3-label" x={item.x} y="282" textAnchor="middle">{item.label}</text>
      </g>)}
    </svg>
    <div shuku-edit-id="e-4aaa7117-ca93-4429-bc80-be030b75231c" className={`ln3-state${applied ? ' is-applied' : ''}`}>{applied ? affine ? '教学示例 · γ=2，β=1' : '标准化后 · 初始 γ=1，β=0' : '残差相加后'}</div>
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
    return <section shuku-edit-id="e-d728127d-155f-455a-ab32-ecbb701ae5e2" className="ln3-page">
    <header shuku-edit-id="e-b8b7af9f-ce4f-4967-8aef-07cd7c937daa" className="tr-lesson-header"><h1 shuku-edit-id="e-a06a8308-3e21-49e4-aff4-04d7ce8b4ed7">层规范化：帮助稳定训练</h1><p shuku-edit-id="e-e36b9293-4194-44f4-a873-f1f6804779da">点击“应用层规范化”，观察三个 Token 的均值和标准差在原位变化。</p></header>
    <main shuku-edit-id="e-f7feb78b-7ed8-4f7b-accc-048922c343e2" className="ln3-tokens">{TOKENS.map((token, index) => <TokenStatistics key={token.name} token={token} applied={applied} affine={affine} onOpen={() => setSelectedToken(index)}/>)}</main>
    <div shuku-edit-id="e-98580069-2338-480a-a4c4-12458b0a4822" className="ln3-click-hint">↖ 点击任一 Token，查看它的 512 个具体数值</div>
    <div shuku-edit-id="e-8f764b3b-507d-4cc0-aa5c-e1b28430ffa0" className="ln3-lower"><button shuku-edit-id="e-c5eec60a-8c31-494a-aaef-91d50ed8fc0f" className="ln3-formula-card" onClick={() => setFormula(true)} aria-label="点击公式卡片，展开层规范化原理"><span shuku-edit-id="e-9ec6fc6b-3812-4624-84da-006bfe7496db">LayerNorm</span><strong shuku-edit-id="e-9f9e76ca-324f-4625-bc32-1084c2c53d8f">LN(x) = γ ⊙ <span shuku-edit-id="e-47342097-7962-4c9f-a970-328f228cc076" className="ln3-fraction"><span shuku-edit-id="e-63c2ee3a-7842-4613-a4e6-707ad4b555a5">x − μ</span><span shuku-edit-id="e-f6c9e91c-557f-4cb7-a9d1-3065bad6dd92">√(σ² + ε)</span></span> + β</strong><em shuku-edit-id="e-f262a7f3-fe80-42cc-b85d-ac34d41a9f6a">点击公式，展开原理 ↗</em></button><section shuku-edit-id="e-1b7c8299-d3b5-438a-949e-63f80cd6b731" className="ln3-explanation" aria-live="polite">
      {!applied ? <div shuku-edit-id="e-b2e50c62-5bfa-454f-a286-74fcd6483753"><h2 shuku-edit-id="e-1487dcbd-1a26-492f-9bd2-3ec2bc3b431e">数值尺度变化，可能使训练<em shuku-edit-id="e-4379bd8b-c62e-49b0-bb57-5cc53dd404ae" className="ln3-unstable">不稳定</em></h2><p shuku-edit-id="e-5a4b98fe-de93-4c4b-8b5f-a60c2ed84f52">层规范化调整每个 Token 的数值中心与波动幅度，帮助改善训练的<em shuku-edit-id="e-7a3d9458-806b-42c2-b48b-1e0af9609e46" className="ln3-unstable">不稳定</em>。</p></div> : affine ? <div shuku-edit-id="e-b7deaaec-9f55-40d4-a75f-aa208627f9aa"><h2 shuku-edit-id="e-88c06a07-d70f-425c-84b4-12831308d2ff">γ、β <mark shuku-edit-id="e-190c3105-adfb-4947-8cb7-8468251ace87">通过训练学习</mark></h2><p shuku-edit-id="e-f7034c69-3549-4878-89ab-0d081fb1f296"><mark shuku-edit-id="e-ecf300a5-a713-4ff2-b672-adbb9c812fa1">每一维乘 γ、加 β。</mark><mark shuku-edit-id="e-729d255d-4d2c-4e6e-9b5a-e2e9e1f4fac6">2、1 仅作演示。</mark><br shuku-edit-id="e-45eecf25-2670-4e63-8026-a1a16ba79d82" /><strong shuku-edit-id="e-b7168ec6-438d-44e2-becd-6d67cb41f524">1、0 没有错；2、1 也不是训练目标。</strong></p></div> : <div shuku-edit-id="e-5d43678f-36c9-4f31-9b2f-e04d90449456" className="ln3-rule-layout"><div shuku-edit-id="e-07f5bde8-2e05-476c-b347-33b412ee24f0" className="ln3-rule-grid"><div shuku-edit-id="e-932704aa-9fae-4492-bacf-17008e03872b"><h3 shuku-edit-id="e-09580a67-7cb3-401f-9d13-27bd7a9c2747">统计量<mark shuku-edit-id="e-49ad70e9-ca2c-4cfc-85e1-66b4f104eba0">各自计算</mark></h3><p shuku-edit-id="e-abc63754-408f-4b67-859f-042707b13425">每个 Token 单独计算<br shuku-edit-id="e-cce2414a-95d3-4985-b50b-ff14c826554c" />自己的均值和标准差。</p></div><div shuku-edit-id="e-d6aea82d-2ad8-428a-a644-5f205d406a0f"><h3 shuku-edit-id="e-398ea34c-dab9-4e3a-8978-6e42d2a09ed3">参数<mark shuku-edit-id="e-35fe6014-b067-4e14-992b-3ce7ae89da9c">共同使用</mark></h3><p shuku-edit-id="e-be03d8b4-ba13-471b-b878-a95265654afd">这个模块的所有 Token<br shuku-edit-id="e-fafc6e47-e81e-4349-9d16-73e1ef9b428f" />共享一套 γ、β。</p></div></div><p shuku-edit-id="e-8ddfdc25-db83-4c9f-b0b2-9df227a5f691" className="ln3-initial-rule"><mark shuku-edit-id="e-7cc56ca4-a38c-4719-91ec-3137c0866275">初始 γ=1、β=0</mark>：乘 1、加 0，保持标准化结果。</p></div>}

    </section></div>
    <footer shuku-edit-id="e-70a1d077-ac06-44b6-afa0-1cd391aca39b" className="ln3-footer"><span shuku-edit-id="e-b8fc5fd4-2ec4-41a2-96b1-4bd589b7fde9">512 维教学示例</span>{applied && <button shuku-edit-id="e-4abe5f2c-e904-4980-ba72-b3b5cf04b95c" onClick={() => { setApplied(false); setAffine(false); }}>重新演示 ↶</button>}<Button variant="primary" onClick={() => { if (!applied)
        setApplied(true);
    else if (!affine)
        setAffine(true);
    else
        onComplete(); }}>{!applied ? '应用层规范化 →' : !affine ? '用示例看 γ、β 的作用 →' : '继续：组装编码器 →'}</Button></footer>
    {selectedToken !== null && <div shuku-edit-id="e-1b8385ab-37e0-4bdc-8728-d2606a1eb4ec" className="ln3-shade" onClick={() => setSelectedToken(null)}><section shuku-edit-id="e-a1aa93ff-3863-41d7-95bc-9c59b97ddcaa" className="ln3-values-dialog" role="dialog" aria-modal="true" aria-label={`${TOKENS[selectedToken].name} 的具体数值`} onClick={event => event.stopPropagation()}><button shuku-edit-id="e-c770c05c-9f83-4ed9-8372-2a9a713bded2" autoFocus onClick={() => setSelectedToken(null)}>关闭 ×</button><h2 shuku-edit-id="e-f255b660-f057-4242-b787-8274a7132eb5">{TOKENS[selectedToken].name} · 512 个分量 · {applied ? affine ? '缩放与平移后' : '标准化后' : '残差相加后'}</h2><p shuku-edit-id="e-0f6bdb05-bd44-443b-bd8a-6fcf6a0542d2">均值 {format(applied ? affine ? 1 : 0 : TOKENS[selectedToken].mean)}　标准差 {format(applied ? affine ? 2 : 1 : TOKENS[selectedToken].std)}{applied && <>　当前参数 γ={affine ? 2 : 1}，β={affine ? 1 : 0}</>}</p>{applied && <div shuku-edit-id="e-4145b28d-73a2-49a3-a8e8-086a0b3fedf0" className="ln3-values-rule">每一维：{affine ? '标准化后的数值 × 2 + 1' : '(原数值 − 当前 Token 的均值) ÷ √(方差 + ε)'}</div>}<div shuku-edit-id="e-8f5918b0-9010-4c57-b38e-35c5ae4ac4f8" className="ln3-values-grid">{currentValues(selectedToken, applied, affine).map((value, index) => <div shuku-edit-id="e-b1223d97-53a4-4d81-964d-8424ac187ba3" key={index}><span shuku-edit-id="e-8671d201-d7df-47b4-8e99-60e1c2cdce23">第 {index + 1} 维</span><strong shuku-edit-id="e-447b55d2-2cea-4749-8bb1-8111c27f5e65">{format(value)}</strong></div>)}</div></section></div>}
    {formula && <div shuku-edit-id="e-b6877ce4-9c3a-443f-8cac-2dc8ef34355f" className="ln3-shade" onClick={() => setFormula(false)}><section shuku-edit-id="e-be7fc271-ae85-45a2-98fa-6e9615bb2dc9" role="dialog" aria-modal="true" aria-label="层规范化公式" onClick={event => event.stopPropagation()}><button shuku-edit-id="e-da108a28-fcb7-43df-9126-29e73cedfe23" autoFocus onClick={() => setFormula(false)}>关闭 ×</button><h2 shuku-edit-id="e-8db08d0e-a15e-4df9-b6d4-2cbe58327e08">在每个 Token 的 512 个分量内计算</h2><div shuku-edit-id="e-5bd0bf97-6c5f-4078-a845-b52663e16167" className="ln3-formula">LN(x) = γ ⊙ (x − μ) / √(σ² + ε) + β</div><p shuku-edit-id="e-891826fc-3a57-49bc-a3a2-196a0362f83f">μ、σ²：由当前 Token 单独计算，不跨 Token 求统计量。</p><p shuku-edit-id="e-9cbc49a9-6b51-4a12-ac53-3751fac55582">γ、β：这个层规范化模块处理的所有 Token 共享一套参数。每一维各有一个 γ 和 β，分别通过训练学习；其他层规范化模块有各自的参数。</p><p shuku-edit-id="e-f83fc848-962c-4a13-a0f0-ab09e236f09d">先将每个分量标准化，再乘对应维度的 γ，加对应维度的 β。ε 避免分母为零。</p></section></div>}
  </section>;
}
