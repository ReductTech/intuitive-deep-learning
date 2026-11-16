import { useState } from 'react';
import { RangeControl, Typography } from "@shuku/course-style/react";
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

  return <section shuku-edit-id="e-20ace128-dc8b-4b2f-8663-ae737883d290" className={`kvm-pressure-slide${focusKv ? ' kvm-pressure-slide--focus-kv' : ''}`} aria-label="上下文长度与 GPU 显存峰值">
    <Typography shuku-edit-id="e-1dd45ab4-3c62-4643-ae1c-e495bc5ed781" as="h1" variant="h1">{title}</Typography>

    <main shuku-edit-id="e-bbf561cc-ac1d-4d18-9ae0-1fe34f1d6286" className="kvm-pressure-main">
      <div shuku-edit-id="e-4300e197-2e21-4110-bd68-9b0dd699c11e" className="kvm-pressure-heading">
        <Typography shuku-edit-id="e-5d62ccee-ca9a-4fff-af67-a429199989af" as="strong" variant="h3">16 GiB GPU 显存预算</Typography>
        <Typography shuku-edit-id="e-cf56f3cc-ddc0-4f2c-98fc-9954be1089d2" as="strong" variant="h3" tone={overflowGiB ? 'danger' : 'main'} aria-live="polite">
          {overflowGiB ? `OOM：超出 ${formatGiB(overflowGiB)} GiB` : `峰值 ${formatGiB(totalGiB)} / ${CAPACITY_GIB} GiB`}
        </Typography>
      </div>

      <div shuku-edit-id="e-cace2d95-39cf-40d1-9391-93d77ac52d36" className="kvm-pressure-bar" role="img" aria-label={`固定占用 ${OTHER_GIB} GiB，K 和 V 缓存各 ${kvGiB / 2} GiB，注意力计算临时显存 ${formatGiB(tempGiB)} GiB；${overflowGiB ? `峰值超出显存 ${formatGiB(overflowGiB)} GiB` : `峰值未超出 ${CAPACITY_GIB} GiB`}`}>
        <div shuku-edit-id="e-04725ad2-913c-4e85-8a89-7c09a3df1219" className="kvm-pressure-segment kvm-pressure-segment--fixed"><Typography shuku-edit-id="e-d909be74-284f-4123-9f09-4cefc83454cf" as="span" variant="h3" tone="inherit">固定占用 8 GiB</Typography></div>
        <div shuku-edit-id="e-89e4c1f2-b79c-4913-9e99-b14a6bdf1b49" className="kvm-pressure-segment kvm-pressure-segment--k" style={{ left: `${OTHER_GIB / BAR_MAX_GIB * 100}%`, width: `${halfCachePercent}%` }}><Typography shuku-edit-id="e-9c8ebc1e-5178-4ca9-a7e2-fb1d4feacb7d" as="span" variant="h3" tone="inherit">K</Typography></div>
        <div shuku-edit-id="e-dbbafc0e-b67e-49d2-a04c-89cc2407c753" className="kvm-pressure-segment kvm-pressure-segment--v" style={{ left: `${(OTHER_GIB + kvGiB / 2) / BAR_MAX_GIB * 100}%`, width: `${halfCachePercent}%` }}><Typography shuku-edit-id="e-8a1baf18-68c5-4b67-94f8-4b2e7400f9b3" as="span" variant="h3" tone="inherit">V</Typography></div>
        <div shuku-edit-id="e-a297bf9e-930d-4193-a753-fecd6a3139b6" className="kvm-pressure-segment kvm-pressure-segment--temp" style={{ left: `${(OTHER_GIB + kvGiB) / BAR_MAX_GIB * 100}%`, width: `${tempGiB / BAR_MAX_GIB * 100}%` }}>
          {tempGiB >= 2 && <Typography shuku-edit-id="e-b0ca14ce-639d-44f7-a7fa-5688cf234d07" as="span" variant="h3" tone="inherit" align="center">注意力<br shuku-edit-id="e-ea884e27-c35b-42e4-ad32-6785263de32a" />临时显存</Typography>}
        </div>
        <div shuku-edit-id="e-7d619b69-5d64-4f77-85ac-5f326c35f429" className="kvm-pressure-capacity" aria-hidden="true" />
      </div>

      <div shuku-edit-id="e-6fe26f3b-3a18-452b-a6df-dac4a1e6feae" className="kvm-pressure-values">
        <Typography shuku-edit-id="e-84967ef6-4bc7-458c-a6b9-59eb5faabdf4" as="strong" variant="h3" aria-live="polite">KV Cache：{kvGiB} GiB</Typography>
        <div shuku-edit-id="e-32b8c265-8acf-4088-97bb-c1063df069ef" className="kvm-pressure-temp-value">
          <span shuku-edit-id="e-6b1acd84-bd4b-4928-8d40-ae96fe54d4ab" className="kvm-pressure-temp-icon" aria-hidden="true" />
          <Typography shuku-edit-id="e-226f3430-3302-4d1d-9f92-ee1f820ae058" as="strong" variant="h3" aria-live="polite">注意力临时显存：{formatGiB(tempGiB)} GiB</Typography>
        </div>
      </div>

      <div shuku-edit-id="e-d67bcf62-d942-45d7-857b-d584e30a3913" className="kvm-pressure-controls">
        <div shuku-edit-id="e-0e6f6980-69ef-42d3-b062-713bc8283578" className="kvm-pressure-controls-heading">
          <Typography shuku-edit-id="e-ec2d201b-4951-4799-91c5-8e78ef63791f" as="strong" variant="h3" tone="inherit">上下文长度 T</Typography>
          <Typography shuku-edit-id="e-a5849a41-671d-41e4-bc6a-3978089510b4" as="output" variant="h3" aria-live="polite">{tokens / 1024}k token</Typography>
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
        <div shuku-edit-id="e-b4d35cb5-8ef8-4526-a475-185f915ebd12" className="kvm-pressure-scale" aria-hidden="true">
          {CONTEXT_MARKS.map(length => <Typography shuku-edit-id="e-0cea94ce-c55b-42cc-9ded-44d28a702996" as="strong" variant="h3" key={length}>{length}k</Typography>)}
        </div>
      </div>
    </main>
  </section>;
}
