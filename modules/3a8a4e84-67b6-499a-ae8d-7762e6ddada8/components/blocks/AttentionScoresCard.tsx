import { useEffect, useState, type CSSProperties } from 'react';
import './AttentionScoresCard.css';
import { AttentionNumericExample, NumericCellHint, numericAnchorFor, type NumericAnchor } from './AttentionNumericExample';
import { WORDS, SCORES, WEIGHTS } from '../../domain/attentionMatrixExample';
const MAX_SCORE = Math.max(...SCORES.flat().map(Math.abs));
type Phase = 'keys' | 'scoring' | 'scores' | 'normalizing' | 'weights';
const revealOrder = (row: number) => row;
function SymbolVector({ letter, index, transpose = false }: {
    letter: string;
    index: number;
    transpose?: boolean;
}) {
    return <span shuku-edit-id="e-5c1fb1eb-296d-4a63-929d-5c4949b90bc2" className={`tr-ks-symbol is-${letter}`}>{letter}<sub shuku-edit-id="e-2e832be0-f5f1-48f6-a78e-0ba291b42387">{index + 1}</sub>{transpose && <sup shuku-edit-id="e-89d433a9-469e-4f19-8f18-c52b45d5675c">T</sup>}</span>;
}
function Ribbon({ row, kind }: {
    row: number;
    kind: 'input' | 'key';
}) {
    return <span shuku-edit-id="e-da647f0b-9508-4998-9f22-c1ff5a995c22" className={`tr-ks-ribbon is-${kind}`} aria-label={`${WORDS[row]} 的${kind === 'input' ? '输入' : '键'}向量示意`}>{Array.from({ length: 9 }, (_, i) => <i shuku-edit-id="e-346bcd20-1ba8-41a0-9069-6bbb68b23187" key={i} style={{ opacity: .35 + ((i * 3 + row * 5) % 9) / 15 }}/>)}</span>;
}
export function AttentionScoresCard({ onComplete }: {
    onComplete: () => void;
}) {
    const [numericKind, setNumericKind] = useState<'scores' | 'weights'>('scores');
    const [numericAnchor, setNumericAnchor] = useState<NumericAnchor | null>(null);
    const [shownNumbers, setShownNumbers] = useState<Set<string>>(new Set());
    const openNumeric = (row: number, column: number, element: HTMLElement, kind: 'scores' | 'weights') => { setNumericKind(kind); setNumericAnchor(numericAnchorFor(element)); setShownNumbers(new Set([`${row}-${column}`])); setNumericCell([row, column]); };
    const [numericCell, setNumericCell] = useState<[
        number,
        number
    ] | null>(null);
    const [phase, setPhase] = useState<Phase>('keys');
    const [normalizedRow, setNormalizedRow] = useState(-1);
    useEffect(() => {
        if (phase !== 'scoring')
            return;
        const timer = window.setTimeout(() => setPhase('scores'), 11000);
        return () => window.clearTimeout(timer);
    }, [phase]);
    useEffect(() => {
        if (phase !== 'normalizing')
            return;
        setNormalizedRow(0);
        const timers = Array.from({ length: 5 }, (_, i) => window.setTimeout(() => setNormalizedRow(i + 1), (i + 1) * 1450));
        timers.push(window.setTimeout(() => setPhase('weights'), 9000));
        return () => timers.forEach(window.clearTimeout);
    }, [phase]);
    const table = phase !== 'keys';
    const softmax = phase === 'normalizing' || phase === 'weights';
    const busy = phase === 'scoring' || phase === 'normalizing';
    const title = !table ? '自注意力②：生成 K，与 Q 匹配' : softmax ? '自注意力②：把分数转成关注权重' : '自注意力②：用 Q、K 计算匹配分数';
    const reset = () => { setPhase('keys'); setNormalizedRow(-1); };
    return <section shuku-edit-id="e-1e2ef3cc-1941-40d4-9c86-3322117ec0cd" className={`tr-ks-page is-${phase}`} aria-labelledby="tr-ks-title">
    <header shuku-edit-id="e-9f8a1674-dcfb-4771-8a8f-c97f38f6a76c" className="tr-lesson-header"><h1 shuku-edit-id="e-1d531a75-e9b5-4a74-b961-6bf56b02d0e1" id="tr-ks-title">{title}</h1><p shuku-edit-id="e-210d5fd5-4434-455c-a43d-42f2ed618d1c">{!table ? '沿连线看 K 怎样生成，再点击“计算注意力分数”。' : busy ? softmax ? '观察每一行：分数怎样逐渐变成关注权重？' : '先看一个 Q 与各个 K 匹配，再观察其他行的计算。' : softmax ? '点一个圆圈查看权重算式，留意同一行的权重之和。' : '点一个圆圈查看分数算式，再点击“加入 Softmax”。'}</p></header>
    <main shuku-edit-id="e-24a1a374-73d5-4b17-9efb-b3330091f095" className="tr-ks-canvas">
      <aside shuku-edit-id="e-bf00f52d-e176-4e90-b867-cc1c12e70dea" className="tr-ks-left">
        <div shuku-edit-id="e-7e2c8ada-2cb6-4fb8-952c-84ac216845fb" className={`tr-ks-wk-summary ${table ? 'is-visible' : ''}`}><b shuku-edit-id="e-1ab5fbb6-1882-4b57-b5b9-ec42ead51e48">W<sub shuku-edit-id="e-9dcfd645-5334-4882-ad8e-7aa99311c3f9">K</sub></b><span shuku-edit-id="e-8a4ead07-376e-4d15-bb14-17b672a64f4d">512 × 512</span><small shuku-edit-id="e-58f9e478-1d0f-4928-b25d-2e857cb950c0">K = XW<sub shuku-edit-id="e-2192aba1-9b61-4f8e-b86c-abb12495f815">K</sub></small></div>
        <div shuku-edit-id="e-4d26ebd0-712c-4c76-bd8e-8b015730d67b" className="tr-ks-q-label">已生成的 <strong shuku-edit-id="e-6fe359f7-0ada-4f46-9326-142e35ac82d7">Q</strong><span shuku-edit-id="e-22876e50-794c-448f-a7ca-523d25f9c369">每个向量 512 维</span></div>
        <div shuku-edit-id="e-424e680e-e298-47e8-971c-70a4206db2c4" className="tr-ks-q-list">{WORDS.map((word, i) => <div shuku-edit-id="e-bb9b77dd-34c0-4468-a664-6350d917be7f" key={word} className={`${phase === 'normalizing' && normalizedRow === i ? 'is-active' : ''}`}><SymbolVector letter="q" index={i}/><span shuku-edit-id="e-d6aa1e8e-73e3-4211-a84d-e4e2e4ccd7bf">{word}</span></div>)}</div>
      </aside>
      <div shuku-edit-id="e-7972ee8b-dcac-4e11-94ca-a187a710eadc" className="tr-ks-center">
        <section shuku-edit-id="e-bd9169af-e7a0-4294-9c5a-4ac3db4ca296" className={`tr-ks-key-projection ${table ? 'is-collapsed' : ''}`} aria-label="从输入矩阵生成键矩阵">
          <div shuku-edit-id="e-5a31be13-c761-4803-877d-49f4846b7a61" className="tr-ks-input-heading">X · 输入矩阵 <span shuku-edit-id="e-19b14fae-343d-4951-9d4c-868edd1f4e9d">6 × 512</span></div>
          <div shuku-edit-id="e-f5689444-eb77-4671-bb88-1dd9322c58b1" className="tr-ks-inputs">{WORDS.map((word, i) => <div shuku-edit-id="e-8918d47e-03e0-49f8-972d-982d55fb4c50" key={word}><span shuku-edit-id="e-16539d7e-9800-4248-a9e3-d7a75bcb5e75">{word}</span><Ribbon row={i} kind="input"/></div>)}</div>
          <div shuku-edit-id="e-5b799a48-3de3-44d2-9248-bb385e1971f8" className="tr-ks-key-machine"><span shuku-edit-id="e-37ce3582-864d-4d02-86a1-6dc2963babc1" className="tr-ks-down">↓</span><div shuku-edit-id="e-15b83349-a1a9-4405-8acd-05a74f156ffe"><b shuku-edit-id="e-0f852755-595c-4a8b-98bf-9c377f08d39f">W<sub shuku-edit-id="e-0a418cd2-3291-4ac9-ba38-bcbcee09e46b">K</sub></b><span shuku-edit-id="e-5fd330bd-c7c2-4213-aca6-91efb3a3473d">512 × 512</span></div><p shuku-edit-id="e-0a8482d5-fe4f-4fea-9a8d-5a8076b00a5e">输入向量 → 键向量</p><span shuku-edit-id="e-08758334-f145-473f-b0af-65c98a3ea1df" className="tr-ks-down">↓</span></div>
          <div shuku-edit-id="e-d71dbe2f-8c07-4f4c-9469-fd5d34e1d25c" className="tr-ks-key-heading">K · 键矩阵 <span shuku-edit-id="e-62a9b48b-5214-42ea-bfaa-0daf378f0505">6 × 512</span></div>
          <div shuku-edit-id="e-889ada4c-23d4-4a77-8b38-9852fd77f024" className="tr-ks-key-vectors">{WORDS.map((word, i) => <div shuku-edit-id="e-68cc4a62-4992-42f5-aad0-d663d81408e9" key={word}><Ribbon row={i} kind="key"/><SymbolVector letter="k" index={i}/></div>)}</div>
        </section>
        {table && <section shuku-edit-id="e-5b9b229c-8c86-4c21-81e0-2a7292a7cbdd" className="tr-ks-table" aria-label={softmax ? '注意力权重矩阵' : '缩放点积分数矩阵'}>
          <div shuku-edit-id="e-31a97c93-e003-4e65-9a11-5150da6863cb" className="tr-ks-table-axis"><strong shuku-edit-id="e-26a82038-2184-4448-a299-0c218769d499">{softmax ? 'A · 注意力权重' : 'S · 缩放点积分数'}</strong><span shuku-edit-id="e-0f7e3414-7adf-4977-9611-c74b23e09466">列：每个位置的 K<sup shuku-edit-id="e-233a534b-6ccb-4e07-9572-d4ecb6994681">T</sup></span></div>
          <div shuku-edit-id="e-376ae9f9-31ed-400b-8546-7dbba996dd59" className="tr-ks-column-heads">{WORDS.map((word, i) => <div shuku-edit-id="e-6060fae7-0957-4d5f-85bc-5e6f5c1744a2" key={word}><SymbolVector letter="k" index={i} transpose/><span shuku-edit-id="e-86b56465-8d4d-4178-8191-d8d0ae687dfa">{word}</span></div>)}</div>
          <div shuku-edit-id="e-70198b3a-63e3-4b4a-85c7-e3eb136371bb" className="tr-ks-grid">{WORDS.map((word, r) => {
                const normalized = phase === 'weights' || (phase === 'normalizing' && r <= normalizedRow);
                return <div shuku-edit-id="e-65d99754-85a2-4371-88ea-2c3311cbca08" key={word} className={`tr-ks-grid-row ${phase === 'normalizing' && r === normalizedRow ? 'is-scanning' : ''} `}>
              {WORDS.map((keyWord, c) => {
                        const value = normalized ? WEIGHTS[r][c] : SCORES[r][c];
                        const diameter = normalized ? Math.sqrt(value) * 61 : Math.sqrt(Math.abs(value) / MAX_SCORE) * 46;
                        return <div shuku-edit-id="e-ef1f1f52-a174-4d8c-8eaa-eacd6d1817e5" role="button" tabIndex={0} onClick={event => openNumeric(r, c, event.currentTarget, normalized ? 'weights' : 'scores')} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openNumeric(r, c, event.currentTarget, normalized ? 'weights' : 'scores');
                        } }} className={`tr-ks-cell ${normalized ? 'is-normalized' : ''} ${!normalized && value < 0 ? 'is-negative' : ''}`} key={keyWord} title={`${word} → ${keyWord}：${value.toFixed(3)}`} aria-label={`${word} 对 ${keyWord} 的${normalized ? '权重' : '分数'} ${value.toFixed(3)}`} style={{ '--compute-delay': `${2100 + revealOrder(r) * 1200 + c * 120}ms`, '--dot-size': `${diameter}px` } as CSSProperties}>
                  <span shuku-edit-id="e-0011d634-ebac-4c22-9354-4750c3d8d5e1" className="tr-ks-cell-formula"><SymbolVector letter="q" index={r}/><span shuku-edit-id="e-10771b55-4dc1-49e3-964e-05d066584766">·</span><SymbolVector letter="k" index={c} transpose/></span>{shownNumbers.has(`${r}-${c}`) ? <b shuku-edit-id="e-43a02f42-2950-4771-8b28-680b8ac568ab" className="tr-num-inline-value">{value.toFixed(3)}</b> : <i shuku-edit-id="e-c621afc2-5bda-4356-a47b-7c11053abb58" className="tr-ks-dot"/>}
                </div>;
                    })}
            </div>;
            })}</div>
          <div shuku-edit-id="e-71cd4cb3-85c4-4bf2-957e-cb68814e45fa" className="tr-ks-legend">{softmax ? <><i shuku-edit-id="e-1ab07684-53f9-4d43-a9b9-621e4b861886" className="is-positive"/>圆面积表示权重 · 每行相加为 1</> : <><i shuku-edit-id="e-4c6ee8a6-30f5-449c-8f11-f8ef2fde7470" className="is-positive"/>正分数<i shuku-edit-id="e-b7d97367-f7d1-4747-9b87-4f6270c755ca" className="is-negative"/>负分数<span shuku-edit-id="e-b606127a-7e9c-4cc0-94b6-6a9b53e4094d">圆面积表示分数绝对值</span></>}</div>
          <NumericCellHint />
          {phase === 'scoring' && <div shuku-edit-id="e-cee231da-f70a-4371-b064-01c4aa4b53d4" className="tr-ks-moving-pair" aria-hidden="true"><span shuku-edit-id="e-092f0d4e-8740-4d13-9fec-898bd8314df4" className="is-flying-q">q<sub shuku-edit-id="e-97b0ad47-a1bd-4f9d-83f1-993266aaa228">1</sub></span><span shuku-edit-id="e-6582fc23-a129-42ea-80fc-8d6b5df6267a" className="is-flying-k">k<sub shuku-edit-id="e-78828af7-8aaf-4226-bad0-c660a0338a4c">3</sub><sup shuku-edit-id="e-8972244c-11bf-4028-a1f7-7ccca0567539">T</sup></span><i shuku-edit-id="e-e5921859-e82d-41a4-8e6f-e819b530faf3">×</i></div>}
        </section>}
      </div>
      <aside shuku-edit-id="e-85897d8b-b234-4134-9b21-1136d22d4035" className="tr-ks-note" aria-live="polite"><i shuku-edit-id="e-08c6d9e1-a699-4af5-820b-6bebd65b2216" className="tr-ks-pin"/>
        {!table ? <><h2 shuku-edit-id="e-43985e47-d5b9-4fea-9d33-636724af2a06">K：可供匹配的特征</h2><p shuku-edit-id="e-c0414173-1d27-47bb-af52-20d23bb0c013">同一个输入，经过另一套变换 <strong shuku-edit-id="e-06702d6b-1d2f-423d-a1c2-39fe998c3578">W<sub shuku-edit-id="e-14034488-9c18-48c0-a431-89b5bb4b167a">K</sub></strong>，生成每个位置的<strong shuku-edit-id="e-36115630-cd64-4a85-ae24-d0ac5b304d3a">键向量 K</strong>。</p><div shuku-edit-id="e-e45f9e02-c257-4094-81c9-27f4e0b4fa27" className="tr-ks-equation">K = XW<sub shuku-edit-id="e-53617b82-6b7c-4ccc-b861-fd32abc4d5a4">K</sub></div><p shuku-edit-id="e-faa3353c-e5a0-40c8-b75e-40b9ceee8ec9">Q 表达“想找什么”，K 提供<strong shuku-edit-id="e-9b43a32d-46a8-40a3-a7e7-cce0dd597144">“有哪些特征可匹配”</strong>。</p><p shuku-edit-id="e-952c70bd-6f14-4f11-b46f-23f9a535bf10" className="tr-ks-note-small">这是一种理解方式，具体特征从数据中学得。</p></> : !softmax ? <><h2 shuku-edit-id="e-9b6bde18-0c8c-4251-af49-892a5267db5a">一个 Q，比较所有 K</h2><div shuku-edit-id="e-32b259d9-6b2e-4db6-b9b6-6c126e74f1c7" className="tr-ks-equation">S = <span shuku-edit-id="e-8e29d650-dd82-4b47-945f-24eb53f71a89" className="tr-ks-fraction"><span shuku-edit-id="e-82ccf192-cf1e-4065-b297-3242dad8e583">QK<sup shuku-edit-id="e-7b9f4722-708c-448e-9d44-3c38d404d5f3">T</sup></span><span shuku-edit-id="e-2a98f501-128f-4513-98b8-77d3165c0dde">√d<sub shuku-edit-id="e-e11e0649-d232-49eb-8431-57a1153a232d">k</sub></span></span></div><p shuku-edit-id="e-2064842c-7b28-4086-a7c9-ff587022840a"><strong shuku-edit-id="e-5f169374-2b48-422a-9e52-4af2c89bc3b4">行看 Q，列看 K。</strong><br shuku-edit-id="e-e4ca8f97-2405-4171-af13-21606959422e" />每格先做点积，再除以 √512，得到匹配分数。</p><p shuku-edit-id="e-ec2cff21-5fe0-4e69-a6a0-004d73f45422" className="tr-ks-note-small"><strong shuku-edit-id="e-087fb785-f606-4028-a876-142096e8f368">T 表示转置：</strong>K 原本按行存放，将它转成列，才能逐一与 Q 相乘。</p><div shuku-edit-id="e-14df2c05-a0b5-4000-8edc-4ddcca4a165e" className="tr-ks-dim-flow">(6 × 512) × (512 × 6)<br shuku-edit-id="e-30e95610-4425-445c-891a-f7cc419b3cad" /><span shuku-edit-id="e-321433aa-5d5e-44b2-85b1-08f0115fecc8">↓</span><br shuku-edit-id="e-7c95ee97-5f43-42a8-9d69-ea3993eb0c38" />6 × 6 个分数</div></> : <><h2 shuku-edit-id="e-d9b01596-204f-44c8-b747-cfd1e6d15638">逐行分配关注</h2><div shuku-edit-id="e-c78f3280-33e9-485c-9a2e-72f7e5f968bc" className="tr-ks-equation">A = Softmax(S)</div><div shuku-edit-id="e-01d61994-c6a1-4bcc-a735-b707cdbf14c8" className="tr-ks-softmax-equation">a<sub shuku-edit-id="e-3cea096d-88e9-4e14-8310-7ba64a097f1e">ij</sub> = <span shuku-edit-id="e-b6297698-3d82-4954-b2b0-90f1561aa35e" className="tr-ks-fraction"><span shuku-edit-id="e-1d539612-d845-4ac3-90b4-6056c3d68cdf">exp(s<sub shuku-edit-id="e-0bdfaba6-1a47-48cb-820c-b16443e9f793">ij</sub>)</span><span shuku-edit-id="e-03d298d9-3700-4c4e-877a-8a2b55556838">Σ<sub shuku-edit-id="e-986da748-5c37-4739-9df6-5d23b62a3229">l</sub> exp(s<sub shuku-edit-id="e-588f4fe0-becd-4f45-b18e-5ef06f752c23">il</sub>)</span></span></div><p shuku-edit-id="e-7a294686-4671-425c-949f-54705a069cd8">每一行单独处理：<br shuku-edit-id="e-68653344-e9ad-4d50-b029-44c2bd11d7d0" /><strong shuku-edit-id="e-76b5bb45-9542-4945-9ed1-cff80d3b9cb0">取指数 → 除以本行总和</strong></p><p shuku-edit-id="e-a348283c-c81c-4f11-8de9-66114a9af45f">得到非负的注意力权重，<strong shuku-edit-id="e-ff257f7e-2757-418c-964f-d26c19c7e123">每行之和为 1</strong>。</p><p shuku-edit-id="e-f79a4fbf-83d4-4507-8979-95bdcf259e1d" className="tr-ks-note-small">{phase === 'normalizing' ? <>正在处理：<strong shuku-edit-id="e-3be43cdc-0d53-4198-b6ab-8846ab3a4f8c">{WORDS[normalizedRow < 0 ? 0 : normalizedRow]}</strong> 的这一行</> : '圆越大，分给该位置的关注份额越大。'}</p></>}
      </aside>
    </main>
    <footer shuku-edit-id="e-c6045252-f713-40f5-b5c3-d8198bc7500f"><p shuku-edit-id="e-fd69a387-245a-4106-a7c8-faa07815048b">给定教学向量演示计算；色带示意维度，圆圈由实际计算结果绘制。</p><div shuku-edit-id="e-ccfbd9d7-83e9-4fbd-b552-18a8eb8328f6"><button shuku-edit-id="e-5b586945-31f2-41f5-a32d-98969f83f916" type="button" className="is-secondary" onClick={reset}>重播</button><button shuku-edit-id="e-a61e08f5-9d25-4f52-8723-287cc2286a5f" type="button" disabled={busy} onClick={() => phase === 'keys' ? setPhase('scoring') : phase === 'scores' ? setPhase('normalizing') : onComplete()}>{phase === 'keys' ? '计算注意力分数 →' : phase === 'scoring' ? '正在计算分数…' : phase === 'scores' ? '加入 Softmax →' : phase === 'normalizing' ? '逐行转换中…' : '继续 →'}</button></div></footer>
    {numericCell && numericAnchor && <AttentionNumericExample anchor={numericAnchor} mode={numericKind} initialRow={numericCell[0]} initialColumn={numericCell[1]} onClose={() => { setNumericCell(null); setShownNumbers(new Set()); }}/>}
  </section>;
}
