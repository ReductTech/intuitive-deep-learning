import { useState } from 'react';
import { Button, MathFormulaStatic, Typography } from '../../shared/react';
import './LatentKVPage.css';

const VECTORS = [
  { kind: 'k', latex: 'k_t', dimensions: 16384 },
  { kind: 'v', latex: 'v_t', dimensions: 16384 },
  { kind: 'latent', latex: 'c_t^{KV}', dimensions: 512 },
] as const;

export function LatentKVPage() {
  const [showBridge, setShowBridge] = useState(false);
  if (showBridge) return <section className="lkv-slide lkv-slide--bridge" aria-label="展开历史KV会增加计算开销">
    <Typography as="h1" variant="display" align="center" className="lkv-bridge-copy">
      <span>但如果每轮计算</span>
      <span>都要从 <MathFormulaStatic latex="c_t^{KV}" /> 展开历史 <MathFormulaStatic latex="k_t" />、<MathFormulaStatic latex="v_t" />，</span>
      <span>就会增加计算开销。</span>
    </Typography>
  </section>;
  return <section className="lkv-slide" aria-label="潜在向量与内容 K、V 的缓存量对比">
    <header className="lkv-header">
      <Typography as="h1" variant="h1">存潜在向量，代替存 K、V</Typography>
      <Typography as="p" variant="body" tone="muted">每个 token · 每层 · 相同存储精度</Typography>
    </header>
    <main className="lkv-comparison" aria-label="K 和 V 各 16384 维，潜在向量 512 维；长度按 32 比 32 比 1 绘制">
      {VECTORS.map(vector => <div className={`lkv-vector lkv-vector--${vector.kind}`} key={vector.kind}>
        <Typography as="p" variant="display" tone="inherit" className="lkv-vector-label"><MathFormulaStatic latex={vector.latex} /></Typography>
        <div className="lkv-vector-track">
          <div className="lkv-vector-bar" style={{ width: `${vector.dimensions / 16384 * 100}%` }} aria-hidden="true" />
          <Typography as="strong" variant="h2" tone="main" className="lkv-vector-value" style={{ left: `calc(${vector.dimensions / 16384 * 100}% + 24px)` }}>{vector.dimensions.toLocaleString('en-US')}</Typography>
        </div>
      </div>)}
    </main>
    <footer className="lkv-conclusion">
      <Typography as="p" variant="h1" align="center">缓存量降至原来的<span className="lkv-emphasis">约 1.6%</span></Typography>
      <Typography as="p" variant="h2" align="center" tone="muted"><MathFormulaStatic latex={String.raw`\frac{512}{2\times16384}\approx1.6\%`} /></Typography>
      <Typography as="p" variant="bodySmall" align="center" tone="muted">仅比较内容部分，未计入 RoPE 缓存。</Typography>
    </footer>
    <Button className="lkv-next" variant="primary" onClick={event => { event.stopPropagation(); setShowBridge(true); }}>下一步 →</Button>
  </section>;
}
