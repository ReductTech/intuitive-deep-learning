import { useState, type CSSProperties } from 'react';
import { Button } from "@shuku/course-style/react/controls/Button";
import { LessonStage } from '../LessonStage';
import { Typography } from "@shuku/course-style/react/typography/Typography";
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
    return <i shuku-edit-id="e-182fae32-542a-4b6f-a00c-e16b4e49125b" className="tr-attention-bubble" style={{ '--bubble': weight } as CSSProperties}/>;
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
    return <div shuku-edit-id="e-d34499a5-a894-46e7-a55b-f3f0e4c7d351" className={`tr-teaching-heat is-${tone} ${labels ? 'has-labels' : ''}`} style={{ '--heat-columns': columnIndices.length } as CSSProperties}>
    {rowIndices.flatMap((rowIndex, displayRow) => [
            ...(labels ? [<strong shuku-edit-id="e-17c73c2f-9d1f-48e2-aec6-235137deebeb" className={rowIndex === focus ? 'is-focus' : ''} key={`label-${displayRow}`}>{rowIndex === null ? '…' : tokens[rowIndex]}</strong>] : []),
            ...columnIndices.map((columnIndex, displayColumn) => rowIndex === null || columnIndex === null
                ? <i shuku-edit-id="e-b20bb2d1-08a5-4d05-ab3c-f31c7d51f4e6" className="is-ellipsis" key={`${displayRow}-${displayColumn}`}>…</i>
                : <i shuku-edit-id="e-d56eaa65-df3b-409e-b251-4b61cad06fbd" className={rowIndex === focus ? 'is-focus' : ''} style={{ '--heat': Math.abs(data[rowIndex][columnIndex]) / max } as CSSProperties} key={`${displayRow}-${displayColumn}`}/>),
        ])}
  </div>;
}
function StaticPatternGrid({ focus = 7 }: {
    focus?: number;
}) {
    return <div shuku-edit-id="e-17b77383-278b-44ce-b33f-fe06176fe767" className="tr-static-pattern" style={{ '--matrix-count': tokens.length } as CSSProperties}>
    {weights.flatMap((row, rowIndex) => row.map((weight, columnIndex) => <span shuku-edit-id="e-aaf44cfe-da19-4524-8290-5aefe94782fe" className={rowIndex === focus ? 'is-focus' : ''} key={`${rowIndex}-${columnIndex}`}><Bubble weight={weight}/></span>))}
  </div>;
}
export function SelfAttentionCard({ onComplete, phase = 'aggregate', summaryOnly = false }: CompleteProps & {
    phase?: 'value' | 'aggregate';
    summaryOnly?: boolean;
}) {
    const step = phase === 'value' ? 0 : 1;
    const [revealed, setRevealed] = useState(summaryOnly);
    return <LessonStage kicker="注意力机制 · 汇聚信息" title={step === 0 ? 'Value：为每个词准备可传递的信息' : '自注意力：按权重汇聚句内信息'} description={step === 0 ? '对照输入与投影结果，观察每个位置怎样得到自己的 V。' : revealed ? '沿连线回看 Q、K、V 的来源，判断“自”体现在哪里。' : '先对照权重与 Value，再展开汇聚结果，观察每行输出。'} className="tr-stage tr-self-aggregate-stage">
    {!summaryOnly && (step === 0 ? <section shuku-edit-id="e-1379dbbb-eefa-4ac4-a8a1-30ce4e72ddcb" className="tr-value-figure" aria-label="生成 Value 矩阵">
      <header shuku-edit-id="e-f98f551a-0a9a-4e83-9a5f-16049f383aae"><Typography variant="h2">为每个 Token 生成 Value</Typography><code shuku-edit-id="e-0538f7cd-894f-46e5-9073-bc0d8ec02cb3">V = XW<sub shuku-edit-id="e-2bd9d001-0966-4bc6-91e7-c6fc0a645273">V</sub></code></header>
      <div shuku-edit-id="e-10003786-6cd3-4cc9-ba63-deb0e8883321" className="tr-matrix-flow is-value-origin">
        <div shuku-edit-id="e-89d97da0-a083-46ca-bb48-c80aa9c1ca92"><Typography variant="h3">原始 Token 表示 X</Typography><TeachingHeatMatrix data={embeddings} tone="x"/><small shuku-edit-id="e-0904b1e9-2386-4dba-a6ea-d1d6bb7acc3e">14 × 512（中间维度以 … 收起）</small></div>
        <b shuku-edit-id="e-a48e2ebc-3e64-46f0-b5e6-0608f05760c8">×</b>
        <div shuku-edit-id="e-10f5acbd-62e0-43b5-a2ad-b23519ac0d3b"><Typography variant="h3">线性投影 W<sub shuku-edit-id="e-117db2b2-6e23-4d0d-854d-8260d85d09df">V</sub></Typography><TeachingHeatMatrix data={valueProjection} tone="w" labels={false} focus={-1}/><small shuku-edit-id="e-ac8549fc-4aea-4837-8622-2f374ce425f8">512 × 512</small></div>
        <b shuku-edit-id="e-03cb470e-c6d9-4f17-acd5-e4973c0485a2">=</b>
        <div shuku-edit-id="e-8851d3b1-151b-488b-8f24-42ec0e2f3217"><Typography variant="h3">Value 矩阵 V</Typography><TeachingHeatMatrix data={values} tone="v"/><small shuku-edit-id="e-a20a8ef1-122b-4134-8a47-c1324360d116">14 × 512（中间维度以 … 收起）</small></div>
      </div>
      <p shuku-edit-id="e-408fbfd4-1003-4559-90a1-901a7a2c7423">每一行都从原始表示变成一份可以被传递的 <b shuku-edit-id="e-e634f240-2c3b-495b-95bd-9ea248f51423">Value 信息</b>。</p>
    </section> : <section shuku-edit-id="e-8d7d81f6-4575-45e5-aa5c-01ec1db09e20" className="tr-value-figure" aria-label="按照注意力权重汇聚 Value">
      <header shuku-edit-id="e-e250b21b-b53a-4b30-9dc7-61ec69dd1cd0"><Typography variant="h2">按照注意力权重汇聚 Value</Typography><code shuku-edit-id="e-75c4ebcc-18ef-4ac2-81a5-db6f4673f0db">Z = AV</code></header>
      <div shuku-edit-id="e-adc2f993-04e5-4770-b2dd-770019bff6cc" className="tr-matrix-flow is-value-aggregate">
        <div shuku-edit-id="e-e7ef5501-7e8e-4be4-b71c-5c5dd0c91bc9"><Typography variant="h3">注意力权重 A</Typography><StaticPatternGrid /><small shuku-edit-id="e-9e3635f1-adaf-4c37-8e80-740d97e403dd">14 × 14（每行对应一个 Query）</small></div>
        <b shuku-edit-id="e-2317a0c8-d8aa-4c4e-a4a2-0765f89d93d6">×</b>
        <div shuku-edit-id="e-b8da4ca0-cb54-4d13-bb62-52daeef721c8"><Typography variant="h3">Value 矩阵 V</Typography><TeachingHeatMatrix data={values} tone="v"/><small shuku-edit-id="e-0cdb8754-84e9-48ef-8200-3fed4adc5493">14 × 512</small></div>
        <b shuku-edit-id="e-86617c7c-ca0d-4bbb-ad66-d73a6d0da289">=</b>
        <div shuku-edit-id="e-597a6af7-a302-40ad-9c33-efa2cc4288f8"><Typography variant="h3">上下文表示 Z</Typography><TeachingHeatMatrix data={outputs} tone="z"/><small shuku-edit-id="e-29e356be-6e89-4470-a977-cc7ce099f341">14 × 512</small></div>
        <aside shuku-edit-id="e-c80d6b3e-81fd-4360-8477-2dda4e0a3d8d"><code shuku-edit-id="e-0cfe0573-036c-4dde-988e-f8aef4943906">z<sub shuku-edit-id="e-dcf2e510-1c7f-4857-a00a-f901720b7af6">i</sub> = Σ<sub shuku-edit-id="e-0b7a7d83-e893-4a5d-b828-f07aad9f2d8b">j</sub> α<sub shuku-edit-id="e-0ae4f4b3-cf62-4def-8a7e-7c3f29f47810">ij</sub>v<sub shuku-edit-id="e-1f53f32b-c772-4804-a5ab-f6f4127a6fe9">j</sub></code><p shuku-edit-id="e-f6ec5914-f5e1-449b-8131-149f364a5ce8"><b shuku-edit-id="e-171fd968-a278-4d6e-8fce-80195b39844a">α<sub shuku-edit-id="e-1158ec29-b47f-421e-bc31-02228bed80dc">ij</sub></b> 决定第 j 个词取多少；<strong shuku-edit-id="e-76a881d6-a254-4915-9cdd-0746f5d0315a">v<sub shuku-edit-id="e-7aa9fcd4-734e-48d7-9698-25b604e5cd04">j</sub></strong> 决定第 j 个词提供什么。</p><span shuku-edit-id="e-235db552-4e8f-479a-88dc-c9b1993200d3">所有信息按比例混合，形成新的 z<sub shuku-edit-id="e-6a7079fc-afe5-4cdc-820b-edb7ae975acf">i</sub>。</span></aside>
      </div>
      <p shuku-edit-id="e-d9738b5a-7f72-4ec6-b57b-1e52ec03189b"><b shuku-edit-id="e-3d3bfa40-4840-4fc6-98e7-2a4f8ae084c4">Q、K 负责选择信息</b>　·　<strong shuku-edit-id="e-c1d12945-e56c-4218-8100-92827234ccc8">V 负责提供信息</strong></p>
    </section>)}
    {step === 0 && <div shuku-edit-id="e-a264aabf-9416-40f2-8aee-624e23c26ff5" className="tr-self-page-action"><Button variant="primary" onClick={onComplete}>继续：按权重汇聚信息</Button></div>}
    {step === 1 && !revealed && <div shuku-edit-id="e-207a2dcc-9bcb-41b4-a337-2caaaf689e33" className="tr-self-page-action"><Button variant="primary" onClick={() => setRevealed(true)}>安装自注意力眼镜</Button></div>}
    {step === 1 && revealed && <section shuku-edit-id="e-32322c54-6262-4554-b8fa-768c1a33812d" className="tr-self-reveal" aria-label="自注意力结论">
      <header shuku-edit-id="e-8b05bb11-8e1e-4930-b4d9-7dd3ddffa909"><span shuku-edit-id="e-3461ff63-c7cb-43a8-9a65-cf8577b28d3f">回看信息从哪里来</span><Typography variant="h2">原来，这就是“自”注意力</Typography></header>
      <div shuku-edit-id="e-e74e45f1-c752-49c7-ad4f-d2d414751da1" className="tr-self-source-map">
        <div shuku-edit-id="e-d65015d8-ebb9-4bfe-b58b-e091afc1b8ee" className="is-source"><small shuku-edit-id="e-ec8dae9d-beae-41b9-b46b-25339a294fe6">同一句话</small><b shuku-edit-id="e-ea785ad0-2867-4066-8691-91f4a378e730">X</b></div>
        <i shuku-edit-id="e-ca82e49c-7176-4dbd-95e5-b7edd722a89b">→</i>
        <div shuku-edit-id="e-627f0e4b-a742-442a-8198-42326252dfdf" className="is-branches"><span shuku-edit-id="e-b0876312-c942-455e-b660-9c3be6e8df4e"><b shuku-edit-id="e-9522a67e-7465-4346-914c-7b744233aede">Q</b><small shuku-edit-id="e-450da15c-e687-45fa-8f66-c5a2d1c6cbf6">提出问题</small></span><span shuku-edit-id="e-ba456017-eb41-4e28-b7e1-a4963d1c15a7"><b shuku-edit-id="e-338c99c5-17fe-4ff2-bd12-96888cd96f81">K</b><small shuku-edit-id="e-d11a7ef9-7e16-41eb-901a-0d39c67261fa">接受匹配</small></span><span shuku-edit-id="e-f382cbfd-bcc3-4655-ae76-b04ebfca9a5d"><b shuku-edit-id="e-7157a42a-7c41-47ff-b026-00e8e255831f">V</b><small shuku-edit-id="e-cb12e883-2836-4a82-a778-9b3f4914d424">提供信息</small></span></div>
      </div>
      <div shuku-edit-id="e-698a1f00-1a0d-4f73-b94d-81d3ada07c04" className="tr-self-takeaways"><span shuku-edit-id="e-56a86501-4371-4b1c-be5d-ff263162a67c"><b shuku-edit-id="e-00fc236c-cea7-4120-92da-347541656c96">同一来源</b><small shuku-edit-id="e-8e01e6b9-9026-476d-afc1-0e6b8ba2cafa">Q、K、V 都来自 X</small></span><span shuku-edit-id="e-09571ff5-14a4-4dd8-91ec-e88d87054419"><b shuku-edit-id="e-52f3a521-3599-4b21-955d-d3f59da55e33">句内关联</b><small shuku-edit-id="e-3e4e9c44-2599-4aa0-adcb-b4963d4e6bc4">词与同一句话中的词建立联系</small></span><span shuku-edit-id="e-eb44a5c3-bb4f-44ac-878b-a1a515f11517"><b shuku-edit-id="e-5d315a1c-6746-40b9-b488-a45d2f974404">同源 ≠ 相同</b><small shuku-edit-id="e-f9b2a355-87b9-4484-9821-5549b62d8b61">分别使用三组投影参数，数值不必相同</small></span></div>
      <footer shuku-edit-id="e-07496f7e-07c0-448d-82cd-af54e0f206f3"><strong shuku-edit-id="e-a938cb31-a845-417d-8ea2-77290d2adc6f">“自”描述的是信息来源。</strong><Button variant="primary" onClick={onComplete}>继续：多头注意力</Button></footer>
    </section>}
  </LessonStage>;
}
