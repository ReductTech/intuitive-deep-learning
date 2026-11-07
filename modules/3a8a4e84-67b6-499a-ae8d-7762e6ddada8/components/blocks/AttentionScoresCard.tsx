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
    return <span className={`tr-ks-symbol is-${letter}`}>{letter}<sub>{index + 1}</sub>{transpose && <sup>T</sup>}</span>;
}
function Ribbon({ row, kind }: {
    row: number;
    kind: 'input' | 'key';
}) {
    return <span className={`tr-ks-ribbon is-${kind}`} aria-label={`${WORDS[row]} 的${kind === 'input' ? '输入' : '键'}向量示意`}>{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ opacity: .35 + ((i * 3 + row * 5) % 9) / 15 }}/>)}</span>;
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
    return <section className={`tr-ks-page is-${phase}`} aria-labelledby="tr-ks-title">
    <header className="tr-lesson-header"><h1 id="tr-ks-title">{title}</h1><p>{!table ? '沿连线看 K 怎样生成，再点击“计算注意力分数”。' : busy ? softmax ? '观察每一行：分数怎样逐渐变成关注权重？' : '先看一个 Q 与各个 K 匹配，再观察其他行的计算。' : softmax ? '点一个圆圈查看权重算式，留意同一行的权重之和。' : '点一个圆圈查看分数算式，再点击“加入 Softmax”。'}</p></header>
    <main className="tr-ks-canvas">
      <aside className="tr-ks-left">
        <div className={`tr-ks-wk-summary ${table ? 'is-visible' : ''}`}><b>W<sub>K</sub></b><span>512 × 512</span><small>K = XW<sub>K</sub></small></div>
        <div className="tr-ks-q-label">已生成的 <strong>Q</strong><span>每个向量 512 维</span></div>
        <div className="tr-ks-q-list">{WORDS.map((word, i) => <div key={word} className={`${phase === 'normalizing' && normalizedRow === i ? 'is-active' : ''}`}><SymbolVector letter="q" index={i}/><span>{word}</span></div>)}</div>
      </aside>
      <div className="tr-ks-center">
        <section className={`tr-ks-key-projection ${table ? 'is-collapsed' : ''}`} aria-label="从输入矩阵生成键矩阵">
          <div className="tr-ks-input-heading">X · 输入矩阵 <span>6 × 512</span></div>
          <div className="tr-ks-inputs">{WORDS.map((word, i) => <div key={word}><span>{word}</span><Ribbon row={i} kind="input"/></div>)}</div>
          <div className="tr-ks-key-machine"><span className="tr-ks-down">↓</span><div><b>W<sub>K</sub></b><span>512 × 512</span></div><p>输入向量 → 键向量</p><span className="tr-ks-down">↓</span></div>
          <div className="tr-ks-key-heading">K · 键矩阵 <span>6 × 512</span></div>
          <div className="tr-ks-key-vectors">{WORDS.map((word, i) => <div key={word}><Ribbon row={i} kind="key"/><SymbolVector letter="k" index={i}/></div>)}</div>
        </section>
        {table && <section className="tr-ks-table" aria-label={softmax ? '注意力权重矩阵' : '缩放点积分数矩阵'}>
          <div className="tr-ks-table-axis"><strong>{softmax ? 'A · 注意力权重' : 'S · 缩放点积分数'}</strong><span>列：每个位置的 K<sup>T</sup></span></div>
          <div className="tr-ks-column-heads">{WORDS.map((word, i) => <div key={word}><SymbolVector letter="k" index={i} transpose/><span>{word}</span></div>)}</div>
          <div className="tr-ks-grid">{WORDS.map((word, r) => {
                const normalized = phase === 'weights' || (phase === 'normalizing' && r <= normalizedRow);
                return <div key={word} className={`tr-ks-grid-row ${phase === 'normalizing' && r === normalizedRow ? 'is-scanning' : ''} `}>
              {WORDS.map((keyWord, c) => {
                        const value = normalized ? WEIGHTS[r][c] : SCORES[r][c];
                        const diameter = normalized ? Math.sqrt(value) * 61 : Math.sqrt(Math.abs(value) / MAX_SCORE) * 46;
                        return <div role="button" tabIndex={0} onClick={event => openNumeric(r, c, event.currentTarget, normalized ? 'weights' : 'scores')} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openNumeric(r, c, event.currentTarget, normalized ? 'weights' : 'scores');
                        } }} className={`tr-ks-cell ${normalized ? 'is-normalized' : ''} ${!normalized && value < 0 ? 'is-negative' : ''}`} key={keyWord} title={`${word} → ${keyWord}：${value.toFixed(3)}`} aria-label={`${word} 对 ${keyWord} 的${normalized ? '权重' : '分数'} ${value.toFixed(3)}`} style={{ '--compute-delay': `${2100 + revealOrder(r) * 1200 + c * 120}ms`, '--dot-size': `${diameter}px` } as CSSProperties}>
                  <span className="tr-ks-cell-formula"><SymbolVector letter="q" index={r}/><span>·</span><SymbolVector letter="k" index={c} transpose/></span>{shownNumbers.has(`${r}-${c}`) ? <b className="tr-num-inline-value">{value.toFixed(3)}</b> : <i className="tr-ks-dot"/>}
                </div>;
                    })}
            </div>;
            })}</div>
          <div className="tr-ks-legend">{softmax ? <><i className="is-positive"/>圆面积表示权重 · 每行相加为 1</> : <><i className="is-positive"/>正分数<i className="is-negative"/>负分数<span>圆面积表示分数绝对值</span></>}</div>
          <NumericCellHint />
          {phase === 'scoring' && <div className="tr-ks-moving-pair" aria-hidden="true"><span className="is-flying-q">q<sub>1</sub></span><span className="is-flying-k">k<sub>3</sub><sup>T</sup></span><i>×</i></div>}
        </section>}
      </div>
      <aside className="tr-ks-note" aria-live="polite"><i className="tr-ks-pin"/>
        {!table ? <><h2>K：可供匹配的特征</h2><p>同一个输入，经过另一套变换 <strong>W<sub>K</sub></strong>，生成每个位置的<strong>键向量 K</strong>。</p><div className="tr-ks-equation">K = XW<sub>K</sub></div><p>Q 表达“想找什么”，K 提供<strong>“有哪些特征可匹配”</strong>。</p><p className="tr-ks-note-small">这是一种理解方式，具体特征从数据中学得。</p></> : !softmax ? <><h2>一个 Q，比较所有 K</h2><div className="tr-ks-equation">S = <span className="tr-ks-fraction"><span>QK<sup>T</sup></span><span>√d<sub>k</sub></span></span></div><p><strong>行看 Q，列看 K。</strong><br />每格先做点积，再除以 √512，得到匹配分数。</p><p className="tr-ks-note-small"><strong>T 表示转置：</strong>K 原本按行存放，将它转成列，才能逐一与 Q 相乘。</p><div className="tr-ks-dim-flow">(6 × 512) × (512 × 6)<br /><span>↓</span><br />6 × 6 个分数</div></> : <><h2>逐行分配关注</h2><div className="tr-ks-equation">A = Softmax(S)</div><div className="tr-ks-softmax-equation">a<sub>ij</sub> = <span className="tr-ks-fraction"><span>exp(s<sub>ij</sub>)</span><span>Σ<sub>l</sub> exp(s<sub>il</sub>)</span></span></div><p>每一行单独处理：<br /><strong>取指数 → 除以本行总和</strong></p><p>得到非负的注意力权重，<strong>每行之和为 1</strong>。</p><p className="tr-ks-note-small">{phase === 'normalizing' ? <>正在处理：<strong>{WORDS[normalizedRow < 0 ? 0 : normalizedRow]}</strong> 的这一行</> : '圆越大，分给该位置的关注份额越大。'}</p></>}
      </aside>
    </main>
    <footer><p>给定教学向量演示计算；色带示意维度，圆圈由实际计算结果绘制。</p><div><button type="button" className="is-secondary" onClick={reset}>重播</button><button type="button" disabled={busy} onClick={() => phase === 'keys' ? setPhase('scoring') : phase === 'scores' ? setPhase('normalizing') : onComplete()}>{phase === 'keys' ? '计算注意力分数 →' : phase === 'scoring' ? '正在计算分数…' : phase === 'scores' ? '加入 Softmax →' : phase === 'normalizing' ? '逐行转换中…' : '继续 →'}</button></div></footer>
    {numericCell && numericAnchor && <AttentionNumericExample anchor={numericAnchor} mode={numericKind} initialRow={numericCell[0]} initialColumn={numericCell[1]} onClose={() => { setNumericCell(null); setShownNumbers(new Set()); }}/>}
  </section>;
}
