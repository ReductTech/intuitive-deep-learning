import { useEffect, useState, type CSSProperties } from 'react';
import { WORDS, INPUTS, VALUES, OUTPUTS, WEIGHTS, valueParameter } from '../../domain/attentionMatrixExample';
import './ValueAggregationCard.css';
import { AttentionNumericExample, NumericCellHint, numericAnchorFor, type NumericAnchor } from './AttentionNumericExample';
const DIMENSIONS: (number | null)[] = [0, 1, null, 510, 511];
const VISIBLE_DIMENSIONS = [0, 1, 510, 511];
const OUTPUT_CELL_COUNT = WORDS.length * VISIBLE_DIMENSIONS.length;
const PARAMETER_ROWS: (number | null)[] = [0, 1, 2, null, 510, 511];
const ROW_LABELS = ['She（她）', 'deposited（存入）', 'money（钱）', 'in（在……里）', 'the（定冠词）', 'bank（银行）'];
type Phase = 'projection' | 'ready' | 'running' | 'finished';
function cellStyle(value: number): CSSProperties {
    const positive = value >= 0;
    return { backgroundColor: `rgba(${positive ? '63,151,169' : '210,147,113'},${.12 + Math.min(1, Math.abs(value)) * .78})` };
}
function HeatMatrix({ data, parameter = false, valueLabels = false, focusColumn = -1, onSelect, revealed }: {
    data?: number[][];
    parameter?: boolean;
    valueLabels?: boolean;
    focusColumn?: number;
    onSelect?: (row: number, column: number, element: HTMLElement) => void;
    revealed?: Set<string>;
}) {
    return <div className={`tr-va-heat ${parameter ? 'is-parameter' : ''}`}>
    <div className="tr-va-heat-head"><span />{DIMENSIONS.map((d, c) => <span className={d !== null && d === focusColumn ? 'is-column-label-active' : ''} key={c}>{d === null ? '···' : <>d<sub>{d + 1}</sub></>}</span>)}</div>
    {(parameter ? PARAMETER_ROWS : WORDS.map((_, i) => i)).map((r, index) => <div className="tr-va-heat-row" key={index}>
      <span>{parameter ? r === null ? '···' : r + 1 : valueLabels ? <span className="tr-va-persistent-label">v<sub>{index + 1}</sub><small>{WORDS[index]}</small></span> : WORDS[index]}</span>
      {DIMENSIONS.map((d, c) => r === null || d === null ? <span className="tr-va-ellipsis" key={c}>···</span> : <i role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={onSelect ? `查看 ${WORDS[r]} 第 ${d + 1} 维的投影计算` : undefined} onClick={event => onSelect?.(r, d, event.currentTarget)} onKeyDown={event => { if (onSelect && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onSelect(r, d, event.currentTarget);
        } }} className={d === focusColumn ? 'is-column-active' : ''} key={c} style={cellStyle(parameter ? valueParameter(r, d) : data![r][d])}>{revealed?.has(`projection-${r}-${d}`) ? <b className="tr-num-inline-value">{data![r][d].toFixed(3)}</b> : null}</i>)}
    </div>)}
    {focusColumn >= 0 && <span className="tr-va-column-band" style={{ '--focus-column': DIMENSIONS.indexOf(focusColumn) } as CSSProperties}/>}
  </div>;
}
export function ValueAggregationCard({ onComplete }: {
    onComplete: () => void;
}) {
    const [numericAnchor, setNumericAnchor] = useState<NumericAnchor | null>(null);
    const [shownNumbers, setShownNumbers] = useState<Set<string>>(new Set());
    const openNumeric = (mode: 'projection' | 'aggregation' | 'weights', row: number, column: number, element: HTMLElement) => { setNumericAnchor(numericAnchorFor(element)); setNumericMode(mode); setNumericCell([row, column]); setShownNumbers(new Set([`${mode}-${row}-${column}`])); };
    const [numericMode, setNumericMode] = useState<'projection' | 'aggregation' | 'weights'>('projection');
    const [numericCell, setNumericCell] = useState<[
        number,
        number
    ] | null>(null);
    const [phase, setPhase] = useState<Phase>('projection');
    const [tick, setTick] = useState(0);
    const [paused, setPaused] = useState(false);
    useEffect(() => {
        if (phase !== 'running' || paused || numericCell)
            return;
        const timer = window.setInterval(() => setTick(value => Math.min(OUTPUT_CELL_COUNT, value + 1)), 700);
        return () => window.clearInterval(timer);
    }, [phase, paused, numericCell]);
    useEffect(() => { if (phase === 'running' && tick >= OUTPUT_CELL_COUNT)
        setPhase('finished'); }, [phase, tick]);
    const aggregating = phase !== 'projection';
    const activeRow = phase === 'running' && tick < OUTPUT_CELL_COUNT ? Math.floor(tick / VISIBLE_DIMENSIONS.length) : -1;
    const activeDimension = activeRow >= 0 ? VISIBLE_DIMENSIONS[tick % VISIBLE_DIMENSIONS.length] : -1;
    const explanationRow = phase === 'finished' ? 5 : activeRow;
    const explanation = explanationRow >= 0 ? ROW_LABELS[explanationRow] : undefined;
    const restart = () => { setPhase('projection'); setTick(0); setPaused(false); };
    const advance = () => {
        if (phase === 'projection')
            setPhase('ready');
        else if (phase === 'ready') {
            setPhase('running');
            setTick(0);
        }
        else if (phase === 'running')
            setPaused(value => !value);
        else
            onComplete();
    };
    return <section className={`tr-va-page is-${phase}`} aria-labelledby="tr-va-title">
    <header className="tr-lesson-header"><h1 id="tr-va-title">自注意力③：用 V 汇聚上下文信息</h1><p>{phase === 'projection' ? '点一个 V 色块查看投影算式，再展开权重与汇聚过程。' : phase === 'ready' ? '点击“开始汇聚信息”，观察一行权重与一列 V 怎样得到一个结果。' : phase === 'running' ? '跟随高亮的行和列看计算；点一个结果格，可暂停查看数字算式。' : '点任意结果格查看加权算式，对照它对应的权重行与 V 列。'}</p></header>
    <main>
      <section className="tr-va-stage">
        <div className={`tr-va-scene ${aggregating ? 'is-expanded' : ''}`}>
          <article className="tr-va-persistent-v"><h2>值矩阵 V</h2><div className="tr-va-panel-dim">6 × 512 · 每个词提供的内容</div><HeatMatrix data={VALUES} valueLabels focusColumn={activeDimension} revealed={shownNumbers} onSelect={(r, d, element) => openNumeric('projection', r, d, element)}/><NumericCellHint text="点色块，看示例数字"/></article>
          <article className="tr-va-origin-x"><h2>输入矩阵 X</h2><div className="tr-va-panel-dim">6 × 512</div><HeatMatrix data={INPUTS}/></article>
          <article className="tr-va-origin-w"><h2>变换矩阵 W<sub>V</sub></h2><div className="tr-va-panel-dim">512 × 512</div><HeatMatrix parameter/></article>
          <span className="tr-va-scene-op is-first">×</span>
          <span className="tr-va-scene-op is-second">=</span>
          <article className="tr-va-persistent-a" aria-hidden={!aggregating}><h2>A · 注意力权重</h2><div className="tr-va-panel-dim">6 × 6 · 每行相加为 1</div>
            <div className="tr-va-weight-head"><span />{WORDS.map((_, j) => <span key={j}>v<sub>{j + 1}</sub></span>)}</div>
            <div className="tr-va-weight-grid">{WEIGHTS.map((row, i) => <div className={`tr-va-weight-row ${activeRow === i ? 'is-active-row' : ''}`} key={i}><span>q<sub>{i + 1}</sub></span>{row.map((weight, j) => <div role="button" tabIndex={0} onClick={event => openNumeric('weights', i, j, event.currentTarget)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openNumeric('weights', i, j, event.currentTarget);
    } }} key={j} className="tr-va-weight-cell" title={`${WORDS[i]} 对 ${WORDS[j]} 的权重 ${weight.toFixed(3)}`}>{shownNumbers.has(`weights-${i}-${j}`) ? <b className="tr-num-inline-value">{weight.toFixed(3)}</b> : <i style={{ width: Math.sqrt(weight) * 48, height: Math.sqrt(weight) * 48 }}/>}</div>)}</div>)}</div>
            <NumericCellHint />
          </article>
          <article className="tr-va-persistent-z" aria-hidden={!aggregating}><h2>Z · 汇聚后的信息</h2><div className="tr-va-panel-dim">6 × 512 · 每行一份新表示</div>
            <div className="tr-va-output-head"><span />{DIMENSIONS.map((d, c) => <span key={c}>{d === null ? '···' : <>d<sub>{d + 1}</sub></>}</span>)}</div>
            <div className="tr-va-output-grid">{WORDS.map((word, i) => {
            const complete = phase === 'finished' || (phase === 'running' && (i + 1) * VISIBLE_DIMENSIONS.length <= tick);
            const partial = phase === 'running' && i === activeRow;
            return <div className={`tr-va-output-row ${partial ? 'is-partial' : ''} ${complete ? 'is-complete' : ''}`} key={word}><span>z<sub>{i + 1}</sub><small>{word}</small></span>{DIMENSIONS.map((d, c) => {
                    if (d === null)
                        return <span className="tr-va-ellipsis" key={c}>···</span>;
                    const visible = phase === 'finished' || (phase === 'running' && i * VISIBLE_DIMENSIONS.length + VISIBLE_DIMENSIONS.indexOf(d) < tick);
                    const target = partial && d === activeDimension;
                    return <i role="button" tabIndex={0} aria-label={`查看 ${word} 第 ${d + 1} 维的加权计算`} onClick={event => openNumeric('aggregation', i, d, event.currentTarget)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openNumeric('aggregation', i, d, event.currentTarget);
                    } }} key={c} className={`${visible ? 'is-visible' : ''} ${target ? 'is-target' : ''}`} style={{ ...(visible ? cellStyle(OUTPUTS[i][d]) : {}), '--cell-delay': '0ms' } as CSSProperties}>{shownNumbers.has(`aggregation-${i}-${d}`) ? <b className="tr-num-inline-value">{OUTPUTS[i][d].toFixed(3)}</b> : null}</i>;
                })}</div>;
        })}</div><span className="tr-va-panel-caption">{phase === 'running' ? '一行 × 一列 → 一个输出分量' : phase === 'finished' ? '所有位置的信息已汇聚完成' : '等待按权重汇聚'}</span>
          </article>
        </div>
      </section>
      <section className="tr-va-explanation" aria-live="polite">
        <div className="tr-va-word-explanation">{phase === 'projection' ? <><h2>V：为每个词准备可传递的内容</h2><p>输入向量经过<strong>同一套 W<sub>V</sub></strong>，得到各自的值向量；W<sub>V</sub> 的参数通过训练学得。</p></> : <><p className="tr-va-multiply-meaning">A 的一行表示<strong>当前词对各词的关注权重</strong>；V 的一列表示<strong>所有词在同一维度上的信息</strong>。</p><h2>{explanation ? <>正在为 <strong>{explanation}</strong> 汇聚上下文信息</> : '为每个词汇聚上下文信息'}</h2></>}</div>
        <div className="tr-va-formula">{phase === 'projection' ? <><strong>V = XW<sub>V</sub></strong><span>(6 × 512) × (512 × 512)</span></> : <><strong>Z = AV</strong><span>z<sub>id</sub> = Σ<sub>j=1</sub><sup>6</sup> a<sub>ij</sub>v<sub>jd</sub></span><small>(6 × 6) × (6 × 512) = 6 × 512</small></>}</div>
      </section>
    </main>
    <footer><p>给定教学权重，用于说明信息怎样汇聚；真实模型的关注方式由训练学得。</p><div><button type="button" className="is-secondary" onClick={restart}>重播</button><button type="button" onClick={advance}>{phase === 'projection' ? '展开权重与汇聚 →' : phase === 'ready' ? '开始汇聚信息 →' : phase === 'running' ? paused ? '继续汇聚 ▶' : '暂停动画 Ⅱ' : '继续 →'}</button></div></footer>
    {numericCell && numericAnchor && <AttentionNumericExample anchor={numericAnchor} mode={numericMode} initialRow={numericCell[0]} initialColumn={numericCell[1]} onClose={() => { setNumericCell(null); setShownNumbers(new Set()); }}/>}
  </section>;
}
