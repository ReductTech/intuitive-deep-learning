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

  return <ContentBlock shuku-edit-id="e-6dc1bd9d-b6d0-40ed-942a-5b9f4e371b56" headingLevel={1} className="aipe-replay-cg-copy-ck-field" title="卷积核的堆叠与感受野" subtitle="点选任一特征位置，观察它在每个下层对应的范围；拖动模型可旋转，滚轮可缩放。">
    <div shuku-edit-id="e-d853c638-a4e3-4d65-b39d-41457bbd9b54" className="aipe-replay-cg-copy-ck-field__layout">
      <section shuku-edit-id="e-d2f9439a-b398-4437-ac1a-7fba7df70060" className="aipe-replay-cg-copy-ck-field__visual" aria-label="卷积层叠模型">
        <div shuku-edit-id="e-5412630e-a63d-4ee9-bc23-dbb12446ef74" className="aipe-replay-cg-copy-ck-field__visual-hint"><Typography shuku-edit-id="e-1497abb1-4740-4a47-915a-02f8126cac4b" variant="bodySmall" tone="muted">点击格子选位置 · 拖动旋转 · 滚轮缩放</Typography></div>
        <ReceptiveFieldScene layers={layers} selected={selected} onSelect={setSelected} resetViewToken={resetViewToken} />
      </section>
      <aside shuku-edit-id="e-1ad5c4fd-67f2-4ef2-9169-2fab805ededc" className="aipe-replay-cg-copy-ck-field__aside">
        <section shuku-edit-id="e-cdd14bbc-926b-4e83-87f7-cd156298be51" className="aipe-replay-cg-copy-ck-field__controls">
          <button shuku-edit-id="e-2b2a69fa-3ba0-4e48-a111-a946881fb1cd" type="button" className="aipe-replay-cg-copy-ck-field__add" onClick={addLayer} disabled={layers === 4}><Typography shuku-edit-id="e-178e4ba9-766e-4e33-b752-f4ca56df8ecc" as="span" variant="h3" tone="inherit">＋ 添加卷积层</Typography></button>
          <div shuku-edit-id="e-c57221ba-96c9-41ec-96e8-037e11acd3fa" className="aipe-replay-cg-copy-ck-field__rule"><Typography shuku-edit-id="e-3c5e6af0-cebc-4d31-b939-3e6c65d8ef33" variant="bodySmall" tone="accent">3 × 3 卷积</Typography><Typography shuku-edit-id="e-d2ad31a8-d1c1-4c89-832f-75620bed135d" variant="bodySmall" tone="accent">步长 1 · 无填充</Typography></div>
          <div shuku-edit-id="e-6af49285-ce53-4c36-9479-4858879ba360" className="aipe-replay-cg-copy-ck-field__actions"><button shuku-edit-id="e-59eae362-7f7e-4a8e-adfe-8ad35b51f290" type="button" onClick={removeLayer} disabled={layers === 1}><Typography shuku-edit-id="e-cfd11576-b1c5-404b-9f6e-3c82ec17e962" as="span" variant="bodySmall" tone="inherit">减少一层</Typography></button><button shuku-edit-id="e-1b74f3ea-c908-4b8e-8035-98c90fb676eb" type="button" onClick={() => setResetViewToken((current) => current + 1)}><Typography shuku-edit-id="e-20afae58-815d-491b-9a69-ef6e3a11d393" as="span" variant="bodySmall" tone="inherit">重置视角</Typography></button></div>
        </section>
        <section shuku-edit-id="e-a222b862-d912-40a2-b054-ffcf56103f98" className="aipe-replay-cg-copy-ck-field__observation">
          <Typography shuku-edit-id="e-018ad12d-3098-4927-976d-f353793f12f8" as="h2" variant="h3" tone="accent">当前观察</Typography>
          <div shuku-edit-id="e-6cc72b7b-65e6-47db-b577-9786b28357d5" className="aipe-replay-cg-copy-ck-field__observation-list">
            {observations.map((level) => <div shuku-edit-id="e-4983fbfd-975f-4620-bb14-828f3bdd05eb" key={level} className="aipe-replay-cg-copy-ck-field__observation-row"><Typography shuku-edit-id="e-e232e8ab-e43b-4989-90de-1cda95ee1433" variant="bodySmall" tone="accent">{nameOf(level)}</Typography><Typography shuku-edit-id="e-e86a0975-f55e-42be-a982-f7d83f34c1c2" variant="bodySmall" tone="accent">{1 + 2 * (selected.level - level)} × {1 + 2 * (selected.level - level)}</Typography></div>)}
          </div>
          <div shuku-edit-id="e-82b7e93e-8959-4e9a-83f6-22d46e68bc15" className="aipe-replay-cg-copy-ck-field__takeaway"><Typography shuku-edit-id="e-c10234a7-6249-4d70-925e-cc8fc6b362a6" variant="bodySmall" tone="accent">每多经过一层 3 × 3 卷积，感受野边长增加 2。</Typography></div>
        </section>
      </aside>
    </div>
  </ContentBlock>;
}
