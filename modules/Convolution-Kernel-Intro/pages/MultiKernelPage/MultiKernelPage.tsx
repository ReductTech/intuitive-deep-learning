import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import buildingImage from '../../assets/xiandaijianzhu.png';
import './MultiKernelPage.css';

const channels = [
  { label: 'R', name: '红色', className: 'is-red' },
  { label: 'G', name: '绿色', className: 'is-green' },
  { label: 'B', name: '蓝色', className: 'is-blue' },
] as const;

const kernelValues = [
  ['1', '0', '-1', '1', '0', '-1', '1', '0', '-1'],
  ['0', '1', '0', '1', '-1', '1', '0', '1', '0'],
];

function MiniMatrix({ values, className = '' }: { values: string[]; className?: string }) {
  return <div className={`ck-multi__matrix ${className}`}>{values.map((value, index) => <span key={index}>{value}</span>)}</div>;
}

function KernelStack({ index }: { index: number }) {
  return <div className={`ck-multi__kernel-stack is-kernel-${index + 1}`}>
    <Typography variant="body" tone="accent">K<sub>{index + 1}</sub></Typography>
    {channels.map((channel) => <div className={`ck-multi__kernel-row ${channel.className}`} key={channel.label}>
      <Typography as="span" variant="bodySmall" tone="inherit">{channel.label}</Typography>
      <MiniMatrix values={kernelValues[index]} />
    </div>)}
  </div>;
}

function FeatureMap({ index }: { index: number }) {
  return <div className={`ck-multi__feature-map is-map-${index + 1}`}>
    <Typography as="span" variant="h3" tone="accent">Y<sub>{index + 1}</sub></Typography>
    <div className="ck-multi__response-grid">{Array.from({ length: 35 }, (_, cell) => <span key={cell} className={(cell + index * 4) % 9 === 0 || (cell + index) % 13 === 0 ? 'is-hot' : ''} />)}</div>
  </div>;
}

export function MultiKernelPage() {
  return <ContentBlock headingLevel={1} className="ck-multi" title="多核卷积：一个卷积核，产生一个输出通道" subtitle="输入包含 3 个通道时，每个卷积核都会完整覆盖这 3 个通道；使用多个卷积核，就能得到多张特征图。">
    <div className="ck-multi__flow">
      <section className="ck-multi__panel ck-multi__input">
        <header><Typography as="h2" variant="h3" tone="accent">输入 X</Typography><Typography variant="bodySmall" tone="muted">H × W × 3</Typography></header>
        <div className="ck-multi__image"><img src={buildingImage} alt="彩色输入图像" /></div>
        <div className="ck-multi__layers">{channels.map((channel) => <div className={`ck-multi__layer ${channel.className}`} key={channel.label}><span>{channel.label}</span><i /></div>)}</div>
        <Typography variant="bodySmall" tone="muted">同一位置同时读取 R、G、B 三个通道</Typography>
      </section>
      <Typography as="span" variant="h1" tone="accent" className="ck-multi__arrow" aria-hidden="true">→</Typography>
      <section className="ck-multi__panel ck-multi__kernels">
        <header><Typography as="h2" variant="h3" tone="accent">两个卷积核 K₁、K₂</Typography><Typography variant="bodySmall" tone="muted">每个核的深度 = 3</Typography></header>
        <div className="ck-multi__kernel-pair"><KernelStack index={0} /><KernelStack index={1} /></div>
        <MathFormulaBlock ariaLabel="多核卷积的输出通道关系"><MathFormulaStatic latex={String.raw`K_cinmathbb{R}^{K_h\times K_w\times 3}`} /></MathFormulaBlock>
      </section>
      <Typography as="span" variant="h1" tone="accent" className="ck-multi__arrow" aria-hidden="true">→</Typography>
      <section className="ck-multi__panel ck-multi__output">
        <header><Typography as="h2" variant="h3" tone="accent">输出 Y</Typography><Typography variant="bodySmall" tone="muted">H′ × W′ × 2</Typography></header>
        <div className="ck-multi__feature-pair"><FeatureMap index={0} /><FeatureMap index={1} /></div>
        <div className="ck-multi__output-stack"><span /><span /></div>
        <Typography variant="bodySmall" tone="accent">2 个卷积核 → 2 张特征图</Typography>
      </section>
    </div>
    <footer className="ck-multi__summary"><MathFormulaBlock ariaLabel="多核卷积输入输出尺寸"><MathFormulaStatic latex={String.raw`H\times W\times 3\xrightarrow{\;2\text{ 个卷积核}\;}H'\times W'\times 2`} /></MathFormulaBlock><Typography variant="body">不同卷积核学习不同的局部模式；卷积核数量决定输出通道数。</Typography><Typography variant="bodySmall" tone="muted">参数量：2 × 3 × 3 × 3 = 54</Typography></footer>
  </ContentBlock>;
}
