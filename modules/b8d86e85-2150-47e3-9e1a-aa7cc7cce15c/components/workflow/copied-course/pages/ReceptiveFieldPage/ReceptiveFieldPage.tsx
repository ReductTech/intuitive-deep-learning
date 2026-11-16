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

  return <ContentBlock shuku-edit-id="e-fc152e7b-0b34-4b45-8692-c5acd5ae28a6" headingLevel={1} className="cg-copy-ck-field" title="卷积核的堆叠与感受野" subtitle="点选任一特征位置，观察它在每个下层对应的范围；拖动模型可旋转，滚轮可缩放。">
    <div shuku-edit-id="e-90d851db-c9bb-4200-b4fc-5cb63aa023ce" className="cg-copy-ck-field__layout">
      <section shuku-edit-id="e-cc521a82-dce0-4fbe-86aa-737fbba60a28" className="cg-copy-ck-field__visual" aria-label="卷积层叠模型">
        <div shuku-edit-id="e-ebfff3d7-b578-4f7d-9846-1cfb14f4dc08" className="cg-copy-ck-field__visual-hint"><Typography shuku-edit-id="e-2c87ff43-4b3b-4e59-86ac-d8e07a59a2e4" variant="bodySmall" tone="muted">点击格子选位置 · 拖动旋转 · 滚轮缩放</Typography></div>
        <ReceptiveFieldScene layers={layers} selected={selected} onSelect={setSelected} resetViewToken={resetViewToken} />
      </section>
      <aside shuku-edit-id="e-91245a49-860a-4821-ad39-675c422a6c0c" className="cg-copy-ck-field__aside">
        <section shuku-edit-id="e-45e9597d-5bd5-47cb-9e71-5668be09ea08" className="cg-copy-ck-field__controls">
          <button shuku-edit-id="e-ba88525c-d594-455f-8686-47decd6f9e23" type="button" className="cg-copy-ck-field__add" onClick={addLayer} disabled={layers === 4}><Typography shuku-edit-id="e-08ac5946-701c-4b68-81f4-5ddb95cecc16" as="span" variant="h3" tone="inherit">＋ 添加卷积层</Typography></button>
          <div shuku-edit-id="e-b3ae53bc-dbf3-4f73-97ca-09eec6087308" className="cg-copy-ck-field__rule"><Typography shuku-edit-id="e-96ff3f12-c076-4470-bff8-e61afbf6d6b7" variant="bodySmall" tone="accent">3 × 3 卷积</Typography><Typography shuku-edit-id="e-2b90b5bc-7764-40be-ae51-f6c5bb2a3e64" variant="bodySmall" tone="accent">步长 1 · 无填充</Typography></div>
          <div shuku-edit-id="e-16b4168d-5eb0-4b2d-8043-05f4788dc11a" className="cg-copy-ck-field__actions"><button shuku-edit-id="e-79a4818e-7f8e-4a4f-9d00-31394c54ae6d" type="button" onClick={removeLayer} disabled={layers === 1}><Typography shuku-edit-id="e-6e7ae3f4-76fe-4f6e-a046-549aa13c8462" as="span" variant="bodySmall" tone="inherit">减少一层</Typography></button><button shuku-edit-id="e-18585829-1ad6-432c-9546-6883d19514d2" type="button" onClick={() => setResetViewToken((current) => current + 1)}><Typography shuku-edit-id="e-c2d32ce2-96b9-4f94-a57d-cae7374daea1" as="span" variant="bodySmall" tone="inherit">重置视角</Typography></button></div>
        </section>
        <section shuku-edit-id="e-637d0ce9-0c41-488f-93d3-174adf8026bf" className="cg-copy-ck-field__observation">
          <Typography shuku-edit-id="e-9065eba2-7dc1-44ee-9abe-84c5f86c00bd" as="h2" variant="h3" tone="accent">当前观察</Typography>
          <div shuku-edit-id="e-108dea1c-78c1-4934-b494-7774b71e1310" className="cg-copy-ck-field__observation-list">
            {observations.map((level) => <div shuku-edit-id="e-ce511020-6591-4af9-a3df-6e509f8c03cb" key={level} className="cg-copy-ck-field__observation-row"><Typography shuku-edit-id="e-e7fd1087-3b74-4a49-842f-f1dbf1e44da6" variant="bodySmall" tone="accent">{nameOf(level)}</Typography><Typography shuku-edit-id="e-a0c015c5-58e1-45da-9342-d05502cfbccb" variant="bodySmall" tone="accent">{1 + 2 * (selected.level - level)} × {1 + 2 * (selected.level - level)}</Typography></div>)}
          </div>
          <div shuku-edit-id="e-3684cdd5-a659-4a87-a6ae-fabea892361e" className="cg-copy-ck-field__takeaway"><Typography shuku-edit-id="e-4c095240-e200-4eda-9e13-e9fbec69defe" variant="bodySmall" tone="accent">每多经过一层 3 × 3 卷积，感受野边长增加 2。</Typography></div>
        </section>
      </aside>
    </div>
  </ContentBlock>;
}
