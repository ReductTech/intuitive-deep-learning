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
    [<><mark shuku-edit-id="e-1166b968-5407-49bd-81b0-1cb2b41bb6ff">Watch</mark> the <mark shuku-edit-id="e-8d9642c6-8056-4757-ac65-ffd32886cddb" className="is-teal">show</mark>.</>, <><mark shuku-edit-id="e-903e1d7c-3fd8-46b4-800d-0ab2a9f8da8c">看</mark><mark shuku-edit-id="e-62bfa70a-71bb-499d-916a-c7071eb6f6dc" className="is-teal">表演</mark></>, <><mark shuku-edit-id="e-7bdf3b3d-39c9-4eec-84d7-ebba58f36b47" className="is-teal">Show</mark> the <mark shuku-edit-id="e-b011aac3-afc7-4946-97d5-a87625ced7bf">watch</mark>.</>, <><mark shuku-edit-id="e-1bc2e1c1-6857-453c-b9f1-36c87ce33173" className="is-teal">展示</mark><mark shuku-edit-id="e-126e22f1-4dc1-4702-8e19-a07f60f57c78">手表</mark></>],
    [<><mark shuku-edit-id="e-3c9956fe-5507-4026-a49a-d31a762d3cee">Record</mark> the <mark shuku-edit-id="e-75ae198c-e7bb-4238-84f7-6e946f408766" className="is-teal">play</mark>.</>, <><mark shuku-edit-id="e-b23d96fb-2605-48d6-8d42-1db5dd11bbd4">录下</mark>这出<mark shuku-edit-id="e-7d25c7b4-f4fc-4664-bd14-a95bf87e1a71" className="is-teal">戏</mark></>, <><mark shuku-edit-id="e-36e7b432-4cd7-497c-890b-d82bb109a309" className="is-teal">Play</mark> the <mark shuku-edit-id="e-af7fad3f-ab6e-40fe-8f34-1a62fd737232">record</mark>.</>, <><mark shuku-edit-id="e-518978f8-8313-42d8-9ab3-846cc0e0c927" className="is-teal">播放</mark>这张<mark shuku-edit-id="e-b9101c3f-6ae9-4ce6-81ac-5eeae7315021">唱片</mark></>],
    [<><mark shuku-edit-id="e-1ea77977-b0fe-4f76-8ada-d09a0664204f">Dogs</mark> bite <mark shuku-edit-id="e-9f3676d1-e3fa-4af2-9208-eb1321811f2f" className="is-teal">people</mark>.</>, <><mark shuku-edit-id="e-feffca04-d481-472d-8165-ddf4fa94300d">狗</mark>咬<mark shuku-edit-id="e-9229a213-404f-4b2f-9c57-385f9d8d29c5" className="is-teal">人</mark></>, <><mark shuku-edit-id="e-7d7bf543-3b4b-46fc-b9a6-d7b53861273d" className="is-teal">People</mark> bite <mark shuku-edit-id="e-b7bb1a14-09d5-4c2a-8a15-3ccea1301742">dogs</mark>.</>, <><mark shuku-edit-id="e-46975957-3f04-44de-b6a5-d5cfe498c827" className="is-teal">人</mark>咬<mark shuku-edit-id="e-47527fc3-cc2c-4173-a5ef-944fb4f86861">狗</mark></>],
    [<>I <mark shuku-edit-id="e-0e3f9750-fb4a-48bd-a80f-d0f1c3fe0d73">live</mark> to <mark shuku-edit-id="e-a38d10af-1593-4f30-978e-05df99b4d3f6" className="is-teal">eat</mark>.</>, <>我<mark shuku-edit-id="e-8b076022-8c26-4fbb-8d4f-28bfc7b3f558">活着</mark>就是为了<mark shuku-edit-id="e-088ca56d-50a6-4d54-b6fd-0bb0dc170a56" className="is-teal">吃</mark></>, <>I <mark shuku-edit-id="e-f54c5d51-85a3-4c66-b4c9-2a814b40a1d2" className="is-teal">eat</mark> to <mark shuku-edit-id="e-c4fff539-10ef-4d6d-a9dd-67e4dc8e9f29">live</mark>.</>, <>我<mark shuku-edit-id="e-1f1e9543-01fd-4476-adcb-b23bcf06eef4" className="is-teal">吃饭</mark>是为了<mark shuku-edit-id="e-99ab1a45-bab8-44df-a804-d74e33865fcf">活着</mark></>],
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
    return <span shuku-edit-id="e-a512a8d9-c326-413c-b1fa-57ca3cba255e" className={`tr-pf-graphic-vector ${word ? 'is-combined' : 'is-position'}`} aria-label={word ? `${word} 加入位置${position + 1}后的向量示意` : `位置${position + 1}的编码示意`}>{vector.map((v, i) => <i shuku-edit-id="e-afc01477-66e6-4a67-a935-2e57472f320e" key={i} style={{ opacity: .18 + Math.min(Math.abs(v) / (word ? 1.9 : 1), 1) * .82, backgroundColor: v < 0 ? '#c591b4' : undefined }}/>)}</span>;
}
function Bars({ word, output = false }: {
    word: Word;
    output?: boolean;
}) {
    return <span shuku-edit-id="e-dbb366c1-e91f-431a-84f1-862c244d5798" className={`tr-pf-bars ${output ? 'is-output' : ''}`} style={{ '--word-color': COLORS[word] } as CSSProperties} aria-label={output ? `${word} 的输出向量，两句相同` : `${word} 的向量示意`}>
    {[.28, .7, .48, .9, .38, .62, .8, .45].map((a, i) => <i shuku-edit-id="e-c009387f-72ff-4e5f-8344-a1df2eb140a4" key={i} style={{ backgroundColor: output ? OUTPUT_COMPONENT_COLORS[i] : undefined, opacity: output ? [.7, .35, .9, .5, .6, .8, .3, .65][i] : word === 'show' ? 1 - a * .7 : word === 'the' ? .4 + a * .3 : a }}/>)}</span>;
}
function Arrow({ visible = true }: {
    visible?: boolean;
}) { return <span shuku-edit-id="e-d8d73f57-366d-4018-a028-b4df1c7053cf" className={`tr-pf-arrow ${visible ? 'is-visible' : ''}`} aria-hidden="true">⟶</span>; }
function ValueMatrix({ words, selected }: {
    words: Word[];
    selected: Word;
}) {
    return <div shuku-edit-id="e-42c7d6aa-f4fc-494e-b5be-e636635b920a" className="tr-pf-matrix-values"><strong shuku-edit-id="e-f3d231f5-bbc0-490b-9450-337499c208a2">V</strong>{words.map(w => <div shuku-edit-id="e-6641070f-3034-47e9-92ba-e30701a4d270" className={`tr-pf-matrix-value-row ${w === selected ? 'is-focused' : ''}`} style={{ '--word-color': COLORS[w] } as CSSProperties} key={w}><span shuku-edit-id="e-bf77211f-0c91-4d4c-b80c-5ee81415b8ef" style={{ color: COLORS[w] }}>{w}</span><Bars word={w}/></div>)}</div>;
}
function WeightMatrix({ words, selected, lane }: {
    words: Word[];
    selected: Word;
    lane: number;
}) {
    return <div shuku-edit-id="e-d9705eb3-9d5f-48ad-b633-9625a238f2d9" className="tr-pf-full-attention"><div shuku-edit-id="e-946ed176-02cd-4dfb-b458-9c32d02dbd3a" className="tr-pf-score-column-heads"><span shuku-edit-id="e-7b1ca741-23f1-4c8b-909e-9bb33969d002" />{words.map(w => <span shuku-edit-id="e-015406fb-c94c-4601-b7c0-3fdabac2ea50" key={w} style={{ color: COLORS[w] }}>{w}</span>)}</div>{words.map(query => <div shuku-edit-id="e-807dc630-c804-4a86-865e-eb407585c9e5" key={query} style={{ '--query-color': COLORS[query] } as CSSProperties} className={`tr-pf-score-row ${query === selected ? 'is-selected' : ''}`}><strong shuku-edit-id="e-a18ecf77-1c23-4663-a306-e4c17c1f02b1">{query}</strong>{words.map(key => {
                const size = query === key ? 29 : key === 'the' ? 14 : 22;
                return <span shuku-edit-id="e-661ae323-1c61-4b88-8a67-2b37b7748ec2" key={key} data-weight-lane={lane} data-weight-query={query} data-weight-key={key}><i shuku-edit-id="e-2e6df791-e496-4c17-bf33-d8283effd90b" style={{ width: size, height: size, background: COLORS[key] }}/></span>;
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
        <>词序变了，<mark shuku-edit-id="e-bb068d37-1e0b-4886-a235-f4909058ec15">词义也会变</mark>。计算中用到顺序了吗？</>,
        <>词序换了，但<mark shuku-edit-id="e-eface185-6c48-4ac9-a93b-0014009c1608">{selected} 对同一个词的关注权重仍相同</mark>。</>,
        <>词序变了，但<mark shuku-edit-id="e-d94c4391-8f80-4069-81dc-f76b483bcbae">{selected} 汇聚到的信息没变</mark>。</>,
        <>词序不同，但<mark shuku-edit-id="e-96b02ad8-d479-44ac-ba57-a86c809ddd84">{selected} 的输出向量仍然相同</mark>。</>,
    ];
    return <section shuku-edit-id="e-db5cad86-587e-4c3b-a677-a35ab690296e" className={`tr-pf-page ${isAdd ? 'is-add' : 'is-computation'} is-step-${step}`}>
    <header shuku-edit-id="e-1c53ae22-c0f3-4148-82d7-b4bbdbd04354" className="tr-lesson-header tr-pf-heading"><h1 shuku-edit-id="e-72c42c29-f5e8-44de-8718-1c048f685610">{isAdd ? '位置编码：与词向量逐项相加' : '自注意力，知道谁在前、谁在后吗？'}</h1><p shuku-edit-id="e-e262f15b-a95b-49aa-b6bd-e38f2e9cd6fa">{isAdd ? '点同一个词，对照两个位置的编码与相加结果。' : step === 1 ? '沿同色连线，对照两句中当前词对各词的关注权重。' : step === 2 ? '对照同色权重与加粗边框中的 V，观察两句汇聚的信息。' : step === 3 ? '按颜色逐项对照两条输出向量，看看同一个词的结果是否改变。' : '点选同一个词，再逐步查看权重和输出，比较交换词序后的变化。'}</p></header>
    <main shuku-edit-id="e-d36b5403-8297-48a5-8727-c3160a6b48a7" className="tr-pf-canvas" ref={canvasRef}>
      {isAdd ? <>
        <div shuku-edit-id="e-7a39b545-3786-454b-9316-69d75bbd9d38" className="tr-pf-vector-row-labels"><span shuku-edit-id="e-de3f6dd1-ab8d-44a8-94c9-d10f16fbce39">词向量</span><span shuku-edit-id="e-8cb993c0-0c73-4fe4-896b-f4ba9aae784c">位置编码</span><strong shuku-edit-id="e-52c452e7-435f-49ff-9436-5d6eebc13f6a">新的输入</strong></div>
        <div shuku-edit-id="e-b9408d8a-bb98-4d9e-9474-bac6acc07a41" className="tr-pf-visual-slots">{[0, 1, 2].map(pos => {
                const word = SENTENCES[0][pos];
                return <div shuku-edit-id="e-f946dac8-3c7f-4bee-8335-d7994bc832a6" className="tr-pf-visual-slot" key={pos}><span shuku-edit-id="e-86ba1720-7a6c-4145-a086-7fe5e31694ed" className="tr-pf-slot-number">位置 {pos + 1}</span><b shuku-edit-id="e-33e78877-3a46-483f-8779-f51a18cadc65" className="tr-pf-vector-plus">＋</b><div shuku-edit-id="e-da274712-028b-4f84-970c-46c2ee321173" className="tr-pf-fixed-code"><PositionRibbon position={pos}/></div><b shuku-edit-id="e-65a7e3e1-5f97-461e-875f-2ad94e0f0868" className="tr-pf-vector-equals">＝</b><div shuku-edit-id="e-3425693a-d2a0-4739-be2f-e7bcbe82b263" className="tr-pf-result-code" key={`${word}-${pos}`}><PositionRibbon position={pos} word={word}/></div></div>;
            })}</div>
        <div shuku-edit-id="e-7e3c39d6-1976-4bd2-a8a4-8535f64ff7a1" className="tr-pf-word-travel">{SENTENCES[0].map((word, index) => <div shuku-edit-id="e-326a721c-ef31-46c0-8600-aa8137d6c0f8" className="tr-pf-travel-token" key={word} style={{ '--slot': index, '--word-color': COLORS[word] } as CSSProperties}><strong shuku-edit-id="e-4dc8c736-cc98-4b39-bb5f-510cab82aaeb"><mark shuku-edit-id="e-dd7129fa-d244-453a-b057-2f08d12b0420" className={word === 'show' ? 'is-teal' : word === 'the' ? 'is-neutral' : ''}>{word}</mark>{word !== 'the' && <span shuku-edit-id="e-b7cfaeaa-e920-459e-8e77-d13efea1e0db" className="tr-pf-token-gloss"><mark shuku-edit-id="e-c4d493d5-3fb1-45c2-98c4-f272554ed344" className={word === 'show' ? 'is-teal' : ''}>{word === 'watch' ? '观看' : '表演'}</mark></span>}</strong><Bars word={word}/></div>)}</div>
        <div shuku-edit-id="e-3a3a3239-dbbd-4732-8b60-e19df2aec0ec" className="tr-pf-one-message tr-pf-method-transition"><span shuku-edit-id="e-86be75e7-affe-4dad-aa7b-065fdf58577b">位置编码有多种方式。</span><strong shuku-edit-id="e-3a1e38b3-0877-46b9-aa7a-1a956917d64a">这里介绍原论文的<mark shuku-edit-id="e-35688a78-d6dd-490b-8dff-fb074326f3df">正余弦位置编码</mark>。</strong></div>
      </> : examples ? <div shuku-edit-id="e-6791bce4-c74b-4db7-a337-dd9b9f2a4bad" className="tr-pf-order-summary has-examples">
        <h2 shuku-edit-id="e-162dd790-99a3-4179-8e21-9965d359d86e">语序也承载语义</h2>
        <div shuku-edit-id="e-afc06368-6e59-4b53-8643-13390cf96421" className="tr-pf-order-examples">{ORDER_EXAMPLES.map((example, index) => <div shuku-edit-id="e-ff14fb79-28a6-47d8-8de5-f7e877972fa1" className="tr-pf-order-pair" key={index}><div shuku-edit-id="e-44c9400c-818d-4073-8206-847dd2aa39db"><strong shuku-edit-id="e-dff65924-5167-47f2-bf49-404870cb71ea">{example[0]}</strong><span shuku-edit-id="e-54634a7a-d56e-4781-be51-f052189f2042">{example[1]}</span></div><b shuku-edit-id="e-943e4d03-7892-4da9-a033-a75c484f956e">⇄</b><div shuku-edit-id="e-89f07482-ac83-4670-aaa9-5525201e06a1"><strong shuku-edit-id="e-65f9c0be-e5b7-44a0-ad0a-b548d9d7757c">{example[2]}</strong><span shuku-edit-id="e-e7f294d1-d2ea-4bad-8e59-778030b1d9da">{example[3]}</span></div></div>)}</div>
        <div shuku-edit-id="e-0c21e916-4b45-413e-83d7-153b4bb91d75" className="tr-pf-order-conclusion">让模型利用语序，需要加入<strong shuku-edit-id="e-4fa3f161-59cb-47b4-86fb-82a878a85515">位置编码</strong>。</div>
      </div> : <>
        <div shuku-edit-id="e-5691e73b-e492-4162-a9ea-67083fd76636" className="tr-pf-matrix-headings"><span shuku-edit-id="e-21b17a30-aa13-4732-acbd-e4803dd64a26">点击词语</span><span shuku-edit-id="e-f81de961-b04a-4641-944e-1777af6dadbe" className={step >= 1 ? '' : 'is-muted'}>注意力权重 A</span><span shuku-edit-id="e-6f21370b-0b60-4255-8ee9-0bb4b55bd901" className={step >= 2 ? '' : 'is-muted'}>各词的信息 V</span><span shuku-edit-id="e-54b1889f-3004-45f2-a1aa-6879b4c95c9f" className={step >= 3 ? '' : 'is-muted'}>输出向量</span></div>
        {SENTENCES.map((words, row) => <div shuku-edit-id="e-a4ba4701-ef1c-4146-8530-c98fcddac1fe" className={`tr-pf-lane is-row-${row}`} key={row}>
          <div shuku-edit-id="e-e796731b-97af-4b99-8d70-d89fe47ab4a7" className="tr-pf-sentence"><div shuku-edit-id="e-dedab8d9-8891-4401-8320-6c806adbb471" className="tr-pf-word-stack">{words.map((word, pos) => <button shuku-edit-id="e-17b2ce04-1692-4cf4-aa05-e8101bf301f8" type="button" aria-pressed={selected === word} aria-label={`追踪 ${word}，句子${row + 1}`} className={`tr-pf-word is-${word} ${selected === word ? 'is-selected' : ''}`} key={word} style={{ '--word-color': COLORS[word] } as CSSProperties} onClick={() => setSelected(word)}><strong shuku-edit-id="e-1e0da472-3c9c-49d0-adf4-c99929a64ca7">{pos === 0 ? word[0].toUpperCase() + word.slice(1) : word}</strong>{selected === word && <span shuku-edit-id="e-5b8c09c8-19fe-426d-9fc7-5ef0f5afc3fe">←</span>}</button>)}</div><p shuku-edit-id="e-00d1ee17-4c6f-4bb7-8d4b-bcf15dd0f125">{row === 0 ? <><mark shuku-edit-id="e-6315c830-6e35-4261-aa7f-2bb0f2684d33">看</mark><mark shuku-edit-id="e-296c87b2-3286-47b6-853a-d88a7a6d5564" className="is-teal">表演</mark>。</> : <><mark shuku-edit-id="e-6677c90b-01b8-4950-a3f5-ad0c5869786f" className="is-teal">展示</mark><mark shuku-edit-id="e-2c5ef045-b236-4bf0-85a4-04d905ce1f7a">手表</mark>。</>}</p></div>
          <Arrow visible={step >= 1}/>
          <div shuku-edit-id="e-43929602-d4cc-4738-bfd4-dd89c97f2b32" className={`tr-pf-derived ${step >= 1 ? 'is-revealed' : ''}`}><WeightMatrix words={words} selected={selected} lane={row}/></div>
          <b shuku-edit-id="e-71836060-8a52-40a1-bbdc-1656dd2128d9" className={`tr-pf-multiply tr-pf-matrix-times ${step >= 2 ? 'is-revealed' : ''}`}>×</b>
          <div shuku-edit-id="e-3b43d0b7-87d1-46dd-b61c-b09ef83da7b1" key={`sum-${row}-${selected}`} className={`tr-pf-attention ${step >= 2 ? 'is-revealed' : ''}`}><ValueMatrix words={words} selected={selected}/></div>
          <Arrow visible={step >= 3}/>
          <div shuku-edit-id="e-1b8b740c-d0de-4d9e-b4c6-9f88b79f923f" key={`output-${row}-${selected}`} className={`tr-pf-output ${step >= 3 ? 'is-revealed' : ''}`}><span shuku-edit-id="e-50f3f820-0a02-4e5a-af3c-442505bed80f">z<sub shuku-edit-id="e-de85c06a-816d-40ec-8884-0e1f282b5182">{selected}</sub></span><Bars word={selected} output/></div>
        </div>)}
        {step >= 1 && <svg shuku-edit-id="e-048e4e82-0f38-40d6-bcb0-6ebd7dd4652f" className="tr-pf-correspondence-links" aria-hidden="true">{links.map(link => <g shuku-edit-id="e-43975ce3-9cac-49c9-b15f-a5841a88ae11" key={link.word}><path shuku-edit-id="e-2bd8b503-01d2-4514-90c9-d4d1b9029357" className="tr-pf-link-halo" d={link.path}/><path shuku-edit-id="e-227dc838-28e2-496f-990b-b4b0d709ee69" className="tr-pf-link-color" d={link.path} stroke={COLORS[link.word]}/></g>)}</svg>}
        {step >= 3 && <div shuku-edit-id="e-8aba16e0-1bae-4531-b147-b38bfbeffac1" className="tr-pf-equal"><b shuku-edit-id="e-21defe56-7b73-49da-9850-9653d549aac6">＝</b></div>}
        <aside shuku-edit-id="e-a83e8cc1-6264-4c6a-8d26-a4a717e60270" className="tr-pf-explanation" key={step}><strong shuku-edit-id="e-10b74e55-ff1c-4f35-b86e-922e0fb3091c">{explanations[step]}</strong></aside>
      </>}
    </main>
    <footer shuku-edit-id="e-2e4f7956-4ef5-48ba-b151-ea19f5ea9eb9" className="tr-pf-footer"><div shuku-edit-id="e-c94c413b-80e0-4cf6-a391-bf65dcc2a264">{(!isAdd && step > 0) && <button shuku-edit-id="e-64fd0716-27a0-4aca-8ff5-98fee20143f4" className="is-secondary" onClick={() => { setStep(0); setSelected('watch'); }}>重播</button>}{isAdd ? <button shuku-edit-id="e-e24f93fd-0d26-40b1-9719-45fbabcc023d" onClick={onComplete}>正余弦怎样编码位置？ →</button> : <button shuku-edit-id="e-bd792e32-3475-4ae3-9f48-d8e4f3649b54" onClick={() => step < 4 ? setStep(step + 1) : onComplete()}>{['看注意力权重图 →', '权重怎样汇聚信息？ →', '看汇聚结果 →', '词序还会改变什么？ →', '加入位置编码 →'][step]}</button>}</div></footer>
  </section>;
}
