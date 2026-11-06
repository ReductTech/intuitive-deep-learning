import { transformerAsset } from '../../assetUrls';
import { useState, type CSSProperties } from 'react';
import './QueryProjectionCard.css';
const WORDS = ['She', 'deposited', 'money', 'in', 'the', 'bank'];
const GLOSSES = ['她', '存入', '钱', '在……里', '定冠词', '银行'];
function BankCharacter() {
    return <img className="tr-query-boy" src={transformerAsset("03_自注意力/Q_信息需求.png")} alt="小男孩托着下巴，看向左侧词语思考"/>;
}
function VectorRibbon({ row, query = false }: {
    row: number;
    query?: boolean;
}) {
    // Color cells illustrate vector components; they are not trained activations.
    return <div className={`tr-query-ribbon ${query ? 'is-query' : ''}`} aria-label={query ? `${WORDS[row]} 的查询向量示意` : `${WORDS[row]} 的输入向量示意`}>
    {Array.from({ length: 12 }, (_, i) => <i key={i} style={{ opacity: .3 + ((i * 7 + row * 3 + (query ? 5 : 0)) % 11) / 16 }}/>)}
  </div>;
}
export function QueryProjectionCard({ onComplete }: {
    onComplete: () => void;
}) {
    const [phase, setPhase] = useState<'intro' | 'bank' | 'all'>('intro');
    const math = phase !== 'intro';
    return <section className={`tr-query-page is-${phase}`} aria-labelledby="tr-query-title">
    <header className="tr-lesson-header tr-query-heading"><h1 id="tr-query-title">自注意力①：用 Q 表达信息需求</h1><p>{phase === 'intro' ? '刚才看到了 bank 的表示随语境改变；接着点击下方按钮，看 Q 怎样生成。' : phase === 'bank' ? '沿 bank 的连线观察输入怎样变成 Q，再展开整句话。' : '对照各行：哪些输入经过了同一个 WQ，分别得到什么结果？'}</p></header>
    <main className="tr-query-canvas">
      <div className="tr-query-column-label is-word">句子中的词</div>
      {math && <><div className="tr-query-column-label is-input">输入向量</div><div className="tr-query-column-label is-output">查询向量</div></>}
      <div className="tr-query-word-column">{WORDS.map((word, i) => <div key={word} className={`tr-query-word ${i === 5 ? 'is-bank' : ''}`}><strong>{word}</strong><span>{GLOSSES[i]}</span></div>)}</div>

      {phase === 'intro' ? <div className="tr-query-intro">
        <div className="tr-query-speech"><span>bank 在找线索</span><p>这里说的是<strong>钱</strong>，还是<strong>河流</strong>？<br />谁能给我一点线索？</p></div>
        <BankCharacter />
        <p className="tr-query-bridge">把“需要什么线索”，<br />表示成<strong>查询向量 Q</strong>。</p>
      </div> : <>
        <div className="tr-query-calculation">
          <svg className="tr-query-wires" viewBox="0 0 890 650" preserveAspectRatio="none" aria-hidden="true">
            <defs><marker id="tr-query-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 9 5 1 9" fill="none" stroke="context-stroke" strokeWidth="1.8"/></marker></defs>
            {WORDS.map((word, i) => <g key={word} className={`tr-query-route ${i === 5 ? 'is-bank' : ''} ${phase === 'all' || i === 5 ? 'is-shown' : ''}`} style={{ '--reveal-delay': `${i * 190}ms` } as CSSProperties}>
              <path d={`M198 ${103 + i * 88} C280 ${103 + i * 88}, 295 322, 355 322`} markerEnd="url(#tr-query-arrow)"/>
              <path d={`M515 322 C580 322, 600 ${103 + i * 88}, 658 ${103 + i * 88}`} markerEnd="url(#tr-query-arrow)"/>
            </g>)}
          </svg>
          {WORDS.map((word, i) => <div key={word} className={`tr-query-vector-row ${phase === 'all' || i === 5 ? 'is-shown' : ''} ${i === 5 ? 'is-bank' : ''}`} style={{ top: 79 + i * 88, '--reveal-delay': `${i * 190}ms` } as CSSProperties}>
            <div className="tr-query-input"><VectorRibbon row={i}/><span>x<sub>{word}</sub></span></div>
            <div className="tr-query-output"><VectorRibbon row={i} query/><span>q<sub>{word}</sub></span></div>
          </div>)}
          <div className="tr-query-transform"><div className="tr-query-matrix-symbol">W<sub>Q</sub><div className="tr-query-matrix-cells">{Array.from({ length: 20 }, (_, i) => <i key={i} style={{ opacity: .3 + (i * 3 % 9) / 14 }}/>)}</div></div><p className="tr-query-transform-purpose"><strong>输入向量 → 查询向量</strong></p><span>512 → 512 · 单头示例</span><p className="tr-query-transform-learning">具体作用从数据中学得</p></div>
          {phase === 'all' && <div className="tr-query-bracket"><span>Q</span></div>}
        </div>
        {phase === 'bank' ? <aside className="tr-query-note is-bank-note"><span className="tr-query-pin"/><h2>bank 的查询向量</h2><p>bank 的输入向量经过 <strong>W<sub>Q</sub></strong>，得到查询向量 <strong>q<sub>bank</sub></strong>。</p><div className="tr-query-inline-formula">q<sub>bank</sub> = x<sub>bank</sub> W<sub>Q</sub></div><p className="tr-query-how">在高维空间里，可以把这个向量想象成在问：<strong>“这里说的是钱，还是河流？”</strong>实际表达的信息更复杂，往往难以直接解释。</p></aside> : <aside className="tr-query-note is-all-note"><span className="tr-query-pin"/><h2>每个词，都有自己的 Q</h2><p>共用<strong>同一个 W<sub>Q</sub></strong>，生成各自的查询向量，按行组成 <strong>Q 矩阵</strong>。</p><div className="tr-query-inline-formula">Q = XW<sub>Q</sub></div><p className="tr-query-learned">W<sub>Q</sub> 的具体作用<strong>从数据中学得</strong>，真实行为往往更复杂，也难以直接解释。</p></aside>}
      </>}
    </main>
    <footer className="tr-query-footer"><p>{phase === 'intro' ? '这里的提问帮助建立直觉，真实的 Q 是高维向量。' : '色带为向量示意；WQ 是变换参数，Q 是计算结果。'}</p><div>{phase !== 'intro' && <button type="button" className="is-secondary" onClick={() => setPhase('intro')}>重播</button>}<button type="button" onClick={() => phase === 'intro' ? setPhase('bank') : phase === 'bank' ? setPhase('all') : onComplete()}>{phase === 'intro' ? '看看怎样得到 Q →' : phase === 'bank' ? '展开整句话的 Q →' : '继续：认识 K 的匹配特征 →'}</button></div></footer>
  </section>;
}
