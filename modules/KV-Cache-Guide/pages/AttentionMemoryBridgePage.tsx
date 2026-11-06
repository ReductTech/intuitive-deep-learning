import { useState } from 'react';
import { RangeControl, Typography } from '../../shared/react';
import './AttentionMemoryBridgePage.css';

const CONTEXT_MARKS = [4, 6, 8, 10, 12, 14, 16] as const;
const CAPACITY_GIB = 16;
const BAR_MAX_GIB = 24;
const OTHER_GIB = 8;
const LAYERS = 32;
const BATCH = 1;
const KV_WIDTH = 4096;
const BYTES = 2;
const SCORE_HEADS = 8;
const SCORE_MATRICES = 2;

function formatGiB(value: number) {
  return Number(value.toFixed(2));
}

export function AttentionMemoryBridgePage({ focusKv = false, title = '上下文变长，显存会怎样？' }: { focusKv?: boolean; title?: string }) {
  const [tokens, setTokens] = useState(4096);
  const kvGiB = 2 * LAYERS * BATCH * tokens * KV_WIDTH * BYTES / 1024 ** 3;
  // 教学示意：常规预填充计算显式保存 S=QKᵀ 与 P=Softmax(S)，各为 8 头 BF16 的 T×T 矩阵。
  const tempGiB = SCORE_MATRICES * SCORE_HEADS * tokens ** 2 * BYTES / 1024 ** 3;
  const totalGiB = OTHER_GIB + kvGiB + tempGiB;
  const overflowGiB = Math.max(0, totalGiB - CAPACITY_GIB);
  const halfCachePercent = kvGiB / 2 / BAR_MAX_GIB * 100;

  return <section className={`kvm-pressure-slide${focusKv ? ' kvm-pressure-slide--focus-kv' : ''}`} aria-label="上下文长度与 GPU 显存峰值">
    <Typography as="h1" variant="h1">{title}</Typography>

    <main className="kvm-pressure-main">
      <div className="kvm-pressure-heading">
        <Typography as="strong" variant="h3">16 GiB GPU 显存预算</Typography>
        <Typography as="strong" variant="h3" tone={overflowGiB ? 'danger' : 'main'} aria-live="polite">
          {overflowGiB ? `OOM：超出 ${formatGiB(overflowGiB)} GiB` : `峰值 ${formatGiB(totalGiB)} / ${CAPACITY_GIB} GiB`}
        </Typography>
      </div>

      <div className="kvm-pressure-bar" role="img" aria-label={`固定占用 ${OTHER_GIB} GiB，K 和 V 缓存各 ${kvGiB / 2} GiB，注意力计算临时显存 ${formatGiB(tempGiB)} GiB；${overflowGiB ? `峰值超出显存 ${formatGiB(overflowGiB)} GiB` : `峰值未超出 ${CAPACITY_GIB} GiB`}`}>
        <div className="kvm-pressure-segment kvm-pressure-segment--fixed"><Typography as="span" variant="h3" tone="inherit">固定占用 8 GiB</Typography></div>
        <div className="kvm-pressure-segment kvm-pressure-segment--k" style={{ left: `${OTHER_GIB / BAR_MAX_GIB * 100}%`, width: `${halfCachePercent}%` }}><Typography as="span" variant="h3" tone="inherit">K</Typography></div>
        <div className="kvm-pressure-segment kvm-pressure-segment--v" style={{ left: `${(OTHER_GIB + kvGiB / 2) / BAR_MAX_GIB * 100}%`, width: `${halfCachePercent}%` }}><Typography as="span" variant="h3" tone="inherit">V</Typography></div>
        <div className="kvm-pressure-segment kvm-pressure-segment--temp" style={{ left: `${(OTHER_GIB + kvGiB) / BAR_MAX_GIB * 100}%`, width: `${tempGiB / BAR_MAX_GIB * 100}%` }}>
          {tempGiB >= 2 && <Typography as="span" variant="h3" tone="inherit" align="center">注意力<br />临时显存</Typography>}
        </div>
        <div className="kvm-pressure-capacity" aria-hidden="true" />
      </div>

      <div className="kvm-pressure-values">
        <Typography as="strong" variant="h3" aria-live="polite">KV Cache：{kvGiB} GiB</Typography>
        <div className="kvm-pressure-temp-value">
          <span className="kvm-pressure-temp-icon" aria-hidden="true" />
          <Typography as="strong" variant="h3" aria-live="polite">注意力临时显存：{formatGiB(tempGiB)} GiB</Typography>
        </div>
      </div>

      <div className="kvm-pressure-controls">
        <div className="kvm-pressure-controls-heading">
          <Typography as="strong" variant="h3" tone="inherit">上下文长度 T</Typography>
          <Typography as="output" variant="h3" aria-live="polite">{tokens / 1024}k token</Typography>
        </div>
        <RangeControl
          id="kvm-context-length"
          label=""
          aria-label="上下文长度 T"
          value={tokens}
          min={4096}
          max={16384}
          step={2048}
          discrete
          formatValue={value => `${Number(value) / 1024}k token`}
          onChange={event => setTokens(Number(event.currentTarget.value))}
        />
        <div className="kvm-pressure-scale" aria-hidden="true">
          {CONTEXT_MARKS.map(length => <Typography as="strong" variant="h3" key={length}>{length}k</Typography>)}
        </div>
      </div>
    </main>
  </section>;
}
