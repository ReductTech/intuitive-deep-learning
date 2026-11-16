import { transformerAsset } from '../../assetUrls';
import { useState, type CSSProperties } from 'react';
import './QueryProjectionCard.css';
const WORDS = ['She', 'deposited', 'money', 'in', 'the', 'bank'];
const GLOSSES = ['她', '存入', '钱', '在……里', '定冠词', '银行'];
function BankCharacter() {
    return <img shuku-edit-id="e-728d1c6d-0ff5-4812-a8ab-76a96c17a749" className="tr-query-boy" src={transformerAsset("03_自注意力/Q_信息需求.png")} alt="小男孩托着下巴，看向左侧词语思考"/>;
}
function VectorRibbon({ row, query = false }: {
    row: number;
    query?: boolean;
}) {
    // Color cells illustrate vector components; they are not trained activations.
    return <div shuku-edit-id="e-6695fa6e-3a27-4afa-86b8-29258b6a0233" className={`tr-query-ribbon ${query ? 'is-query' : ''}`} aria-label={query ? `${WORDS[row]} 的查询向量示意` : `${WORDS[row]} 的输入向量示意`}>
    {Array.from({ length: 12 }, (_, i) => <i shuku-edit-id="e-3a8dd1dc-f5a2-422e-9569-318922b1da2f" key={i} style={{ opacity: .3 + ((i * 7 + row * 3 + (query ? 5 : 0)) % 11) / 16 }}/>)}
  </div>;
}
export function QueryProjectionCard({ onComplete }: {
    onComplete: () => void;
}) {
    const [phase, setPhase] = useState<'intro' | 'bank' | 'all'>('intro');
    const math = phase !== 'intro';
    return <section shuku-edit-id="e-ef16c33c-7142-4445-ad6b-842947a411bc" className={`tr-query-page is-${phase}`} aria-labelledby="tr-query-title">
    <header shuku-edit-id="e-dd5a7562-4a1c-4e73-b3d5-672ae0de20d4" className="tr-lesson-header tr-query-heading"><h1 shuku-edit-id="e-ca09ce5e-9250-43aa-a184-7c7c0d519c1d" id="tr-query-title">自注意力①：用 Q 表达信息需求</h1><p shuku-edit-id="e-4e77255d-e00e-4ad8-a6e9-684ab87242a2">{phase === 'intro' ? '刚才看到了 bank 的表示随语境改变；接着点击下方按钮，看 Q 怎样生成。' : phase === 'bank' ? '沿 bank 的连线观察输入怎样变成 Q，再展开整句话。' : '对照各行：哪些输入经过了同一个 WQ，分别得到什么结果？'}</p></header>
    <main shuku-edit-id="e-c9ca359b-4048-4d10-8200-b80998c068b7" className="tr-query-canvas">
      <div shuku-edit-id="e-21ee010c-a861-4c66-a71e-7fe36d85e359" className="tr-query-column-label is-word">句子中的词</div>
      {math && <><div shuku-edit-id="e-ea726554-51c6-4d99-a7d7-12490cc9c186" className="tr-query-column-label is-input">输入向量</div><div shuku-edit-id="e-3b9480a3-4485-4e6e-a974-c2e6480c1378" className="tr-query-column-label is-output">查询向量</div></>}
      <div shuku-edit-id="e-26f8d298-adaf-4ef4-902f-bceefc93b700" className="tr-query-word-column">{WORDS.map((word, i) => <div shuku-edit-id="e-ecdd5054-7711-494c-8996-917ec03e72b3" key={word} className={`tr-query-word ${i === 5 ? 'is-bank' : ''}`}><strong shuku-edit-id="e-5a60ef7b-c894-417b-ac3f-41bb702b5b70">{word}</strong><span shuku-edit-id="e-f9a0572b-c703-4a3a-8647-e91855877fd2">{GLOSSES[i]}</span></div>)}</div>

      {phase === 'intro' ? <div shuku-edit-id="e-27f6fc7c-a8d0-41ed-b361-d4b68251bb14" className="tr-query-intro">
        <div shuku-edit-id="e-9aaf16ef-ad7f-424e-b2d2-712b771d01b8" className="tr-query-speech"><span shuku-edit-id="e-54b65a9c-545d-441b-9eaf-2b690e27b42c">bank 在找线索</span><p shuku-edit-id="e-bf6cd9ea-3184-404c-ad13-769142641bcc">这里说的是<strong shuku-edit-id="e-1ae51d37-7d22-4af5-bc9e-9006c3ed061d">钱</strong>，还是<strong shuku-edit-id="e-6d4ef757-bc8f-404d-8838-313f4054ed4e">河流</strong>？<br shuku-edit-id="e-9c176d26-0d40-42ad-90d8-1a045f8705b2" />谁能给我一点线索？</p></div>
        <BankCharacter />
        <p shuku-edit-id="e-d44343fb-4c88-444c-b037-672674a5d9b6" className="tr-query-bridge">把“需要什么线索”，<br shuku-edit-id="e-f22d4606-ae58-466d-a0a4-736e86f299ec" />表示成<strong shuku-edit-id="e-78c7a612-ec28-451c-be76-e1a407c00017">查询向量 Q</strong>。</p>
      </div> : <>
        <div shuku-edit-id="e-7e9f927e-99e9-494a-a68e-53bd68c3916c" className="tr-query-calculation">
          <svg shuku-edit-id="e-605aaaf0-9b9b-493f-b92c-806a0e62bd48" className="tr-query-wires" viewBox="0 0 890 650" preserveAspectRatio="none" aria-hidden="true">
            <defs shuku-edit-id="e-bb2d587b-bee0-4d9b-a983-f286fd49e0dc"><marker shuku-edit-id="e-94a10906-28a3-4e39-86b5-f920a7a39c03" id="tr-query-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path shuku-edit-id="e-532fd770-9c13-403a-a035-d163e6c44b41" d="M1 1 9 5 1 9" fill="none" stroke="context-stroke" strokeWidth="1.8"/></marker></defs>
            {WORDS.map((word, i) => <g shuku-edit-id="e-5cf69d38-4dbc-4d4e-a585-2c5ae05ac93f" key={word} className={`tr-query-route ${i === 5 ? 'is-bank' : ''} ${phase === 'all' || i === 5 ? 'is-shown' : ''}`} style={{ '--reveal-delay': `${i * 190}ms` } as CSSProperties}>
              <path shuku-edit-id="e-39b2a346-43f6-402a-989a-f5a159dd98c4" d={`M198 ${103 + i * 88} C280 ${103 + i * 88}, 295 322, 355 322`} markerEnd="url(#tr-query-arrow)"/>
              <path shuku-edit-id="e-1c2b5148-c885-477a-8840-8821dbe7da98" d={`M515 322 C580 322, 600 ${103 + i * 88}, 658 ${103 + i * 88}`} markerEnd="url(#tr-query-arrow)"/>
            </g>)}
          </svg>
          {WORDS.map((word, i) => <div shuku-edit-id="e-6a76210a-8018-4c3b-8983-3959b39dfb8a" key={word} className={`tr-query-vector-row ${phase === 'all' || i === 5 ? 'is-shown' : ''} ${i === 5 ? 'is-bank' : ''}`} style={{ top: 79 + i * 88, '--reveal-delay': `${i * 190}ms` } as CSSProperties}>
            <div shuku-edit-id="e-fa59c534-5fd4-4363-b5c3-3fbd3d72317a" className="tr-query-input"><VectorRibbon row={i}/><span shuku-edit-id="e-b39504a4-8b41-4dcf-b406-8dd1e9f4de23">x<sub shuku-edit-id="e-bc70a0d5-9542-43e6-a3ed-30138fd1629c">{word}</sub></span></div>
            <div shuku-edit-id="e-46719d75-e592-4ddc-ad0b-3bfb99293f0e" className="tr-query-output"><VectorRibbon row={i} query/><span shuku-edit-id="e-308299bb-354e-42d5-adef-202882fc3287">q<sub shuku-edit-id="e-3a73a841-74d1-4691-b3e4-9cb13ff8758e">{word}</sub></span></div>
          </div>)}
          <div shuku-edit-id="e-1f53ec6c-8f20-409b-a658-e219e851a43d" className="tr-query-transform"><div shuku-edit-id="e-cc9a6bcd-61c3-493c-bb1c-9e7ba3b6fdcb" className="tr-query-matrix-symbol">W<sub shuku-edit-id="e-ce26d179-bc05-45c6-adf4-6ff377d67b0f">Q</sub><div shuku-edit-id="e-6013a42e-3b0e-433b-9c24-3970bac30670" className="tr-query-matrix-cells">{Array.from({ length: 20 }, (_, i) => <i shuku-edit-id="e-a2beee37-3fda-4c51-9b18-605c0d8cf341" key={i} style={{ opacity: .3 + (i * 3 % 9) / 14 }}/>)}</div></div><p shuku-edit-id="e-4e237703-17cb-4767-8c5e-a9b50734ab2b" className="tr-query-transform-purpose"><strong shuku-edit-id="e-6523e52c-50b9-49e8-ba4f-09603485c8aa">输入向量 → 查询向量</strong></p><span shuku-edit-id="e-1c66aec6-f2ee-40c9-b1cd-2ff194a22d88">512 → 512 · 单头示例</span><p shuku-edit-id="e-8fa69cfd-5a10-47c0-9d14-2ecf27901ff9" className="tr-query-transform-learning">具体作用从数据中学得</p></div>
          {phase === 'all' && <div shuku-edit-id="e-c8500f08-62e8-4fb7-98a6-b538a0c1f5a9" className="tr-query-bracket"><span shuku-edit-id="e-845ef6dd-09a7-4013-9446-c5d90ae868c4">Q</span></div>}
        </div>
        {phase === 'bank' ? <aside shuku-edit-id="e-f6da1f5a-8222-48b5-a917-5eac07eb901a" className="tr-query-note is-bank-note"><span shuku-edit-id="e-c74b87c2-5cfe-4d97-a889-b817f0629d1b" className="tr-query-pin"/><h2 shuku-edit-id="e-e076f29e-875b-444c-8abc-5b3b2801aacd">bank 的查询向量</h2><p shuku-edit-id="e-b98b7f4e-8ab1-4fba-a148-b3c0d2763094">bank 的输入向量经过 <strong shuku-edit-id="e-ec5008bf-5020-44c6-9e73-1eec53243b9e">W<sub shuku-edit-id="e-846b7263-09cf-43b4-afd6-fb843aa3155d">Q</sub></strong>，得到查询向量 <strong shuku-edit-id="e-a1a02d9d-03d4-404a-97e1-fe9f34ae78d9">q<sub shuku-edit-id="e-6ee89bc7-4a88-4e07-88d1-2c66f5416888">bank</sub></strong>。</p><div shuku-edit-id="e-1687514d-db47-40f2-90df-fd21d8c26b61" className="tr-query-inline-formula">q<sub shuku-edit-id="e-87067b04-cb9f-493f-b904-6df633285d7a">bank</sub> = x<sub shuku-edit-id="e-66f35091-63b9-4d4d-9f57-cea881749a28">bank</sub> W<sub shuku-edit-id="e-9083a3ab-1c4f-4957-8d8f-a27670e90121">Q</sub></div><p shuku-edit-id="e-67df5b3e-61d3-4dcf-8186-32bd02fd096a" className="tr-query-how">在高维空间里，可以把这个向量想象成在问：<strong shuku-edit-id="e-a543a0db-ce4f-427f-972e-9e61f68ed0f8">“这里说的是钱，还是河流？”</strong>实际表达的信息更复杂，往往难以直接解释。</p></aside> : <aside shuku-edit-id="e-44c2d5cf-436b-4371-a76a-bd19e616269e" className="tr-query-note is-all-note"><span shuku-edit-id="e-7b1a131a-362d-460a-9b9f-118bde5cafc5" className="tr-query-pin"/><h2 shuku-edit-id="e-a91dd7ba-378f-463c-9763-ef8f15b15f1e">每个词，都有自己的 Q</h2><p shuku-edit-id="e-259e6938-c2a0-4b14-b6bc-0086ea9ef9c8">共用<strong shuku-edit-id="e-78d1ac81-9a3d-464d-a2ba-26ab53649f59">同一个 W<sub shuku-edit-id="e-eab6f3e3-ce06-468f-b631-5fbb7590ba75">Q</sub></strong>，生成各自的查询向量，按行组成 <strong shuku-edit-id="e-f81018b9-8c98-44a5-9ec4-71653daa03a0">Q 矩阵</strong>。</p><div shuku-edit-id="e-1b66a68d-8cc0-4f6a-bfa9-9f118a06bc9d" className="tr-query-inline-formula">Q = XW<sub shuku-edit-id="e-0c5e37da-e6b0-4606-a0aa-f92fb7f0e8ea">Q</sub></div><p shuku-edit-id="e-a78605a9-d559-4589-a6cc-ac0d7424089b" className="tr-query-learned">W<sub shuku-edit-id="e-24385563-31e7-44ed-ad71-1c75a8bb25a7">Q</sub> 的具体作用<strong shuku-edit-id="e-1f5d0ed1-8b93-46e4-a530-19de6c9eecdf">从数据中学得</strong>，真实行为往往更复杂，也难以直接解释。</p></aside>}
      </>}
    </main>
    <footer shuku-edit-id="e-930ef954-2e0f-415c-b8b7-2cb367b6227e" className="tr-query-footer"><p shuku-edit-id="e-eef0603e-c559-47bb-953e-d57ed5828939">{phase === 'intro' ? '这里的提问帮助建立直觉，真实的 Q 是高维向量。' : '色带为向量示意；WQ 是变换参数，Q 是计算结果。'}</p><div shuku-edit-id="e-60486c6d-2632-4205-99ce-b51fc6399ba3">{phase !== 'intro' && <button shuku-edit-id="e-bde0a536-83ac-419e-8331-2be09ea4d871" type="button" className="is-secondary" onClick={() => setPhase('intro')}>重播</button>}<button shuku-edit-id="e-11a3247b-683a-42a4-82d4-2d13bbb8884a" type="button" onClick={() => phase === 'intro' ? setPhase('bank') : phase === 'bank' ? setPhase('all') : onComplete()}>{phase === 'intro' ? '看看怎样得到 Q →' : phase === 'bank' ? '展开整句话的 Q →' : '继续：认识 K 的匹配特征 →'}</button></div></footer>
  </section>;
}
