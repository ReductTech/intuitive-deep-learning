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

  return <ContentBlock shuku-edit-id="e-8a697a03-26d4-4f34-9952-7814c90cdaec" headingLevel={1} className="ck-field" title="卷积核的堆叠与感受野" subtitle="点选任一特征位置，观察它在每个下层对应的范围；拖动模型可旋转，滚轮可缩放。">
    <div shuku-edit-id="e-74bba696-0bf6-47a3-9af9-75284fc0a0cb" className="ck-field__layout">
      <section shuku-edit-id="e-79a5feac-1e54-4cf0-ad2a-ad8170505d30" className="ck-field__visual" aria-label="卷积层叠模型">
        <div shuku-edit-id="e-5c6fd872-09bb-4c08-84f9-d5bd4272d75b" className="ck-field__visual-hint"><Typography shuku-edit-id="e-5e3dc0cd-8215-461b-9929-f90016492f46" variant="bodySmall" tone="muted">点击格子选位置 · 拖动旋转 · 滚轮缩放</Typography></div>
        <ReceptiveFieldScene layers={layers} selected={selected} onSelect={setSelected} resetViewToken={resetViewToken} />
      </section>
      <aside shuku-edit-id="e-84b83235-24a1-400e-9928-3b967b9f4593" className="ck-field__aside">
        <section shuku-edit-id="e-46bec4c1-7d4a-4e00-aa46-340bc3cc28de" className="ck-field__controls">
          <button shuku-edit-id="e-2effc69c-14a4-4d1e-828b-7c049ec6d94c" type="button" className="ck-field__add" onClick={addLayer} disabled={layers === 4}><Typography shuku-edit-id="e-69e7645f-977a-4b08-8d49-70b3b619cb3c" as="span" variant="h3" tone="inherit">＋ 添加卷积层</Typography></button>
          <div shuku-edit-id="e-62fe21cf-b724-4a1d-9ad0-fed69a7fcd74" className="ck-field__rule"><Typography shuku-edit-id="e-eef9db42-a4c9-4b85-b29f-a4fd7c4899e6" variant="bodySmall" tone="accent">3 × 3 卷积</Typography><Typography shuku-edit-id="e-f52dcac4-2204-4944-9ebe-d42ae2dd33a2" variant="bodySmall" tone="accent">步长 1 · 无填充</Typography></div>
          <div shuku-edit-id="e-17831dcc-2e06-435a-9361-25a8bbcc9d65" className="ck-field__actions"><button shuku-edit-id="e-fdfa206e-da69-4b50-a2ba-7cb686f9e7c2" type="button" onClick={removeLayer} disabled={layers === 1}><Typography shuku-edit-id="e-f6f62791-0944-4da3-9bcf-5692d209f910" as="span" variant="bodySmall" tone="inherit">减少一层</Typography></button><button shuku-edit-id="e-cb49c72c-a812-49a9-aeac-68fd21c15d26" type="button" onClick={() => setResetViewToken((current) => current + 1)}><Typography shuku-edit-id="e-327206bb-d78b-48d6-beb2-a60b76950207" as="span" variant="bodySmall" tone="inherit">重置视角</Typography></button></div>
        </section>
        <section shuku-edit-id="e-a1eeb429-0d9e-4f88-ae14-233834d3af2f" className="ck-field__observation">
          <Typography shuku-edit-id="e-6607fe8f-d526-4a04-af70-f5f53dc94376" as="h2" variant="h3" tone="accent">当前观察</Typography>
          <div shuku-edit-id="e-aa417b98-b0fc-4bb8-ab4d-94f63ae8444d" className="ck-field__observation-list">
            {observations.map((level) => <div shuku-edit-id="e-e23012bb-fd03-4a82-9ed0-80c748946d2d" key={level} className="ck-field__observation-row"><Typography shuku-edit-id="e-cf600fd0-2181-406a-840f-467705738d5f" variant="bodySmall" tone="accent">{nameOf(level)}</Typography><Typography shuku-edit-id="e-c0a7dc1b-af5d-47c0-868f-582a2011fd9d" variant="bodySmall" tone="accent">{1 + 2 * (selected.level - level)} × {1 + 2 * (selected.level - level)}</Typography></div>)}
          </div>
          <div shuku-edit-id="e-de2ed9bf-f1ab-4e00-935e-5023e6287d0e" className="ck-field__takeaway"><Typography shuku-edit-id="e-214d7295-12ea-4a9a-a76f-08f0b9915f2a" variant="bodySmall" tone="accent">每多经过一层 3 × 3 卷积，感受野边长增加 2。</Typography></div>
        </section>
      </aside>
    </div>
  </ContentBlock>;
}
