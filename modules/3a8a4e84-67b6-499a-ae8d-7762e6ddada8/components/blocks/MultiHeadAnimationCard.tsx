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
    return <div shuku-edit-id="e-eb5bc445-3733-4d56-8586-3b9ccce05028" className="tr-ma-expert">{question && <span shuku-edit-id="e-a46226e1-a9a8-4787-8336-cc39c6fd60a0" className="tr-ma-question">{HEAD_QUESTIONS[head]}</span>}<span shuku-edit-id="e-fb9119e4-9cb6-41da-b65c-68399bcc4410" role="img" aria-label={`第${head + 1}头的小专家`} className="tr-ma-person" style={{ backgroundImage: `url("${transformerAsset("04_多头注意力/八头专家.webp")}")`, backgroundPosition: `${head * 100 / 7}% center` }}/></div>;
}
function ColorMatrix({ data, color, wide = false, reveal = false }: {
    data: number[][];
    color: string;
    wide?: boolean;
    reveal?: boolean;
}) {
    const cols = wide ? [0, 1, 510, 511] : COLS;
    return <div shuku-edit-id="e-90d6a17d-3daa-4992-af81-204d41533d36" className={`tr-ma-color-matrix ${reveal ? 'is-revealing' : ''}`} aria-label={`${data.length}行、${data[0].length}列色块矩阵，中间维度省略`}>{data.flatMap((row, r) => cols.map((c, j) => c === null ? <span shuku-edit-id="e-dcca8fd7-d803-47ae-bfd9-1d28eddc3b11" className="tr-ma-dots" key={`${r}-${j}`}>···</span> : <i shuku-edit-id="e-59345468-b82b-4bf6-b817-3ea467ccd76a" key={`${r}-${j}`} style={{ background: color, opacity: .18 + Math.min(1, Math.abs(row[c])) * .78, '--reveal-delay': `${r * 330 + j * 65}ms` } as CSSProperties}/>))}</div>;
}
function HeadOutput({ head, label = true }: {
    head: number;
    label?: boolean;
}) {
    return <div shuku-edit-id="e-aa8f2364-8e5c-4926-8948-50b456c484b5" className="tr-ma-head-output" style={{ '--head-color': HEAD_COLORS[head] } as CSSProperties}>{label && <div shuku-edit-id="e-7c937dcd-8d8b-427b-bb7e-690913627e3a" className="tr-ma-output-heading"><b shuku-edit-id="e-bb631cbe-04ae-4b95-97b8-50e5433f8586">H<sub shuku-edit-id="e-d5a4331d-9912-4cf5-9528-157a396b7e1e">{head + 1}</sub></b><span shuku-edit-id="e-c2365f90-c6a2-4e6b-a79b-31b4b359c20e">6 × 64</span></div>}<ColorMatrix data={HEADS[head].output} color={HEAD_COLORS[head]}/></div>;
}
function WeightMatrix() {
    return <div shuku-edit-id="e-7a856206-1b67-41be-8364-33eb8db9f0cd" className="tr-ma-weight-matrix" aria-label="第一头的6乘6注意力权重矩阵">{HEADS[0].weights.flatMap((row, r) => row.map((a, c) => <span shuku-edit-id="e-c2fad38b-c510-44d7-b26b-faf66ccb4049" key={`${r}-${c}`}><i shuku-edit-id="e-f709dd6c-bd98-4499-b551-df507a778b01" style={{ width: Math.sqrt(a) * 52, height: Math.sqrt(a) * 52 }}/></span>))}</div>;
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
    return <section shuku-edit-id="e-5f8b88eb-1582-4024-b058-f30643484265" className={`tr-ma-page is-page-${page}`} aria-labelledby="tr-ma-title">
    <header shuku-edit-id="e-eb77afe8-574e-4531-b3d4-23247ebab3f7" className="tr-lesson-header"><h1 shuku-edit-id="e-d3fedddf-2254-48d5-adce-94a606ca0293" id="tr-ma-title">{page === 1 ? '多头注意力：把 Q、K、V 拆成 8 个头' : page === 2 ? '看第 1 头，怎样独立完成计算' : '8 个头的结果，怎样拼接与融合？'}</h1><p shuku-edit-id="e-1eadbf4a-2631-4b2b-bb09-6ce5712a0175">{page === 1 ? !split ? '点击下方拆分按钮，观察 512 维怎样按列分成 8 组。' : '对照拆分前后的形状，找出每个头的 Q、K、V。' : page === 2 ? '沿箭头从左向右看：先匹配、转成权重，再汇聚 V。' : !concat ? '点击下方按钮，观察 8 份输出怎样按列拼接。' : !compact ? '对照拼接后的维度，再点击下方按钮，观察输出投影。' : '对照投影前后：矩阵形状是否改变，信息怎样重新组合？'}</p></header>
    <main shuku-edit-id="e-bdfc5133-3e88-4ef4-8107-936e1868c4aa" className="tr-ma-canvas">
      {page === 1 && <>
        <div shuku-edit-id="e-b1ddc708-2d7f-4dff-8986-c3f49a8bdac1" className="tr-ma-shared-dimension">{split ? '每头的 Q、K、V：6 × 64' : 'Q、K、V 矩阵：6 × 512'}</div>
        <div shuku-edit-id="e-437e54a9-c281-4e3e-ba76-1f06dc549dd4" className={`tr-ma-split-stage ${split ? 'is-split' : ''}`}>
          <div shuku-edit-id="e-f36dee3e-f1ea-40be-b622-ad0fef3cfdf0" className="tr-ma-head-numbers">{HEADS.map((_, h) => <b shuku-edit-id="e-dbf1e074-39ba-4588-986d-b433d7dcdfcf" key={h}>第 {h + 1} 头</b>)}</div>
          {ROLE_NAMES.map((name, role) => <div shuku-edit-id="e-b9028e2d-eca3-49a7-b958-c29b49f7fe6b" className="tr-ma-role-row" key={name}><b shuku-edit-id="e-8b7727f4-114f-4d8f-b6b3-1192c113160d" style={{ color: TONES[role] }}>{name}</b><div shuku-edit-id="e-6b26a486-223f-4f51-88f6-e10002ad4d3c" className="tr-ma-role-blocks">{HEADS.map((head, h) => <div shuku-edit-id="e-63c33642-a266-419f-b17e-9cc10c81d840" className="tr-ma-role-piece" key={h}><ColorMatrix data={[head.q, head.k, head.v][role]} color={TONES[role]}/></div>)}</div></div>)}
        </div>
        <div shuku-edit-id="e-70af7a74-a296-4d53-8f7f-ccc01fde52e7" className={`tr-ma-expert-band ${splitReady ? 'is-visible' : ''}`}><div shuku-edit-id="e-35aa8df2-751d-429f-b1ed-962a0fd207fe" className="tr-ma-experts">{HEADS.map((_, h) => <Expert key={h} head={h} question/>)}</div><aside shuku-edit-id="e-e4436224-830f-4104-81f3-b2ba58e50214"><strong shuku-edit-id="e-05bc757e-b222-46bd-a692-2376bd1d3ca7">不同专家</strong><span shuku-edit-id="e-faeec03f-2f5f-44bd-bb87-3515204b5516">各自学习一套权重</span><span shuku-edit-id="e-4142b87e-9b02-4cd5-9962-080aab896022">同时关注不同关系</span><b shuku-edit-id="e-0de0b5e3-aec7-4cb4-a714-6981f6608e04">让上下文表示更丰富</b></aside></div>
      </>}
      {page === 2 && <>
        <section shuku-edit-id="e-fac7b672-21bd-473b-af4c-abbf135fe3f1" className="tr-ma-first-head"><div shuku-edit-id="e-7cb331f2-a7cc-4304-9740-3ca72ad23091" className="tr-ma-first-label"><b shuku-edit-id="e-d36f5360-6a9e-468e-8c9a-0f2debe2a302">第 1 头</b><span shuku-edit-id="e-ce80bf66-e82f-4b0c-a4fb-d4b670a6c7eb">Q、K、V：6 × 64</span></div>{ROLE_NAMES.map((name, r) => <div shuku-edit-id="e-11019479-bc22-417b-a656-2726da62671c" className="tr-ma-first-role" key={name}><strong shuku-edit-id="e-f73cd9d3-35cb-4890-8eed-aad7811a4ced" style={{ color: TONES[r] }}>{name}<sub shuku-edit-id="e-97be514a-e399-448c-9a99-1b200e5d36f0">1</sub></strong><ColorMatrix data={[HEADS[0].q, HEADS[0].k, HEADS[0].v][r]} color={TONES[r]}/></div>)}<Expert head={0} question/></section>
        <svg shuku-edit-id="e-493452ab-6aa7-4d21-a634-a906947f3ae9" className="tr-ma-calculation-wires" viewBox="0 0 1520 658" preserveAspectRatio="none" aria-hidden="true"><defs shuku-edit-id="e-e0df7e31-58ae-4703-80c1-d41bf1360910"><marker shuku-edit-id="e-3a8dccad-c5a9-4bdc-8eb7-39f6ff0f629d" id="tr-ma-arrow" markerUnits="userSpaceOnUse" viewBox="0 0 12 12" markerWidth="12" markerHeight="12" refX="10.5" refY="6" orient="auto"><path shuku-edit-id="e-478724bf-a184-4a3a-a49b-f105b1ee70ff" d="M1 1 10.5 6 1 11Z" fill="#739aae"/></marker></defs><path shuku-edit-id="e-0e810763-4e11-4e16-b623-14e8613a0c92" className="is-input-branch" d="M294 139H322Q334 139 334 151V173Q334 185 346 185"/><path shuku-edit-id="e-68fff287-ac18-4ba9-aeb9-cd9996e0d7b1" className="is-input-branch" d="M294 246H322Q334 246 334 234V197Q334 185 346 185"/><path shuku-edit-id="e-65087a94-fd0d-4020-8902-9f11be7f966a" d="M346 185H700"/><path shuku-edit-id="e-778836b6-c29c-4336-9435-71b3d040536a" className="is-value-wire" d="M294 353H420Q434 353 434 367V486Q434 500 448 500H1210"/><path shuku-edit-id="e-ccc62c33-fc70-4e36-bad3-7996a1f38ed1" d="M1000 295H1080Q1094 295 1094 309V331Q1094 345 1108 345H1210"/></svg>
        <div shuku-edit-id="e-6d679bb8-b66a-47bf-86c5-b2ddb13d3c27" className="tr-ma-match-formula"><span shuku-edit-id="e-12c15405-ff69-4130-a4c0-77566c3c133f">A<sub shuku-edit-id="e-a9d55704-0a65-43c2-9c2c-b7f62b4a57c5">1</sub> = Softmax(</span><span shuku-edit-id="e-9944eb7c-36bf-4b8e-a2df-2946a57ef868" className="tr-ma-fraction"><span shuku-edit-id="e-ace134de-e2aa-413e-97c5-ada0ba29cf34">Q<sub shuku-edit-id="e-2cc043a8-8328-4452-a408-0a6726a252ef">1</sub>K<sub shuku-edit-id="e-d1228a52-772c-4ef4-8218-d7b7e5f2d8fb">1</sub><sup shuku-edit-id="e-033c06eb-16b7-4135-836a-a7471cba3b51">T</sup></span><span shuku-edit-id="e-20cd8f88-dad1-4e17-b1e3-0fb4fd34eb10">√64</span></span><span shuku-edit-id="e-b69d2fed-eaea-4830-8c46-fab5ade0b500">)</span></div>
        <section shuku-edit-id="e-0d094203-57a0-4966-9745-a2cbb72ab87b" className="tr-ma-first-weights"><h2 shuku-edit-id="e-9461a5c0-4f24-4478-a86a-0423fde5c047">A<sub shuku-edit-id="e-8e4dcde0-0f72-4a4a-a296-9fc7e374906f">1</sub> · 注意力权重</h2><span shuku-edit-id="e-1bdafd34-23e2-403e-ad37-c91f1596b12e">6 × 6</span><WeightMatrix /></section>
        <div shuku-edit-id="e-43885187-303e-4f34-ad12-b4f349f0f5d4" className="tr-ma-value-formula">H<sub shuku-edit-id="e-dc752868-c2c5-4a2a-ad24-54fc716ef606">1</sub> = A<sub shuku-edit-id="e-a91dcb0d-a64a-42f8-ab3c-8ba30b4c8206">1</sub>V<sub shuku-edit-id="e-94b641d4-6be9-44c3-a4eb-ad5a326ea70d">1</sub></div>
        <section shuku-edit-id="e-6641e1f2-f87f-47f2-a96f-60a8fca1f1c8" className="tr-ma-first-result"><HeadOutput head={0}/><p shuku-edit-id="e-79c68c85-de13-4dd7-9950-eb33999e1480">第 1 头的输出</p></section>
        <div shuku-edit-id="e-16ed75ae-78ad-4439-ac11-4a327810a750" className="tr-ma-compute-explanation">各头都执行同样的计算，但使用各自的 Q、K、V。</div>
      </>}
      {page === 3 && <>
        <div shuku-edit-id="e-30d5b7cf-86d3-4a93-bac1-12a749940291" className={`tr-ma-outputs-stage is-${phase} ${arrived ? 'has-arrived' : ''} ${concat ? 'is-concat' : ''} ${compact ? 'is-compact' : ''}`}>
          <div shuku-edit-id="e-5d3fcc16-0669-417f-8815-41dc6abb12d8" className="tr-ma-output-enclosure"/>
          {HEADS.map((_, h) => {
                const slot = h;
                return <div shuku-edit-id="e-b01dc1cf-5e81-4e36-8ab1-c6e2d1d95bfa" className={`tr-ma-output-piece is-head-${h} ${h === 0 ? 'is-first' : ''}`} key={h} style={{ '--slot': slot, '--appear-delay': `${h * 90}ms` } as CSSProperties}><HeadOutput head={h}/></div>;
            })}
          <div shuku-edit-id="e-87732cc7-1f33-4911-9d24-92a4695c1c8f" className="tr-ma-concat-label">H<sub shuku-edit-id="e-46916c0e-277c-4c2f-bd56-91489e859a83">cat</sub> = Concat(H<sub shuku-edit-id="e-de00b881-1c99-449e-8caf-df1d306d8cdf">1</sub>, …, H<sub shuku-edit-id="e-97a9a820-9e83-4f1f-98d2-7867b26a61d8">8</sub>)<span shuku-edit-id="e-ec793ef6-0ef6-4743-a2e6-4f522776a625">6 × 512</span></div>
        </div>
        <div shuku-edit-id="e-e9db2c52-7770-41e2-8d50-263e2ea58f9f" className={`tr-ma-parallel-note ${phase === 'all' ? 'is-visible' : ''}`}>这 8 个头<strong shuku-edit-id="e-261cd4f6-5a65-480b-8a1b-9bb0554ef045">同时计算</strong>，各自产生一份 6 × 64 的输出。</div>
        <div shuku-edit-id="e-00d50629-4f02-40f9-9e0b-1a94fd3dee60" className={`tr-ma-projection ${compact ? 'is-visible' : ''}`}><span shuku-edit-id="e-41a06bd9-31b8-439b-8350-e849766324d3" className="tr-ma-product-sign">×</span><div shuku-edit-id="e-cc80c831-6d55-4d0e-8bee-1db0891f2e6a" className="tr-ma-wo"><h2 shuku-edit-id="e-76aa7640-678e-4eae-b693-3306e358ff0e">W<sub shuku-edit-id="e-96c35379-4aad-405a-bd22-6b4c76fdf53b">O</sub></h2><ColorMatrix data={Array.from({ length: 6 }, (_, r) => Array.from({ length: 64 }, (_, c) => outputParameter([0, 1, 2, 509, 510, 511][r], c === 63 ? 511 : c)))} color="#bd9a67"/><span shuku-edit-id="e-fba015f5-c23b-4518-8e1d-e22d8706696b">512 × 512</span></div><span shuku-edit-id="e-c2919aeb-1b30-4b21-90bc-2b77efcccb26" className="tr-ma-product-sign">=</span><div shuku-edit-id="e-16a7c89f-a5a5-4e62-985b-c41c6119f37e" className="tr-ma-final-output"><h2 shuku-edit-id="e-4149e555-f903-4596-a5c4-c0619e6c62ce">输出 Y</h2><ColorMatrix data={MULTI_HEAD_OUTPUT} color="#709caa" wide reveal={phase === 'projecting'}/><span shuku-edit-id="e-8715d6d4-2aff-4682-8f04-5da1afc90b28">6 × 512</span></div></div>
        <div shuku-edit-id="e-bca15035-dd04-4b1e-ba38-c203f3464dc3" className="tr-ma-concat-explanation">{compact ? <>W<sub shuku-edit-id="e-b195f4b2-a0bb-40a1-84f6-cc1703ad09b0">O</sub> 是<strong shuku-edit-id="e-67f0b80b-820f-4cae-9bf7-bd6262601a56">训练中学到的输出投影矩阵</strong>，用来融合各头的信息。</> : concat ? <><strong shuku-edit-id="e-e98abf1f-679d-435b-813c-9d431d59b157">只按列拼接，不改变各头的数值。</strong>8 × 64 = 512。</> : phase === 'all' ? '接下来，怎样把这 8 份结果放到一起？' : '承接第 1 头的输出 H₁'}</div>
      </>}
    </main>
    <footer shuku-edit-id="e-303df243-94b2-49ea-a04c-08cec36e001a"><p shuku-edit-id="e-c167308f-cb49-4640-9a7f-74edac58a86d">{page === 1 ? '问题只是教学比喻，帮助理解；不预设各头实际学到的职责。' : page === 2 ? '矩阵与关注模式为给定教学示例，计算遵循注意力公式。' : '拼接保留各头的数值；输出变换 WО 的参数通过训练学得。'}</p><div shuku-edit-id="e-6e2f5f3a-3f7f-44d8-bce4-197fdebf56ba"><button shuku-edit-id="e-e614170f-833c-4927-a9ae-65a420543b76" type="button" className="is-secondary" onClick={reset}>重播</button><button shuku-edit-id="e-d2aa7ceb-ac08-4fb8-8756-b9ad4d832de4" type="button" disabled={page === 1 && split && !splitReady || page === 3 && (phase === 'arriving' || phase === 'projecting')} onClick={forward}>{page === 1 ? split ? '继续：看一个头怎样计算 →' : '拆分成多头 →' : page === 2 ? '继续：看其他头的输出 →' : phase === 'all' ? '怎么拼接呢？' : phase === 'concat' ? '乘 WО，融合信息 →' : phase === 'projecting' ? '正在融合…' : phase === 'projected' ? '继续 →' : '正在展开八头输出…'}</button></div></footer>
  </section>;
}
