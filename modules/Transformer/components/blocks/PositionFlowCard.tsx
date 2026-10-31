import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import './PositionFlowCard.css';
interface Props {
    onComplete: () => void;
    page?: 'why' | 'add';
}
type Word = 'watch' | 'the' | 'show';
const SENTENCES: Word[][] = [['watch', 'the', 'show'], ['show', 'the', 'watch']];
const COLORS: Record<Word, string> = { watch: '#ca7b43', the: '#8174ba', show: '#208e9a' };
const OUTPUT_COMPONENT_COLORS = ['#4d8dab', '#c68251', '#699b7d', '#9679b0', '#c19a45', '#399aa4', '#b57791', '#647fb2'];
const ORDER_EXAMPLES = [
    [<><mark>Watch</mark> the <mark className="is-teal">show</mark>.</>, <><mark>看</mark><mark className="is-teal">表演</mark></>, <><mark className="is-teal">Show</mark> the <mark>watch</mark>.</>, <><mark className="is-teal">展示</mark><mark>手表</mark></>],
    [<><mark>Record</mark> the <mark className="is-teal">play</mark>.</>, <><mark>录下</mark>这出<mark className="is-teal">戏</mark></>, <><mark className="is-teal">Play</mark> the <mark>record</mark>.</>, <><mark className="is-teal">播放</mark>这张<mark>唱片</mark></>],
    [<><mark>Dogs</mark> bite <mark className="is-teal">people</mark>.</>, <><mark>狗</mark>咬<mark className="is-teal">人</mark></>, <><mark className="is-teal">People</mark> bite <mark>dogs</mark>.</>, <><mark className="is-teal">人</mark>咬<mark>狗</mark></>],
    [<>I <mark>live</mark> to <mark className="is-teal">eat</mark>.</>, <>我<mark>活着</mark>就是为了<mark className="is-teal">吃</mark></>, <>I <mark className="is-teal">eat</mark> to <mark>live</mark>.</>, <>我<mark className="is-teal">吃饭</mark>是为了<mark>活着</mark></>],
];
const WORD_COMPONENTS: Record<Word, number[]> = {
    watch: [.28, .7, .48, .9, .38, .62, .8, .45],
    the: [.38, .55, .45, .62, .41, .52, .59, .44],
    show: [.8, .51, .66, .37, .73, .57, .44, .69],
};
function PositionRibbon({ position, word }: {
    position: number;
    word?: Word;
}) {
    const code = Array.from({ length: 8 }, (_, i) => i % 2 === 0 ? Math.sin(position / 10000 ** (2 * Math.floor(i / 2) / 8)) : Math.cos(position / 10000 ** (2 * Math.floor(i / 2) / 8)));
    const vector = word ? code.map((v, i) => v + WORD_COMPONENTS[word][i]) : code;
    return <span className={`tr-pf-graphic-vector ${word ? 'is-combined' : 'is-position'}`} aria-label={word ? `${word} 加入位置${position + 1}后的向量示意` : `位置${position + 1}的编码示意`}>{vector.map((v, i) => <i key={i} style={{ opacity: .18 + Math.min(Math.abs(v) / (word ? 1.9 : 1), 1) * .82, backgroundColor: v < 0 ? '#c591b4' : undefined }}/>)}</span>;
}
function Bars({ word, output = false }: {
    word: Word;
    output?: boolean;
}) {
    return <span className={`tr-pf-bars ${output ? 'is-output' : ''}`} style={{ '--word-color': COLORS[word] } as CSSProperties} aria-label={output ? `${word} 的输出向量，两句相同` : `${word} 的向量示意`}>
    {[.28, .7, .48, .9, .38, .62, .8, .45].map((a, i) => <i key={i} style={{ backgroundColor: output ? OUTPUT_COMPONENT_COLORS[i] : undefined, opacity: output ? [.7, .35, .9, .5, .6, .8, .3, .65][i] : word === 'show' ? 1 - a * .7 : word === 'the' ? .4 + a * .3 : a }}/>)}</span>;
}
function Arrow({ visible = true }: {
    visible?: boolean;
}) { return <span className={`tr-pf-arrow ${visible ? 'is-visible' : ''}`} aria-hidden="true">⟶</span>; }
function ValueMatrix({ words, selected }: {
    words: Word[];
    selected: Word;
}) {
    return <div className="tr-pf-matrix-values"><strong>V</strong>{words.map(w => <div className={`tr-pf-matrix-value-row ${w === selected ? 'is-focused' : ''}`} style={{ '--word-color': COLORS[w] } as CSSProperties} key={w}><span style={{ color: COLORS[w] }}>{w}</span><Bars word={w}/></div>)}</div>;
}
function WeightMatrix({ words, selected, lane }: {
    words: Word[];
    selected: Word;
    lane: number;
}) {
    return <div className="tr-pf-full-attention"><div className="tr-pf-score-column-heads"><span />{words.map(w => <span key={w} style={{ color: COLORS[w] }}>{w}</span>)}</div>{words.map(query => <div key={query} style={{ '--query-color': COLORS[query] } as CSSProperties} className={`tr-pf-score-row ${query === selected ? 'is-selected' : ''}`}><strong>{query}</strong>{words.map(key => {
                const size = query === key ? 29 : key === 'the' ? 14 : 22;
                return <span key={key} data-weight-lane={lane} data-weight-query={query} data-weight-key={key}><i style={{ width: size, height: size, background: COLORS[key] }}/></span>;
            })}</div>)}</div>;
}
export function PositionFlowCard({ onComplete, page = 'why' }: Props) {
    const [step, setStep] = useState(0);
    const [selected, setSelected] = useState<Word>('watch');
    const isAdd = page === 'add';
    const examples = !isAdd && step === 4;
    const canvasRef = useRef<HTMLElement>(null);
    const [links, setLinks] = useState<{
        word: Word;
        path: string;
    }[]>([]);
    useLayoutEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || isAdd || step < 1 || examples) {
            setLinks([]);
            return;
        }
        const measure = () => {
            const bounds = canvas.getBoundingClientRect();
            if (!bounds.width || !bounds.height)
                return;
            const scaleX = canvas.clientWidth / bounds.width, scaleY = canvas.clientHeight / bounds.height;
            setLinks((['watch', 'the', 'show'] as Word[]).flatMap(word => {
                const first = canvas.querySelector(`[data-weight-lane="0"][data-weight-query="${selected}"][data-weight-key="${word}"]`);
                const second = canvas.querySelector(`[data-weight-lane="1"][data-weight-query="${selected}"][data-weight-key="${word}"]`);
                if (!first || !second)
                    return [];
                const a = first.getBoundingClientRect(), b = second.getBoundingClientRect();
                const x1 = (a.left + a.width / 2 - bounds.left) * scaleX;
                const y1 = (a.bottom - bounds.top) * scaleY;
                const x2 = (b.left + b.width / 2 - bounds.left) * scaleX;
                const y2 = (b.top - bounds.top) * scaleY;
                const middle = (y1 + y2) / 2;
                return [{ word, path: `M ${x1} ${y1} C ${x1} ${middle}, ${x2} ${middle}, ${x2} ${y2}` }];
            }));
        };
        // Wait until the stage's reveal translation has reached its resting position.
        const frame = requestAnimationFrame(measure);
        const timer = window.setTimeout(measure, 850);
        const observer = new ResizeObserver(measure);
        observer.observe(canvas);
        return () => { cancelAnimationFrame(frame); window.clearTimeout(timer); observer.disconnect(); };
    }, [selected, step, isAdd, examples]);
    const explanations = [
        <>词序变了，<mark>词义也会变</mark>。计算中用到顺序了吗？</>,
        <>词序换了，但<mark>{selected} 对同一个词的关注权重仍相同</mark>。</>,
        <>词序变了，但<mark>{selected} 汇聚到的信息没变</mark>。</>,
        <>词序不同，但<mark>{selected} 的输出向量仍然相同</mark>。</>,
    ];
    return <section className={`tr-pf-page ${isAdd ? 'is-add' : 'is-computation'} is-step-${step}`}>
    <header className="tr-lesson-header tr-pf-heading"><h1>{isAdd ? '位置编码：与词向量逐项相加' : '自注意力，知道谁在前、谁在后吗？'}</h1><p>{isAdd ? '点同一个词，对照两个位置的编码与相加结果。' : step === 1 ? '沿同色连线，对照两句中当前词对各词的关注权重。' : step === 2 ? '对照同色权重与加粗边框中的 V，观察两句汇聚的信息。' : step === 3 ? '按颜色逐项对照两条输出向量，看看同一个词的结果是否改变。' : '点选同一个词，再逐步查看权重和输出，比较交换词序后的变化。'}</p></header>
    <main className="tr-pf-canvas" ref={canvasRef}>
      {isAdd ? <>
        <div className="tr-pf-vector-row-labels"><span>词向量</span><span>位置编码</span><strong>新的输入</strong></div>
        <div className="tr-pf-visual-slots">{[0, 1, 2].map(pos => {
                const word = SENTENCES[0][pos];
                return <div className="tr-pf-visual-slot" key={pos}><span className="tr-pf-slot-number">位置 {pos + 1}</span><b className="tr-pf-vector-plus">＋</b><div className="tr-pf-fixed-code"><PositionRibbon position={pos}/></div><b className="tr-pf-vector-equals">＝</b><div className="tr-pf-result-code" key={`${word}-${pos}`}><PositionRibbon position={pos} word={word}/></div></div>;
            })}</div>
        <div className="tr-pf-word-travel">{SENTENCES[0].map((word, index) => <div className="tr-pf-travel-token" key={word} style={{ '--slot': index, '--word-color': COLORS[word] } as CSSProperties}><strong><mark className={word === 'show' ? 'is-teal' : word === 'the' ? 'is-neutral' : ''}>{word}</mark>{word !== 'the' && <span className="tr-pf-token-gloss"><mark className={word === 'show' ? 'is-teal' : ''}>{word === 'watch' ? '观看' : '表演'}</mark></span>}</strong><Bars word={word}/></div>)}</div>
        <div className="tr-pf-one-message tr-pf-method-transition"><span>位置编码有多种方式。</span><strong>这里介绍原论文的<mark>正余弦位置编码</mark>。</strong></div>
      </> : examples ? <div className="tr-pf-order-summary has-examples">
        <h2>语序也承载语义</h2>
        <div className="tr-pf-order-examples">{ORDER_EXAMPLES.map((example, index) => <div className="tr-pf-order-pair" key={index}><div><strong>{example[0]}</strong><span>{example[1]}</span></div><b>⇄</b><div><strong>{example[2]}</strong><span>{example[3]}</span></div></div>)}</div>
        <div className="tr-pf-order-conclusion">让模型利用语序，需要加入<strong>位置编码</strong>。</div>
      </div> : <>
        <div className="tr-pf-matrix-headings"><span>点击词语</span><span className={step >= 1 ? '' : 'is-muted'}>注意力权重 A</span><span className={step >= 2 ? '' : 'is-muted'}>各词的信息 V</span><span className={step >= 3 ? '' : 'is-muted'}>输出向量</span></div>
        {SENTENCES.map((words, row) => <div className={`tr-pf-lane is-row-${row}`} key={row}>
          <div className="tr-pf-sentence"><div className="tr-pf-word-stack">{words.map((word, pos) => <button type="button" aria-pressed={selected === word} aria-label={`追踪 ${word}，句子${row + 1}`} className={`tr-pf-word is-${word} ${selected === word ? 'is-selected' : ''}`} key={word} style={{ '--word-color': COLORS[word] } as CSSProperties} onClick={() => setSelected(word)}><strong>{pos === 0 ? word[0].toUpperCase() + word.slice(1) : word}</strong>{selected === word && <span>←</span>}</button>)}</div><p>{row === 0 ? <><mark>看</mark><mark className="is-teal">表演</mark>。</> : <><mark className="is-teal">展示</mark><mark>手表</mark>。</>}</p></div>
          <Arrow visible={step >= 1}/>
          <div className={`tr-pf-derived ${step >= 1 ? 'is-revealed' : ''}`}><WeightMatrix words={words} selected={selected} lane={row}/></div>
          <b className={`tr-pf-multiply tr-pf-matrix-times ${step >= 2 ? 'is-revealed' : ''}`}>×</b>
          <div key={`sum-${row}-${selected}`} className={`tr-pf-attention ${step >= 2 ? 'is-revealed' : ''}`}><ValueMatrix words={words} selected={selected}/></div>
          <Arrow visible={step >= 3}/>
          <div key={`output-${row}-${selected}`} className={`tr-pf-output ${step >= 3 ? 'is-revealed' : ''}`}><span>z<sub>{selected}</sub></span><Bars word={selected} output/></div>
        </div>)}
        {step >= 1 && <svg className="tr-pf-correspondence-links" aria-hidden="true">{links.map(link => <g key={link.word}><path className="tr-pf-link-halo" d={link.path}/><path className="tr-pf-link-color" d={link.path} stroke={COLORS[link.word]}/></g>)}</svg>}
        {step >= 3 && <div className="tr-pf-equal"><b>＝</b></div>}
        <aside className="tr-pf-explanation" key={step}><strong>{explanations[step]}</strong></aside>
      </>}
    </main>
    <footer className="tr-pf-footer"><div>{(!isAdd && step > 0) && <button className="is-secondary" onClick={() => { setStep(0); setSelected('watch'); }}>重播</button>}{isAdd ? <button onClick={onComplete}>正余弦怎样编码位置？ →</button> : <button onClick={() => step < 4 ? setStep(step + 1) : onComplete()}>{['看注意力权重图 →', '权重怎样汇聚信息？ →', '看汇聚结果 →', '词序还会改变什么？ →', '加入位置编码 →'][step]}</button>}</div></footer>
  </section>;
}
