import { MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './MLASummaryPage.css';

// DeepSeek-V2 §2.1.2–2.1.3: https://arxiv.org/html/2405.04434v5
// Matrix sizes here are schematic, not measured memory or speed ratios.
function Matrix({ columns = 8, color = 'latent' }: { columns?: number; color?: string }) {
  return <div shuku-edit-id="e-428537b2-ba56-4fcf-82f2-59c9acca2a9c" className={`mlas-matrix mlas-color--${color}`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, width: columns * 17 }} aria-hidden="true">
    {Array.from({ length: columns * 6 }, (_, index) => <span shuku-edit-id="e-7a3010cb-881d-4d65-a45e-dc0059d238b6" key={index} />)}
  </div>;
}

function Arrow() {
  return <svg shuku-edit-id="e-61e5e951-3d3d-4861-9269-0cad417b205a" className="mlas-arrow" viewBox="0 0 70 32" aria-hidden="true"><path shuku-edit-id="e-78998f44-afc6-487d-afe6-030670b11d32" d="M3 16H63 M52 5L63 16L52 27" /></svg>;
}

function AbsorptionRow({ absorbed = false }: { absorbed?: boolean }) {
  return <div shuku-edit-id="e-052a8630-a5eb-43c0-8fce-0adc96016244" className="mlas-absorption-row">
    <Typography shuku-edit-id="e-4ad8384f-f3eb-4d6c-9bce-355d7e4cb04a" as="p" variant="body" tone="muted">{absorbed ? '吸收后' : '吸收前'}</Typography>
    <div shuku-edit-id="e-fcf31956-4db8-4225-9d4c-afe5a5b9b354" className="mlas-absorption-chain">
      <div shuku-edit-id="e-276ce54a-19e9-4495-ad37-39abf7714f2a" className="mlas-object"><Typography shuku-edit-id="e-1ae1932c-0d91-4a65-a1c0-75ef8449d25d" as="span" variant="body"><MathFormulaStatic latex="C^{KV}" /></Typography><Matrix columns={2} /></div>
      <Arrow />
      {absorbed ? <div shuku-edit-id="e-d6559268-6578-4b8c-bad9-e7a6c4927674" className="mlas-omitted"><Typography shuku-edit-id="e-0f05e34e-617d-4312-bb16-176c02f9440a" as="strong" variant="h3" tone="inherit">省去</Typography></div> : <div shuku-edit-id="e-086c7891-5241-4d51-aee6-87f9addcbf36" className="mlas-expanded">
        <Typography shuku-edit-id="e-8ae0b677-cdce-4a40-a479-20b4f04fc431" as="span" variant="body" tone="danger">展开 K、V</Typography>
        <div shuku-edit-id="e-380983db-87a8-44af-b50f-fb465deb84c0" className="mlas-expanded-matrices"><Matrix columns={4} color="k" /><Matrix columns={4} color="v" /></div>
      </div>}
      <Arrow />
      <Typography shuku-edit-id="e-da016e00-460c-41ff-b566-31adb2be8811" as="span" variant="body" className="mlas-compute-label">计算</Typography>
    </div>
  </div>;
}

export function MLASummaryPage() {
  return <section shuku-edit-id="e-db8f65be-2575-4950-ae25-9d3c321623ff" className="mlas-slide" aria-label="MLA 总结：低秩压缩、矩阵吸收与解耦 RoPE">
    <Typography shuku-edit-id="e-499b3951-af9b-442d-94fb-6e075836dcef" as="h1" variant="display" align="center">MLA 的三个关键优势</Typography>
    <main shuku-edit-id="e-936a845f-0c41-49e2-9103-f1f0d4784682" className="mlas-columns">
      <section shuku-edit-id="e-445824ac-9df3-4cc2-8ad0-d8526451ea9f" className="mlas-column">
        <Typography shuku-edit-id="e-d3dd0a11-d1a2-4265-8388-636a8166215b" as="h2" variant="h1" align="center">低秩压缩</Typography>
        <div shuku-edit-id="e-ec3c48ac-469c-4161-b292-7a7b2d9c4b43" className="mlas-diagram mlas-compression" role="img" aria-label="不缓存完整内容 K、V，改为缓存共享的低维潜在矩阵">
          <div shuku-edit-id="e-f60bc96a-ede4-47bd-b0c8-e6a8eea74f54" className="mlas-kv"><div shuku-edit-id="e-69507764-3d88-48b6-9a07-344f46a4e2b4" className="mlas-object"><Typography shuku-edit-id="e-e3205be5-52b3-43f7-8f9b-eb2f5a0ddef3" as="span" variant="h3">K</Typography><Matrix color="k" /></div><div shuku-edit-id="e-707a9f84-7e58-4e0a-975c-c44404e75fe6" className="mlas-object"><Typography shuku-edit-id="e-29def45e-fba8-4c21-9259-f240042aee77" as="span" variant="h3">V</Typography><Matrix color="v" /></div></div>
          <Arrow />
          <div shuku-edit-id="e-b9a022c5-83a5-4260-8a63-6d984d14cbaa" className="mlas-object"><Typography shuku-edit-id="e-e2eb32e4-a256-4722-8069-cb9ffb929cc4" as="span" variant="h3"><MathFormulaStatic latex="C^{KV}" /></Typography><Matrix columns={2} /></div>
        </div>
        <Typography shuku-edit-id="e-381e41c7-e017-483f-a186-e507369d4a76" as="h3" variant="h2" align="center">减少缓存显存</Typography>
      </section>
      <section shuku-edit-id="e-a8fb5cd6-2e11-4256-9acc-e285916ad8a5" className="mlas-column">
        <Typography shuku-edit-id="e-8a2b2d73-f167-475c-9275-d46e1966c356" as="h2" variant="h1" align="center">矩阵吸收</Typography>
        <div shuku-edit-id="e-59f3ca82-d72c-461b-8085-42dfa7f709c0" className="mlas-diagram mlas-absorption" role="img" aria-label="吸收前先将潜在缓存展开成历史 K、V 再计算；吸收后省去展开，直接参与调整后的计算">
          <AbsorptionRow />
          <AbsorptionRow absorbed />
        </div>
        <Typography shuku-edit-id="e-723752c0-0d94-4283-a2ff-a1b37d3c4ac5" as="h3" variant="h2" align="center">不再展开历史 K、V</Typography>
      </section>
      <section shuku-edit-id="e-20e7ed5d-cfa8-44c6-bd75-170941818cce" className="mlas-column">
        <Typography shuku-edit-id="e-22361f1c-644a-4fb2-a4ba-89876f8b2d9b" as="h2" variant="h1" align="center">解耦 RoPE</Typography>
        <div shuku-edit-id="e-a28aac09-ddc4-4f85-9dc9-89ef9cf6d1c3" className="mlas-diagram mlas-decoupled" role="img" aria-label="内容分支继续矩阵吸收，短位置分支使用 RoPE，两部分分数相加">
          <div shuku-edit-id="e-34f47670-f491-4c12-ac1a-c6e53ee5973e" className="mlas-branches"><div shuku-edit-id="e-cdd23d6f-b9dc-4b86-8ae4-e8b33e605c14"><span shuku-edit-id="e-84a05fa7-cd80-4bdd-8460-7189000fc528" className="mlas-content-band" /><Typography shuku-edit-id="e-89de3908-0347-4b93-99c5-d9f7b33094c4" as="span" variant="body">内容：吸收</Typography></div><div shuku-edit-id="e-19c11aeb-af4f-45c6-95b7-e8426fbd04c5"><span shuku-edit-id="e-29b7ac2f-020e-48ca-8ad1-f6735021bba5" className="mlas-position-band" /><Typography shuku-edit-id="e-d4b9ef3b-1e72-4f85-80d5-b8be3fafc5d6" as="span" variant="body">位置：旋转</Typography></div></div>
          <Typography shuku-edit-id="e-be87e2f9-ad42-4128-aa8c-8cc62f2db973" as="span" variant="h2"><MathFormulaStatic latex="S=S^C+S^R" /></Typography>
        </div>
        <Typography shuku-edit-id="e-a52a7993-0d18-458d-adb9-02992bbcd386" as="h3" variant="h2" align="center">保留位置，兼容内容吸收</Typography>
      </section>
    </main>
    <footer shuku-edit-id="e-0049a689-74fc-416c-85ba-623b2084c99d" className="mlas-footer"><Typography shuku-edit-id="e-26521163-e5ce-4e7a-b65e-0b8ebf7b005b" as="p" variant="h2" align="center">最终缓存：<span shuku-edit-id="e-12f1fccd-659e-4c33-997a-396e0d8870f4" className="mlas-latent-copy"><MathFormulaStatic latex="C^{KV}" /></span> + <span shuku-edit-id="e-e0649fae-a8f4-4548-b363-96b6341d4c07" className="mlas-position-copy"><MathFormulaStatic latex="K^R" /></span></Typography></footer>
  </section>;
}
