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

  return <ContentBlock shuku-edit-id="e-bf81580e-5aff-41e6-b920-42bd0f62c274" headingLevel={1} className="cg-copy-ck-field" title="卷积核的堆叠与感受野" subtitle="点选任一特征位置，观察它在每个下层对应的范围；拖动模型可旋转，滚轮可缩放。">
    <div shuku-edit-id="e-7a6e7cb6-3917-4fbc-a654-7e767ebe50dd" className="cg-copy-ck-field__layout">
      <section shuku-edit-id="e-85df4828-9dae-49f2-830e-4e64f36046d8" className="cg-copy-ck-field__visual" aria-label="卷积层叠模型">
        <div shuku-edit-id="e-b2a40a87-2a24-4f5e-8c52-c575ba073145" className="cg-copy-ck-field__visual-hint"><Typography shuku-edit-id="e-0e233f5b-c983-4a52-9503-571fbc573db1" variant="bodySmall" tone="muted">点击格子选位置 · 拖动旋转 · 滚轮缩放</Typography></div>
        <ReceptiveFieldScene layers={layers} selected={selected} onSelect={setSelected} resetViewToken={resetViewToken} />
      </section>
      <aside shuku-edit-id="e-0cef2099-dce0-4d99-9137-a7b2250aa998" className="cg-copy-ck-field__aside">
        <section shuku-edit-id="e-7c519953-dd62-4b3e-a3b9-ff3b580f9b47" className="cg-copy-ck-field__controls">
          <button shuku-edit-id="e-0e902f74-ffdf-4553-aa4b-627c0fedc1e4" type="button" className="cg-copy-ck-field__add" onClick={addLayer} disabled={layers === 4}><Typography shuku-edit-id="e-3e5262c8-c83f-469f-9246-9f5b042dd8c7" as="span" variant="h3" tone="inherit">＋ 添加卷积层</Typography></button>
          <div shuku-edit-id="e-1f4bba95-fc3f-4618-a277-e6d83f157e39" className="cg-copy-ck-field__rule"><Typography shuku-edit-id="e-219765ef-e5fd-4c28-b5b6-efd11134109a" variant="bodySmall" tone="accent">3 × 3 卷积</Typography><Typography shuku-edit-id="e-78f90a5f-bd5e-4519-a45b-cdc8513ce775" variant="bodySmall" tone="accent">步长 1 · 无填充</Typography></div>
          <div shuku-edit-id="e-bab2c67e-b96c-4860-9b19-68bea436d6a2" className="cg-copy-ck-field__actions"><button shuku-edit-id="e-e27fb895-7072-4652-b082-5684efcb77d0" type="button" onClick={removeLayer} disabled={layers === 1}><Typography shuku-edit-id="e-358c1338-02da-4d22-b4f0-6b0a5e22f874" as="span" variant="bodySmall" tone="inherit">减少一层</Typography></button><button shuku-edit-id="e-3ff31748-fa3b-47b0-a5f0-5ee116c12dad" type="button" onClick={() => setResetViewToken((current) => current + 1)}><Typography shuku-edit-id="e-f8c6f996-81fa-4796-915e-2f3c1cab120e" as="span" variant="bodySmall" tone="inherit">重置视角</Typography></button></div>
        </section>
        <section shuku-edit-id="e-dd95c935-182c-4266-9612-31d9f1cf15dc" className="cg-copy-ck-field__observation">
          <Typography shuku-edit-id="e-720ead91-640c-473a-97bb-eec697f89d9a" as="h2" variant="h3" tone="accent">当前观察</Typography>
          <div shuku-edit-id="e-852b8911-f53d-4383-9efe-2e8fb3e95e4e" className="cg-copy-ck-field__observation-list">
            {observations.map((level) => <div shuku-edit-id="e-ac3b066f-ce3b-4a07-b713-f224a3157fba" key={level} className="cg-copy-ck-field__observation-row"><Typography shuku-edit-id="e-765a95e0-4027-47b3-b112-adda37cb387f" variant="bodySmall" tone="accent">{nameOf(level)}</Typography><Typography shuku-edit-id="e-b0a72ed0-e4f6-4304-9b5c-b7274c2323a6" variant="bodySmall" tone="accent">{1 + 2 * (selected.level - level)} × {1 + 2 * (selected.level - level)}</Typography></div>)}
          </div>
          <div shuku-edit-id="e-7da6ecac-9ca5-4ff0-96f3-5e3210b8d04a" className="cg-copy-ck-field__takeaway"><Typography shuku-edit-id="e-2e633c11-e686-4dec-916e-07230e79813f" variant="bodySmall" tone="accent">每多经过一层 3 × 3 卷积，感受野边长增加 2。</Typography></div>
        </section>
      </aside>
    </div>
  </ContentBlock>;
}
