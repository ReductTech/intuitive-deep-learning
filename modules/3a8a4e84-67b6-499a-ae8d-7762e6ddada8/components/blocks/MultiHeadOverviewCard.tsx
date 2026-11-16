import { HEADS, HEAD_COLORS, MULTI_HEAD_OUTPUT, outputParameter } from '../../domain/multiHeadExample';
import { INPUTS } from '../../domain/attentionMatrixExample';
import './MultiHeadOverviewCard.css';
function Blocks({ data, color }: {
    data: number[][];
    color: string;
}) {
    const cols = [0, 1, data[0].length - 2, data[0].length - 1];
    return <div shuku-edit-id="e-4c74956c-71ac-49b1-b604-59e166c82670" className="tr-mo-blocks">{data.map((row, r) => cols.map((c, i) => <i shuku-edit-id="e-3233e33c-cb17-4f5c-9417-723157f4cca3" key={`${r}-${i}`} style={{ background: color, opacity: .2 + Math.min(Math.abs(row[c]), 1) * .8 }}/>))}</div>;
}
function Joined() {
    return <div shuku-edit-id="e-46b3d61e-f187-4fb1-a3c6-658a8732db07" className="tr-mo-joined" aria-label="8个头按列拼接，6行512列">{HEADS.map((head, h) => <Blocks key={h} data={head.output} color={HEAD_COLORS[h]}/>)}</div>;
}
export function MultiHeadOverviewCard({ onComplete }: {
    onComplete: () => void;
}) {
    const projection = Array.from({ length: 6 }, (_, r) => [0, 1, 510, 511].map(c => outputParameter([0, 1, 2, 509, 510, 511][r], c)));
    return <section shuku-edit-id="e-f30ae8e4-2a1f-488b-85e2-e0c3aba86d76" className="tr-mo-page">
    <header shuku-edit-id="e-fe632f5b-64a5-41bf-aae4-bf0708a0ce3d" className="tr-lesson-header"><h1 shuku-edit-id="e-ddf5c8b0-84e5-4bc2-b481-dca21c6413b0">多头注意力：完整流程</h1><p shuku-edit-id="e-17455ca6-eec8-4e57-89f6-caf40cacbbaf">沿箭头回看完整流程，核对拆分、拼接和投影前后的矩阵形状。</p></header>
    <main shuku-edit-id="e-ee41dca5-0164-487b-9432-23349073644f" className="tr-mo-canvas is-full-pipeline">
      <div shuku-edit-id="e-71abeab3-dd5b-456e-b125-443310c0063f" className="tr-mo-pipeline">
        <section shuku-edit-id="e-c6631627-b090-418e-9564-f933c3b37601" className="tr-mo-node tr-mo-source"><h2 shuku-edit-id="e-92179b98-5242-408e-b872-8f09cac63969">输入 X</h2><Blocks data={INPUTS} color="#6a9fae"/><span shuku-edit-id="e-57d710fc-5210-4668-ba6a-15562e7ba03a">6 × 512</span></section>
        <b shuku-edit-id="e-eaa0785c-9927-44e0-b9b9-d8d192412eff" className="tr-mo-arrow">→</b>
        <section shuku-edit-id="e-611d7548-209a-4755-b19b-a0d9e3cc30c2" className="tr-mo-project-stage"><h2 shuku-edit-id="e-40a26d44-6a3b-45da-813a-10cf2059c3cc">生成 Q、K、V</h2>{['Q', 'K', 'V'].map((role, r) => <div shuku-edit-id="e-47e70c05-5a13-4fd1-968a-96c8e2acae3d" className="tr-mo-project-role" key={role}><strong shuku-edit-id="e-59d5d324-7285-44ed-93a4-75e96cf02434" style={{ color: ['#c88d68', '#4a9ca6', '#748eb8'][r] }}>{role} = XW<sub shuku-edit-id="e-a555e3b0-8d16-4cb3-9ec7-d79fead8b676">{role}</sub></strong><span shuku-edit-id="e-f2dc82e9-6e7a-4085-a2cc-51ea2c0b5d81">6 × 512</span><div shuku-edit-id="e-c11a5e98-7e56-401d-9e25-7dc524d2f665" className="tr-mo-role-strip">{HEADS.map((head, h) => <div shuku-edit-id="e-28c03470-871b-490f-8e01-99597ac99d3b" key={h}><Blocks data={[head.q, head.k, head.v][r]} color={['#cf916b', '#4d9fa6', '#788fba'][r]}/></div>)}</div></div>)}<p shuku-edit-id="e-9436e4dc-0b92-4dda-98b7-23c010db5594">W<sub shuku-edit-id="e-953b44b3-6671-4063-ad23-f63bfa3ff334">Q</sub>、W<sub shuku-edit-id="e-902d3952-75e2-49b7-a1cc-80afd86aa300">K</sub>、W<sub shuku-edit-id="e-1fa4d9ef-a237-488b-a428-194d1c05bb85">V</sub><br shuku-edit-id="e-8967f3de-eb2c-4507-9de2-b5d83f5300b4" />均为 512 × 512</p></section>
        <div shuku-edit-id="e-1645160c-bbf9-4b86-aa3d-5683cc9bb8e6" className="tr-mo-split-arrow"><span shuku-edit-id="e-da429562-3c83-42c3-ace8-f26f6a82e0cd">按列<br shuku-edit-id="e-210de047-722a-457f-9d4e-44b161273a67" />拆分</span><b shuku-edit-id="e-fefbec3c-ba95-49fd-98a5-6c708b8380bb" className="tr-mo-arrow">→</b></div>
        <section shuku-edit-id="e-ecf477c4-eea2-434f-b785-8954c44e4ea6" className="tr-mo-head-stage is-simplified"><h2 shuku-edit-id="e-7dfca962-d8cb-4535-a2e7-8fc3602a6f50">8 个头并行计算</h2><span shuku-edit-id="e-d452b8ef-5499-4f39-8dc3-9fefb870e1a7" className="tr-mo-shared-head-dim">每头 Q、K、V：6 × 64</span><div shuku-edit-id="e-7dafcdac-44b9-4f4e-a72e-336ef705c05c" className="tr-mo-eight-grid">{HEADS.map((head, h) => <article shuku-edit-id="e-3bb73b6d-847b-46e3-93b2-15b428602d0f" key={h} style={{ borderTopColor: HEAD_COLORS[h] }}><strong shuku-edit-id="e-ea01ba33-c998-4a91-bef7-626963d351a7" style={{ color: HEAD_COLORS[h] }}>第 {h + 1} 头</strong><div shuku-edit-id="e-1e54d740-afd5-41fe-9469-00fd21a5d62b" className="tr-mo-mini-output"><b shuku-edit-id="e-514baa2c-c728-4829-89b4-4294f67e992a" style={{ color: HEAD_COLORS[h] }}>H<sub shuku-edit-id="e-cbe9f468-6469-4e8c-ba18-17622ff103a0">{h + 1}</sub></b><Blocks data={head.output} color={HEAD_COLORS[h]}/></div></article>)}</div><span shuku-edit-id="e-6900a17e-93f7-4749-a6a1-0aae6697885a" className="tr-mo-head-result-dim">每头输出：6 × 64</span></section>
        <b shuku-edit-id="e-3b2dde59-9021-41a0-b794-cbe29b65e41c" className="tr-mo-arrow">→</b>
        <section shuku-edit-id="e-e68f928d-a069-4fa7-93d0-2510e43afce0" className="tr-mo-node tr-mo-join-node"><h2 shuku-edit-id="e-b0749314-5e41-4deb-9020-df514bd9e5db">按列拼接</h2><strong shuku-edit-id="e-1aa72d9e-e2db-4418-8216-82420538b2f3">H<sub shuku-edit-id="e-76d164b5-a021-4c67-a744-e97c2fbd1637">1</sub> … H<sub shuku-edit-id="e-6a5584d3-b4ef-4f6c-8ee9-6b201fddee83">8</sub></strong><Joined /><span shuku-edit-id="e-ec2b09df-ee4c-4952-94fc-428d20e4a01d">6 × 512</span><p shuku-edit-id="e-b344c25a-fafb-46d9-99cd-1cbba81dbb93">8 × 64 = 512</p></section>
        <b shuku-edit-id="e-40fcc5db-0f1f-4409-951e-a127c5824922" className="tr-mo-arrow">→</b>
        <section shuku-edit-id="e-913199fe-d465-494a-aca4-154458a5da4f" className="tr-mo-node tr-mo-wo-node"><h2 shuku-edit-id="e-55cdb34d-fc3f-41a3-a588-23609fccaaae">输出投影</h2><strong shuku-edit-id="e-abd6ca7d-4c44-47ef-9fa8-c5af42a29123">× W<sub shuku-edit-id="e-c20bfcdd-22c1-4bc2-a18a-7f3a4f1b61d2">O</sub></strong><Blocks data={projection} color="#b89a6f"/><span shuku-edit-id="e-99b90833-7443-4f9e-b235-77c0356dd210">512 × 512</span></section>
        <b shuku-edit-id="e-c0f216ca-4b23-48fb-8b85-b750edafac25" className="tr-mo-arrow">→</b>
        <section shuku-edit-id="e-0c001fa5-735e-4571-8777-a42cc3f2822e" className="tr-mo-node tr-mo-y-node"><h2 shuku-edit-id="e-88dc7fc5-d801-499c-83db-607521e9ce33">输出 Y</h2><Blocks data={MULTI_HEAD_OUTPUT} color="#5e99a5"/><span shuku-edit-id="e-8a3454ad-ce53-4b43-a740-48c5df9b8b12">6 × 512</span></section>
      </div>
      <div shuku-edit-id="e-921798d0-10fa-44b3-b0eb-c2412868ce0e" className="tr-mo-complete-formulas"><span shuku-edit-id="e-fe826317-b658-4a22-b3df-fc219fb1dcdb">每个头：H<sub shuku-edit-id="e-ee8da036-633c-41b6-a3f8-7e3138707dc5">i</sub> = Softmax(Q<sub shuku-edit-id="e-5acfb51f-ab35-4054-8c9b-a2ac3874b319">i</sub>K<sub shuku-edit-id="e-3836d194-27d4-422f-9671-12955e8734e8">i</sub><sup shuku-edit-id="e-f5e15db4-5612-479d-bad7-cfc6328a0d93">T</sup> / √64)V<sub shuku-edit-id="e-18fb1916-8ce2-4c73-b6ac-b169332617d7">i</sub></span><span shuku-edit-id="e-6c94dc4e-8bfa-4671-aecd-513e926c3fad">最终输出：Y = Concat(H<sub shuku-edit-id="e-96440e1e-6a38-4a47-abed-73329c6c0b0c">1</sub>, …, H<sub shuku-edit-id="e-0cbb93a8-797a-474a-b634-bd94dc9cfa53">8</sub>)W<sub shuku-edit-id="e-a342c6a3-7af5-45aa-bffa-cc2dbb87d32f">O</sub></span></div>
    </main>
    <footer shuku-edit-id="e-e85d9351-0fed-4c7b-a139-bca477a98209"><button shuku-edit-id="e-0c63c768-4e28-40ed-b77d-7098e0218143" onClick={onComplete}>继续：模型知道词序吗？ →</button></footer>
  </section>;
}
