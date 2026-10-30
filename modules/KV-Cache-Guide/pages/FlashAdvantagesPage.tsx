import { Typography } from '../../shared/react';
import './FlashAdvantagesPage.css';

function Matrix({ small = false, active = false }: { small?: boolean; active?: boolean }) {
  const size = small ? 3 : 6;
  return <div className={`fav-matrix ${small ? 'fav-matrix--small' : ''} ${active ? 'fav-matrix--active' : ''}`} aria-hidden="true">
    {Array.from({ length: size * size }, (_, index) => <span key={index} />)}
  </div>;
}

export function FlashAdvantagesPage() {
  return <section className="fav-slide" aria-label="FlashAttention 总结：降低临时显存，减少数据搬运">
    <Typography as="h1" variant="h1">FlashAttention 的两个优势</Typography>
    <main className="fav-columns">
      <section className="fav-advantage">
        <div className="fav-heading">
          <Typography as="p" variant="h3" tone="muted">分块计算</Typography>
          <Typography as="h2" variant="h1">降低临时显存</Typography>
        </div>
        <div className="fav-memory-diagram" role="img" aria-label="从暂存完整中间矩阵，到只处理当前小块，不保存完整 S、P">
          <div className="fav-matrix-stage"><Matrix /><Typography as="span" variant="body" tone="muted">完整中间矩阵</Typography></div>
          <svg className="fav-forward" viewBox="0 0 90 40" aria-hidden="true"><path d="M5 20 H78 M64 6 L78 20 L64 34" /></svg>
          <div className="fav-matrix-stage"><Matrix small active /><Typography as="span" variant="body" tone="main">当前小块</Typography></div>
        </div>
        <Typography as="p" variant="h3" className="fav-conclusion">不保存完整 S、P</Typography>
      </section>
      <section className="fav-advantage">
        <div className="fav-heading">
          <Typography as="p" variant="h3" tone="muted">少存中间结果</Typography>
          <Typography as="h2" variant="h1">减少数据搬运</Typography>
        </div>
        <div className="fav-io-diagram" role="img" aria-label="常规实现将中间结果写回 HBM 并读回；FlashAttention 在 SRAM 内连续处理小块">
          <div className="fav-hbm"><Typography as="strong" variant="h3">HBM</Typography></div>
          <div className="fav-io-lanes">
            <div className="fav-transfers">
              <svg viewBox="0 0 260 155" aria-hidden="true">
                {[40,100,160,220].map((x,index) => <path key={x} d={index % 2 ? `M${x} 137 V18 M${x-10} 31 L${x} 18 L${x+10} 31` : `M${x} 18 V137 M${x-10} 124 L${x} 137 L${x+10} 124`} />)}
              </svg>
              <Typography as="span" variant="bodySmall" tone="muted">写回 · 读回</Typography>
            </div>
            <div className="fav-fused-transfer">
              <Typography as="span" variant="bodySmall" tone="muted">小块在片上接着计算</Typography>
            </div>
          </div>
          <div className="fav-sram">
            <Typography as="strong" variant="h3">SRAM</Typography>
            <div className="fav-workspaces">
              <div className="fav-ordinary"><Matrix small /><Typography as="span" variant="bodySmall" tone="muted">常规实现</Typography></div>
              <div className="fav-fused">
                <div className="fav-local-chain"><Matrix small active /><Typography as="span" variant="h3">→</Typography><Matrix small active /></div>
                <Typography as="span" variant="bodySmall">分块融合</Typography>
              </div>
            </div>
          </div>
        </div>
        <Typography as="p" variant="h3" className="fav-conclusion">减少中间结果的写回与读回</Typography>
      </section>
    </main>
  </section>;
}
