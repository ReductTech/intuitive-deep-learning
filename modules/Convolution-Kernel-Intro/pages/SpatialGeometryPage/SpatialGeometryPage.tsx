import { useState, type CSSProperties } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import './SpatialGeometryPage.css';

type Variant = 'stride' | 'padding';
const INPUT_SIZE = 7;
const KERNEL_SIZE = 3;

function InputGrid({ padding, stride, outputSize, selectedIndex }: { padding: number; stride: number; outputSize: number; selectedIndex: number }) {
  const size = INPUT_SIZE + padding * 2;
  const top = Math.floor(selectedIndex / outputSize) * stride;
  const left = (selectedIndex % outputSize) * stride;
  return <div className="ck-spatial__input-grid" style={{ '--grid-size': size } as CSSProperties} role="img" aria-label={`${size}乘${size}网格，其中原图为7乘7，补零宽度${padding}，卷积窗口位于第${top + 1}行第${left + 1}列`}>
    {Array.from({ length: size * size }, (_, index) => {
      const row = Math.floor(index / size);
      const col = index % size;
      const isPadding = row < padding || col < padding || row >= size - padding || col >= size - padding;
      const inWindow = row >= top && row < top + KERNEL_SIZE && col >= left && col < left + KERNEL_SIZE;
      return <span key={index} className={`${isPadding ? 'is-padding' : ''} ${inWindow ? 'is-window' : ''}`} />;
    })}
    <span className="ck-spatial__window-outline" style={{ left: `${left / size * 100}%`, top: `${top / size * 100}%`, width: `${KERNEL_SIZE / size * 100}%`, height: `${KERNEL_SIZE / size * 100}%` }} />
  </div>;
}

function OutputGrid({ size, selectedIndex, onSelect }: { size: number; selectedIndex: number; onSelect: (index: number) => void }) {
  return <div className="ck-spatial__output-grid" style={{ '--grid-size': size } as CSSProperties} role="group" aria-label={`${size}乘${size}输出特征图，点击位置查看对应输入窗口`}>
    {Array.from({ length: size * size }, (_, index) => <button key={index} type="button" className={index === selectedIndex ? 'is-selected' : ''} aria-label={`输出第${Math.floor(index / size) + 1}行第${index % size + 1}列`} aria-pressed={index === selectedIndex} onClick={() => onSelect(index)} />)}
  </div>;
}

export function SpatialGeometryPage({ variant }: { variant: Variant }) {
  const isStride = variant === 'stride';
  const [value, setValue] = useState(isStride ? 2 : 1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const stride = isStride ? value : 1;
  const padding = isStride ? 0 : value;
  const paddedSize = INPUT_SIZE + 2 * padding;
  const outputSize = Math.floor((paddedSize - KERNEL_SIZE) / stride) + 1;
  const total = outputSize * outputSize;
  const options = isStride ? [1, 2, 3] : [0, 1, 2];
  const chooseValue = (next: number) => { setValue(next); setSelectedIndex(0); };
  const move = (direction: -1 | 1) => setSelectedIndex((current) => (current + direction + total) % total);
  const formula = String.raw`N_{\mathrm{out}}=\left\lfloor\frac{7+2\times ${padding}-3}{${stride}}\right\rfloor+1=${outputSize}`;
  const title = isStride ? '卷积步长' : '边界填充';
  const subtitle = isStride
    ? '固定 7 × 7 输入、3 × 3 卷积核与 Valid；步长决定相邻窗口的移动间隔。'
    : '固定 7 × 7 输入、3 × 3 卷积核与步长 1；在边界外补零，观察输出尺寸如何变化。';

  return <ContentBlock headingLevel={1} className="ck-spatial" title={title} subtitle={subtitle}>
    <div className="ck-spatial__workspace">
      <section className="ck-spatial__picker" aria-label={isStride ? '选择卷积步长' : '选择补零层数'}>
        <Typography as="h2" variant="h3" tone="accent">{isStride ? '步长 S' : '填充 P'}</Typography>
        <div className="ck-spatial__choices" role="group" aria-label={isStride ? '步长' : '每侧补零层数'}>
          {options.map((option) => <button key={option} type="button" className={value === option ? 'is-selected' : ''} aria-pressed={value === option} onClick={() => chooseValue(option)}><Typography as="span" variant="h2" tone="inherit">{option}</Typography></button>)}
        </div>
        <div className="ck-spatial__stepper" role="group" aria-label="移动卷积窗口">
          <button type="button" onClick={() => move(-1)} aria-label="上一个输出位置"><Typography as="span" variant="bodySmall" tone="inherit">←</Typography></button>
          <Typography variant="bodySmall" tone="muted">{selectedIndex + 1} / {total}</Typography>
          <button type="button" onClick={() => move(1)} aria-label="下一个输出位置"><Typography as="span" variant="bodySmall" tone="inherit">→</Typography></button>
        </div>
      </section>

      <section className="ck-spatial__input-stage" aria-label="输入网格与当前卷积窗口">
        <Typography as="h2" variant="h3" tone="accent">输入网格 7 × 7</Typography>
        <Typography variant="bodySmall" tone="muted">{padding > 0 ? '浅蓝色为边界外补的零' : '不补零，窗口仅在原图内移动'}</Typography>
        <InputGrid padding={padding} stride={stride} outputSize={outputSize} selectedIndex={selectedIndex} />
        <Typography variant="bodySmall" tone="accent">{isStride ? `3 × 3 窗口每次移动 ${stride} 格` : `每侧补零 ${padding} 层 · 3 × 3 窗口`}</Typography>
      </section>

      <div className="ck-spatial__right">
        <section className="ck-spatial__output-stage" aria-label="输出特征图">
          <Typography as="h2" variant="h3" tone="accent">输出特征图 {outputSize} × {outputSize}</Typography>
          <OutputGrid size={outputSize} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
          <Typography variant="bodySmall" tone="muted">点选输出位置，查看对应的输入窗口</Typography>
        </section>
        <section className="ck-spatial__formula-stage" aria-label="输出尺寸计算">
          <Typography as="h2" variant="h3" tone="accent">输出尺寸</Typography>
          <MathFormulaBlock ariaLabel={`输出边长等于向下取整的七加两倍${padding}减三除以${stride}，再加一，结果为${outputSize}`}><MathFormulaStatic latex={formula} /></MathFormulaBlock>
          <Typography variant="bodySmall" tone="muted">{isStride ? 'Valid：P = 0' : '步长：S = 1'} · 输入 7 × 7 · 卷积核 3 × 3</Typography>
        </section>
      </div>
    </div>
  </ContentBlock>;
}
