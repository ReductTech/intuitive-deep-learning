import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography, moduleAssetUrl } from '../../../shared/react';
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
  return <canvas ref={ref} width={size} height={size} onPointerMove={onPoint ? event => {
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
    image.src = moduleAssetUrl('80396753-7fc8-4f55-9188-bddbdb828169', 'mnist/5/60015.png');
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
    return <div className={`vfl-unit-fan ${output ? 'is-output' : ''}`}>{maps.map((map,c) => <Button variant="default" key={c} aria-label={`${STEPS[index]}特征图，通道 ${c+1}`} aria-pressed={channel === c} onClick={() => setChannel(c)} className={`vfl-unit-plane ${channel === c ? 'is-selected' : ''}`} style={{'--channel':c} as CSSProperties}><Texture values={index === 0 ? map.raw : index === 1 ? map.activated : map.pooled} size={index === 2 ? 13 : 26} mode={index === 0 ? 'signed' : 'positive'} range={map.range}/></Button>)}</div>;
  }
  return <ContentBlock className="vfl-unit-page" headingLevel={1} title="卷积网络中的一层" subtitle="卷积、激活与池化配合，把输入图像变成新的特征图。">
    <div className="vfl-unit-scene">
      <section className="vfl-unit-input-card"><Typography as="h2" variant="h3" tone="accent">输入</Typography><MathFormulaBlock><MathFormulaStatic latex={'28\\times28\\times1'}/></MathFormulaBlock><div className="vfl-unit-input-plane">{pixels && <Texture values={pixels} size={28} mode="input" range={1}/>}</div></section>
      <span className="vfl-unit-flow-arrow" aria-hidden="true">→</span>
      <section className="vfl-unit-layer">
        <div className="vfl-unit-layer-title"><Typography variant="h2" tone="inherit">卷积层</Typography></div>
        <div className="vfl-unit-layer-parts">
          {STEPS.map((name,index) => <section className={`vfl-unit-part vfl-unit-part-${index}`} key={name}>
            <Typography as="h2" variant="h3" tone={index === 1 ? 'warning' : index === 2 ? 'success' : 'accent'}>{name}</Typography>
            <MathFormulaBlock><MathFormulaStatic latex={index === 2 ? '13\\times13\\times4' : '26\\times26\\times4'}/></MathFormulaBlock>
            <div className="vfl-unit-visual">
              {index === 0 && <div className="vfl-unit-kernel-stack" role="group" aria-label="选择四个卷积核">{KERNELS.map((kernel,c) => <Button key={kernel.name} className={channel === c ? 'is-selected' : ''} aria-label={`选择通道 ${c+1}：${kernel.name}`} aria-pressed={channel === c} onClick={() => setChannel(c)}><Texture values={kernel.weights} size={3} mode="signed" range={Math.max(...kernel.weights.map(Math.abs))}/></Button>)}</div>}
              {fan(index)}
            </div>
            <Typography variant="bodySmall" tone={index === 1 ? 'warning' : index === 2 ? 'success' : 'accent'}>{NOTES[index]}</Typography>
          </section>)}
        </div>
      </section>
      <span className="vfl-unit-flow-arrow" aria-hidden="true">→</span>
      <section className="vfl-unit-output-card"><Typography as="h2" variant="h3" tone="accent">输出特征图</Typography><MathFormulaBlock><MathFormulaStatic latex={'13\\times13\\times4'}/></MathFormulaBlock>{fan(2,true)}</section>
    </div>
    <div className="vfl-unit-footer">
      <div><Typography variant="bodySmall" tone="accent">卷积</Typography><Typography variant="bodySmall" tone="muted">提取局部模式</Typography></div>
      <div><Typography variant="bodySmall" tone="warning">激活</Typography><Typography variant="bodySmall" tone="muted">筛选有效响应</Typography></div>
      <div><Typography variant="bodySmall" tone="success">池化</Typography><Typography variant="bodySmall" tone="muted">汇聚局部响应</Typography></div>
      <Typography variant="bodySmall" tone="accent">三者常配合，构成一层</Typography>
    </div>
    {error && <Typography variant="bodySmall" tone="danger">图像加载失败</Typography>}
  </ContentBlock>;
}
