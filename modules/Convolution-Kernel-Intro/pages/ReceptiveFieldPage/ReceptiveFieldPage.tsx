import { useState } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
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

  return <ContentBlock headingLevel={1} className="ck-field" title="卷积核的堆叠与感受野" subtitle="点选任一特征位置，观察它在每个下层对应的范围；拖动模型可旋转，滚轮可缩放。">
    <div className="ck-field__layout">
      <section className="ck-field__visual" aria-label="卷积层叠模型">
        <div className="ck-field__visual-hint"><Typography variant="bodySmall" tone="muted">点击格子选位置 · 拖动旋转 · 滚轮缩放</Typography></div>
        <ReceptiveFieldScene layers={layers} selected={selected} onSelect={setSelected} resetViewToken={resetViewToken} />
      </section>
      <aside className="ck-field__aside">
        <section className="ck-field__controls">
          <button type="button" className="ck-field__add" onClick={addLayer} disabled={layers === 4}><Typography as="span" variant="h3" tone="inherit">＋ 添加卷积层</Typography></button>
          <div className="ck-field__rule"><Typography variant="bodySmall" tone="accent">3 × 3 卷积</Typography><Typography variant="bodySmall" tone="accent">步长 1 · 无填充</Typography></div>
          <div className="ck-field__actions"><button type="button" onClick={removeLayer} disabled={layers === 1}><Typography as="span" variant="bodySmall" tone="inherit">减少一层</Typography></button><button type="button" onClick={() => setResetViewToken((current) => current + 1)}><Typography as="span" variant="bodySmall" tone="inherit">重置视角</Typography></button></div>
        </section>
        <section className="ck-field__observation">
          <Typography as="h2" variant="h3" tone="accent">当前观察</Typography>
          <div className="ck-field__observation-list">
            {observations.map((level) => <div key={level} className="ck-field__observation-row"><Typography variant="bodySmall" tone="accent">{nameOf(level)}</Typography><Typography variant="bodySmall" tone="accent">{1 + 2 * (selected.level - level)} × {1 + 2 * (selected.level - level)}</Typography></div>)}
          </div>
          <div className="ck-field__takeaway"><Typography variant="bodySmall" tone="accent">每多经过一层 3 × 3 卷积，感受野边长增加 2。</Typography></div>
        </section>
      </aside>
    </div>
  </ContentBlock>;
}
