import { useState } from 'react';
import type { CSSProperties } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import './ReceptiveFieldPage.css';

const layerLabels = ['输入图像', '第 1 层', '第 2 层', '第 3 层'];

function Plane({ level, selected, onSelect }: { level: number; selected: boolean; onSelect: () => void }) {
  const size = level === 0 ? 11 : level === 1 ? 9 : level === 2 ? 7 : 5;
  const hotSize = Math.min(size, 3 + level * 2);
  return <button type="button" className={`ck-field__plane ck-field__plane--${level} ${selected ? 'is-selected' : ''}`} onMouseEnter={onSelect} onFocus={onSelect} aria-label={`${layerLabels[level]}，感受野高亮区域`} style={{ '--plane-size': size, '--hot-size': hotSize } as CSSProperties}>{Array.from({ length: size * size }, (_, index) => { const row = Math.floor(index / size); const col = index % size; const offset = Math.floor((size - hotSize) / 2); return <span key={index} className={row >= offset && row < offset + hotSize && col >= offset && col < offset + hotSize ? 'is-hot' : ''} />; })}</button>;
}

export function ReceptiveFieldPage() {
  const [layers, setLayers] = useState(2);
  const [selected, setSelected] = useState(2);
  const addLayer = () => { setLayers((current) => Math.min(3, current + 1)); setSelected((current) => Math.min(3, current + 1)); };
  return <ContentBlock headingLevel={1} className="ck-field" title="卷积核的堆叠与感受野" subtitle="层数增加后，上层一个位置对应下层更大的输入范围。">
    <div className="ck-field__layout"><section className="ck-field__visual"><div className="ck-field__stack">{Array.from({ length: layers + 1 }, (_, index) => { const level = layers - index; return <div className="ck-field__layer" key={level}><div className="ck-field__layer-label"><Typography variant="bodySmall" tone="accent">{layerLabels[level]}</Typography><Typography variant="bodySmall" tone="muted">特征图</Typography></div><Plane level={level} selected={selected === level} onSelect={() => setSelected(level)} />{level > 0 && <Typography as="span" variant="bodySmall" tone="accent" className="ck-field__kernel-label">3×3 卷积</Typography>}</div>; })}</div><button type="button" className="ck-field__add" onClick={addLayer} disabled={layers === 3}><span aria-hidden="true">+</span><Typography as="span" variant="body" tone="inherit">添加卷积层</Typography></button></section><aside className="ck-field__aside"><section><header><span aria-hidden="true">⌁</span><Typography as="h2" variant="h3" tone="accent">交互方式</Typography></header><ol><li>悬停上层网格，查看下层感受野</li><li>点击“添加卷积层”，继续堆叠</li></ol></section><section><header><span aria-hidden="true">○</span><Typography as="h2" variant="h3" tone="accent">你会看到</Typography></header><ol><li>层数越多，感受野越大</li><li>前面学局部，后面看更大范围</li></ol></section></aside></div><footer className="ck-field__summary"><Typography as="span" variant="h3" tone="accent">堆叠卷积核的意义：</Typography><Typography variant="body">在保持局部建模的同时，逐步扩大感受野。</Typography></footer>
  </ContentBlock>;
}
