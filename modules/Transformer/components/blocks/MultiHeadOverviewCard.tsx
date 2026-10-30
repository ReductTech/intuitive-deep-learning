import { HEADS, HEAD_COLORS, MULTI_HEAD_OUTPUT, outputParameter } from '../../domain/multiHeadExample';
import { INPUTS } from '../../domain/attentionMatrixExample';
import './MultiHeadOverviewCard.css';
function Blocks({ data, color }: {
    data: number[][];
    color: string;
}) {
    const cols = [0, 1, data[0].length - 2, data[0].length - 1];
    return <div className="tr-mo-blocks">{data.map((row, r) => cols.map((c, i) => <i key={`${r}-${i}`} style={{ background: color, opacity: .2 + Math.min(Math.abs(row[c]), 1) * .8 }}/>))}</div>;
}
function Joined() {
    return <div className="tr-mo-joined" aria-label="8个头按列拼接，6行512列">{HEADS.map((head, h) => <Blocks key={h} data={head.output} color={HEAD_COLORS[h]}/>)}</div>;
}
export function MultiHeadOverviewCard({ onComplete }: {
    onComplete: () => void;
}) {
    const projection = Array.from({ length: 6 }, (_, r) => [0, 1, 510, 511].map(c => outputParameter([0, 1, 2, 509, 510, 511][r], c)));
    return <section className="tr-mo-page">
    <header className="tr-lesson-header"><h1>多头注意力：完整流程</h1><p>沿箭头回看完整流程，核对拆分、拼接和投影前后的矩阵形状。</p></header>
    <main className="tr-mo-canvas is-full-pipeline">
      <div className="tr-mo-pipeline">
        <section className="tr-mo-node tr-mo-source"><h2>输入 X</h2><Blocks data={INPUTS} color="#6a9fae"/><span>6 × 512</span></section>
        <b className="tr-mo-arrow">→</b>
        <section className="tr-mo-project-stage"><h2>生成 Q、K、V</h2>{['Q', 'K', 'V'].map((role, r) => <div className="tr-mo-project-role" key={role}><strong style={{ color: ['#c88d68', '#4a9ca6', '#748eb8'][r] }}>{role} = XW<sub>{role}</sub></strong><span>6 × 512</span><div className="tr-mo-role-strip">{HEADS.map((head, h) => <div key={h}><Blocks data={[head.q, head.k, head.v][r]} color={['#cf916b', '#4d9fa6', '#788fba'][r]}/></div>)}</div></div>)}<p>W<sub>Q</sub>、W<sub>K</sub>、W<sub>V</sub><br />均为 512 × 512</p></section>
        <div className="tr-mo-split-arrow"><span>按列<br />拆分</span><b className="tr-mo-arrow">→</b></div>
        <section className="tr-mo-head-stage is-simplified"><h2>8 个头并行计算</h2><span className="tr-mo-shared-head-dim">每头 Q、K、V：6 × 64</span><div className="tr-mo-eight-grid">{HEADS.map((head, h) => <article key={h} style={{ borderTopColor: HEAD_COLORS[h] }}><strong style={{ color: HEAD_COLORS[h] }}>第 {h + 1} 头</strong><div className="tr-mo-mini-output"><b style={{ color: HEAD_COLORS[h] }}>H<sub>{h + 1}</sub></b><Blocks data={head.output} color={HEAD_COLORS[h]}/></div></article>)}</div><span className="tr-mo-head-result-dim">每头输出：6 × 64</span></section>
        <b className="tr-mo-arrow">→</b>
        <section className="tr-mo-node tr-mo-join-node"><h2>按列拼接</h2><strong>H<sub>1</sub> … H<sub>8</sub></strong><Joined /><span>6 × 512</span><p>8 × 64 = 512</p></section>
        <b className="tr-mo-arrow">→</b>
        <section className="tr-mo-node tr-mo-wo-node"><h2>输出投影</h2><strong>× W<sub>O</sub></strong><Blocks data={projection} color="#b89a6f"/><span>512 × 512</span></section>
        <b className="tr-mo-arrow">→</b>
        <section className="tr-mo-node tr-mo-y-node"><h2>输出 Y</h2><Blocks data={MULTI_HEAD_OUTPUT} color="#5e99a5"/><span>6 × 512</span></section>
      </div>
      <div className="tr-mo-complete-formulas"><span>每个头：H<sub>i</sub> = Softmax(Q<sub>i</sub>K<sub>i</sub><sup>T</sup> / √64)V<sub>i</sub></span><span>最终输出：Y = Concat(H<sub>1</sub>, …, H<sub>8</sub>)W<sub>O</sub></span></div>
    </main>
    <footer><button onClick={onComplete}>继续：模型知道词序吗？ →</button></footer>
  </section>;
}
