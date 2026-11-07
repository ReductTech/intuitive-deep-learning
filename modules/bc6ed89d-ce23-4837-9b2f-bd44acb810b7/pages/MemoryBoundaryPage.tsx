import { Typography } from '../../shared/react';
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
  return <section className="kvm-formula-slide" aria-label="KV Cache 显存公式与变量">
    <Typography as="h1" variant="h1">KV Cache 的显存怎么算？</Typography>

    <main className="kvm-formula-content">
      <Typography as="p" variant="display" align="center" className="kvm-formula-equation">
        KV Cache（字节）≈ 2 × L × B × <span className="kvm-formula-t">T</span> × D<sub>KV</sub> × s
      </Typography>

      <div className="kvm-formula-factors">
        {FACTORS.map(factor => <div className={`kvm-formula-factor ${'emphasis' in factor ? 'is-emphasis' : ''}`} key={factor.value}>
          <Typography as="strong" variant="h2" tone={'emphasis' in factor ? 'inherit' : 'main'}>{factor.value}</Typography>
          <Typography as="span" variant="h3" tone={'emphasis' in factor ? 'inherit' : 'muted'}>{factor.label}</Typography>
        </div>)}
      </div>
    </main>
  </section>;
}
