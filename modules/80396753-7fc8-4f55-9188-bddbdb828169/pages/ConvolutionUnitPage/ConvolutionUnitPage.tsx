import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './ConvolutionUnitPage.css';

const KERNELS = [
  { name: '竖直变化', weights: [-1, 0, 1, -2, 0, 2, -1, 0, 1] },
  { name: '水平变化', weights: [-1, -2, -1, 0, 0, 0, 1, 2, 1] },
  { name: '斜向变化', weights: [0, 1, 2, -1, 0, 1, -2, -1, 0] },
  { name: '局部墨迹', weights: [0, .125, 0, .125, .5, .125, 0, .125, 0] },
];
const STEPS = ['卷积', '激活', '池化'];
const NOTES = ['4 个核 → 4 个通道', '保留正响应', '缩小空间，保留通道'];
type Mode = 'input' | 'signed' | 'positive';

function Texture({ values, size, mode, range, onPoint }: { values: number[]; size: number; mode: Mode; range: number; onPoint?: (x: number, y: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = ref.current?.getContext('2d');
    if (!context) return;
    const data = context.createImageData(size, size);
    values.forEach((value, i) => {
      const amount = Math.min(1, Math.abs(value) / range);
      const color = mode === 'input' ? [value * 255, value * 255, value * 255]
        : mode === 'signed' && value < 0 ? [12, 24 + amount * 50, 48 + amount * 170]
        : [15 + Math.max(0, amount - .45) / .55 * 240, 22 + amount * 210, 45 + amount * 40 - amount * amount * 65];
      color.forEach((v, c) => { data.data[i * 4 + c] = v; });
      data.data[i * 4 + 3] = 255;
    });
    context.putImageData(data, 0, 0);
  }, [values, size, mode, range]);
  return <canvas shuku-edit-id="e-a8d888f1-f73b-40f8-8092-a6735527d69d" ref={ref} width={size} height={size} onPointerMove={onPoint ? event => {
    onPoint(Math.min(size - 1, Math.max(0, Math.floor(event.nativeEvent.offsetX / event.currentTarget.clientWidth * size))), Math.min(size - 1, Math.max(0, Math.floor(event.nativeEvent.offsetY / event.currentTarget.clientHeight * size))));
  } : undefined} />;
}

export function ConvolutionUnitPage() {
  const [pixels, setPixels] = useState<number[] | null>(null);
  const [error, setError] = useState(false);
  const [channel, setChannel] = useState(0);
  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 28;
      const context = canvas.getContext('2d');
      if (!context) { if (active) setError(true); return; }
      context.drawImage(image, 0, 0);
      const rgba = context.getImageData(0, 0, 28, 28).data;
      if (active) setPixels(Array.from({ length: 784 }, (_, i) => rgba[i * 4] / 255));
    };
    image.onerror = () => { if (active) setError(true); };
    image.src = moduleAssetUrl("mnist/5/60015.webp");
    return () => { active = false; };
  }, []);
  const maps = useMemo(() => pixels ? KERNELS.map(kernel => {
    const raw = Array.from({ length: 676 }, (_, i) => kernel.weights.reduce((sum, w, k) => sum + w * pixels[(Math.floor(i / 26) + Math.floor(k / 3)) * 28 + i % 26 + k % 3], 0));
    const activated = raw.map(v => Math.max(0, v));
    const pooled = Array.from({ length: 169 }, (_, i) => {
      const top = Math.floor(i / 13) * 52 + i % 13 * 2;
      return Math.max(activated[top], activated[top + 1], activated[top + 26], activated[top + 27]);
    });
    return { raw, activated, pooled, range: Math.max(.001, ...raw.map(Math.abs)) };
  }) : [], [pixels]);
  function fan(index: number, output = false) {
    return <div shuku-edit-id="e-b3b38a34-90e5-4d13-b728-7b51a561e3cb" className={`vfl-unit-fan ${output ? 'is-output' : ''}`}>{maps.map((map,c) => <Button variant="default" key={c} aria-label={`${STEPS[index]}特征图，通道 ${c+1}`} aria-pressed={channel === c} onClick={() => setChannel(c)} className={`vfl-unit-plane ${channel === c ? 'is-selected' : ''}`} style={{'--channel':c} as CSSProperties}><Texture values={index === 0 ? map.raw : index === 1 ? map.activated : map.pooled} size={index === 2 ? 13 : 26} mode={index === 0 ? 'signed' : 'positive'} range={map.range}/></Button>)}</div>;
  }
  return <ContentBlock shuku-edit-id="e-ca5407f8-d6f3-42d8-86ce-9c5cfe02146b" className="vfl-unit-page" headingLevel={1} title="卷积网络中的一层" subtitle="卷积、激活与池化配合，把输入图像变成新的特征图。">
    <div shuku-edit-id="e-144864f5-3ad0-4d09-b0e3-009c1604e8b1" className="vfl-unit-scene">
      <section shuku-edit-id="e-dd53c89c-04f5-41d4-b1ee-c09ad62df9a2" className="vfl-unit-input-card"><Typography shuku-edit-id="e-8ea56162-d88e-46c2-bd65-61e5973860da" as="h2" variant="h3" tone="accent">输入</Typography><MathFormulaBlock><MathFormulaStatic latex={'28\\times28\\times1'}/></MathFormulaBlock><div shuku-edit-id="e-31ffaf45-db62-45a8-a3f6-3d275a7700e5" className="vfl-unit-input-plane">{pixels && <Texture values={pixels} size={28} mode="input" range={1}/>}</div></section>
      <span shuku-edit-id="e-762dc8ab-871c-4ec5-bdd7-354faa0a2c38" className="vfl-unit-flow-arrow" aria-hidden="true">→</span>
      <section shuku-edit-id="e-4f460d9e-3625-4c74-82c1-a8d5954b7228" className="vfl-unit-layer">
        <div shuku-edit-id="e-6e9d7e73-e656-46b9-93ab-5309f386bfa4" className="vfl-unit-layer-title"><Typography shuku-edit-id="e-32ffc6d8-8cdb-4ee4-8fdb-8907efde7e17" variant="h2" tone="inherit">卷积层</Typography></div>
        <div shuku-edit-id="e-a538ca43-95b4-48cc-be0e-dc2e95f3948c" className="vfl-unit-layer-parts">
          {STEPS.map((name,index) => <section shuku-edit-id="e-1babbe02-284e-4563-805b-fb6b1bfd48ba" className={`vfl-unit-part vfl-unit-part-${index}`} key={name}>
            <Typography shuku-edit-id="e-3541f73f-dea4-4a78-8b56-c8a9ef849a7c" as="h2" variant="h3" tone={index === 1 ? 'warning' : index === 2 ? 'success' : 'accent'}>{name}</Typography>
            <MathFormulaBlock><MathFormulaStatic latex={index === 2 ? '13\\times13\\times4' : '26\\times26\\times4'}/></MathFormulaBlock>
            <div shuku-edit-id="e-44b81e62-a075-4126-b3d0-ac0f1619e574" className="vfl-unit-visual">
              {index === 0 && <div shuku-edit-id="e-f7722e4d-cd49-4a89-afe0-c2a2fbc4824f" className="vfl-unit-kernel-stack" role="group" aria-label="选择四个卷积核">{KERNELS.map((kernel,c) => <Button key={kernel.name} className={channel === c ? 'is-selected' : ''} aria-label={`选择通道 ${c+1}：${kernel.name}`} aria-pressed={channel === c} onClick={() => setChannel(c)}><Texture values={kernel.weights} size={3} mode="signed" range={Math.max(...kernel.weights.map(Math.abs))}/></Button>)}</div>}
              {fan(index)}
            </div>
            <Typography shuku-edit-id="e-9813f97f-da83-4e2d-b963-4bedb952a1a9" variant="bodySmall" tone={index === 1 ? 'warning' : index === 2 ? 'success' : 'accent'}>{NOTES[index]}</Typography>
          </section>)}
        </div>
      </section>
      <span shuku-edit-id="e-5e8a4555-6203-44a5-8f85-8314983cfd8a" className="vfl-unit-flow-arrow" aria-hidden="true">→</span>
      <section shuku-edit-id="e-9ef191d9-bb1f-407a-82a4-932bf2188a5f" className="vfl-unit-output-card"><Typography shuku-edit-id="e-1454d595-97fb-412a-a289-c874e8056024" as="h2" variant="h3" tone="accent">输出特征图</Typography><MathFormulaBlock><MathFormulaStatic latex={'13\\times13\\times4'}/></MathFormulaBlock>{fan(2,true)}</section>
    </div>
    <div shuku-edit-id="e-51b2529a-610c-48a1-97ad-55c0eb61710f" className="vfl-unit-footer">
      <div shuku-edit-id="e-1497b16b-ef41-4f02-91ee-b07dae16490c"><Typography shuku-edit-id="e-fc1636de-b0fb-4311-9002-5cad0d9e863e" variant="bodySmall" tone="accent">卷积</Typography><Typography shuku-edit-id="e-eea71943-38aa-4780-9cae-6b44ab118763" variant="bodySmall" tone="muted">提取局部模式</Typography></div>
      <div shuku-edit-id="e-ec9f3322-b8d6-490b-85b3-eb589e5cc8d2"><Typography shuku-edit-id="e-0a41deed-bb43-40fd-b54c-5451eb72a6e3" variant="bodySmall" tone="warning">激活</Typography><Typography shuku-edit-id="e-9da80b97-4f20-43d4-840d-bbe7d9122302" variant="bodySmall" tone="muted">筛选有效响应</Typography></div>
      <div shuku-edit-id="e-b05b3a2a-5d40-4075-8157-4e0c88783d5d"><Typography shuku-edit-id="e-31737325-4ede-483c-ad99-67d23a8e8a13" variant="bodySmall" tone="success">池化</Typography><Typography shuku-edit-id="e-05296715-adc3-4c3f-b0fa-cbc089383328" variant="bodySmall" tone="muted">汇聚局部响应</Typography></div>
      <Typography shuku-edit-id="e-34ae8e94-3618-4e31-9889-5824499377ea" variant="bodySmall" tone="accent">三者常配合，构成一层</Typography>
    </div>
    {error && <Typography shuku-edit-id="e-e49f7ca5-b595-486d-bb3f-92eb2f5ad022" variant="bodySmall" tone="danger">图像加载失败</Typography>}
  </ContentBlock>;
}
