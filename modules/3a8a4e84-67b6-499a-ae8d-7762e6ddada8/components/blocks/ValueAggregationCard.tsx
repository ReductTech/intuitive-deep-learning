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
    return <div shuku-edit-id="e-71063b79-0541-4a49-888c-be2eb0603b9b" className={`tr-va-heat ${parameter ? 'is-parameter' : ''}`}>
    <div shuku-edit-id="e-a6ba9417-2019-42b6-9073-cf71bd42bfd4" className="tr-va-heat-head"><span shuku-edit-id="e-e144f637-fdd2-487b-bf3a-591e4c370a8d" />{DIMENSIONS.map((d, c) => <span shuku-edit-id="e-073263df-09ff-4870-ab4a-87db956c70cb" className={d !== null && d === focusColumn ? 'is-column-label-active' : ''} key={c}>{d === null ? '···' : <>d<sub shuku-edit-id="e-030a1778-596d-4b0e-b010-41accb7d7367">{d + 1}</sub></>}</span>)}</div>
    {(parameter ? PARAMETER_ROWS : WORDS.map((_, i) => i)).map((r, index) => <div shuku-edit-id="e-5c020e93-3023-4d56-ae8b-656103e628ad" className="tr-va-heat-row" key={index}>
      <span shuku-edit-id="e-ecad1c0f-4e44-4e49-b904-0fb52e972e65">{parameter ? r === null ? '···' : r + 1 : valueLabels ? <span shuku-edit-id="e-cdbb547d-ea01-4583-8f99-647c95f6d9c7" className="tr-va-persistent-label">v<sub shuku-edit-id="e-9d220d2d-1455-47d9-907a-e4bcdaa75b13">{index + 1}</sub><small shuku-edit-id="e-d2e6e907-6eaf-4892-b9cf-97d8fe9548a0">{WORDS[index]}</small></span> : WORDS[index]}</span>
      {DIMENSIONS.map((d, c) => r === null || d === null ? <span shuku-edit-id="e-ae1fe8bb-0c79-4e68-80dd-12b4eed1d93b" className="tr-va-ellipsis" key={c}>···</span> : <i shuku-edit-id="e-94c9d7ce-47f3-4185-8671-9532007895e9" role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={onSelect ? `查看 ${WORDS[r]} 第 ${d + 1} 维的投影计算` : undefined} onClick={event => onSelect?.(r, d, event.currentTarget)} onKeyDown={event => { if (onSelect && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onSelect(r, d, event.currentTarget);
        } }} className={d === focusColumn ? 'is-column-active' : ''} key={c} style={cellStyle(parameter ? valueParameter(r, d) : data![r][d])}>{revealed?.has(`projection-${r}-${d}`) ? <b shuku-edit-id="e-1d322a77-b103-48d5-aa24-ae394864e0c7" className="tr-num-inline-value">{data![r][d].toFixed(3)}</b> : null}</i>)}
    </div>)}
    {focusColumn >= 0 && <span shuku-edit-id="e-88272cc6-14da-4c26-a379-f840d79beb07" className="tr-va-column-band" style={{ '--focus-column': DIMENSIONS.indexOf(focusColumn) } as CSSProperties}/>}
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
    return <section shuku-edit-id="e-022dcc30-fab2-407a-ac61-c40f8e50430b" className={`tr-va-page is-${phase}`} aria-labelledby="tr-va-title">
    <header shuku-edit-id="e-df0228f1-121f-4fbe-9fd2-0bc01d3443fe" className="tr-lesson-header"><h1 shuku-edit-id="e-d8863ae6-d26b-4f32-9905-4bebbdf4f59b" id="tr-va-title">自注意力③：用 V 汇聚上下文信息</h1><p shuku-edit-id="e-01f0020f-97f5-4aa7-9d1e-4bf0370c2739">{phase === 'projection' ? '点一个 V 色块查看投影算式，再展开权重与汇聚过程。' : phase === 'ready' ? '点击“开始汇聚信息”，观察一行权重与一列 V 怎样得到一个结果。' : phase === 'running' ? '跟随高亮的行和列看计算；点一个结果格，可暂停查看数字算式。' : '点任意结果格查看加权算式，对照它对应的权重行与 V 列。'}</p></header>
    <main shuku-edit-id="e-0c25a952-8e89-4398-9a45-878962dd8034">
      <section shuku-edit-id="e-6249ad46-a830-43ef-82e5-e4350bec86c3" className="tr-va-stage">
        <div shuku-edit-id="e-67caa37a-ef36-4537-80b0-dd32521b7869" className={`tr-va-scene ${aggregating ? 'is-expanded' : ''}`}>
          <article shuku-edit-id="e-542c323a-fb4a-44fb-a053-f518ca3953b2" className="tr-va-persistent-v"><h2 shuku-edit-id="e-a96da632-8f1f-4fbd-8fab-eedf9b4067df">值矩阵 V</h2><div shuku-edit-id="e-1923053f-36f1-4dca-b4de-0491f2bde9cf" className="tr-va-panel-dim">6 × 512 · 每个词提供的内容</div><HeatMatrix data={VALUES} valueLabels focusColumn={activeDimension} revealed={shownNumbers} onSelect={(r, d, element) => openNumeric('projection', r, d, element)}/><NumericCellHint text="点色块，看示例数字"/></article>
          <article shuku-edit-id="e-0885ec50-4d78-4504-a2a7-254d2afe5843" className="tr-va-origin-x"><h2 shuku-edit-id="e-25132c2b-489f-41df-8f94-a3fb17da52c0">输入矩阵 X</h2><div shuku-edit-id="e-fe5d9ed4-97ed-4563-a60f-aeefc7a0fb9b" className="tr-va-panel-dim">6 × 512</div><HeatMatrix data={INPUTS}/></article>
          <article shuku-edit-id="e-500b6fc1-fa7f-4758-bad2-248d9541c16e" className="tr-va-origin-w"><h2 shuku-edit-id="e-de0d121b-1893-42fa-bba8-41c423b8cbba">变换矩阵 W<sub shuku-edit-id="e-a160201c-e728-484a-b1ec-f11eafa45fdd">V</sub></h2><div shuku-edit-id="e-94ffe827-ef18-4bd8-b279-15e5b1fbada3" className="tr-va-panel-dim">512 × 512</div><HeatMatrix parameter/></article>
          <span shuku-edit-id="e-38cf0e7f-935c-4e3b-a30f-09ab0fbca425" className="tr-va-scene-op is-first">×</span>
          <span shuku-edit-id="e-5fa5afa6-40e7-47e8-bf83-f38c10621258" className="tr-va-scene-op is-second">=</span>
          <article shuku-edit-id="e-c36522d8-b3c1-42bd-88a5-78748beb40a6" className="tr-va-persistent-a" aria-hidden={!aggregating}><h2 shuku-edit-id="e-fb197e22-c142-4afd-9c26-9896728dfde5">A · 注意力权重</h2><div shuku-edit-id="e-28d8554f-6b9c-45dc-b4de-baa1e71ab300" className="tr-va-panel-dim">6 × 6 · 每行相加为 1</div>
            <div shuku-edit-id="e-f3468a47-da4f-413b-9070-80d1061eb158" className="tr-va-weight-head"><span shuku-edit-id="e-d7ce21b7-5613-4701-a717-5766ec76ad80" />{WORDS.map((_, j) => <span shuku-edit-id="e-5a223ea7-993c-4a22-a99a-2cfd2a1c3e5e" key={j}>v<sub shuku-edit-id="e-1401e278-4c1a-4dd8-bceb-b5c574c72db9">{j + 1}</sub></span>)}</div>
            <div shuku-edit-id="e-33f26b68-3cd3-478b-a2a8-d1fd4bfd9bb5" className="tr-va-weight-grid">{WEIGHTS.map((row, i) => <div shuku-edit-id="e-da468640-d468-45e0-bafc-6ca28464343d" className={`tr-va-weight-row ${activeRow === i ? 'is-active-row' : ''}`} key={i}><span shuku-edit-id="e-8e0fd94f-1364-4118-bc3f-b53ea9f05982">q<sub shuku-edit-id="e-fd536966-41ac-4589-88f4-afa1efbe9f88">{i + 1}</sub></span>{row.map((weight, j) => <div shuku-edit-id="e-056ecf89-940d-486d-8463-2af7b3db59cb" role="button" tabIndex={0} onClick={event => openNumeric('weights', i, j, event.currentTarget)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openNumeric('weights', i, j, event.currentTarget);
    } }} key={j} className="tr-va-weight-cell" title={`${WORDS[i]} 对 ${WORDS[j]} 的权重 ${weight.toFixed(3)}`}>{shownNumbers.has(`weights-${i}-${j}`) ? <b shuku-edit-id="e-02982272-4cb0-47da-b7c3-9894693198b9" className="tr-num-inline-value">{weight.toFixed(3)}</b> : <i shuku-edit-id="e-39060719-1077-46e5-b3f0-c73ee25ce7a4" style={{ width: Math.sqrt(weight) * 48, height: Math.sqrt(weight) * 48 }}/>}</div>)}</div>)}</div>
            <NumericCellHint />
          </article>
          <article shuku-edit-id="e-e004a731-5872-4362-a04a-e43669f6ab38" className="tr-va-persistent-z" aria-hidden={!aggregating}><h2 shuku-edit-id="e-f110b1e1-f03c-4e84-b269-461f6a106b13">Z · 汇聚后的信息</h2><div shuku-edit-id="e-382231b5-a0c5-4f7a-902a-ab28d53bcc77" className="tr-va-panel-dim">6 × 512 · 每行一份新表示</div>
            <div shuku-edit-id="e-5fd5e2d5-9d16-4746-8aee-a8f6df38a475" className="tr-va-output-head"><span shuku-edit-id="e-65871be0-3012-42e9-910c-5dea4a5ed733" />{DIMENSIONS.map((d, c) => <span shuku-edit-id="e-7b99c78e-634d-4820-9324-36802eb18946" key={c}>{d === null ? '···' : <>d<sub shuku-edit-id="e-b0218513-af3e-41e8-9e82-61e60ae9bee8">{d + 1}</sub></>}</span>)}</div>
            <div shuku-edit-id="e-303445e5-fe4e-4cb8-ac1a-45c16fa1b97a" className="tr-va-output-grid">{WORDS.map((word, i) => {
            const complete = phase === 'finished' || (phase === 'running' && (i + 1) * VISIBLE_DIMENSIONS.length <= tick);
            const partial = phase === 'running' && i === activeRow;
            return <div shuku-edit-id="e-ebdbb0ff-05eb-4edd-bbe2-d93d2423fb1d" className={`tr-va-output-row ${partial ? 'is-partial' : ''} ${complete ? 'is-complete' : ''}`} key={word}><span shuku-edit-id="e-8a0b4b2d-0f7b-4130-b361-ab2fb12bbe8e">z<sub shuku-edit-id="e-175481f5-088c-4cd8-9a29-45de99a21b90">{i + 1}</sub><small shuku-edit-id="e-baa4ea5e-2ee1-44c0-863e-d3be0f016e53">{word}</small></span>{DIMENSIONS.map((d, c) => {
                    if (d === null)
                        return <span shuku-edit-id="e-e9cfeb82-5940-4f4f-b979-d6531c598722" className="tr-va-ellipsis" key={c}>···</span>;
                    const visible = phase === 'finished' || (phase === 'running' && i * VISIBLE_DIMENSIONS.length + VISIBLE_DIMENSIONS.indexOf(d) < tick);
                    const target = partial && d === activeDimension;
                    return <i shuku-edit-id="e-de3458c3-8904-42a5-93be-9ac73efa5a91" role="button" tabIndex={0} aria-label={`查看 ${word} 第 ${d + 1} 维的加权计算`} onClick={event => openNumeric('aggregation', i, d, event.currentTarget)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openNumeric('aggregation', i, d, event.currentTarget);
                    } }} key={c} className={`${visible ? 'is-visible' : ''} ${target ? 'is-target' : ''}`} style={{ ...(visible ? cellStyle(OUTPUTS[i][d]) : {}), '--cell-delay': '0ms' } as CSSProperties}>{shownNumbers.has(`aggregation-${i}-${d}`) ? <b shuku-edit-id="e-9a828617-a9c5-483a-8d3d-5576e1ef7856" className="tr-num-inline-value">{OUTPUTS[i][d].toFixed(3)}</b> : null}</i>;
                })}</div>;
        })}</div><span shuku-edit-id="e-1c3c7951-2251-4c60-a959-14bd3deac018" className="tr-va-panel-caption">{phase === 'running' ? '一行 × 一列 → 一个输出分量' : phase === 'finished' ? '所有位置的信息已汇聚完成' : '等待按权重汇聚'}</span>
          </article>
        </div>
      </section>
      <section shuku-edit-id="e-97c1df3f-241f-4d8b-995a-e4b6978ca86e" className="tr-va-explanation" aria-live="polite">
        <div shuku-edit-id="e-2f3d74d4-9c91-4ce8-9ee2-03253400b3a7" className="tr-va-word-explanation">{phase === 'projection' ? <><h2 shuku-edit-id="e-9c18ed4e-fd33-406f-988f-1706fc634f53">V：为每个词准备可传递的内容</h2><p shuku-edit-id="e-6e7d55be-b2e4-4474-8952-e59c35a18c89">输入向量经过<strong shuku-edit-id="e-cd91cd7f-46a7-4546-a024-3af720257c28">同一套 W<sub shuku-edit-id="e-5b46bd5e-2f26-4f10-8695-92fff03a985b">V</sub></strong>，得到各自的值向量；W<sub shuku-edit-id="e-24e151a3-e417-4e45-940a-64174a843c01">V</sub> 的参数通过训练学得。</p></> : <><p shuku-edit-id="e-c086a163-1998-4867-be9c-981ca79eb22e" className="tr-va-multiply-meaning">A 的一行表示<strong shuku-edit-id="e-2f2fad70-0c7a-4a14-af91-9c764548f854">当前词对各词的关注权重</strong>；V 的一列表示<strong shuku-edit-id="e-1ceb7f6a-1e94-4374-802e-ee418ab80ab0">所有词在同一维度上的信息</strong>。</p><h2 shuku-edit-id="e-0b8aa92b-fd22-4217-ae72-d2ca090dc528">{explanation ? <>正在为 <strong shuku-edit-id="e-7a5696a0-5610-452f-ae66-0aa9eb2214c9">{explanation}</strong> 汇聚上下文信息</> : '为每个词汇聚上下文信息'}</h2></>}</div>
        <div shuku-edit-id="e-cb56aa38-7a76-4f6c-b18c-57c62c880e0d" className="tr-va-formula">{phase === 'projection' ? <><strong shuku-edit-id="e-085f3379-91f9-491a-8eb3-7f487fd47e75">V = XW<sub shuku-edit-id="e-0958ab90-8cf9-4552-92bd-8f215b10c9f9">V</sub></strong><span shuku-edit-id="e-5a0f3089-bb31-4a33-8dc5-b19c44ddf176">(6 × 512) × (512 × 512)</span></> : <><strong shuku-edit-id="e-1a769262-7759-4bc0-8cf6-fe73e2675f8b">Z = AV</strong><span shuku-edit-id="e-e82c05c9-6421-4a08-a20a-ea31c22d37dd">z<sub shuku-edit-id="e-c927c8a2-e9f0-40b5-be53-8aac89def01f">id</sub> = Σ<sub shuku-edit-id="e-25525861-1994-49e0-a81e-0fec0bff0fd6">j=1</sub><sup shuku-edit-id="e-7b6bc9c4-de10-4dc0-b367-c7f7538d0d9a">6</sup> a<sub shuku-edit-id="e-854ef0d3-8a7d-41b9-b958-86920987e02c">ij</sub>v<sub shuku-edit-id="e-5d17d255-555f-495c-8f0a-5734a09ba619">jd</sub></span><small shuku-edit-id="e-8e5520b0-a215-4dd3-8493-256e2e844695">(6 × 6) × (6 × 512) = 6 × 512</small></>}</div>
      </section>
    </main>
    <footer shuku-edit-id="e-7cf9457b-329e-4380-95d5-c8b4c5b80569"><p shuku-edit-id="e-ed0501e0-3ac0-4184-9dc6-ee9107009536">给定教学权重，用于说明信息怎样汇聚；真实模型的关注方式由训练学得。</p><div shuku-edit-id="e-8a69d619-01d3-494e-b72c-eb83f9f789f6"><button shuku-edit-id="e-0289ec01-7dbc-4c98-9a14-e1c6b3fd5b16" type="button" className="is-secondary" onClick={restart}>重播</button><button shuku-edit-id="e-6965c65e-9bf1-4506-951b-91cc6cddd83d" type="button" onClick={advance}>{phase === 'projection' ? '展开权重与汇聚 →' : phase === 'ready' ? '开始汇聚信息 →' : phase === 'running' ? paused ? '继续汇聚 ▶' : '暂停动画 Ⅱ' : '继续 →'}</button></div></footer>
    {numericCell && numericAnchor && <AttentionNumericExample anchor={numericAnchor} mode={numericMode} initialRow={numericCell[0]} initialColumn={numericCell[1]} onClose={() => { setNumericCell(null); setShownNumbers(new Set()); }}/>}
  </section>;
}
