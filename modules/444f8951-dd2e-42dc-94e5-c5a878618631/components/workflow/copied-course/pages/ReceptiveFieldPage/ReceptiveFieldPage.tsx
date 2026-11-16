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

  return <ContentBlock shuku-edit-id="e-989e1100-789d-42a0-a741-0c303353f290" headingLevel={1} className="cg-copy-ck-field" title="卷积核的堆叠与感受野" subtitle="点选任一特征位置，观察它在每个下层对应的范围；拖动模型可旋转，滚轮可缩放。">
    <div shuku-edit-id="e-b08880d5-13cc-4abf-8659-513e0d231bec" className="cg-copy-ck-field__layout">
      <section shuku-edit-id="e-b51a496f-e663-42f1-829f-a3b4332c4a65" className="cg-copy-ck-field__visual" aria-label="卷积层叠模型">
        <div shuku-edit-id="e-976e9e16-0a41-4379-92bd-14de05fac0f7" className="cg-copy-ck-field__visual-hint"><Typography shuku-edit-id="e-d4a759bb-2ae7-4e31-9a83-336fb0a14c89" variant="bodySmall" tone="muted">点击格子选位置 · 拖动旋转 · 滚轮缩放</Typography></div>
        <ReceptiveFieldScene layers={layers} selected={selected} onSelect={setSelected} resetViewToken={resetViewToken} />
      </section>
      <aside shuku-edit-id="e-f0463eb8-bc68-452c-9087-141712581447" className="cg-copy-ck-field__aside">
        <section shuku-edit-id="e-a19880b6-2ea3-4e44-bdf0-360bed079a65" className="cg-copy-ck-field__controls">
          <button shuku-edit-id="e-86b415f4-3991-4af8-8167-de2bf6c4ba47" type="button" className="cg-copy-ck-field__add" onClick={addLayer} disabled={layers === 4}><Typography shuku-edit-id="e-949698bc-96ef-4456-bfb7-9db62cb91509" as="span" variant="h3" tone="inherit">＋ 添加卷积层</Typography></button>
          <div shuku-edit-id="e-bdd7d838-afd7-4755-9aeb-4816215c3528" className="cg-copy-ck-field__rule"><Typography shuku-edit-id="e-9d695b0f-0770-4999-923a-bf239fc2402b" variant="bodySmall" tone="accent">3 × 3 卷积</Typography><Typography shuku-edit-id="e-94868cc8-159a-4386-8b5f-9c15573c9474" variant="bodySmall" tone="accent">步长 1 · 无填充</Typography></div>
          <div shuku-edit-id="e-5c586ef0-7c8d-4ff5-9edf-69bc632ab739" className="cg-copy-ck-field__actions"><button shuku-edit-id="e-aa552781-1981-44a1-bf47-6f57114f650e" type="button" onClick={removeLayer} disabled={layers === 1}><Typography shuku-edit-id="e-3b570a2f-985b-4491-8d6c-3146aaaef7b4" as="span" variant="bodySmall" tone="inherit">减少一层</Typography></button><button shuku-edit-id="e-f2b69b50-832a-4dcc-82f6-a02b37400ce2" type="button" onClick={() => setResetViewToken((current) => current + 1)}><Typography shuku-edit-id="e-91243356-1e14-4660-804a-81145a74de64" as="span" variant="bodySmall" tone="inherit">重置视角</Typography></button></div>
        </section>
        <section shuku-edit-id="e-bff76adb-4764-4cb7-8ea8-e886d457711d" className="cg-copy-ck-field__observation">
          <Typography shuku-edit-id="e-b4f08d71-c48c-4bfb-b744-9a582f104cdc" as="h2" variant="h3" tone="accent">当前观察</Typography>
          <div shuku-edit-id="e-b90a7fe8-c30e-4fd5-8fc0-df8da5d448d7" className="cg-copy-ck-field__observation-list">
            {observations.map((level) => <div shuku-edit-id="e-c842c5d1-704a-4e2f-a482-ff34a97e63cf" key={level} className="cg-copy-ck-field__observation-row"><Typography shuku-edit-id="e-f1e79951-2ab3-4a66-a607-fda1f06235fb" variant="bodySmall" tone="accent">{nameOf(level)}</Typography><Typography shuku-edit-id="e-0be3c5cd-5dea-45f3-b6c4-c12bf71e2a2a" variant="bodySmall" tone="accent">{1 + 2 * (selected.level - level)} × {1 + 2 * (selected.level - level)}</Typography></div>)}
          </div>
          <div shuku-edit-id="e-9ee20129-9dc6-403a-a583-219ba34192fc" className="cg-copy-ck-field__takeaway"><Typography shuku-edit-id="e-4729a928-7866-49cd-9cc9-b5309f076a0d" variant="bodySmall" tone="accent">每多经过一层 3 × 3 卷积，感受野边长增加 2。</Typography></div>
        </section>
      </aside>
    </div>
  </ContentBlock>;
}
