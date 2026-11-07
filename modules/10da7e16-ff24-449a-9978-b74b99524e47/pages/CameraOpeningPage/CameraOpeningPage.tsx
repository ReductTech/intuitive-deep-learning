import { Fragment, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, moduleAssetUrl, Typography } from '../../../shared/react';
import { channelAt, channelColors, channelNames, demosaic, SIDE, useSensorSamples } from './sensorModel';
import './CameraOpeningPage.css';

const imageUrl = moduleAssetUrl('10da7e16-ff24-449a-9978-b74b99524e47', 'images/cat-portrait.jpg');
const stages = ['世界中的光', 'Bayer 采样', '电信号', '二进制编码', 'RGB 重建', '屏幕发光'];
const titles = ['从这张头像的拍摄开始', '每个位置，先只测一种颜色', '光变成了可以测量的电信号', '8 个二进制位，怎样得到 255？', '一个数，怎样变成三个数？', '数字让屏幕重新发出光'];
const descriptions = [
  '镜头把场景中的光投到传感器上。按下快门，开始追踪这张图像的形成。',
  '滤色阵列按 R、G、G、B 重复排列。每个感光单元只记录自己滤色片对应的响应。',
  '感光单元积累电荷，读出电路将它转成电压。此时响应大小还没有被编码成整数。',
  '模数转换器把连续响应量化，再用二进制编码。二进制与十进制是同一个整数的两种写法。',
  '这个位置只测到一个通道。去马赛克借助邻近位置，估计缺少的另外两个通道。',
  '图像中的 RGB 编码控制红、绿、蓝子像素的发光。离远一点看，它们合成一个颜色。',
];
const nextLabels = ['◎ 拍一张', '读出电信号 →', '把测量值数字化 →', '重建彩色图像 →', '送到显示器 →', '↺ 再拍一次'];
const weights = [128, 64, 32, 16, 8, 4, 2, 1];

export function CameraOpeningPage() {
  const { samples, failed } = useSensorSamples(imageUrl);
  const [stage, setStage] = useState(0);
  const [unlocked, setUnlocked] = useState(0);
  const [selected, setSelected] = useState(9 * SIDE + 8);
  const [edits, setEdits] = useState<Record<number, number>>({});
  const [showSubpixels, setShowSubpixels] = useState(false);
  const ready = samples.length > 0;
  const raw = samples.map((v, i) => edits[i] ?? Math.round(v * 255));
  const rgb = ready ? demosaic(raw) : [];
  const channel = channelAt(selected);
  const value = raw[selected] ?? 0;
  const color = channelColors[channel];
  const bits = value.toString(2).padStart(8, '0');
  const pixel = rgb[selected] ?? [0, 0, 0];
  const next = () => {
    if (stage === 5) { setStage(0); setUnlocked(0); setEdits({}); setShowSubpixels(false); return; }
    setStage(stage + 1);
    setUnlocked(Math.max(unlocked, stage + 1));
  };

  return <ContentBlock className={`di-chain di-chain--stage-${stage}`} headingLevel={1} title="一张照片，怎样从世界走进屏幕？" subtitle="按下快门，跟着同一个像素走完这条链路。">
    <div className="di-chain__body">
      <nav className="di-chain__route" aria-label="成像链路">
        {stages.map((name, i) => <Fragment key={name}>
          {i > 0 && <Typography as="span" variant="body" tone="light" aria-hidden="true">→</Typography>}
          <Button active={stage === i} disabled={i > unlocked} onClick={() => setStage(i)} className="di-chain__station">
            <Typography as="span" variant="bodySmall" tone="inherit">{name}</Typography>
          </Button>
        </Fragment>)}
      </nav>
      <div className="di-chain__lesson">
        <div className={`di-chain__visual di-chain__visual--${stage}`}>
          <div className="di-chain__image-area">
            {stage === 0 ? <><img src={imageUrl} className="di-chain__photo" alt="作为拍摄示例的猫头像" /><div className="di-chain__focus" aria-hidden="true" /></> :
              <div className="di-chain__grid" aria-label={stage < 4 ? 'Bayer传感器取样网格' : '重建的图像像素'}>
                {raw.map((v, i) => {
                  const c = channelAt(i);
                  const components = stage >= 4 ? rgb[i] : [0, 0, 0].map((_, ci) => ci === c ? v : 0);
                  const background = stage === 2 || stage === 3 ? `rgb(${v},${v},${v})` : `rgb(${components.join(',')})`;
                  return <Button key={i} aria-label={`第${Math.floor(i / SIDE) + 1}行第${i % SIDE + 1}列，${channelNames[c]}通道，编码${v}`} active={selected === i} onClick={() => setSelected(i)} className="di-chain__cell" style={{ background, color: v > 150 ? '#182b4b' : 'white' }}>
                    {stage === 1 && <Typography as="span" variant="bodySmall" tone="inherit">{channelNames[c]}</Typography>}
                    {stage === 5 && showSubpixels && <span className="di-chain__subpixels" aria-hidden="true">{components.map((component, ci) => <i key={ci} style={{ background: `rgb(${[0, 0, 0].map((_, k) => k === ci ? component : 0).join(',')})` }} />)}</span>}
                  </Button>;
                })}
              </div>}
          </div>
          <Typography variant="bodySmall" tone="muted" align="center">{stage === 0 ? '自然场景 → 镜头 → 传感器' : stage === 1 ? '放大的 RGGB 阵列 · 点击一个感光位置' : stage < 4 ? '同一组测量 · 灰度表示响应大小' : stage === 4 ? '邻域插值后的彩色图像' : showSubpixels ? '放大的 RGB 条纹子像素示意' : '合成观看：屏幕上的彩色图像'}</Typography>
        </div>
        <div className="di-chain__explanation" aria-live="polite">
          <Typography as="h2" variant="h3" tone="accent">{titles[stage]}</Typography>
          <Typography variant="body" tone="muted">{descriptions[stage]}</Typography>
          <div className="di-chain__detail">
            {stage === 0 && <div className="di-chain__capture">
              <div className="di-chain__lens" aria-hidden="true"><i /></div>
              <Typography variant="body" tone="accent">场景中的光，还不是图像文件。</Typography>
            </div>}
            {stage === 1 && <><div className="di-chain__bayer-pattern">{[0, 1, 1, 2].map((c, i) => <div key={i} style={{ background: channelColors[c] }}><Typography variant="h3" tone="inherit">{channelNames[c]}</Typography></div>)}</div>
              <Typography variant="body">空间采样：连续的光分布，被有限个感光位置测量。</Typography>
              <Typography variant="bodySmall" tone="muted">每个单元在有限面积、曝光时间内积累响应，并非一个位置直接测到完整 RGB。</Typography></>}
            {stage === 2 && <><Typography variant="bodySmall" tone="muted">当前 {channelNames[channel]} 感光单元的归一化响应</Typography>
              <Typography variant="display" tone="accent">{(samples[selected] ?? 0).toFixed(3)}</Typography>
              <div className="di-chain__analog"><i style={{ width: `${(samples[selected] ?? 0) * 100}%`, background: color }} /></div>
              <div className="di-chain__range"><Typography variant="bodySmall">弱</Typography><Typography variant="bodySmall">强</Typography></div>
              <Typography variant="body">接下来，必须决定：用哪个有限的整数表示这个响应？</Typography></>}
            {stage === 3 && <><div className="di-chain__bit-row">{bits.split('').map((bit, i) => <div key={i}>
              <Button active={bit === '1'} onClick={() => setEdits({ ...edits, [selected]: value ^ weights[i] })} aria-label={`切换位权${weights[i]}的二进制位`}><Typography variant="h3" tone="inherit">{bit}</Typography></Button>
              <Typography variant="bodySmall" tone="muted" align="center">{weights[i]}</Typography>
            </div>)}</div>
              <MathFormulaBlock appearance="plain"><MathFormulaStatic latex={`${bits}_{(2)}=${value}_{(10)}`} /></MathFormulaBlock>
              <div className="di-chain__limits"><Button onClick={() => setEdits({ ...edits, [selected]: 0 })}><Typography as="span" variant="bodySmall" tone="inherit">全部置 0</Typography></Button><Button onClick={() => setEdits({ ...edits, [selected]: 255 })}><Typography as="span" variant="bodySmall" tone="inherit">全部置 1</Typography></Button></div>
              <MathFormulaBlock appearance="plain"><MathFormulaStatic latex={'2^8=256\\text{ 个等级},\\quad 0\\ldots255'} /></MathFormulaBlock>
              <Typography variant="bodySmall" tone="muted">点动二进制位，观察编码和对应感光位置的数值变化。位下方是位权。</Typography></>}
            {stage === 4 && <><Typography variant="bodySmall" tone="muted">同一位置：实测一个通道，估计另外两个</Typography>
              <div className="di-chain__rgb">{pixel.map((v, c) => <div key={c} style={{ borderColor: channelColors[c] }}><Typography variant="body" style={{ color: channelColors[c] }}>{channelNames[c]}</Typography><Typography variant="h2">{v}</Typography><Typography variant="bodySmall" tone="muted">{c === channel ? '实测' : '邻域估计'}</Typography></div>)}</div>
              <Typography variant="body">传感器的一个测量值，变成彩色像素的三个通道值。</Typography>
              <Typography variant="bodySmall" tone="muted">实际相机还会做白平衡、颜色与色调处理，再生成适合显示的编码。</Typography></>}
            {stage === 5 && <><div className="di-chain__screen-pixel">{pixel.map((v, c) => <div key={c} style={{ background: `rgb(${pixel.map((_, k) => k === c ? v : 0).join(',')})` }}><Typography variant="body" tone="inherit">{channelNames[c]}</Typography><Typography variant="h3" tone="inherit">{v}</Typography></div>)}</div>
              <div className="di-chain__combined"><i style={{ background: `rgb(${pixel.join(',')})` }} /><Typography variant="body">三个子像素 → 一个像素的颜色</Typography></div>
              <div><Button onClick={() => setShowSubpixels(value => !value)}><Typography as="span" variant="bodySmall" tone="inherit">{showSubpixels ? '退远观看' : '放大子像素'}</Typography></Button></div>
              <Typography variant="bodySmall" tone="muted">传感器用滤色片分开测量光；显示器用子像素共同呈现颜色。</Typography></>}
          </div>
        </div>
      </div>
      <footer className="di-chain__footer">
        <div><Typography variant="body" tone="accent">{stage < 3 ? '光 → 电信号 → 数字' : '光被测量成数字，数字又控制屏幕发光。'}</Typography>
          <Typography variant="bodySmall" tone="muted">教学示意：照片模拟入射光，使用 8 位量化与简化插值；实际 RAW 常采用更高位深。</Typography></div>
        <Button variant="primary" disabled={!ready} onClick={next}><Typography as="span" variant="body" tone="inherit">{failed ? '图片加载失败' : !ready ? '加载中…' : nextLabels[stage]}</Typography></Button>
      </footer>
    </div>
  </ContentBlock>;
}
