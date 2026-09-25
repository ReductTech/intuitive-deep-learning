import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import buildingImage from '../../assets/xiandaijianzhu.png';
import './RgbConvolutionPage.css';

const channelData = [
  { label: 'R', name: '红色通道', className: 'is-red', values: ['1', '0', '-1', '1', '0', '-1', '1', '0', '-1'] },
  { label: 'G', name: '绿色通道', className: 'is-green', values: ['0', '1', '0', '1', '-1', '1', '0', '1', '0'] },
  { label: 'B', name: '蓝色通道', className: 'is-blue', values: ['1', '1', '0', '0', '1', '0', '-1', '0', '1'] },
];

function ChannelTile({ label, name, className }: { label: string; name: string; className: string }) {
  return <div className={`ck-rgb__channel ${className}`}><div className="ck-rgb__photo"><img src={buildingImage} alt={`${name}输入`} /></div><Typography as="span" variant="bodySmall" tone="accent">{label} · {name}</Typography></div>;
}

function Kernel({ values, className }: { values: string[]; className: string }) {
  return <div className={`ck-rgb__kernel ${className}`}>{values.map((value, index) => <div key={index}><MathFormulaStatic latex={value} /></div>)}</div>;
}

function ResponseMap() {
  return <div className="ck-rgb__response-map">{Array.from({ length: 35 }, (_, index) => <span key={index} className={index === 17 || index === 18 || index === 24 ? 'is-hot' : ''} />)}</div>;
}

export function RgbConvolutionPage() {
  return <ContentBlock headingLevel={1} className="ck-rgb" title="RGB 多通道卷积" subtitle="彩色图像包含 R、G、B 三个通道；一个输出特征图会分别读取三路信息，再把响应相加。">
    <div className="ck-rgb__flow">
      <section className="ck-rgb__input-panel"><header><Typography as="h2" variant="h3" tone="accent">输入图像 X</Typography><Typography variant="bodySmall" tone="muted">一张彩色图像 = 3 个通道</Typography></header><div className="ck-rgb__channels">{channelData.map((channel) => <ChannelTile key={channel.label} {...channel} />)}</div><div className="ck-rgb__input-note"><Typography variant="bodySmall" tone="muted">每个通道都有自己的二维像素矩阵。</Typography></div></section>
      <Typography as="span" variant="h1" tone="accent" className="ck-rgb__arrow" aria-hidden="true">→</Typography>
      <section className="ck-rgb__kernel-panel"><header><Typography as="h2" variant="h3" tone="accent">三个通道核</Typography><Typography variant="bodySmall" tone="muted">每个通道各用一个 2D 卷积核</Typography></header><div className="ck-rgb__kernels">{channelData.map((channel) => <div className={`ck-rgb__kernel-row ${channel.className}`} key={channel.label}><Typography as="span" variant="bodySmall" tone="accent">W<sup>({channel.label})</sup></Typography><Kernel values={channel.values} className={channel.className} /></div>)}</div><div className="ck-rgb__kernel-note"><Typography variant="bodySmall" tone="muted">三个卷积核可以学习不同的边缘、纹理或颜色模式。</Typography></div></section>
      <Typography as="span" variant="h1" tone="accent" className="ck-rgb__arrow" aria-hidden="true">→</Typography>
      <section className="ck-rgb__output-panel"><header><Typography as="h2" variant="h3" tone="accent">输出特征图 Y</Typography><Typography variant="bodySmall" tone="muted">三路响应逐元素相加</Typography></header><div className="ck-rgb__sum"><div className="ck-rgb__sum-row"><span className="is-red">Z<sub>R</sub></span><span>+</span><span className="is-green">Z<sub>G</sub></span><span>+</span><span className="is-blue">Z<sub>B</sub></span></div><MathFormulaBlock ariaLabel="RGB 三通道响应相加公式"><MathFormulaStatic latex={String.raw`Y_{i,j}=Z_R+Z_G+Z_B`} /></MathFormulaBlock></div><ResponseMap /><div className="ck-rgb__output-note"><Typography variant="bodySmall" tone="accent">一个 RGB 卷积核 → 一张特征图</Typography><Typography variant="bodySmall" tone="muted">不把三个通道分别输出，而是在同一位置汇合。</Typography></div></section>
    </div>
    <footer className="ck-rgb__summary"><Typography as="span" variant="h3" tone="accent">3 个输入通道</Typography><Typography variant="body">每个输出位置都会同时考虑 R、G、B 的局部信息；通道维度被卷积核完整覆盖。</Typography><MathFormulaBlock ariaLabel="RGB 卷积核参数数量"><MathFormulaStatic latex={String.raw`K_hK_wC_{in}=3\times3\times3=27`} /></MathFormulaBlock></footer>
  </ContentBlock>;
}
