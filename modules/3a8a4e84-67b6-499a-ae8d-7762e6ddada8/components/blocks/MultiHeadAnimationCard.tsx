import { transformerAsset } from '../../assetUrls';
import { useEffect, useState, type CSSProperties } from 'react';
import { HEADS, HEAD_COLORS, HEAD_QUESTIONS, MULTI_HEAD_OUTPUT, outputParameter } from '../../domain/multiHeadExample';
import './MultiHeadAnimationCard.css';
const TONES = ['#d18c66', '#4c9da5', '#738fbd'];
const ROLE_NAMES = ['Q', 'K', 'V'];
const COLS = [0, 1, 62, 63];
function Expert({ head, question = false }: {
    head: number;
    question?: boolean;
}) {
    return <div className="tr-ma-expert">{question && <span className="tr-ma-question">{HEAD_QUESTIONS[head]}</span>}<span role="img" aria-label={`第${head + 1}头的小专家`} className="tr-ma-person" style={{ backgroundImage: `url("${transformerAsset('04_多头注意力/八头专家.png')}")`, backgroundPosition: `${head * 100 / 7}% center` }}/></div>;
}
function ColorMatrix({ data, color, wide = false, reveal = false }: {
    data: number[][];
    color: string;
    wide?: boolean;
    reveal?: boolean;
}) {
    const cols = wide ? [0, 1, 510, 511] : COLS;
    return <div className={`tr-ma-color-matrix ${reveal ? 'is-revealing' : ''}`} aria-label={`${data.length}行、${data[0].length}列色块矩阵，中间维度省略`}>{data.flatMap((row, r) => cols.map((c, j) => c === null ? <span className="tr-ma-dots" key={`${r}-${j}`}>···</span> : <i key={`${r}-${j}`} style={{ background: color, opacity: .18 + Math.min(1, Math.abs(row[c])) * .78, '--reveal-delay': `${r * 330 + j * 65}ms` } as CSSProperties}/>))}</div>;
}
function HeadOutput({ head, label = true }: {
    head: number;
    label?: boolean;
}) {
    return <div className="tr-ma-head-output" style={{ '--head-color': HEAD_COLORS[head] } as CSSProperties}>{label && <div className="tr-ma-output-heading"><b>H<sub>{head + 1}</sub></b><span>6 × 64</span></div>}<ColorMatrix data={HEADS[head].output} color={HEAD_COLORS[head]}/></div>;
}
function WeightMatrix() {
    return <div className="tr-ma-weight-matrix" aria-label="第一头的6乘6注意力权重矩阵">{HEADS[0].weights.flatMap((row, r) => row.map((a, c) => <span key={`${r}-${c}`}><i style={{ width: Math.sqrt(a) * 52, height: Math.sqrt(a) * 52 }}/></span>))}</div>;
}
export function MultiHeadAnimationCard({ page, onComplete }: {
    page: 1 | 2 | 3;
    onComplete: () => void;
}) {
    const [split, setSplit] = useState(false);
    const [splitReady, setSplitReady] = useState(false);
    const [phase, setPhase] = useState<'arriving' | 'all' | 'concat' | 'projecting' | 'projected'>('arriving');
    const [arrived, setArrived] = useState(false);
    useEffect(() => {
        if (page !== 1 || !split)
            return;
        const timer = window.setTimeout(() => setSplitReady(true), 2100);
        return () => window.clearTimeout(timer);
    }, [page, split]);
    useEffect(() => {
        if (page !== 3 || phase !== 'arriving')
            return;
        const first = window.setTimeout(() => setArrived(true), 100);
        const second = window.setTimeout(() => setPhase('all'), 2400);
        return () => { window.clearTimeout(first); window.clearTimeout(second); };
    }, [page, phase]);
    useEffect(() => {
        if (phase !== 'projecting')
            return;
        const timer = window.setTimeout(() => setPhase('projected'), 4600);
        return () => window.clearTimeout(timer);
    }, [phase]);
    const compact = phase === 'projecting' || phase === 'projected';
    const concat = phase === 'concat' || compact;
    const reset = () => { setSplit(false); setSplitReady(false); setPhase('arriving'); setArrived(false); };
    const forward = () => {
        if (page === 1) {
            if (!split)
                setSplit(true);
            else
                onComplete();
        }
        else if (page === 2)
            onComplete();
        else if (phase === 'all')
            setPhase('concat');
        else if (phase === 'concat')
            setPhase('projecting');
        else if (phase === 'projected')
            onComplete();
    };
    return <section className={`tr-ma-page is-page-${page}`} aria-labelledby="tr-ma-title">
    <header className="tr-lesson-header"><h1 id="tr-ma-title">{page === 1 ? '多头注意力：把 Q、K、V 拆成 8 个头' : page === 2 ? '看第 1 头，怎样独立完成计算' : '8 个头的结果，怎样拼接与融合？'}</h1><p>{page === 1 ? !split ? '点击下方拆分按钮，观察 512 维怎样按列分成 8 组。' : '对照拆分前后的形状，找出每个头的 Q、K、V。' : page === 2 ? '沿箭头从左向右看：先匹配、转成权重，再汇聚 V。' : !concat ? '点击下方按钮，观察 8 份输出怎样按列拼接。' : !compact ? '对照拼接后的维度，再点击下方按钮，观察输出投影。' : '对照投影前后：矩阵形状是否改变，信息怎样重新组合？'}</p></header>
    <main className="tr-ma-canvas">
      {page === 1 && <>
        <div className="tr-ma-shared-dimension">{split ? '每头的 Q、K、V：6 × 64' : 'Q、K、V 矩阵：6 × 512'}</div>
        <div className={`tr-ma-split-stage ${split ? 'is-split' : ''}`}>
          <div className="tr-ma-head-numbers">{HEADS.map((_, h) => <b key={h}>第 {h + 1} 头</b>)}</div>
          {ROLE_NAMES.map((name, role) => <div className="tr-ma-role-row" key={name}><b style={{ color: TONES[role] }}>{name}</b><div className="tr-ma-role-blocks">{HEADS.map((head, h) => <div className="tr-ma-role-piece" key={h}><ColorMatrix data={[head.q, head.k, head.v][role]} color={TONES[role]}/></div>)}</div></div>)}
        </div>
        <div className={`tr-ma-expert-band ${splitReady ? 'is-visible' : ''}`}><div className="tr-ma-experts">{HEADS.map((_, h) => <Expert key={h} head={h} question/>)}</div><aside><strong>不同专家</strong><span>各自学习一套权重</span><span>同时关注不同关系</span><b>让上下文表示更丰富</b></aside></div>
      </>}
      {page === 2 && <>
        <section className="tr-ma-first-head"><div className="tr-ma-first-label"><b>第 1 头</b><span>Q、K、V：6 × 64</span></div>{ROLE_NAMES.map((name, r) => <div className="tr-ma-first-role" key={name}><strong style={{ color: TONES[r] }}>{name}<sub>1</sub></strong><ColorMatrix data={[HEADS[0].q, HEADS[0].k, HEADS[0].v][r]} color={TONES[r]}/></div>)}<Expert head={0} question/></section>
        <svg className="tr-ma-calculation-wires" viewBox="0 0 1520 658" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="tr-ma-arrow" markerUnits="userSpaceOnUse" viewBox="0 0 12 12" markerWidth="12" markerHeight="12" refX="10.5" refY="6" orient="auto"><path d="M1 1 10.5 6 1 11Z" fill="#739aae"/></marker></defs><path className="is-input-branch" d="M294 139H322Q334 139 334 151V173Q334 185 346 185"/><path className="is-input-branch" d="M294 246H322Q334 246 334 234V197Q334 185 346 185"/><path d="M346 185H700"/><path className="is-value-wire" d="M294 353H420Q434 353 434 367V486Q434 500 448 500H1210"/><path d="M1000 295H1080Q1094 295 1094 309V331Q1094 345 1108 345H1210"/></svg>
        <div className="tr-ma-match-formula"><span>A<sub>1</sub> = Softmax(</span><span className="tr-ma-fraction"><span>Q<sub>1</sub>K<sub>1</sub><sup>T</sup></span><span>√64</span></span><span>)</span></div>
        <section className="tr-ma-first-weights"><h2>A<sub>1</sub> · 注意力权重</h2><span>6 × 6</span><WeightMatrix /></section>
        <div className="tr-ma-value-formula">H<sub>1</sub> = A<sub>1</sub>V<sub>1</sub></div>
        <section className="tr-ma-first-result"><HeadOutput head={0}/><p>第 1 头的输出</p></section>
        <div className="tr-ma-compute-explanation">各头都执行同样的计算，但使用各自的 Q、K、V。</div>
      </>}
      {page === 3 && <>
        <div className={`tr-ma-outputs-stage is-${phase} ${arrived ? 'has-arrived' : ''} ${concat ? 'is-concat' : ''} ${compact ? 'is-compact' : ''}`}>
          <div className="tr-ma-output-enclosure"/>
          {HEADS.map((_, h) => {
                const slot = h;
                return <div className={`tr-ma-output-piece is-head-${h} ${h === 0 ? 'is-first' : ''}`} key={h} style={{ '--slot': slot, '--appear-delay': `${h * 90}ms` } as CSSProperties}><HeadOutput head={h}/></div>;
            })}
          <div className="tr-ma-concat-label">H<sub>cat</sub> = Concat(H<sub>1</sub>, …, H<sub>8</sub>)<span>6 × 512</span></div>
        </div>
        <div className={`tr-ma-parallel-note ${phase === 'all' ? 'is-visible' : ''}`}>这 8 个头<strong>同时计算</strong>，各自产生一份 6 × 64 的输出。</div>
        <div className={`tr-ma-projection ${compact ? 'is-visible' : ''}`}><span className="tr-ma-product-sign">×</span><div className="tr-ma-wo"><h2>W<sub>O</sub></h2><ColorMatrix data={Array.from({ length: 6 }, (_, r) => Array.from({ length: 64 }, (_, c) => outputParameter([0, 1, 2, 509, 510, 511][r], c === 63 ? 511 : c)))} color="#bd9a67"/><span>512 × 512</span></div><span className="tr-ma-product-sign">=</span><div className="tr-ma-final-output"><h2>输出 Y</h2><ColorMatrix data={MULTI_HEAD_OUTPUT} color="#709caa" wide reveal={phase === 'projecting'}/><span>6 × 512</span></div></div>
        <div className="tr-ma-concat-explanation">{compact ? <>W<sub>O</sub> 是<strong>训练中学到的输出投影矩阵</strong>，用来融合各头的信息。</> : concat ? <><strong>只按列拼接，不改变各头的数值。</strong>8 × 64 = 512。</> : phase === 'all' ? '接下来，怎样把这 8 份结果放到一起？' : '承接第 1 头的输出 H₁'}</div>
      </>}
    </main>
    <footer><p>{page === 1 ? '问题只是教学比喻，帮助理解；不预设各头实际学到的职责。' : page === 2 ? '矩阵与关注模式为给定教学示例，计算遵循注意力公式。' : '拼接保留各头的数值；输出变换 WО 的参数通过训练学得。'}</p><div><button type="button" className="is-secondary" onClick={reset}>重播</button><button type="button" disabled={page === 1 && split && !splitReady || page === 3 && (phase === 'arriving' || phase === 'projecting')} onClick={forward}>{page === 1 ? split ? '继续：看一个头怎样计算 →' : '拆分成多头 →' : page === 2 ? '继续：看其他头的输出 →' : phase === 'all' ? '怎么拼接呢？' : phase === 'concat' ? '乘 WО，融合信息 →' : phase === 'projecting' ? '正在融合…' : phase === 'projected' ? '继续 →' : '正在展开八头输出…'}</button></div></footer>
  </section>;
}
