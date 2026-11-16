import { Typography } from "@shuku/course-style/react";
import './MemoryBoundaryPage.css';

const FACTORS = [
  { value: '2', label: 'K 与 V 两份' },
  { value: 'L = 32', label: '模型层数' },
  { value: 'B = 1', label: '并行序列数' },
  { value: 'T', label: '上下文长度（token 数）', emphasis: true },
  { value: 'Dₖᵥ = 4096', label: '每层 K/V 总宽' },
  { value: 's = 2 字节', label: '每个数值的大小' },
] as const;

export function MemoryBoundaryPage() {
  return <section shuku-edit-id="e-c9a18b11-bcee-4bfb-99a1-3052f9c5c1c4" className="kvm-formula-slide" aria-label="KV Cache 显存公式与变量">
    <Typography shuku-edit-id="e-8ed8d1be-9291-49a8-9166-df48e37743d3" as="h1" variant="h1">KV Cache 的显存怎么算？</Typography>

    <main shuku-edit-id="e-f38af250-fb9f-46df-b8b1-d9e5220e09f2" className="kvm-formula-content">
      <Typography shuku-edit-id="e-ce521e56-8b5c-4623-ba9d-bacdf18e5cd8" as="p" variant="display" align="center" className="kvm-formula-equation">
        KV Cache（字节）≈ 2 × L × B × <span shuku-edit-id="e-b6f910d8-a2a7-4665-aa8a-a968512d5155" className="kvm-formula-t">T</span> × D<sub shuku-edit-id="e-2e0806fd-9395-47de-b05b-5a19e5051844">KV</sub> × s
      </Typography>

      <div shuku-edit-id="e-31d5fc82-24bc-471d-9f9a-5e95c7e3afcd" className="kvm-formula-factors">
        {FACTORS.map(factor => <div shuku-edit-id="e-89594aa3-e2fd-4320-b289-2b0d85cb8479" className={`kvm-formula-factor ${'emphasis' in factor ? 'is-emphasis' : ''}`} key={factor.value}>
          <Typography shuku-edit-id="e-947b6c02-2642-4499-9e1e-efbff39b9e14" as="strong" variant="h2" tone={'emphasis' in factor ? 'inherit' : 'main'}>{factor.value}</Typography>
          <Typography shuku-edit-id="e-1912c895-ee7f-442a-b68b-56175b65f751" as="span" variant="h3" tone={'emphasis' in factor ? 'inherit' : 'muted'}>{factor.label}</Typography>
        </div>)}
      </div>
    </main>
  </section>;
}
