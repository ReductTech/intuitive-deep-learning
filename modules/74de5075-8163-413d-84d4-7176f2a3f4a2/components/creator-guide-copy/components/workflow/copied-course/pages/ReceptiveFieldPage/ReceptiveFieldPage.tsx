import { useState } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import { ReceptiveFieldScene, type CellSelection } from './ReceptiveFieldScene';
import './ReceptiveFieldPage.css';

const SIZES = [9, 7, 5, 3, 1];
const nameOf = (level: number) => level === 0 ? '输入图像' : `第 ${level} 层特征图`;

export function ReceptiveFieldPage() {
  const [layers, setLayers] = useState(3);
  const [selected, setSelected] = useState<CellSelection>({ level: 3, row: 1, col: 1 });
  const [resetViewToken, setResetViewToken] = useState(0);
  const addLayer = () => {
    if (layers >= 4) return;
    const next = layers + 1;
    const middle = Math.floor(SIZES[next] / 2);
    setLayers(next);
    setSelected({ level: next, row: middle, col: middle });
  };
  const removeLayer = () => {
    if (layers <= 1) return;
    const next = layers - 1;
    setLayers(next);
    if (selected.level > next) {
      const middle = Math.floor(SIZES[next] / 2);
      setSelected({ level: next, row: middle, col: middle });
    }
  };
  const observations = Array.from({ length: selected.level + 1 }, (_, index) => selected.level - index);

  return <ContentBlock shuku-edit-id="e-d7efcbae-59c2-49ca-87c7-50a82a189310" headingLevel={1} className="aipe-replay-cg-copy-ck-field" title="卷积核的堆叠与感受野" subtitle="点选任一特征位置，观察它在每个下层对应的范围；拖动模型可旋转，滚轮可缩放。">
    <div shuku-edit-id="e-59120c03-7e85-48f4-85aa-75c06ea74048" className="aipe-replay-cg-copy-ck-field__layout">
      <section shuku-edit-id="e-facadd0a-42bb-4597-a21d-a260060783c2" className="aipe-replay-cg-copy-ck-field__visual" aria-label="卷积层叠模型">
        <div shuku-edit-id="e-cf27802e-845e-47cf-90e4-75bfbaa869fa" className="aipe-replay-cg-copy-ck-field__visual-hint"><Typography shuku-edit-id="e-ca5a8148-f976-4f8e-9b10-27dfc29d4a7a" variant="bodySmall" tone="muted">点击格子选位置 · 拖动旋转 · 滚轮缩放</Typography></div>
        <ReceptiveFieldScene layers={layers} selected={selected} onSelect={setSelected} resetViewToken={resetViewToken} />
      </section>
      <aside shuku-edit-id="e-6ef95805-29f5-4f94-9c51-65d986bce57b" className="aipe-replay-cg-copy-ck-field__aside">
        <section shuku-edit-id="e-d4a45f54-ad20-4aff-ab13-6023ff9dcbef" className="aipe-replay-cg-copy-ck-field__controls">
          <button shuku-edit-id="e-9c5ebf35-f2ae-42aa-86be-95a1ea8042b3" type="button" className="aipe-replay-cg-copy-ck-field__add" onClick={addLayer} disabled={layers === 4}><Typography shuku-edit-id="e-be5fd776-238f-4bb7-9c33-147131017977" as="span" variant="h3" tone="inherit">＋ 添加卷积层</Typography></button>
          <div shuku-edit-id="e-ebd8bb8f-867b-4331-8406-1238fb80b9ce" className="aipe-replay-cg-copy-ck-field__rule"><Typography shuku-edit-id="e-a30ad8bc-2d50-4000-b3f6-78ee8fcdbd00" variant="bodySmall" tone="accent">3 × 3 卷积</Typography><Typography shuku-edit-id="e-1c8e14b2-bfd3-4835-b406-46ed03cf1d03" variant="bodySmall" tone="accent">步长 1 · 无填充</Typography></div>
          <div shuku-edit-id="e-18156bd9-dea8-4071-b497-8427bb2b856c" className="aipe-replay-cg-copy-ck-field__actions"><button shuku-edit-id="e-8a0bd8d5-4f33-4636-ab43-7238a0fc7097" type="button" onClick={removeLayer} disabled={layers === 1}><Typography shuku-edit-id="e-78db825f-4475-4629-a46b-48223b4b0e8c" as="span" variant="bodySmall" tone="inherit">减少一层</Typography></button><button shuku-edit-id="e-db2c1918-397e-46a3-8c8a-ae25cb7aaa42" type="button" onClick={() => setResetViewToken((current) => current + 1)}><Typography shuku-edit-id="e-44c6b4ed-f01a-4336-9ec2-77ec7e709167" as="span" variant="bodySmall" tone="inherit">重置视角</Typography></button></div>
        </section>
        <section shuku-edit-id="e-46cb352f-3b94-4cf0-a1ff-0b50c3be4f11" className="aipe-replay-cg-copy-ck-field__observation">
          <Typography shuku-edit-id="e-bc9e95b8-ab56-4e7d-9320-0fe1a5aa1f4c" as="h2" variant="h3" tone="accent">当前观察</Typography>
          <div shuku-edit-id="e-722b9d46-5410-4077-92eb-b88ceb580adc" className="aipe-replay-cg-copy-ck-field__observation-list">
            {observations.map((level) => <div shuku-edit-id="e-58cba0e4-5940-4e50-aab8-617602dd9c1c" key={level} className="aipe-replay-cg-copy-ck-field__observation-row"><Typography shuku-edit-id="e-c36d72c9-1763-48d4-a2a4-ff40328f5918" variant="bodySmall" tone="accent">{nameOf(level)}</Typography><Typography shuku-edit-id="e-3d2fde68-368e-472c-b2f2-0626783b491f" variant="bodySmall" tone="accent">{1 + 2 * (selected.level - level)} × {1 + 2 * (selected.level - level)}</Typography></div>)}
          </div>
          <div shuku-edit-id="e-c43e2385-fd55-4a2a-8127-75374aebe3b6" className="aipe-replay-cg-copy-ck-field__takeaway"><Typography shuku-edit-id="e-3d8760cf-8bc7-45bb-a837-12c974fbc77e" variant="bodySmall" tone="accent">每多经过一层 3 × 3 卷积，感受野边长增加 2。</Typography></div>
        </section>
      </aside>
    </div>
  </ContentBlock>;
}
