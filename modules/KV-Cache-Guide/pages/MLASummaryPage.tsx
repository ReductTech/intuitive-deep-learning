import { MathFormulaStatic, Typography } from '../../shared/react';
import './MLASummaryPage.css';

// DeepSeek-V2 §2.1.2–2.1.3: https://arxiv.org/html/2405.04434v5
// Matrix sizes here are schematic, not measured memory or speed ratios.
function Matrix({ columns = 8, color = 'latent' }: { columns?: number; color?: string }) {
  return <div className={`mlas-matrix mlas-color--${color}`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, width: columns * 17 }} aria-hidden="true">
    {Array.from({ length: columns * 6 }, (_, index) => <span key={index} />)}
  </div>;
}

function Arrow() {
  return <svg className="mlas-arrow" viewBox="0 0 70 32" aria-hidden="true"><path d="M3 16H63 M52 5L63 16L52 27" /></svg>;
}

function AbsorptionRow({ absorbed = false }: { absorbed?: boolean }) {
  return <div className="mlas-absorption-row">
    <Typography as="p" variant="body" tone="muted">{absorbed ? '吸收后' : '吸收前'}</Typography>
    <div className="mlas-absorption-chain">
      <div className="mlas-object"><Typography as="span" variant="body"><MathFormulaStatic latex="C^{KV}" /></Typography><Matrix columns={2} /></div>
      <Arrow />
      {absorbed ? <div className="mlas-omitted"><Typography as="strong" variant="h3" tone="inherit">省去</Typography></div> : <div className="mlas-expanded">
        <Typography as="span" variant="body" tone="danger">展开 K、V</Typography>
        <div className="mlas-expanded-matrices"><Matrix columns={4} color="k" /><Matrix columns={4} color="v" /></div>
      </div>}
      <Arrow />
      <Typography as="span" variant="body" className="mlas-compute-label">计算</Typography>
    </div>
  </div>;
}

export function MLASummaryPage() {
  return <section className="mlas-slide" aria-label="MLA 总结：低秩压缩、矩阵吸收与解耦 RoPE">
    <Typography as="h1" variant="display" align="center">MLA 的三个关键优势</Typography>
    <main className="mlas-columns">
      <section className="mlas-column">
        <Typography as="h2" variant="h1" align="center">低秩压缩</Typography>
        <div className="mlas-diagram mlas-compression" role="img" aria-label="不缓存完整内容 K、V，改为缓存共享的低维潜在矩阵">
          <div className="mlas-kv"><div className="mlas-object"><Typography as="span" variant="h3">K</Typography><Matrix color="k" /></div><div className="mlas-object"><Typography as="span" variant="h3">V</Typography><Matrix color="v" /></div></div>
          <Arrow />
          <div className="mlas-object"><Typography as="span" variant="h3"><MathFormulaStatic latex="C^{KV}" /></Typography><Matrix columns={2} /></div>
        </div>
        <Typography as="h3" variant="h2" align="center">减少缓存显存</Typography>
      </section>
      <section className="mlas-column">
        <Typography as="h2" variant="h1" align="center">矩阵吸收</Typography>
        <div className="mlas-diagram mlas-absorption" role="img" aria-label="吸收前先将潜在缓存展开成历史 K、V 再计算；吸收后省去展开，直接参与调整后的计算">
          <AbsorptionRow />
          <AbsorptionRow absorbed />
        </div>
        <Typography as="h3" variant="h2" align="center">不再展开历史 K、V</Typography>
      </section>
      <section className="mlas-column">
        <Typography as="h2" variant="h1" align="center">解耦 RoPE</Typography>
        <div className="mlas-diagram mlas-decoupled" role="img" aria-label="内容分支继续矩阵吸收，短位置分支使用 RoPE，两部分分数相加">
          <div className="mlas-branches"><div><span className="mlas-content-band" /><Typography as="span" variant="body">内容：吸收</Typography></div><div><span className="mlas-position-band" /><Typography as="span" variant="body">位置：旋转</Typography></div></div>
          <Typography as="span" variant="h2"><MathFormulaStatic latex="S=S^C+S^R" /></Typography>
        </div>
        <Typography as="h3" variant="h2" align="center">保留位置，兼容内容吸收</Typography>
      </section>
    </main>
    <footer className="mlas-footer"><Typography as="p" variant="h2" align="center">最终缓存：<span className="mlas-latent-copy"><MathFormulaStatic latex="C^{KV}" /></span> + <span className="mlas-position-copy"><MathFormulaStatic latex="K^R" /></span></Typography></footer>
  </section>;
}
