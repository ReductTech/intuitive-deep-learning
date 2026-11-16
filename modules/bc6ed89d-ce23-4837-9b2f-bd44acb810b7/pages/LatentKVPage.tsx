import { useState } from 'react';
import { Button, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './LatentKVPage.css';

const VECTORS = [
  { kind: 'k', latex: 'k_t', dimensions: 16384 },
  { kind: 'v', latex: 'v_t', dimensions: 16384 },
  { kind: 'latent', latex: 'c_t^{KV}', dimensions: 512 },
] as const;

export function LatentKVPage() {
  const [showBridge, setShowBridge] = useState(false);
  if (showBridge) return <section shuku-edit-id="e-1763c391-92de-429d-ba8e-8fb1c42d4305" className="lkv-slide lkv-slide--bridge" aria-label="展开历史KV会增加计算开销">
    <Typography shuku-edit-id="e-ab6b9787-2cf7-4909-8c64-62f7bbfa7e7c" as="h1" variant="display" align="center" className="lkv-bridge-copy">
      <span shuku-edit-id="e-8a2bddd3-2399-4e9e-a7b7-90c66891f3ea">但如果每轮计算</span>
      <span shuku-edit-id="e-1b7c5711-43b6-409d-b198-3bc20ce07c9f">都要从 <MathFormulaStatic latex="c_t^{KV}" /> 展开历史 <MathFormulaStatic latex="k_t" />、<MathFormulaStatic latex="v_t" />，</span>
      <span shuku-edit-id="e-8415bec7-47e0-42e8-b4de-0a86aa879d84">就会增加计算开销。</span>
    </Typography>
  </section>;
  return <section shuku-edit-id="e-7c3c22b7-4fe9-4d63-925e-ce812729465b" className="lkv-slide" aria-label="潜在向量与内容 K、V 的缓存量对比">
    <header shuku-edit-id="e-274359fa-c13f-4731-a621-602cdf180035" className="lkv-header">
      <Typography shuku-edit-id="e-c98e5865-bda5-41be-912b-26d803009216" as="h1" variant="h1">存潜在向量，代替存 K、V</Typography>
      <Typography shuku-edit-id="e-8fc9c43d-85ce-43f2-9693-cfcde60e586d" as="p" variant="body" tone="muted">每个 token · 每层 · 相同存储精度</Typography>
    </header>
    <main shuku-edit-id="e-7a9ae9cd-1527-4488-a2bc-b06bbcafb522" className="lkv-comparison" aria-label="K 和 V 各 16384 维，潜在向量 512 维；长度按 32 比 32 比 1 绘制">
      {VECTORS.map(vector => <div shuku-edit-id="e-4b9ba6ad-0e2f-487b-99b5-97212756e7d4" className={`lkv-vector lkv-vector--${vector.kind}`} key={vector.kind}>
        <Typography shuku-edit-id="e-12f7901f-3a4e-4c61-8dde-51656539b597" as="p" variant="display" tone="inherit" className="lkv-vector-label"><MathFormulaStatic latex={vector.latex} /></Typography>
        <div shuku-edit-id="e-fe5cccf2-4ff8-4ffd-b08c-7badce702c36" className="lkv-vector-track">
          <div shuku-edit-id="e-acdbc864-b039-4aa2-b670-7e71adf9abc2" className="lkv-vector-bar" style={{ width: `${vector.dimensions / 16384 * 100}%` }} aria-hidden="true" />
          <Typography shuku-edit-id="e-cb04634b-f851-425b-8ba0-2b957779f09f" as="strong" variant="h2" tone="main" className="lkv-vector-value" style={{ left: `calc(${vector.dimensions / 16384 * 100}% + 24px)` }}>{vector.dimensions.toLocaleString('en-US')}</Typography>
        </div>
      </div>)}
    </main>
    <footer shuku-edit-id="e-04cdaa37-8c74-43e2-8af3-9dbe1305e9d7" className="lkv-conclusion">
      <Typography shuku-edit-id="e-0db51c70-8ea3-40e3-b8bf-04341d0b67bd" as="p" variant="h1" align="center">缓存量降至原来的<span shuku-edit-id="e-3a98be34-1fe9-4a21-a1cd-d4c69b010856" className="lkv-emphasis">约 1.6%</span></Typography>
      <Typography shuku-edit-id="e-81f113a1-5c80-4fe3-96c2-f1d36b1505a9" as="p" variant="h2" align="center" tone="muted"><MathFormulaStatic latex={String.raw`\frac{512}{2\times16384}\approx1.6\%`} /></Typography>
      <Typography shuku-edit-id="e-3f9fa615-79e5-48f6-85dc-6d8c8f2af9fe" as="p" variant="bodySmall" align="center" tone="muted">仅比较内容部分，未计入 RoPE 缓存。</Typography>
    </footer>
    <Button className="lkv-next" variant="primary" onClick={event => { event.stopPropagation(); setShowBridge(true); }}>下一步 →</Button>
  </section>;
}
